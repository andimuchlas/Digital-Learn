"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Plus, Search, CheckCircle2, Trash2, X } from "lucide-react";
import { DEFAULT_BASKETBALL_BANK } from "@/lib/default-questions";
import { sound } from "@/lib/sound";

export default function QuestionsManagerPage() {
  const [questionsList, setQuestionsList] = useState<any[]>(DEFAULT_BASKETBALL_BANK.questions);
  const [bankTitle, setBankTitle] = useState(DEFAULT_BASKETBALL_BANK.title);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // New question form state
  const [newText, setNewText] = useState("");
  const [newOptA, setNewOptA] = useState("");
  const [newOptB, setNewOptB] = useState("");
  const [newOptC, setNewOptC] = useState("");
  const [newOptD, setNewOptD] = useState("");
  const [newCorrect, setNewCorrect] = useState<"a" | "b" | "c" | "d">("a");

  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then((data) => {
        if (data.banks && data.banks.length > 0) {
          const b = data.banks[0];
          setBankTitle(b.title);
          if (b.questions && b.questions.length > 0) {
            setQuestionsList(b.questions);
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const filteredQuestions = questionsList.filter(
    (q) =>
      q.text.toLowerCase().includes(search.toLowerCase()) ||
      q.optionA.toLowerCase().includes(search.toLowerCase()) ||
      q.optionB.toLowerCase().includes(search.toLowerCase()) ||
      q.optionC.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText || !newOptA || !newOptB || !newOptC) return;
    sound.playClick();

    const newQ = {
      orderIndex: questionsList.length + 1,
      text: newText,
      optionA: newOptA,
      optionB: newOptB,
      optionC: newOptC,
      optionD: newOptD || undefined,
      correctAnswer: newCorrect,
    };

    setQuestionsList([...questionsList, newQ]);

    fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newQ),
    }).catch(console.error);

    setNewText("");
    setNewOptA("");
    setNewOptB("");
    setNewOptC("");
    setNewOptD("");
    setNewCorrect("a");
    setShowAddModal(false);
  };

  const handleDelete = (index: number) => {
    sound.playClick();
    const updated = questionsList.filter((_, i) => i !== index);
    setQuestionsList(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] font-heading">{bankTitle}</h2>
          <p className="text-xs text-slate-500 font-bold mt-1">Total {questionsList.length} soal kuis terdaftar</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              setShowAddModal(true);
            }}
            className="btn-arcade-orange btn-3d px-5 py-3 rounded-2xl text-white text-xs font-black font-heading flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Pertanyaan</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari pertanyaan atau opsi jawaban..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-5 py-3.5 bg-white border-2 border-slate-300 rounded-2xl text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#FF5B00] transition-colors shadow-sm font-bold"
        />
      </div>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredQuestions.map((q, idx) => (
          <div
            key={idx}
            className="bg-white p-5 sm:p-6 rounded-[32px] border-2 border-slate-300 hover:border-slate-400 transition-all space-y-3.5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="px-3 py-1 rounded-xl bg-orange-100 text-[#FF5B00] font-heading text-xs font-black shrink-0 border border-orange-200">
                #{idx + 1}
              </span>
              <p className="flex-1 text-sm font-black text-[#0F172A] font-heading leading-snug">{q.text}</p>
              <button
                onClick={() => handleDelete(idx)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                title="Hapus soal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
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
                {q.correctAnswer === "a" && <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[3] shrink-0 ml-1" />}
              </div>

              <div
                className={`p-3 rounded-2xl border-2 flex items-center justify-between ${
                  q.correctAnswer === "b"
                    ? "bg-emerald-100 border-emerald-400 text-emerald-950 font-black"
                    : "bg-slate-50 border-slate-200 text-slate-700 font-bold"
                }`}
              >
                <span className="truncate">B. {q.optionB}</span>
                {q.correctAnswer === "b" && <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[3] shrink-0 ml-1" />}
              </div>

              <div
                className={`p-3 rounded-2xl border-2 flex items-center justify-between ${
                  q.correctAnswer === "c"
                    ? "bg-emerald-100 border-emerald-400 text-emerald-950 font-black"
                    : "bg-slate-50 border-slate-200 text-slate-700 font-bold"
                }`}
              >
                <span className="truncate">C. {q.optionC}</span>
                {q.correctAnswer === "c" && <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[3] shrink-0 ml-1" />}
              </div>

              {q.optionD && (
                <div
                  className={`p-3 rounded-2xl border-2 flex items-center justify-between ${
                    q.correctAnswer === "d"
                      ? "bg-emerald-100 border-emerald-400 text-emerald-950 font-black"
                      : "bg-slate-50 border-slate-200 text-slate-700 font-bold"
                  }`}
                >
                  <span className="truncate">D. {q.optionD}</span>
                  {q.correctAnswer === "d" && <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[3] shrink-0 ml-1" />}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border-2 border-slate-300 rounded-[36px] p-7 shadow-2xl space-y-4 animate-pop-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-[#0F172A] font-heading">Tambah Pertanyaan Baru</h3>
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
                  Teks Pertanyaan
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Berapa jumlah pemain bola basket dalam satu tim?"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-[#0F172A] focus:outline-none focus:border-[#FF5B00] font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-black font-heading mb-1">Opsi A</label>
                  <input
                    type="text"
                    required
                    value={newOptA}
                    onChange={(e) => setNewOptA(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-[#0F172A] focus:outline-none focus:border-[#FF5B00] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-black font-heading mb-1">Opsi B</label>
                  <input
                    type="text"
                    required
                    value={newOptB}
                    onChange={(e) => setNewOptB(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-[#0F172A] focus:outline-none focus:border-[#FF5B00] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-black font-heading mb-1">Opsi C</label>
                  <input
                    type="text"
                    required
                    value={newOptC}
                    onChange={(e) => setNewOptC(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-[#0F172A] focus:outline-none focus:border-[#FF5B00] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-heading mb-1">Opsi D (Opsional)</label>
                  <input
                    type="text"
                    value={newOptD}
                    onChange={(e) => setNewOptD(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-[#0F172A] focus:outline-none focus:border-[#FF5B00] font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-black font-heading mb-1">
                  Kunci Jawaban Benar
                </label>
                <p className="text-[11px] text-slate-500 font-bold mb-2">
                  Pilih 1 opsi yang menjadi kunci jawaban benar untuk dinilai secara otomatis saat kuis.
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
                      className={`btn-3d py-2.5 rounded-2xl border-2 font-black uppercase font-heading transition-all cursor-pointer ${
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

              <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-arcade-white btn-3d px-5 py-2.5 rounded-xl text-slate-800 font-bold font-heading cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-arcade-orange btn-3d px-6 py-2.5 rounded-xl text-white font-black font-heading cursor-pointer"
                >
                  Simpan Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
