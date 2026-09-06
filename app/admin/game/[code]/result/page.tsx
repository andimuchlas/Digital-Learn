"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Trophy, ArrowLeft, RotateCcw, Sparkles, Award } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { sound } from "@/lib/sound";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAvatarSrc } from "@/lib/avatars";

export default function AdminGameResultPage({ params }: { params: Promise<{ code: string }> }) {
  const unwrappedParams = use(params);
  const code = unwrappedParams.code.toUpperCase();
  const { socket } = useSocket();

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [gameTitle, setGameTitle] = useState("Kuis Interaktif");

  useEffect(() => {
    fetch(`/api/games/${code}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.session?.title) {
          setGameTitle(data.session.title);
        }
      })
      .catch(() => {});
  }, [code]);

  useEffect(() => {
    sound.playVictory();
    confetti({
      particleCount: 220,
      spread: 110,
      origin: { y: 0.55 },
    });

    if (socket) {
      socket.emit("room:get_state", { code }, (res: any) => {
        if (res.room) {
          setGameTitle(res.room.title || gameTitle);
          if (res.room.players) {
            const sorted = Object.values(res.room.players)
              .sort((a: any, b: any) => (b.tile || 1) - (a.tile || 1))
              .map((p: any, idx: number) => ({
                ...p,
                rank: idx + 1,
                finalTile: p.tile || 1,
              }));
            setLeaderboard(sorted);
          }
        }
      });

      const handleGameFinished = (data: any) => {
        if (data.finalLeaderboard) {
          setLeaderboard(data.finalLeaderboard);
        }
      };

      socket.on("game:finished", handleGameFinished);
      return () => {
        socket.off("game:finished", handleGameFinished);
      };
    }
  }, [socket, code, gameTitle]);

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6 select-none">
      {/* Top Banner */}
      <div className="text-center space-y-2">
        <h2 className="text-4xl sm:text-5xl font-black text-[#0F172A] font-heading tracking-tight">
          Podium Juara Kelas
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto font-bold">{gameTitle}</p>
      </div>

      {/* 3D Olympic Podium Top 3 */}
      {leaderboard.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end pt-8 pb-4 max-w-2xl mx-auto">
          {/* Rank 2 (Silver) */}
          <div className="flex flex-col items-center">
            {top2 ? (
              <div className="w-full flex flex-col items-center space-y-2 animate-pop-in">
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl overflow-hidden border-4 border-slate-300 shadow-lg bg-white">
                    <img
                      src={getAvatarSrc(top2.avatar)}
                      alt={top2.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-slate-200 border-2 border-white shadow flex items-center justify-center text-xs">
                    🥈
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-black text-[#0F172A] truncate max-w-[100px] sm:max-w-[140px] font-heading">
                    {top2.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold">{top2.playerClass}</p>
                </div>
                <div className="w-full h-28 sm:h-36 rounded-t-3xl bg-slate-200 border-t-4 border-x-2 border-slate-300 flex flex-col items-center justify-center shadow-md">
                  <span className="text-base sm:text-lg font-black text-[#0F172A] font-heading">
                    Petak {top2.finalTile || top2.tile || 1}
                  </span>
                  <span className="text-[10px] text-slate-600 font-bold">
                    {top2.correctAnswers || 0} Benar
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-28 rounded-t-3xl bg-slate-100 border-2 border-slate-200" />
            )}
          </div>

          {/* Rank 1 (Gold Champion) */}
          <div className="flex flex-col items-center">
            {top1 ? (
              <div className="w-full flex flex-col items-center space-y-2 animate-pop-in">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden border-4 border-[#FF5B00] shadow-2xl shadow-[#FF5B00]/40 bg-white animate-bounce">
                    <img
                      src={getAvatarSrc(top1.avatar)}
                      alt={top1.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF5B00] to-[#FFAA00] border-2 border-white shadow-md flex items-center justify-center text-sm">
                    👑
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm sm:text-base font-black text-[#FF5B00] truncate max-w-[120px] sm:max-w-[160px] font-heading">
                    {top1.name}
                  </p>
                  <p className="text-xs text-amber-800 font-black">{top1.playerClass}</p>
                </div>
                <div className="w-full h-36 sm:h-48 rounded-t-3xl bg-gradient-to-t from-[#FEF3C7] to-[#FDE68A] border-t-4 border-x-2 border-[#F59E0B] flex flex-col items-center justify-center shadow-xl">
                  <span className="text-xl sm:text-3xl font-black text-[#0F172A] font-heading">
                    Petak {top1.finalTile || top1.tile || 1}
                  </span>
                  <span className="text-xs text-[#B45309] font-black font-heading">
                    {top1.correctAnswers || 0} / 25 Benar
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-36 rounded-t-3xl bg-slate-100 border-2 border-slate-200" />
            )}
          </div>

          {/* Rank 3 (Bronze) */}
          <div className="flex flex-col items-center">
            {top3 ? (
              <div className="w-full flex flex-col items-center space-y-2 animate-pop-in">
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl overflow-hidden border-4 border-amber-600 shadow-lg bg-white">
                    <img
                      src={getAvatarSrc(top3.avatar)}
                      alt={top3.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-xl bg-amber-700 border-2 border-white shadow flex items-center justify-center text-xs">
                    🥉
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-black text-[#0F172A] truncate max-w-[100px] sm:max-w-[140px] font-heading">
                    {top3.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold">{top3.playerClass}</p>
                </div>
                <div className="w-full h-24 sm:h-28 rounded-t-3xl bg-amber-100 border-t-4 border-x-2 border-amber-300 flex flex-col items-center justify-center shadow-sm">
                  <span className="text-sm sm:text-base font-black text-[#0F172A] font-heading">
                    Petak {top3.finalTile || top3.tile || 1}
                  </span>
                  <span className="text-[10px] text-slate-600 font-bold">
                    {top3.correctAnswers || 0} Benar
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-24 rounded-t-3xl bg-slate-100 border-2 border-slate-200" />
            )}
          </div>
        </div>
      )}

      {/* Full Results Table */}
      <Card className="bg-white rounded-[36px] p-6 sm:p-8 border-2 border-slate-300 shadow-xl space-y-4">
        <h3 className="text-base font-black text-[#0F172A] flex items-center gap-2 font-heading uppercase tracking-wider">
          <Trophy className="w-5 h-5 text-[#D97706]" />
          <span>Tabel Peringkat Lengkap</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 border-b-2 border-slate-200 font-heading">
              <tr>
                <th className="pb-3 font-bold w-20 text-center">Peringkat</th>
                <th className="pb-3 font-bold">Nama Murid</th>
                <th className="pb-3 font-bold">Kelas</th>
                <th className="pb-3 font-bold text-center">Posisi Petak</th>
                <th className="pb-3 font-bold text-center">Jawaban Benar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaderboard.map((p, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 text-center font-black font-heading text-sm">
                    {index === 0
                      ? "🥇 1"
                      : index === 1
                      ? "🥈 2"
                      : index === 2
                      ? "🥉 3"
                      : `#${index + 1}`}
                  </td>
                  <td className="py-3.5 font-black text-[#0F172A] font-heading">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-300 shrink-0 bg-white">
                        <img
                          src={getAvatarSrc(p.avatar)}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-600 font-medium">{p.playerClass || "-"}</td>
                  <td className="py-3.5 text-center">
                    <Badge variant="default">
                      Petak {p.finalTile || p.tile || 1} / 25
                    </Badge>
                  </td>
                  <td className="py-3.5 text-center font-heading text-emerald-700 font-black">
                    {p.correctAnswers || 0} / 25
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <Button asChild variant="arcadeWhite" size="lg">
          <Link href="/admin">
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </Button>
        <Button asChild variant="arcadeOrange" size="lg" className="shadow-xl">
          <Link href="/admin/games/new">
            <RotateCcw className="w-4 h-4 mr-1" />
            <span>Mulai Kuis Baru</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
