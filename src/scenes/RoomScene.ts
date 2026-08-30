import Phaser from "phaser";
import type { Difficulty, RouteId, StageConfig } from "../types";
import { getStage } from "../data/stages";
import { DIFFICULTY_SETTINGS } from "../data/difficulty";
import { calculateScore } from "../systems/score";
import { LIBRARY_WALLS, GREENHOUSE_WALLS, WALL_W, WALL_H, type WallLayout, type RoomObject, type RoomObjectKind } from "./roomArt";

interface RoomInitData {
  stageId: string;
  difficulty: Difficulty;
}

const PLAYER_SPEED = 220; // px/sec
const PLAYER_RADIUS = 14;
const INTERACT_RADIUS = 66;

// 벽 3개(왼쪽 미리보기/가운데 활성/오른쪽 미리보기)를 한 화면에 배치하기 위한 상수
const TOP_Y = 66;
const CENTER_DISPLAY_W = 440;
const CENTER_SCALE = CENTER_DISPLAY_W / WALL_W;
const SIDE_DISPLAY_W = (1000 - CENTER_DISPLAY_W) / 2;
const SIDE_SCALE_X = SIDE_DISPLAY_W / WALL_W;
const CENTER_X = (1000 - CENTER_DISPLAY_W) / 2;
const LEFT_X = 0;
const RIGHT_X = 1000 - SIDE_DISPLAY_W;

function routeOfKind(kind: RoomObjectKind): RouteId | null {
  if (kind === "clue" || kind === "lock") return "standard";
  if (kind === "hidden") return "hidden";
  if (kind === "alt") return "alternative";
  return null;
}

function isAnnotated(route: RouteId, difficulty: Difficulty): boolean {
  if (difficulty === "easy") return true;
  if (difficulty === "medium") return route === "standard";
  return false; // hard: 안내 없음
}

export class RoomScene extends Phaser.Scene {
  private stage!: StageConfig;
  private difficulty!: Difficulty;
  private wallDrawFns!: Array<(scene: Phaser.Scene) => WallLayout>;
  private wallIndex = 0;

  private timeLimitSec = 0;
  private remainingMs = 0;
  private hintsUsed = 0;
  private hintsLeft = 0;
  private enteredCode = "";
  private ended = false;

  private layout!: WallLayout;
  private centerContainer!: Phaser.GameObjects.Container;
  private leftContainer!: Phaser.GameObjects.Container;
  private rightContainer!: Phaser.GameObjects.Container;
  private player!: Phaser.GameObjects.Container;
  private moveTarget: { x: number; y: number } | null = null;
  private activeObject: RoomObject | null = null;

  private timerText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private wallLabelText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private codeDisplay!: Phaser.GameObjects.Text;
  private lockPanel!: Phaser.GameObjects.Container;
  private altPanel!: Phaser.GameObjects.Container;
  private interactPrompt!: Phaser.GameObjects.Container;
  private interactLabel!: Phaser.GameObjects.Text;

  constructor() {
    super("Room");
  }

  init(data: RoomInitData) {
    this.stage = getStage(data.stageId);
    this.difficulty = data.difficulty;
    this.wallDrawFns = this.stage.id === "file-02" ? GREENHOUSE_WALLS : LIBRARY_WALLS;
    this.wallIndex = 0;
    const settings = DIFFICULTY_SETTINGS[this.difficulty];
    this.timeLimitSec = Math.round(this.stage.baseTimeLimitSec * settings.timeMultiplier);
    this.remainingMs = this.timeLimitSec * 1000;
    this.hintsUsed = 0;
    this.hintsLeft = settings.hintCount;
    this.enteredCode = "";
    this.ended = false;
    this.moveTarget = null;
    this.activeObject = null;
  }

  create() {
    const settings = DIFFICULTY_SETTINGS[this.difficulty];
    this.cameras.main.setBackgroundColor("#100e14");

    this.add
      .text(this.scale.width / 2, 12, `FILE NO.${String(this.stage.fileNo).padStart(2, "0")} — ${this.stage.title} · ${settings.label}`, {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: "#241f1a",
      })
      .setOrigin(0.5, 0)
      .setDepth(30);

    this.timerText = this.add
      .text(this.scale.width - 16, 10, "", { fontFamily: "monospace", fontSize: "24px", color: "#241f1a" })
      .setOrigin(1, 0)
      .setDepth(30);

    this.hintText = this.add
      .text(16, 12, "", { fontFamily: "monospace", fontSize: "13px", color: "#1c3550" })
      .setDepth(30);
    const hintBtn = this.makeSmallButton(16, 34, 100, 24, "힌트 사용");
    hintBtn.on("pointerdown", () => this.useHint());

    this.wallLabelText = this.add
      .text(this.scale.width / 2, 38, "", { fontFamily: "sans-serif", fontSize: "13px", color: "#3c2a20" })
      .setOrigin(0.5, 0)
      .setDepth(30);

    this.messageText = this.add
      .text(this.scale.width / 2, this.scale.height - 8, "바닥을 클릭해서 이동, 화살표로 방을 둘러보세요.", {
        fontFamily: "sans-serif",
        fontSize: "13px",
        color: "#100e14",
        backgroundColor: "#fdf1c8dd",
        padding: { x: 10, y: 4 },
        wordWrap: { width: 900 },
        align: "center",
      })
      .setOrigin(0.5, 1)
      .setDepth(30);

    // 회전(벽 전환) 버튼
    this.makeRotateButton(this.scale.width - 56, this.scale.height - 56, "▶", () => this.rotateWall(1));
    this.makeRotateButton(56, this.scale.height - 56, "◀", () => this.rotateWall(-1));

    // 캐릭터 (실제 위치는 renderWall에서 가운데 컨테이너 기준으로 잡음)
    this.player = this.createPlayer(0, 0);

    // 상호작용 프롬프트 (가운데 컨테이너의 자식으로 옮겨 다니며 사용됨)
    this.interactLabel = this.add
      .text(0, 0, "🔍 조사하기", {
        fontFamily: "sans-serif",
        fontSize: "13px",
        color: "#100e14",
        backgroundColor: "#fdf1c8",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5, 1);
    this.interactLabel.setInteractive({ useHandCursor: true });
    this.interactLabel.on("pointerdown", () => this.tryInteract());
    this.interactPrompt = this.add.container(0, 0, [this.interactLabel]).setVisible(false);

    this.input.keyboard?.on("keydown-SPACE", () => this.tryInteract());

    this.buildLockPanel();
    this.buildAltPanel();

    this.renderWall(0);

    this.updateHintText();
    this.updateTimerText();
  }

  update(_time: number, delta: number) {
    if (this.ended) return;

    this.remainingMs -= delta;
    if (this.remainingMs <= 0) {
      this.remainingMs = 0;
      this.updateTimerText();
      this.finish(null);
      return;
    }
    this.updateTimerText();

    this.updateMovement(delta);
    this.updateInteractPrompt();
  }

  // ---------- 벽 회전 ----------
  private rotateWall(delta: number) {
    if (this.lockPanel.visible || this.altPanel.visible || this.ended) return;
    const count = this.wallDrawFns.length;
    this.wallIndex = (this.wallIndex + delta + count) % count;
    this.renderWall(this.wallIndex);
  }

  private renderWall(index: number) {
    // player/interactPrompt는 씬 전체에서 재사용하는 영속 오브젝트라
    // 컨테이너를 destroy하기 전에 먼저 떼어내야 함(그대로 두면 destroy와 함께 파괴됨)
    this.centerContainer?.remove([this.player, this.interactPrompt]);
    this.leftContainer?.destroy(true);
    this.centerContainer?.destroy(true);
    this.rightContainer?.destroy(true);

    const count = this.wallDrawFns.length;
    const leftLayout = this.wallDrawFns[(index - 1 + count) % count](this);
    const centerLayout = this.wallDrawFns[index](this);
    const rightLayout = this.wallDrawFns[(index + 1) % count](this);

    // 양옆 벽: 미리보기용(비활성) — 살짝 좁게 압축해서 동시에 3벽이 보이게 함
    this.leftContainer = this.add
      .container(LEFT_X, TOP_Y, leftLayout.gameObjects)
      .setScale(SIDE_SCALE_X, CENTER_SCALE)
      .setAlpha(0.7)
      .setDepth(0);
    const leftZone = this.add.zone(WALL_W / 2, WALL_H / 2, WALL_W, WALL_H).setInteractive({ useHandCursor: true });
    leftZone.on("pointerdown", () => this.rotateWall(-1));
    this.leftContainer.add(leftZone);

    this.rightContainer = this.add
      .container(RIGHT_X, TOP_Y, rightLayout.gameObjects)
      .setScale(SIDE_SCALE_X, CENTER_SCALE)
      .setAlpha(0.7)
      .setDepth(0);
    const rightZone = this.add.zone(WALL_W / 2, WALL_H / 2, WALL_W, WALL_H).setInteractive({ useHandCursor: true });
    rightZone.on("pointerdown", () => this.rotateWall(1));
    this.rightContainer.add(rightZone);

    // 가운데 벽: 실제로 캐릭터가 서서 상호작용하는 활성 벽
    const annotationRects: Phaser.GameObjects.GameObject[] = [];
    centerLayout.objects.forEach((obj) => {
      const route = routeOfKind(obj.kind);
      if (route && isAnnotated(route, this.difficulty)) {
        const cx = obj.rect.x + obj.rect.w / 2;
        const cy = obj.rect.y + obj.rect.h / 2;
        annotationRects.push(
          this.add.rectangle(cx, cy, obj.rect.w + 10, obj.rect.h + 10).setStrokeStyle(3, 0xffe066, 0.95)
        );
      }
    });

    this.centerContainer = this.add
      .container(CENTER_X, TOP_Y, [...centerLayout.gameObjects, ...annotationRects])
      .setScale(CENTER_SCALE, CENTER_SCALE)
      .setDepth(1);

    this.layout = centerLayout;
    this.wallLabelText.setText(`[ ${index + 1}/${count} ] ${centerLayout.label}`);

    // 캐릭터를 바닥 중앙으로 옮기고 가운데 컨테이너의 자식으로 재부모화
    this.centerContainer.add(this.player);
    this.player.setPosition(centerLayout.floor.x + centerLayout.floor.w / 2, centerLayout.floor.y + centerLayout.floor.h / 2);
    this.moveTarget = null;
    this.activeObject = null;
    this.interactPrompt.setVisible(false);
    this.centerContainer.add(this.interactPrompt);

    // 바닥 클릭 -> 이동 (가운데 벽의 로컬 좌표계 기준)
    const floor = centerLayout.floor;
    const floorZone = this.add
      .zone(floor.x + floor.w / 2, floor.y + floor.h / 2, floor.w, floor.h)
      .setOrigin(0.5)
      .setInteractive();
    floorZone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.lockPanel.visible || this.altPanel.visible || this.ended) return;
      const local = this.centerContainer.pointToContainer(pointer) as Phaser.Math.Vector2;
      this.moveTarget = this.clampToFloor(local.x, local.y);
    });
    this.centerContainer.add(floorZone);
  }

  // ---------- 캐릭터 & 이동 ----------
  private createPlayer(x: number, y: number): Phaser.GameObjects.Container {
    const shadow = this.add.ellipse(0, 10, 26, 12, 0x000000, 0.3);
    const body = this.add.circle(0, 0, PLAYER_RADIUS, 0xe8622c).setStrokeStyle(3, 0x241f1a);
    const face = this.add.circle(0, -3, 3, 0x241f1a);
    return this.add.container(x, y, [shadow, body, face]).setDepth(15);
  }

  private clampToFloor(x: number, y: number) {
    const f = this.layout.floor;
    return {
      x: Phaser.Math.Clamp(x, f.x + PLAYER_RADIUS, f.x + f.w - PLAYER_RADIUS),
      y: Phaser.Math.Clamp(y, f.y + PLAYER_RADIUS, f.y + f.h - PLAYER_RADIUS),
    };
  }

  private updateMovement(delta: number) {
    if (!this.moveTarget) return;
    const dx = this.moveTarget.x - this.player.x;
    const dy = this.moveTarget.y - this.player.y;
    const dist = Math.hypot(dx, dy);
    const step = (PLAYER_SPEED * delta) / 1000;

    if (dist <= step) {
      this.player.setPosition(this.moveTarget.x, this.moveTarget.y);
      this.moveTarget = null;
    } else {
      this.player.x += (dx / dist) * step;
      this.player.y += (dy / dist) * step;
    }
  }

  private updateInteractPrompt() {
    let nearest: RoomObject | null = null;
    let nearestDist = INTERACT_RADIUS;

    for (const obj of this.layout.objects) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, obj.point.x, obj.point.y);
      if (d <= nearestDist) {
        nearestDist = d;
        nearest = obj;
      }
    }

    this.activeObject = nearest;
    if (nearest && !this.lockPanel.visible && !this.altPanel.visible) {
      this.interactPrompt.setPosition(nearest.point.x, nearest.point.y - 24);
      this.interactPrompt.setVisible(true);
    } else {
      this.interactPrompt.setVisible(false);
    }
  }

  private tryInteract() {
    if (this.ended || !this.activeObject || this.lockPanel.visible || this.altPanel.visible) return;
    const obj = this.activeObject;

    switch (obj.kind) {
      case "clue":
        this.showMessage(this.stage.routes.standard.clue);
        break;
      case "lock":
        this.lockPanel.setVisible(true);
        break;
      case "hidden":
        this.showMessage(`${this.stage.routes.hidden.label} 발견! ${this.stage.routes.hidden.description}`);
        this.time.delayedCall(500, () => this.finish("hidden"));
        break;
      case "alt":
        this.altPanel.setVisible(true);
        break;
      case "decoy":
        this.showMessage(obj.decoyMessage ?? "별다른 특이사항은 없다.");
        break;
    }
  }

  // ---------- 정석 경로: 코드 입력 ----------
  private buildLockPanel() {
    const code = this.stage.routes.standard.code;
    const w = 260;
    const h = 110;
    const x = this.scale.width / 2 - w / 2;
    const y = this.scale.height / 2 - h / 2;

    const bg = this.add.rectangle(0, 0, w, h, 0x14141c, 0.97).setStrokeStyle(2, 0xe8c07d).setOrigin(0);
    this.codeDisplay = this.add
      .text(w / 2, 16, `입력: ${"".padEnd(code.length, "_")}`, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#fff",
      })
      .setOrigin(0.5, 0);

    const closeBtn = this.add
      .text(w - 14, 8, "✕", { fontFamily: "sans-serif", fontSize: "14px", color: "#aaa" })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    closeBtn.on("pointerdown", () => this.lockPanel.setVisible(false));

    const items: Phaser.GameObjects.GameObject[] = [bg, this.codeDisplay, closeBtn];
    for (let n = 0; n <= 9; n++) {
      const bx = 14 + (n % 5) * 46;
      const by = 46 + Math.floor(n / 5) * 30;
      const btn = this.add.rectangle(bx, by, 38, 26, 0x44445a).setStrokeStyle(1, 0x888888).setOrigin(0);
      btn.setInteractive({ useHandCursor: true });
      const label = this.add.text(bx + 19, by + 13, String(n), { fontFamily: "sans-serif", fontSize: "13px", color: "#fff" }).setOrigin(0.5);
      btn.on("pointerover", () => btn.setFillStyle(0x5a5a75));
      btn.on("pointerout", () => btn.setFillStyle(0x44445a));
      btn.on("pointerdown", () => {
        if (this.enteredCode.length >= code.length) return;
        this.enteredCode += String(n);
        this.codeDisplay.setText(`입력: ${this.enteredCode.padEnd(code.length, "_")}`);
        if (this.enteredCode.length === code.length) {
          this.time.delayedCall(150, () => this.submitCode(code));
        }
      });
      items.push(btn, label);
    }

    this.lockPanel = this.add.container(x, y, items).setDepth(40).setVisible(false);
  }

  private submitCode(correctCode: string) {
    if (this.enteredCode === correctCode) {
      this.lockPanel.setVisible(false);
      this.finish("standard");
    } else {
      this.applyPenalty(DIFFICULTY_SETTINGS[this.difficulty].wrongAnswerPenaltySec, "코드가 틀렸어요.");
      this.enteredCode = "";
      this.codeDisplay.setText(`입력: ${"".padEnd(correctCode.length, "_")}`);
    }
  }

  // ---------- 얼터너티브 경로 ----------
  private buildAltPanel() {
    const route = this.stage.routes.alternative;
    const annotated = isAnnotated("alternative", this.difficulty);
    const w = 280;
    const h = annotated ? 140 : 100;
    const x = this.scale.width / 2 - w / 2;
    const y = this.scale.height / 2 - h / 2;

    const bg = this.add.rectangle(0, 0, w, h, 0x14141c, 0.97).setStrokeStyle(2, 0xe8c07d).setOrigin(0);
    const items: Phaser.GameObjects.GameObject[] = [bg];

    const desc = this.add.text(
      14,
      12,
      annotated ? route.description : "무언가를 조작해 볼 수 있을 것 같다. 확실친 않다.",
      { fontFamily: "sans-serif", fontSize: "12px", color: "#cfcfcf", wordWrap: { width: w - 28 } }
    );
    items.push(desc);

    const closeBtn = this.add
      .text(w - 14, 8, "✕", { fontFamily: "sans-serif", fontSize: "14px", color: "#aaa" })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    closeBtn.on("pointerdown", () => this.altPanel.setVisible(false));
    items.push(closeBtn);

    const attemptBtn = this.add.rectangle(14, h - 40, w - 28, 30, 0x44445a).setStrokeStyle(1, 0x888888).setOrigin(0);
    attemptBtn.setInteractive({ useHandCursor: true });
    const attemptLabel = this.add
      .text(w / 2, h - 25, "시도하기", { fontFamily: "sans-serif", fontSize: "13px", color: "#fff" })
      .setOrigin(0.5);
    attemptBtn.on("pointerover", () => attemptBtn.setFillStyle(0x5a5a75));
    attemptBtn.on("pointerout", () => attemptBtn.setFillStyle(0x44445a));
    attemptBtn.on("pointerdown", () => {
      const success = Math.random() < route.successChance;
      if (success) {
        this.altPanel.setVisible(false);
        this.finish("alternative");
      } else {
        this.applyPenalty(DIFFICULTY_SETTINGS[this.difficulty].trapPenaltySec, "장치 조작에 실패했어요! 경보가 울렸어요.");
      }
    });
    items.push(attemptBtn, attemptLabel);

    this.altPanel = this.add.container(x, y, items).setDepth(40).setVisible(false);
  }

  // ---------- 공용 유틸 ----------
  private makeSmallButton(x: number, y: number, w: number, h: number, label: string) {
    const btn = this.add.rectangle(x, y, w, h, 0xfdf1c8).setStrokeStyle(2, 0x241f1a).setOrigin(0).setDepth(30);
    btn.setInteractive({ useHandCursor: true });
    this.add
      .text(x + w / 2, y + h / 2, label, { fontFamily: "sans-serif", fontSize: "12px", color: "#241f1a" })
      .setOrigin(0.5)
      .setDepth(31);
    btn.on("pointerover", () => btn.setFillStyle(0xffe066));
    btn.on("pointerout", () => btn.setFillStyle(0xfdf1c8));
    return btn;
  }

  private makeRotateButton(x: number, y: number, arrow: string, onClick: () => void) {
    const btn = this.add.circle(x, y, 26, 0x5aa564).setStrokeStyle(3, 0x241f1a).setDepth(30);
    btn.setInteractive({ useHandCursor: true });
    this.add.text(x, y, arrow, { fontFamily: "sans-serif", fontSize: "20px", color: "#fff" }).setOrigin(0.5).setDepth(31);
    btn.on("pointerover", () => btn.setFillStyle(0x6fc27a));
    btn.on("pointerout", () => btn.setFillStyle(0x5aa564));
    btn.on("pointerdown", onClick);
    return btn;
  }

  private useHint() {
    if (this.hintsLeft <= 0 || this.ended) return;
    const settings = DIFFICULTY_SETTINGS[this.difficulty];

    const grant = () => {
      this.hintsLeft -= 1;
      this.hintsUsed += 1;
      this.updateHintText();
      const code = this.stage.routes.standard.code;
      this.showMessage(`힌트: 정석 경로의 코드는 '${code}'인 것 같다. 잠금장치를 찾아 직접 입력해 보자.`);
    };

    if (settings.hintRequiresAd) {
      const watched = window.confirm("리워드 광고를 시청하고 힌트를 받을까요? (데모: 확인 누르면 바로 지급돼요)");
      if (watched) grant();
    } else {
      grant();
    }
  }

  private updateTimerText() {
    const totalSec = Math.ceil(this.remainingMs / 1000);
    const mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;
    this.timerText.setText(`${mm}:${String(ss).padStart(2, "0")}`);
    this.timerText.setColor(totalSec <= 30 ? "#c1503a" : "#241f1a");
  }

  private updateHintText() {
    const settings = DIFFICULTY_SETTINGS[this.difficulty];
    const suffix = settings.hintRequiresAd ? " (광고 시청)" : "";
    this.hintText.setText(`힌트 ${this.hintsLeft}/${settings.hintCount}${suffix}`);
  }

  private applyPenalty(sec: number, message: string) {
    if (sec > 0) this.remainingMs = Math.max(0, this.remainingMs - sec * 1000);
    this.showMessage(`${message} (-${sec}초)`);
    if (this.remainingMs <= 0) this.finish(null);
  }

  private showMessage(msg: string) {
    this.messageText.setText(msg);
  }

  private finish(route: RouteId | null) {
    if (this.ended) return;
    this.ended = true;
    this.interactPrompt.setVisible(false);

    const remainingSec = Math.ceil(this.remainingMs / 1000);
    const cleared = route !== null;
    const finalScore = cleared
      ? calculateScore({ difficulty: this.difficulty, route, remainingSec, hintsUsed: this.hintsUsed })
      : 0;

    this.scene.start("Result", {
      stageId: this.stage.id,
      difficulty: this.difficulty,
      route,
      cleared,
      remainingSec,
      hintsUsed: this.hintsUsed,
      finalScore,
    });
  }
}
