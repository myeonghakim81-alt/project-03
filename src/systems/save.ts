import type { Difficulty, HighScoreEntry } from "../types";
import { STAGES } from "../data/stages";

const STORAGE_KEY = "ashford-file:highscores:v1";

type ScoreBoard = Record<string, HighScoreEntry>; // key: `${stageId}:${difficulty}`

function loadBoard(): ScoreBoard {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ScoreBoard) : {};
  } catch {
    return {};
  }
}

function saveBoard(board: ScoreBoard) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  } catch {
    // localStorage 사용 불가 환경(프라이빗 모드 등)은 조용히 무시 — 점수 기록만 못 남을 뿐 플레이는 계속된다.
  }
}

function key(stageId: string, difficulty: Difficulty) {
  return `${stageId}:${difficulty}`;
}

export function getBestScore(stageId: string, difficulty: Difficulty): HighScoreEntry | null {
  return loadBoard()[key(stageId, difficulty)] ?? null;
}

/** 신기록이면 저장하고 true, 아니면 false를 반환 */
export function submitScore(entry: HighScoreEntry & { stageId: string; difficulty: Difficulty }): boolean {
  const board = loadBoard();
  const k = key(entry.stageId, entry.difficulty);
  const prevBest = board[k];
  if (prevBest && prevBest.score >= entry.score) return false;

  board[k] = {
    score: entry.score,
    route: entry.route,
    remainingSec: entry.remainingSec,
    hintsUsed: entry.hintsUsed,
    achievedAt: entry.achievedAt,
  };
  saveBoard(board);
  return true;
}

/** 전 스테이지(10) x 전 난이도(3) 중 기록이 있는 항목들의 최고점 합산 */
export function getTotalRankingScore(): number {
  const board = loadBoard();
  return STAGES.reduce((sum, stage) => {
    (["easy", "medium", "hard"] as Difficulty[]).forEach((diff) => {
      const entry = board[key(stage.id, diff)];
      if (entry) sum += entry.score;
    });
    return sum;
  }, 0);
}

const CLEARED_KEY = "ashford-file:cleared:v1";

export function isStageCleared(stageId: string): boolean {
  try {
    const raw = localStorage.getItem(CLEARED_KEY);
    const cleared: string[] = raw ? JSON.parse(raw) : [];
    return cleared.includes(stageId);
  } catch {
    return false;
  }
}

export function markStageCleared(stageId: string) {
  try {
    const raw = localStorage.getItem(CLEARED_KEY);
    const cleared: string[] = raw ? JSON.parse(raw) : [];
    if (!cleared.includes(stageId)) {
      cleared.push(stageId);
      localStorage.setItem(CLEARED_KEY, JSON.stringify(cleared));
    }
  } catch {
    // 저장 실패해도 플레이는 계속 진행
  }
}
