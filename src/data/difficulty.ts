import type { Difficulty, DifficultySettings, RouteScoreMultiplier } from "../types";

// 기획서 5장 — 난이도 시스템
export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    label: "Easy",
    timeMultiplier: 1.5,
    hintCount: 5,
    hintRequiresAd: false,
    routeHintsVisible: true,
    wrongAnswerPenaltySec: 0,
    trapPenaltySec: 0,
    scoreMultiplier: 1.0,
  },
  medium: {
    label: "Medium",
    timeMultiplier: 1.0,
    hintCount: 3,
    hintRequiresAd: false,
    routeHintsVisible: false,
    wrongAnswerPenaltySec: 5,
    trapPenaltySec: 5,
    scoreMultiplier: 1.6,
  },
  hard: {
    label: "Hard",
    timeMultiplier: 0.65,
    hintCount: 1, // 리워드 광고 시청으로만 1회 획득 가능
    hintRequiresAd: true,
    routeHintsVisible: false,
    wrongAnswerPenaltySec: 15,
    trapPenaltySec: 30,
    scoreMultiplier: 2.5,
  },
};

// 기획서 8장 — 하드모드 경로별 점수 배율 (이지/미디엄은 항상 1.0)
export const HARD_ROUTE_MULTIPLIER: RouteScoreMultiplier = {
  standard: 1.0,
  hidden: 1.3,
  alternative: 1.6,
};

export function getRouteMultiplier(difficulty: Difficulty, route: keyof RouteScoreMultiplier): number {
  if (difficulty !== "hard") return 1.0;
  return HARD_ROUTE_MULTIPLIER[route];
}
