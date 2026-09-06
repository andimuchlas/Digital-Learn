"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Trophy, Play, Users, Clock, Sparkles, History, ArrowRight, PlusCircle } from "lucide-react";
import { sound } from "@/lib/sound";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const [banks, setBanks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [qRes, gRes] = await Promise.all([
          fetch("/api/questions").then((r) => r.json()),
          fetch("/api/games").then((r) => r.json()),
        ]);

        if (qRes.banks) setBanks(qRes.banks);
        if (gRes.history) setHistory(gRes.history);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 select-none">
      {/* Hero Welcome Banner */}
      <Card className="relative p-6 sm:p-10 rounded-[36px] bg-white border-2 border-slate-300 shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] font-heading tracking-tight">
              Mulai Sesi Kuis Interaktif
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="arcadeOrange" size="lg" className="shadow-xl">
              <Link href="/admin/games/new" onClick={() => sound.playClick()}>
                <Play className="w-4 h-4 fill-current mr-1" />
                <span className="uppercase tracking-wider">BUAT KUIS BARU</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>

            <Button asChild variant="arcadeWhite" size="lg">
              <Link href="/admin/questions" onClick={() => sound.playClick()}>
                <BookOpen className="w-4 h-4 text-[#FF5B00] mr-1" />
                <span>Kelola Soal</span>
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white p-6 rounded-3xl border-2 border-slate-300 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 text-[#FF5B00] flex items-center justify-center font-heading">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider font-heading">
              Total Bank Soal
            </p>
            <p className="text-3xl font-black text-[#0F172A] font-heading mt-0.5">
              {banks.length || 1}
            </p>
          </div>
        </Card>

        <Card className="bg-white p-6 rounded-3xl border-2 border-slate-300 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-[#D97706] flex items-center justify-center font-heading">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider font-heading">
              Soal Siap Dimainkan
            </p>
            <p className="text-3xl font-black text-[#0F172A] font-heading mt-0.5">
              {banks[0]?.questionsCount || 25} Soal
            </p>
          </div>
        </Card>

        <Card className="bg-white p-6 rounded-3xl border-2 border-slate-300 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#059669] flex items-center justify-center font-heading">
            <History className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider font-heading">
              Sesi Terselesaikan
            </p>
            <p className="text-3xl font-black text-[#0F172A] font-heading mt-0.5">
              {history.length}
            </p>
          </div>
        </Card>
      </div>

      {/* Bank Soal Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-[#0F172A] flex items-center gap-2 font-heading">
            <BookOpen className="w-5 h-5 text-[#FF5B00]" />
            <span>Bank Soal Aktif</span>
          </h3>
          <Link
            href="/admin/questions"
            className="text-xs font-black text-[#FF5B00] hover:text-[#C2410C] transition-colors font-heading flex items-center gap-1"
          >
            <span>Semua Soal</span> &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banks.map((bank, index) => (
            <Card
              key={bank.id || index}
              className="bg-white p-6 sm:p-7 rounded-[32px] border-2 border-slate-300 shadow-md flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="default">
                    {bank.questionsCount || 25} Pertanyaan Pilihan Ganda
                  </Badge>
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-mono font-bold">
                    <Clock className="w-3.5 h-3.5" /> 20-30s / soal
                  </span>
                </div>
                <h4 className="text-lg font-black text-[#0F172A] font-heading">{bank.title}</h4>
                <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed font-bold">
                  {bank.description}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t-2 border-slate-100">
                <Button asChild variant="arcadeOrange" className="flex-1">
                  <Link href="/admin/games/new">Gunakan untuk Kuis</Link>
                </Button>
                <Button asChild variant="arcadeWhite">
                  <Link href="/admin/questions">Edit Soal</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-[#0F172A] flex items-center gap-2 font-heading">
            <History className="w-5 h-5 text-[#2563EB]" />
            <span>Riwayat Sesi Terakhir</span>
          </h3>

          <Card className="bg-white p-4 rounded-[32px] border-2 border-slate-300 shadow-md overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 border-b-2 border-slate-200 font-heading">
                <tr>
                  <th className="pb-3 font-bold">Kode Ruang</th>
                  <th className="pb-3 font-bold">Judul Sesi</th>
                  <th className="pb-3 font-bold">Jumlah Peserta</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 font-mono font-black text-[#FF5B00]">{h.code}</td>
                    <td className="py-3.5 text-[#0F172A] font-black font-heading">{h.title}</td>
                    <td className="py-3.5 text-slate-600 font-bold">{h.players?.length || 0} Murid</td>
                    <td className="py-3.5">
                      <Badge variant="success" className="text-[10px]">
                        {h.status === "FINISHED" ? "Selesai" : h.status === "RUNNING" ? "Berlangsung" : h.status === "LOBBY" ? "Ruang Tunggu" : h.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-slate-500 font-bold">
                      {new Date(h.createdAt).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}
