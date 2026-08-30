import type { Difficulty, RouteId } from "../types";
import { DIFFICULTY_SETTINGS, getRouteMultiplier } from "../data/difficulty";

const BASE_SCORE = 1000;
const TIME_COEFFICIENT = 10; // 잔여시간 1초당 +10
const HINT_PENALTY = 150; // 힌트 1회당 -150

// 기획서 7장 계산식:
// 최종점수 = ROUND( (기본점수 + 잔여시간 × 시간계수 − 힌트사용 × 힌트페널티) × 난이도배율 × 경로배율 )
export function calculateScore(params: {
  difficulty: Difficulty;
  route: RouteId;
  remainingSec: number;
  hintsUsed: number;
}): number {
  const { difficulty, route, remainingSec, hintsUsed } = params;
  const difficultyMult = DIFFICULTY_SETTINGS[difficulty].scoreMultiplier;
  const routeMult = getRouteMultiplier(difficulty, route);

  const raw =
    (BASE_SCORE + Math.max(0, remainingSec) * TIME_COEFFICIENT - hintsUsed * HINT_PENALTY) *
    difficultyMult *
    routeMult;

  return Math.max(0, Math.round(raw));
}
