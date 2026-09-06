import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { gameManager } from "./lib/game-manager";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const port = parseInt(process.env.PORT || "3001", 10);

const httpServer = createServer((req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/" || req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "digital-learn-socket-server",
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
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

  socket.on("admin:join_lobby", ({ code }, callback) => {
    const room = gameManager.getRoom(code);
    if (!room) {
      if (callback) callback({ error: "Lobby tidak ditemukan!" });
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

  // Player joins lobby
  socket.on("player:join_lobby", ({ code, name, playerClass, avatar }, callback) => {
    const result = gameManager.joinPlayer(code, name, playerClass, socket.id, avatar);
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
  socket.on("player:join_game", ({ code, playerId, name }, callback) => {
    const room = gameManager.getRoom(code);
    if (!room) {
      if (callback) callback({ error: "Lobby tidak ditemukan!" });
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
  socket.on("room:get_state", ({ code }, callback) => {
    const room = gameManager.getRoom(code);
    if (!room) {
      if (callback) callback({ error: "Lobby tidak ditemukan" });
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

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`> 🚀 Standalone Socket.IO Server ready on port ${port}`);
});
