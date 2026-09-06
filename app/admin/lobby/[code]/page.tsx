"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { sound } from "@/lib/sound";
import { Copy, Check, Users, Play, Sparkles, Wifi, WifiOff, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAvatarSrc } from "@/lib/avatars";

export default function AdminLobbyPage({ params }: { params: Promise<{ code: string }> }) {
  const unwrappedParams = use(params);
  const code = unwrappedParams.code.toUpperCase();
  const router = useRouter();
  const { socket, isConnected } = useSocket();

  const [players, setPlayers] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [gameTitle, setGameTitle] = useState("Kuis Interaktif");
  const [totalQuestions, setTotalQuestions] = useState(25);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    // 1. Try restoring from sessionStorage
    let sessionQuestions: any[] | null = null;
    let sessionQuestionTime = 20;

    try {
      const saved = sessionStorage.getItem(`session_data_${code}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title) setGameTitle(parsed.title);
        if (parsed.questions) {
          sessionQuestions = parsed.questions;
          setTotalQuestions(parsed.questions.length);
        }
        if (parsed.questionTime) sessionQuestionTime = parsed.questionTime;
      }
    } catch {}

    // 2. Fetch fresh session details from API
    fetch(`/api/games/${code}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.session) {
          setGameTitle(data.session.title || "Kuis Interaktif");
          if (data.questions && data.questions.length > 0) {
            sessionQuestions = data.questions;
            setTotalQuestions(data.questions.length);
          }
          if (data.session.questionTime) {
            sessionQuestionTime = data.session.questionTime;
          }
        }
      })
      .catch((err) => console.warn("API games session lookup notice:", err))
      .finally(() => {
        if (!socket) return;
        // Connect / register to socket room
        socket.emit("admin:join_lobby", { code }, (res: any) => {
          if (res?.error) {
            socket.emit(
              "admin:create_lobby",
              {
                code,
                title: gameTitle,
                questions: sessionQuestions || undefined,
                questionTime: sessionQuestionTime,
              },
              (createRes: any) => {
                if (createRes?.room?.players) {
                  setPlayers(createRes.room.players);
                }
              }
            );
          } else if (res?.room) {
            setGameTitle(res.room.title || gameTitle);
            if (res.room.players) {
              setPlayers(res.room.players);
            }
          }
        });
      });
  }, [code, socket]);

  useEffect(() => {
    if (!socket) return;

    const handlePlayerJoined = (data: any) => {
      sound.playJoinPop();
      if (data.players) {
        setPlayers(data.players);
      } else if (data.player) {
        setPlayers((prev) => {
          const exists = prev.some((p) => p.id === data.player.id);
          if (exists) return prev.map((p) => (p.id === data.player.id ? data.player : p));
          return [...prev, data.player];
        });
      }
    };

    const handlePlayerLeft = (data: any) => {
      if (data.players) {
        setPlayers(data.players);
      }
    };

    const handleExplanationStarted = () => {
      router.push(`/admin/game/${code}`);
    };

    socket.on("lobby:player_joined", handlePlayerJoined);
    socket.on("lobby:player_left", handlePlayerLeft);
    socket.on("game:explanation_started", handleExplanationStarted);

    return () => {
      socket.off("lobby:player_joined", handlePlayerJoined);
      socket.off("lobby:player_left", handlePlayerLeft);
      socket.off("game:explanation_started", handleExplanationStarted);
    };
  }, [socket, code, router]);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/join/${code}` : `/join/${code}`;

  const handleCopyLink = () => {
    sound.playClick();
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    if (!socket) return;
    sound.playClick();
    setIsStarting(true);
    socket.emit("admin:start_game", { code });
    router.push(`/admin/game/${code}`);
  };

  const onlinePlayers = players.filter((p) => p.isOnline !== false);

  return (
    <div className="max-w-4xl mx-auto space-y-8 select-none">
      {/* Header Banner */}
      <Card className="p-6 sm:p-7 rounded-[36px] bg-white border-2 border-slate-300 shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] font-heading">{gameTitle}</h2>
        <p className="text-xs text-slate-500 font-bold mt-1">Total {totalQuestions} Soal Pilihan Ganda &bull; Progres Papan 25 Petak</p>
      </Card>

      {/* Lobby Code & Share Link Hero */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Big Code Card for Classroom Projector */}
        <Card className="p-8 sm:p-10 rounded-[36px] bg-white border-2 border-slate-300 shadow-xl flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
          <span className="text-xs font-black uppercase tracking-widest text-[#FF5B00] font-heading">
            KODE RUANG KUIS
          </span>
          <div className="font-heading text-5xl sm:text-6xl font-black text-[#0F172A] tracking-widest bg-slate-50 px-8 py-4 rounded-3xl border-2 border-slate-300 shadow-inner">
            {code}
          </div>
          <p className="text-xs text-slate-500 font-bold">
            Murid dapat mengetik kode ini langsung di halaman depan.
          </p>
        </Card>

        {/* Share Link Card */}
        <Card className="p-8 sm:p-10 rounded-[36px] bg-white border-2 border-slate-300 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-700 font-heading">
                Tautan Langsung Masuk
              </span>
              <Badge variant={isConnected ? "success" : "default"} className="text-xs">
                {isConnected ? (
                  <span className="flex items-center gap-1.5 font-bold">
                    <Wifi className="w-3.5 h-3.5" /> Socket Terhubung
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 font-bold">
                    <WifiOff className="w-3.5 h-3.5" /> Menghubungkan...
                  </span>
                )}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-bold mb-4">
              Bagikan link ini ke murid agar langsung masuk ke ruang kuis ini.
            </p>
            <div className="p-3 bg-slate-50 rounded-2xl border-2 border-slate-200 text-xs font-mono text-slate-600 truncate">
              {shareUrl}
            </div>
          </div>

          <Button
            onClick={handleCopyLink}
            variant="default"
            size="default"
            className="w-full flex items-center justify-center gap-2 cursor-pointer font-heading font-black"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                <span className="text-emerald-700">Tautan Berhasil Disalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 stroke-[3]" />
                <span>Salin Tautan Ruang Kuis</span>
              </>
            )}
          </Button>
        </Card>
      </div>

      {/* Connected Players Section */}
      <Card className="p-6 sm:p-8 rounded-[36px] bg-white border-2 border-slate-300 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-orange-100 text-[#FF5B00]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#0F172A] font-heading">Murid yang Bergabung</h3>
              <p className="text-xs text-slate-500 font-bold">
                {onlinePlayers.length === 0
                  ? "Menunggu murid masuk..."
                  : `${onlinePlayers.length} murid sudah di ruang tunggu`}
              </p>
            </div>
          </div>

          <Badge variant="glow" className="text-sm px-4 py-2 font-black self-start sm:self-auto">
            {onlinePlayers.length} Murid
          </Badge>
        </div>

        {/* Players Grid */}
        {onlinePlayers.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-200 mx-auto flex items-center justify-center text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-black text-[#0F172A] font-heading">Belum ada murid yang bergabung</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-bold">
              Bagikan kode <span className="font-mono font-black text-[#FF5B00]">{code}</span> kepada murid di kelas
              untuk segera memulai.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {onlinePlayers.map((p) => (
              <div
                key={p.id}
                className="bg-slate-50 border-2 border-slate-200 p-3.5 rounded-2xl flex items-center gap-3 animate-pop-in shadow-sm"
              >
                <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-slate-300 bg-white shrink-0 shadow-sm">
                  <img
                    src={getAvatarSrc(p.avatar)}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-[#0F172A] truncate font-heading">{p.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold truncate">Kelas: {p.playerClass}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Start Game Action */}
        <div className="pt-4 border-t-2 border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-bold text-center sm:text-left">
            Pastikan seluruh murid kelas telah masuk sebelum memulai kuis.
          </p>

          <Button
            onClick={handleStartGame}
            disabled={onlinePlayers.length === 0 || isStarting}
            variant="arcadeOrange"
            size="lg"
            className="w-full sm:w-auto px-8 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5 fill-white" />
            <span className="text-sm sm:text-base tracking-wider font-heading uppercase">
              {isStarting ? "MEMULAI..." : `MULAI KUIS SEKARANG (${onlinePlayers.length})`}
            </span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
