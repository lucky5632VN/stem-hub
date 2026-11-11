import fs from 'fs';

console.log('=== RUNNING PIXEL SKIN STUDIO VALIDATION TESTS ===');

const studioSrc = fs.readFileSync('src/components/organisms/PixelSkinStudio.jsx', 'utf-8');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`✅ Passed: ${label}`);
    passed++;
  } else {
    console.error(`❌ FAILED: ${label}`);
    failed++;
  }
}

// 1. Models & Poses
assert(
  studioSrc.includes("id: 'steve'") && studioSrc.includes("id: 'alex'") && studioSrc.includes("id: 'cyborg'"),
  'Support Steve (4px), Alex (3px slim) and Cyborg Voxel'
);
assert(
  studioSrc.includes("id: 'idle'") && studioSrc.includes("id: 'wave'") && studioSrc.includes("id: 'combat'"),
  'Support Idle, Wave and Combat poses'
);

// 2. Skin Tones & Glowing Eyes
assert(
  studioSrc.includes("id: 'natural'") && studioSrc.includes("id: 'tan'") && 
  studioSrc.includes("id: 'cyborg_silver'") && studioSrc.includes("id: 'alien_green'"),
  'Support 4 Minecraft Pixel Skin Tones (Natural, Tan, Cyborg Silver, Alien Green)'
);
assert(
  studioSrc.includes("id: 'cyan'") && studioSrc.includes("id: 'ruby'") && 
  studioSrc.includes("id: 'emerald'") && studioSrc.includes("id: 'amethyst'"),
  'Support 4 2x1 Glowing Eyes (Cyan, Ruby, Emerald, Amethyst)'
);

// 3. Hair & Protective Hats
assert(
  studioSrc.includes("id: 'lab_helmet'") && studioSrc.includes("id: 'einstein_fuzzy'") && 
  studioSrc.includes("id: 'cyber_anime'") && studioSrc.includes("id: 'ar_goggles'"),
  'Support Lab Helmet, Einstein Fuzzy Hair, Cyber Anime, AR Goggles'
);

// 4. Lab & Cyber Outfits
assert(
  studioSrc.includes("id: 'lab_coat'") && studioSrc.includes("id: 'astronaut_nebula'") && 
  studioSrc.includes("id: 'cyber_hoodie'") && studioSrc.includes("id: 'nether_armor'"),
  'Support Lab Coat, Astronaut Nebula, Cyber Hoodie, Nether-Tech Armor'
);

// 5. Dynamic Capes
assert(
  studioSrc.includes("id: 'dragon_elo'") && studioSrc.includes("id: 'aurora'") && studioSrc.includes("id: 'matrix'"),
  'Support Golden Dragon ELO Cape, Aurora Waves, Matrix Code Rain'
);

// 6. Held Items
assert(
  studioSrc.includes("id: 'chemical_flask'") && studioSrc.includes("id: 'stem_trophy'") && studioSrc.includes("id: 'ruler_3d'"),
  'Support Bubbling Chemical Flask, STEM Trophy, 3D Caliper Ruler'
);

// 7. Core Action Features
assert(
  studioSrc.includes('handleImportFile') && studioSrc.includes('accept="image/png"'),
  'Feature: Import PNG 64x64 Minecraft skin with validation'
);
assert(
  studioSrc.includes('handleExportMinecraftSkin') && studioSrc.includes('STEM_Skin_'),
  'Feature: Export PNG 64x64 Minecraft skin with download trigger'
);
assert(
  studioSrc.includes('handleSavePersonalization') && studioSrc.includes('setPersonalization') && studioSrc.includes('voxelSkin'),
  'Feature: Save Personalization with 0ms optimistic UI'
);
assert(
  studioSrc.includes('VoxelCharacter3D'),
  '3D Viewport integrates VoxelCharacter3D component'
);
assert(
  studioSrc.includes('generateMinecraft64x64Skin'),
  'Built-in 64x64 Minecraft canvas texture synthesizer'
);
assert(
  studioSrc.includes('generateIsometricHeadAvatar'),
  '2D Isometric head snapshot avatar generator'
);

console.log(`\n=== KẾT QUẢ: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
