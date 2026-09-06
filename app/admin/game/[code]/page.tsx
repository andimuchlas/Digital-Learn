"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { GameBoard, BoardPlayer } from "@/components/GameBoard";
import { TimerBar } from "@/components/TimerBar";
import { sound } from "@/lib/sound";
import {
  Pause,
  Play,
  SkipForward,
  Square,
  Trophy,
  Users,
  CheckCircle2,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAvatarSrc } from "@/lib/avatars";

export default function AdminLiveGamePage({ params }: { params: Promise<{ code: string }> }) {
  const unwrappedParams = use(params);
  const code = unwrappedParams.code.toUpperCase();
  const router = useRouter();
  const { socket } = useSocket();

  // Game States
  const [gameState, setGameState] = useState<"EXPLANATION" | "RUNNING" | "INTERMISSION" | "PAUSED" | "FINISHED">("EXPLANATION");
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(20);
  const [totalSeconds, setTotalSeconds] = useState(20);
  const [explanationSeconds, setExplanationSeconds] = useState(5);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [players, setPlayers] = useState<BoardPlayer[]>([]);
  const [lastResult, setLastResult] = useState<any>(null);
  const [activePlayerResult, setActivePlayerResult] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setEnabled(next);
  };

  useEffect(() => {
    if (!socket) return;

    const joinAdminRoom = () => {
      socket.emit("admin:join_lobby", { code }, (res: any) => {
        if (res?.room) {
          if (res.room.players) setPlayers(res.room.players);
          setGameState(res.room.status);
          if (res.room.explanationRemainingSeconds !== undefined) {
            setExplanationSeconds(res.room.explanationRemainingSeconds);
          }
          if (res.room.currentQuestion) {
            setCurrentQuestion(res.room.currentQuestion);
            setRemainingSeconds(res.room.remainingSeconds);
            setTotalSeconds(res.room.totalSeconds || res.room.questionTime);
          }
          if (res.room.answeredCount !== undefined) {
            setAnsweredCount(res.room.answeredCount);
          }
        }
      });
    };

    joinAdminRoom();
    socket.on("connect", joinAdminRoom);

    const handleExplanation = (data: any) => {
      setGameState("EXPLANATION");
      setExplanationSeconds(data.duration || 5);
    };

    const handleExplanationTick = (data: any) => {
      setGameState("EXPLANATION");
      setExplanationSeconds(data.remainingSeconds);
    };

    const handleQuestionStarted = (data: any) => {
      setGameState("RUNNING");
      setIsPaused(false);
      setCurrentQuestion(data);
      setRemainingSeconds(data.duration);
      setTotalSeconds(data.duration);
      setAnsweredCount(0);
      setLastResult(null);
      setActivePlayerResult(null);
    };

    const handleTimerTick = (data: any) => {
      setRemainingSeconds(data.remainingSeconds);
      if (data.totalSeconds) setTotalSeconds(data.totalSeconds);
    };

    const handleAnsweredUpdate = (data: any) => {
      setAnsweredCount(data.answeredCount);
    };

    const handleQuestionResult = (data: any) => {
      setGameState("INTERMISSION");
      setLastResult(data);

      if (data.playerResults && data.playerResults.length > 0) {
        const hasCorrect = data.playerResults.some((p: any) => p.isCorrect);
        if (hasCorrect) {
          sound.playCorrect();
        }

        const movingPlayer = data.playerResults.find((p: any) => p.isCorrect);
        if (movingPlayer) {
          setActivePlayerResult({
            playerId: movingPlayer.playerId,
            previousTile: movingPlayer.previousTile,
            newTile: movingPlayer.newTile,
            isCorrect: true,
          });
        }

        setPlayers((prev) =>
          prev.map((player) => {
            const updated = data.playerResults.find((r: any) => r.playerId === player.id);
            if (updated) {
              return {
                ...player,
                tile: updated.newTile,
                correctAnswers: updated.correctAnswers,
              };
            }
            return player;
          })
        );
      }
    };

    const handlePaused = (data: any) => {
      setIsPaused(true);
      setGameState("PAUSED");
      if (data.remainingSeconds) setRemainingSeconds(data.remainingSeconds);
    };

    const handleResumed = (data: any) => {
      setIsPaused(false);
      setGameState("RUNNING");
      if (data.remainingSeconds) setRemainingSeconds(data.remainingSeconds);
    };

    const handleFinished = () => {
      setGameState("FINISHED");
      sound.playVictory();
      router.push(`/admin/game/${code}/result`);
    };

    socket.on("game:explanation_started", handleExplanation);
    socket.on("game:explanation_tick", handleExplanationTick);
    socket.on("game:question_started", handleQuestionStarted);
    socket.on("game:timer_tick", handleTimerTick);
    socket.on("game:answered_update", handleAnsweredUpdate);
    socket.on("game:question_result", handleQuestionResult);
    socket.on("game:paused", handlePaused);
    socket.on("game:resumed", handleResumed);
    socket.on("game:finished", handleFinished);

    return () => {
      socket.off("connect", joinAdminRoom);
      socket.off("game:explanation_started", handleExplanation);
      socket.off("game:explanation_tick", handleExplanationTick);
      socket.off("game:question_started", handleQuestionStarted);
      socket.off("game:timer_tick", handleTimerTick);
      socket.off("game:answered_update", handleAnsweredUpdate);
      socket.off("game:question_result", handleQuestionResult);
      socket.off("game:paused", handlePaused);
      socket.off("game:resumed", handleResumed);
      socket.off("game:finished", handleFinished);
    };
  }, [socket, code, router]);

  const togglePause = () => {
    if (!socket) return;
    sound.playClick();
    if (isPaused) {
      socket.emit("admin:resume_game", { code });
    } else {
      socket.emit("admin:pause_game", { code });
    }
  };

  const handleSkip = () => {
    if (!socket) return;
    sound.playClick();
    socket.emit("admin:skip_question", { code });
  };

  const handleRestart = () => {
    if (!socket) return;
    sound.playClick();
    setIsPaused(false);
    socket.emit("admin:restart_game", { code });
  };

  const handleEndGame = () => {
    if (!socket) return;
    socket.emit("admin:end_game", { code });
    router.push(`/admin/game/${code}/result`);
  };

  const sortedLeaderboard = [...players].sort((a, b) => (b.tile || 1) - (a.tile || 1));
  const answeredPercentage = players.length > 0 ? (answeredCount / players.length) * 100 : 0;

  return (
    <div className="space-y-6 select-none">
      {/* Top Controller Bar */}
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-white border-2 border-slate-300 rounded-[32px] shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5B00] border-2 border-[#C2410C] text-white flex items-center justify-center font-heading font-black text-sm shadow">
            {code}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-[#0F172A] font-heading">Layar Utama Proyektor</h2>
              <Badge variant="glow" className="text-[10px]">
                {gameState === "EXPLANATION"
                  ? "CARA BERMAIN"
                  : gameState === "RUNNING"
                  ? "SOAL BERLANGSUNG"
                  : gameState === "INTERMISSION"
                  ? "KUNCI JAWABAN"
                  : gameState === "PAUSED"
                  ? "KUIS DIJEDA"
                  : "SELESAI"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              {currentQuestion
                ? `Soal ${currentQuestion.questionNumber} dari ${currentQuestion.totalQuestions}`
                : "Menyiapkan giliran soal..."}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleSound}
            className="p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:text-[#FF5B00] transition-colors cursor-pointer"
            title={soundEnabled ? "Mute Suara Host" : "Nyalakan Suara"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <Button
            onClick={togglePause}
            variant={isPaused ? "arcadeOrange" : "arcadeWhite"}
            size="sm"
            className="cursor-pointer"
          >
            {isPaused ? <Play className="w-4 h-4 fill-current mr-1" /> : <Pause className="w-4 h-4 mr-1" />}
            <span>{isPaused ? "Lanjutkan" : "Jeda"}</span>
          </Button>

          <Button
            onClick={handleSkip}
            variant="arcadeWhite"
            size="sm"
            className="cursor-pointer"
            title="Lewati ke evaluasi soal saat ini"
          >
            <SkipForward className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Lewati</span>
          </Button>

          <Button
            onClick={handleRestart}
            variant="arcadeWhite"
            size="sm"
            className="cursor-pointer"
            title="Ulangi kuis dari Soal #1"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Ulangi</span>
          </Button>

          <Button
            onClick={() => setShowEndConfirm(true)}
            variant="destructive"
            size="sm"
            className="cursor-pointer rounded-2xl"
          >
            <Square className="w-3.5 h-3.5 fill-current mr-1" />
            <span>Akhiri</span>
          </Button>
        </div>
      </Card>

      {/* Main Two-Phase Proyektor Display */}
      {gameState === "EXPLANATION" && (
        <Card className="p-8 sm:p-12 rounded-[36px] bg-white border-[3px] border-[#FF5B00] text-center space-y-6 shadow-2xl animate-pop-in">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#FF5B00] font-heading bg-orange-50 px-3 py-1 rounded-full border border-orange-200 inline-block mb-2">
              Aturan Permainan
            </span>
            <h3 className="text-3xl sm:text-5xl font-black text-[#0F172A] font-heading tracking-tight">
              Cara Bermain Kuis
            </h3>
            <p className="text-slate-600 text-sm sm:text-base font-bold mt-1">
              Perhatikan aturan sebelum soal pertama dimulai di layar HP kamu:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left max-w-4xl mx-auto">
            <div className="p-4 rounded-3xl bg-orange-50 border-2 border-orange-200">
              <span className="text-base font-black font-heading text-[#FF5B00] block mb-1">1. 25 Soal Serentak</span>
              <p className="text-xs text-slate-700 font-bold leading-relaxed">Semua murid menerima soal yang sama bersamaan.</p>
            </div>
            <div className="p-4 rounded-3xl bg-blue-50 border-2 border-blue-200">
              <span className="text-base font-black font-heading text-[#2563EB] block mb-1">2. Waktu Terbatas</span>
              <p className="text-xs text-slate-700 font-bold leading-relaxed">Pilih jawaban di HP sebelum timer habis.</p>
            </div>
            <div className="p-4 rounded-3xl bg-emerald-50 border-2 border-emerald-200">
              <span className="text-base font-black font-heading text-[#059669] block mb-1">3. Benar = +1 Petak</span>
              <p className="text-xs text-slate-700 font-bold leading-relaxed">Karaktermu melompat maju 1 petak di papan.</p>
            </div>
            <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-200">
              <span className="text-base font-black font-heading text-[#D97706] block mb-1">4. Puncak Juara</span>
              <p className="text-xs text-slate-700 font-bold leading-relaxed">Salah atau waktu habis tetap di posisi semula.</p>
            </div>
          </div>

          <div className="pt-2">
            <span className="inline-block font-mono text-7xl sm:text-8xl font-black text-[#FF5B00] animate-bounce">
              {explanationSeconds}
            </span>
          </div>
        </Card>
      )}

      {/* FASE 1: QUESTION PHASE (RUNNING / PAUSED) -> Giant Question & 2x2 Big Option Cards for Classroom Projector */}
      {(gameState === "RUNNING" || gameState === "PAUSED") && currentQuestion && (
        <div className="space-y-6 animate-pop-in">
          <Card className="p-6 sm:p-10 rounded-[36px] bg-white border-[3px] border-slate-300 shadow-2xl space-y-6">
            {/* Top Bar inside Question: Question Number & Answered Counter */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant="secondary" className="text-xs sm:text-sm uppercase tracking-wider font-heading py-1 px-3.5">
                Soal #{currentQuestion.questionNumber} dari {currentQuestion.totalQuestions}
              </Badge>

              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm text-slate-700 font-heading font-bold flex items-center gap-1.5 bg-orange-50 px-3.5 py-1.5 rounded-2xl border border-orange-200">
                  <Users className="w-4 h-4 text-[#FF5B00]" />
                  <strong className="text-[#0F172A] text-sm sm:text-base font-black">{answeredCount}</strong> / {players.length} Murid Menjawab
                </span>
              </div>
            </div>

            {/* Answering Progress Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border-2 border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-[#FF5B00] transition-all duration-300 ease-out"
                style={{ width: `${answeredPercentage}%` }}
              />
            </div>

            {/* Giant Timer Bar */}
            <TimerBar
              remainingSeconds={remainingSeconds}
              totalSeconds={totalSeconds}
              isPaused={isPaused}
              enableSound={soundEnabled}
            />

            {/* Giant Question Text - Readable from back of classroom */}
            <div className="py-4 sm:py-6 px-2 text-center">
              <h3 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#0F172A] font-heading leading-tight max-w-4xl mx-auto">
                {currentQuestion.text}
              </h3>
            </div>

            {/* 2x2 Giant Arcade Options Grid on Projector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Option A (Ruby Red) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-rose-500 to-red-600 border-2 border-red-700 text-white flex items-center gap-4 shadow-lg shadow-rose-500/20">
                <span className="w-12 h-12 rounded-2xl bg-black/25 flex items-center justify-center text-xl font-black shrink-0 font-heading">
                  ▲
                </span>
                <span className="text-lg sm:text-2xl font-black font-heading leading-tight flex-1">
                  {currentQuestion.optionA}
                </span>
              </div>

              {/* Option B (Cobalt Blue) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-500 to-indigo-600 border-2 border-blue-700 text-white flex items-center gap-4 shadow-lg shadow-blue-500/20">
                <span className="w-12 h-12 rounded-2xl bg-black/25 flex items-center justify-center text-xl font-black shrink-0 font-heading">
                  ◆
                </span>
                <span className="text-lg sm:text-2xl font-black font-heading leading-tight flex-1">
                  {currentQuestion.optionB}
                </span>
              </div>

              {/* Option C (Golden Amber) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-400 to-orange-500 border-2 border-amber-600 text-white flex items-center gap-4 shadow-lg shadow-amber-500/20">
                <span className="w-12 h-12 rounded-2xl bg-black/25 flex items-center justify-center text-xl font-black shrink-0 font-heading">
                  ●
                </span>
                <span className="text-lg sm:text-2xl font-black font-heading leading-tight flex-1">
                  {currentQuestion.optionC}
                </span>
              </div>

              {/* Option D (Emerald Green) */}
              {currentQuestion.optionD && (
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-500 to-green-600 border-2 border-emerald-700 text-white flex items-center gap-4 shadow-lg shadow-emerald-500/20">
                  <span className="w-12 h-12 rounded-2xl bg-black/25 flex items-center justify-center text-xl font-black shrink-0 font-heading">
                    ■
                  </span>
                  <span className="text-lg sm:text-2xl font-black font-heading leading-tight flex-1">
                    {currentQuestion.optionD}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* FASE 2: EVALUATION / INTERMISSION PHASE -> Full-Width 25-Tile Board with Leap Animations */}
      {gameState === "INTERMISSION" && (
        <div className="space-y-6 animate-pop-in">
          {/* Top Banner: Reveal Correct Answer */}
          {lastResult && (
            <Card className="p-5 sm:p-6 rounded-[32px] bg-emerald-50 border-[3px] border-emerald-500 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <CheckCircle2 className="w-7 h-7 stroke-[3]" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700 font-heading">
                    Evaluasi Soal #{currentQuestion?.questionNumber || ""}
                  </span>
                  <h4 className="text-xl sm:text-2xl font-black text-emerald-950 font-heading">
                    Kunci Jawaban: Opsi {lastResult.correctAnswer.toUpperCase()}
                  </h4>
                </div>
              </div>

              <Badge variant="success" className="text-xs sm:text-sm py-1.5 px-4 font-black">
                Pemain yang benar melompat maju 1 petak! 🚀
              </Badge>
            </Card>
          )}

          {/* Full Width 25-Tile Game Board */}
          <GameBoard players={players} activePlayerResult={activePlayerResult} />

          {/* Mini Leaderboard Ticker */}
          <Card className="p-5 rounded-[32px] bg-white border-2 border-slate-300 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black text-[#0F172A] font-heading uppercase tracking-wider">
                Posisi Terdepan Saat Ini:
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {sortedLeaderboard.slice(0, 5).map((p, idx) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center gap-2 text-xs"
                >
                  <span className="font-black text-sm">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}</span>
                  <div className="w-6 h-6 rounded-lg overflow-hidden border border-slate-300 shrink-0 bg-white">
                    <img src={getAvatarSrc(p.avatar)} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="font-black text-[#0F172A] truncate font-heading">{p.name}</p>
                    <p className="text-[10px] text-[#FF5B00] font-bold">Petak {p.tile || 1}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* End Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-sm bg-white border-2 border-slate-300 rounded-[36px] p-7 shadow-2xl space-y-4 text-center animate-pop-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Square className="w-7 h-7 fill-current" />
            </div>
            <h3 className="text-xl font-black text-[#0F172A] font-heading">Akhiri Kuis Sekarang?</h3>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">
              Sesi permainan akan diselesaikan dan seluruh murid akan langsung dialihkan ke Layar Juara Akhir.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                onClick={() => setShowEndConfirm(false)}
                variant="arcadeWhite"
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                onClick={handleEndGame}
                variant="destructive"
                className="cursor-pointer"
              >
                Ya, Akhiri
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
