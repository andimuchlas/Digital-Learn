"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Shuffle,
  BookOpen,
  Sparkles,
  ArrowRight,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
} from "lucide-react";
import { sound } from "@/lib/sound";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BANKS_PER_PAGE = 5;

export default function NewGamePage() {
  const router = useRouter();
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [title, setTitle] = useState("Kuis Interaktif Kelas 3 SD");
  const [timerSeconds, setTimerSeconds] = useState(20);
  const [randomize, setRandomize] = useState(true);
  const [loading, setLoading] = useState(false);

  // Search & Pagination State for Bank Selection
  const [bankSearch, setBankSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const timerOptions = [10, 15, 20, 30, 45, 60];

  useEffect(() => {
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const targetBankId = urlParams?.get("bankId");

    fetch("/api/questions")
      .then((res) => res.json())
      .then((data) => {
        if (data.banks && data.banks.length > 0) {
          setBanks(data.banks);
          const matched = targetBankId ? data.banks.find((b: any) => b.id === targetBankId) : null;
          const chosen = matched || data.banks[0];
          setSelectedBankId(chosen.id);
          setTitle(chosen.title || "Kuis Interaktif");
        }
      })
      .catch((err) => console.warn("Failed to load question banks:", err));
  }, []);

  const handleBankChange = (bank: any) => {
    sound.playClick();
    setSelectedBankId(bank.id);
    setTitle(bank.title || "Kuis Interaktif");
  };

  // Filter banks based on search query
  const filteredBanks = useMemo(() => {
    const query = bankSearch.toLowerCase().trim();
    if (!query) return banks;
    return banks.filter(
      (b) =>
        b.title?.toLowerCase().includes(query) ||
        b.description?.toLowerCase().includes(query)
    );
  }, [banks, bankSearch]);

  // Reset page to 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [bankSearch]);

  const totalPages = Math.ceil(filteredBanks.length / BANKS_PER_PAGE) || 1;

  const paginatedBanks = useMemo(() => {
    const startIdx = (currentPage - 1) * BANKS_PER_PAGE;
    return filteredBanks.slice(startIdx, startIdx + BANKS_PER_PAGE);
  }, [filteredBanks, currentPage]);

  const selectedBank = banks.find((b) => b.id === selectedBankId);

  // Helper for page number pagination list
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
          {/* Bank Soal Selection with Search & Pagination */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider font-heading">
                Pilih Bank Soal
              </label>
              {banks.length > 0 && (
                <span className="text-slate-400 font-bold text-xs lowercase">
                  ({banks.length} tersedia)
                </span>
              )}
            </div>

            {/* Currently Selected Bank Banner (if selected) */}
            {selectedBank && (
              <div className="p-3.5 rounded-2xl bg-orange-50 border-2 border-orange-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="p-1.5 rounded-lg bg-[#FF5B00] text-white">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <div className="truncate">
                    <span className="text-[10px] font-black uppercase text-[#FF5B00] block">
                      Modul Terpilih
                    </span>
                    <span className="font-black text-[#0F172A] font-heading truncate block">
                      {selectedBank.title}
                    </span>
                  </div>
                </div>
                <Badge variant="glow" className="text-[10px] font-black shrink-0 ml-2">
                  {selectedBank.questionsCount || (selectedBank.questions && selectedBank.questions.length) || 0} Soal
                </Badge>
              </div>
            )}

            {/* Search Input for Question Banks */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari bank soal berdasarkan nama..."
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#FF5B00] transition-colors font-bold"
              />
              {bankSearch && (
                <button
                  type="button"
                  onClick={() => setBankSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Banks List */}
            {paginatedBanks.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-slate-500">
                  Tidak ada bank soal yang cocok dengan "{bankSearch}"
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
              <div className="space-y-2">
                {paginatedBanks.map((b) => {
                  const isSelected = selectedBankId === b.id;
                  const qCount = b.questionsCount || (b.questions && b.questions.length) || 0;

                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleBankChange(b)}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? "bg-orange-50 border-[#FF5B00] shadow-sm ring-1 ring-[#FF5B00]/30"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            isSelected ? "bg-[#FF5B00] text-white" : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-black text-[#0F172A] font-heading truncate">
                            {b.title}
                          </p>
                          <p className="text-[11px] text-slate-500 font-bold truncate">
                            {b.description || `${qCount} Soal Pilihan Ganda`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={isSelected ? "glow" : "default"}
                          className="text-[11px] font-bold"
                        >
                          {qCount} Soal
                        </Badge>
                        {isSelected && <Check className="w-4 h-4 text-[#FF5B00] stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 px-1">
                <span className="text-[11px] font-bold text-slate-500">
                  Halaman <span className="text-[#0F172A] font-black">{currentPage}</span> dari{" "}
                  <span className="text-[#0F172A] font-black">{totalPages}</span> ({filteredBanks.length} modul)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => {
                      sound.playClick();
                      setCurrentPage((p) => Math.max(1, p - 1));
                    }}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border-2 border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {paginationRange.map((item, idx) => {
                      if (item === "...") {
                        return (
                          <span key={`dots-${idx}`} className="px-1 text-slate-400 font-black text-xs">
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
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
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
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border-2 border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                    title="Halaman Berikutnya"
                  >
                    <span className="hidden sm:inline">Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
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
