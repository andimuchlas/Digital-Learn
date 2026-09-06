"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { sound } from "@/lib/sound";
import { ANIMAL_AVATARS, getAvatarSrc } from "@/lib/avatars";
import {
  User,
  School,
  ArrowRight,
  Clock,
  Volume2,
  VolumeX,
  UserCheck,
  RotateCcw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [gameTitle, setGameTitle] = useState("Kuis Bola Basket Kelas 3 SD");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Restore player session from localStorage immediately on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`quiz_player_${code}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) {
          setName(parsed.name);
          setPlayerClass(parsed.playerClass || "3 SD");
          if (parsed.avatar) setSelectedAvatar(parsed.avatar);
          setPlayer(parsed);
          setJoined(true);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [code]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setEnabled(next);
  };

  // Rejoin room seamlessly on socket connection/reconnect
  useEffect(() => {
    if (!socket) return;

    const rejoinAndCheckState = () => {
      let saved = null;
      try {
        const raw = localStorage.getItem(`quiz_player_${code}`);
        if (raw) saved = JSON.parse(raw);
      } catch {}

      if (saved && saved.name) {
        socket.emit(
          "player:join_lobby",
          {
            code,
            name: saved.name,
            playerClass: saved.playerClass,
            avatar: saved.avatar,
            playerId: saved.id,
          },
          (res: any) => {
            if (res?.player) {
              setPlayer(res.player);
              setJoined(true);
            }
            if (res?.room) {
              const status = res.room.status;
              if (status === "RUNNING" || status === "EXPLANATION" || status === "INTERMISSION") {
                router.push(`/join/${code}/game`);
              }
            }
          }
        );
      } else {
        socket.emit("room:get_state", { code }, (res: any) => {
          if (res?.room) {
            const status = res.room.status;
            if (status === "RUNNING" || status === "EXPLANATION" || status === "INTERMISSION") {
              router.push(`/join/${code}/game`);
            }
          }
        });
      }
    };

    rejoinAndCheckState();
    socket.on("connect", rejoinAndCheckState);

    const handleStart = () => {
      router.push(`/join/${code}/game`);
    };

    socket.on("game:explanation_started", handleStart);
    socket.on("game:question_started", handleStart);

    return () => {
      socket.off("connect", rejoinAndCheckState);
      socket.off("game:explanation_started", handleStart);
      socket.off("game:question_started", handleStart);
    };
  }, [socket, code, router]);

  const handleJoinLobby = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !name.trim()) return;

    setErrorMsg("");
    setLoading(true);
    sound.playClick();

    // Check if rejoining existing saved player
    let existingId: string | undefined = undefined;
    try {
      const raw = localStorage.getItem(`quiz_player_${code}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.id) existingId = parsed.id;
      }
    } catch {}

    socket.emit(
      "player:join_lobby",
      {
        code,
        name: name.trim(),
        playerClass: playerClass.trim(),
        avatar: selectedAvatar,
        playerId: existingId,
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
            if (
              res.room.status === "RUNNING" ||
              res.room.status === "EXPLANATION" ||
              res.room.status === "INTERMISSION"
            ) {
              router.push(`/join/${code}/game`);
            }
          }
        }
      }
    );
  };

  const handleChangeProfile = () => {
    sound.playClick();
    localStorage.removeItem(`quiz_player_${code}`);
    setJoined(false);
    setPlayer(null);
  };

  return (
    <main className="min-h-[100dvh] flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto w-full select-none">
      {/* Top Navbar Header */}
      <header className="flex items-center justify-between pb-3.5 border-b-2 border-slate-200 w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF5B00] border-2 border-[#C2410C] flex items-center justify-center text-lg text-white shadow-md font-black">
            🏀
          </div>
          <div>
            <h1 className="text-sm font-black text-[#0F172A] font-heading tracking-tight">
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
      <div className="my-auto py-4 w-full">
        {!joined ? (
          /* Registration Form Card */
          <Card className="bg-white border-2 border-slate-300 shadow-xl overflow-hidden animate-pop-in">
            <CardHeader className="text-center pb-3 pt-6 space-y-3 bg-gradient-to-b from-orange-50/70 to-transparent">
              <div className="relative mx-auto w-fit">
                <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-2xl shadow-[#FF5B00]/30 bg-white">
                  <img
                    src={getAvatarSrc(selectedAvatar)}
                    alt="Selected Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div>
                <CardTitle className="text-2xl font-black font-heading text-[#0F172A]">Identitas Peserta</CardTitle>
                <CardDescription className="text-slate-600 mt-1 text-xs">
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
                          className={`flex flex-col items-center p-2 rounded-2xl border-2 transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#FF5B00] bg-orange-50 shadow-md scale-105"
                              : "border-slate-200 bg-slate-50 hover:bg-slate-100 opacity-75 hover:opacity-100"
                          }`}
                        >
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-300 bg-white shadow-xs">
                            <img
                              src={av.src}
                              alt={av.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span
                            className={`text-[10px] font-heading font-black mt-1 ${
                              isSelected ? "text-[#FF5B00]" : "text-slate-600"
                            }`}
                          >
                            {av.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name Input */}
                <div className="space-y-1.5">
                  <label htmlFor="name" className="block text-xs font-black text-slate-700 font-heading">
                    Nama Lengkap / Panggilan
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Ketik nama kamu..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      maxLength={20}
                      className="pl-10 h-12 rounded-2xl border-2 border-slate-300 focus:border-[#FF5B00] font-heading text-sm"
                    />
                  </div>
                </div>

                {/* Class Input */}
                <div className="space-y-1.5">
                  <label htmlFor="class" className="block text-xs font-black text-slate-700 font-heading">
                    Kelas
                  </label>
                  <div className="relative">
                    <School className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="class"
                      type="text"
                      placeholder="Contoh: 3 SD / 3A"
                      value={playerClass}
                      onChange={(e) => setPlayerClass(e.target.value)}
                      required
                      maxLength={15}
                      className="pl-10 h-12 rounded-2xl border-2 border-slate-300 focus:border-[#FF5B00] font-heading text-sm"
                    />
                  </div>
                </div>

                {/* Submit Join Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="arcadeOrange"
                    size="lg"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 group cursor-pointer py-6"
                  >
                    <span className="text-base font-black font-heading tracking-wide">
                      {loading ? "Memasuki Arena..." : "Masuk ke Arena Kuis"}
                    </span>
                    <ArrowRight className="w-5 h-5 stroke-[3] group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Clean, Persistent Waiting Room Screen */
          <div className="space-y-5 animate-pop-in">
            <Card className="bg-white border-2 border-slate-300 rounded-[36px] shadow-2xl p-7 text-center space-y-6">
              {/* Animal Avatar Icon */}
              <div className="mx-auto w-fit">
                <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-white shadow-2xl shadow-[#FF5B00]/40 bg-white">
                  <img
                    src={getAvatarSrc(player?.avatar || selectedAvatar)}
                    alt={player?.name || "Player Avatar"}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Name & Class (Large & Bold) */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] font-heading tracking-tight">
                    {player?.name}
                  </h2>
                  <span title="Tersambung"><UserCheck className="w-6 h-6 text-emerald-600" /></span>
                </div>
                <p className="text-sm font-black text-[#FF5B00] font-heading uppercase tracking-wider">
                  {player?.playerClass || "Kelas 3 SD"}
                </p>
              </div>

              {/* Large Prominent Status Box */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-[3px] border-amber-300 shadow-inner space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#FF5B00] text-white flex items-center justify-center mx-auto shadow-md">
                  <Clock className="w-6 h-6 animate-spin" style={{ animationDuration: "6s" }} />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-[#0F172A] font-heading uppercase tracking-wide pt-1">
                  MENUNGGU GURU MEMULAI KUIS...
                </h3>
                <p className="text-xs text-slate-500 font-bold">
                  Soal kuis akan otomatis muncul serentak di HP begitu guru memulai.
                </p>
              </div>

              {/* Reset/Change Profile Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleChangeProfile}
                  className="text-xs font-bold text-slate-400 hover:text-[#FF5B00] flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ganti Karakter / Nama Lain</span>
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <footer className="w-full text-center text-xs text-slate-400 pt-3 border-t-2 border-slate-200 font-bold">
        Digital Learn Interactive &bull; Kuis 25 Petak
      </footer>
    </main>
  );
}
