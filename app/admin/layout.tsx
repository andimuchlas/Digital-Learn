"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  ArrowLeft,
  LogOut,
  User,
  Maximize2,
  Minimize2,
  Menu,
  X,
} from "lucide-react";
import { sound } from "@/lib/sound";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // On login page, render clean page without admin navbar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/games/new", label: "Buat Kuis Baru", icon: PlusCircle },
    { href: "/admin/questions", label: "Bank Soal", icon: BookOpen },
  ];

  const toggleFullscreen = () => {
    sound.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const handleLogout = async () => {
    sound.playClick();
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore
    }
    window.location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b-2 border-slate-200 px-4 sm:px-8 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5B00] to-[#FFAA00] border-2 border-[#C2410C] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="text-xl">🏀</span>
              </div>
              <div>
                <span className="text-sm font-black text-[#0F172A] font-heading tracking-tight block">
                  Panel Guru
                </span>
                <span className="text-[10px] font-bold text-slate-500">Digital Learn Quiz</span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-2 ml-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black font-heading transition-all ${
                      isActive
                        ? "bg-[#FF5B00] text-white shadow-md shadow-[#FF5B00]/25"
                        : "text-slate-600 hover:text-[#0F172A] hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Fullscreen Proyektor Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-700 hover:text-[#FF5B00] hover:border-orange-300 transition-all cursor-pointer"
              title={isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh (Proyektor)"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-100 border-2 border-slate-200 text-xs font-bold text-slate-700">
              <User className="w-3.5 h-3.5 text-[#FF5B00]" />
              <span>Guru</span>
            </div>

            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-black font-heading transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Halaman Depan</span>
            </Link>

            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-50 border-2 border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-black font-heading transition-all cursor-pointer"
              title="Keluar dari Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-700 hover:text-[#FF5B00] transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t-2 border-slate-100 space-y-1.5 animate-pop-in">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black font-heading transition-all ${
                    isActive
                      ? "bg-[#FF5B00] text-white shadow-md shadow-[#FF5B00]/25"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                href="/"
                className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Halaman Depan</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-rose-50 text-rose-700 text-xs font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">{children}</div>
    </div>
  );
}
