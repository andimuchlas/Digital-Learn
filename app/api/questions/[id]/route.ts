import { NextResponse } from "next/server";
import { db, questions } from "@/db";
import { eq } from "drizzle-orm";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { text, optionA, optionB, optionC, optionD, correctAnswer, orderIndex } = body;

    if (!text || !optionA || !optionB || !optionC || !correctAnswer) {
      return NextResponse.json(
        { success: false, error: "Semua kolom pertanyaan dan opsi wajib diisi" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(questions)
      .set({
        text: text.trim(),
        optionA: optionA.trim(),
        optionB: optionB.trim(),
        optionC: optionC.trim(),
        optionD: optionD ? optionD.trim() : null,
        correctAnswer: correctAnswer.toLowerCase().trim(),
        orderIndex: orderIndex !== undefined ? orderIndex : undefined,
      })
      .where(eq(questions.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Pertanyaan tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      question: updated,
    });
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui pertanyaan" },
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

    const [deleted] = await db
      .delete(questions)
      .where(eq(questions.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Pertanyaan berhasil dihapus",
      question: deleted,
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus pertanyaan" },
      { status: 500 }
    );
  }
}
