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
  /** 벽 로컬 좌표(500x520 기준) 안에서 그림이 차지하는 영역 */
  rect: Rect;
  /** 캐릭터가 서야 하는 바닥 위 지점 (벽 로컬 좌표, FLOOR 범위 안) */
  point: { x: number; y: number };
  decoyMessage?: string;
}

export interface WallLayout {
  label: string;
  floor: Rect;
  objects: RoomObject[];
  gameObjects: Phaser.GameObjects.GameObject[];
}

/** 벽 하나를 그리는 로컬 좌표계 크기 (실제 화면 배치는 RoomScene의 컨테이너 스케일이 담당) */
export const WALL_W = 500;
export const WALL_H = 520;
export const FLOOR: Rect = { x: 30, y: 400, w: 440, h: 100 };
const OUTLINE = 0x241f1a;

function quadPoint(p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, t: number) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}
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
  g.fillRect(0, 0, WALL_W, FLOOR.y + 10);
  g.lineStyle(4, OUTLINE, 1);
  g.lineBetween(0, 16, WALL_W, 16);

  g.fillStyle(floorColor, 1);
  g.fillRect(0, FLOOR.y - 10, WALL_W, WALL_H - (FLOOR.y - 10));
  g.lineStyle(2, 0x00000030, 1);
  for (let x = -30; x < WALL_W + 60; x += 32) g.lineBetween(x, FLOOR.y - 10, x + 70, WALL_H);
  g.lineStyle(4, OUTLINE, 1);
  g.lineBetween(0, FLOOR.y - 10, WALL_W, FLOOR.y - 10);

  return g;
}

function groundShadow(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number) {
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(x, y, w, 10);
}

/** ============ FILE NO.01 — 서재: 벽 4개 ============ */

function libraryWallClue(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xa9c9c2, 0xc98a4b);

  g.fillStyle(0xe07a92, 1);
  g.fillRoundedRect(150, FLOOR.y + 15, 200, 55, 12);
  g.lineStyle(4, OUTLINE, 1);
  g.strokeRoundedRect(150, FLOOR.y + 15, 200, 55, 12);

  // 책상 + 편지 (clue)
  const deskRect: Rect = { x: 170, y: 240, w: 160, h: 70 };
  groundShadow(g, 250, FLOOR.y + 12, 90);
  g.fillStyle(0x3f6e68, 1);
  g.fillRoundedRect(deskRect.x, deskRect.y + 30, deskRect.w, 46, 8);
  g.lineStyle(4, OUTLINE, 1);
  g.strokeRoundedRect(deskRect.x, deskRect.y + 30, deskRect.w, 46, 8);
  g.fillStyle(0xfdf1c8, 1);
  g.fillRoundedRect(deskRect.x + 48, deskRect.y, 64, 34, 3);
  g.lineStyle(3, OUTLINE, 1);
  g.strokeRoundedRect(deskRect.x + 48, deskRect.y, 64, 34, 3);

  // decoy: 액자
  const frameRect: Rect = { x: 60, y: 100, w: 64, h: 78 };
  g.fillStyle(0x3c2a20, 1);
  g.fillRect(frameRect.x, frameRect.y, frameRect.w, frameRect.h);
  g.lineStyle(3, OUTLINE, 1);
  g.strokeRect(frameRect.x, frameRect.y, frameRect.w, frameRect.h);
  g.fillStyle(0xe8dcc0, 1);
  g.fillRect(frameRect.x + 6, frameRect.y + 6, frameRect.w - 12, frameRect.h - 12);
  g.fillStyle(0x7ba0d0, 1);
  g.fillRect(frameRect.x + 10, frameRect.y + 10, frameRect.w - 20, (frameRect.h - 20) * 0.6);

  return {
    label: "책상",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "desk", kind: "clue", rect: deskRect, point: { x: 250, y: FLOOR.y + 30 } },
      { id: "painting", kind: "decoy", rect: frameRect, point: { x: 92, y: FLOOR.y + 30 }, decoyMessage: "풍경화 그림이다. 별다른 건 없다." },
    ],
  };
}

function libraryWallLock(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xa9c9c2, 0xc98a4b);

  const cabRect: Rect = { x: 160, y: 210, w: 180, h: 130 };
  groundShadow(g, 250, FLOOR.y + 10, 110);
  g.fillStyle(0xc1503a, 1);
  g.fillRoundedRect(cabRect.x, cabRect.y, cabRect.w, cabRect.h, 14);
  g.lineStyle(5, OUTLINE, 1);
  g.strokeRoundedRect(cabRect.x, cabRect.y, cabRect.w, cabRect.h, 14);
  g.fillStyle(0xe8b23c, 1);
  g.fillRoundedRect(cabRect.x + 12, cabRect.y + 12, 74, 48, 8);
  g.fillRoundedRect(cabRect.x + 94, cabRect.y + 12, 74, 48, 8);
  g.lineStyle(3, OUTLINE, 1);
  g.strokeRoundedRect(cabRect.x + 12, cabRect.y + 12, 74, 48, 8);
  g.strokeRoundedRect(cabRect.x + 94, cabRect.y + 12, 74, 48, 8);

  const gemColors = [0x7b5fd1, 0x3f8ce0, 0x5aa564, 0xe8622c];
  const dialY = cabRect.y + 82;
  for (let i = 0; i < 4; i++) {
    const gx = cabRect.x + 26 + i * 38;
    g.fillStyle(0xfdf1c8, 1);
    g.fillCircle(gx, dialY, 15);
    g.lineStyle(3, OUTLINE, 1);
    g.strokeCircle(gx, dialY, 15);
    g.fillStyle(gemColors[i], 1);
    g.fillCircle(gx, dialY, 9);
    g.lineStyle(2, OUTLINE, 1);
    g.strokeCircle(gx, dialY, 9);
  }
  g.fillStyle(0x8a3626, 1);
  g.fillRoundedRect(cabRect.x + 32, cabRect.y + 112, 116, 14, 6);
  g.lineStyle(3, OUTLINE, 1);
  g.strokeRoundedRect(cabRect.x + 32, cabRect.y + 112, 116, 14, 6);

  const barrelRect: Rect = { x: 380, y: 280, w: 80, h: 100 };
  groundShadow(g, 420, FLOOR.y + 10, 55);
  g.fillStyle(0xc98a4b, 1);
  g.fillRoundedRect(barrelRect.x, barrelRect.y, barrelRect.w, barrelRect.h, 16);
  g.lineStyle(4, OUTLINE, 1);
  g.strokeRoundedRect(barrelRect.x, barrelRect.y, barrelRect.w, barrelRect.h, 16);
  g.lineBetween(barrelRect.x, barrelRect.y + 30, barrelRect.x + barrelRect.w, barrelRect.y + 30);
  g.lineBetween(barrelRect.x, barrelRect.y + 68, barrelRect.x + barrelRect.w, barrelRect.y + 68);

  return {
    label: "서랍장",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "cabinet", kind: "lock", rect: cabRect, point: { x: 250, y: FLOOR.y + 25 } },
      { id: "barrel", kind: "decoy", rect: barrelRect, point: { x: 420, y: FLOOR.y + 25 }, decoyMessage: "빈 나무 통이다." },
    ],
  };
}

function libraryWallHidden(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xa9c9c2, 0xc98a4b);

  const fireRect: Rect = { x: 180, y: 270, w: 140, h: 105 };
  groundShadow(g, 250, FLOOR.y + 10, 85);
  g.fillStyle(0x8a4a2c, 1);
  g.fillRoundedRect(fireRect.x, fireRect.y, fireRect.w, fireRect.h, 14);
  g.lineStyle(4, OUTLINE, 1);
  g.strokeRoundedRect(fireRect.x, fireRect.y, fireRect.w, fireRect.h, 14);
  g.fillStyle(0x1c130c, 1);
  g.fillEllipse(fireRect.x + fireRect.w / 2, fireRect.y + 44, 48, 26);
  const fireColors = [0xf2c84b, 0xe8622c];
  for (let i = 0; i < 3; i++) {
    const fx = fireRect.x + fireRect.w / 2 - 16 + i * 16;
    g.fillStyle(fireColors[i % 2], 1);
    g.beginPath();
    g.moveTo(fx, fireRect.y + 58);
    g.lineTo(fx - 5, fireRect.y + 36);
    g.lineTo(fx + 5, fireRect.y + 40);
    g.lineTo(fx + 9, fireRect.y + 58);
    g.closePath();
    g.fillPath();
  }
  const knot = { x: fireRect.x + fireRect.w - 14, y: fireRect.y + 16 };
  g.fillStyle(0x3a2a1c, 1);
  g.fillCircle(knot.x, knot.y, 4.5);

  const stoolRect: Rect = { x: 60, y: 330, w: 76, h: 62 };
  groundShadow(g, 98, FLOOR.y + 10, 48);
  g.fillStyle(0xe8b23c, 1);
  g.fillRoundedRect(stoolRect.x, stoolRect.y + 34, 76, 20, 5);
  g.lineStyle(3, OUTLINE, 1);
  g.strokeRoundedRect(stoolRect.x, stoolRect.y + 34, 76, 20, 5);
  g.fillStyle(0x3f6e68, 1);
  g.fillRoundedRect(stoolRect.x + 10, stoolRect.y, 56, 34, 8);
  g.lineStyle(3, OUTLINE, 1);
  g.strokeRoundedRect(stoolRect.x + 10, stoolRect.y, 56, 34, 8);

  return {
    label: "벽난로",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "fireplace", kind: "hidden", rect: fireRect, point: { x: 250, y: FLOOR.y + 25 } },
      { id: "stool", kind: "decoy", rect: stoolRect, point: { x: 98, y: FLOOR.y + 25 }, decoyMessage: "낡은 나무 스툴이다." },
    ],
  };
}

function libraryWallAlt(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xa9c9c2, 0xc98a4b);

  const winRect: Rect = { x: 170, y: 110, w: 160, h: 170 };
  groundShadow(g, 250, FLOOR.y + 10, 85);
  g.fillStyle(0x3c2a20, 1);
  g.beginPath();
  g.moveTo(winRect.x, winRect.y + 120);
  g.lineTo(winRect.x, winRect.y + 34);
  g.arc(winRect.x + 80, winRect.y + 34, 80, Math.PI, 0, false);
  g.lineTo(winRect.x + 160, winRect.y + 120);
  g.closePath();
  g.fillPath();
  g.lineStyle(5, OUTLINE, 1);
  g.strokePath();

  g.fillStyle(0xfdf1c8, 1);
  g.beginPath();
  g.moveTo(winRect.x + 14, winRect.y + 112);
  g.lineTo(winRect.x + 14, winRect.y + 38);
  g.arc(winRect.x + 80, winRect.y + 38, 66, Math.PI, 0, false);
  g.lineTo(winRect.x + 146, winRect.y + 112);
  g.closePath();
  g.fillPath();
  g.lineStyle(3, OUTLINE, 1);
  g.strokePath();

  g.lineStyle(3, OUTLINE, 1);
  g.lineBetween(winRect.x + 80, winRect.y - 12, winRect.x + 80, winRect.y + 112);
  g.lineBetween(winRect.x + 14, winRect.y + 76, winRect.x + 146, winRect.y + 76);

  const latchY = winRect.y + 90;
  g.fillStyle(0xd9a441, 1);
  g.fillRoundedRect(winRect.x + 70, latchY, 20, 22, 4);
  g.lineStyle(3, OUTLINE, 1);
  g.strokeRoundedRect(winRect.x + 70, latchY, 20, 22, 4);

  const sackRect: Rect = { x: 370, y: 320, w: 76, h: 76 };
  groundShadow(g, 408, FLOOR.y + 10, 48);
  g.fillStyle(0xe8dcc0, 1);
  g.beginPath();
  g.moveTo(sackRect.x, sackRect.y + 68);
  quadCurveTo(g, { x: sackRect.x, y: sackRect.y + 68 }, { x: sackRect.x - 5, y: sackRect.y + 16 }, { x: sackRect.x + 38, y: sackRect.y });
  quadCurveTo(g, { x: sackRect.x + 38, y: sackRect.y }, { x: sackRect.x + 82, y: sackRect.y + 16 }, { x: sackRect.x + 76, y: sackRect.y + 68 });
  g.closePath();
  g.fillPath();
  g.lineStyle(3, OUTLINE, 1);
  g.strokePath();

  return {
    label: "창문",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "window", kind: "alt", rect: winRect, point: { x: 250, y: FLOOR.y + 25 } },
      { id: "sack", kind: "decoy", rect: sackRect, point: { x: 408, y: FLOOR.y + 25 }, decoyMessage: "곡물 자루다. 별다른 건 없다." },
    ],
  };
}

/** ============ FILE NO.02 — 온실: 벽 4개 ============ */

function greenhouseWallClue(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xbfe0d6, 0x8a6a3c);

  const tableRect: Rect = { x: 180, y: 260, w: 140, h: 70 };
  groundShadow(g, 250, FLOOR.y + 10, 85);
  g.fillStyle(0x6b8f5a, 1);
  g.fillRoundedRect(tableRect.x, tableRect.y + 22, tableRect.w, 46, 8);
  g.lineStyle(4, OUTLINE, 1);
  g.strokeRoundedRect(tableRect.x, tableRect.y + 22, tableRect.w, 46, 8);
  g.fillStyle(0xfdf1c8, 1);
  g.fillRoundedRect(tableRect.x + 42, tableRect.y, 56, 32, 3);
  g.lineStyle(3, OUTLINE, 1);
  g.strokeRoundedRect(tableRect.x + 42, tableRect.y, 56, 32, 3);

  const canRect: Rect = { x: 70, y: 330, w: 50, h: 42 };
  groundShadow(g, 95, FLOOR.y + 10, 40);
  g.fillStyle(0x8fa9a3, 1);
  g.fillEllipse(canRect.x + 25, canRect.y + 21, 46, 34);
  g.lineStyle(3, OUTLINE, 1);
  g.strokeEllipse(canRect.x + 25, canRect.y + 21, 46, 34);

  return {
    label: "작업대",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "journal-table", kind: "clue", rect: tableRect, point: { x: 250, y: FLOOR.y + 25 } },
      { id: "watering-can", kind: "decoy", rect: canRect, point: { x: 95, y: FLOOR.y + 25 }, decoyMessage: "빈 물뿌리개다." },
    ],
  };
}

function greenhouseWallLock(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xbfe0d6, 0x8a6a3c);

  const rowRect: Rect = { x: 110, y: 300, w: 280, h: 80 };
  groundShadow(g, 250, FLOOR.y + 10, 150);
  g.fillStyle(0x6b4a30, 1);
  g.fillRoundedRect(rowRect.x, rowRect.y + 34, rowRect.w, 34, 6);
  g.lineStyle(4, OUTLINE, 1);
  g.strokeRoundedRect(rowRect.x, rowRect.y + 34, rowRect.w, 34, 6);

  const plantColors = [0xe07a92, 0xe8b23c, 0xfdf1c8, 0x7b5fd1, 0xe8622c];
  for (let i = 0; i < 5; i++) {
    const px = rowRect.x + 28 + i * 56;
    g.fillStyle(0xc98a4b, 1);
    g.fillCircle(px, rowRect.y + 34, 16);
    g.lineStyle(3, OUTLINE, 1);
    g.strokeCircle(px, rowRect.y + 34, 16);
    g.fillStyle(0x5aa564, 1);
    g.fillCircle(px, rowRect.y + 12, 12);
    g.lineStyle(2, OUTLINE, 1);
    g.strokeCircle(px, rowRect.y + 12, 12);
    g.fillStyle(plantColors[i], 1);
    g.fillCircle(px, rowRect.y + 4, 5);
  }

  const potRect: Rect = { x: 410, y: 320, w: 50, h: 50 };
  groundShadow(g, 435, FLOOR.y + 10, 38);
  g.fillStyle(0xc98a4b, 1);
  g.fillCircle(435, 348, 16);
  g.lineStyle(3, OUTLINE, 1);
  g.strokeCircle(435, 348, 16);
  g.fillStyle(0x5aa564, 1);
  g.fillCircle(435, 328, 12);
  g.lineStyle(2, OUTLINE, 1);
  g.strokeCircle(435, 328, 12);

  return {
    label: "화분들",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "flower-row", kind: "lock", rect: rowRect, point: { x: 250, y: FLOOR.y + 20 } },
      { id: "deco-pot", kind: "decoy", rect: potRect, point: { x: 435, y: FLOOR.y + 20 }, decoyMessage: "관상용 화분이다." },
    ],
  };
}

function greenhouseWallHidden(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xbfe0d6, 0x8a6a3c);

  groundShadow(g, 250, FLOOR.y + 10, 55);
  g.lineStyle(10, 0x8a8f90, 1);
  g.lineBetween(150, 340, 230, 340);
  g.fillStyle(0xb0b5b6, 1);
  g.fillCircle(250, 340, 22);
  g.lineStyle(3, OUTLINE, 1);
  g.strokeCircle(250, 340, 22);
  g.lineStyle(3, 0x4a4a4a, 1);
  g.lineBetween(250 - 15, 340, 250 + 15, 340);
  g.lineBetween(250, 340 - 15, 250, 340 + 15);

  const benchRect: Rect = { x: 370, y: 340, w: 110, h: 32 };
  groundShadow(g, 425, FLOOR.y + 10, 62);
  g.fillStyle(0x6b8f5a, 1);
  g.fillRoundedRect(benchRect.x, benchRect.y, benchRect.w, benchRect.h, 6);
  g.lineStyle(4, OUTLINE, 1);
  g.strokeRoundedRect(benchRect.x, benchRect.y, benchRect.w, benchRect.h, 6);

  return {
    label: "배관",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "valve", kind: "hidden", rect: { x: 220, y: 310, w: 60, h: 60 }, point: { x: 250, y: FLOOR.y + 25 } },
      { id: "bench", kind: "decoy", rect: benchRect, point: { x: 425, y: FLOOR.y + 25 }, decoyMessage: "앉아서 쉬는 벤치다." },
    ],
  };
}

function greenhouseWallAlt(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xbfe0d6, 0x8a6a3c);

  groundShadow(g, 250, FLOOR.y + 10, 45);
  g.fillStyle(0xfdf1c8, 1);
  g.fillCircle(250, 200, 38);
  g.lineStyle(4, OUTLINE, 1);
  g.strokeCircle(250, 200, 38);
  g.fillStyle(0xe8622c, 1);
  g.fillCircle(250, 200, 5);
  g.lineStyle(3, 0xe8622c, 1);
  g.lineBetween(250, 200, 268, 184);

  const doorRect: Rect = { x: 370, y: 220, w: 100, h: 170 };
  groundShadow(g, 420, FLOOR.y + 10, 62);
  g.fillStyle(0x6b4a30, 1);
  g.fillRoundedRect(doorRect.x, doorRect.y, doorRect.w, doorRect.h, 8);
  g.lineStyle(4, OUTLINE, 1);
  g.strokeRoundedRect(doorRect.x, doorRect.y, doorRect.w, doorRect.h, 8);
  g.fillStyle(0x3a2a1c, 1);
  g.fillCircle(doorRect.x + 16, doorRect.y + 90, 11);
  g.lineStyle(2, OUTLINE, 1);
  g.strokeCircle(doorRect.x + 16, doorRect.y + 90, 11);

  return {
    label: "온도조절기",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "thermostat", kind: "alt", rect: { x: 212, y: 162, w: 76, h: 76 }, point: { x: 250, y: FLOOR.y + 25 } },
      { id: "shed-door", kind: "decoy", rect: doorRect, point: { x: 420, y: FLOOR.y + 25 }, decoyMessage: "잠긴 창고 문이다. 열리지 않는다." },
    ],
  };
}

export const LIBRARY_WALLS = [libraryWallClue, libraryWallLock, libraryWallHidden, libraryWallAlt];
export const GREENHOUSE_WALLS = [greenhouseWallClue, greenhouseWallLock, greenhouseWallHidden, greenhouseWallAlt];
