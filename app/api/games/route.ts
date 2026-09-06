import { NextResponse } from "next/server";
import { db, gameSessions, playerResults } from "@/db";
import { gameManager } from "@/lib/game-manager";
import { DEFAULT_BASKETBALL_BANK } from "@/lib/default-questions";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const sessions = await db.select().from(gameSessions).orderBy(desc(gameSessions.createdAt)).limit(10);
    const results = await db.select().from(playerResults);

    const history = sessions.map((s) => ({
      ...s,
      players: results.filter((r) => r.gameSessionId === s.id),
    }));

    return NextResponse.json({ history });
  } catch (error) {
    console.warn("API Games history fallback:", error);
    return NextResponse.json({ history: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, questionTime, randomize, customQuestions } = body;

    // Generate 6-char random alphanumeric lobby code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const questionsList = customQuestions && customQuestions.length > 0
      ? customQuestions
      : DEFAULT_BASKETBALL_BANK.questions;

    const room = gameManager.createRoom(
      code,
      title || "Kuis Bola Basket Kelas 3 SD",
      questionsList,
      questionTime || 30,
      randomize !== false
    );

    return NextResponse.json({
      success: true,
      lobbyCode: room.code,
      title: room.title,
      questionTime: room.questionTime,
      totalQuestions: room.totalQuestions,
    });
  } catch (error) {
    console.error("Error creating game lobby:", error);
    return NextResponse.json({ error: "Gagal membuat sesi game" }, { status: 500 });
  }
}
