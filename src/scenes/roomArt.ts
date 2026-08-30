import Phaser from "phaser";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type RoomObjectKind = "clue" | "lock" | "hidden" | "alt" | "decoy";

export interface RoomObject {
  id: string;
  kind: RoomObjectKind;
  /** 바닥에 그려지는 영역(그림용) */
  rect: Rect;
  /** 캐릭터가 접근했는지 판정하는 기준점 */
  point: { x: number; y: number };
  /** decoy 오브젝트를 조사했을 때 보여줄 대사 (없으면 기본 문구) */
  decoyMessage?: string;
}

export interface RoomLayout {
  floor: Rect;
  playerStart: { x: number; y: number };
  objects: RoomObject[];
}

export const FLOOR: Rect = { x: 40, y: 96, w: 920, h: 452 };

function rectCenter(r: Rect) {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

function drawFloorAndWalls(scene: Phaser.Scene, floorColor: number, wallColor: number, lineColor: number) {
  const g = scene.add.graphics();
  g.fillStyle(wallColor, 1);
  g.fillRoundedRect(FLOOR.x - 18, FLOOR.y - 18, FLOOR.w + 36, FLOOR.h + 36, 10);
  g.fillStyle(floorColor, 1);
  g.fillRoundedRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h, 6);
  g.lineStyle(1, lineColor, 0.35);
  for (let x = FLOOR.x; x <= FLOOR.x + FLOOR.w; x += 46) g.lineBetween(x, FLOOR.y, x, FLOOR.y + FLOOR.h);
  for (let y = FLOOR.y; y <= FLOOR.y + FLOOR.h; y += 46) g.lineBetween(FLOOR.x, y, FLOOR.x + FLOOR.w, y);
  return g;
}

/** FILE NO.01 — 서재 (탑다운) */
export function drawLibrary(scene: Phaser.Scene): RoomLayout {
  const g = drawFloorAndWalls(scene, 0x4a3626, 0x241a12, 0x2e2013);

  const objects: RoomObject[] = [];

  // 책상 + 편지 (clue)
  const deskRect: Rect = { x: 110, y: 150, w: 150, h: 90 };
  g.fillStyle(0x5c4230, 1);
  g.fillRoundedRect(deskRect.x, deskRect.y, deskRect.w, deskRect.h, 4);
  g.lineStyle(2, 0x2e2013, 1);
  g.strokeRoundedRect(deskRect.x, deskRect.y, deskRect.w, deskRect.h, 4);
  g.fillStyle(0xece3cf, 1);
  g.fillRect(deskRect.x + 18, deskRect.y + 18, 46, 32);
  objects.push({ id: "desk", kind: "clue", rect: deskRect, point: rectCenter(deskRect) });

  // 의자 (decoy)
  const chairRect: Rect = { x: 130, y: 250, w: 44, h: 44 };
  g.fillStyle(0x3a2a1c, 1);
  g.fillRoundedRect(chairRect.x, chairRect.y, chairRect.w, chairRect.h, 6);
  g.lineStyle(2, 0x1c130c, 1);
  g.lineBetween(chairRect.x + 8, chairRect.y + 8, chairRect.x + chairRect.w - 8, chairRect.y + chairRect.h - 8);
  g.lineBetween(chairRect.x + chairRect.w - 8, chairRect.y + 8, chairRect.x + 8, chairRect.y + chairRect.h - 8);
  objects.push({
    id: "chair",
    kind: "decoy",
    rect: chairRect,
    point: rectCenter(chairRect),
    decoyMessage: "그냥 낡은 나무 의자다.",
  });

  // 책장 + 다이얼 금고 (lock) — 위쪽 벽
  const lockRect: Rect = { x: 420, y: 100, w: 200, h: 70 };
  g.fillStyle(0x3d2b1f, 1);
  g.fillRect(lockRect.x, lockRect.y, lockRect.w, lockRect.h);
  g.lineStyle(2, 0x1c130c, 1);
  for (let i = 1; i < 6; i++) {
    const lx = lockRect.x + (lockRect.w / 6) * i;
    g.lineBetween(lx, lockRect.y, lx, lockRect.y + lockRect.h);
  }
  g.strokeRect(lockRect.x, lockRect.y, lockRect.w, lockRect.h);
  const dial = rectCenter(lockRect);
  g.fillStyle(0x151515, 1);
  g.fillCircle(dial.x, dial.y, 18);
  g.lineStyle(2, 0xc9a24a, 1);
  g.strokeCircle(dial.x, dial.y, 18);
  objects.push({ id: "bookshelf", kind: "lock", rect: lockRect, point: dial });

  // 창문 (alt) — 위쪽 벽, 책장 옆
  const altRect: Rect = { x: 660, y: 100, w: 150, h: 50 };
  g.fillStyle(0x203246, 1);
  g.fillRect(altRect.x, altRect.y, altRect.w, altRect.h);
  g.lineStyle(2, 0x1c130c, 1);
  g.strokeRect(altRect.x, altRect.y, altRect.w, altRect.h);
  g.lineBetween(altRect.x + altRect.w / 2, altRect.y, altRect.x + altRect.w / 2, altRect.y + altRect.h);
  objects.push({
    id: "window",
    kind: "alt",
    rect: altRect,
    point: { x: rectCenter(altRect).x, y: altRect.y + altRect.h + 30 },
  });

  // 화분 (decoy)
  const potRect: Rect = { x: 850, y: 460, w: 60, h: 60 };
  g.fillStyle(0x3a2a1c, 1);
  g.fillRoundedRect(potRect.x + 10, potRect.y + 30, 40, 26, 4);
  g.fillStyle(0x3f7a4a, 1);
  g.fillCircle(rectCenter(potRect).x, potRect.y + 22, 22);
  objects.push({
    id: "plant",
    kind: "decoy",
    rect: potRect,
    point: rectCenter(potRect),
    decoyMessage: "잎이 마른 화분이다. 별다른 건 없다.",
  });

  // 벽난로 + 히든 레버 — 오른쪽
  const hiddenRect: Rect = { x: 790, y: 150, w: 130, h: 100 };
  g.fillStyle(0x2a1e18, 1);
  g.fillRoundedRect(hiddenRect.x, hiddenRect.y, hiddenRect.w, hiddenRect.h, 8);
  g.fillStyle(0x120a08, 1);
  g.fillEllipse(rectCenter(hiddenRect).x, rectCenter(hiddenRect).y, hiddenRect.w - 30, hiddenRect.h - 30);
  g.fillStyle(0xd9822b, 0.8);
  g.fillTriangle(
    rectCenter(hiddenRect).x,
    rectCenter(hiddenRect).y - 12,
    rectCenter(hiddenRect).x - 10,
    rectCenter(hiddenRect).y + 12,
    rectCenter(hiddenRect).x + 10,
    rectCenter(hiddenRect).y + 12
  );
  const knot = { x: hiddenRect.x + hiddenRect.w - 14, y: hiddenRect.y + 12 };
  g.fillStyle(0x1c130c, 1);
  g.fillCircle(knot.x, knot.y, 5);
  objects.push({ id: "fireplace", kind: "hidden", rect: hiddenRect, point: knot });

  // 궤짝 (decoy)
  const trunkRect: Rect = { x: 550, y: 440, w: 110, h: 70 };
  g.fillStyle(0x4a3626, 1);
  g.fillRoundedRect(trunkRect.x, trunkRect.y, trunkRect.w, trunkRect.h, 6);
  g.lineStyle(3, 0x8a7a5e, 1);
  g.strokeRoundedRect(trunkRect.x, trunkRect.y, trunkRect.w, trunkRect.h, 6);
  g.lineBetween(trunkRect.x, trunkRect.y + trunkRect.h / 2, trunkRect.x + trunkRect.w, trunkRect.y + trunkRect.h / 2);
  objects.push({
    id: "trunk",
    kind: "decoy",
    rect: trunkRect,
    point: rectCenter(trunkRect),
    decoyMessage: "낡은 옷가지뿐, 별다른 건 없다.",
  });

  return {
    floor: FLOOR,
    playerStart: { x: FLOOR.x + FLOOR.w / 2, y: FLOOR.y + FLOOR.h - 50 },
    objects,
  };
}

/** FILE NO.02 — 온실 (탑다운) */
export function drawGreenhouse(scene: Phaser.Scene): RoomLayout {
  const g = drawFloorAndWalls(scene, 0x24352b, 0x14201a, 0x2c4a3f);

  const objects: RoomObject[] = [];

  // 재배 일지 테이블 (clue)
  const clueRect: Rect = { x: 100, y: 140, w: 140, h: 80 };
  g.fillStyle(0x4a3a28, 1);
  g.fillRoundedRect(clueRect.x, clueRect.y, clueRect.w, clueRect.h, 4);
  g.fillStyle(0xd8c9a0, 1);
  g.fillRect(clueRect.x + 40, clueRect.y + 18, 60, 40);
  objects.push({ id: "journal-table", kind: "clue", rect: clueRect, point: rectCenter(clueRect) });

  // 물뿌리개 (decoy)
  const canRect: Rect = { x: 270, y: 160, w: 40, h: 40 };
  g.fillStyle(0x6a7a6a, 1);
  g.fillEllipse(rectCenter(canRect).x, rectCenter(canRect).y, 34, 26);
  objects.push({
    id: "watering-can",
    kind: "decoy",
    rect: canRect,
    point: rectCenter(canRect),
    decoyMessage: "빈 물뿌리개다.",
  });

  // 화분 배열 (lock) — 아래쪽 벽 전체
  const lockRect: Rect = { x: 80, y: 470, w: 840, h: 60 };
  g.fillStyle(0x3a2c1e, 1);
  g.fillRect(lockRect.x, lockRect.y, lockRect.w, lockRect.h);
  const plantColors = [0xd3565f, 0xe7b93b, 0xe9e4d0, 0xcf7fd8];
  for (let i = 0; i < 10; i++) {
    const px = lockRect.x + 40 + i * 82;
    const py = lockRect.y + 30;
    g.fillStyle(0x7a5a3a, 1);
    g.fillCircle(px, py, 16);
    g.fillStyle(plantColors[i % plantColors.length], 1);
    g.fillCircle(px, py - 6, 7);
  }
  objects.push({ id: "flower-row", kind: "lock", rect: lockRect, point: rectCenter(lockRect) });

  // 온도조절기 (alt) — 오른쪽 벽
  const altRect: Rect = { x: 850, y: 160, w: 70, h: 70 };
  g.fillStyle(0xd8d2c2, 1);
  g.fillCircle(rectCenter(altRect).x, rectCenter(altRect).y, 32);
  g.lineStyle(2, 0x8a8270, 1);
  g.strokeCircle(rectCenter(altRect).x, rectCenter(altRect).y, 32);
  g.fillStyle(0xb5442e, 1);
  g.fillCircle(rectCenter(altRect).x, rectCenter(altRect).y, 4);
  objects.push({
    id: "thermostat",
    kind: "alt",
    rect: altRect,
    point: { x: rectCenter(altRect).x, y: altRect.y + altRect.h + 30 },
  });

  // 장식용 화분 (decoy)
  const decoPotRect: Rect = { x: 700, y: 140, w: 50, h: 50 };
  g.fillStyle(0x7a5a3a, 1);
  g.fillCircle(rectCenter(decoPotRect).x, rectCenter(decoPotRect).y, 18);
  g.fillStyle(0x3f7a4a, 1);
  g.fillCircle(rectCenter(decoPotRect).x, rectCenter(decoPotRect).y - 12, 12);
  objects.push({
    id: "deco-pot",
    kind: "decoy",
    rect: decoPotRect,
    point: rectCenter(decoPotRect),
    decoyMessage: "관상용 화분이다. 별다른 건 없다.",
  });

  // 관수 배관 밸브 (hidden) — 왼쪽 아래 구석
  const hiddenRect: Rect = { x: 60, y: 360, w: 60, h: 60 };
  g.lineStyle(10, 0x555a5c, 1);
  g.lineBetween(FLOOR.x, rectCenter(hiddenRect).y, hiddenRect.x + 30, rectCenter(hiddenRect).y);
  g.fillStyle(0x8a8f90, 1);
  g.fillCircle(rectCenter(hiddenRect).x, rectCenter(hiddenRect).y, 16);
  g.lineStyle(2, 0x2a2c2c, 1);
  g.strokeCircle(rectCenter(hiddenRect).x, rectCenter(hiddenRect).y, 16);
  objects.push({ id: "valve", kind: "hidden", rect: hiddenRect, point: rectCenter(hiddenRect) });

  // 벤치 (decoy)
  const benchRect: Rect = { x: 420, y: 300, w: 130, h: 40 };
  g.fillStyle(0x5c4a32, 1);
  g.fillRoundedRect(benchRect.x, benchRect.y, benchRect.w, benchRect.h, 6);
  objects.push({
    id: "bench",
    kind: "decoy",
    rect: benchRect,
    point: rectCenter(benchRect),
    decoyMessage: "앉아서 쉬는 벤치다.",
  });

  return {
    floor: FLOOR,
    playerStart: { x: FLOOR.x + FLOOR.w / 2, y: FLOOR.y + FLOOR.h - 90 },
    objects,
  };
}
