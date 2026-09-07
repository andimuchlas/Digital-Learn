"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Pencil,
  X,
  Play,
  Layers,
  Sparkles,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import { sound } from "@/lib/sound";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface QuestionItem {
  id?: string;
  bankId?: string;
  orderIndex: number;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD?: string | null;
  correctAnswer: "a" | "b" | "c" | "d";
}

interface BankDetail {
  id: string;
  title: string;
  description?: string | null;
  questionsCount?: number;
  questions: QuestionItem[];
}

export default function BankQuestionsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const bankId = unwrappedParams.id;
  const router = useRouter();

  const [bank, setBank] = useState<BankDetail | null>(null);
  const [questionsList, setQuestionsList] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add Question Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newText, setNewText] = useState("");
  const [newOptA, setNewOptA] = useState("");
  const [newOptB, setNewOptB] = useState("");
  const [newOptC, setNewOptC] = useState("");
  const [newOptD, setNewOptD] = useState("");
  const [newCorrect, setNewCorrect] = useState<"a" | "b" | "c" | "d">("a");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Question Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [editText, setEditText] = useState("");
  const [editOptA, setEditOptA] = useState("");
  const [editOptB, setEditOptB] = useState("");
  const [editOptC, setEditOptC] = useState("");
  const [editOptD, setEditOptD] = useState("");
  const [editCorrect, setEditCorrect] = useState<"a" | "b" | "c" | "d">("a");

  // Edit Bank Info Modal State
  const [showEditBankModal, setShowEditBankModal] = useState(false);
  const [bankTitle, setBankTitle] = useState("");
  const [bankDescription, setBankDescription] = useState("");

  // Delete Question Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const fetchBankDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/banks/${bankId}`);
      const data = await res.json();
      if (data.bank) {
        setBank(data.bank);
        setBankTitle(data.bank.title);
        setBankDescription(data.bank.description || "");
        setQuestionsList(data.bank.questions || []);
      }
    } catch (err) {
      console.error("Gagal memuat detail bank soal:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankDetail();
  }, [bankId]);

  const filteredQuestions = questionsList.filter(
    (q) =>
      q.text.toLowerCase().includes(search.toLowerCase()) ||
      q.optionA.toLowerCase().includes(search.toLowerCase()) ||
      q.optionB.toLowerCase().includes(search.toLowerCase()) ||
      q.optionC.toLowerCase().includes(search.toLowerCase()) ||
      (q.optionD && q.optionD.toLowerCase().includes(search.toLowerCase()))
  );

  // Add Question Handler
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !newOptA.trim() || !newOptB.trim() || !newOptC.trim()) return;

    sound.playClick();
    setIsSubmitting(true);

    const newQ: QuestionItem = {
      bankId,
      orderIndex: questionsList.length + 1,
      text: newText.trim(),
      optionA: newOptA.trim(),
      optionB: newOptB.trim(),
      optionC: newOptC.trim(),
      optionD: newOptD.trim() || undefined,
      correctAnswer: newCorrect,
    };

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQ),
      });

      const data = await res.json();
      if (data.success && data.question) {
        sound.playCorrect();
        setQuestionsList((prev) => [...prev, data.question]);
        setNewText("");
        setNewOptA("");
        setNewOptB("");
        setNewOptC("");
        setNewOptD("");
        setNewCorrect("a");
        setShowAddModal(false);
      } else {
        alert(data.error || "Gagal menambahkan pertanyaan");
      }
    } catch (err) {
      console.error("Error adding question:", err);
      alert("Terjadi kesalahan saat menyimpan pertanyaan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Question Modal
  const handleOpenEditQuestion = (q: QuestionItem, index: number) => {
    sound.playClick();
    setEditingIndex(index);
    setEditingQuestion(q);
    setEditText(q.text);
    setEditOptA(q.optionA);
    setEditOptB(q.optionB);
    setEditOptC(q.optionC);
    setEditOptD(q.optionD || "");
    setEditCorrect(q.correctAnswer);
    setShowEditModal(true);
  };

  // Update Question Handler
  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIndex === null || !editingQuestion) return;
    if (!editText.trim() || !editOptA.trim() || !editOptB.trim() || !editOptC.trim()) return;

    sound.playClick();
    setIsSubmitting(true);

    const updatedData = {
      text: editText.trim(),
      optionA: editOptA.trim(),
      optionB: editOptB.trim(),
      optionC: editOptC.trim(),
      optionD: editOptD.trim() || null,
      correctAnswer: editCorrect,
    };

    try {
      if (editingQuestion.id && !editingQuestion.id.startsWith("seed-")) {
        const res = await fetch(`/api/questions/${editingQuestion.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error);
        }
      }

      setQuestionsList((prev) =>
        prev.map((q, i) => (i === editingIndex ? { ...q, ...updatedData } : q))
      );
      setShowEditModal(false);
      setEditingQuestion(null);
      setEditingIndex(null);
    } catch (err) {
      console.error("Error updating question:", err);
      alert("Terjadi kesalahan saat memperbarui pertanyaan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Question Modal
  const handleOpenDeleteQuestion = (index: number) => {
    sound.playClick();
    setDeletingIndex(index);
    setShowDeleteModal(true);
  };

  // Confirm Delete Question Handler
  const handleConfirmDeleteQuestion = async () => {
    if (deletingIndex === null) return;
    const targetQ = questionsList[deletingIndex];

    sound.playClick();
    setIsSubmitting(true);

    try {
      if (targetQ?.id && !targetQ.id.startsWith("seed-")) {
        await fetch(`/api/questions/${targetQ.id}`, {
          method: "DELETE",
        });
      }

      setQuestionsList((prev) => prev.filter((_, i) => i !== deletingIndex));
      setShowDeleteModal(false);
      setDeletingIndex(null);
    } catch (err) {
      console.error("Error deleting question:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Bank Header Info
  const handleUpdateBankInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankTitle.trim()) return;

    sound.playClick();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/banks/${bankId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bankTitle.trim(),
          description: bankDescription.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.success && data.bank) {
        setBank((prev) => (prev ? { ...prev, ...data.bank } : data.bank));
        setShowEditBankModal(false);
      } else {
        alert(data.error || "Gagal memperbarui informasi modul");
      }
    } catch (err) {
      console.error("Error updating bank info:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/questions"
          onClick={() => sound.playClick()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border-2 border-slate-300 text-xs font-black font-heading text-slate-700 hover:border-slate-400 transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          <span>Kembali ke Semua Bank Soal</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="arcadeOrange"
            size="sm"
            className="cursor-pointer shadow-md"
          >
            <Link
              href={`/admin/games/new?bankId=${bankId}`}
              onClick={() => sound.playClick()}
              className="flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="text-xs font-black font-heading uppercase">Mainkan Kuis</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero Bank Info Card */}
      <Card className="bg-white p-6 sm:p-8 rounded-[36px] border-2 border-slate-300 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-orange-100 text-[#FF5B00] border border-orange-200 text-xs font-black font-heading flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Modul Bank Soal</span>
              </span>
              <Badge variant="glow" className="text-xs font-black">
                {questionsList.length} Soal Terdaftar
              </Badge>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] font-heading tracking-tight">
              {bank?.title || "Memuat Modul..."}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 font-bold max-w-3xl leading-relaxed">
              {bank?.description || "Tidak ada deskripsi tambahan untuk modul ini."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                sound.playClick();
                setShowEditBankModal(true);
              }}
              className="p-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Edit Judul & Deskripsi Modul"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setShowAddModal(true);
              }}
              className="btn-arcade-orange btn-3d px-5 py-3 rounded-2xl text-white text-xs font-black font-heading flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah Pertanyaan</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari pertanyaan atau opsi jawaban di modul ini..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-5 py-3.5 bg-white border-2 border-slate-300 rounded-2xl text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#FF5B00] transition-colors shadow-sm font-bold"
        />
      </div>

      {/* Questions Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-[36px] border-2 border-slate-300">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#FF5B00] border-t-transparent mb-3"></div>
          <p className="text-sm font-black text-slate-600 font-heading">Memuat daftar soal...</p>
        </div>
      ) : questionsList.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white rounded-[36px] border-2 border-slate-300 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-orange-100 text-[#FF5B00] mx-auto flex items-center justify-center">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-[#0F172A] font-heading">
              Modul Ini Belum Memiliki Soal
            </h3>
            <p className="text-xs text-slate-500 font-bold max-w-md mx-auto">
              Mulai tambahkan pertanyaan pilihan ganda pertama ke dalam bank soal ini.
            </p>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              setShowAddModal(true);
            }}
            className="btn-arcade-orange btn-3d px-6 py-3 rounded-2xl text-white text-xs font-black font-heading inline-flex items-center gap-2 cursor-pointer mt-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Pertanyaan Pertama</span>
          </button>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-[36px] border-2 border-slate-300">
          <p className="text-sm font-black text-slate-600 font-heading">
            Tidak ada soal yang cocok dengan pencarian "{search}"
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuestions.map((q, idx) => {
            const actualIndex = questionsList.findIndex((item) => item === q);
            const displayNumber = q.orderIndex || idx + 1;

            return (
              <div
                key={q.id || idx}
                className="bg-white p-5 sm:p-6 rounded-[32px] border-2 border-slate-300 hover:border-slate-400 transition-all space-y-4 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="px-3 py-1 rounded-xl bg-orange-100 text-[#FF5B00] font-heading text-xs font-black shrink-0 border border-orange-200">
                      #{displayNumber}
                    </span>
                    <p className="flex-1 text-sm font-black text-[#0F172A] font-heading leading-snug">
                      {q.text}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditQuestion(q, actualIndex >= 0 ? actualIndex : idx)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Soal"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteQuestion(actualIndex >= 0 ? actualIndex : idx)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus Soal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Options grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div
                      className={`p-3 rounded-2xl border-2 flex items-center justify-between ${
                        q.correctAnswer === "a"
                          ? "bg-emerald-100 border-emerald-400 text-emerald-950 font-black"
                          : "bg-slate-50 border-slate-200 text-slate-700 font-bold"
                      }`}
                    >
                      <span className="truncate">A. {q.optionA}</span>
                      {q.correctAnswer === "a" && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[3] shrink-0 ml-1" />
                      )}
                    </div>

                    <div
                      className={`p-3 rounded-2xl border-2 flex items-center justify-between ${
                        q.correctAnswer === "b"
                          ? "bg-emerald-100 border-emerald-400 text-emerald-950 font-black"
                          : "bg-slate-50 border-slate-200 text-slate-700 font-bold"
                      }`}
                    >
                      <span className="truncate">B. {q.optionB}</span>
                      {q.correctAnswer === "b" && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[3] shrink-0 ml-1" />
                      )}
                    </div>

                    <div
                      className={`p-3 rounded-2xl border-2 flex items-center justify-between ${
                        q.correctAnswer === "c"
                          ? "bg-emerald-100 border-emerald-400 text-emerald-950 font-black"
                          : "bg-slate-50 border-slate-200 text-slate-700 font-bold"
                      }`}
                    >
                      <span className="truncate">C. {q.optionC}</span>
                      {q.correctAnswer === "c" && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[3] shrink-0 ml-1" />
                      )}
                    </div>

                    {q.optionD ? (
                      <div
                        className={`p-3 rounded-2xl border-2 flex items-center justify-between ${
                          q.correctAnswer === "d"
                            ? "bg-emerald-100 border-emerald-400 text-emerald-950 font-black"
                            : "bg-slate-50 border-slate-200 text-slate-700 font-bold"
                        }`}
                      >
                        <span className="truncate">D. {q.optionD}</span>
                        {q.correctAnswer === "d" && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[3] shrink-0 ml-1" />
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-300 font-bold text-center flex items-center justify-center">
                        <span className="text-[11px]">- Opsi D Kosong -</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Tambah Pertanyaan Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border-2 border-slate-300 rounded-[36px] p-7 shadow-2xl space-y-4 animate-pop-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-100 text-[#FF5B00]">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <h3 className="text-xl font-black text-[#0F172A] font-heading">
                  Tambah Pertanyaan Baru
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-black font-heading mb-1.5">
                  Teks Pertanyaan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  autoFocus
                  placeholder="Contoh: Berapa jumlah pemain bola basket dalam satu tim?"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-[#0F172A] focus:outline-none focus:border-[#FF5B00] font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-black font-heading mb-1">
                    Opsi A <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newOptA}
                    onChange={(e) => setNewOptA(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-300 rounded-2xl text-[#0F172A] focus:outline-none focus:border-[#FF5B00] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-black font-heading mb-1">
                    Opsi B <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newOptB}
                    onChange={(e) => setNewOptB(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-300 rounded-2xl text-[#0F172A] focus:outline-none focus:border-[#FF5B00] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-black font-heading mb-1">
                    Opsi C <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newOptC}
                    onChange={(e) => setNewOptC(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-300 rounded-2xl text-[#0F172A] focus:outline-none focus:border-[#FF5B00] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-heading mb-1">Opsi D (Opsional)</label>
                  <input
                    type="text"
                    value={newOptD}
                    onChange={(e) => setNewOptD(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-300 rounded-2xl text-[#0F172A] focus:outline-none focus:border-[#FF5B00] font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-black font-heading mb-1">
                  Kunci Jawaban Benar
                </label>
                <p className="text-[11px] text-slate-500 font-bold mb-2">
                  Pilih 1 opsi yang menjadi jawaban tepat:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {(["a", "b", "c", "d"] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setNewCorrect(key);
                      }}
                      className={`btn-3d py-2 rounded-2xl border-2 font-black uppercase font-heading transition-all cursor-pointer ${
                        newCorrect === key
                          ? "bg-[#FF5B00] border-[#C2410C] text-white shadow-md"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      Opsi {key}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-arcade-white btn-3d px-5 py-2 rounded-xl text-slate-800 font-bold font-heading cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-arcade-orange btn-3d px-6 py-2 rounded-xl text-white font-black font-heading cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Soal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Pertanyaan */}
      {showEditModal && editingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border-2 border-slate-300 rounded-[36px] p-7 shadow-2xl space-y-4 animate-pop-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-100 text-[#FF5B00]">
                  <Pencil className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-[#0F172A] font-heading">
                  Edit Pertanyaan
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateQuestion} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-black font-heading mb-1.5">
                  Teks Pertanyaan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-[#0F172A] focus:outline-none focus:border-[#FF5B00] font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-black font-heading mb-1">
                    Opsi A <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editOptA}
                    onChange={(e) => setEditOptA(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-300 rounded-2xl text-[#0F172A] focus:outline-none focus:border-[#FF5B00] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-black font-heading mb-1">
                    Opsi B <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editOptB}
                    onChange={(e) => setEditOptB(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-300 rounded-2xl text-[#0F172A] focus:outline-none focus:border-[#FF5B00] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-black font-heading mb-1">
                    Opsi C <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editOptC}
                    onChange={(e) => setEditOptC(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-300 rounded-2xl text-[#0F172A] focus:outline-none focus:border-[#FF5B00] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-heading mb-1">Opsi D (Opsional)</label>
                  <input
                    type="text"
                    value={editOptD}
                    onChange={(e) => setEditOptD(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-300 rounded-2xl text-[#0F172A] focus:outline-none focus:border-[#FF5B00] font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-black font-heading mb-1">
                  Kunci Jawaban Benar
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["a", "b", "c", "d"] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setEditCorrect(key);
                      }}
                      className={`btn-3d py-2 rounded-2xl border-2 font-black uppercase font-heading transition-all cursor-pointer ${
                        editCorrect === key
                          ? "bg-[#FF5B00] border-[#C2410C] text-white shadow-md"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      Opsi {key}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-arcade-white btn-3d px-5 py-2 rounded-xl text-slate-800 font-bold font-heading cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-arcade-orange btn-3d px-6 py-2 rounded-xl text-white font-black font-heading cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Perbarui Soal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Modul Info */}
      {showEditBankModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border-2 border-slate-300 rounded-[36px] p-7 shadow-2xl space-y-4 animate-pop-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-100 text-[#FF5B00]">
                  <Pencil className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-[#0F172A] font-heading">
                  Edit Informasi Modul
                </h3>
              </div>
              <button
                onClick={() => setShowEditBankModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBankInfo} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-black font-heading mb-1.5">
                  Judul Modul Bank Soal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bankTitle}
                  onChange={(e) => setBankTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-2xl text-xs text-[#0F172A] font-bold focus:outline-none focus:border-[#FF5B00]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-black font-heading mb-1.5">
                  Deskripsi / Cakupan Materi
                </label>
                <textarea
                  rows={3}
                  value={bankDescription}
                  onChange={(e) => setBankDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-xs text-[#0F172A] font-bold focus:outline-none focus:border-[#FF5B00]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditBankModal(false)}
                  className="btn-arcade-white btn-3d px-5 py-2.5 rounded-xl text-slate-800 font-bold font-heading cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !bankTitle.trim()}
                  className="btn-arcade-orange btn-3d px-6 py-2.5 rounded-xl text-white font-black font-heading cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus Pertanyaan */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border-2 border-rose-300 rounded-[36px] p-7 shadow-2xl space-y-4 animate-pop-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-[#0F172A] font-heading">
                Hapus Pertanyaan Ini?
              </h3>
              <p className="text-xs text-slate-600 font-bold">
                Pertanyaan akan dihapus dari bank soal ini dan tidak dapat dikembalikan.
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
                onClick={handleConfirmDeleteQuestion}
                disabled={isSubmitting}
                className="btn-3d px-5 py-2.5 rounded-xl bg-rose-600 border-2 border-rose-700 text-white font-black font-heading cursor-pointer hover:bg-rose-700 flex-1 shadow-md"
              >
                {isSubmitting ? "Menghapus..." : "Ya, Hapus Soal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
