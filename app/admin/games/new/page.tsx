"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, Shuffle, BookOpen, Sparkles, ArrowRight, Check } from "lucide-react";
import { sound } from "@/lib/sound";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewGamePage() {
  const router = useRouter();
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [title, setTitle] = useState("Kuis Interaktif Kelas 3 SD");
  const [timerSeconds, setTimerSeconds] = useState(20);
  const [randomize, setRandomize] = useState(true);
  const [loading, setLoading] = useState(false);

  const timerOptions = [10, 15, 20, 30, 45, 60];

  useEffect(() => {
    fetch("/api/questions")
      .then((res) => res.json())
      .then((data) => {
        if (data.banks && data.banks.length > 0) {
          setBanks(data.banks);
          const first = data.banks[0];
          setSelectedBankId(first.id);
          setTitle(first.title || "Kuis Interaktif");
        }
      })
      .catch((err) => console.warn("Failed to load question banks:", err));
  }, []);

  const handleBankChange = (bank: any) => {
    sound.playClick();
    setSelectedBankId(bank.id);
    setTitle(bank.title || "Kuis Interaktif");
  };

  const handleCreateLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    sound.playClick();

    const selectedBank = banks.find((b) => b.id === selectedBankId);

    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          questionTime: timerSeconds,
          randomize,
          bankId: selectedBank?.id !== "default-bank" ? selectedBank?.id : undefined,
          customQuestions: selectedBank?.questions,
        }),
      });

      const data = await res.json();
      if (data.success && data.lobbyCode) {
        sound.playJoinPop();
        try {
          sessionStorage.setItem(
            `session_data_${data.lobbyCode}`,
            JSON.stringify({
              title: data.title,
              questions: data.questions,
              questionTime: data.questionTime,
              totalQuestions: data.totalQuestions,
            })
          );
        } catch {}
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

  const selectedBank = banks.find((b) => b.id === selectedBankId);

  return (
    <div className="max-w-2xl mx-auto space-y-6 select-none">
      <div>
        <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] font-heading tracking-tight">
          Buat Ruang Kuis Interaktif
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-bold">
          Pilih bank soal, tentukan durasi timer per soal, dan buka ruang tunggu untuk murid.
        </p>
      </div>

      <Card className="bg-white rounded-[36px] p-6 sm:p-9 border-2 border-slate-300 shadow-xl space-y-6 animate-pop-in">
        <form onSubmit={handleCreateLobby} className="space-y-6">
          {/* Bank Soal Selection */}
          <div className="space-y-2.5">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider font-heading flex items-center justify-between">
              <span>Pilih Bank Soal</span>
              {banks.length > 0 && (
                <span className="text-slate-400 font-bold lowercase">({banks.length} tersedia)</span>
              )}
            </label>
            <div className="space-y-2">
              {banks.map((b) => {
                const isSelected = selectedBankId === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleBankChange(b)}
                    className={`w-full text-left p-4 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "bg-orange-50 border-[#FF5B00] shadow-sm"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`p-2.5 rounded-xl ${
                          isSelected ? "bg-[#FF5B00] text-white" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-black text-[#0F172A] font-heading">
                          {b.title}
                        </p>
                        <p className="text-[11px] text-slate-500 font-bold">
                          {b.description || `${b.questionsCount || (b.questions && b.questions.length) || 25} Soal Pilihan Ganda`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isSelected ? "glow" : "default"}
                        className="text-xs font-bold"
                      >
                        {b.questionsCount || (b.questions && b.questions.length) || 25} Soal
                      </Badge>
                      {isSelected && <Check className="w-4 h-4 text-[#FF5B00] stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

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
