import { NextResponse } from "next/server";
import { db, gameSessions, playerResults, questions } from "@/db";
import { gameManager } from "@/lib/game-manager";
import { DEFAULT_BASKETBALL_BANK } from "@/lib/default-questions";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const sessions = await db
      .select()
      .from(gameSessions)
      .orderBy(desc(gameSessions.createdAt))
      .limit(20);
    const results = await db.select().from(playerResults);

    const history = sessions.map((s) => {
      const room = gameManager.getRoom(s.code);
      const sessionPlayers = results.filter((r) => r.gameSessionId === s.id);

      // Determine accurate status
      let effectiveStatus = s.status;
      if (room?.status === "FINISHED" || s.status === "FINISHED") {
        effectiveStatus = "FINISHED";
      } else if (room?.status) {
        effectiveStatus = room.status;
      }

      const playersList =
        sessionPlayers.length > 0
          ? sessionPlayers
          : room
          ? Object.values(room.players).map((p) => ({
              id: p.id,
              playerName: p.name,
              playerClass: p.playerClass,
              finalTile: p.tile,
              correctAnswers: p.correctAnswers,
            }))
          : [];

      return {
        ...s,
        status: effectiveStatus,
        players: playersList,
      };
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.warn("API Games history fallback:", error);
    return NextResponse.json({ history: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, questionTime, randomize, customQuestions, bankId } = body;

    // Generate 6-char random alphanumeric lobby code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    let questionsList = customQuestions && customQuestions.length > 0 ? customQuestions : [];

    // If bankId provided and no customQuestions, load questions from database
    if (questionsList.length === 0 && bankId) {
      try {
        const dbQuestions = await db
          .select()
          .from(questions)
          .where(eq(questions.bankId, bankId))
          .orderBy(questions.orderIndex);

        if (dbQuestions && dbQuestions.length > 0) {
          questionsList = dbQuestions.map((q) => ({
            orderIndex: q.orderIndex,
            text: q.text,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD || undefined,
            correctAnswer: q.correctAnswer,
          }));
        }
      } catch (dbErr) {
        console.warn("Could not load questions from bankId:", dbErr);
      }
    }

    // Fallback if no questions specified
    if (questionsList.length === 0) {
      questionsList = [...DEFAULT_BASKETBALL_BANK.questions];
    }

    const sessionTitle = title?.trim() || "Kuis Interaktif";
    const qTime = questionTime || 20;

    // Persist to PostgreSQL database
    try {
      await db.insert(gameSessions).values({
        code,
        title: sessionTitle,
        bankId: bankId || null,
        status: "LOBBY",
        questionTime: qTime,
        totalQuestions: questionsList.length,
      });
    } catch (dbInsertErr) {
      console.warn("DB insert game_sessions notice:", dbInsertErr);
    }

    // Also register in local memory if in same process
    const room = gameManager.createRoom(
      code,
      sessionTitle,
      questionsList,
      qTime,
      randomize !== false
    );

    return NextResponse.json({
      success: true,
      lobbyCode: room.code,
      title: room.title,
      questionTime: room.questionTime,
      totalQuestions: room.totalQuestions,
      questions: room.questions,
    });
  } catch (error) {
    console.error("Error creating game lobby:", error);
    return NextResponse.json({ error: "Gagal membuat sesi game" }, { status: 500 });
  }
}
