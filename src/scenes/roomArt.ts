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
  /** 벽에 그려지는 영역(그림용, 화면 아무 곳이나 가능 — 예: 창문은 벽 높은 곳) */
  rect: Rect;
  /** 캐릭터가 서야 하는 바닥 위 지점(항상 FLOOR 범위 안) */
  point: { x: number; y: number };
  decoyMessage?: string;
}

export interface WallLayout {
  label: string;
  floor: Rect;
  objects: RoomObject[];
  /** 이 벽을 그리며 생성한 모든 표시 오브젝트 — 벽 전환 시 한 번에 정리하기 위함 */
  gameObjects: Phaser.GameObjects.GameObject[];
}

export const FLOOR: Rect = { x: 60, y: 470, w: 880, h: 90 };
const OUTLINE = 0x241f1a;

function quadPoint(p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, t: number) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

/** Graphics에 quadraticCurveTo가 없어서 직접 샘플링해 lineTo로 그린다 */
function quadCurveTo(
  g: Phaser.GameObjects.Graphics,
  from: { x: number; y: number },
  ctrl: { x: number; y: number },
  to: { x: number; y: number },
  segments = 12
) {
  for (let i = 1; i <= segments; i++) {
    const p = quadPoint(from, ctrl, to, i / segments);
    g.lineTo(p.x, p.y);
  }
}

function drawBase(scene: Phaser.Scene, bucket: Phaser.GameObjects.GameObject[], wallColor: number, floorColor: number) {
  const g = scene.add.graphics();
  bucket.push(g);
  g.fillStyle(wallColor, 1);
  g.fillRect(0, 0, 1000, FLOOR.y + 10);
  g.lineStyle(4, OUTLINE, 1);
  g.lineBetween(0, 26, 1000, 26);

  g.fillStyle(floorColor, 1);
  g.fillRect(0, FLOOR.y - 20, 1000, 600 - (FLOOR.y - 20));
  g.lineStyle(3, 0x00000030, 1);
  for (let x = -60; x < 1050; x += 55) g.lineBetween(x, FLOOR.y - 20, x + 130, 600);
  g.lineStyle(4, OUTLINE, 1);
  g.lineBetween(0, FLOOR.y - 20, 1000, FLOOR.y - 20);

  return g;
}

function groundShadow(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number) {
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(x, y, w, 12);
}

/** ============ FILE NO.01 — 서재: 벽 4개 ============ */

function libraryWallClue(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xa9c9c2, 0xc98a4b);

  // 러그
  g.fillStyle(0xe07a92, 1);
  g.fillRoundedRect(340, FLOOR.y + 30, 340, 80, 16);
  g.lineStyle(5, OUTLINE, 1);
  g.strokeRoundedRect(340, FLOOR.y + 30, 340, 80, 16);

  // 책상 + 편지 (clue)
  const deskRect: Rect = { x: 380, y: 300, w: 220, h: 90 };
  groundShadow(g, 490, FLOOR.y + 20, 130);
  g.fillStyle(0x3f6e68, 1);
  g.fillRoundedRect(deskRect.x, deskRect.y + 40, deskRect.w, 60, 10);
  g.lineStyle(5, OUTLINE, 1);
  g.strokeRoundedRect(deskRect.x, deskRect.y + 40, deskRect.w, 60, 10);
  g.fillStyle(0xfdf1c8, 1);
  g.fillRoundedRect(deskRect.x + 68, deskRect.y, 84, 44, 4);
  g.lineStyle(4, OUTLINE, 1);
  g.strokeRoundedRect(deskRect.x + 68, deskRect.y, 84, 44, 4);
  g.lineStyle(2, 0xc9b98a, 1);
  for (let i = 0; i < 3; i++) g.lineBetween(deskRect.x + 78, deskRect.y + 12 + i * 9, deskRect.x + 142, deskRect.y + 12 + i * 9);

  // decoy: 액자
  const frameRect: Rect = { x: 130, y: 130, w: 90, h: 110 };
  g.fillStyle(0x3c2a20, 1);
  g.fillRect(frameRect.x, frameRect.y, frameRect.w, frameRect.h);
  g.lineStyle(4, OUTLINE, 1);
  g.strokeRect(frameRect.x, frameRect.y, frameRect.w, frameRect.h);
  g.fillStyle(0xe8dcc0, 1);
  g.fillRect(frameRect.x + 8, frameRect.y + 8, frameRect.w - 16, frameRect.h - 16);
  g.fillStyle(0x7ba0d0, 1);
  g.fillRect(frameRect.x + 14, frameRect.y + 14, frameRect.w - 28, (frameRect.h - 28) * 0.6);

  return {
    label: "정면 — 책상",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "desk", kind: "clue", rect: deskRect, point: { x: 490, y: FLOOR.y + 40 } },
      {
        id: "painting",
        kind: "decoy",
        rect: frameRect,
        point: { x: 175, y: FLOOR.y + 40 },
        decoyMessage: "풍경화 그림이다. 별다른 건 없다.",
      },
    ],
  };
}

function libraryWallLock(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xa9c9c2, 0xc98a4b);

  // 다이얼 캐비닛(lock)
  const cabRect: Rect = { x: 380, y: 270, w: 220, h: 160 };
  groundShadow(g, 490, FLOOR.y + 15, 140);
  g.fillStyle(0xc1503a, 1);
  g.fillRoundedRect(cabRect.x, cabRect.y, cabRect.w, cabRect.h, 18);
  g.lineStyle(6, OUTLINE, 1);
  g.strokeRoundedRect(cabRect.x, cabRect.y, cabRect.w, cabRect.h, 18);
  g.fillStyle(0xe8b23c, 1);
  g.fillRoundedRect(cabRect.x + 16, cabRect.y + 16, 90, 60, 10);
  g.fillRoundedRect(cabRect.x + 114, cabRect.y + 16, 90, 60, 10);
  g.lineStyle(4, OUTLINE, 1);
  g.strokeRoundedRect(cabRect.x + 16, cabRect.y + 16, 90, 60, 10);
  g.strokeRoundedRect(cabRect.x + 114, cabRect.y + 16, 90, 60, 10);

  const gemColors = [0x7b5fd1, 0x3f8ce0, 0x5aa564, 0xe8622c];
  const dialY = cabRect.y + 100;
  for (let i = 0; i < 4; i++) {
    const gx = cabRect.x + 30 + i * 46;
    g.fillStyle(0xfdf1c8, 1);
    g.fillCircle(gx, dialY, 18);
    g.lineStyle(3, OUTLINE, 1);
    g.strokeCircle(gx, dialY, 18);
    g.fillStyle(gemColors[i], 1);
    g.fillCircle(gx, dialY, 11);
    g.lineStyle(2, OUTLINE, 1);
    g.strokeCircle(gx, dialY, 11);
  }
  g.fillStyle(0x8a3626, 1);
  g.fillRoundedRect(cabRect.x + 40, cabRect.y + 140, 140, 16, 8);
  g.lineStyle(3, OUTLINE, 1);
  g.strokeRoundedRect(cabRect.x + 40, cabRect.y + 140, 140, 16, 8);

  // decoy: 통(barrel)
  const barrelRect: Rect = { x: 800, y: 340, w: 100, h: 120 };
  groundShadow(g, 850, FLOOR.y + 15, 65);
  g.fillStyle(0xc98a4b, 1);
  g.fillRoundedRect(barrelRect.x, barrelRect.y, barrelRect.w, barrelRect.h, 20);
  g.lineStyle(5, OUTLINE, 1);
  g.strokeRoundedRect(barrelRect.x, barrelRect.y, barrelRect.w, barrelRect.h, 20);
  g.lineBetween(barrelRect.x, barrelRect.y + 35, barrelRect.x + barrelRect.w, barrelRect.y + 35);
  g.lineBetween(barrelRect.x, barrelRect.y + 80, barrelRect.x + barrelRect.w, barrelRect.y + 80);

  return {
    label: "오른쪽 벽 — 서랍장",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "cabinet", kind: "lock", rect: cabRect, point: { x: 490, y: FLOOR.y + 30 } },
      {
        id: "barrel",
        kind: "decoy",
        rect: barrelRect,
        point: { x: 850, y: FLOOR.y + 30 },
        decoyMessage: "빈 나무 통이다.",
      },
    ],
  };
}

function libraryWallHidden(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xa9c9c2, 0xc98a4b);

  // 벽난로(hidden)
  const fireRect: Rect = { x: 420, y: 330, w: 160, h: 120 };
  groundShadow(g, 500, FLOOR.y + 15, 100);
  g.fillStyle(0x8a4a2c, 1);
  g.fillRoundedRect(fireRect.x, fireRect.y, fireRect.w, fireRect.h, 16);
  g.lineStyle(5, OUTLINE, 1);
  g.strokeRoundedRect(fireRect.x, fireRect.y, fireRect.w, fireRect.h, 16);
  g.fillStyle(0x1c130c, 1);
  g.fillEllipse(fireRect.x + fireRect.w / 2, fireRect.y + 50, 55, 30);
  const fireColors = [0xf2c84b, 0xe8622c];
  for (let i = 0; i < 3; i++) {
    const fx = fireRect.x + fireRect.w / 2 - 18 + i * 18;
    g.fillStyle(fireColors[i % 2], 1);
    g.beginPath();
    g.moveTo(fx, fireRect.y + 65);
    g.lineTo(fx - 6, fireRect.y + 40);
    g.lineTo(fx + 6, fireRect.y + 45);
    g.lineTo(fx + 10, fireRect.y + 65);
    g.closePath();
    g.fillPath();
  }
  const knot = { x: fireRect.x + fireRect.w - 16, y: fireRect.y + 18 };
  g.fillStyle(0x3a2a1c, 1);
  g.fillCircle(knot.x, knot.y, 5);

  // decoy: 스툴
  const stoolRect: Rect = { x: 110, y: 400, w: 90, h: 70 };
  groundShadow(g, 155, FLOOR.y + 15, 55);
  g.fillStyle(0xe8b23c, 1);
  g.fillRoundedRect(stoolRect.x, stoolRect.y + 40, 90, 24, 6);
  g.lineStyle(4, OUTLINE, 1);
  g.strokeRoundedRect(stoolRect.x, stoolRect.y + 40, 90, 24, 6);
  g.fillStyle(0x3f6e68, 1);
  g.fillRoundedRect(stoolRect.x + 12, stoolRect.y, 66, 40, 10);
  g.lineStyle(4, OUTLINE, 1);
  g.strokeRoundedRect(stoolRect.x + 12, stoolRect.y, 66, 40, 10);

  return {
    label: "뒤쪽 벽 — 벽난로",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "fireplace", kind: "hidden", rect: fireRect, point: { x: 500, y: FLOOR.y + 30 } },
      {
        id: "stool",
        kind: "decoy",
        rect: stoolRect,
        point: { x: 155, y: FLOOR.y + 30 },
        decoyMessage: "낡은 나무 스툴이다.",
      },
    ],
  };
}

function libraryWallAlt(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xa9c9c2, 0xc98a4b);

  // 아치형 창문(alt)
  const winRect: Rect = { x: 420, y: 150, w: 200, h: 200 };
  groundShadow(g, 520, FLOOR.y + 15, 100);
  g.fillStyle(0x3c2a20, 1);
  g.beginPath();
  g.moveTo(winRect.x, winRect.y + 140);
  g.lineTo(winRect.x, winRect.y + 40);
  g.arc(winRect.x + 100, winRect.y + 40, 100, Math.PI, 0, false);
  g.lineTo(winRect.x + 200, winRect.y + 140);
  g.closePath();
  g.fillPath();
  g.lineStyle(6, OUTLINE, 1);
  g.strokePath();

  g.fillStyle(0xfdf1c8, 1);
  g.beginPath();
  g.moveTo(winRect.x + 18, winRect.y + 132);
  g.lineTo(winRect.x + 18, winRect.y + 45);
  g.arc(winRect.x + 100, winRect.y + 45, 82, Math.PI, 0, false);
  g.lineTo(winRect.x + 182, winRect.y + 132);
  g.closePath();
  g.fillPath();
  g.lineStyle(4, OUTLINE, 1);
  g.strokePath();

  g.lineStyle(4, OUTLINE, 1);
  g.lineBetween(winRect.x + 100, winRect.y - 27, winRect.x + 100, winRect.y + 132);
  g.lineBetween(winRect.x + 18, winRect.y + 90, winRect.x + 182, winRect.y + 90);

  const latchY = winRect.y + 105;
  g.fillStyle(0xd9a441, 1);
  g.fillRoundedRect(winRect.x + 88, latchY, 24, 26, 4);
  g.lineStyle(3, OUTLINE, 1);
  g.strokeRoundedRect(winRect.x + 88, latchY, 24, 26, 4);

  // decoy: 자루
  const sackRect: Rect = { x: 800, y: 380, w: 90, h: 90 };
  groundShadow(g, 845, FLOOR.y + 15, 55);
  g.fillStyle(0xe8dcc0, 1);
  g.beginPath();
  g.moveTo(sackRect.x, sackRect.y + 80);
  quadCurveTo(g, { x: sackRect.x, y: sackRect.y + 80 }, { x: sackRect.x - 6, y: sackRect.y + 20 }, { x: sackRect.x + 45, y: sackRect.y });
  quadCurveTo(g, { x: sackRect.x + 45, y: sackRect.y }, { x: sackRect.x + 96, y: sackRect.y + 20 }, { x: sackRect.x + 90, y: sackRect.y + 80 });
  g.closePath();
  g.fillPath();
  g.lineStyle(4, OUTLINE, 1);
  g.strokePath();

  return {
    label: "왼쪽 벽 — 창문",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "window", kind: "alt", rect: winRect, point: { x: 520, y: FLOOR.y + 30 } },
      {
        id: "sack",
        kind: "decoy",
        rect: sackRect,
        point: { x: 845, y: FLOOR.y + 30 },
        decoyMessage: "곡물 자루다. 별다른 건 없다.",
      },
    ],
  };
}

/** ============ FILE NO.02 — 온실: 벽 4개 ============ */

function greenhouseWallClue(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xbfe0d6, 0x8a6a3c);

  const tableRect: Rect = { x: 400, y: 330, w: 200, h: 90 };
  groundShadow(g, 500, FLOOR.y + 15, 120);
  g.fillStyle(0x6b8f5a, 1);
  g.fillRoundedRect(tableRect.x, tableRect.y + 30, tableRect.w, 60, 10);
  g.lineStyle(5, OUTLINE, 1);
  g.strokeRoundedRect(tableRect.x, tableRect.y + 30, tableRect.w, 60, 10);
  g.fillStyle(0xfdf1c8, 1);
  g.fillRoundedRect(tableRect.x + 60, tableRect.y, 80, 44, 4);
  g.lineStyle(4, OUTLINE, 1);
  g.strokeRoundedRect(tableRect.x + 60, tableRect.y, 80, 44, 4);

  const canRect: Rect = { x: 160, y: 400, w: 60, h: 50 };
  groundShadow(g, 190, FLOOR.y + 15, 45);
  g.fillStyle(0x8fa9a3, 1);
  g.fillEllipse(canRect.x + 30, canRect.y + 25, 55, 40);
  g.lineStyle(4, OUTLINE, 1);
  g.strokeEllipse(canRect.x + 30, canRect.y + 25, 55, 40);

  return {
    label: "정면 — 작업대",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "journal-table", kind: "clue", rect: tableRect, point: { x: 500, y: FLOOR.y + 30 } },
      { id: "watering-can", kind: "decoy", rect: canRect, point: { x: 190, y: FLOOR.y + 30 }, decoyMessage: "빈 물뿌리개다." },
    ],
  };
}

function greenhouseWallLock(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xbfe0d6, 0x8a6a3c);

  const rowRect: Rect = { x: 300, y: 380, w: 400, h: 90 };
  groundShadow(g, 500, FLOOR.y + 15, 220);
  g.fillStyle(0x6b4a30, 1);
  g.fillRoundedRect(rowRect.x, rowRect.y + 40, rowRect.w, 40, 8);
  g.lineStyle(5, OUTLINE, 1);
  g.strokeRoundedRect(rowRect.x, rowRect.y + 40, rowRect.w, 40, 8);

  const plantColors = [0xe07a92, 0xe8b23c, 0xfdf1c8, 0x7b5fd1, 0xe8622c];
  for (let i = 0; i < 5; i++) {
    const px = rowRect.x + 40 + i * 80;
    g.fillStyle(0xc98a4b, 1);
    g.fillCircle(px, rowRect.y + 40, 22);
    g.lineStyle(4, OUTLINE, 1);
    g.strokeCircle(px, rowRect.y + 40, 22);
    g.fillStyle(0x5aa564, 1);
    g.fillCircle(px, rowRect.y + 12, 16);
    g.lineStyle(3, OUTLINE, 1);
    g.strokeCircle(px, rowRect.y + 12, 16);
    g.fillStyle(plantColors[i], 1);
    g.fillCircle(px, rowRect.y + 2, 7);
  }

  const potRect: Rect = { x: 850, y: 380, w: 60, h: 60 };
  groundShadow(g, 880, FLOOR.y + 15, 45);
  g.fillStyle(0xc98a4b, 1);
  g.fillCircle(880, 415, 20);
  g.lineStyle(4, OUTLINE, 1);
  g.strokeCircle(880, 415, 20);
  g.fillStyle(0x5aa564, 1);
  g.fillCircle(880, 390, 15);
  g.lineStyle(3, OUTLINE, 1);
  g.strokeCircle(880, 390, 15);

  return {
    label: "오른쪽 벽 — 화분들",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "flower-row", kind: "lock", rect: rowRect, point: { x: 500, y: FLOOR.y + 30 } },
      { id: "deco-pot", kind: "decoy", rect: potRect, point: { x: 880, y: FLOOR.y + 30 }, decoyMessage: "관상용 화분이다." },
    ],
  };
}

function greenhouseWallHidden(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xbfe0d6, 0x8a6a3c);

  const valveRect: Rect = { x: 440, y: 400, w: 100, h: 70 };
  groundShadow(g, 490, FLOOR.y + 15, 70);
  g.lineStyle(12, 0x8a8f90, 1);
  g.lineBetween(300, 440, 470, 440);
  g.fillStyle(0xb0b5b6, 1);
  g.fillCircle(490, 440, 26);
  g.lineStyle(4, OUTLINE, 1);
  g.strokeCircle(490, 440, 26);
  g.lineStyle(4, 0x4a4a4a, 1);
  g.lineBetween(490 - 18, 440, 490 + 18, 440);
  g.lineBetween(490, 440 - 18, 490, 440 + 18);

  const benchRect: Rect = { x: 760, y: 420, w: 160, h: 40 };
  groundShadow(g, 840, FLOOR.y + 15, 90);
  g.fillStyle(0x6b8f5a, 1);
  g.fillRoundedRect(benchRect.x, benchRect.y, benchRect.w, benchRect.h, 8);
  g.lineStyle(5, OUTLINE, 1);
  g.strokeRoundedRect(benchRect.x, benchRect.y, benchRect.w, benchRect.h, 8);

  return {
    label: "뒤쪽 벽 — 배관",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "valve", kind: "hidden", rect: valveRect, point: { x: 490, y: FLOOR.y + 30 } },
      { id: "bench", kind: "decoy", rect: benchRect, point: { x: 840, y: FLOOR.y + 30 }, decoyMessage: "앉아서 쉬는 벤치다." },
    ],
  };
}

function greenhouseWallAlt(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xbfe0d6, 0x8a6a3c);

  const dialRect: Rect = { x: 450, y: 200, w: 100, h: 100 };
  groundShadow(g, 500, FLOOR.y + 15, 60);
  g.fillStyle(0xfdf1c8, 1);
  g.fillCircle(500, 250, 46);
  g.lineStyle(5, OUTLINE, 1);
  g.strokeCircle(500, 250, 46);
  g.fillStyle(0xe8622c, 1);
  g.fillCircle(500, 250, 6);
  g.lineStyle(4, 0xe8622c, 1);
  g.lineBetween(500, 250, 522, 232);

  const doorRect: Rect = { x: 760, y: 260, w: 130, h: 210 };
  groundShadow(g, 825, FLOOR.y + 15, 80);
  g.fillStyle(0x6b4a30, 1);
  g.fillRoundedRect(doorRect.x, doorRect.y, doorRect.w, doorRect.h, 10);
  g.lineStyle(5, OUTLINE, 1);
  g.strokeRoundedRect(doorRect.x, doorRect.y, doorRect.w, doorRect.h, 10);
  g.fillStyle(0x3a2a1c, 1);
  g.fillCircle(doorRect.x + 20, doorRect.y + 110, 15);
  g.lineStyle(3, OUTLINE, 1);
  g.strokeCircle(doorRect.x + 20, doorRect.y + 110, 15);

  return {
    label: "왼쪽 벽 — 온도조절기",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "thermostat", kind: "alt", rect: dialRect, point: { x: 500, y: FLOOR.y + 30 } },
      { id: "shed-door", kind: "decoy", rect: doorRect, point: { x: 825, y: FLOOR.y + 30 }, decoyMessage: "잠긴 창고 문이다. 열리지 않는다." },
    ],
  };
}

export const LIBRARY_WALLS = [libraryWallClue, libraryWallLock, libraryWallHidden, libraryWallAlt];
export const GREENHOUSE_WALLS = [greenhouseWallClue, greenhouseWallLock, greenhouseWallHidden, greenhouseWallAlt];
