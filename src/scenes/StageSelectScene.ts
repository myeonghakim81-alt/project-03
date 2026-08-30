import Phaser from "phaser";
import { STAGES } from "../data/stages";
import { isStageCleared, getTotalRankingScore } from "../systems/save";

const COLS = 5;
const CELL_W = 220;
const CELL_H = 180;
const GRID_X = 90;
const GRID_Y = 140;

export class StageSelectScene extends Phaser.Scene {
  constructor() {
    super("StageSelect");
  }

  create() {
    this.cameras.main.setBackgroundColor("#12121a");

    this.add
      .text(this.scale.width / 2, 50, "ESCAPE: THE ASHFORD FILE", {
        fontFamily: "Georgia, serif",
        fontSize: "34px",
        color: "#e8c07d",
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 90, "스테이지를 선택하세요", {
        fontFamily: "sans-serif",
        fontSize: "16px",
        color: "#cfcfcf",
      })
      .setOrigin(0.5);

    STAGES.forEach((stage, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = GRID_X + col * CELL_W;
      const y = GRID_Y + row * CELL_H;

      const cleared = isStageCleared(stage.id);
      const playable = !stage.locked;

      const bg = this.add
        .rectangle(x, y, CELL_W - 20, CELL_H - 20, playable ? 0x2a2a3d : 0x1a1a22)
        .setStrokeStyle(2, playable ? 0xe8c07d : 0x444444)
        .setOrigin(0);

      this.add
        .text(x + 12, y + 10, `FILE NO.${String(stage.fileNo).padStart(2, "0")}`, {
          fontFamily: "monospace",
          fontSize: "13px",
          color: "#888",
        })
        .setOrigin(0);

      this.add
        .text(x + 12, y + 32, stage.title, {
          fontFamily: "sans-serif",
          fontSize: "20px",
          color: playable ? "#fff" : "#666",
        })
        .setOrigin(0);

      this.add
        .text(x + 12, y + CELL_H - 46, `Act ${stage.act} · ${Math.floor(stage.baseTimeLimitSec / 60)}:${String(stage.baseTimeLimitSec % 60).padStart(2, "0")}`, {
          fontFamily: "sans-serif",
          fontSize: "12px",
          color: "#999",
        })
        .setOrigin(0);

      if (!playable) {
        this.add
          .text(x + (CELL_W - 20) / 2, y + (CELL_H - 20) / 2, "COMING SOON", {
            fontFamily: "sans-serif",
            fontSize: "13px",
            color: "#555",
          })
          .setOrigin(0.5);
      } else if (cleared) {
        this.add
          .text(x + CELL_W - 34, y + 14, "✓", {
            fontFamily: "sans-serif",
            fontSize: "18px",
            color: "#7cd992",
          })
          .setOrigin(0.5);
      }

      if (playable) {
        bg.setInteractive({ useHandCursor: true });
        bg.on("pointerover", () => bg.setFillStyle(0x3a3a55));
        bg.on("pointerout", () => bg.setFillStyle(0x2a2a3d));
        bg.on("pointerdown", () => {
          this.scene.start("DifficultySelect", { stageId: stage.id });
        });
      }
    });

    const total = getTotalRankingScore();
    this.add.text(20, this.scale.height - 30, `종합 랭킹 점수(개인 최고 합산): ${total.toLocaleString()}`, {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#aaa",
    });
  }
}
