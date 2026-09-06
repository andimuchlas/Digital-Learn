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
  const [gameTitle, setGameTitle] = useState("Kuis Bola Basket Kelas 3 SD");
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.emit("admin:join_lobby", { code }, (res: any) => {
      if (res.error) {
        socket.emit("admin:create_lobby", { code, title: gameTitle }, (createRes: any) => {
          if (createRes?.room?.players) {
            setPlayers(createRes.room.players);
          }
        });
      } else if (res.room) {
        setGameTitle(res.room.title || gameTitle);
        if (res.room.players) {
          setPlayers(res.room.players);
        }
      }
    });

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
  }, [socket, code, gameTitle, router]);

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
        <p className="text-xs text-slate-500 font-bold mt-1">Total 25 Soal Pilihan Ganda &bull; Progres Papan 25 Petak</p>
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
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 block mb-2 font-heading">
              BAGIKAN TAUTAN KE SISWA
            </span>
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border-2 border-slate-300">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent text-xs font-mono font-bold text-slate-800 focus:outline-none overflow-hidden text-ellipsis px-2"
              />
              <Button
                type="button"
                onClick={handleCopyLink}
                variant="arcadeOrange"
                size="sm"
                className="shrink-0"
              >
                {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Tersalin!" : "Salin Tautan"}</span>
              </Button>
            </div>
          </div>

          <div className="pt-3 border-t-2 border-slate-100 text-xs text-slate-600 font-medium leading-relaxed">
            💡 <strong>Instruksi Siswa:</strong> Buka tautan di HP. Cukup ketik <strong>Nama</strong> dan <strong>Kelas</strong> untuk langsung masuk ke arena kuis.
          </div>
        </Card>
      </div>

      {/* Joined Players Grid */}
      <Card className="bg-white rounded-[36px] p-6 sm:p-9 border-2 border-slate-300 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-black">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-[#0F172A] font-heading">Peserta di Ruang Tunggu</h3>
          </div>
          <Badge variant="default" className="text-xs font-bold">
            {onlinePlayers.length} Siswa Terdaftar
          </Badge>
        </div>

        {onlinePlayers.length === 0 ? (
          <div className="py-14 text-center text-slate-400 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center mx-auto animate-pulse text-slate-400">
              <Users className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-slate-600">
              Menunggu peserta bergabung melalui tautan atau kode ruang kuis...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {onlinePlayers.map((player) => (
              <div
                key={player.id}
                className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center gap-3 shadow-sm animate-pop-in"
              >
                <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-orange-300 shadow-xs shrink-0 bg-white">
                  <img
                    src={getAvatarSrc(player.avatar)}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-black text-[#0F172A] truncate font-heading">{player.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold truncate">{player.playerClass || "Kelas 3"}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Start Game Action */}
        <div className="pt-4 border-t-2 border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-medium text-center sm:text-left">
            Pastikan seluruh murid telah berada di ruang tunggu sebelum menekan tombol mulai.
          </p>

          <Button
            onClick={handleStartGame}
            disabled={isStarting}
            variant="arcadeOrange"
            size="lg"
            className="w-full sm:w-auto px-8 py-5 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{isStarting ? "MEMULAI KUIS..." : "MULAI KUIS SEKARANG"}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
