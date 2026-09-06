"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Shuffle, BookOpen, Sparkles, ArrowRight } from "lucide-react";
import { DEFAULT_BASKETBALL_BANK } from "@/lib/default-questions";
import { sound } from "@/lib/sound";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewGamePage() {
  const router = useRouter();
  const [title, setTitle] = useState("Kuis Bola Basket Kelas 3 SD");
  const [timerSeconds, setTimerSeconds] = useState(20);
  const [randomize, setRandomize] = useState(true);
  const [loading, setLoading] = useState(false);

  const timerOptions = [10, 15, 20, 30, 45, 60];

  const handleCreateLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    sound.playClick();

    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          questionTime: timerSeconds,
          randomize,
          customQuestions: DEFAULT_BASKETBALL_BANK.questions,
        }),
      });

      const data = await res.json();
      if (data.success && data.lobbyCode) {
        sound.playJoinPop();
        router.push(`/admin/lobby/${data.lobbyCode}`);
      } else {
        alert(data.error || "Gagal membuat lobby");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat membuat sesi game");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 select-none">
      <div>
        <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] font-heading tracking-tight">
          Buat Ruang Kuis Kelas
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-bold">
          Tentukan durasi timer per soal sebelum membuka ruang tunggu untuk murid.
        </p>
      </div>

      <Card className="bg-white rounded-[36px] p-6 sm:p-9 border-2 border-slate-300 shadow-xl space-y-6 animate-pop-in">
        <form onSubmit={handleCreateLobby} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider font-heading">
              Judul Sesi Kuis
            </label>
            <Input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-13 text-sm font-bold"
            />
          </div>

          {/* Bank Soal Card */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider font-heading">
              Bank Soal Terpilih
            </label>
            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-orange-100 text-[#FF5B00]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-black text-[#0F172A] font-heading">
                    Kuis Bola Basket SD Kelas 3
                  </p>
                  <p className="text-[11px] text-slate-500 font-bold">25 Soal Pilihan Ganda Siap Dimainkan</p>
                </div>
              </div>
              <Badge variant="success" className="text-xs font-bold">
                25 Soal
              </Badge>
            </div>
          </div>

          {/* Timer Selection */}
          <div className="space-y-2.5">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider font-heading flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#FF5B00]" />
              <span>Durasi Timer Per Soal</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {timerOptions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setTimerSeconds(t);
                  }}
                  className={`py-3.5 rounded-2xl border-2 text-xs font-black font-heading transition-all cursor-pointer ${
                    timerSeconds === t
                      ? "bg-[#FF5B00] border-[#C2410C] text-white shadow-md scale-105"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {t}s
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 font-bold">
              Waktu yang diberikan kepada murid untuk memilih jawaban di setiap soal.
            </p>
          </div>

          {/* Randomize toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 text-[#2563EB]">
                <Shuffle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-black text-[#0F172A] font-heading">Acak Urutan Soal</p>
                <p className="text-[11px] text-slate-500 font-bold">
                  Semua peserta menerima urutan yang sama secara serentak.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={randomize}
                onChange={(e) => setRandomize(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-6.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF5B00]"></div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              variant="arcadeOrange"
              size="lg"
              className="w-full flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <span className="text-sm sm:text-base tracking-wider font-heading uppercase">
                {loading ? "MEMBUAT RUANG KUIS..." : "BUAT RUANG KUIS SEKARANG"}
              </span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
