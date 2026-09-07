import { NextResponse } from "next/server";
import { db, questionBanks, questions } from "@/db";
import { DEFAULT_BASKETBALL_BANK } from "@/lib/default-questions";
import { eq, desc, asc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bankId = searchParams.get("bankId");

    if (bankId) {
      if (bankId === "default-bank") {
        return NextResponse.json({
          bank: {
            id: "default-bank",
            title: DEFAULT_BASKETBALL_BANK.title,
            description: DEFAULT_BASKETBALL_BANK.description,
            questionsCount: DEFAULT_BASKETBALL_BANK.questions.length,
            questions: DEFAULT_BASKETBALL_BANK.questions,
          },
          questions: DEFAULT_BASKETBALL_BANK.questions,
        });
      }

      const [bank] = await db
        .select()
        .from(questionBanks)
        .where(eq(questionBanks.id, bankId))
        .limit(1);

      if (!bank) {
        return NextResponse.json({ error: "Bank soal tidak ditemukan" }, { status: 404 });
      }

      const bankQuestions = await db
        .select()
        .from(questions)
        .where(eq(questions.bankId, bankId))
        .orderBy(asc(questions.orderIndex), asc(questions.createdAt));

      return NextResponse.json({
        bank: {
          ...bank,
          questionsCount: bankQuestions.length,
          questions: bankQuestions,
        },
        questions: bankQuestions,
      });
    }

    const banks = await db.select().from(questionBanks).orderBy(desc(questionBanks.createdAt));

    if (banks.length === 0) {
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
    const allQuestions = await db
      .select()
      .from(questions)
      .orderBy(asc(questions.orderIndex), asc(questions.createdAt));

    const formatted = banks.map((b) => {
      const bQuestions = allQuestions.filter((q) => q.bankId === b.id);
      return {
        ...b,
        questions: bQuestions,
        questionsCount: bQuestions.length,
      };
    });

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
    const { bankId, text, optionA, optionB, optionC, optionD, correctAnswer, orderIndex } = body;

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

    let calculatedOrder = orderIndex;
    if (calculatedOrder === undefined) {
      const countResult = await db
        .select()
        .from(questions)
        .where(eq(questions.bankId, targetBankId));
      calculatedOrder = countResult.length + 1;
    }

    const [newQuestion] = await db
      .insert(questions)
      .values({
        bankId: targetBankId,
        text: text.trim(),
        optionA: optionA.trim(),
        optionB: optionB.trim(),
        optionC: optionC.trim(),
        optionD: optionD ? optionD.trim() : null,
        correctAnswer: correctAnswer.toLowerCase().trim(),
        orderIndex: calculatedOrder,
      })
      .returning();

    return NextResponse.json({ success: true, question: newQuestion });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json({ error: "Gagal menyimpan pertanyaan ke database" }, { status: 500 });
  }
}
