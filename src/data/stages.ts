import type { StageConfig } from "../types";

// 기획서 4장 — 스테이지 구성. 초안(Phase 1) 범위는 FILE 01~02 완전 구현,
// 나머지는 로드맵을 보여주기 위한 잠금 상태 placeholder.
export const STAGES: StageConfig[] = [
  {
    id: "file-01",
    fileNo: 1,
    act: 1,
    title: "서재",
    intro:
      "벤자민의 마지막 목격 장소. 책상 위 편지 한 장이 유일한 단서다.",
    baseTimeLimitSec: 6 * 60,
    locked: false,
    routes: {
      standard: {
        id: "standard",
        label: "책장 암호 다이얼",
        description: "책상 위 편지에서 단서를 찾아 벽면 금고의 4자리 암호를 맞춘다.",
        clue: "편지에는 '그가 태어난 해, 거꾸로.' 라고 적혀 있다. (1887 → 7881)",
        code: "7881",
      },
      hidden: {
        id: "hidden",
        label: "벽난로 회전 책장",
        description: "벽난로 뒤에 숨겨진 레버를 찾아내면 통로가 곧장 열린다.",
        hotspot: { x: 640, y: 300, radius: 40 },
      },
      alternative: {
        id: "alternative",
        label: "창문 걸쇠 분해",
        description: "공구로 창문 걸쇠를 분해해 발코니로 탈출을 시도한다. 실패하면 시간이 소모된다.",
        successChance: 0.65,
      },
    },
  },
  {
    id: "file-02",
    fileNo: 2,
    act: 1,
    title: "온실",
    intro: "희귀 식물 사이 재배 일지, 화분마다 다른 숫자가 적혀 있다.",
    baseTimeLimitSec: 6 * 60,
    locked: false,
    routes: {
      standard: {
        id: "standard",
        label: "화분 배열 코드",
        description: "재배 일지를 읽고 화분 배열 순서대로 4자리 코드를 맞춘다.",
        clue: "일지에는 '장미, 튤립, 백합, 국화 순으로 심은 해의 마지막 두 자리씩.' 이라 적혀 있다. (코드: 0416)",
        code: "0416",
      },
      hidden: {
        id: "hidden",
        label: "관수 배관 잠금",
        description: "배관 밸브를 잠그면 수압으로 채광창이 강제로 열린다.",
        hotspot: { x: 220, y: 420, radius: 40 },
      },
      alternative: {
        id: "alternative",
        label: "온도조절기 조작",
        description: "온도조절기를 최대로 올려 스프링클러를 오작동시킨다. 실패 시 경보가 울려 시간이 소모된다.",
        successChance: 0.6,
      },
    },
  },
  stub(3, 1, "지하 와인 저장고", 7 * 60),
  stub(4, 1, "안주인의 침실", 7 * 60),
  stub(5, 1, "다락방", 8 * 60),
  stub(6, 2, "로비", 6 * 60),
  stub(7, 2, "회의실", 7 * 60),
  stub(8, 2, "전산실 서버룸", 8 * 60),
  stub(9, 2, "임원 라운지", 7 * 60),
  stub(10, 2, "대표이사실", 9 * 60),
];

function stub(fileNo: number, act: 1 | 2, title: string, baseTimeLimitSec: number): StageConfig {
  return {
    id: `file-${String(fileNo).padStart(2, "0")}`,
    fileNo,
    act,
    title,
    intro: "Coming soon.",
    baseTimeLimitSec,
    locked: true,
    routes: {
      standard: { id: "standard", label: "정석", description: "", clue: "", code: "0000" },
      hidden: { id: "hidden", label: "히든", description: "", hotspot: { x: 0, y: 0, radius: 0 } },
      alternative: { id: "alternative", label: "얼터너티브", description: "", successChance: 0 },
    },
  };
}

export function getStage(id: string): StageConfig {
  const stage = STAGES.find((s) => s.id === id);
  if (!stage) throw new Error(`Unknown stage id: ${id}`);
  return stage;
}
