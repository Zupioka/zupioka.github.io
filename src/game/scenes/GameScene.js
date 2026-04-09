import Phaser from "phaser";
import { CHARACTER_SHEET as C } from "../data/characterSheet";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");

    this.player = null;
    this.keys = null;
    this.lastDir = "down";

    this.characterIndex = 0;

    // computed for the selected character
    this.sheetCols = 0;
    this.baseFrame = 0;

    this.speed = 160;

    // room geometry
    this.WORLD_W = 1200;
    this.WORLD_H = 700;
    this.ROOM_W = 320;
    this.ROOM_H = 240;
    this.roomX = 0;
    this.roomY = 0;
  }

  init(data) {
    const saved = localStorage.getItem("cv_character_index");
    this.characterIndex = data?.characterIndex ?? (saved ? parseInt(saved, 10) : 0);
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
    // ---------------------------
    // 1) ROOM GEOMETRY FIRST
    // ---------------------------
    this.roomX = (this.WORLD_W - this.ROOM_W) / 2;
    this.roomY = (this.WORLD_H - this.ROOM_H) / 2;

    // World bounds
    this.physics.world.setBounds(0, 0, this.WORLD_W, this.WORLD_H);
    this.cameras.main.setBounds(0, 0, this.WORLD_W, this.WORLD_H);

    // Visuals: outside + room floor + border
    this.add
      .rectangle(this.WORLD_W / 2, this.WORLD_H / 2, this.WORLD_W, this.WORLD_H, 0x0b0b0b)
      .setDepth(-20);

    this.add
      .rectangle(
        this.roomX + this.ROOM_W / 2,
        this.roomY + this.ROOM_H / 2,
        this.ROOM_W,
        this.ROOM_H,
        0x1a1a1a
      )
      .setDepth(-10);

    const border = this.add.graphics().setDepth(-9);
    border.lineStyle(4, 0x3a3a3a, 1);
    border.strokeRect(this.roomX, this.roomY, this.ROOM_W, this.ROOM_H);

    // ---------------------------
    // 2) CREATE PIXEL TEXTURE (for invisible colliders)
    // ---------------------------
    if (!this.textures.exists("px")) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 1, 1);
      g.generateTexture("px", 1, 1);
      g.destroy();
    }

    // ---------------------------
    // 3) WALL COLLIDERS AROUND THE ROOM
    // ---------------------------
    const walls = this.physics.add.staticGroup();
    const t = 20;

    // top
    walls
      .create(this.roomX + this.ROOM_W / 2, this.roomY, "px")
      .setDisplaySize(this.ROOM_W + t * 2, t)
      .setVisible(false)
      .refreshBody();

    // bottom
    walls
      .create(this.roomX + this.ROOM_W / 2, this.roomY + this.ROOM_H, "px")
      .setDisplaySize(this.ROOM_W + t * 2, t)
      .setVisible(false)
      .refreshBody();

    // left
    walls
      .create(this.roomX, this.roomY + this.ROOM_H / 2, "px")
      .setDisplaySize(t, this.ROOM_H + t * 2)
      .setVisible(false)
      .refreshBody();

    // right
    walls
      .create(this.roomX + this.ROOM_W, this.roomY + this.ROOM_H / 2, "px")
      .setDisplaySize(t, this.ROOM_H + t * 2)
      .setVisible(false)
      .refreshBody();

    // ---------------------------
    // 4) CHARACTER FRAMES & ANIMATIONS
    // ---------------------------
    // We *can* compute sheetCols dynamically, but since your sheet is fixed now
    // (12 columns, 8 rows), we can just use the config values.
    this.sheetCols = C.sheetCols;

    const charactersPerRow = C.charactersPerRow;
    const characterCount = C.characterCount;

    this.characterIndex = Math.max(0, Math.min(this.characterIndex, characterCount - 1));

    const blockX = this.characterIndex % charactersPerRow;
    const blockY = Math.floor(this.characterIndex / charactersPerRow);

    // base frame = top-left of character block (down row, first frame)
    this.baseFrame = (blockY * C.directions) * this.sheetCols + blockX * C.framesPerRowAnim;

    const rowStart = (dirIdx) => this.baseFrame + dirIdx * this.sheetCols;
    const animKey = (name) => `char${this.characterIndex}-${name}`;

    const ensureAnim = (k, start) => {
      if (this.anims.exists(k)) return;
      this.anims.create({
        key: k,
        frames: this.anims.generateFrameNumbers(C.key, { start, end: start + 2 }),
        frameRate: 10,
        repeat: -1,
      });
    };

    ensureAnim(animKey("walk-down"), rowStart(0));
    ensureAnim(animKey("walk-left"), rowStart(1));
    ensureAnim(animKey("walk-right"), rowStart(2));
    ensureAnim(animKey("walk-up"), rowStart(3));

    // ---------------------------
    // 5) CREATE PLAYER INSIDE THE ROOM
    // ---------------------------
    this.player = this.physics.add.sprite(
      this.roomX + this.ROOM_W / 2,
      this.roomY + this.ROOM_H / 2,
      C.key,
      rowStart(0) + 1 // idle = middle frame of down row
    );

    this.player.setCollideWorldBounds(true);

    // hitbox tuned for your sprite
    this.player.body.setSize(10, 8);
    this.player.body.setOffset(3, 10);

    // collide with room walls
    this.physics.add.collider(this.player, walls);

    // camera follow
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setRoundPixels(true);

    // inputs
    this.keys = this.input.keyboard.addKeys({
      upW: Phaser.Input.Keyboard.KeyCodes.W,
      leftA: Phaser.Input.Keyboard.KeyCodes.A,
      downS: Phaser.Input.Keyboard.KeyCodes.S,
      rightD: Phaser.Input.Keyboard.KeyCodes.D,
      upZ: Phaser.Input.Keyboard.KeyCodes.Z,
      leftQ: Phaser.Input.Keyboard.KeyCodes.Q,
    });

    // UI hint
    this.add
      .text(16, 16, "Move: WASD/ZQSD • ESC: back", {
        fontFamily: "system-ui, Segoe UI, Roboto, Arial",
        fontSize: "13px",
        color: "#ffffff",
      })
      .setScrollFactor(0);

    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.start("CharacterSelectScene");
    });

    // store key builder for update()
    this.animKey = animKey;
  }

  update() {
    if (!this.player || !this.keys) return;

    const up = this.keys.upW.isDown || this.keys.upZ.isDown;
    const left = this.keys.leftA.isDown || this.keys.leftQ.isDown;
    const down = this.keys.downS.isDown;
    const right = this.keys.rightD.isDown;

    let vx = 0,
      vy = 0;
    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    if (vx || vy) {
      const len = Math.hypot(vx, vy);
      vx = (vx / len) * this.speed;
      vy = (vy / len) * this.speed;

      this.player.setVelocity(vx, vy);

      if (Math.abs(vx) > Math.abs(vy)) {
        if (vx > 0) {
          this.player.anims.play(this.animKey("walk-right"), true);
          this.lastDir = "right";
        } else {
          this.player.anims.play(this.animKey("walk-left"), true);
          this.lastDir = "left";
        }
      } else {
        if (vy > 0) {
          this.player.anims.play(this.animKey("walk-down"), true);
          this.lastDir = "down";
        } else {
          this.player.anims.play(this.animKey("walk-up"), true);
          this.lastDir = "up";
        }
      }
    } else {
      this.player.setVelocity(0, 0);
      this.player.anims.stop();

      // idle = middle frame of each direction row
      const idleFrame = {
        down: this.baseFrame + 0 * this.sheetCols + 1,
        left: this.baseFrame + 1 * this.sheetCols + 1,
        right: this.baseFrame + 2 * this.sheetCols + 1,
        up: this.baseFrame + 3 * this.sheetCols + 1,
      }[this.lastDir];

      this.player.setFrame(idleFrame);
    }
  }
}