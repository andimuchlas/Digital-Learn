"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from "lucide-react";
import { sound } from "@/lib/sound";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Username dan password tidak boleh kosong.");
      return;
    }

    sound.playClick();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Username atau password salah.");
        setLoading(false);
        return;
      }

      sound.playCorrect();
      const target = callbackUrl && callbackUrl !== "/admin/login" ? callbackUrl : "/admin";
      window.location.href = target;
    } catch {
      setError("Gagal terhubung ke server. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#FF5B00] border-2 border-[#C2410C] shadow-lg text-white font-black text-3xl mb-4 transform -rotate-3 hover:rotate-0 transition-transform">
          🏀
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight font-heading">
          Portal Guru & Host Kuis
        </h1>
        <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1.5">
          Masuk untuk mengelola bank soal dan memimpin sesi kuis kelas
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-[32px] p-7 sm:p-9 shadow-xl border-2 border-slate-300 relative overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-100 to-transparent rounded-bl-full pointer-events-none -z-0" />

        <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
          {/* Error Notice */}
          {error && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-bold animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Username Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="block text-[11px] font-black uppercase tracking-wider text-slate-700 font-heading"
            >
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username admin"
                autoComplete="username"
                required
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-300 focus:border-[#FF5B00] focus:bg-white rounded-2xl text-sm font-bold text-[#0F172A] placeholder:text-slate-400 focus:outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-[11px] font-black uppercase tracking-wider text-slate-700 font-heading"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border-2 border-slate-300 focus:border-[#FF5B00] focus:bg-white rounded-2xl text-sm font-bold text-[#0F172A] placeholder:text-slate-400 focus:outline-none transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-arcade-orange btn-3d w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wider flex items-center justify-center gap-2.5 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="font-heading uppercase">
                {loading ? "MEMVERIFIKASI..." : "MASUK KE PANEL GURU"}
              </span>
              <ArrowRight className="w-4 h-4 stroke-[3] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>

        {/* Footnote */}
        <div className="mt-6 pt-5 border-t-2 border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Akses Guru Terverifikasi</span>
          </div>
          <Link
            href="/"
            className="text-slate-400 hover:text-[#FF5B00] transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-sunset-glow-light flex flex-col justify-center items-center px-4 py-8">
      <Suspense fallback={<div className="text-slate-500 font-bold">Memuat...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
