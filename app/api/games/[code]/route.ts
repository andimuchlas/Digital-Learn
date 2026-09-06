import { NextResponse } from "next/server";
import { db, gameSessions, questions, questionBanks } from "@/db";
import { eq, desc } from "drizzle-orm";
import { DEFAULT_BASKETBALL_BANK } from "@/lib/default-questions";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const upperCode = (code || "").toUpperCase().trim();

    const [session] = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.code, upperCode))
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Lobby tidak ditemukan" },
        { status: 404 }
      );
    }

    let qList: any[] = [];
    if (session.bankId) {
      const bankQuestions = await db
        .select()
        .from(questions)
        .where(eq(questions.bankId, session.bankId))
        .orderBy(questions.orderIndex);

      if (bankQuestions && bankQuestions.length > 0) {
        qList = bankQuestions.map((q) => ({
          orderIndex: q.orderIndex,
          text: q.text,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD || undefined,
          correctAnswer: q.correctAnswer,
        }));
      }
    }

    // Fallback only if no questions found in the selected bank
    if (qList.length === 0) {
      const allQ = await db.select().from(questions).limit(25);
      if (allQ && allQ.length > 0) {
        qList = allQ.map((q) => ({
          orderIndex: q.orderIndex,
          text: q.text,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD || undefined,
          correctAnswer: q.correctAnswer,
        }));
      } else {
        qList = [...DEFAULT_BASKETBALL_BANK.questions];
      }
    }

    return NextResponse.json({
      success: true,
      session,
      questions: qList,
    });
  } catch (error) {
    console.error("Error fetching game session:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data sesi kuis" },
      { status: 500 }
    );
  }
}
