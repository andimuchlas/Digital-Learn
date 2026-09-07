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
  Eye,
  Calendar,
  Award,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { sound } from "@/lib/sound";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAvatarSrc } from "@/lib/avatars";

const BANKS_PER_PAGE = 4;
const HISTORY_PER_PAGE = 5;

export default function AdminDashboardPage() {
  const [banks, setBanks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Bank Soal Pagination & Search State
  const [bankSearch, setBankSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // History Pagination & Modal State
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedHistory, setSelectedHistory] = useState<any | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

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

  // History Pagination
  const totalHistoryPages = Math.ceil(history.length / HISTORY_PER_PAGE) || 1;
  const paginatedHistory = useMemo(() => {
    const startIdx = (historyPage - 1) * HISTORY_PER_PAGE;
    return history.slice(startIdx, startIdx + HISTORY_PER_PAGE);
  }, [history, historyPage]);

  const totalQuestions = banks.reduce(
    (sum, b) => sum + (b.questionsCount || (b.questions && b.questions.length) || 0),
    0
  );

  const handleOpenHistoryDetail = (h: any) => {
    sound.playClick();
    setSelectedHistory(h);
    setShowHistoryModal(true);
  };

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

      {/* History Table */}
      {history.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-[#0F172A] flex items-center gap-2 font-heading">
              <History className="w-5 h-5 text-[#2563EB]" />
              <span>Riwayat Sesi Terakhir</span>
              <span className="text-xs font-bold text-slate-400">({history.length} sesi)</span>
            </h3>
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">
              Klik pada baris untuk melihat detail hasil kuis
            </span>
          </div>

          <Card className="bg-white p-4 sm:p-5 rounded-[32px] border-2 border-slate-300 shadow-md overflow-x-auto space-y-4">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 border-b-2 border-slate-200 font-heading">
                <tr>
                  <th className="pb-3 font-bold">Kode Ruang</th>
                  <th className="pb-3 font-bold">Judul Sesi</th>
                  <th className="pb-3 font-bold">Jumlah Peserta</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold">Tanggal</th>
                  <th className="pb-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedHistory.map((h, i) => (
                  <tr
                    key={i}
                    onClick={() => handleOpenHistoryDetail(h)}
                    className="hover:bg-orange-50/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 font-mono font-black text-[#FF5B00]">{h.code}</td>
                    <td className="py-3.5 text-[#0F172A] font-black font-heading group-hover:text-[#FF5B00] transition-colors">
                      {h.title}
                    </td>
                    <td className="py-3.5 text-slate-600 font-bold">
                      {h.players?.length || 0} Murid
                    </td>
                    <td className="py-3.5">
                      <Badge
                        variant={
                          h.status === "FINISHED"
                            ? "success"
                            : h.status === "RUNNING" ||
                              h.status === "EXPLANATION" ||
                              h.status === "INTERMISSION"
                            ? "glow"
                            : "default"
                        }
                        className="text-[10px]"
                      >
                        {h.status === "FINISHED"
                          ? "Selesai"
                          : h.status === "RUNNING" ||
                            h.status === "EXPLANATION" ||
                            h.status === "INTERMISSION"
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
                    <td className="py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenHistoryDetail(h);
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-[#FF5B00] hover:text-white text-slate-600 transition-colors cursor-pointer inline-flex items-center gap-1.5 font-bold text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Detail</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* History Pagination */}
            {totalHistoryPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-bold">
                  Halaman <strong className="text-[#0F172A]">{historyPage}</strong> dari{" "}
                  <strong className="text-[#0F172A]">{totalHistoryPages}</strong>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={historyPage === 1}
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    disabled={historyPage === totalHistoryPages}
                    onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                    className="p-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Pop-Up Modal: Detail Riwayat Sesi */}
      {showHistoryModal && selectedHistory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border-2 border-slate-300 rounded-[36px] p-6 sm:p-8 shadow-2xl space-y-6 animate-pop-in max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b-2 border-slate-100">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-orange-100 text-[#FF5B00] border border-orange-200 text-xs font-mono font-black">
                    Kode: {selectedHistory.code}
                  </span>
                  <Badge
                    variant={
                      selectedHistory.status === "FINISHED"
                        ? "success"
                        : selectedHistory.status === "RUNNING"
                        ? "glow"
                        : "default"
                    }
                    className="text-xs"
                  >
                    {selectedHistory.status === "FINISHED"
                      ? "Selesai"
                      : selectedHistory.status === "RUNNING"
                      ? "Berlangsung"
                      : "Ruang Tunggu"}
                  </Badge>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#0F172A] font-heading">
                  {selectedHistory.title}
                </h3>
              </div>

              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Session Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-heading block">
                  Waktu Pelaksanaan
                </span>
                <p className="text-xs font-black text-[#0F172A]">
                  {new Date(selectedHistory.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className="text-[10px] text-slate-500 font-bold">
                  {new Date(selectedHistory.createdAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  WIB
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-heading block">
                  Total Soal
                </span>
                <p className="text-xs font-black text-[#0F172A]">
                  {selectedHistory.totalQuestions || 25} Soal
                </p>
                <p className="text-[10px] text-slate-500 font-bold">Pilihan Ganda</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-heading block">
                  Timer / Soal
                </span>
                <p className="text-xs font-black text-[#0F172A]">
                  {selectedHistory.questionTime || 20} Detik
                </p>
                <p className="text-[10px] text-slate-500 font-bold">Per Pertanyaan</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FF5B00] font-heading block">
                  Jumlah Peserta
                </span>
                <p className="text-xs font-black text-[#0F172A]">
                  {selectedHistory.players?.length || 0} Murid
                </p>
                <p className="text-[10px] text-slate-500 font-bold">Terdaftar</p>
              </div>
            </div>

            {/* Participants Leaderboard Table */}
            <div className="space-y-3">
              <h4 className="text-sm font-black text-[#0F172A] font-heading flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Hasil & Peringkat Murid</span>
              </h4>

              {selectedHistory.players && selectedHistory.players.length > 0 ? (
                <div className="border-2 border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-heading">
                      <tr>
                        <th className="p-3 font-bold w-16 text-center">Rank</th>
                        <th className="p-3 font-bold">Nama Murid</th>
                        <th className="p-3 font-bold">Kelas</th>
                        <th className="p-3 font-bold text-center">Petak Akhir</th>
                        <th className="p-3 font-bold text-center">Jawaban Benar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedHistory.players
                        .sort((a: any, b: any) => {
                          if (a.rank && b.rank) return a.rank - b.rank;
                          return (b.finalTile || 1) - (a.finalTile || 1);
                        })
                        .map((p: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-center font-black font-heading">
                              {idx === 0
                                ? "🥇 1"
                                : idx === 1
                                ? "🥈 2"
                                : idx === 2
                                ? "🥉 3"
                                : `#${idx + 1}`}
                            </td>
                            <td className="p-3 font-black text-[#0F172A] font-heading">
                              {p.playerName || p.name}
                            </td>
                            <td className="p-3 text-slate-600 font-bold">
                              {p.playerClass || "-"}
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant="default" className="text-[10px]">
                                Petak {p.finalTile || p.tile || 1} / {selectedHistory.totalQuestions || 25}
                              </Badge>
                            </td>
                            <td className="p-3 text-center font-heading text-emerald-700 font-black">
                              {p.correctAnswers || 0} / {selectedHistory.totalQuestions || 25} Benar
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-xs font-bold text-slate-500">
                    Belum ada data murid yang terekam pada sesi ini.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-slate-100 gap-3">
              {selectedHistory.status === "FINISHED" ? (
                <Button asChild variant="arcadeOrange" size="sm">
                  <Link
                    href={`/admin/game/${selectedHistory.code}/result`}
                    onClick={() => sound.playClick()}
                    className="flex items-center gap-1.5"
                  >
                    <Trophy className="w-4 h-4 mr-1" />
                    <span>Lihat Podium Juara</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="arcadeOrange" size="sm">
                  <Link
                    href={`/admin/lobby/${selectedHistory.code}`}
                    onClick={() => sound.playClick()}
                    className="flex items-center gap-1.5"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    <span>Masuk ke Ruang Tunggu</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              )}

              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="btn-arcade-white btn-3d px-5 py-2.5 rounded-xl text-slate-800 font-bold font-heading text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
