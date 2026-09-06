import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { gameManager, GameRoom } from "./lib/game-manager";
import { db, gameSessions, questions } from "./db";
import { eq } from "drizzle-orm";
import { DEFAULT_BASKETBALL_BANK } from "./lib/default-questions";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const hostname = "0.0.0.0";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function ensureRoom(code: string): Promise<GameRoom | undefined> {
  if (!code) return undefined;
  const upperCode = code.toUpperCase().trim();
  let room = gameManager.getRoom(upperCode);
  if (room) return room;

  try {
    const [session] = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.code, upperCode))
      .limit(1);

    if (session && session.status !== "FINISHED") {
      let qList: any[] = [];
      if (session.bankId) {
        const dbQuestions = await db
          .select()
          .from(questions)
          .where(eq(questions.bankId, session.bankId))
          .orderBy(questions.orderIndex);

        if (dbQuestions && dbQuestions.length > 0) {
          qList = dbQuestions.map((q) => ({
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

      room = gameManager.createRoom(
        upperCode,
        session.title || "Kuis Interaktif",
        qList,
        session.questionTime || 20
      );
      return room;
    }
  } catch (err) {
    console.warn("DB lookup error for room", upperCode, err);
  }

  return undefined;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/api/socket",
  });

  io.on("connection", (socket) => {
    // Admin creates or rejoins lobby room
    socket.on("admin:create_lobby", ({ code, title, questions, questionTime, randomize }, callback) => {
      const room = gameManager.createRoom(code, title, questions, questionTime, randomize);
      socket.join(room.code);
      gameManager.registerAdmin(room.code, socket.id);
      if (callback) callback({ success: true, room: gameManager.getRoomPublicState(room.code) });
    });

    socket.on("admin:join_lobby", async ({ code }, callback) => {
      const room = await ensureRoom(code);
      if (!room) {
        if (callback) callback({ error: "Lobby kuis tidak ditemukan!" });
        return;
      }
      socket.join(room.code);
      gameManager.registerAdmin(room.code, socket.id);
      if (callback) {
        callback({
          success: true,
          room: gameManager.getGameState(room.code, true),
          allQuestions: room.questions,
        });
      }
    });

    // Admin starts the game
    socket.on("admin:start_game", ({ code }) => {
      gameManager.startGame(code, io);
    });

    // Admin restarts the game from Question 1
    socket.on("admin:restart_game", ({ code }) => {
      gameManager.startGame(code, io);
    });

    // Admin pauses the game
    socket.on("admin:pause_game", ({ code }) => {
      gameManager.pauseGame(code, io);
    });

    // Admin resumes the game
    socket.on("admin:resume_game", ({ code }) => {
      gameManager.resumeGame(code, io);
    });

    // Admin skips question
    socket.on("admin:skip_question", ({ code }) => {
      gameManager.skipQuestion(code, io);
    });

    // Admin ends game manually
    socket.on("admin:end_game", ({ code }) => {
      gameManager.finishGame(code, io);
    });

    // Player joins / reconnects to lobby
    socket.on("player:join_lobby", async ({ code, name, playerClass, avatar, playerId }, callback) => {
      await ensureRoom(code);
      const result = gameManager.joinPlayer(code, name, playerClass, socket.id, avatar, playerId);
      if ("error" in result) {
        if (callback) callback({ error: result.error });
        return;
      }

      socket.join(result.room.code);

      // Notify the player
      if (callback) {
        callback({
          success: true,
          player: result.player,
          room: gameManager.getGameState(result.room.code, false),
        });
      }

      // Notify the whole room
      io.to(result.room.code).emit("lobby:player_joined", {
        player: result.player,
        totalPlayers: Object.values(result.room.players).filter((p) => p.isOnline).length,
        players: Object.values(result.room.players),
      });
    });

    // Player connects/reconnects on game page
    socket.on("player:join_game", async ({ code, playerId, name }, callback) => {
      const room = await ensureRoom(code);
      if (!room) {
        if (callback) callback({ error: "Lobby kuis tidak ditemukan!" });
        return;
      }

      socket.join(room.code);

      let player = playerId ? room.players[playerId] : null;
      if (!player && name) {
        player =
          Object.values(room.players).find(
            (p) => p.name.toLowerCase() === name.trim().toLowerCase()
          ) || null;
      }

      if (player) {
        player.socketId = socket.id;
        player.isOnline = true;
      }

      const gameState = gameManager.getGameState(room.code, false);

      if (callback) {
        callback({
          success: true,
          player: player || null,
          room: gameState,
        });
      }

      io.to(room.code).emit("lobby:player_joined", {
        player,
        totalPlayers: Object.values(room.players).filter((p) => p.isOnline).length,
        players: Object.values(room.players),
      });
    });

    // Player submits answer
    socket.on("player:submit_answer", ({ code, playerId, questionIndex, answer }, callback) => {
      const res = gameManager.submitAnswer(code, playerId, questionIndex, answer, io);
      if (callback) callback(res);
    });

    // Client requests current room state
    socket.on("room:get_state", async ({ code }, callback) => {
      const room = await ensureRoom(code);
      if (!room) {
        if (callback) callback({ error: "Lobby kuis tidak ditemukan!" });
        return;
      }
      socket.join(room.code);
      if (callback) {
        callback({
          success: true,
          room: gameManager.getGameState(code, false),
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      gameManager.disconnectSocket(socket.id, io);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> 🚀 Ready on http://${hostname}:${port}`);
  });
});
