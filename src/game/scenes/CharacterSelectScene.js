import Phaser from "phaser";
import { CHARACTER_SHEET as C } from "../data/characterSheet";

const UI_TEXT = {
  chooseCharacter: {
    en: "Select your character",
    fr: "Choisissez votre personnage",
  },
};

export default class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super("CharacterSelectScene");
    this.lang = "en";
  }

  init() {
    this.lang = localStorage.getItem("lang") || "en";
  }

  t(key) {
    return UI_TEXT[key]?.[this.lang] || UI_TEXT[key]?.en || key;
  }

  preload() {
    this.load.spritesheet(C.key, C.path, {
      frameWidth: C.frameWidth,
      frameHeight: C.frameHeight,
      margin: C.margin,
      spacing: C.spacing,
    });
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, 90, this.t("chooseCharacter"), {
      fontFamily: "system-ui, Segoe UI, Roboto, Arial",
      fontSize: "28px",
      color: "#ffffff",
    })
      .setOrigin(0.5);

    const saved = localStorage.getItem("cv_character_index");
    const savedIndex = saved ? parseInt(saved, 10) : 0;

    const layout = this.getLayout();
    const count = layout.characterCount;
    const colsUI = layout.charactersPerRow;

    const spacingX = 140;
    const spacingY = 110;
    const startX = width / 2 - ((colsUI - 1) * spacingX) / 2;
    const startY = height / 2 - ((Math.ceil(count / colsUI) - 1) * spacingY) / 2 + 40;

    for (let i = 0; i < count; i++) {
      const frame = this.idleFrame(i, layout);
    
      const x = startX + (i % colsUI) * spacingX;
      const y = startY + Math.floor(i / colsUI) * spacingY;
    
      const s = this.add
        .sprite(x, y, C.key, frame)
        .setScale(2)
        .setTint(0xaaaaaa);
    
      const hit = this.add.zone(x, y, 70, 70)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
    
      hit.on("pointerover", () => {
        this.tweens.killTweensOf(s);
    
        s.setTint(0xffffff);
    
        this.tweens.add({
          targets: s,
          scaleX: 2.8,
          scaleY: 2.8,
          y: y - 6,
          duration: 120,
          ease: "Power2",
        });
      });
    
      hit.on("pointerout", () => {
        this.tweens.killTweensOf(s);
    
        s.setTint(0xaaaaaa);
    
        this.tweens.add({
          targets: s,
          scaleX: 2.5,
          scaleY: 2.5,
          y: y,
          duration: 120,
          ease: "Power2",
        });
      });
    
      hit.on("pointerdown", () => {
        localStorage.setItem("cv_character_index", String(i));
        this.scene.start("RoomScene", {
          mapKey: "lobby",
          characterIndex: i,
          spawnName: "spawn",
        });

        
      });
      
      this.scale.on("resize", this.handleResize, this);

      this.events.once("shutdown", () => {
      this.scale.off("resize", this.handleResize, this);
});
    }
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
  
  getLayout() {
    const img = this.textures.get(C.key).getSourceImage();

    const sheetCols = Math.round(
      (img.width - 2 * C.margin + C.spacing) / (C.frameWidth + C.spacing)
    );
    const sheetRows = Math.round(
      (img.height - 2 * C.margin + C.spacing) / (C.frameHeight + C.spacing)
    );

    const charactersPerRow = Math.floor(sheetCols / C.framesPerRowAnim);
    const characterRows = Math.floor(sheetRows / C.directions);
    const characterCount = Math.max(1, charactersPerRow * characterRows);

    return { sheetCols, sheetRows, charactersPerRow, characterRows, characterCount };
  }

  idleFrame(characterIndex, layout) {
    const blockX = characterIndex % layout.charactersPerRow;
    const blockY = Math.floor(characterIndex / layout.charactersPerRow);

    const base =
      (blockY * C.directions) * layout.sheetCols +
      (blockX * C.framesPerRowAnim);

    return base + 1;
  }
}