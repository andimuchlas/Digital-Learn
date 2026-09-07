import { NextResponse } from "next/server";
import { db, questionBanks, questions } from "@/db";
import { DEFAULT_BASKETBALL_BANK } from "@/lib/default-questions";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const banks = await db.select().from(questionBanks).orderBy(desc(questionBanks.createdAt));

    if (banks.length === 0) {
      return NextResponse.json({
        banks: [
          {
            id: "default-bank",
            title: DEFAULT_BASKETBALL_BANK.title,
            description: DEFAULT_BASKETBALL_BANK.description,
            questionsCount: DEFAULT_BASKETBALL_BANK.questions.length,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    const allQuestions = await db.select().from(questions);
    const formatted = banks.map((b) => ({
      ...b,
      questionsCount: allQuestions.filter((q) => q.bankId === b.id).length,
    }));

    return NextResponse.json({ banks: formatted });
  } catch (error) {
    console.warn("API Banks fallback to default memory bank:", error);
    return NextResponse.json({
      banks: [
        {
          id: "default-bank",
          title: DEFAULT_BASKETBALL_BANK.title,
          description: DEFAULT_BASKETBALL_BANK.description,
          questionsCount: DEFAULT_BASKETBALL_BANK.questions.length,
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Judul modul bank soal tidak boleh kosong!" },
        { status: 400 }
      );
    }

    const [newBank] = await db
      .insert(questionBanks)
      .values({
        title: title.trim(),
        description: description ? description.trim() : null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      bank: {
        ...newBank,
        questionsCount: 0,
        questions: [],
      },
    });
  } catch (error) {
    console.error("Error creating question bank:", error);
    return NextResponse.json(
      { error: "Gagal membuat modul bank soal ke database" },
      { status: 500 }
    );
  }
}
