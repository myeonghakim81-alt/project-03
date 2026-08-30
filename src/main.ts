import Phaser from "phaser";
import { StageSelectScene } from "./scenes/StageSelectScene";
import { DifficultySelectScene } from "./scenes/DifficultySelectScene";
import { RoomScene } from "./scenes/RoomScene";
import { ResultScene } from "./scenes/ResultScene";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  width: 1000,
  height: 600,
  backgroundColor: "#12121a",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [StageSelectScene, DifficultySelectScene, RoomScene, ResultScene],
});
