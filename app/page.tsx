"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, ArrowRight, Gamepad2, Zap, Flame } from "lucide-react";
import { sound } from "@/lib/sound";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    sound.playClick();
    router.push(`/join/${code.trim().toUpperCase()}`);
  };

  return (
    <main className="relative min-h-screen flex flex-col justify-between px-4 py-6 sm:px-8 sm:py-8 select-none">
      {/* Top Header Navbar */}
      <header className="relative z-10 max-w-6xl mx-auto w-full flex items-center justify-between pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5B00] border-2 border-[#C2410C] flex items-center justify-center shadow-md text-white font-black text-2xl transform -rotate-3 hover:rotate-0 transition-transform">
            🏀
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-[#0F172A] font-heading">
              DIGITAL LEARN
            </h1>
            <p className="text-xs font-bold text-slate-500">Kuis Multiplayer &bull; Papan 25 Petak</p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative z-10 max-w-2xl mx-auto w-full text-center my-auto py-6 sm:py-10 space-y-6">
        {/* Main Punchy Headline */}
        <div>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#0F172A] tracking-tight leading-[1.08] mb-4 font-heading">
            Siap Jadi Juara <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5B00] via-[#FF7A00] to-[#E11D48]">
              Papan 25 Petak?
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-bold max-w-lg mx-auto leading-relaxed">
            Tantang teman sekelasmu serentak! Jawab 25 pertanyaan pilihan ganda dan raih puncak podium juara.
          </p>
        </div>

        {/* Interactive Join Card */}
        <Card className="bg-white rounded-[36px] p-6 sm:p-10 shadow-2xl border-2 border-slate-300 relative overflow-hidden animate-pop-in">
          <form onSubmit={handleJoin} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="lobby-code"
                className="block text-xs font-black text-slate-700 uppercase tracking-widest text-center font-heading"
              >
                KODE RUANG KUIS
              </label>
              <div className="relative max-w-md mx-auto">
                <input
                  id="lobby-code"
                  type="text"
                  placeholder="CONTOH: ABC123"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="w-full px-6 py-4 sm:py-5 bg-slate-50 border-2 border-slate-300 focus:border-[#FF5B00] focus:bg-white rounded-2xl sm:rounded-3xl text-center text-3xl sm:text-4xl font-black text-[#0F172A] uppercase placeholder:text-slate-400 focus:outline-none transition-all tracking-widest font-heading shadow-inner"
                  required
                />
              </div>
            </div>

            {/* Pill Submit Button */}
            <div className="max-w-md mx-auto pt-1">
              <Button
                type="submit"
                variant="arcadeOrange"
                size="lg"
                className="w-full py-5 px-8 rounded-2xl flex items-center justify-center gap-3 group cursor-pointer"
              >
                <span className="font-heading uppercase tracking-wider text-base sm:text-lg">
                  MASUK KE RUANG KUIS
                </span>
                <ArrowRight className="w-5 h-5 stroke-[3] group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t-2 border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500 font-bold">
            <Gamepad2 className="w-4 h-4 text-[#FF5B00]" />
            <span>Tanpa registrasi akun &bull; Cukup isi Nama & Kelas langsung di HP</span>
          </div>
        </Card>

        {/* Feature Badges Grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
          <Card className="bg-white p-4 rounded-3xl border-2 border-slate-300 text-center shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#FF5B00] flex items-center justify-center mx-auto mb-2 font-black">
              <Trophy className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm font-black text-[#0F172A] font-heading">25 Petak Lintasan</p>
            <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block font-medium">Visual progres balapan kelas</p>
          </Card>

          <Card className="bg-white p-4 rounded-3xl border-2 border-slate-300 text-center shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-[#2563EB] flex items-center justify-center mx-auto mb-2 font-black">
              <Zap className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm font-black text-[#0F172A] font-heading">Sinkron Serentak</p>
            <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block font-medium">Waktu & soal bersamaan</p>
          </Card>

          <Card className="bg-white p-4 rounded-3xl border-2 border-slate-300 text-center shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#059669] flex items-center justify-center mx-auto mb-2 font-black">
              <Flame className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm font-black text-[#0F172A] font-heading">Murni Jawaban</p>
            <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block font-medium">Skor benar, tanpa dadu</p>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full text-center text-xs text-slate-400 pt-6 sm:pt-8 border-t-2 border-slate-200 font-medium">
        Digital Learn &bull; Platform Kuis Interaktif Papan 25 Petak
      </footer>
    </main>
  );
}
