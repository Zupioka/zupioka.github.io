import Phaser from "phaser";
import { PACKS, SPRITE_FORMAT } from "../data/packs";

export default class CharacterInPackScene extends Phaser.Scene {
  constructor() {
    super("CharacterInPackScene");
    this.packId = "char1";
  }

  init(data) {
    this.packId = data?.packId || localStorage.getItem("cv_pack_id") || "char1";
  }

  preload() {
    const pack = PACKS.find((p) => pack.id === this.packId) || PACKS[0];

    this.load.spritesheet(pack.id, pack.path, {
      frameWidth: SPRITE_FORMAT.frameWidth,
      frameHeight: SPRITE_FORMAT.frameHeight,
      margin: SPRITE_FORMAT.margin,
      spacing: SPRITE_FORMAT.spacing,
    });
  }

  create() {
    const { width, height } = this.scale;
    const c = SPRITE_FORMAT;
    const sheetKey = this.packId;

    this.add.text(16, 16, "Choose your character", {
      fontFamily: "system-ui, Segoe UI, Roboto, Arial",
      fontSize: "18px",
      color: "#ffffff",
    });

    const savedChar = localStorage.getItem("cv_character_index");
    const savedIndex = savedChar ? parseInt(savedChar, 10) : 0;

    const scale = 4;
    const spacingX = 140;
    const spacingY = 120;
    const startX = width / 2 - spacingX / 2;
    const startY = height / 2 - 20;

    for (let i = 0; i < c.characterCount; i++) {
      const frame = this.getIdleDownFrame(i);

      const x = startX + (i % 2) * spacingX;
      const y = startY + Math.floor(i / 2) * spacingY;

      const sprite = this.add
        .sprite(x, y, sheetKey, frame)
        .setScale(scale)
        .setInteractive({ useHandCursor: true });

      if (i === savedIndex) {
        this.add.rectangle(x, y, 90, 90).setStrokeStyle(2, 0xffffff);
      }

      sprite.on("pointerdown", () => {
        localStorage.setItem("cv_pack_id", sheetKey);
        localStorage.setItem("cv_character_index", String(i));
        this.scene.start("GameScene", { packId: sheetKey, characterIndex: i });
      });
    }

    this.add.text(16, height - 28, "Click a character • ESC: back", {
      fontFamily: "system-ui, Segoe UI, Roboto, Arial",
      fontSize: "13px",
      color: "#cfcfcf",
    });

    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.start("CharacterSelectScene");
    });
    
    this.scale.on("resize", this.handleResize, this);
    this.events.once("shutdown", () => {
      this.scale.off("resize", this.handleResize, this);
    });
  }

  handleResize() {
    if (this._resizeTimer) {
      this._resizeTimer.remove(false);
    }
  
    this._resizeTimer = this.time.delayedCall(120, () => {
      this.scale.refresh();
      this.scene.restart();
    });
  }

  getIdleDownFrame(characterIndex) {
    const c = SPRITE_FORMAT;

    const blockX = characterIndex % c.charactersPerRow;            // 0..1
    const blockY = Math.floor(characterIndex / c.charactersPerRow); // 0..1

    const framesAcross = c.sheetCols; // 8
    return (blockY * c.directions) * framesAcross + (blockX * c.framesPerRowAnim);
  }
}