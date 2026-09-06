import { NextResponse } from "next/server";
import { db, questionBanks, questions } from "@/db";
import { DEFAULT_BASKETBALL_BANK } from "@/lib/default-questions";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const banks = await db.select().from(questionBanks).orderBy(desc(questionBanks.createdAt));

    if (banks.length === 0) {
      // Return default bank format
      return NextResponse.json({
        banks: [
          {
            id: "default-bank",
            title: DEFAULT_BASKETBALL_BANK.title,
            description: DEFAULT_BASKETBALL_BANK.description,
            questionsCount: DEFAULT_BASKETBALL_BANK.questions.length,
            questions: DEFAULT_BASKETBALL_BANK.questions,
          },
        ],
      });
    }

    // Load with questions
    const allQuestions = await db.select().from(questions);
    const formatted = banks.map((b) => ({
      ...b,
      questions: allQuestions.filter((q) => q.bankId === b.id),
      questionsCount: allQuestions.filter((q) => q.bankId === b.id).length,
    }));

    return NextResponse.json({ banks: formatted });
  } catch (error) {
    console.warn("API Questions fallback to default memory bank:", error);
    return NextResponse.json({
      banks: [
        {
          id: "default-bank",
          title: DEFAULT_BASKETBALL_BANK.title,
          description: DEFAULT_BASKETBALL_BANK.description,
          questionsCount: DEFAULT_BASKETBALL_BANK.questions.length,
          questions: DEFAULT_BASKETBALL_BANK.questions,
        },
      ],
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bankId, text, optionA, optionB, optionC, optionD, correctAnswer } = body;

    if (!text || !optionA || !optionB || !optionC || !correctAnswer) {
      return NextResponse.json({ error: "Data pertanyaan tidak lengkap!" }, { status: 400 });
    }

    let targetBankId = bankId;
    if (!targetBankId || targetBankId === "default-bank") {
      const [newBank] = await db
        .insert(questionBanks)
        .values({
          title: "Bank Soal Kustom",
          description: "Bank soal buatan admin",
        })
        .returning();
      targetBankId = newBank.id;
    }

    const [newQuestion] = await db
      .insert(questions)
      .values({
        bankId: targetBankId,
        text,
        optionA,
        optionB,
        optionC,
        optionD: optionD || null,
        correctAnswer: correctAnswer.toLowerCase(),
      })
      .returning();

    return NextResponse.json({ success: true, question: newQuestion });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json({ error: "Gagal menyimpan pertanyaan ke database" }, { status: 500 });
  }
}
