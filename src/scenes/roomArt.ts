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
  rect: Rect;
  point: { x: number; y: number };
  decoyMessage?: string;
}

export interface WallLayout {
  label: string;
  floor: Rect;
  objects: RoomObject[];
  gameObjects: Phaser.GameObjects.GameObject[];
}

export const WALL_W = 500;
export const WALL_H = 520;
/** 캐릭터 이동 판정용 바닥 사각형 (실제로 그려지는 바닥은 사다리꼴이라 이 사각형보다 조금 더 넓게 보임) */
export const FLOOR: Rect = { x: 20, y: 340, w: 460, h: 180 };
const OUTLINE = 0x241f1a;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// ---------- 그리드: 바닥(원근 사다리꼴)과 벽(평면) 좌표계 ----------
const CEIL_FRONT = { y: 0, xLeft: 0, xRight: WALL_W };
const CEIL_BACK = { y: 40, xLeft: 40, xRight: WALL_W - 40 };
const WALL_RECT: Rect = { x: 40, y: 40, w: WALL_W - 80, h: 240 };
const FLOOR_BACK = { y: 280, xLeft: 40, xRight: WALL_W - 40 };
const FLOOR_FRONT = { y: 520, xLeft: 0, xRight: WALL_W };

/** depthT: 0=바로 앞, 1=벽 밑(가장 멀리) / colT: 0=왼쪽, 1=오른쪽 */
function floorPoint(depthT: number, colT: number) {
  const xLeft = lerp(FLOOR_FRONT.xLeft, FLOOR_BACK.xLeft, depthT);
  const xRight = lerp(FLOOR_FRONT.xRight, FLOOR_BACK.xRight, depthT);
  return {
    x: lerp(xLeft, xRight, colT),
    y: lerp(FLOOR_FRONT.y, FLOOR_BACK.y, depthT),
    scale: lerp(1.0, 0.55, depthT),
  };
}

/** colT/rowT: 0~1, 벽 사각형(WALL_RECT) 안의 위치 — 원근 스케일 없이 항상 같은 평면 */
function wallPoint(colT: number, rowT: number) {
  return { x: WALL_RECT.x + colT * WALL_RECT.w, y: WALL_RECT.y + rowT * WALL_RECT.h };
}

function floorRectBox(cx: number, cy: number, s: number, wBase = 100, hBase = 120): Rect {
  return { x: cx - (wBase * s) / 2, y: cy - hBase * s, w: wBase * s, h: hBase * s };
}
function wallRectBox(cx: number, cy: number, wBase = 90, hBase = 90): Rect {
  return { x: cx - wBase / 2, y: cy - hBase / 2, w: wBase, h: hBase };
}

function quadPoint(p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, t: number) {
  const mt = 1 - t;
  return { x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x, y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y };
}
function quadCurveTo(g: Phaser.GameObjects.Graphics, from: { x: number; y: number }, ctrl: { x: number; y: number }, to: { x: number; y: number }, segments = 12) {
  for (let i = 1; i <= segments; i++) {
    const p = quadPoint(from, ctrl, to, i / segments);
    g.lineTo(p.x, p.y);
  }
}

// ---------- 바닥/벽/천장 베이스 (원근 그리드 라인 포함) ----------
function drawBase(scene: Phaser.Scene, bucket: Phaser.GameObjects.GameObject[], wallColor: number, floorColor: number, ceilColor: number) {
  const g = scene.add.graphics();
  bucket.push(g);

  // 천장 (사다리꼴, 안쪽으로 갈수록 좁아짐)
  g.fillStyle(ceilColor, 1);
  g.beginPath();
  g.moveTo(CEIL_FRONT.xLeft, CEIL_FRONT.y);
  g.lineTo(CEIL_BACK.xLeft, CEIL_BACK.y);
  g.lineTo(CEIL_BACK.xRight, CEIL_BACK.y);
  g.lineTo(CEIL_FRONT.xRight, CEIL_FRONT.y);
  g.closePath();
  g.fillPath();

  // 벽 (평면)
  g.fillStyle(wallColor, 1);
  g.fillRect(WALL_RECT.x, WALL_RECT.y, WALL_RECT.w, WALL_RECT.h);
  g.lineStyle(4, OUTLINE, 1);
  g.strokeRect(WALL_RECT.x, WALL_RECT.y, WALL_RECT.w, WALL_RECT.h);

  // 바닥 (사다리꼴, 앞으로 갈수록 넓어짐) + 원근 그리드 라인
  g.fillStyle(floorColor, 1);
  g.beginPath();
  g.moveTo(FLOOR_FRONT.xLeft, FLOOR_FRONT.y);
  g.lineTo(FLOOR_BACK.xLeft, FLOOR_BACK.y);
  g.lineTo(FLOOR_BACK.xRight, FLOOR_BACK.y);
  g.lineTo(FLOOR_FRONT.xRight, FLOOR_FRONT.y);
  g.closePath();
  g.fillPath();

  g.lineStyle(2, 0x000000, 0.22);
  for (let i = 0; i <= 4; i++) {
    const t = i / 4;
    const a = floorPoint(0, t);
    const b = floorPoint(1, t);
    g.lineBetween(a.x, a.y, b.x, b.y);
  }
  for (const dt of [0.33, 0.66]) {
    const a = floorPoint(dt, 0);
    const b = floorPoint(dt, 1);
    g.lineBetween(a.x, a.y, b.x, b.y);
  }

  g.lineStyle(4, OUTLINE, 1);
  g.lineBetween(FLOOR_BACK.xLeft, FLOOR_BACK.y, FLOOR_BACK.xRight, FLOOR_BACK.y);

  return g;
}

function shadow(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number) {
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(cx, cy, 70 * s, 16 * s);
}

// ---------- 오브젝트 드로잉 (바닥 오브젝트: cx,cy = 바닥에 닿는 기준점 / 벽 오브젝트: cx,cy = 중심) ----------
function drawDeskLetter(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number) {
  shadow(g, cx, cy, s);
  const w = 150 * s, h = 50 * s;
  g.fillStyle(0x3f6e68, 1);
  g.fillRoundedRect(cx - w / 2, cy - h, w, h, 8 * s);
  g.lineStyle(4 * s, OUTLINE, 1);
  g.strokeRoundedRect(cx - w / 2, cy - h, w, h, 8 * s);
  const lw = 60 * s, lh = 36 * s;
  g.fillStyle(0xfdf1c8, 1);
  g.fillRoundedRect(cx - lw / 2, cy - h - lh + 8 * s, lw, lh, 3 * s);
  g.lineStyle(3 * s, OUTLINE, 1);
  g.strokeRoundedRect(cx - lw / 2, cy - h - lh + 8 * s, lw, lh, 3 * s);
}

function drawDialCabinet(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number) {
  shadow(g, cx, cy, s);
  const w = 190 * s, h = 140 * s;
  g.fillStyle(0xc1503a, 1);
  g.fillRoundedRect(cx - w / 2, cy - h, w, h, 14 * s);
  g.lineStyle(5 * s, OUTLINE, 1);
  g.strokeRoundedRect(cx - w / 2, cy - h, w, h, 14 * s);
  g.fillStyle(0xe8b23c, 1);
  g.fillRoundedRect(cx - w / 2 + 12 * s, cy - h + 12 * s, w / 2 - 18 * s, 55 * s, 8 * s);
  g.fillRoundedRect(cx + 6 * s, cy - h + 12 * s, w / 2 - 18 * s, 55 * s, 8 * s);
  g.lineStyle(3 * s, OUTLINE, 1);
  g.strokeRoundedRect(cx - w / 2 + 12 * s, cy - h + 12 * s, w / 2 - 18 * s, 55 * s, 8 * s);
  g.strokeRoundedRect(cx + 6 * s, cy - h + 12 * s, w / 2 - 18 * s, 55 * s, 8 * s);
  const gemColors = [0x7b5fd1, 0x3f8ce0, 0x5aa564, 0xe8622c];
  const dialY = cy - h + 95 * s;
  for (let i = 0; i < 4; i++) {
    const gx = cx - w / 2 + 30 * s + i * 40 * s;
    g.fillStyle(0xfdf1c8, 1);
    g.fillCircle(gx, dialY, 15 * s);
    g.lineStyle(3 * s, OUTLINE, 1);
    g.strokeCircle(gx, dialY, 15 * s);
    g.fillStyle(gemColors[i], 1);
    g.fillCircle(gx, dialY, 9 * s);
    g.lineStyle(2 * s, OUTLINE, 1);
    g.strokeCircle(gx, dialY, 9 * s);
  }
  g.fillStyle(0x8a3626, 1);
  g.fillRoundedRect(cx - w / 2 + 30 * s, cy - 30 * s, w - 60 * s, 14 * s, 6 * s);
  g.lineStyle(3 * s, OUTLINE, 1);
  g.strokeRoundedRect(cx - w / 2 + 30 * s, cy - 30 * s, w - 60 * s, 14 * s, 6 * s);
}

function drawFireplace(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number) {
  shadow(g, cx, cy, s);
  const w = 150 * s, h = 115 * s;
  g.fillStyle(0x8a4a2c, 1);
  g.fillRoundedRect(cx - w / 2, cy - h, w, h, 14 * s);
  g.lineStyle(4 * s, OUTLINE, 1);
  g.strokeRoundedRect(cx - w / 2, cy - h, w, h, 14 * s);
  g.fillStyle(0x1c130c, 1);
  g.fillEllipse(cx, cy - h + 46 * s, 50 * s, 28 * s);
  const fireColors = [0xf2c84b, 0xe8622c];
  for (let i = 0; i < 3; i++) {
    const fx = cx - 16 * s + i * 16 * s;
    g.fillStyle(fireColors[i % 2], 1);
    g.beginPath();
    g.moveTo(fx, cy - h + 62 * s);
    g.lineTo(fx - 5 * s, cy - h + 36 * s);
    g.lineTo(fx + 5 * s, cy - h + 40 * s);
    g.lineTo(fx + 9 * s, cy - h + 62 * s);
    g.closePath();
    g.fillPath();
  }
}

function drawWindow(g: Phaser.GameObjects.Graphics, cx: number, cy: number) {
  const w = 170, h = 190;
  g.fillStyle(0x3c2a20, 1);
  g.beginPath();
  g.moveTo(cx - w / 2, cy + h / 2);
  g.lineTo(cx - w / 2, cy - h / 2 + 40);
  g.arc(cx, cy - h / 2 + 40, w / 2, Math.PI, 0, false);
  g.lineTo(cx + w / 2, cy + h / 2);
  g.closePath();
  g.fillPath();
  g.lineStyle(5, OUTLINE, 1);
  g.strokePath();

  const iw = w - 32, ih = h - 32;
  g.fillStyle(0xfdf1c8, 1);
  g.beginPath();
  g.moveTo(cx - iw / 2, cy + ih / 2 - 16);
  g.lineTo(cx - iw / 2, cy - ih / 2 + 40);
  g.arc(cx, cy - ih / 2 + 40, iw / 2, Math.PI, 0, false);
  g.lineTo(cx + iw / 2, cy + ih / 2 - 16);
  g.closePath();
  g.fillPath();
  g.lineStyle(3, OUTLINE, 1);
  g.strokePath();

  g.lineStyle(3, OUTLINE, 1);
  g.lineBetween(cx, cy - h / 2, cx, cy + h / 2 - 16);
  g.lineBetween(cx - iw / 2, cy, cx + iw / 2, cy);

  g.fillStyle(0xd9a441, 1);
  g.fillRoundedRect(cx - 10, cy + h / 2 - 40, 20, 22, 4);
  g.lineStyle(3, OUTLINE, 1);
  g.strokeRoundedRect(cx - 10, cy + h / 2 - 40, 20, 22, 4);
}

function drawPaintingDecoy(g: Phaser.GameObjects.Graphics, cx: number, cy: number) {
  const w = 64, h = 78;
  g.fillStyle(0x3c2a20, 1);
  g.fillRect(cx - w / 2, cy - h / 2, w, h);
  g.lineStyle(3, OUTLINE, 1);
  g.strokeRect(cx - w / 2, cy - h / 2, w, h);
  g.fillStyle(0xe8dcc0, 1);
  g.fillRect(cx - w / 2 + 6, cy - h / 2 + 6, w - 12, h - 12);
  g.fillStyle(0x7ba0d0, 1);
  g.fillRect(cx - w / 2 + 10, cy - h / 2 + 10, w - 20, (h - 20) * 0.6);
}

function drawBarrelDecoy(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number) {
  shadow(g, cx, cy, s);
  const w = 76 * s, h = 96 * s;
  g.fillStyle(0xc98a4b, 1);
  g.fillRoundedRect(cx - w / 2, cy - h, w, h, 16 * s);
  g.lineStyle(4 * s, OUTLINE, 1);
  g.strokeRoundedRect(cx - w / 2, cy - h, w, h, 16 * s);
  g.lineBetween(cx - w / 2, cy - h + 30 * s, cx + w / 2, cy - h + 30 * s);
  g.lineBetween(cx - w / 2, cy - h + 66 * s, cx + w / 2, cy - h + 66 * s);
}

function drawStoolDecoy(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number) {
  shadow(g, cx, cy, s);
  const w = 72 * s;
  g.fillStyle(0xe8b23c, 1);
  g.fillRoundedRect(cx - w / 2, cy - 24 * s, w, 20 * s, 5 * s);
  g.lineStyle(3 * s, OUTLINE, 1);
  g.strokeRoundedRect(cx - w / 2, cy - 24 * s, w, 20 * s, 5 * s);
  g.fillStyle(0x3f6e68, 1);
  g.fillRoundedRect(cx - w / 2 + 10 * s, cy - 58 * s, w - 20 * s, 34 * s, 8 * s);
  g.lineStyle(3 * s, OUTLINE, 1);
  g.strokeRoundedRect(cx - w / 2 + 10 * s, cy - 58 * s, w - 20 * s, 34 * s, 8 * s);
}

function drawSackDecoy(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number) {
  shadow(g, cx, cy, s);
  const w = 74 * s, h = 68 * s;
  g.fillStyle(0xe8dcc0, 1);
  g.beginPath();
  g.moveTo(cx - w / 2, cy);
  quadCurveTo(g, { x: cx - w / 2, y: cy }, { x: cx - w / 2 - 4 * s, y: cy - h + 14 * s }, { x: cx, y: cy - h });
  quadCurveTo(g, { x: cx, y: cy - h }, { x: cx + w / 2 + 4 * s, y: cy - h + 14 * s }, { x: cx + w / 2, y: cy });
  g.closePath();
  g.fillPath();
  g.lineStyle(3 * s, OUTLINE, 1);
  g.strokePath();
}

function drawJournalTable(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number) {
  shadow(g, cx, cy, s);
  const w = 140 * s, h = 48 * s;
  g.fillStyle(0x6b8f5a, 1);
  g.fillRoundedRect(cx - w / 2, cy - h, w, h, 8 * s);
  g.lineStyle(4 * s, OUTLINE, 1);
  g.strokeRoundedRect(cx - w / 2, cy - h, w, h, 8 * s);
  const lw = 56 * s, lh = 32 * s;
  g.fillStyle(0xfdf1c8, 1);
  g.fillRoundedRect(cx - lw / 2, cy - h - lh + 6 * s, lw, lh, 3 * s);
  g.lineStyle(3 * s, OUTLINE, 1);
  g.strokeRoundedRect(cx - lw / 2, cy - h - lh + 6 * s, lw, lh, 3 * s);
}

function drawFlowerRow(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number) {
  shadow(g, cx, cy, s * 1.8);
  const w = 300 * s, h = 64 * s;
  g.fillStyle(0x6b4a30, 1);
  g.fillRoundedRect(cx - w / 2, cy - h, w, h, 6 * s);
  g.lineStyle(4 * s, OUTLINE, 1);
  g.strokeRoundedRect(cx - w / 2, cy - h, w, h, 6 * s);
  const plantColors = [0xe07a92, 0xe8b23c, 0xfdf1c8, 0x7b5fd1, 0xe8622c];
  for (let i = 0; i < 5; i++) {
    const px = cx - w / 2 + 30 * s + (i * (w - 60 * s)) / 4;
    g.fillStyle(0xc98a4b, 1);
    g.fillCircle(px, cy - h, 16 * s);
    g.lineStyle(3 * s, OUTLINE, 1);
    g.strokeCircle(px, cy - h, 16 * s);
    g.fillStyle(0x5aa564, 1);
    g.fillCircle(px, cy - h - 22 * s, 12 * s);
    g.lineStyle(2 * s, OUTLINE, 1);
    g.strokeCircle(px, cy - h - 22 * s, 12 * s);
    g.fillStyle(plantColors[i], 1);
    g.fillCircle(px, cy - h - 30 * s, 5 * s);
  }
}

function drawValve(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number) {
  shadow(g, cx, cy, s);
  g.lineStyle(10 * s, 0x8a8f90, 1);
  g.lineBetween(cx - 70 * s, cy - 22 * s, cx - 20 * s, cy - 22 * s);
  g.fillStyle(0xb0b5b6, 1);
  g.fillCircle(cx, cy - 22 * s, 22 * s);
  g.lineStyle(3 * s, OUTLINE, 1);
  g.strokeCircle(cx, cy - 22 * s, 22 * s);
  g.lineStyle(3 * s, 0x4a4a4a, 1);
  g.lineBetween(cx - 15 * s, cy - 22 * s, cx + 15 * s, cy - 22 * s);
  g.lineBetween(cx, cy - 37 * s, cx, cy - 7 * s);
}

function drawThermostat(g: Phaser.GameObjects.Graphics, cx: number, cy: number) {
  g.fillStyle(0xfdf1c8, 1);
  g.fillCircle(cx, cy, 38);
  g.lineStyle(4, OUTLINE, 1);
  g.strokeCircle(cx, cy, 38);
  g.fillStyle(0xe8622c, 1);
  g.fillCircle(cx, cy, 5);
  g.lineStyle(3, 0xe8622c, 1);
  g.lineBetween(cx, cy, cx + 18, cy - 16);
}

function drawWateringCanDecoy(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number) {
  shadow(g, cx, cy, s);
  g.fillStyle(0x8fa9a3, 1);
  g.fillEllipse(cx, cy - 21 * s, 46 * s, 34 * s);
  g.lineStyle(3 * s, OUTLINE, 1);
  g.strokeEllipse(cx, cy - 21 * s, 46 * s, 34 * s);
}

function drawDecoPotDecoy(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number) {
  shadow(g, cx, cy, s);
  g.fillStyle(0xc98a4b, 1);
  g.fillCircle(cx, cy - 16 * s, 16 * s);
  g.lineStyle(3 * s, OUTLINE, 1);
  g.strokeCircle(cx, cy - 16 * s, 16 * s);
  g.fillStyle(0x5aa564, 1);
  g.fillCircle(cx, cy - 40 * s, 12 * s);
  g.lineStyle(2 * s, OUTLINE, 1);
  g.strokeCircle(cx, cy - 40 * s, 12 * s);
}

function drawBenchDecoy(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number) {
  shadow(g, cx, cy, s);
  const w = 110 * s, h = 32 * s;
  g.fillStyle(0x6b8f5a, 1);
  g.fillRoundedRect(cx - w / 2, cy - h, w, h, 6 * s);
  g.lineStyle(4 * s, OUTLINE, 1);
  g.strokeRoundedRect(cx - w / 2, cy - h, w, h, 6 * s);
}

function drawShedDoorDecoy(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number) {
  shadow(g, cx, cy, s);
  const w = 100 * s, h = 170 * s;
  g.fillStyle(0x6b4a30, 1);
  g.fillRoundedRect(cx - w / 2, cy - h, w, h, 8 * s);
  g.lineStyle(4 * s, OUTLINE, 1);
  g.strokeRoundedRect(cx - w / 2, cy - h, w, h, 8 * s);
  g.fillStyle(0x3a2a1c, 1);
  g.fillCircle(cx - w / 2 + 16 * s, cy - h / 2, 11 * s);
  g.lineStyle(2 * s, OUTLINE, 1);
  g.strokeCircle(cx - w / 2 + 16 * s, cy - h / 2, 11 * s);
}

// ---------- 그리드 슬롯 상수 (모든 벽 공통 배치 규칙) ----------
const HERO_DEPTH = 0.68; // 실제 단서/장치: 벽 쪽 깊숙한 자리
const DECOY_DEPTH = 0.22; // 가짜 오브젝트: 앞쪽 자리
const STAND_DEPTH = 0.1; // 벽 부착 오브젝트를 조사할 때 서는 바닥 위치

/** ============ FILE NO.01 — 서재: 벽 4개 ============ */

function libraryWallClue(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xa9c9c2, 0xc98a4b, 0x8fb0a8);

  const hero = floorPoint(HERO_DEPTH, 0.5);
  drawDeskLetter(g, hero.x, hero.y, hero.scale);

  const decoy = floorPoint(DECOY_DEPTH, 0.82);
  drawBarrelDecoy(g, decoy.x, decoy.y, decoy.scale);

  return {
    label: "책상",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "desk", kind: "clue", rect: floorRectBox(hero.x, hero.y, hero.scale), point: { x: hero.x, y: hero.y } },
      { id: "barrel", kind: "decoy", rect: floorRectBox(decoy.x, decoy.y, decoy.scale, 76, 96), point: { x: decoy.x, y: decoy.y }, decoyMessage: "빈 나무 통이다." },
    ],
  };
}

function libraryWallLock(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xa9c9c2, 0xc98a4b, 0x8fb0a8);

  const hero = floorPoint(HERO_DEPTH, 0.5);
  drawDialCabinet(g, hero.x, hero.y, hero.scale);

  const decoy = floorPoint(DECOY_DEPTH, 0.16);
  drawStoolDecoy(g, decoy.x, decoy.y, decoy.scale);

  return {
    label: "서랍장",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "cabinet", kind: "lock", rect: floorRectBox(hero.x, hero.y, hero.scale, 190, 140), point: { x: hero.x, y: hero.y } },
      { id: "stool", kind: "decoy", rect: floorRectBox(decoy.x, decoy.y, decoy.scale, 72, 58), point: { x: decoy.x, y: decoy.y }, decoyMessage: "낡은 나무 스툴이다." },
    ],
  };
}

function libraryWallHidden(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xa9c9c2, 0xc98a4b, 0x8fb0a8);

  const hero = floorPoint(HERO_DEPTH, 0.5);
  drawFireplace(g, hero.x, hero.y, hero.scale);

  const decoy = floorPoint(DECOY_DEPTH, 0.84);
  drawSackDecoy(g, decoy.x, decoy.y, decoy.scale);

  return {
    label: "벽난로",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "fireplace", kind: "hidden", rect: floorRectBox(hero.x, hero.y, hero.scale, 150, 115), point: { x: hero.x, y: hero.y } },
      { id: "sack", kind: "decoy", rect: floorRectBox(decoy.x, decoy.y, decoy.scale, 74, 68), point: { x: decoy.x, y: decoy.y }, decoyMessage: "곡물 자루다. 별다른 건 없다." },
    ],
  };
}

function libraryWallAlt(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xa9c9c2, 0xc98a4b, 0x8fb0a8);

  const hero = wallPoint(0.5, 0.55);
  drawWindow(g, hero.x, hero.y);
  const heroStand = floorPoint(STAND_DEPTH, 0.5);

  const decoyWall = wallPoint(0.16, 0.32);
  drawPaintingDecoy(g, decoyWall.x, decoyWall.y);
  const decoyStand = floorPoint(STAND_DEPTH, 0.16);

  return {
    label: "창문",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "window", kind: "alt", rect: wallRectBox(hero.x, hero.y, 170, 190), point: { x: heroStand.x, y: heroStand.y } },
      { id: "painting", kind: "decoy", rect: wallRectBox(decoyWall.x, decoyWall.y, 64, 78), point: { x: decoyStand.x, y: decoyStand.y }, decoyMessage: "풍경화 그림이다. 별다른 건 없다." },
    ],
  };
}

/** ============ FILE NO.02 — 온실: 벽 4개 ============ */

function greenhouseWallClue(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xbfe0d6, 0x8a6a3c, 0xa9d4c8);

  const hero = floorPoint(HERO_DEPTH, 0.5);
  drawJournalTable(g, hero.x, hero.y, hero.scale);

  const decoy = floorPoint(DECOY_DEPTH, 0.18);
  drawWateringCanDecoy(g, decoy.x, decoy.y, decoy.scale);

  return {
    label: "작업대",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "journal-table", kind: "clue", rect: floorRectBox(hero.x, hero.y, hero.scale, 140, 48), point: { x: hero.x, y: hero.y } },
      { id: "watering-can", kind: "decoy", rect: floorRectBox(decoy.x, decoy.y, decoy.scale, 50, 42), point: { x: decoy.x, y: decoy.y }, decoyMessage: "빈 물뿌리개다." },
    ],
  };
}

function greenhouseWallLock(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xbfe0d6, 0x8a6a3c, 0xa9d4c8);

  const hero = floorPoint(HERO_DEPTH, 0.5);
  drawFlowerRow(g, hero.x, hero.y, hero.scale);

  const decoy = floorPoint(DECOY_DEPTH, 0.85);
  drawDecoPotDecoy(g, decoy.x, decoy.y, decoy.scale);

  return {
    label: "화분들",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "flower-row", kind: "lock", rect: floorRectBox(hero.x, hero.y, hero.scale, 300, 64), point: { x: hero.x, y: hero.y } },
      { id: "deco-pot", kind: "decoy", rect: floorRectBox(decoy.x, decoy.y, decoy.scale, 50, 50), point: { x: decoy.x, y: decoy.y }, decoyMessage: "관상용 화분이다." },
    ],
  };
}

function greenhouseWallHidden(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xbfe0d6, 0x8a6a3c, 0xa9d4c8);

  const hero = floorPoint(HERO_DEPTH, 0.5);
  drawValve(g, hero.x, hero.y, hero.scale);

  const decoy = floorPoint(DECOY_DEPTH, 0.8);
  drawBenchDecoy(g, decoy.x, decoy.y, decoy.scale);

  return {
    label: "배관",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "valve", kind: "hidden", rect: floorRectBox(hero.x, hero.y, hero.scale, 90, 60), point: { x: hero.x, y: hero.y } },
      { id: "bench", kind: "decoy", rect: floorRectBox(decoy.x, decoy.y, decoy.scale, 110, 32), point: { x: decoy.x, y: decoy.y }, decoyMessage: "앉아서 쉬는 벤치다." },
    ],
  };
}

function greenhouseWallAlt(scene: Phaser.Scene): WallLayout {
  const bucket: Phaser.GameObjects.GameObject[] = [];
  const g = drawBase(scene, bucket, 0xbfe0d6, 0x8a6a3c, 0xa9d4c8);

  const hero = wallPoint(0.5, 0.5);
  drawThermostat(g, hero.x, hero.y);
  const heroStand = floorPoint(STAND_DEPTH, 0.5);

  const decoy = floorPoint(DECOY_DEPTH, 0.82);
  drawShedDoorDecoy(g, decoy.x, decoy.y, decoy.scale);

  return {
    label: "온도조절기",
    floor: FLOOR,
    gameObjects: bucket,
    objects: [
      { id: "thermostat", kind: "alt", rect: wallRectBox(hero.x, hero.y, 76, 76), point: { x: heroStand.x, y: heroStand.y } },
      { id: "shed-door", kind: "decoy", rect: floorRectBox(decoy.x, decoy.y, decoy.scale, 100, 170), point: { x: decoy.x, y: decoy.y }, decoyMessage: "잠긴 창고 문이다. 열리지 않는다." },
    ],
  };
}

export const LIBRARY_WALLS = [libraryWallClue, libraryWallLock, libraryWallHidden, libraryWallAlt];
export const GREENHOUSE_WALLS = [greenhouseWallClue, greenhouseWallLock, greenhouseWallHidden, greenhouseWallAlt];
