"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { useSocket } from "@/hooks/useSocket";
import { TimerBar } from "@/components/TimerBar";
import { sound } from "@/lib/sound";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  Lock,
  Pause,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAvatarSrc } from "@/lib/avatars";

export default function PlayerQuizPage({ params }: { params: Promise<{ code: string }> }) {
  const unwrappedParams = use(params);
  const code = unwrappedParams.code.toUpperCase();
  const router = useRouter();
  const { socket, isConnected } = useSocket();

  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [playerClass, setPlayerClass] = useState<string>("");
  const [playerAvatar, setPlayerAvatar] = useState<string>("lion");
  const [currentTile, setCurrentTile] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Question & Game States
  const [gameState, setGameState] = useState<"EXPLANATION" | "RUNNING" | "INTERMISSION" | "PAUSED" | "FINISHED">("RUNNING");
  const [currentQ, setCurrentQ] = useState<any>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(20);
  const [totalSeconds, setTotalSeconds] = useState(20);
  const [explanationSeconds, setExplanationSeconds] = useState(5);
  const [selectedAnswer, setSelectedAnswer] = useState<"a" | "b" | "c" | "d" | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`quiz_player_${code}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPlayerId(parsed.id);
        setPlayerName(parsed.name);
        setPlayerClass(parsed.playerClass);
        if (parsed.avatar) setPlayerAvatar(parsed.avatar);
      } catch (e) {
        // ignore
      }
    }
  }, [code]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setEnabled(next);
  };

  useEffect(() => {
    if (!socket) return;

    const joinGameRoom = () => {
      let curPlayerId = playerId;
      let curName = playerName;

      if (!curPlayerId) {
        try {
          const raw = localStorage.getItem(`quiz_player_${code}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            curPlayerId = parsed.id;
            curName = parsed.name;
            if (curPlayerId) setPlayerId(curPlayerId);
            if (curName) setPlayerName(curName);
            if (parsed.playerClass) setPlayerClass(parsed.playerClass);
            if (parsed.avatar) setPlayerAvatar(parsed.avatar);
          }
        } catch {}
      }

      socket.emit(
        "player:join_game",
        { code, playerId: curPlayerId, name: curName },
        (res: any) => {
          if (res?.room) {
            setGameState(res.room.status);
            if (res.room.explanationRemainingSeconds !== undefined) {
              setExplanationSeconds(res.room.explanationRemainingSeconds);
            }
            if (res.room.currentQuestion) {
              setCurrentQ(res.room.currentQuestion);
              setRemainingSeconds(res.room.remainingSeconds);
              setTotalSeconds(res.room.totalSeconds || res.room.questionTime);
            }
            if (res.player) {
              setCurrentTile(res.player.tile);
              if (res.player.name) setPlayerName(res.player.name);
              if (res.player.playerClass) setPlayerClass(res.player.playerClass);
              if (res.player.avatar) setPlayerAvatar(res.player.avatar);
              if (res.player.currentAnswer) {
                setSelectedAnswer(res.player.currentAnswer);
                setIsLocked(true);
              }
            }
          }
        }
      );
    };

    joinGameRoom();
    socket.on("connect", joinGameRoom);

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
      setCurrentQ(data);
      setRemainingSeconds(data.duration);
      setTotalSeconds(data.duration);
      setSelectedAnswer(null);
      setIsLocked(false);
      setLastResult(null);
    };

    const handleTimerTick = (data: any) => {
      setRemainingSeconds(data.remainingSeconds);
      if (data.totalSeconds) setTotalSeconds(data.totalSeconds);
    };

    const handleAnswerLocked = () => {
      setIsLocked(true);
    };

    const handleQuestionResult = (data: any) => {
      setGameState("INTERMISSION");
      setLastResult(data);

      if (data.playerResults && playerId) {
        const myResult = data.playerResults.find((p: any) => p.playerId === playerId);
        if (myResult) {
          setCurrentTile(myResult.newTile);
          if (myResult.isCorrect) {
            sound.playCorrect();
            confetti({
              particleCount: 60,
              spread: 70,
              origin: { y: 0.6 },
            });
          } else {
            sound.playWrong();
          }
        }
      }
    };

    const handlePaused = (data: any) => {
      setGameState("PAUSED");
      if (data.remainingSeconds) setRemainingSeconds(data.remainingSeconds);
    };

    const handleResumed = (data: any) => {
      setGameState("RUNNING");
      if (data.remainingSeconds) setRemainingSeconds(data.remainingSeconds);
    };

    const handleFinished = () => {
      setGameState("FINISHED");
      sound.playVictory();
      window.location.href = `/join/${code}/result`;
    };

    socket.on("game:explanation_started", handleExplanation);
    socket.on("game:explanation_tick", handleExplanationTick);
    socket.on("game:question_started", handleQuestionStarted);
    socket.on("game:timer_tick", handleTimerTick);
    socket.on("game:answer_locked", handleAnswerLocked);
    socket.on("game:question_result", handleQuestionResult);
    socket.on("game:paused", handlePaused);
    socket.on("game:resumed", handleResumed);
    socket.on("game:finished", handleFinished);

    return () => {
      socket.off("connect", joinGameRoom);
      socket.off("game:explanation_started", handleExplanation);
      socket.off("game:explanation_tick", handleExplanationTick);
      socket.off("game:question_started", handleQuestionStarted);
      socket.off("game:timer_tick", handleTimerTick);
      socket.off("game:answer_locked", handleAnswerLocked);
      socket.off("game:question_result", handleQuestionResult);
      socket.off("game:paused", handlePaused);
      socket.off("game:resumed", handleResumed);
      socket.off("game:finished", handleFinished);
    };
  }, [socket, code, playerId, playerName, playerClass, router]);

  const handleSelectOption = (choice: "a" | "b" | "c" | "d") => {
    if (isLocked || gameState !== "RUNNING" || !socket || !playerId || !currentQ) return;

    sound.playClick();
    setSelectedAnswer(choice);
    setIsLocked(true);

    socket.emit("player:submit_answer", {
      code,
      playerId,
      questionIndex: currentQ.questionIndex,
      answer: choice,
    });
  };

  const myResultInfo = lastResult?.playerResults?.find((p: any) => p.playerId === playerId);

  const options = currentQ
    ? [
        { key: "a" as const, text: currentQ.optionA, symbol: "▲", btnClass: "btn-option-a", ringClass: "ring-rose-400" },
        { key: "b" as const, text: currentQ.optionB, symbol: "◆", btnClass: "btn-option-b", ringClass: "ring-blue-400" },
        { key: "c" as const, text: currentQ.optionC, symbol: "●", btnClass: "btn-option-c", ringClass: "ring-amber-400" },
        ...(currentQ.optionD
          ? [{ key: "d" as const, text: currentQ.optionD, symbol: "■", btnClass: "btn-option-d", ringClass: "ring-emerald-400" }]
          : []),
      ]
    : [];

  return (
    <main className="min-h-[100dvh] flex flex-col justify-between p-3.5 sm:p-5 max-w-md mx-auto w-full select-none bg-slate-50">
      {/* Top Status Header */}
      <header className="flex items-center justify-between pb-3 border-b-2 border-slate-200 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-orange-300 shadow-xs shrink-0 bg-white">
            <img
              src={getAvatarSrc(playerAvatar)}
              alt={playerName || "Avatar"}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="overflow-hidden">
            <span className="text-sm font-black text-[#0F172A] truncate block font-heading">
              {playerName || "Peserta"}
            </span>
            {/* Connectivity Indicator */}
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-rose-500 animate-ping"}`} />
              <span>{isConnected ? (playerClass || "Kelas 3 SD") : "Menghubungkan..."}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-white border-2 border-slate-200 text-slate-600 hover:text-[#FF5B00] transition-colors cursor-pointer"
            title={soundEnabled ? "Mute Suara" : "Nyalakan Suara"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <Badge variant="amber" className="text-xs py-1 px-3 shadow-xs font-heading font-black">
            <Trophy className="w-3.5 h-3.5 text-amber-600 fill-current mr-1" />
            <span>{currentTile === 0 ? "Garis Start" : `Petak ${currentTile} / 25`}</span>
          </Badge>
        </div>
      </header>

      {/* Explanation Screen */}
      {gameState === "EXPLANATION" && (
        <Card className="my-auto py-8 px-6 text-center space-y-4 rounded-[32px] bg-white border-2 border-slate-300 shadow-xl animate-pop-in">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] font-heading tracking-tight">
            Kuis Segera Dimulai!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-bold max-w-sm mx-auto leading-relaxed">
            Perhatikan proyektor kelas di depan. Jawab setiap soal dengan cepat dan benar untuk memajukan petakmu!
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-800 font-heading font-black text-lg">
            <span>Soal dimulai dalam: {explanationSeconds}s</span>
          </div>
        </Card>
      )}

      {/* Paused Screen */}
      {gameState === "PAUSED" && (
        <Card className="my-auto py-8 px-6 text-center space-y-3 rounded-[32px] bg-white border-2 border-amber-400 shadow-xl animate-pop-in">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-300 text-amber-600 flex items-center justify-center mx-auto mb-1 animate-pulse">
            <Pause className="w-8 h-8 stroke-[3]" />
          </div>
          <h2 className="text-xl font-black text-[#0F172A] font-heading">Permainan Dijeda</h2>
          <p className="text-xs text-slate-500 font-bold">
            Guru sedang menjeda kuis. Mohon tunggu sejenak ya...
          </p>
        </Card>
      )}

      {/* Loading / Syncing Question */}
      {gameState !== "EXPLANATION" && gameState !== "PAUSED" && !currentQ && (
        <Card className="my-auto py-8 px-6 text-center space-y-3 rounded-[32px] bg-white border-2 border-slate-300 shadow-xl animate-pop-in">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 border-2 border-orange-200 text-[#FF5B00] flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-[#0F172A] font-heading">Memuat Pertanyaan...</h2>
          <p className="text-xs text-slate-500 font-bold">Menyinkronkan soal kuis dengan server...</p>
        </Card>
      )}

      {/* Active Question & Proportional Option Buttons */}
      {gameState !== "EXPLANATION" && gameState !== "PAUSED" && currentQ && (
        <div className="my-auto py-3 space-y-3.5 w-full">
          {/* Question Card & Timer */}
          <Card className="p-4 rounded-3xl bg-white border-2 border-slate-300 shadow-md space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-600 font-heading">
                Soal {currentQ.questionNumber} dari {currentQ.totalQuestions}
              </span>
              {isLocked && (
                <Badge variant="success" className="text-[10px] py-0.5 px-2 font-bold">
                  <Lock className="w-3 h-3 mr-1" /> Terkunci
                </Badge>
              )}
            </div>

            <TimerBar
              remainingSeconds={remainingSeconds}
              totalSeconds={totalSeconds}
              isPaused={false}
              enableSound={soundEnabled}
            />

            {/* Question Text */}
            <h3 className="text-sm sm:text-base font-black text-[#0F172A] font-heading leading-snug text-center pt-1 px-1">
              {currentQ.text}
            </h3>
          </Card>

          {/* Intermission Result Banner */}
          {gameState === "INTERMISSION" && (
            <div
              className={`p-3 rounded-2xl border-2 text-center space-y-0.5 shadow-md animate-pop-in ${
                myResultInfo?.isCorrect
                  ? "bg-emerald-100 border-emerald-400 text-emerald-950"
                  : "bg-rose-100 border-rose-400 text-rose-950"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 font-black text-xs sm:text-sm font-heading">
                {myResultInfo?.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[3]" />
                    <span>Benar! Kamu maju ke Petak {currentTile} 🎉</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-700 stroke-[3]" />
                    <span>Belum tepat! ({currentTile === 0 ? "Tetap di Garis Start" : `Tetap di Petak ${currentTile}`})</span>
                  </>
                )}
              </div>
              <p className="text-[11px] font-bold text-slate-700">
                Kunci Jawaban: Opsi <strong>{lastResult?.correctAnswer?.toUpperCase()}</strong>
              </p>
            </div>
          )}

          {/* Proportional, Ergonomic Option Buttons */}
          <div className="space-y-2.5">
            {options.map((opt) => {
              const isSelected = selectedAnswer === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => handleSelectOption(opt.key)}
                  disabled={isLocked || gameState !== "RUNNING"}
                  className={`btn-3d w-full min-h-[54px] p-3 rounded-2xl text-left font-bold transition-all flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? `${opt.btnClass} ring-4 ${opt.ringClass} scale-[0.99]`
                      : isLocked
                      ? "bg-slate-100 border-2 border-slate-200 text-slate-400 opacity-40 cursor-not-allowed"
                      : opt.btnClass
                  }`}
                >
                  <span className="w-9 h-9 rounded-xl bg-black/25 flex items-center justify-center text-sm font-black shrink-0 font-heading text-white shadow-inner">
                    {opt.symbol}
                  </span>
                  <span className="text-xs sm:text-sm font-black font-heading text-white leading-snug flex-1">
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-center text-[11px] text-slate-400 font-bold">
            {isLocked ? "Jawaban sudah dikunci &bull; Menunggu hasil..." : "Pilih salah satu jawaban sebelum waktu habis!"}
          </p>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="w-full text-center text-xs text-slate-400 pt-2 border-t-2 border-slate-200 font-bold shrink-0">
        Digital Learn Interactive &bull; Kuis 25 Petak
      </footer>
    </main>
  );
}
