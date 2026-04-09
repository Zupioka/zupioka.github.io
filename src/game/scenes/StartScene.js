import Phaser from "phaser";

export default class StartScene extends Phaser.Scene {
  constructor() {
    super("StartScene");
  }

  preload() {
    this.load.image("start_screen", "/assets/ui/start_screen.png");
    this.load.image("english_button", "/assets/ui/english_button.png");
    this.load.image("french_button", "/assets/ui/french_button.png");
  }

  create() {
    const { width, height } = this.scale;
  
    const bg = this.add.image(width / 2, height / 2, "start_screen");
    bg.setOrigin(0.5);
  
    const scale = Math.max(width / bg.width, height / bg.height);
    bg.setScale(scale);
  
    const startInEnglish = () => {
      localStorage.setItem("lang", "en");
      this.scene.start("CharacterSelectScene");
    };

    const startInFrench = () => {
      localStorage.setItem("lang", "fr");
      this.scene.start("CharacterSelectScene");
    };
  
    const enBtn = this.add.image(width / 2 - 140, height - 70, "english_button")
      .setInteractive({ useHandCursor: true });
    const frBtn = this.add.image(width / 2 + 140, height - 70, "french_button")
      .setInteractive({ useHandCursor: true });
  
    // optional: resize if too big
    enBtn.setScale(0.47);
    frBtn.setScale(0.47);
  
    enBtn.on("pointerdown", startInEnglish);
    frBtn.on("pointerdown", startInFrench);
  
    // optional hover effect
    enBtn.on("pointerover", () => enBtn.setScale(0.55));
    enBtn.on("pointerout", () => enBtn.setScale(0.47));
  
    frBtn.on("pointerover", () => frBtn.setScale(0.55));
    frBtn.on("pointerout", () => frBtn.setScale(0.47));

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
}