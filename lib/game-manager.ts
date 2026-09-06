import { RawQuestion, DEFAULT_BASKETBALL_BANK } from "./default-questions";
import { Server as SocketIOServer } from "socket.io";
import { db, gameSessions, playerResults } from "../db";

export interface Player {
  id: string;
  name: string;
  playerClass: string;
  avatar?: string;
  socketId: string;
  tile: number; // 1 to 25
  correctAnswers: number;
  wrongAnswers: number;
  currentAnswer: "a" | "b" | "c" | "d" | null;
  answeredAt: number | null;
  isOnline: boolean;
}

export type RoomStatus = "LOBBY" | "EXPLANATION" | "RUNNING" | "INTERMISSION" | "PAUSED" | "FINISHED";

export interface GameRoom {
  code: string;
  title: string;
  status: RoomStatus;
  questionTime: number;
  totalQuestions: number;
  currentQuestionIndex: number;
  questions: RawQuestion[];
  players: Record<string, Player>; // Keyed by playerId
  adminSocketId: string | null;
  currentQuestionStartedAt: number | null;
  currentQuestionEndsAt: number | null;
  pausedRemainingTime: number | null;
  explanationRemainingSeconds: number | null;
  timerInterval: NodeJS.Timeout | null;
  createdAt: number;
}

class GameManager {
  private rooms: Map<string, GameRoom> = new Map();

  constructor() {
    // Initialize a default room for quick testing
    this.createRoom("DEMO25", "Kuis Bola Basket SD Kelas 3", DEFAULT_BASKETBALL_BANK.questions, 20);
  }

  public getRoom(code: string): GameRoom | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  public createRoom(
    code: string,
    title: string,
    customQuestions?: RawQuestion[],
    questionTime: number = 30,
    randomize: boolean = true
  ): GameRoom {
    const upperCode = code.toUpperCase();

    // Clear existing timer if room exists
    const existing = this.rooms.get(upperCode);
    if (existing && existing.timerInterval) {
      clearInterval(existing.timerInterval);
    }

    let qList = customQuestions && customQuestions.length > 0
      ? [...customQuestions]
      : [...DEFAULT_BASKETBALL_BANK.questions];

    if (randomize) {
      qList = qList.sort(() => Math.random() - 0.5);
    }

    // Limit to 25 questions or available questions
    const finalQuestions = qList.slice(0, 25).map((q, idx) => ({
      ...q,
      orderIndex: idx + 1,
    }));

    const room: GameRoom = {
      code: upperCode,
      title: title || "Kuis Interaktif",
      status: "LOBBY",
      questionTime,
      totalQuestions: finalQuestions.length,
      currentQuestionIndex: 0,
      questions: finalQuestions,
      players: {},
      adminSocketId: null,
      currentQuestionStartedAt: null,
      currentQuestionEndsAt: null,
      pausedRemainingTime: null,
      explanationRemainingSeconds: null,
      timerInterval: null,
      createdAt: Date.now(),
    };

    this.rooms.set(upperCode, room);
    return room;
  }

  public registerAdmin(code: string, socketId: string): GameRoom | null {
    const room = this.getRoom(code);
    if (!room) return null;
    room.adminSocketId = socketId;
    return room;
  }

  public joinPlayer(
    code: string,
    name: string,
    playerClass: string,
    socketId: string,
    avatar?: string
  ): { player: Player; room: GameRoom } | { error: string } {
    const room = this.getRoom(code);
    if (!room) {
      return { error: "Lobby kuis tidak ditemukan!" };
    }

    if (room.status !== "LOBBY" && room.status !== "EXPLANATION") {
      // Check if rejoining existing player
      const existingPlayer = Object.values(room.players).find(
        (p) => p.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (existingPlayer) {
        existingPlayer.socketId = socketId;
        existingPlayer.isOnline = true;
        if (avatar) existingPlayer.avatar = avatar;
        return { player: existingPlayer, room };
      }
      return { error: "Permainan sudah dimulai. Anda tidak dapat bergabung ke sesi ini." };
    }

    const trimmedName = name.trim();
    const trimmedClass = playerClass.trim();

    // Check if name already taken by an active player
    const nameTaken = Object.values(room.players).some(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase() && p.isOnline
    );
    if (nameTaken) {
      return { error: `Nama "${trimmedName}" sudah digunakan di lobby ini. Silakan gunakan nama lain.` };
    }

    // Create or reconnect player
    const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const player: Player = {
      id: playerId,
      name: trimmedName,
      playerClass: trimmedClass,
      avatar: avatar || "🏀",
      socketId,
      tile: 1,
      correctAnswers: 0,
      wrongAnswers: 0,
      currentAnswer: null,
      answeredAt: null,
      isOnline: true,
    };

    room.players[playerId] = player;
    return { player, room };
  }

  public disconnectSocket(socketId: string, io: SocketIOServer) {
    for (const [code, room] of this.rooms.entries()) {
      if (room.adminSocketId === socketId) {
        // Admin disconnected - we could pause or notify
        io.to(code).emit("game:admin_status", { isOnline: false });
      }

      for (const player of Object.values(room.players)) {
        if (player.socketId === socketId) {
          player.isOnline = false;
          io.to(code).emit("lobby:player_left", {
            playerId: player.id,
            playerName: player.name,
            totalPlayers: Object.values(room.players).filter((p) => p.isOnline).length,
            players: Object.values(room.players),
          });
        }
      }
    }
  }

  public startGame(code: string, io: SocketIOServer) {
    const room = this.getRoom(code);
    if (!room) return;

    room.status = "EXPLANATION";
    room.currentQuestionIndex = 0;
    room.explanationRemainingSeconds = 5;

    // Reset all player scores & positions
    for (const player of Object.values(room.players)) {
      player.tile = 1;
      player.correctAnswers = 0;
      player.wrongAnswers = 0;
      player.currentAnswer = null;
      player.answeredAt = null;
    }

    io.to(code).emit("game:explanation_started", {
      duration: 5,
      totalQuestions: room.totalQuestions,
      title: room.title,
    });

    if (room.timerInterval) clearInterval(room.timerInterval);

    room.timerInterval = setInterval(() => {
      if (room.status !== "EXPLANATION") {
        if (room.timerInterval) clearInterval(room.timerInterval);
        return;
      }
      room.explanationRemainingSeconds = (room.explanationRemainingSeconds || 5) - 1;
      io.to(code).emit("game:explanation_tick", {
        remainingSeconds: Math.max(0, room.explanationRemainingSeconds),
      });

      if (room.explanationRemainingSeconds <= 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        room.explanationRemainingSeconds = null;
        this.startQuestion(code, 0, io);
      }
    }, 1000);
  }

  public startQuestion(code: string, questionIndex: number, io: SocketIOServer) {
    const room = this.getRoom(code);
    if (!room) return;

    room.explanationRemainingSeconds = null;

    if (questionIndex >= room.questions.length) {
      this.finishGame(code, io);
      return;
    }

    room.status = "RUNNING";
    room.currentQuestionIndex = questionIndex;
    const currentQ = room.questions[questionIndex];

    // Reset current answers for this question
    for (const player of Object.values(room.players)) {
      player.currentAnswer = null;
      player.answeredAt = null;
    }

    const now = Date.now();
    const durationMs = room.questionTime * 1000;
    room.currentQuestionStartedAt = now;
    room.currentQuestionEndsAt = now + durationMs;
    room.pausedRemainingTime = null;

    if (room.timerInterval) clearInterval(room.timerInterval);

    // Broadcast to room (ANTI-CHEAT: DO NOT SEND correctAnswer!)
    io.to(code).emit("game:question_started", {
      questionNumber: questionIndex + 1,
      totalQuestions: room.totalQuestions,
      questionIndex,
      text: currentQ.text,
      optionA: currentQ.optionA,
      optionB: currentQ.optionB,
      optionC: currentQ.optionC,
      optionD: currentQ.optionD || null,
      duration: room.questionTime,
      startedAt: room.currentQuestionStartedAt,
      endsAt: room.currentQuestionEndsAt,
    });

    // Start server authoritative countdown tick
    let remainingSeconds = room.questionTime;
    room.timerInterval = setInterval(() => {
      if (room.status !== "RUNNING") return;

      remainingSeconds--;
      io.to(code).emit("game:timer_tick", {
        remainingSeconds: Math.max(0, remainingSeconds),
        totalSeconds: room.questionTime,
      });

      if (remainingSeconds <= 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        this.endQuestion(code, io);
      }
    }, 1000);
  }

  public submitAnswer(
    code: string,
    playerId: string,
    questionIndex: number,
    answer: "a" | "b" | "c" | "d",
    io: SocketIOServer
  ): { success: boolean; message?: string } {
    const room = this.getRoom(code);
    if (!room) return { success: false, message: "Lobby tidak ditemukan" };
    if (room.status !== "RUNNING") return { success: false, message: "Soal tidak sedang aktif" };
    if (room.currentQuestionIndex !== questionIndex) {
      return { success: false, message: "Soal sudah kedaluwarsa" };
    }

    const player = room.players[playerId];
    if (!player) return { success: false, message: "Pemain tidak terdaftar" };

    if (player.currentAnswer !== null) {
      return { success: false, message: "Jawaban sudah terkunci!" };
    }

    player.currentAnswer = answer;
    player.answeredAt = Date.now();

    // Count how many online players have answered
    const onlinePlayers = Object.values(room.players).filter((p) => p.isOnline);
    const answeredCount = onlinePlayers.filter((p) => p.currentAnswer !== null).length;

    // Broadcast updated answered progress (e.g. 5/8 players answered)
    io.to(code).emit("game:answered_update", {
      answeredCount,
      totalOnlinePlayers: onlinePlayers.length,
    });

    // Acknowledge answer lock to player
    io.to(player.socketId).emit("game:answer_locked", {
      answer,
      questionIndex,
    });

    // If all online players answered, end question after a brief delay
    if (answeredCount >= onlinePlayers.length && onlinePlayers.length > 0) {
      setTimeout(() => {
        if (room.status === "RUNNING" && room.currentQuestionIndex === questionIndex) {
          if (room.timerInterval) clearInterval(room.timerInterval);
          this.endQuestion(code, io);
        }
      }, 1000);
    }

    return { success: true };
  }

  public endQuestion(code: string, io: SocketIOServer) {
    const room = this.getRoom(code);
    if (!room) return;

    if (room.timerInterval) clearInterval(room.timerInterval);
    room.status = "INTERMISSION";

    const currentQ = room.questions[room.currentQuestionIndex];
    const correctAns = currentQ.correctAnswer.toLowerCase() as "a" | "b" | "c" | "d";

    const playerResultsList = Object.values(room.players).map((player) => {
      const isCorrect = player.currentAnswer === correctAns;
      const previousTile = player.tile;

      if (isCorrect) {
        player.tile = Math.min(25, player.tile + 1);
        player.correctAnswers++;
      } else {
        player.wrongAnswers++;
      }

      return {
        playerId: player.id,
        playerName: player.name,
        playerClass: player.playerClass,
        answer: player.currentAnswer,
        isCorrect,
        previousTile,
        newTile: player.tile,
        correctAnswers: player.correctAnswers,
      };
    });

    // Leaderboard ranking
    const leaderboard = Object.values(room.players)
      .sort((a, b) => {
        if (b.tile !== a.tile) return b.tile - a.tile;
        return b.correctAnswers - a.correctAnswers;
      })
      .map((p, index) => ({
        rank: index + 1,
        id: p.id,
        name: p.name,
        playerClass: p.playerClass,
        tile: p.tile,
        correctAnswers: p.correctAnswers,
      }));

    // Broadcast question evaluation & results
    io.to(code).emit("game:question_result", {
      questionNumber: room.currentQuestionIndex + 1,
      totalQuestions: room.totalQuestions,
      correctAnswer: correctAns,
      playerResults: playerResultsList,
      leaderboard,
      intermissionDuration: 4, // 4 seconds intermission
    });

    // After intermission, proceed to next question or finish
    setTimeout(() => {
      if (room.status === "INTERMISSION") {
        const nextIndex = room.currentQuestionIndex + 1;
        if (nextIndex < room.totalQuestions) {
          this.startQuestion(code, nextIndex, io);
        } else {
          this.finishGame(code, io);
        }
      }
    }, 4000);
  }

  public pauseGame(code: string, io: SocketIOServer) {
    const room = this.getRoom(code);
    if (!room || room.status !== "RUNNING") return;

    if (room.timerInterval) clearInterval(room.timerInterval);
    const now = Date.now();
    const remainingMs = Math.max(0, (room.currentQuestionEndsAt || now) - now);
    room.pausedRemainingTime = remainingMs;
    room.status = "PAUSED";

    io.to(code).emit("game:paused", {
      remainingSeconds: Math.ceil(remainingMs / 1000),
    });
  }

  public resumeGame(code: string, io: SocketIOServer) {
    const room = this.getRoom(code);
    if (!room || room.status !== "PAUSED") return;

    room.status = "RUNNING";
    const remainingMs = room.pausedRemainingTime || room.questionTime * 1000;
    const now = Date.now();
    room.currentQuestionStartedAt = now;
    room.currentQuestionEndsAt = now + remainingMs;
    room.pausedRemainingTime = null;

    io.to(code).emit("game:resumed", {
      remainingSeconds: Math.ceil(remainingMs / 1000),
    });

    let remainingSeconds = Math.ceil(remainingMs / 1000);
    room.timerInterval = setInterval(() => {
      if (room.status !== "RUNNING") return;

      remainingSeconds--;
      io.to(code).emit("game:timer_tick", {
        remainingSeconds: Math.max(0, remainingSeconds),
        totalSeconds: room.questionTime,
      });

      if (remainingSeconds <= 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        this.endQuestion(code, io);
      }
    }, 1000);
  }

  public skipQuestion(code: string, io: SocketIOServer) {
    const room = this.getRoom(code);
    if (!room) return;
    if (room.timerInterval) clearInterval(room.timerInterval);
    this.endQuestion(code, io);
  }

  public async finishGame(code: string, io: SocketIOServer) {
    const room = this.getRoom(code);
    if (!room) return;

    if (room.timerInterval) clearInterval(room.timerInterval);
    room.status = "FINISHED";

    const finalLeaderboard = Object.values(room.players)
      .sort((a, b) => {
        if (b.tile !== a.tile) return b.tile - a.tile;
        return b.correctAnswers - a.correctAnswers;
      })
      .map((p, index) => ({
        rank: index + 1,
        id: p.id,
        name: p.name,
        playerClass: p.playerClass,
        finalTile: p.tile,
        correctAnswers: p.correctAnswers,
        totalQuestions: room.totalQuestions,
      }));

    io.to(code).emit("game:finished", {
      title: room.title,
      totalQuestions: room.totalQuestions,
      finalLeaderboard,
    });

    // Asynchronously save to Supabase Database via Drizzle if connected
    try {
      const [session] = await db
        .insert(gameSessions)
        .values({
          code: room.code,
          title: room.title,
          status: "FINISHED",
          questionTime: room.questionTime,
          totalQuestions: room.totalQuestions,
          finishedAt: new Date(),
        })
        .returning();

      if (session) {
        const results = finalLeaderboard.map((r) => ({
          gameSessionId: session.id,
          playerName: r.name,
          playerClass: r.playerClass,
          finalTile: r.finalTile,
          correctAnswers: r.correctAnswers,
          totalQuestions: r.totalQuestions,
          rank: r.rank,
        }));

        if (results.length > 0) {
          await db.insert(playerResults).values(results);
        }
        console.log(`💾 Saved game results for lobby ${room.code} to Supabase`);
      }
    } catch (e) {
      console.warn("⚠️ Could not persist game to Supabase DB (running in-memory):", e);
    }
  }

  public getRoomPublicState(code: string) {
    const room = this.getRoom(code);
    if (!room) return null;

    return {
      code: room.code,
      title: room.title,
      status: room.status,
      questionTime: room.questionTime,
      totalQuestions: room.totalQuestions,
      currentQuestionIndex: room.currentQuestionIndex,
      players: Object.values(room.players).map((p) => ({
        id: p.id,
        name: p.name,
        playerClass: p.playerClass,
        tile: p.tile,
        correctAnswers: p.correctAnswers,
        isOnline: p.isOnline,
      })),
    };
  }

  public getGameState(code: string, isAdmin: boolean = false) {
    const room = this.getRoom(code);
    if (!room) return null;

    let currentQuestionData = null;
    if (
      (room.status === "RUNNING" || room.status === "PAUSED" || room.status === "INTERMISSION") &&
      room.currentQuestionIndex >= 0 &&
      room.currentQuestionIndex < room.questions.length
    ) {
      const q = room.questions[room.currentQuestionIndex];
      currentQuestionData = {
        questionNumber: room.currentQuestionIndex + 1,
        totalQuestions: room.totalQuestions,
        questionIndex: room.currentQuestionIndex,
        text: q.text,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD || null,
        duration: room.questionTime,
        startedAt: room.currentQuestionStartedAt,
        endsAt: room.currentQuestionEndsAt,
        ...(isAdmin ? { correctAnswer: q.correctAnswer } : {}),
      };
    }

    const answeredCount = Object.values(room.players).filter((p) => p.currentAnswer !== null).length;

    let remainingSeconds = room.questionTime;
    if (room.status === "EXPLANATION") {
      remainingSeconds = room.explanationRemainingSeconds ?? 5;
    } else if (room.status === "RUNNING" && room.currentQuestionEndsAt) {
      remainingSeconds = Math.max(0, Math.ceil((room.currentQuestionEndsAt - Date.now()) / 1000));
    } else if (room.status === "PAUSED" && room.pausedRemainingTime) {
      remainingSeconds = room.pausedRemainingTime;
    }

    return {
      code: room.code,
      title: room.title,
      status: room.status,
      questionTime: room.questionTime,
      totalQuestions: room.totalQuestions,
      currentQuestionIndex: room.currentQuestionIndex,
      currentQuestion: currentQuestionData,
      remainingSeconds,
      explanationRemainingSeconds: room.explanationRemainingSeconds ?? 5,
      answeredCount,
      players: Object.values(room.players).map((p) => ({
        id: p.id,
        name: p.name,
        playerClass: p.playerClass,
        tile: p.tile,
        correctAnswers: p.correctAnswers,
        wrongAnswers: p.wrongAnswers,
        isOnline: p.isOnline,
      })),
    };
  }
}

// Global Singleton
const globalForGameManager = globalThis as unknown as { gameManager: GameManager };
export const gameManager = globalForGameManager.gameManager || new GameManager();
if (process.env.NODE_ENV !== "production") globalForGameManager.gameManager = gameManager;
