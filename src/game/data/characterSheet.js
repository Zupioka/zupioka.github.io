export const CHARACTER_SHEET = {
  key: "characterSheet",
  path: "/assets/sprites/character.png",

  // ✅ Correct for 192x160 with 12x8 frames:
  frameWidth: 16,
  frameHeight: 20,
  margin: 0,
  spacing: 0,

  // Layout:
  sheetCols: 12,        // frames per row
  framesPerRowAnim: 3,  // walk frames
  directions: 4,        // down/left/right/up rows per character

  charactersPerRow: 4,  // 12 / 3 = 4 characters across
  characterCount: 8,    // 4 across × 2 down
};
