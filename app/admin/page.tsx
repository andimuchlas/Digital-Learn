"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Trophy,
  Play,
  Users,
  Clock,
  Sparkles,
  History,
  ArrowRight,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { sound } from "@/lib/sound";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const BANKS_PER_PAGE = 4;

export default function AdminDashboardPage() {
  const [banks, setBanks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Bank Soal Pagination & Search State
  const [bankSearch, setBankSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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

  // Filter banks by search
  const filteredBanks = useMemo(() => {
    const query = bankSearch.toLowerCase().trim();
    if (!query) return banks;
    return banks.filter(
      (b) =>
        b.title?.toLowerCase().includes(query) ||
        b.description?.toLowerCase().includes(query)
    );
  }, [banks, bankSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [bankSearch]);

  const totalPages = Math.ceil(filteredBanks.length / BANKS_PER_PAGE) || 1;

  const paginatedBanks = useMemo(() => {
    const startIdx = (currentPage - 1) * BANKS_PER_PAGE;
    return filteredBanks.slice(startIdx, startIdx + BANKS_PER_PAGE);
  }, [filteredBanks, currentPage]);

  const paginationRange = useMemo(() => {
    const delta = 1;
    const range: (number | string)[] = [];
    const left = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        range.push(i);
      } else if (range[range.length - 1] !== "...") {
        range.push("...");
      }
    }
    return range;
  }, [currentPage, totalPages]);

  const totalQuestions = banks.reduce((sum, b) => sum + (b.questionsCount || (b.questions && b.questions.length) || 0), 0);

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
                <span>Bank Soal</span>
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
              Total Modul Bank
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
              Total Soal Terdaftar
            </p>
            <p className="text-3xl font-black text-[#0F172A] font-heading mt-0.5">
              {totalQuestions || 25} Soal
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

      {/* Modul Bank Soal Aktif with Search & Pagination */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-lg font-black text-[#0F172A] flex items-center gap-2 font-heading">
            <BookOpen className="w-5 h-5 text-[#FF5B00]" />
            <span>Modul Bank Soal Aktif</span>
            <span className="text-xs font-bold text-slate-400">({banks.length} modul)</span>
          </h3>

          <div className="flex items-center gap-3">
            {/* Search bar inside header */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari modul bank..."
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white border-2 border-slate-200 rounded-2xl text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#FF5B00] transition-colors font-bold shadow-xs"
              />
              {bankSearch && (
                <button
                  type="button"
                  onClick={() => setBankSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <Link
              href="/admin/questions"
              className="text-xs font-black text-[#FF5B00] hover:text-[#C2410C] transition-colors font-heading flex items-center gap-1 shrink-0"
            >
              <span>Semua Bank Soal</span> &rarr;
            </Link>
          </div>
        </div>

        {paginatedBanks.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-[32px] border-2 border-slate-300 p-6 space-y-2">
            <p className="text-xs font-bold text-slate-500">
              Tidak ada modul bank soal yang cocok dengan "{bankSearch}"
            </p>
            <button
              type="button"
              onClick={() => setBankSearch("")}
              className="text-xs font-black text-[#FF5B00] hover:underline cursor-pointer"
            >
              Reset Pencarian
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedBanks.map((bank, index) => (
                <Card
                  key={bank.id || index}
                  className="bg-white p-6 sm:p-7 rounded-[32px] border-2 border-slate-300 shadow-md flex flex-col justify-between space-y-5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="default">
                        {bank.questionsCount || (bank.questions && bank.questions.length) || 0} Pertanyaan Pilihan Ganda
                      </Badge>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-mono font-bold">
                        <Clock className="w-3.5 h-3.5" /> 20-30s / soal
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-[#0F172A] font-heading">{bank.title}</h4>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed font-bold">
                      {bank.description || "Tidak ada deskripsi"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t-2 border-slate-100">
                    <Button asChild variant="arcadeOrange" className="flex-1">
                      <Link href={`/admin/games/new?bankId=${bank.id}`}>Gunakan untuk Kuis</Link>
                    </Button>
                    <Button asChild variant="arcadeWhite">
                      <Link href={`/admin/questions/${bank.id}`}>Kelola Soal</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Dashboard Bank Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-[28px] border-2 border-slate-300 shadow-sm">
                <span className="text-xs font-bold text-slate-500">
                  Menampilkan{" "}
                  <span className="text-[#0F172A] font-black">
                    {(currentPage - 1) * BANKS_PER_PAGE + 1} -{" "}
                    {Math.min(currentPage * BANKS_PER_PAGE, filteredBanks.length)}
                  </span>{" "}
                  dari <span className="text-[#0F172A] font-black">{filteredBanks.length}</span> modul bank soal
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => {
                      sound.playClick();
                      setCurrentPage((p) => Math.max(1, p - 1));
                    }}
                    className="px-3 py-1.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {paginationRange.map((item, idx) => {
                      if (item === "...") {
                        return (
                          <span key={`dots-${idx}`} className="px-1.5 text-slate-400 font-black text-xs">
                            ...
                          </span>
                        );
                      }
                      const pageNum = item as number;
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setCurrentPage(pageNum);
                          }}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border-2 text-xs font-black font-heading transition-all cursor-pointer flex items-center justify-center ${
                            isActive
                              ? "bg-[#FF5B00] border-[#C2410C] text-white shadow-xs"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      sound.playClick();
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                    }}
                    className="px-3 py-1.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
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
                    <td className="py-3.5 text-slate-600 font-bold">
                      {h.players?.length || 0} Murid
                    </td>
                    <td className="py-3.5">
                      <Badge
                        variant={
                          h.status === "FINISHED"
                            ? "success"
                            : h.status === "RUNNING" || h.status === "EXPLANATION" || h.status === "INTERMISSION"
                            ? "glow"
                            : "default"
                        }
                        className="text-[10px]"
                      >
                        {h.status === "FINISHED"
                          ? "Selesai"
                          : h.status === "RUNNING" || h.status === "EXPLANATION" || h.status === "INTERMISSION"
                          ? "Berlangsung"
                          : h.status === "LOBBY"
                          ? "Ruang Tunggu"
                          : h.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-slate-500 font-bold">
                      {new Date(h.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
