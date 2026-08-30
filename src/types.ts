export type Difficulty = "easy" | "medium" | "hard";

export type RouteId = "standard" | "hidden" | "alternative";

export interface RouteConfig {
  id: RouteId;
  label: string;
  description: string;
}

export interface StageConfig {
  id: string; // e.g. "file-01"
  fileNo: number;
  act: 1 | 2;
  title: string;
  intro: string;
  /** 미디엄 기준 제한시간(초) */
  baseTimeLimitSec: number;
  routes: {
    standard: RouteConfig & { clue: string; code: string };
    hidden: RouteConfig & { hotspot: { x: number; y: number; radius: number } };
    alternative: RouteConfig & { successChance: number };
  };
  /** 아직 구현되지 않은 스테이지는 true — Coming Soon으로 표시 */
  locked: boolean;
}

export interface DifficultySettings {
  label: string;
  timeMultiplier: number;
  hintCount: number;
  hintRequiresAd: boolean;
  routeHintsVisible: boolean; // 이지: 3경로 모두 지도 표시
  wrongAnswerPenaltySec: number;
  trapPenaltySec: number;
  scoreMultiplier: number;
}

export interface RouteScoreMultiplier {
  standard: number;
  hidden: number;
  alternative: number;
}

export interface PlayResult {
  stageId: string;
  difficulty: Difficulty;
  route: RouteId;
  cleared: boolean;
  remainingSec: number;
  hintsUsed: number;
  finalScore: number;
}

export interface HighScoreEntry {
  score: number;
  route: RouteId;
  remainingSec: number;
  hintsUsed: number;
  achievedAt: string;
}
