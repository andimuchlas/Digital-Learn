"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { Trophy, Flag, Star, Crown, Flame, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getAvatarSrc } from "@/lib/avatars";

export interface BoardPlayer {
  id: string;
  name: string;
  playerClass?: string;
  avatar?: string;
  tile: number; // 1 to 25
  previousTile?: number;
  correctAnswers?: number;
  isOnline?: boolean;
}

interface GameBoardProps {
  players: BoardPlayer[];
  activePlayerResult?: {
    playerId: string;
    previousTile: number;
    newTile: number;
    isCorrect: boolean;
  } | null;
}

// 5x5 Serpentine Layout (Row 5 down to Row 1)
// Row 5 (Top): 25 <- 24 <- 23 <- 22 <- 21 (Direction: Leftward)
// Row 4:       16 -> 17 -> 18 -> 19 -> 20 (Direction: Rightward)
// Row 3:       15 <- 14 <- 13 <- 12 <- 11 (Direction: Leftward)
// Row 2:        6 ->  7 ->  8 ->  9 -> 10 (Direction: Rightward)
// Row 1 (Bot):  1 ->  2 ->  3 ->  4 ->  5 (Direction: Rightward)
const BOARD_ROWS = [
  { rowNum: 5, tiles: [25, 24, 23, 22, 21], dir: "left" },
  { rowNum: 4, tiles: [16, 17, 18, 19, 20], dir: "right" },
  { rowNum: 3, tiles: [15, 14, 13, 12, 11], dir: "left" },
  { rowNum: 2, tiles: [6, 7, 8, 9, 10], dir: "right" },
  { rowNum: 1, tiles: [1, 2, 3, 4, 5], dir: "right" },
];

const PLAYER_COLORS = [
  { bg: "bg-[#FF5B00]", border: "border-[#C2410C]", text: "text-white" },
  { bg: "bg-[#2563EB]", border: "border-[#1E40AF]", text: "text-white" },
  { bg: "bg-[#059669]", border: "border-[#047857]", text: "text-white" },
  { bg: "bg-[#7C3AED]", border: "border-[#5B21B6]", text: "text-white" },
  { bg: "bg-[#DB2777]", border: "border-[#9D174D]", text: "text-white" },
  { bg: "bg-[#D97706]", border: "border-[#B45309]", text: "text-white" },
  { bg: "bg-[#0891B2]", border: "border-[#0E7490]", text: "text-white" },
  { bg: "bg-[#DC2626]", border: "border-[#991B1B]", text: "text-white" },
];

export function GameBoard({ players, activePlayerResult }: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const playerTokenRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // GSAP Arcade Jump Animation when a player answers correctly
  useEffect(() => {
    if (!activePlayerResult) return;

    const { playerId, previousTile, newTile, isCorrect } = activePlayerResult;
    const tokenEl = playerTokenRefs.current[playerId];
    const targetTileEl = tileRefs.current[newTile];

    if (tokenEl && isCorrect && newTile > previousTile) {
      // Parabolic jump physics
      gsap.fromTo(
        tokenEl,
        { scale: 1, y: 0, rotation: 0 },
        {
          scale: 1.5,
          y: -40,
          rotation: 12,
          duration: 0.38,
          ease: "power2.out",
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            if (targetTileEl) {
              gsap.fromTo(
                targetTileEl,
                { boxShadow: "0 0 0px #FF5B00", scale: 1 },
                {
                  boxShadow: "0 0 40px rgba(255, 91, 0, 0.8)",
                  scale: 1.08,
                  duration: 0.45,
                  yoyo: true,
                  repeat: 1,
                  ease: "power1.inOut",
                }
              );
            }
          },
        }
      );
    } else if (tokenEl && !isCorrect) {
      // Gentle horizontal wobble
      gsap.to(tokenEl, {
        x: "+=8",
        yoyo: true,
        repeat: 5,
        duration: 0.05,
        ease: "power1.inOut",
        onComplete: () => {
          gsap.set(tokenEl, { x: 0 });
        },
      });
    }
  }, [activePlayerResult]);

  // Group players by current tile (1-25)
  const playersByTile: { [key: number]: BoardPlayer[] } = {};
  for (let i = 1; i <= 25; i++) {
    playersByTile[i] = [];
  }
  players.forEach((p) => {
    const tileNum = Math.min(25, Math.max(1, p.tile || 1));
    if (!playersByTile[tileNum]) playersByTile[tileNum] = [];
    playersByTile[tileNum].push(p);
  });

  // Find the current highest tile for leader spotlight
  const maxTile = Math.max(...players.map((p) => p.tile || 1), 1);

  return (
    <div
      ref={boardRef}
      className="relative w-full max-w-5xl mx-auto p-4 sm:p-7 bg-white border-2 border-slate-300 rounded-[36px] shadow-2xl overflow-hidden"
    >
      {/* Board Header Info */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF5B00] to-[#FFAA00] border-2 border-[#C2410C] text-white flex items-center justify-center shadow-lg font-black">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-xl font-black text-[#0F172A] font-heading tracking-tight">
              Lintasan Papan 25 Tile
            </h3>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              1 Jawaban Benar = Maju 1 Tile &bull; Juara 1 Capai Tile 25
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs py-1 px-3">
            <Flame className="w-3.5 h-3.5 text-[#FF5B00] mr-1" />
            <span>{players.length} Pemain Aktif</span>
          </Badge>
        </div>
      </div>

      {/* 5x5 Serpentine Grid with High-Contrast Themed Tiles */}
      <div className="grid grid-rows-5 gap-3 sm:gap-3.5 relative z-10">
        {BOARD_ROWS.map((rowInfo, rowIndex) => (
          <div key={rowIndex} className="relative">
            {/* Grid row of 5 tiles */}
            <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5">
              {rowInfo.tiles.map((tileNum) => {
                const isStart = tileNum === 1;
                const isFinish = tileNum === 25;
                const isMilestone = [5, 10, 15, 20].includes(tileNum);
                const tilePlayers = playersByTile[tileNum] || [];

                return (
                  <div
                    key={tileNum}
                    ref={(el) => {
                      tileRefs.current[tileNum] = el;
                    }}
                    className={`relative min-h-[96px] sm:min-h-[116px] p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl border-[3px] transition-all duration-300 flex flex-col justify-between select-none shadow-md ${
                      isFinish
                        ? "bg-gradient-to-b from-[#FDE047] via-[#FACC15] to-[#EAB308] border-[#854D0E] shadow-xl ring-4 ring-amber-400"
                        : isStart
                        ? "bg-gradient-to-b from-[#6EE7B7] via-[#34D399] to-[#10B981] border-[#065F46] shadow-lg ring-2 ring-emerald-400"
                        : isMilestone
                        ? "bg-gradient-to-b from-[#7DD3FC] via-[#38BDF8] to-[#0284C7] border-[#075985] shadow-lg ring-2 ring-sky-400"
                        : "bg-white hover:bg-slate-50 border-slate-700 shadow-sm"
                    }`}
                  >
                    {/* Tile Header: Number + Type Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-base sm:text-2xl font-black font-heading tracking-tight ${
                          isFinish
                            ? "text-[#451A03] flex items-center gap-1 drop-shadow-xs"
                            : isStart
                            ? "text-[#022C22] flex items-center gap-1 drop-shadow-xs"
                            : isMilestone
                            ? "text-[#082F49] drop-shadow-xs"
                            : "text-[#0F172A]"
                        }`}
                      >
                        {tileNum}
                        {isFinish && <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-[#78350F] inline animate-bounce" />}
                        {isStart && <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-[#022C22] inline" />}
                      </span>

                      {isMilestone && !isFinish && !isStart && (
                        <div className="p-1 rounded-xl bg-white/90 border border-sky-800 text-sky-900 shadow-xs">
                          <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                        </div>
                      )}

                      {/* Direction Arrow on regular tile to indicate path */}
                      {!isFinish && !isStart && !isMilestone && (
                        <span className="text-xs sm:text-sm text-slate-500 font-black">
                          {rowInfo.dir === "right" ? "→" : "←"}
                        </span>
                      )}
                    </div>

                    {/* Landmark Labels */}
                    {isStart && (
                      <span className="text-[10px] sm:text-xs font-black text-[#022C22] uppercase tracking-wider font-heading bg-white/80 px-1.5 py-0.5 rounded-md border border-[#065F46] w-fit">
                        Start
                      </span>
                    )}
                    {isFinish && (
                      <span className="text-[10px] sm:text-xs font-black text-[#451A03] uppercase tracking-wider font-heading bg-white/80 px-1.5 py-0.5 rounded-md border border-[#854D0E] w-fit flex items-center gap-0.5">
                        👑 Juara 1
                      </span>
                    )}
                    {isMilestone && (
                      <span className="text-[9px] sm:text-[11px] font-black text-[#082F49] uppercase font-heading bg-white/80 px-1.5 py-0.5 rounded-md border border-[#075985] w-fit">
                        Pos #{tileNum}
                      </span>
                    )}

                    {/* Player Avatars on this tile */}
                    <div className="flex flex-wrap gap-1 sm:gap-1.5 items-end justify-start mt-auto pt-1.5">
                      {tilePlayers.slice(0, 4).map((player, idx) => {
                        const style = PLAYER_COLORS[idx % PLAYER_COLORS.length];
                        const isTop = player.tile === maxTile && maxTile > 1;

                        return (
                          <div
                            key={player.id}
                            ref={(el) => {
                              playerTokenRefs.current[player.id] = el;
                            }}
                            title={`${player.name} (${player.playerClass || "Kelas"}) - Tile ${player.tile}`}
                            className={`relative group cursor-pointer w-8 h-8 sm:w-10 sm:h-10 rounded-2xl overflow-hidden border-2 ${style.border} shadow-md flex items-center justify-center transition-transform hover:scale-125 z-20 bg-white ring-1 ring-black/10`}
                          >
                            <img
                              src={getAvatarSrc(player.avatar)}
                              alt={player.name}
                              className="w-full h-full object-cover"
                            />
                            {isTop && (
                              <div className="absolute -top-1.5 -right-1 text-xs animate-bounce z-30 drop-shadow-md">
                                👑
                              </div>
                            )}

                            {/* Floating tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#0F172A] text-white text-xs font-bold rounded-2xl shadow-2xl border-2 border-slate-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-40 font-heading">
                              <p className="text-sm font-black">{player.name}</p>
                              <p className="text-xs text-[#FF5B00] font-bold">
                                Petak {player.tile} &bull; {player.playerClass || "Kelas"}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {tilePlayers.length > 4 && (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-slate-900 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">
                          +{tilePlayers.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
