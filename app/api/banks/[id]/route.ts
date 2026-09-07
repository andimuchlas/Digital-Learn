import { NextResponse } from "next/server";
import { db, questionBanks, questions } from "@/db";
import { DEFAULT_BASKETBALL_BANK } from "@/lib/default-questions";
import { eq, asc } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (id === "default-bank") {
      return NextResponse.json({
        success: true,
        bank: {
          id: "default-bank",
          title: DEFAULT_BASKETBALL_BANK.title,
          description: DEFAULT_BASKETBALL_BANK.description,
          questionsCount: DEFAULT_BASKETBALL_BANK.questions.length,
          questions: DEFAULT_BASKETBALL_BANK.questions.map((q, idx) => ({
            id: `seed-${idx + 1}`,
            bankId: "default-bank",
            ...q,
          })),
        },
      });
    }

    const [bank] = await db
      .select()
      .from(questionBanks)
      .where(eq(questionBanks.id, id))
      .limit(1);

    if (!bank) {
      return NextResponse.json(
        { success: false, error: "Bank soal tidak ditemukan" },
        { status: 404 }
      );
    }

    const bankQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.bankId, id))
      .orderBy(asc(questions.orderIndex), asc(questions.createdAt));

    return NextResponse.json({
      success: true,
      bank: {
        ...bank,
        questionsCount: bankQuestions.length,
        questions: bankQuestions,
      },
    });
  } catch (error) {
    console.error("Error fetching question bank:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data bank soal" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, description } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Judul bank soal tidak boleh kosong" },
        { status: 400 }
      );
    }

    const [updatedBank] = await db
      .update(questionBanks)
      .set({
        title: title.trim(),
        description: description !== undefined ? (description ? description.trim() : null) : undefined,
      })
      .where(eq(questionBanks.id, id))
      .returning();

    if (!updatedBank) {
      return NextResponse.json(
        { success: false, error: "Bank soal tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      bank: updatedBank,
    });
  } catch (error) {
    console.error("Error updating question bank:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui bank soal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (id === "default-bank") {
      return NextResponse.json(
        { success: false, error: "Bank soal bawaan tidak dapat dihapus" },
        { status: 400 }
      );
    }

    // Delete questions explicitly if cascade isn't activated in all DB setups
    await db.delete(questions).where(eq(questions.bankId, id));
    await db.delete(questionBanks).where(eq(questionBanks.id, id));

    return NextResponse.json({
      success: true,
      message: "Bank soal beserta seluruh pertanyaannya berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting question bank:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus bank soal" },
      { status: 500 }
    );
  }
}
