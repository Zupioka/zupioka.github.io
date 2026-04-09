import "./style.css";
import Phaser from "phaser";

import CharacterSelectScene from "./game/scenes/CharacterSelectScene";
import StartScene from "./game/scenes/StartScene";
import RoomScene from "./game/scenes/RoomScene";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",

  width: 800,
  height: 450,

  backgroundColor: "#111111",

  physics: {
    default: "arcade",
    arcade: { debug: false }
  },

  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true
  },

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },

  autoRound: true,

  scene: [StartScene, CharacterSelectScene, RoomScene],
});