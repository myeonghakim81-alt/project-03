import Phaser from "phaser";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RoomHotspots {
  /** 정석 경로 1단계 — 단서(편지 등)를 조사하는 지점 */
  clue: Rect;
  /** 정석 경로 2단계 — 코드를 입력하는 잠금장치 */
  lock: Rect;
  /** 히든 경로 — 배경 속에 숨은 지점 */
  hidden: Rect;
  /** 얼터너티브 경로 — 위험을 감수하고 조작하는 장치 */
  alt: Rect;
}

const ART_TOP = 84;
const ART_BOTTOM = 596;

/** FILE NO.01 — 서재 */
export function drawLibrary(scene: Phaser.Scene): RoomHotspots {
  const g = scene.add.graphics();

  // 벽
  g.fillGradientStyle(0x2a1f22, 0x2a1f22, 0x1a1315, 0x1a1315, 1);
  g.fillRect(0, ART_TOP, 1000, ART_BOTTOM - ART_TOP);

  // 바닥 러그
  g.fillStyle(0x4a2f2a, 1);
  g.fillRect(0, 520, 1000, ART_BOTTOM - 520);
  g.fillStyle(0x5c3c34, 1);
  g.fillRect(60, 534, 880, 46);
  g.lineStyle(2, 0x3a241f, 1);
  g.strokeRect(60, 534, 880, 46);

  // 책장 (lock)
  const lockRect: Rect = { x: 40, y: 120, w: 260, h: 380 };
  g.fillStyle(0x3d2b23, 1);
  g.fillRect(lockRect.x, lockRect.y, lockRect.w, lockRect.h);
  g.lineStyle(3, 0x241812, 1);
  g.strokeRect(lockRect.x, lockRect.y, lockRect.w, lockRect.h);
  const shelfColors = [0x8a3b3b, 0x3b5a8a, 0x3b8a5e, 0x8a7a3b, 0x5a3b8a];
  for (let row = 0; row < 4; row++) {
    const shelfY = lockRect.y + 16 + row * 90;
    g.lineStyle(4, 0x241812, 1);
    g.lineBetween(lockRect.x + 8, shelfY + 74, lockRect.x + lockRect.w - 8, shelfY + 74);
    let bx = lockRect.x + 14;
    for (let b = 0; b < 8; b++) {
      const bw = 10 + ((row * 7 + b * 5) % 10);
      const bh = 54 + ((row + b) % 3) * 6;
      g.fillStyle(shelfColors[(row + b) % shelfColors.length], 1);
      g.fillRect(bx, shelfY + (74 - bh), bw, bh);
      bx += bw + 3;
      if (bx > lockRect.x + lockRect.w - 20) break;
    }
  }
  // 다이얼 자물쇠
  const dialCx = lockRect.x + lockRect.w / 2;
  const dialCy = lockRect.y + lockRect.h - 40;
  g.fillStyle(0x1a1a1a, 1);
  g.fillCircle(dialCx, dialCy, 30);
  g.lineStyle(3, 0xc9a24a, 1);
  g.strokeCircle(dialCx, dialCy, 30);
  g.fillStyle(0xc9a24a, 1);
  g.fillCircle(dialCx, dialCy - 22, 3);

  // 창문 (alt)
  const altRect: Rect = { x: 420, y: 110, w: 200, h: 180 };
  g.fillStyle(0x0c1420, 1);
  g.fillRect(altRect.x, altRect.y, altRect.w, altRect.h);
  g.fillGradientStyle(0x274a6b, 0x274a6b, 0x162a3d, 0x162a3d, 0.9);
  g.fillRect(altRect.x + 8, altRect.y + 8, altRect.w - 16, altRect.h - 16);
  g.lineStyle(5, 0x2a1f22, 1);
  g.strokeRect(altRect.x, altRect.y, altRect.w, altRect.h);
  g.lineStyle(3, 0x2a1f22, 1);
  g.lineBetween(altRect.x + altRect.w / 2, altRect.y, altRect.x + altRect.w / 2, altRect.y + altRect.h);
  g.lineBetween(altRect.x, altRect.y + altRect.h / 2, altRect.x + altRect.w, altRect.y + altRect.h / 2);
  // 걸쇠
  g.fillStyle(0x8a8060, 1);
  g.fillRect(altRect.x + altRect.w / 2 - 5, altRect.y + altRect.h - 30, 10, 16);

  // 책상 + 편지 (clue)
  const clueRect: Rect = { x: 380, y: 420, w: 220, h: 90 };
  g.fillStyle(0x4a2f22, 1);
  g.fillRect(clueRect.x - 30, clueRect.y + 20, clueRect.w + 60, 70);
  g.lineStyle(3, 0x2a1810, 1);
  g.strokeRect(clueRect.x - 30, clueRect.y + 20, clueRect.w + 60, 70);
  g.fillStyle(0xece3cf, 1);
  g.fillRect(clueRect.x + clueRect.w / 2 - 40, clueRect.y, 80, 50);
  g.lineStyle(1, 0xb8ac8e, 1);
  for (let i = 0; i < 4; i++) {
    g.lineBetween(
      clueRect.x + clueRect.w / 2 - 32,
      clueRect.y + 10 + i * 9,
      clueRect.x + clueRect.w / 2 + 32,
      clueRect.y + 10 + i * 9
    );
  }

  // 벽난로 (hidden)
  const hiddenRect: Rect = { x: 760, y: 260, w: 200, h: 260 };
  g.fillStyle(0x352220, 1);
  g.fillRect(hiddenRect.x, hiddenRect.y, hiddenRect.w, 30); // 맨틀
  g.fillStyle(0x120a08, 1);
  g.fillRect(hiddenRect.x + 30, hiddenRect.y + 30, hiddenRect.w - 60, hiddenRect.h - 30);
  g.fillStyle(0xd9822b, 0.85);
  for (let i = 0; i < 5; i++) {
    g.fillTriangle(
      hiddenRect.x + 60 + i * 20,
      hiddenRect.y + hiddenRect.h - 10,
      hiddenRect.x + 50 + i * 20,
      hiddenRect.y + hiddenRect.h - 40 - (i % 2) * 10,
      hiddenRect.x + 70 + i * 20,
      hiddenRect.y + hiddenRect.h - 40 - (i % 2) * 10
    );
  }
  // 맨틀 위 옹이(레버) — 히든 지점
  const knotX = hiddenRect.x + hiddenRect.w - 20;
  const knotY = hiddenRect.y + 14;
  g.fillStyle(0x241812, 1);
  g.fillCircle(knotX, knotY, 6);

  return {
    clue: clueRect,
    lock: lockRect,
    alt: altRect,
    hidden: { x: knotX - 22, y: knotY - 22, w: 44, h: 44 },
  };
}

/** FILE NO.02 — 온실 */
export function drawGreenhouse(scene: Phaser.Scene): RoomHotspots {
  const g = scene.add.graphics();

  // 유리 벽 (그리드)
  g.fillGradientStyle(0x11241f, 0x11241f, 0x0a1613, 0x0a1613, 1);
  g.fillRect(0, ART_TOP, 1000, ART_BOTTOM - ART_TOP);
  g.lineStyle(1, 0x2c4a3f, 0.6);
  for (let x = 0; x <= 1000; x += 60) g.lineBetween(x, ART_TOP, x, ART_BOTTOM);
  for (let y = ART_TOP; y <= ART_BOTTOM; y += 60) g.lineBetween(0, y, 1000, y);

  // 바닥
  g.fillStyle(0x2b241a, 1);
  g.fillRect(0, 520, 1000, ART_BOTTOM - 520);

  // 재배 일지가 놓인 작업대 (clue)
  const clueRect: Rect = { x: 60, y: 150, w: 180, h: 110 };
  g.fillStyle(0x4a3a28, 1);
  g.fillRect(clueRect.x, clueRect.y + 60, clueRect.w, 50);
  g.lineStyle(2, 0x2a1f14, 1);
  g.strokeRect(clueRect.x, clueRect.y + 60, clueRect.w, 50);
  g.fillStyle(0xd8c9a0, 1);
  g.fillRect(clueRect.x + 40, clueRect.y + 20, 100, 45);
  g.lineStyle(1, 0x9c8a5e, 1);
  for (let i = 0; i < 3; i++) {
    g.lineBetween(clueRect.x + 48, clueRect.y + 32 + i * 10, clueRect.x + 132, clueRect.y + 32 + i * 10);
  }

  // 온도조절기 (alt)
  const altRect: Rect = { x: 820, y: 140, w: 120, h: 120 };
  g.fillStyle(0xd8d2c2, 1);
  g.fillCircle(altRect.x + altRect.w / 2, altRect.y + altRect.h / 2, 50);
  g.lineStyle(3, 0x8a8270, 1);
  g.strokeCircle(altRect.x + altRect.w / 2, altRect.y + altRect.h / 2, 50);
  g.fillStyle(0xb5442e, 1);
  g.fillCircle(altRect.x + altRect.w / 2, altRect.y + altRect.h / 2, 6);
  g.lineStyle(3, 0xb5442e, 1);
  g.lineBetween(
    altRect.x + altRect.w / 2,
    altRect.y + altRect.h / 2,
    altRect.x + altRect.w / 2 + 30,
    altRect.y + altRect.h / 2 - 20
  );

  // 화분 배열 (lock)
  const lockRect: Rect = { x: 80, y: 440, w: 840, h: 120 };
  g.fillStyle(0x3a2c1e, 1);
  g.fillRect(lockRect.x, lockRect.y + 70, lockRect.w, 30); // 화단 받침
  const plantColors = [0xd3565f, 0xe7b93b, 0xe9e4d0, 0xcf7fd8];
  for (let i = 0; i < 10; i++) {
    const px = lockRect.x + 30 + i * 82;
    const py = lockRect.y + 70;
    g.fillStyle(0x7a5a3a, 1);
    g.fillRect(px - 16, py, 32, 28);
    g.fillStyle(0x3f7a4a, 1);
    g.fillTriangle(px, py - 30, px - 20, py + 4, px + 20, py + 4);
    g.fillStyle(plantColors[i % plantColors.length], 1);
    g.fillCircle(px, py - 26, 6);
  }

  // 관수 배관 + 밸브 (hidden)
  const pipeY = 500;
  g.lineStyle(10, 0x555a5c, 1);
  g.lineBetween(0, pipeY, 90, pipeY);
  g.fillStyle(0x8a8f90, 1);
  g.fillCircle(60, pipeY, 18);
  g.lineStyle(3, 0x2a2c2c, 1);
  g.strokeCircle(60, pipeY, 18);
  g.lineBetween(60 - 14, pipeY, 60 + 14, pipeY);
  g.lineBetween(60, pipeY - 14, 60, pipeY + 14);

  return {
    clue: clueRect,
    lock: lockRect,
    alt: altRect,
    hidden: { x: 60 - 24, y: pipeY - 24, w: 48, h: 48 },
  };
}
