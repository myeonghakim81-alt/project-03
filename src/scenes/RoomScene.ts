import Phaser from "phaser";
import type { Difficulty, RouteId, StageConfig } from "../types";
import { getStage } from "../data/stages";
import { DIFFICULTY_SETTINGS } from "../data/difficulty";
import { calculateScore } from "../systems/score";
import { drawLibrary, drawGreenhouse, type Rect, type RoomHotspots } from "./roomArt";

interface RoomInitData {
  stageId: string;
  difficulty: Difficulty;
}

function isAnnotated(route: RouteId, difficulty: Difficulty): boolean {
  if (difficulty === "easy") return true;
  if (difficulty === "medium") return route === "standard";
  return false; // hard: 안내 없음
}

export class RoomScene extends Phaser.Scene {
  private stage!: StageConfig;
  private difficulty!: Difficulty;

  private timeLimitSec = 0;
  private remainingMs = 0;
  private hintsUsed = 0;
  private hintsLeft = 0;
  private enteredCode = "";
  private ended = false;

  private timerText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private codeDisplay!: Phaser.GameObjects.Text;
  private lockPanel!: Phaser.GameObjects.Container;
  private altPanel!: Phaser.GameObjects.Container;

  constructor() {
    super("Room");
  }

  init(data: RoomInitData) {
    this.stage = getStage(data.stageId);
    this.difficulty = data.difficulty;
    const settings = DIFFICULTY_SETTINGS[this.difficulty];
    this.timeLimitSec = Math.round(this.stage.baseTimeLimitSec * settings.timeMultiplier);
    this.remainingMs = this.timeLimitSec * 1000;
    this.hintsUsed = 0;
    this.hintsLeft = settings.hintCount;
    this.enteredCode = "";
    this.ended = false;
  }

  create() {
    const settings = DIFFICULTY_SETTINGS[this.difficulty];
    this.cameras.main.setBackgroundColor("#1c1a24");

    this.add
      .text(this.scale.width / 2, 16, `FILE NO.${String(this.stage.fileNo).padStart(2, "0")} — ${this.stage.title} · ${settings.label}`, {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: "#e8c07d",
      })
      .setOrigin(0.5, 0)
      .setDepth(10);

    this.timerText = this.add
      .text(this.scale.width - 16, 14, "", { fontFamily: "monospace", fontSize: "24px", color: "#fff" })
      .setOrigin(1, 0)
      .setDepth(10);

    this.hintText = this.add
      .text(16, 16, "", { fontFamily: "monospace", fontSize: "13px", color: "#9fd3ff" })
      .setDepth(10);
    const hintBtn = this.makeSmallButton(16, 38, 100, 24, "힌트 사용");
    hintBtn.on("pointerdown", () => this.useHint());

    this.messageText = this.add
      .text(this.scale.width / 2, this.scale.height - 20, this.stage.intro, {
        fontFamily: "sans-serif",
        fontSize: "13px",
        color: "#e8c07d",
        wordWrap: { width: 900 },
        align: "center",
      })
      .setOrigin(0.5, 1)
      .setDepth(10);

    const hotspots = this.drawScene();
    this.setupClueSpot(hotspots.clue);
    this.setupLockSpot(hotspots.lock);
    this.setupHiddenSpot(hotspots.hidden);
    this.setupAltSpot(hotspots.alt);

    this.buildLockPanel();
    this.buildAltPanel();

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
  }

  private drawScene(): RoomHotspots {
    return this.stage.id === "file-02" ? drawGreenhouse(this) : drawLibrary(this);
  }

  // ---------- 정석 1단계: 단서 조사 ----------
  private setupClueSpot(rect: Rect) {
    const zone = this.addHotspot(rect, "standard");
    zone.on("pointerdown", () => {
      this.showMessage(this.stage.routes.standard.clue);
    });
  }

  // ---------- 정석 2단계: 코드 입력 ----------
  private setupLockSpot(rect: Rect) {
    const zone = this.addHotspot(rect, "standard");
    zone.on("pointerdown", () => {
      this.lockPanel.setVisible(!this.lockPanel.visible);
    });
  }

  private buildLockPanel() {
    const code = this.stage.routes.standard.code;
    const w = 260;
    const h = 110;
    const x = this.scale.width / 2 - w / 2;
    const y = this.scale.height / 2 - h / 2;

    const bg = this.add.rectangle(0, 0, w, h, 0x14141c, 0.96).setStrokeStyle(2, 0xe8c07d).setOrigin(0);
    this.codeDisplay = this.add
      .text(w / 2, 16, `입력: ${"".padEnd(code.length, "_")}`, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#fff",
      })
      .setOrigin(0.5, 0);

    const items: Phaser.GameObjects.GameObject[] = [bg, this.codeDisplay];
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

    this.lockPanel = this.add.container(x, y, items).setDepth(20).setVisible(false);
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

  // ---------- 히든 경로 ----------
  private setupHiddenSpot(rect: Rect) {
    const zone = this.addHotspot(rect, "hidden");
    zone.on("pointerdown", () => {
      this.showMessage(`${this.stage.routes.hidden.label} 발견! ${this.stage.routes.hidden.description}`);
      this.time.delayedCall(400, () => this.finish("hidden"));
    });
  }

  // ---------- 얼터너티브 경로 ----------
  private setupAltSpot(rect: Rect) {
    const zone = this.addHotspot(rect, "alternative");
    zone.on("pointerdown", () => {
      this.altPanel.setVisible(!this.altPanel.visible);
    });
  }

  private buildAltPanel() {
    const route = this.stage.routes.alternative;
    const annotated = isAnnotated("alternative", this.difficulty);
    const w = 280;
    const h = annotated ? 130 : 90;
    const x = this.scale.width / 2 - w / 2;
    const y = this.scale.height / 2 - h / 2;

    const bg = this.add.rectangle(0, 0, w, h, 0x14141c, 0.96).setStrokeStyle(2, 0xe8c07d).setOrigin(0);
    const items: Phaser.GameObjects.GameObject[] = [bg];

    if (annotated) {
      const desc = this.add.text(14, 12, route.description, {
        fontFamily: "sans-serif",
        fontSize: "12px",
        color: "#cfcfcf",
        wordWrap: { width: w - 28 },
      });
      items.push(desc);
    } else {
      const desc = this.add.text(14, 12, "무언가를 조작해 볼 수 있을 것 같다. 확실친 않다.", {
        fontFamily: "sans-serif",
        fontSize: "12px",
        color: "#cfcfcf",
        wordWrap: { width: w - 28 },
      });
      items.push(desc);
    }

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

    this.altPanel = this.add.container(x, y, items).setDepth(20).setVisible(false);
  }

  // ---------- 공용 유틸 ----------
  private addHotspot(rect: Rect, route: RouteId): Phaser.GameObjects.Zone {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const zone = this.add.zone(cx, cy, rect.w, rect.h).setInteractive({ useHandCursor: true });

    if (isAnnotated(route, this.difficulty)) {
      const outline = this.add.rectangle(cx, cy, rect.w, rect.h).setStrokeStyle(2, 0xe8c07d, 0.8);
      zone.on("pointerover", () => outline.setStrokeStyle(3, 0xffe6a8, 1));
      zone.on("pointerout", () => outline.setStrokeStyle(2, 0xe8c07d, 0.8));
    }

    return zone;
  }

  private makeSmallButton(x: number, y: number, w: number, h: number, label: string) {
    const btn = this.add.rectangle(x, y, w, h, 0x44445a).setStrokeStyle(1, 0x888888).setOrigin(0).setDepth(10);
    btn.setInteractive({ useHandCursor: true });
    this.add
      .text(x + w / 2, y + h / 2, label, { fontFamily: "sans-serif", fontSize: "12px", color: "#fff" })
      .setOrigin(0.5)
      .setDepth(11);
    btn.on("pointerover", () => btn.setFillStyle(0x5a5a75));
    btn.on("pointerout", () => btn.setFillStyle(0x44445a));
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
      this.enteredCode = code;
      this.lockPanel.setVisible(true);
      this.codeDisplay.setText(`입력: ${code}`);
      this.submitCode(code);
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
    this.timerText.setColor(totalSec <= 30 ? "#ff6b6b" : "#fff");
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
