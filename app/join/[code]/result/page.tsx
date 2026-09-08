"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Trophy, ArrowLeft, Sparkles, Award } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { sound } from "@/lib/sound";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAvatarSrc } from "@/lib/avatars";
import { compareLeaderboardPlayers } from "@/lib/leaderboard";

export default function PlayerResultPage({ params }: { params: Promise<{ code: string }> }) {
  const unwrappedParams = use(params);
  const code = unwrappedParams.code.toUpperCase();
  const { socket } = useSocket();

  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [playerClass, setPlayerClass] = useState<string>("");
  const [playerAvatar, setPlayerAvatar] = useState<string>("lion");
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myTile, setMyTile] = useState<number>(1);
  const [myCorrect, setMyCorrect] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(25);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    sound.playVictory();
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
    });

    const saved = localStorage.getItem(`quiz_player_${code}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.id) setPlayerId(parsed.id);
        if (parsed.name) setPlayerName(parsed.name);
        if (parsed.playerClass) setPlayerClass(parsed.playerClass);
        if (parsed.avatar) setPlayerAvatar(parsed.avatar);
      } catch (e) {
        // ignore
      }
    } else {
      const storedId = sessionStorage.getItem(`quiz_player_id_${code}`);
      const storedName = sessionStorage.getItem(`quiz_player_name_${code}`);
      const storedAvatar = sessionStorage.getItem(`quiz_player_avatar_${code}`);
      if (storedId) setPlayerId(storedId);
      if (storedName) setPlayerName(storedName);
      if (storedAvatar) setPlayerAvatar(storedAvatar);
    }
  }, [code]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("room:get_state", { code }, (res: any) => {
      if (res.room) {
        setTotalQuestions(res.room.totalQuestions || 25);
        if (res.room.players) {
          const sorted = (Object.values(res.room.players) as any[])
            .sort(compareLeaderboardPlayers)
            .map((p: any, idx: number) => ({
              ...p,
              rank: idx + 1,
              finalTile: p.tile || p.finalTile || 1,
            }));
          setLeaderboard(sorted);

          if (playerId) {
            const me = sorted.find((p) => p.id === playerId);
            if (me) {
              setMyRank(me.rank);
              setMyTile(me.finalTile || me.tile || 1);
              setMyCorrect(me.correctAnswers || 0);
              if (me.avatar) setPlayerAvatar(me.avatar);
            }
          }
        }
      }
    });

    const handleGameFinished = (data: any) => {
      if (data.totalQuestions) setTotalQuestions(data.totalQuestions);
      if (data.finalLeaderboard) {
        const sorted = [...data.finalLeaderboard]
          .sort(compareLeaderboardPlayers)
          .map((p: any, idx: number) => ({
            ...p,
            rank: idx + 1,
            finalTile: p.finalTile || p.tile || 1,
          }));
        setLeaderboard(sorted);
        if (playerId) {
          const me = sorted.find((p: any) => p.id === playerId);
          if (me) {
            setMyRank(me.rank);
            setMyTile(me.finalTile || me.tile || 1);
            setMyCorrect(me.correctAnswers || 0);
            if (me.avatar) setPlayerAvatar(me.avatar);
          }
        }
      }
    };

    socket.on("game:finished", handleGameFinished);
    return () => {
      socket.off("game:finished", handleGameFinished);
    };
  }, [socket, code, playerId]);

  return (
    <main className="min-h-screen flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto w-full select-none">
      {/* Header */}
      <div className="text-center pt-2 space-y-1">
        <h1 className="text-3xl font-black text-[#0F172A] font-heading tracking-tight">
          Hasil Kuis Kamu
        </h1>
      </div>

      {/* Main Podium Card */}
      <div className="my-auto py-4 space-y-4">
        <Card className="bg-white rounded-[36px] p-6 sm:p-8 border-2 border-slate-300 shadow-2xl text-center space-y-4 animate-pop-in">
          {/* Avatar with Medal Ring */}
          <div className="relative mx-auto w-fit">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-2xl shadow-[#FF5B00]/40 bg-white mx-auto">
              <img
                src={getAvatarSrc(playerAvatar)}
                alt={playerName || "Avatar"}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF5B00] to-[#FFAA00] border-2 border-white shadow-md flex items-center justify-center text-base">
              {myRank === 1 ? "👑" : myRank === 2 ? "🥈" : myRank === 3 ? "🥉" : "🎖️"}
            </div>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] font-heading">{playerName || "Peserta"}</h2>
            <p className="text-xs text-[#FF5B00] font-black font-heading mt-0.5">{playerClass || "Kelas 3"}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-center">
              <span className="text-[10px] font-black text-slate-500 block uppercase font-heading tracking-wider">
                POSISI PETAK
              </span>
              <span className="text-2xl font-black text-[#FF5B00] font-heading">
                Petak {myTile} / {totalQuestions}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-center">
              <span className="text-[10px] font-black text-slate-500 block uppercase font-heading tracking-wider">
                PERINGKAT KELAS
              </span>
              <span className="text-2xl font-black text-[#D97706] font-heading">
                {myRank ? `Juara #${myRank}` : "-"}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-100 border-2 border-emerald-300 text-emerald-900 text-xs font-black font-heading">
            🎉 Hebat! Kamu berhasil menjawab <strong>{myCorrect}</strong> dari {totalQuestions} soal dengan tepat.
          </div>
        </Card>

        {/* 3 Besar Kelas */}
        {leaderboard.length > 0 && (
          <Card className="bg-white rounded-[28px] p-5 border-2 border-slate-300 shadow-md space-y-3">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-[#D97706]" />
              <span className="text-xs font-black text-[#0F172A] font-heading uppercase tracking-wider">
                3 Besar Juara Kelas:
              </span>
            </div>

            <div className="space-y-2">
              {leaderboard.slice(0, 3).map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-black text-base">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                    </span>
                    <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-300 shrink-0 bg-white">
                      <img
                        src={getAvatarSrc(p.avatar)}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-black text-[#0F172A] font-heading">{p.name}</span>
                  </div>
                  <Badge variant="default" className="text-xs font-bold">
                    Petak {p.finalTile || p.tile || 1}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-2">
        <Button asChild variant="arcadeOrange" size="lg" className="w-full">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>KEMBALI KE BERANDA</span>
          </Link>
        </Button>
      </div>
    </main>
  );
}
