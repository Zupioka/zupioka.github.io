import Phaser from "phaser";
import { CHARACTER_SHEET as C } from "../data/characterSheet";

const UI_TEXT = {
  pressE: {
    en: "Press E",
    fr: "Appuyez sur E",
  },
  interact: {
    en: "Interact",
    fr: "Interagir",
  },
  close: {
    en: "ESC to close",
    fr: "ESC pour fermer",
  },
  moveHint: {
    en: "Move: WASD/ZQSD • E interact • ESC close/back",
    fr: "Déplacement : ZQSD/WASD • E interagir • ESC retour",
  },
  scrollHint: {
    en: "Mouse wheel / ↑ ↓ to scroll",
    fr: "Molette / ↑ ↓ pour défiler",
  },
};

export default class RoomScene extends Phaser.Scene {

  t(key) {
    return UI_TEXT[key]?.[this.lang] || UI_TEXT[key]?.en || key;
  }

  constructor() {
    super("RoomScene");
    
    this.mapKey = "lobby";
    this.spawnName = "spawn";

    this.player = null;
    this.keys = null;
    this.keyE = null;

    this.lastDir = "down";
    this.baseFrame = 0;
    this.sheetCols = 0;
    this.speed = 160;

    this.nearbyAction = null;
    this.prompt = null;

    this.EDUCATION_POPUPS = {
      bachelor: "ui_bachelor_box",
      Master: "ui_master_box",
      EITCA: "ui_EITCA_box",
    };

    // ✅ Map Tiled tileset NAME -> { key: Phaser image key, url: path under /public }
    // IMPORTANT: left side MUST match Tiled tileset name EXACTLY (case + spaces)
    this.TILESET_MAP = {
      "Floors": { key: "floors", url: "/assets/tilesets/floors.png" },
      "japanese tiles": { key: "japanese", url: "/assets/tilesets/japanese tiles.png" },
      "Museumtiles": { key: "Museumtiles", url: "/assets/tilesets/Museumtiles.png" },
      "furnitures1": { key: "furnitures1", url: "/assets/tilesets/furnitures1.png" },
      "furnitures2": { key: "furnitures2", url: "/assets/tilesets/furnitures2.png" },
      "pokemon1": { key: "pokemon1", url: "/assets/tilesets/pokemon1.png" },
      "Pokemon2": { key: "Pokemon2", url: "/assets/tilesets/Pokemon2.png" },
      "pokeinterior": { key: "pokeinterior", url: "/assets/tilesets/pokeinterior.png" },
      "pokewall": { key: "pokewall", url: "/assets/tilesets/pokewall.png" },
      "Custom": { key: "Custom", url: "/assets/tilesets/Custom.png" },
      "character1": { key: "character1", url: "/assets/tilesets/character1.png" },
      "character2": { key: "character2", url: "/assets/tilesets/character2.png" },
      "character3": { key: "character3", url: "/assets/tilesets/character3.png" },
    };
  }

  init(data) {
    this.mapKey = data?.mapKey || "lobby";
    this.spawnName = data?.spawnName || "spawn";

    const saved = localStorage.getItem("cv_character_index");
    this.characterIndex = data?.characterIndex ?? (saved ? parseInt(saved, 10) : 0);

    this.lang = localStorage.getItem("lang") || "en";
  }


  preload() {
    // Load map JSON (must be .tmj, with EMBEDDED tilesets)
    this.load.tilemapTiledJSON(this.mapKey, `/assets/maps/${this.mapKey}.tmj`);

    // load charachter image
    this.load.image("portrait_andré", "/assets/portraits/andré.png");
    this.load.image("portrait_carl", "/assets/portraits/carl.png");
    this.load.image("portrait_carol-ann", "/assets/portraits/carol-ann.png");
    this.load.image("portrait_caroline", "/assets/portraits/caroline.png");
    this.load.image("portrait_doryne", "/assets/portraits/doryne.png");
    this.load.image("portrait_francois", "/assets/portraits/francois.png");
    this.load.image("portrait_gustavo", "/assets/portraits/gustavo.png");
    this.load.image("portrait_jean-luc", "/assets/portraits/jean-luc.png");
    this.load.image("portrait_katya", "/assets/portraits/katya.png");
    this.load.image("portrait_louis-pierre", "/assets/portraits/louis-pierre.png");
    this.load.image("portrait_marjorick", "/assets/portraits/marjorick.png");
    this.load.image("portrait_melanie", "/assets/portraits/melanie.png");
    this.load.image("portrait_mj", "/assets/portraits/mj.png");
    this.load.image("portrait_morgane", "/assets/portraits/morgane.png");
    this.load.image("portrait_patricia", "/assets/portraits/patricia.png");
    this.load.image("portrait_ralph", "/assets/portraits/ralph.png");
    this.load.image("portrait_ruben", "/assets/portraits/ruben.png");
    this.load.image("portrait_samuel", "/assets/portraits/samuel.png");
    this.load.image("portrait_geoffrey", "/assets/portraits/geoffrey.png");
    this.load.image("portrait_geoffreysport", "/assets/portraits/geoffreysport.png");

    // Building Image
    this.load.image("building_etena", "/assets/building/building_etena.png")
    this.load.image("building_centech", "/assets/building/building_centech.png")
    this.load.image("building_bdp", "/assets/building/building_bdp.png")
    this.load.image("building_ni", "/assets/building/building_ni.png")

    //Dialogbox creation
    this.load.image("ui_dialog_box", "/assets/ui/dialog_box.png");
    this.load.image("ui_experience_box", "/assets/ui/experience_box.png");
  
    //Educationbox
    this.load.image("ui_bachelor_box","/assets/ui/bachelor_box.png");
    this.load.image("ui_master_box","/assets/ui/master_box.png");
    this.load.image("ui_EITCA_box","/assets/ui/EITCA_box.png");

    // recommandation box
    this.load.image("ui_recommandation_box", "/assets/ui/recommandation_box.png");


    // Load character spritesheet
    this.load.spritesheet(C.key, C.path, {
      frameWidth: C.frameWidth,
      frameHeight: C.frameHeight,
      margin: C.margin,
      spacing: C.spacing,
    });

    // Load all tileset images declared in TILESET_MAP
    for (const [tiledName, info] of Object.entries(this.TILESET_MAP)) {
      this.load.image(info.key, info.url);
    }
  }

  create() {
    // --- Create map ---
    const map = this.make.tilemap({ key: this.mapKey });

    // --- Attach tilesets robustly ---
    const tilesets = this.attachTilesets(map);

    if (!tilesets.length) {
      // Fail gracefully with clear instructions
      this.add.text(20, 20,
        `No tilesets attached.\n\nFix:\n1) In Tiled: Embed Tileset(s)\n2) Ensure PNG paths exist under /public\n3) Ensure TILESET_MAP names match Tiled tileset names`,
        { fontFamily: "system-ui", fontSize: "14px", color: "#ffaaaa" }
      );
      console.error("No tilesets attached. Map tilesets found:", map.tilesets?.map(ts => ts.name));
      return;
    }

    // Create layers
    const ground = map.createLayer("ground", tilesets, 0, 0);
    const level1 = map.createLayer("level1", tilesets, 0, 0);
    const level2 = map.createLayer("level2", tilesets, 0, 0);
    const level3 = map.createLayer("level3", tilesets, 0, 0);
    const Roomborder = map.createLayer("Roomborder", tilesets, 0, 0);
    const collision = map.createLayer("Collision", tilesets, 0, 0);

    ground?.setDepth(0);
    level1?.setDepth(0);
    level2?.setDepth(10000);
    level3?.setDepth(10000);
    Roomborder?.setDepth(20000);

    collision.setVisible(false);          // ✅ hide visuals
    collision.setAlpha(0);
    collision.setCollisionByExclusion([-1]); // ✅ keep physics

    if (!ground) console.warn(`Layer "ground" not found in map "${this.mapKey}"`);
    if (!collision) console.warn(`Layer "Collision" not found in map "${this.mapKey}"`);

    // collisions: everything on Collision layer collides
    if (collision) {
      collision.setCollisionByExclusion([-1]);
    }

    // world bounds from map size
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // --- Character frames & animations ---
    this.setupCharacterAnims();

    // --- Spawn from object layer ---
    const spawn = this.findObject(map, "Objects", this.spawnName) || this.findObject(map, "Objects", "spawn");

    const startX = spawn?.x ?? 100;
    const startY = spawn?.y ?? 100;

    this.player = this.physics.add.sprite(startX, startY, C.key, this.rowStart(0) + 1);
    this.player.setScale(2);
    this.player.setCollideWorldBounds(true);

    // hitbox (tune later)
    this.player.body.setSize(10, 8);
    this.player.body.setOffset(3, 10);

    // collide with collision layer
    if (collision) {
      this.physics.add.collider(this.player, collision);
    }

    // camera follow
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1);
    this.cameras.main.setRoundPixels(true);

    // inputs
    this.keys = this.input.keyboard.addKeys({
      // ZQSD / WASD
      upW: Phaser.Input.Keyboard.KeyCodes.W,
      leftA: Phaser.Input.Keyboard.KeyCodes.A,
      downS: Phaser.Input.Keyboard.KeyCodes.S,
      rightD: Phaser.Input.Keyboard.KeyCodes.D,
      upZ: Phaser.Input.Keyboard.KeyCodes.Z,
      leftQ: Phaser.Input.Keyboard.KeyCodes.Q,
    
      // Arrows
      upArrow: Phaser.Input.Keyboard.KeyCodes.UP,
      leftArrow: Phaser.Input.Keyboard.KeyCodes.LEFT,
      downArrow: Phaser.Input.Keyboard.KeyCodes.DOWN,
      rightArrow: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    });
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyRun = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.controls = {
      up: false,
      left: false,
      down: false,
      right: false,
      run: false,
    
      interactHeld: false,
      interactPressed: false,
    };
    this.input.addPointer(2);
    this.createMobileControls();

    this.nearbyAction = null;
    this.buildInteractablesFromObjects(map);

    // prompt
    this.prompt = this.add.text(0, 0, "Press E", {
      fontFamily: "system-ui, Segoe UI, Roboto, Arial",
      fontSize: "14px",
      color: "#ffffff",
    }).setOrigin(0.5).setVisible(false).setScrollFactor(0);
    this.isPopupOpen = false;
    this.createPhaserPopup();

    this.input.on("wheel", (_pointer, _go, _dx, dy) => {
      if (!this.isPopupOpen) return;
      if (!this.popup?.recBox?.visible) return;
    
      if (dy > 0) this.scrollRecommandation(1);
      else if (dy < 0) this.scrollRecommandation(-1);
    });
    
    this.input.keyboard.on("keydown-UP", () => {
      if (this.isPopupOpen && this.popup?.recBox?.visible) this.scrollRecommandation(-1);
    });
    
    this.input.keyboard.on("keydown-DOWN", () => {
      if (this.isPopupOpen && this.popup?.recBox?.visible) this.scrollRecommandation(1);
    });

    // ---- Popup state ----
    this.isPopupOpen = false;

    // close button (if popup exists in HTML)
    const closeBtn = document.getElementById("cv-popup-close");
    if (closeBtn) closeBtn.onclick = () => this.closePopup();

    // UI hint
    this.add.text(16, 16, this.t("moveHint"), {
     fontFamily: "system-ui, Segoe UI, Roboto, Arial",
     fontSize: "13px",
     color: "#ffffff",
    }).setScrollFactor(0)
      .setDepth(999999);
      

    // ESC: close popup if open, otherwise go back to character select
    this.input.keyboard.on("keydown-ESC", () => {
     if (this.isPopupOpen) this.closePopup();
     else this.scene.start("CharacterSelectScene");
    });

    this.scale.on("resize", this.handleResize, this);
    this.events.once("shutdown", () => {
      this.scale.off("resize", this.handleResize, this);
    });
    this.cameras.main.fadeIn(180, 0, 0, 0);
  }

  createMobileControls() {
    const isTouchDevice =
      this.sys.game.device.input.touch ||
      this.sys.game.device.os.iOS ||
      this.sys.game.device.os.android;
  
    if (!isTouchDevice) return;
  
    const { width, height } = this.scale;
  
    this.mobileUi = this.add.container(0, 0).setDepth(1000000);
  
    const makeButton = (x, y, w, h, label, onDown, onUp) => {
      const bg = this.add
        .circle(x, y, w * 0.5, 0xffffff, 0.04)
        .setStrokeStyle(3, 0xffffff, 0.35)
        .setScrollFactor(0)
        .setDepth(40000)
        .setInteractive();

      const text = this.add
        .text(x, y, label, {
          fontFamily: "system-ui, Segoe UI, Roboto, Arial",
          fontSize: "30px",
          fontStyle: "bold",
          color: "#ffffff",
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(40000);
  
      bg.on("pointerdown", () => {
        onDown?.();
      });
  
      bg.on("pointerup", () => {
        onUp?.();
      });
  
      bg.on("pointerout", () => {
        onUp?.();
      });
  
      this.mobileUi.add([bg, text]);
  
      return bg;
    };
  

    // arrow-Pad for mobile controls
    const dpadX = 120;       // more to the right
    const dpadY = height - 90; // higher than before

    makeButton(
     dpadX,
     dpadY - 80,
     80,
     80,
     "↑",
     () => (this.controls.up = true),
     () => (this.controls.up = false)
    );

    makeButton(
     dpadX - 80,
     dpadY,
     80,
     80,
     "←",
     () => (this.controls.left = true),
     () => (this.controls.left = false)
    );

    makeButton(
      dpadX,
      dpadY,
      80,
      80,
      "↓",
      () => (this.controls.down = true),
      () => (this.controls.down = false)
    );

    makeButton(
      dpadX + 80,
      dpadY,
      80,
      80,
      "→",
      () => (this.controls.right = true),
      () => (this.controls.right = false)
    );

    // E button a bit more up and left
    makeButton(
      width - 95,
      height - 95,
      90,
      90,
      "E",
      () => {
        this.controls.interactHeld = true;
        this.controls.interactPressed = true;
      },
      () => {
        this.controls.interactHeld = false;
      }
    );
  }
 
  handleResize() {
    this.scale.refresh();
  
    if (this._resizeTimer) {
      this._resizeTimer.remove(false);
    }
  
    this._resizeTimer = this.time.delayedCall(120, () => {
      this.scale.refresh();
  
      if (this.popup) {
        const wasOpen = this.isPopupOpen;
        const currentAction = wasOpen ? this.nearbyAction : null;
  
        this.closePopup(true);
  
        Object.values(this.popup).forEach((obj) => {
          if (obj && obj.destroy) obj.destroy();
        });
  
        this.popup = null;
        this.createPhaserPopup();
  
        if (wasOpen && currentAction) {
          this.openPopup(currentAction);
        }
      }
  
      if (this.mobileUi) {
        this.mobileUi.destroy(true);
        this.mobileUi = null;
        this.createMobileControls();
      }
    });
  }
  
  // ---------- Tilesets ----------
  attachTilesets(map) {
    const tilesets = [];

    const mapTilesets = map.tilesets || [];
    console.log("Map tilesets found:", mapTilesets.map((ts) => ts.name));

    for (const ts of mapTilesets) {
      const entry = this.TILESET_MAP[ts.name];
      if (!entry) {
        console.warn(`No TILESET_MAP entry for Tiled tileset name: "${ts.name}"`);
        continue;
      }

      if (!this.textures.exists(entry.key)) {
        console.error(
          `Texture key "${entry.key}" not loaded for tileset "${ts.name}".\nCheck file path: ${entry.url}`
        );
        continue;
      }

      const added = map.addTilesetImage(ts.name, entry.key);
      if (added) tilesets.push(added);
    }

    return tilesets;
  }

  // ---------- Objects ----------
  findObject(map, layerName, objectName) {
    const layer = map.getObjectLayer(layerName);
    return layer?.objects?.find((o) => o.name === objectName);
  }

  buildInteractablesFromObjects(map) {
    const objLayer = map.getObjectLayer("Objects");
    if (!objLayer?.objects) {
      console.warn('No "Objects" layer found');
      this.interactZones = [];
      return;
    }
  
    this.interactZones = [];
  
    for (const o of objLayer.objects) {
      // only rectangles
      if (!o.width || !o.height) continue;
  
      const props = this.propsToDict(o.properties);
      console.log(o.name, props);
  
      // only explicit interactables
      const objectType = (props.type || o.class || o.type || "").toString().toLowerCase();
      if (
        objectType !== "info" &&
        objectType !== "character" &&
        objectType !== "experience" &&
        objectType !== "education" &&
        objectType !== "recommandation"
      ) continue;
  
      this.interactZones.push({
        name: o.name,
        rect: new Phaser.Geom.Rectangle(o.x, o.y, o.width, o.height),
        action: {
          type: objectType,
          title: {
            en: props.title_en || props.title || props.label || o.name || "Info",
            fr: props.title_fr || props.title || props.label || o.name || "Info",
          },
          text: {
            en: props.text_en || props.text || "",
            fr: props.text_fr || props.text || "",
          },
          name: props.name || props.title || o.name || "Someone",
          portraitKey: props.portrait ? `portrait_${props.portrait}` : null,
          iconKey: props.icon || null,
          educationKey: props.education || null,
        },
      });
    }
  
    console.log("Interactables found:", this.interactZones.map(z => z.name));
  }

  updateInteractionPrompt() {
    this.nearbyAction = null;
    if (!this.prompt) return;
  
    this.prompt.setVisible(false);
  
    if (!this.interactZones || this.interactZones.length === 0) return;
  
    const pb = this.player.getBounds();
    let best = null;
    let bestDist = Infinity;
  
    for (const z of this.interactZones) {
      // ✅ FIX: Expand the interaction rectangle by 15 pixels in all directions
      // This creates a "proximity radius" so the player doesn't have to perfectly overlap
      const expandedZone = Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(z.rect), 15, 15);
  
      if (!Phaser.Geom.Intersects.RectangleToRectangle(pb, expandedZone)) continue;
  
      const zx = z.rect.centerX;
      const zy = z.rect.centerY;
      const dx = this.player.x - zx;
      const dy = this.player.y - zy;
      const d2 = dx * dx + dy * dy;
  
      if (d2 < bestDist) {
        bestDist = d2;
        best = z;
      }
    }
  
    if (best) {
      this.nearbyAction = best.action;
      this.prompt.setVisible(true);
      this.prompt.setText(this.t("pressE"));
      const cam = this.cameras.main;
      this.prompt.setPosition(
       best.rect.centerX - cam.worldView.x,
       best.rect.top - 10 - cam.worldView.y
      );
      this.prompt.setDepth(999999);
    }
  }

  propsToDict(props = []) {
    const out = {};
    for (const p of props) out[p.name] = p.value;
    return out;
  }

  // ---------- Character ----------
  setupCharacterAnims() {
    this.sheetCols = C.sheetCols;

    const charactersPerRow = C.charactersPerRow;
    const characterCount = C.characterCount;

    this.characterIndex = Math.max(0, Math.min(this.characterIndex, characterCount - 1));

    const blockX = this.characterIndex % charactersPerRow;
    const blockY = Math.floor(this.characterIndex / charactersPerRow);

    this.baseFrame = (blockY * C.directions) * this.sheetCols + blockX * C.framesPerRowAnim;

    this.rowStart = (dirIdx) => this.baseFrame + dirIdx * this.sheetCols;
    this.animKey = (name) => `char${this.characterIndex}-${name}`;

    const ensureAnim = (k, start) => {
      if (this.anims.exists(k)) return;
      this.anims.create({
        key: k,
        frames: this.anims.generateFrameNumbers(C.key, { start, end: start + 2 }),
        frameRate: 10,
        repeat: -1,
      });
    };

    ensureAnim(this.animKey("walk-down"), this.rowStart(0));
    ensureAnim(this.animKey("walk-left"), this.rowStart(1));
    ensureAnim(this.animKey("walk-right"), this.rowStart(2));
    ensureAnim(this.animKey("walk-up"), this.rowStart(3));
  }
  
  // ---------- Popup ----------
  openPopup(action) {
    if (!this.popup) this.createPhaserPopup();

    const title =
     typeof action.title === "string"
      ? action.title
      : (action.title?.[this.lang] || action.title?.en || action.title?.fr || "");

    const text =
     typeof action.text === "string"
      ? action.text
      : (action.text?.[this.lang] || action.text?.en || action.text?.fr || "");
  
    // First hide everything (without changing state)
    this.closePopup(true);
    this.mobileUi?.setVisible(false);

    this.popup.bg.setVisible(true);
  
    if (action.type === "character") {
      // Show Pokemon dialog
      this.popup.dialog.setVisible(true);

        if (action.portraitKey && this.textures.exists(action.portraitKey)) {
         const portraitSize = Math.round(this.popup.dialog.displayHeight * 0.26);

         this.popup.portrait
          .setTexture(action.portraitKey)
          .setVisible(true)
          .setDisplaySize(portraitSize, portraitSize);
        } else {
        this.popup.portrait.setVisible(false);
        }

        this.popup.speaker.setText(action.name || title || "").setVisible(true);
        this.popup.dialogText.setText(text || "").setVisible(true);

      } else if (action.type === "experience") {
        this.popup.expBox.setVisible(true);

        if (action.iconKey && this.textures.exists(action.iconKey)) {
          this.popup.expIcon.setTexture(action.iconKey).setVisible(true);
        } else {
          this.popup.expIcon.setVisible(false);
          console.warn("missing experience icon texture", action.iconKey);
        }
        this.popup.expTitle.setText(title || "Experience").setVisible(true);
        this.popup.expBody.setText(text || "").setVisible(true);

      } else if (action.type === "education") {
        const textureKey = this.EDUCATION_POPUPS[action.educationKey];
      
        if (textureKey && this.textures.exists(textureKey)) {
          this.popup.eduImage
            .setTexture(textureKey)
            .setVisible(true)
            .setDisplaySize(
              Math.round(this.scale.width * 0.90),
              Math.round(this.scale.height * 0.85)
            );
        } else {
          console.warn("Missing education popup texture for:", action.educationKey);
        }

      } else if (action.type === "recommandation") {
        this.popup.recBox.setVisible(true);
        this.popup.recTitle.setText(title || "Recommandation").setVisible(true);
        this.popup.recHint.setVisible(true);
      
        this.recFullText = text || "";
        this.popup.recBody
          .setText(this.recFullText)
          .setVisible(true);
      
        // reset scroll position
        this.recScrollY = 0;
        this.popup.recBody.y = this.recBodyBaseY;
      }
  
    this.isPopupOpen = true;
    this.prompt?.setVisible(false);
    this.player?.setVelocity(0, 0);
  }
  
  closePopup(keepState = false) {
    if (!this.popup) return;
  
    const hide = (obj) => { if (obj && obj.setVisible) obj.setVisible(false); };
  
    // shared
    hide(this.popup.bg);
    this.mobileUi?.setVisible(true);
  
    // info layout (center)
    hide(this.popup.infoPanel);
    hide(this.popup.infoTitle);
    hide(this.popup.infoBody);
  
    // character & experience layout (pokemon)
    hide(this.popup.dialog);
    hide(this.popup.portrait);
    hide(this.popup.speaker);
    hide(this.popup.dialogText);

    hide(this.popup.expBox);
    hide(this.popup.expTitle);
    hide(this.popup.expBody);
    hide(this.popup.expIcon);
    hide(this.popup.eduImage);

    hide(this.popup.recBox);
    hide(this.popup.recTitle);
    hide(this.popup.recBody);
    hide(this.popup.recHint);

    if (this.popup?.recBody) {
     this.popup.recBody.y = this.recBodyBaseY;
    }
    this.recScrollY = 0; 
  
    if (!keepState) this.isPopupOpen = false;
  }

  createPhaserPopup() {
    const { width, height } = this.scale;
  
    // Always reset popup object
    this.popup = {};
  
    // --- Backdrop ---
    const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.35)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(50000)
      .setVisible(false)
      .setInteractive();
  
    this.popup.bg = bg;
  
    // --- INFO UI (center) ---
    const infoW = Math.min(760, width - 40);
    const infoH = 280;
  
    const infoPanel = this.add.rectangle(width / 2, height / 2, infoW, infoH, 0x111111, 0.95)
      .setScrollFactor(0)
      .setDepth(50001)
      .setVisible(false);
  
    const infoTitle = this.add.text(width / 2 - infoW / 2 + 16, height / 2 - infoH / 2 + 14, "", {
      fontFamily: "system-ui, Segoe UI, Roboto, Arial",
      fontSize: "18px",
      color: "#ffffff",
    }).setScrollFactor(0).setDepth(50002).setVisible(false);
  
    const infoBody = this.add.text(width / 2 - infoW / 2 + 16, height / 2 - infoH / 2 + 52, "", {
      fontFamily: "system-ui, Segoe UI, Roboto, Arial",
      fontSize: "14px",
      color: "#dddddd",
      wordWrap: { width: infoW - 32 },
      lineSpacing: 6,
    }).setScrollFactor(0).setDepth(50002).setVisible(false);
  
    this.popup.infoPanel = infoPanel;
    this.popup.infoTitle = infoTitle;
    this.popup.infoBody = infoBody;
  
    // --- CHARACTER DIALOG (Pokemon bottom) ---  
    const dialog = this.add.image(width / 2, Math.round(height * 0.55), "ui_dialog_box")
     .setScrollFactor(0)
     .setDepth(50010)
     .setVisible(false);
  
    // ✅ Responsive size (works on all screens)
    const w = Math.round(width * 0.92);
    const h = Math.round(height * 0.58);   // taller

    const clampedW = Phaser.Math.Clamp(w, 520, 980);
    const clampedH = Phaser.Math.Clamp(h, 320, 520);  // much taller max

    dialog.setDisplaySize(clampedW, clampedH);

    // ✅ NOW define anchors (must be before portrait/text)
    const boxLeft = dialog.x - dialog.displayWidth / 2;
    const boxTop  = dialog.y - dialog.displayHeight / 2;

    // portrait size relative to box height
    const portraitSize = Math.round(dialog.displayHeight * 0.26);

    // portrait (top-left)
    const portrait = this.add.image(
     boxLeft + 80,
     boxTop + 30,
     "__dummy__"
    )
     .setScrollFactor(0)
     .setDepth(50011)
     .setVisible(false);

    portrait.setDisplaySize(portraitSize, portraitSize);
    portrait.setOrigin(0.5);

    // name
    const speaker = this.add.text(boxLeft + 40 + portraitSize + 24, boxTop + 36, "", {
     fontFamily: "system-ui, Segoe UI, Roboto, Arial",
     fontSize: "28px",
     fontStyle: "bold",
     color: "#ffffff",
    })
     .setScrollFactor(0)
     .setDepth(50011)
     .setVisible(false);

    // text
    const dialogText = this.add.text(boxLeft + -40 + portraitSize + 24, boxTop + 90, "", {
     fontFamily: "system-ui, Segoe UI, Roboto, Arial",
     fontSize: "10px",
     color: "#ffffff",
     wordWrap: { width: dialog.displayWidth - -30 - (portraitSize + 40) },
     lineSpacing: 10,
    })
     .setScrollFactor(0)
     .setDepth(50011)
     .setVisible(false);


     // SAVE character popup elements
    this.popup.dialog = dialog;
    this.popup.portrait = portrait;
    this.popup.speaker = speaker;
    this.popup.dialogText = dialogText;
    
    bg.on("pointerdown", () => this.closePopup());

    // --- EXPERIENCE BOX ---
    const expBox = this.add.image(width / 2, Math.round(height * 0.55), "ui_experience_box")
     .setScrollFactor(0)
     .setDepth(50020)
     .setVisible(false);

    // same size logic as character dialog
    const expW = Math.round(width * 0.92);
    const expH = Math.round(height * 0.58);

    const expClampedW = Phaser.Math.Clamp(expW, 520, 980);
    const expClampedH = Phaser.Math.Clamp(expH, 320, 520);

    expBox.setDisplaySize(expClampedW, expClampedH);

    const expLeft = expBox.x - expBox.displayWidth / 2;
    const expTop = expBox.y - expBox.displayHeight / 2;

    const buildingSize = Math.round(expBox.displayHeight * 0.05);

    const expIcon = this.add.image(
     expLeft + 80,
     expTop + 10,
     "icon_building"
    )
     .setScrollFactor(0)
     .setDepth(50021)
     .setVisible(false);

    expIcon.setDisplaySize(buildingSize, buildingSize);
    expIcon.setOrigin(0.5);

    // --- EDUCATION IMAGE POPUP ---
    const eduImage = this.add.image(width / 2, height / 2, "ui_EITCA_box")
     .setScrollFactor(0)
     .setDepth(50030)
     .setVisible(false);

    // responsive size
    const eduW = Math.round(width * 0.90);
    const eduH = Math.round(height * 0.85);

    eduImage.setDisplaySize(eduW, eduH);

    this.popup.eduImage = eduImage;

    // --- RECOMMANDATION BOX ---
    const recBox = this.add.image(width / 2, Math.round(height * 0.55), "ui_recommandation_box")
     .setScrollFactor(0)
     .setDepth(50040)
     .setVisible(false);

    const recW = Math.round(width * 0.92);
    const recH = Math.round(height * 0.72);

    const recClampedW = Phaser.Math.Clamp(recW, 520, 980);
    const recClampedH = Phaser.Math.Clamp(recH, 360, 700);

    recBox.setDisplaySize(recClampedW, recClampedH);

    const recLeft = recBox.x - recBox.displayWidth / 2;
    const recTop = recBox.y - recBox.displayHeight / 2;

    const recTitle = this.add.text(recLeft + 48, recTop + 36, "", {
     fontFamily: "system-ui, Segoe UI, Roboto, Arial",
     fontSize: "28px",
     fontStyle: "bold",
     color: "#ffffff",
    })
     .setScrollFactor(0)
     .setDepth(50041)
     .setVisible(false);

    const recBody = this.add.text(recLeft + 48, recTop + 85, "", {
     fontFamily: "system-ui, Segoe UI, Roboto, Arial",
     fontSize: "14px",
     color: "#ffffff",
     wordWrap: { width: recBox.displayWidth - 80 },
     lineSpacing: 8,
    })
     .setScrollFactor(0)
     .setDepth(50041)
     .setVisible(false);

    const recHint = this.add.text(
     recLeft + 48,
     recTop + recBox.displayHeight - 36,
     this.t("scrollHint"),
    {
     fontFamily: "system-ui, Segoe UI, Roboto, Arial",
     fontSize: "12px",
     color: "#dddddd",
    }
   )
    .setScrollFactor(0)
    .setDepth(50041)
    .setVisible(false);

   // ----- UI MASK -----
   const recViewportX = recLeft + 48;
   const recViewportY = recTop + 90;
   const recViewportW = recBox.displayWidth - 85;
   const recViewportH = recBox.displayHeight - 170;

   // IMPORTANT: use add.graphics() + setScrollFactor(0)
   // so the mask stays aligned with the popup on screen
   const recMaskShape = this.add.graphics()
    .setScrollFactor(0)
    .setDepth(50041)
    .setAlpha(0.001);

   recMaskShape.fillStyle(0xffffff, 1);
   recMaskShape.fillRect(recViewportX, recViewportY, recViewportW, recViewportH);

   const recMask = recMaskShape.createGeometryMask();
   recBody.setMask(recMask);

   this.popup.recBox = recBox;
   this.popup.recTitle = recTitle;
   this.popup.recBody = recBody;
   this.popup.recHint = recHint;
   this.popup.recMaskShape = recMaskShape;

   this.recViewportH = recViewportH;
   this.recBodyBaseY = recViewportY;
   this.recScrollY = 0;
   this.recScrollStep = 32;

    // Title style/position logic as character
    const expTitle = this.add.text(expLeft + 160, expTop + 36, "", {
     fontFamily: "system-ui, Segoe UI, Roboto, Arial",
     fontSize: "28px",
     fontStyle: "bold",
     color: "#ffffff",
    })
     .setScrollFactor(0)
     .setDepth(50021)
     .setVisible(false);

    // Body style/position logic as character
    const expBody = this.add.text(expLeft + 48, expTop + 90, "", {
     fontFamily: "system-ui, Segoe UI, Roboto, Arial",
     fontSize: "10px",
     color: "#ffffff",
     wordWrap: { width: expBox.displayWidth - 70 },
     lineSpacing: 10,
    })
     .setScrollFactor(0)
     .setDepth(50021)
     .setVisible(false);

    this.popup.expBox = expBox;
    this.popup.expTitle = expTitle;
    this.popup.expBody = expBody;
    this.popup.expIcon = expIcon;

  }

  scrollRecommandation(delta) {
    if (!this.isPopupOpen) return;
    if (!this.popup?.recBox?.visible || !this.popup?.recBody?.visible) return;
  
    const textHeight = this.popup.recBody.height;
    const maxScroll = Math.max(0, textHeight - this.recViewportH);
  
    this.recScrollY = Phaser.Math.Clamp(
      this.recScrollY + delta * this.recScrollStep,
      0,
      maxScroll
    );
  
    this.popup.recBody.y = this.recBodyBaseY - this.recScrollY;
  }

  // ---------- Update ----------
  update() {
    if (!this.player || !this.keys) return;
  
    const interactPressed =
     Phaser.Input.Keyboard.JustDown(this.keyE) ||
     this.controls.interactPressed;

    if (interactPressed) {
     if (this.isPopupOpen) {
      this.closePopup();
     } else if (this.nearbyAction) {
      this.openPopup(this.nearbyAction);
     }
    }

    this.controls.interactPressed = false;

    if (this.isPopupOpen) {
     this.prompt?.setVisible(false);
     this.player.setVelocity(0, 0);
     return;
    }

    this.updateInteractionPrompt();
  
    const up =
      this.controls.up ||
      this.keys.upW.isDown ||
      this.keys.upZ.isDown ||
      this.keys.upArrow.isDown;
  
    const left =
      this.controls.left ||
      this.keys.leftA.isDown ||
      this.keys.leftQ.isDown ||
      this.keys.leftArrow.isDown;
  
    const down =
      this.controls.down ||
      this.keys.downS.isDown ||
      this.keys.downArrow.isDown;
  
    const right =
      this.controls.right ||
      this.keys.rightD.isDown ||
      this.keys.rightArrow.isDown;
  
    const isRunning =
      this.controls.run ||
      this.keyRun?.isDown;
  
    let vx = 0, vy = 0;
    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;
  
    const speed = isRunning ? 260 : 160;
  
    if (vx || vy) {
      const len = Math.hypot(vx, vy);
      vx = (vx / len) * speed;
      vy = (vy / len) * speed;
  
      this.player.setVelocity(vx, vy);
  
      this.player.anims.msPerFrame = isRunning ? 60 : 100;
  
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