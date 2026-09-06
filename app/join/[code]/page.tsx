"use client";

import { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSocket } from "@/hooks/useSocket";
import { sound } from "@/lib/sound";
import { ANIMAL_AVATARS, getAvatarSrc } from "@/lib/avatars";
import {
  User,
  School,
  ArrowRight,
  BookOpen,
  Users,
  Trophy,
  Flame,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEFAULT_FLOATING_POSITIONS = [
  { top: "8%", left: "4%", animClass: "animate-float-a", delay: 0 },
  { top: "12%", right: "5%", animClass: "animate-float-b", delay: 1.5 },
  { bottom: "24%", left: "5%", animClass: "animate-float-c", delay: 0.8 },
  { bottom: "14%", right: "4%", animClass: "animate-float-a", delay: 2.2 },
  { top: "42%", left: "3%", animClass: "animate-float-b", delay: 3 },
  { top: "46%", right: "3%", animClass: "animate-float-c", delay: 1.2 },
  { top: "70%", left: "6%", animClass: "animate-float-a", delay: 2.7 },
  { top: "74%", right: "5%", animClass: "animate-float-b", delay: 0.5 },
];

export default function PlayerJoinPage({ params }: { params: Promise<{ code: string }> }) {
  const unwrappedParams = use(params);
  const code = unwrappedParams.code.toUpperCase();
  const router = useRouter();
  const { socket } = useSocket();

  const [name, setName] = useState("");
  const [playerClass, setPlayerClass] = useState("3 SD");
  const [selectedAvatar, setSelectedAvatar] = useState("lion");
  const [joined, setJoined] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [otherPlayers, setOtherPlayers] = useState<any[]>([]);
  const [gameTitle, setGameTitle] = useState("Kuis Bola Basket Kelas 3 SD");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const savedPlayer = localStorage.getItem(`quiz_player_${code}`);
    if (savedPlayer) {
      try {
        const parsed = JSON.parse(savedPlayer);
        setName(parsed.name || "");
        setPlayerClass(parsed.playerClass || "3 SD");
        if (parsed.avatar) setSelectedAvatar(parsed.avatar);
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

    const handleExplanation = () => {
      router.push(`/join/${code}/game`);
    };

    const handleQuestionStarted = () => {
      router.push(`/join/${code}/game`);
    };

    const handlePlayerJoined = (data: any) => {
      if (data.players) {
        setOtherPlayers(data.players);
      }
    };

    socket.on("game:explanation_started", handleExplanation);
    socket.on("game:question_started", handleQuestionStarted);
    socket.on("lobby:player_joined", handlePlayerJoined);

    return () => {
      socket.off("game:explanation_started", handleExplanation);
      socket.off("game:question_started", handleQuestionStarted);
      socket.off("lobby:player_joined", handlePlayerJoined);
    };
  }, [socket, code, router]);

  const handleJoinLobby = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !name.trim()) return;

    setErrorMsg("");
    setLoading(true);
    sound.playClick();

    socket.emit(
      "player:join_lobby",
      {
        code,
        name: name.trim(),
        playerClass: playerClass.trim(),
        avatar: selectedAvatar,
      },
      (res: any) => {
        setLoading(false);
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.success) {
          sound.playJoinPop();
          setPlayer(res.player);
          setJoined(true);
          localStorage.setItem(
            `quiz_player_${code}`,
            JSON.stringify({
              id: res.player.id,
              name: res.player.name,
              playerClass: res.player.playerClass,
              avatar: res.player.avatar || selectedAvatar,
            })
          );
          if (res.room) {
            setGameTitle(res.room.title || gameTitle);
            if (res.room.players) setOtherPlayers(res.room.players);
            if (res.room.status === "RUNNING" || res.room.status === "EXPLANATION") {
              router.push(`/join/${code}/game`);
            }
          }
        }
      }
    );
  };

  // Floating background bubbles for classmates and avatars (no emoji, real cute animal avatars)
  const floatingBubbles = useMemo(() => {
    const list: Array<{ name: string; avatarSrc: string; top?: string; left?: string; right?: string; bottom?: string; animClass: string; delay: number }> = [];

    const pool = otherPlayers.length > 0
      ? otherPlayers
      : [
          { name: "Budi", avatar: "lion" },
          { name: "Citra", avatar: "cat" },
          { name: "Dimas", avatar: "panda" },
          { name: "Siti", avatar: "fox" },
          { name: "Rizky", avatar: "lion" },
          { name: "Eka", avatar: "cat" },
        ];

    pool.forEach((p, index) => {
      const pos = DEFAULT_FLOATING_POSITIONS[index % DEFAULT_FLOATING_POSITIONS.length];
      list.push({
        name: p.name,
        avatarSrc: getAvatarSrc(p.avatar || ANIMAL_AVATARS[index % ANIMAL_AVATARS.length].id),
        ...pos,
      });
    });

    return list;
  }, [otherPlayers]);

  return (
    <main className="relative min-h-screen flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto w-full select-none overflow-x-hidden">
      {/* Floating Ambient Classmates in Background when in Waiting Room */}
      {joined && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {floatingBubbles.map((bubble, idx) => (
            <div
              key={idx}
              className={`absolute px-3 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md border-2 border-slate-200 shadow-md flex items-center gap-2 text-xs font-black text-[#0F172A] font-heading select-none transition-transform opacity-85 sm:opacity-95 ${bubble.animClass}`}
              style={{
                top: bubble.top,
                left: bubble.left,
                right: bubble.right,
                bottom: bubble.bottom,
                animationDelay: `${bubble.delay}s`,
              }}
            >
              <div className="w-6 h-6 rounded-lg overflow-hidden border border-slate-300 shrink-0 relative">
                <img
                  src={bubble.avatarSrc}
                  alt={bubble.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="truncate max-w-[80px] sm:max-w-[100px]">{bubble.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Top Navbar Header */}
      <header className="relative z-10 flex items-center justify-between pb-3.5 border-b-2 border-slate-200/90 w-full">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FF5B00] border-2 border-[#C2410C] flex items-center justify-center text-xl text-white shadow-md font-black transform -rotate-2 hover:rotate-0 transition-transform">
            🏀
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-[#0F172A] font-heading tracking-tight">
              Digital Learn
            </h1>
            <p className="text-xs font-mono font-bold text-[#FF5B00]">
              Kode Ruang: <span className="tracking-wider">{code}</span>
            </p>
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
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 my-auto py-4 w-full">
        {!joined ? (
          /* Registration Form Card with 4 Cute Animal Avatar Selector */
          <Card className="bg-white border-2 border-slate-300 shadow-xl overflow-hidden animate-pop-in">
            {/* Card Header with Active Avatar Preview */}
            <CardHeader className="text-center pb-3 pt-6 space-y-3 bg-gradient-to-b from-orange-50/70 to-transparent">
              <div className="relative mx-auto w-fit">
                <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-2xl shadow-[#FF5B00]/30 animate-pulse-glow bg-white">
                  <img
                    src={getAvatarSrc(selectedAvatar)}
                    alt="Selected Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div>
                <CardTitle className="text-2xl sm:text-3xl">Identitas Peserta</CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  Pilih karakter hewan favoritmu dan masukkan nama!
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-1">
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-700 text-xs font-bold text-center animate-shake">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleJoinLobby} className="space-y-4">
                {/* 4 Cute Animal Avatar Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-700 font-heading">
                    Pilih Karakter Hewan
                  </label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {ANIMAL_AVATARS.map((av) => {
                      const isSelected = selectedAvatar === av.id;
                      return (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setSelectedAvatar(av.id);
                          }}
                          className={`btn-3d p-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-orange-50 border-[#FF5B00] ring-4 ring-orange-300/60 scale-105 shadow-md"
                              : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-xs">
                            <img
                              src={av.src}
                              alt={av.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-[11px] font-black font-heading text-slate-800">
                            {av.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 font-heading flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#FF5B00]" />
                    <span>Nama Lengkap / Panggilan</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Contoh: Andi Pratama"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={30}
                    className="h-13 text-sm sm:text-base font-bold"
                  />
                </div>

                {/* Class Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 font-heading flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-[#FF5B00]" />
                    <span>Kelas</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Contoh: 3 SD / 3A"
                    value={playerClass}
                    onChange={(e) => setPlayerClass(e.target.value)}
                    maxLength={20}
                    className="h-13 text-sm sm:text-base font-bold"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="arcadeOrange"
                    size="lg"
                    disabled={loading}
                    className="w-full flex items-center justify-between group cursor-pointer py-6"
                  >
                    <span className="w-6" />
                    <span className="text-base font-black font-heading tracking-wide">
                      {loading ? "Memasuki Arena..." : "Masuk ke Arena Kuis"}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-white text-[#FF5B00] flex items-center justify-center shadow-md group-hover:translate-x-1 transition-transform">
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </div>
                  </Button>
                </div>
              </form>
            </CardContent>

            <CardFooter className="bg-slate-50 border-t-2 border-slate-100 p-3.5 text-center justify-center">
              <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                25 Soal &bull; Papan Lintasan 25 Petak
              </span>
            </CardFooter>
          </Card>
        ) : (
          /* Waiting Room Screen */
          <div className="space-y-4 animate-pop-in">
            {/* Player Identity Spotlight Card */}
            <Card className="bg-white border-2 border-slate-300 shadow-xl overflow-hidden">
              <div className="p-6 text-center space-y-4 bg-gradient-to-b from-orange-50/60 to-transparent">
                {/* Chosen Animal Icon Image Prominently Displayed Above Name */}
                <div className="mx-auto w-fit">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-2xl shadow-[#FF5B00]/30 bg-white">
                    <img
                      src={getAvatarSrc(player?.avatar || selectedAvatar)}
                      alt={player?.name || "Player Avatar"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Name Directly Below the Animal Avatar Icon */}
                <div className="space-y-1 pt-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] font-heading">
                    {player?.name}
                  </h2>
                  <p className="text-xs font-black text-[#FF5B00] font-heading">
                    {player?.playerClass || "Kelas 3"}
                  </p>
                </div>

                {/* Radar Live Beacon */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300/80 shadow-sm flex items-center gap-3.5 text-left">
                  <div className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-2xl bg-[#FF5B00] text-white shadow-md">
                    <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: "6s" }} />
                    <span className="absolute inset-0 rounded-2xl border-2 border-[#FF5B00] animate-ping opacity-40" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#0F172A] font-heading">
                      Menunggu Guru Memulai Kuis...
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium leading-tight mt-0.5">
                      Pertanyaan akan otomatis muncul serentak di HP begitu kuis dimulai oleh guru.
                    </p>
                  </div>
                </div>
              </div>

              {/* Classmates in Waiting Room */}
              {otherPlayers.length > 0 && (
                <div className="p-5 border-t-2 border-slate-100 bg-slate-50/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 font-heading uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#FF5B00]" />
                      <span>Teman di Ruang Tunggu ({otherPlayers.length})</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                    {otherPlayers.map((p) => {
                      const isMe = p.id === player?.id;
                      return (
                        <div
                          key={p.id}
                          className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all shadow-xs ${
                            isMe
                              ? "bg-orange-100 border-orange-300 text-[#FF5B00] font-black font-heading"
                              : "bg-white border-slate-200 text-slate-700"
                          }`}
                        >
                          <div className="w-5 h-5 rounded-md overflow-hidden border border-slate-300 shrink-0">
                            <img
                              src={getAvatarSrc(p.avatar)}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="truncate max-w-[110px]">{p.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>

            {/* Quick Game Rules Card */}
            <Card className="bg-white border-2 border-slate-300 shadow-md">
              <CardContent className="p-4 sm:p-5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-orange-100 text-[#FF5B00]">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-[#0F172A] font-heading uppercase tracking-wider">
                    Aturan Permainan 25 Tile:
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-black font-heading">Jawaban Benar</strong>
                      <span>Maju +1 tile di proyektor</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
                    <Flame className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-black font-heading">Jawaban Salah</strong>
                      <span>Tetap di posisi tile semula</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-2">
                    <Trophy className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-black font-heading">Puncak Juara</strong>
                      <span>Podium juara akhir di Tile 25</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <footer className="relative z-10 w-full text-center text-xs text-slate-400 pt-3 border-t-2 border-slate-200 font-medium">
        Digital Learn Interactive &bull; Kuis Kelas 25 Tile
      </footer>
    </main>
  );
}
