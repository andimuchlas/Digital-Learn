"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  Search,
  FolderOpen,
  Play,
  Pencil,
  Trash2,
  X,
  HelpCircle,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { sound } from "@/lib/sound";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const BANKS_PER_PAGE = 6;

interface BankItem {
  id: string;
  title: string;
  description?: string | null;
  questionsCount?: number;
  createdAt?: string;
}

export default function QuestionBanksPage() {
  const router = useRouter();
  const [banks, setBanks] = useState<BankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Create Bank Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Bank Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBank, setEditingBank] = useState<BankItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Delete Bank Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBank, setDeletingBank] = useState<BankItem | null>(null);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/banks");
      const data = await res.json();
      if (data.banks) {
        setBanks(data.banks);
      }
    } catch (err) {
      console.error("Gagal memuat daftar bank soal:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const totalQuestions = banks.reduce((sum, b) => sum + (b.questionsCount || 0), 0);

  const filteredBanks = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return banks;
    return banks.filter(
      (b) =>
        b.title.toLowerCase().includes(query) ||
        (b.description && b.description.toLowerCase().includes(query))
    );
  }, [banks, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

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

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    sound.playClick();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.bank) {
        sound.playJoinPop();
        setShowCreateModal(false);
        setNewTitle("");
        setNewDescription("");
        // Refresh and navigate to newly created bank to start adding questions!
        router.push(`/admin/questions/${data.bank.id}`);
      } else {
        alert(data.error || "Gagal membuat modul bank soal");
      }
    } catch (err) {
      console.error("Error creating bank:", err);
      alert("Terjadi kesalahan saat membuat bank soal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (bank: BankItem, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    setEditingBank(bank);
    setEditTitle(bank.title);
    setEditDescription(bank.description || "");
    setShowEditModal(true);
  };

  const handleUpdateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBank || !editTitle.trim()) return;

    sound.playClick();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/banks/${editingBank.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.success && data.bank) {
        setBanks((prev) =>
          prev.map((b) => (b.id === editingBank.id ? { ...b, ...data.bank } : b))
        );
        setShowEditModal(false);
        setEditingBank(null);
      } else {
        alert(data.error || "Gagal memperbarui info bank soal");
      }
    } catch (err) {
      console.error("Error updating bank:", err);
      alert("Terjadi kesalahan saat memperbarui bank soal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (bank: BankItem, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    setDeletingBank(bank);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBank) return;

    sound.playClick();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/banks/${deletingBank.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setBanks((prev) => prev.filter((b) => b.id !== deletingBank.id));
        setShowDeleteModal(false);
        setDeletingBank(null);
      } else {
        alert(data.error || "Gagal menghapus bank soal");
      }
    } catch (err) {
      console.error("Error deleting bank:", err);
      alert("Terjadi kesalahan saat menghapus bank soal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-[36px] border-2 border-slate-300 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-orange-100 border border-orange-200 text-[#FF5B00] text-xs font-black font-heading">
            <Layers className="w-3.5 h-3.5" />
            <span>Manajemen Modul & Bank Soal</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] font-heading tracking-tight">
            Modul Bank Soal
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-bold max-w-2xl">
            Buat modul bank soal terlebih dahulu sesuai tema/materi pembelajaran, lalu kelola daftar pertanyaan di dalamnya untuk kuis interaktif.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              setShowCreateModal(true);
            }}
            className="btn-arcade-orange btn-3d px-6 py-3.5 rounded-2xl text-white text-xs sm:text-sm font-black font-heading flex items-center gap-2.5 cursor-pointer shadow-lg"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>Buat Bank Soal Baru</span>
          </button>
        </div>
      </div>

      {/* Stats Summary & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white p-5 rounded-3xl border-2 border-slate-300 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FF5B00] flex items-center justify-center font-heading">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider font-heading">
              Total Modul Bank
            </p>
            <p className="text-2xl font-black text-[#0F172A] font-heading mt-0.5">
              {banks.length} Modul
            </p>
          </div>
        </Card>

        <Card className="bg-white p-5 rounded-3xl border-2 border-slate-300 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-heading">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider font-heading">
              Total Pertanyaan
            </p>
            <p className="text-2xl font-black text-[#0F172A] font-heading mt-0.5">
              {totalQuestions} Soal
            </p>
          </div>
        </Card>

        <div className="relative flex items-center">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama bank soal atau deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-full min-h-[58px] pl-12 pr-10 py-3.5 bg-white border-2 border-slate-300 rounded-3xl text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#FF5B00] transition-colors shadow-sm font-bold"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Question Banks Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-[36px] border-2 border-slate-300">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#FF5B00] border-t-transparent mb-3"></div>
          <p className="text-sm font-black text-slate-600 font-heading">Memuat daftar bank soal...</p>
        </div>
      ) : filteredBanks.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white rounded-[36px] border-2 border-slate-300 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-orange-100 text-[#FF5B00] mx-auto flex items-center justify-center">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-[#0F172A] font-heading">
              {search ? "Bank Soal Tidak Ditemukan" : "Belum Ada Modul Bank Soal"}
            </h3>
            <p className="text-xs text-slate-500 font-bold max-w-md mx-auto">
              {search
                ? `Tidak ada bank soal yang cocok dengan kata kunci "${search}".`
                : "Mulai dengan membuat modul bank soal baru untuk menyusun kumpulan soal kuis Anda."}
            </p>
          </div>
          {search ? (
            <button
              onClick={() => setSearch("")}
              className="text-xs font-black text-[#FF5B00] hover:underline cursor-pointer"
            >
              Reset Pencarian
            </button>
          ) : (
            <button
              onClick={() => {
                sound.playClick();
                setShowCreateModal(true);
              }}
              className="btn-arcade-orange btn-3d px-6 py-3 rounded-2xl text-white text-xs font-black font-heading inline-flex items-center gap-2 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Buat Bank Soal Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {paginatedBanks.map((bank) => (
              <div
                key={bank.id}
                className="group bg-white rounded-[32px] border-2 border-slate-300 hover:border-orange-300 transition-all p-6 sm:p-7 shadow-md flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2.5 rounded-2xl bg-orange-100 text-[#FF5B00] border border-orange-200">
                        <BookOpen className="w-5 h-5" />
                      </span>
                      <Badge variant="glow" className="text-xs font-black">
                        {bank.questionsCount || 0} Pertanyaan
                      </Badge>
                    </div>

                    {/* Actions Top Right */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleOpenEdit(bank, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Judul/Deskripsi Modul"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleOpenDelete(bank, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus Modul Bank Soal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-[#0F172A] font-heading group-hover:text-[#FF5B00] transition-colors">
                      {bank.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed font-bold">
                      {bank.description || "Belum ada deskripsi untuk modul ini."}
                    </p>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t-2 border-slate-100 flex flex-wrap items-center gap-2.5">
                  <Button
                    asChild
                    variant="arcadeOrange"
                    size="default"
                    className="flex-1 py-2.5 cursor-pointer"
                  >
                    <Link
                      href={`/admin/questions/${bank.id}`}
                      onClick={() => sound.playClick()}
                      className="flex items-center justify-center gap-2"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span className="text-xs font-black font-heading uppercase">
                        Kelola Soal ({bank.questionsCount || 0})
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5 stroke-[3]" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="arcadeWhite"
                    size="default"
                    className="py-2.5 cursor-pointer"
                  >
                    <Link
                      href={`/admin/games/new?bankId=${bank.id}`}
                      onClick={() => sound.playClick()}
                      className="flex items-center justify-center gap-1.5 text-xs font-black font-heading"
                      title="Buat sesi kuis langsung dari bank soal ini"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-[#FF5B00]" />
                      <span>Mainkan</span>
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
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
                  className="px-3 py-2 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
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
                        className={`w-8 h-8 rounded-xl border-2 text-xs font-black font-heading transition-all cursor-pointer flex items-center justify-center ${
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
                  className="px-3 py-2 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Buat Bank Soal Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border-2 border-slate-300 rounded-[36px] p-7 shadow-2xl space-y-5 animate-pop-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-100 text-[#FF5B00]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-[#0F172A] font-heading">
                  Buat Modul Bank Soal Baru
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-bold">
              Tentukan judul dan topik modul. Setelah dibuat, Anda dapat langsung menambahkan pertanyaan ke modul ini.
            </p>

            <form onSubmit={handleCreateBank} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-black font-heading mb-1.5">
                  Judul Modul Bank Soal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Contoh: Kuis PJOK - Bola Basket Kelas 3 SD"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-2xl text-xs text-[#0F172A] font-bold focus:outline-none focus:border-[#FF5B00]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-black font-heading mb-1.5">
                  Deskripsi / Catatan Materi (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Pembahasan gerakan dasar dribble, passing, shooting, dan peraturan pertandingan..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-xs text-[#0F172A] font-bold focus:outline-none focus:border-[#FF5B00]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-arcade-white btn-3d px-5 py-2.5 rounded-xl text-slate-800 font-bold font-heading cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="btn-arcade-orange btn-3d px-6 py-2.5 rounded-xl text-white font-black font-heading cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <span>{isSubmitting ? "Menyimpan..." : "Simpan & Buat Soal"}</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Bank Soal */}
      {showEditModal && editingBank && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border-2 border-slate-300 rounded-[36px] p-7 shadow-2xl space-y-5 animate-pop-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-100 text-[#FF5B00]">
                  <Pencil className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-[#0F172A] font-heading">
                  Edit Info Modul Bank Soal
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBank} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-black font-heading mb-1.5">
                  Judul Modul Bank Soal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-2xl text-xs text-[#0F172A] font-bold focus:outline-none focus:border-[#FF5B00]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-black font-heading mb-1.5">
                  Deskripsi / Catatan Materi
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-xs text-[#0F172A] font-bold focus:outline-none focus:border-[#FF5B00]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-arcade-white btn-3d px-5 py-2.5 rounded-xl text-slate-800 font-bold font-heading cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !editTitle.trim()}
                  className="btn-arcade-orange btn-3d px-6 py-2.5 rounded-xl text-white font-black font-heading cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Perbarui Info"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus Bank Soal */}
      {showDeleteModal && deletingBank && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border-2 border-rose-300 rounded-[36px] p-7 shadow-2xl space-y-4 animate-pop-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-[#0F172A] font-heading">
                Hapus Modul Bank Soal?
              </h3>
              <p className="text-xs text-slate-600 font-bold">
                Apakah Anda yakin ingin menghapus bank soal{" "}
                <span className="text-[#0F172A] font-black">"{deletingBank.title}"</span>?
              </p>
              <p className="text-[11px] text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                Seluruh {deletingBank.questionsCount || 0} pertanyaan di dalam modul ini akan ikut terhapus secara permanen.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn-arcade-white btn-3d px-5 py-2.5 rounded-xl text-slate-800 font-bold font-heading cursor-pointer flex-1"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="btn-3d px-5 py-2.5 rounded-xl bg-rose-600 border-2 border-rose-700 text-white font-black font-heading cursor-pointer hover:bg-rose-700 flex-1 shadow-md"
              >
                {isSubmitting ? "Menghapus..." : "Ya, Hapus Modul"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
