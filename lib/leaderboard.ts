export interface LeaderboardComparable {
  id?: string;
  name?: string;
  playerName?: string;
  playerClass?: string;
  avatar?: string;
  tile?: number;
  finalTile?: number;
  correctAnswers?: number;
  totalResponseTime?: number;
  answeredAt?: number | null;
  rank?: number;
}

/**
 * Standard sorting function for Digital Learn Quiz leaderboard.
 * 
 * Criteria:
 * 1. Correct Answers (highest first)
 * 2. Tile Position (highest first)
 * 3. Total Response Time (fastest/lowest ms first)
 * 4. Last answered timestamp (earliest first)
 */
export function compareLeaderboardPlayers(
  a: unknown,
  b: unknown
): number {
  const pA = (a || {}) as LeaderboardComparable;
  const pB = (b || {}) as LeaderboardComparable;

  // 1. Most correct answers (primary metric)
  const correctA = pA.correctAnswers ?? 0;
  const correctB = pB.correctAnswers ?? 0;
  if (correctB !== correctA) {
    return correctB - correctA;
  }

  // 2. Furthest tile (secondary metric)
  const tileA = pA.finalTile ?? pA.tile ?? 0;
  const tileB = pB.finalTile ?? pB.tile ?? 0;
  if (tileB !== tileA) {
    return tileB - tileA;
  }

  // 3. Fastest response time (lower totalResponseTime is better)
  const timeA = pA.totalResponseTime;
  const timeB = pB.totalResponseTime;
  if (timeA !== undefined && timeB !== undefined && timeA !== timeB) {
    return timeA - timeB;
  }

  // 4. Fallback: earlier answeredAt
  const answeredA = pA.answeredAt ?? 0;
  const answeredB = pB.answeredAt ?? 0;
  if (answeredA !== answeredB && answeredA > 0 && answeredB > 0) {
    return answeredA - answeredB;
  }

  return 0;
}
