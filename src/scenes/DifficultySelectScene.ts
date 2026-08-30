import Phaser from "phaser";
import type { Difficulty } from "../types";
import { getStage } from "../data/stages";
import { DIFFICULTY_SETTINGS } from "../data/difficulty";
import { getBestScore } from "../systems/save";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export class DifficultySelectScene extends Phaser.Scene {
  private stageId!: string;

  constructor() {
    super("DifficultySelect");
  }

  init(data: { stageId: string }) {
    this.stageId = data.stageId;
  }

  create() {
    const stage = getStage(this.stageId);
    this.cameras.main.setBackgroundColor("#12121a");

    this.add
      .text(this.scale.width / 2, 60, `FILE NO.${String(stage.fileNo).padStart(2, "0")} — ${stage.title}`, {
        fontFamily: "Georgia, serif",
        fontSize: "28px",
        color: "#e8c07d",
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 100, stage.intro, {
        fontFamily: "sans-serif",
        fontSize: "14px",
        color: "#cfcfcf",
        wordWrap: { width: 600 },
        align: "center",
      })
      .setOrigin(0.5, 0);

    const cardW = 260;
    const gap = 30;
    const totalW = cardW * 3 + gap * 2;
    const startX = this.scale.width / 2 - totalW / 2;

    DIFFICULTIES.forEach((diff, i) => {
      const settings = DIFFICULTY_SETTINGS[diff];
      const timeLimit = Math.round(stage.baseTimeLimitSec * settings.timeMultiplier);
      const x = startX + i * (cardW + gap);
      const y = 200;
      const h = 320;

      const card = this.add
        .rectangle(x, y, cardW, h, 0x2a2a3d)
        .setStrokeStyle(2, 0xe8c07d)
        .setOrigin(0);
      card.setInteractive({ useHandCursor: true });

      this.add
        .text(x + cardW / 2, y + 24, settings.label, {
          fontFamily: "sans-serif",
          fontSize: "22px",
          color: "#fff",
        })
        .setOrigin(0.5);

      const mm = Math.floor(timeLimit / 60);
      const ss = timeLimit % 60;

      const lines = [
        `제한시간: ${mm}:${String(ss).padStart(2, "0")}`,
        `힌트: ${settings.hintCount}회${settings.hintRequiresAd ? " (광고 시청)" : ""}`,
        `경로 안내: ${settings.routeHintsVisible ? "3경로 모두 표시" : "정석만 안내"}`,
        `오답 페널티: -${settings.wrongAnswerPenaltySec}초`,
        `함정 페널티: -${settings.trapPenaltySec}초`,
        `점수 배율: ×${settings.scoreMultiplier}`,
      ];

      this.add.text(x + 16, y + 60, lines.join("\n"), {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#cfcfcf",
        lineSpacing: 8,
      });

      const best = getBestScore(this.stageId, diff);
      this.add.text(
        x + 16,
        y + h - 40,
        best ? `개인 최고: ${best.score.toLocaleString()}점` : "개인 최고: 기록 없음",
        {
          fontFamily: "monospace",
          fontSize: "12px",
          color: "#7cd992",
        }
      );

      card.on("pointerover", () => card.setFillStyle(0x3a3a55));
      card.on("pointerout", () => card.setFillStyle(0x2a2a3d));
      card.on("pointerdown", () => {
        this.scene.start("Room", { stageId: this.stageId, difficulty: diff });
      });
    });

    const back = this.add
      .text(20, 20, "← 스테이지 선택", { fontFamily: "sans-serif", fontSize: "14px", color: "#999" })
      .setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => this.scene.start("StageSelect"));
  }
}
