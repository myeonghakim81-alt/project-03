import Phaser from "phaser";
import type { Difficulty, RouteId, StageConfig } from "../types";
import { getStage } from "../data/stages";
import { DIFFICULTY_SETTINGS } from "../data/difficulty";
import { calculateScore } from "../systems/score";

interface RoomInitData {
  stageId: string;
  difficulty: Difficulty;
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
      .text(this.scale.width / 2, 20, `FILE NO.${String(this.stage.fileNo).padStart(2, "0")} — ${this.stage.title} · ${settings.label}`, {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color: "#e8c07d",
      })
      .setOrigin(0.5, 0);

    this.timerText = this.add
      .text(this.scale.width - 20, 20, "", {
        fontFamily: "monospace",
        fontSize: "26px",
        color: "#fff",
      })
      .setOrigin(1, 0);

    this.hintText = this.add.text(20, 20, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#9fd3ff",
    });

    const hintBtn = this.makeButton(20, 44, 110, 28, "힌트 사용", 12);
    hintBtn.on("pointerdown", () => this.useHint());

    this.messageText = this.add
      .text(this.scale.width / 2, 66, this.stage.intro, {
        fontFamily: "sans-serif",
        fontSize: "14px",
        color: "#cfcfcf",
        wordWrap: { width: 780 },
        align: "center",
      })
      .setOrigin(0.5, 0);

    this.buildStandardRoute();
    this.buildHiddenRoute();
    this.buildAlternativeRoute();

    if (settings.routeHintsVisible) {
      this.add.text(20, this.scale.height - 30, "이지 모드: 아래 3가지 탈출 경로가 모두 표시돼요.", {
        fontFamily: "sans-serif",
        fontSize: "12px",
        color: "#7cd992",
      });
    }

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

  // ---------- Route 01 · 정석 (코드 입력) ----------
  private buildStandardRoute() {
    const route = this.stage.routes.standard;
    const x = 90;
    const y = 140;
    const w = 260;
    const h = 260;

    this.add.rectangle(x, y, w, h, 0x2a2a3d).setStrokeStyle(2, 0x888888).setOrigin(0);
    this.add.text(x + 12, y + 8, `Route 01 · ${route.label}`, {
      fontFamily: "sans-serif",
      fontSize: "15px",
      color: "#fff",
    });

    const clueBtn = this.makeButton(x + 12, y + 40, w - 24, 32, "단서(편지) 조사하기");
    let clueRevealed = false;
    const clueText = this.add.text(x + 12, y + 82, "", {
      fontFamily: "sans-serif",
      fontSize: "12px",
      color: "#e8c07d",
      wordWrap: { width: w - 24 },
    });
    clueBtn.on("pointerdown", () => {
      clueRevealed = true;
      clueText.setText(route.clue);
    });

    this.codeDisplay = this.add.text(x + 12, y + h - 92, `입력: ${this.enteredCode.padEnd(route.code.length, "_")}`, {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#fff",
    });

    const numsY = y + h - 60;
    for (let n = 0; n <= 9; n++) {
      const bx = x + 16 + (n % 5) * 46;
      const by = numsY + Math.floor(n / 5) * 30;
      const btn = this.makeButton(bx, by, 38, 26, String(n), 12);
      btn.on("pointerdown", () => {
        if (this.enteredCode.length >= route.code.length) return;
        this.enteredCode += String(n);
        this.codeDisplay.setText(`입력: ${this.enteredCode.padEnd(route.code.length, "_")}`);
        if (this.enteredCode.length === route.code.length) {
          this.time.delayedCall(150, () => this.submitCode(route.code, clueRevealed));
        }
      });
    }
  }

  private submitCode(correctCode: string, _clueRevealed: boolean) {
    if (this.enteredCode === correctCode) {
      this.finish("standard");
    } else {
      this.applyPenalty(DIFFICULTY_SETTINGS[this.difficulty].wrongAnswerPenaltySec, "코드가 틀렸어요.");
      this.enteredCode = "";
      this.codeDisplay.setText(`입력: ${"".padEnd(correctCode.length, "_")}`);
    }
  }

  // ---------- Route 02 · 히든 (관찰) ----------
  private buildHiddenRoute() {
    const route = this.stage.routes.hidden;
    const x = 380;
    const y = 140;
    const w = 260;
    const h = 260;

    this.add.rectangle(x, y, w, h, 0x24242e).setStrokeStyle(2, 0x555555).setOrigin(0);
    this.add.text(x + 12, y + 8, `Route 02 · 배경을 관찰해 보세요`, {
      fontFamily: "sans-serif",
      fontSize: "15px",
      color: "#888",
    });

    const showHint = DIFFICULTY_SETTINGS[this.difficulty].routeHintsVisible;
    const hotspotSize = 34;
    const hx = x + 40 + (route.hotspot.x % (w - 80));
    const hy = y + 60 + (route.hotspot.y % (h - 100));

    const hotspot = this.add
      .rectangle(hx, hy, hotspotSize, hotspotSize, showHint ? 0x555533 : 0x24242e)
      .setStrokeStyle(showHint ? 2 : 0, 0xe8c07d)
      .setInteractive({ useHandCursor: true });

    if (showHint) {
      this.add
        .text(hx, hy - hotspotSize / 2 - 14, route.label, {
          fontFamily: "sans-serif",
          fontSize: "11px",
          color: "#e8c07d",
        })
        .setOrigin(0.5);
    }

    hotspot.on("pointerdown", () => {
      this.showMessage(`${route.label} 발견! ${route.description}`);
      this.finish("hidden");
    });
  }

  // ---------- Route 03 · 얼터너티브 (위험 감수) ----------
  private buildAlternativeRoute() {
    const route = this.stage.routes.alternative;
    const x = 670;
    const y = 140;
    const w = 260;
    const h = 260;

    this.add.rectangle(x, y, w, h, 0x2a2a3d).setStrokeStyle(2, 0x888888).setOrigin(0);
    this.add.text(x + 12, y + 8, `Route 03 · ${route.label}`, {
      fontFamily: "sans-serif",
      fontSize: "15px",
      color: "#fff",
    });
    this.add.text(x + 12, y + 40, route.description, {
      fontFamily: "sans-serif",
      fontSize: "12px",
      color: "#cfcfcf",
      wordWrap: { width: w - 24 },
    });

    const attemptBtn = this.makeButton(x + 12, y + h - 60, w - 24, 40, "시도하기 (실패 시 페널티)");
    attemptBtn.on("pointerdown", () => {
      const success = Math.random() < route.successChance;
      if (success) {
        this.finish("alternative");
      } else {
        this.applyPenalty(DIFFICULTY_SETTINGS[this.difficulty].trapPenaltySec, "장치 조작에 실패했어요! 경보가 울렸어요.");
      }
    });
  }

  // ---------- 공용 유틸 ----------
  private makeButton(x: number, y: number, w: number, h: number, label: string, fontSize = 13) {
    const btn = this.add.rectangle(x, y, w, h, 0x44445a).setStrokeStyle(1, 0x888888).setOrigin(0);
    btn.setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x + w / 2, y + h / 2, label, { fontFamily: "sans-serif", fontSize: `${fontSize}px`, color: "#fff" })
      .setOrigin(0.5);
    btn.on("pointerover", () => btn.setFillStyle(0x5a5a75));
    btn.on("pointerout", () => btn.setFillStyle(0x44445a));
    btn.on("pointerdown", () => text.setTint(0xe8c07d));
    return btn;
  }

  private updateTimerText() {
    const totalSec = Math.ceil(this.remainingMs / 1000);
    const mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;
    this.timerText.setText(`${mm}:${String(ss).padStart(2, "0")}`);
    this.timerText.setColor(totalSec <= 30 ? "#ff6b6b" : "#fff");
  }

  private useHint() {
    if (this.hintsLeft <= 0 || this.ended) return;
    const settings = DIFFICULTY_SETTINGS[this.difficulty];

    const grant = () => {
      this.hintsLeft -= 1;
      this.hintsUsed += 1;
      this.updateHintText();
      this.enteredCode = this.stage.routes.standard.code;
      this.codeDisplay.setText(`입력: ${this.enteredCode}`);
      this.submitCode(this.stage.routes.standard.code, true);
    };

    if (settings.hintRequiresAd) {
      const watched = window.confirm("리워드 광고를 시청하고 힌트를 받을까요? (데모: 확인 누르면 바로 지급돼요)");
      if (watched) grant();
    } else {
      grant();
    }
  }

  private updateHintText() {
    const settings = DIFFICULTY_SETTINGS[this.difficulty];
    const suffix = settings.hintRequiresAd ? " (광고 시청 필요)" : "";
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
