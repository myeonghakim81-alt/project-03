import Phaser from "phaser";
import type { PlayResult, RouteId } from "../types";
import { getStage, STAGES } from "../data/stages";
import { getBestScore, submitScore, markStageCleared } from "../systems/save";

const ROUTE_LABEL: Record<RouteId, string> = {
  standard: "정석 (Standard)",
  hidden: "히든 (Hidden)",
  alternative: "얼터너티브 (Alternative)",
};

export class ResultScene extends Phaser.Scene {
  private result!: PlayResult;

  constructor() {
    super("Result");
  }

  init(data: PlayResult) {
    this.result = data;
  }

  create() {
    const { stageId, difficulty, route, cleared, remainingSec, hintsUsed, finalScore } = this.result;
    const stage = getStage(stageId);
    this.cameras.main.setBackgroundColor("#12121a");

    this.add
      .text(this.scale.width / 2, 60, cleared ? "탈출 성공!" : "시간 초과…", {
        fontFamily: "Georgia, serif",
        fontSize: "36px",
        color: cleared ? "#7cd992" : "#ff6b6b",
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 110, `FILE NO.${String(stage.fileNo).padStart(2, "0")} — ${stage.title}`, {
        fontFamily: "sans-serif",
        fontSize: "18px",
        color: "#cfcfcf",
      })
      .setOrigin(0.5);

    let isNewRecord = false;
    let prevBest = getBestScore(stageId, difficulty)?.score ?? 0;

    if (cleared && route) {
      isNewRecord = submitScore({
        stageId,
        difficulty,
        score: finalScore,
        route,
        remainingSec,
        hintsUsed,
        achievedAt: new Date().toISOString(),
      });
      markStageCleared(stageId);
    }

    const lines = cleared
      ? [
          `탈출 경로: ${ROUTE_LABEL[route!]}`,
          `잔여시간: ${remainingSec}초`,
          `힌트 사용: ${hintsUsed}회`,
          "",
          `최종 점수: ${finalScore.toLocaleString()}`,
          isNewRecord ? "★ 신기록!" : `개인 최고: ${prevBest.toLocaleString()}`,
        ]
      : ["제한시간 안에 탈출하지 못했어요.", "다시 도전해 보세요."];

    this.add
      .text(this.scale.width / 2, 170, lines.join("\n"), {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#fff",
        align: "center",
        lineSpacing: 10,
      })
      .setOrigin(0.5, 0);

    const btnY = 400;
    const retryBtn = this.makeButton(this.scale.width / 2 - 260, btnY, 220, 48, "다시 도전");
    retryBtn.on("pointerdown", () => this.scene.start("Room", { stageId, difficulty }));

    const stageSelectBtn = this.makeButton(this.scale.width / 2 - 20, btnY, 220, 48, "스테이지 선택으로");
    stageSelectBtn.on("pointerdown", () => this.scene.start("StageSelect"));

    const nextStage = STAGES.find((s) => s.fileNo === stage.fileNo + 1);
    if (cleared && nextStage && !nextStage.locked) {
      const nextBtn = this.makeButton(this.scale.width / 2 + 220, btnY, 220, 48, "다음 방으로 →");
      nextBtn.on("pointerdown", () => this.scene.start("DifficultySelect", { stageId: nextStage.id }));
    }
  }

  private makeButton(x: number, y: number, w: number, h: number, label: string) {
    const btn = this.add.rectangle(x, y, w, h, 0x44445a).setStrokeStyle(2, 0xe8c07d).setOrigin(0);
    btn.setInteractive({ useHandCursor: true });
    this.add
      .text(x + w / 2, y + h / 2, label, { fontFamily: "sans-serif", fontSize: "15px", color: "#fff" })
      .setOrigin(0.5);
    btn.on("pointerover", () => btn.setFillStyle(0x5a5a75));
    btn.on("pointerout", () => btn.setFillStyle(0x44445a));
    return btn;
  }
}
