import assert from 'node:assert';
import { 
  VOXEL_GACHA_POOL, 
  voxelAudio, 
  rollVoxelGacha, 
  GACHA_CONSTANTS 
} from '../src/lib/voxelGachaEngine.js';

console.log('🧪 Starting test suite for VoxelGachaEngine...');

// =========================================================================
// TEST 1: CATALOG AND POOL INTEGRITY
// =========================================================================
console.log('Test 1: Validating VOXEL_GACHA_POOL catalog structure and rarities...');
assert(Array.isArray(VOXEL_GACHA_POOL), 'VOXEL_GACHA_POOL must be an array');
assert(VOXEL_GACHA_POOL.length >= 20, `VOXEL_GACHA_POOL must have at least 20 items, got ${VOXEL_GACHA_POOL.length}`);

const rarities = ['Legendary', 'Epic', 'Rare', 'Common'];
const itemsByRarity = {
  Legendary: VOXEL_GACHA_POOL.filter(i => i.rarity === 'Legendary'),
  Epic: VOXEL_GACHA_POOL.filter(i => i.rarity === 'Epic'),
  Rare: VOXEL_GACHA_POOL.filter(i => i.rarity === 'Rare'),
  Common: VOXEL_GACHA_POOL.filter(i => i.rarity === 'Common')
};

rarities.forEach(r => {
  assert(itemsByRarity[r].length > 0, `Pool must contain items for rarity: ${r}`);
  console.log(`  ✓ Rarity ${r}: ${itemsByRarity[r].length} items`);
});

// Check compensation values
itemsByRarity.Legendary.forEach(item => {
  assert.strictEqual(item.compensation, 500, `Legendary item ${item.name} must have 500 crystal compensation`);
});
itemsByRarity.Epic.forEach(item => {
  assert.strictEqual(item.compensation, 150, `Epic item ${item.name} must have 150 crystal compensation`);
});
itemsByRarity.Rare.forEach(item => {
  assert.strictEqual(item.compensation, 50, `Rare item ${item.name} must have 50 crystal compensation`);
});
itemsByRarity.Common.forEach(item => {
  assert.strictEqual(item.compensation, 20, `Common item ${item.name} must have 20 crystal compensation`);
});

// =========================================================================
// TEST 2: KEY VOXEL/MINECRAFT AND STEM ITEMS EXIST IN POOL
// =========================================================================
console.log('Test 2: Checking essential Voxel, Cape, and STEM customizer items...');
const requiredItemIds = [
  'dragon_elo',        // Áo Choàng ELO Rồng Vàng
  'nether_tech',       // Giáp Nether-Tech Lượng Tử
  'diamond_pickaxe',   // Cuốc Kim Cương
  'stem_trophy',       // Cúp Kim Cương STEM
  'aurora',            // Áo Choàng Cực Quang Aurora
  'astronaut_nebula',  // Đồ Phi Hành Gia Nebula
  'einstein_hair',     // Tóc Xù Einstein
  'ar_goggles',        // Kính Bảo Hộ AR Cyber
  'ruler_3d',          // Thước Đo 3D
  'matrix',            // Áo Choàng Ma Trận Matrix
  'lab_coat',          // Áo Blouse Trắng Viền Neon
  'chemical_flask'     // Bình Hóa Chất Sủi Bọt
];

requiredItemIds.forEach(id => {
  const found = VOXEL_GACHA_POOL.find(i => i.id === id);
  assert(found, `Required item ${id} must exist in VOXEL_GACHA_POOL`);
  assert(found.name, `Item ${id} must have a name`);
  assert(found.category, `Item ${id} must have a category`);
  assert(found.icon, `Item ${id} must have an icon`);
});
console.log(`  ✓ All ${requiredItemIds.length} essential items verified with valid metadata.`);

// =========================================================================
// TEST 3: DUPLICATE CONVERSION LOGIC (rollVoxelGacha)
// =========================================================================
console.log('Test 3: Testing rollVoxelGacha duplicate conversion and auto-unlock...');
const currentUnlocked = ['dragon_elo', 'aurora', 'lab_coat'];
const rollResult = rollVoxelGacha(10, currentUnlocked, [], 0);

assert.strictEqual(rollResult.results.length, 10, 'Roll result must contain 10 items');
assert(rollResult.newlyWonIds.length > 0 || rollResult.totalCompensation > 0, 'Must either unlock new or compensate');

rollResult.results.forEach(res => {
  if (res.isDuplicate) {
    assert(res.compensation > 0, 'Duplicate item must have positive compensation');
  }
});
console.log(`  ✓ 10-pull produced: ${rollResult.newlyWonIds.length} new items unlocked, +${rollResult.totalCompensation} 🔮 refunded.`);

// =========================================================================
// TEST 4: PITY SYSTEM (GUARANTEED HARD PITY AT 50)
// =========================================================================
console.log('Test 4: Testing Hard Pity (Guaranteed SSR at 50 pulls)...');
// Force pity at 49, the 50th roll MUST be Legendary
const hardPityRoll = rollVoxelGacha(1, [], [], 49);
assert.strictEqual(hardPityRoll.results[0].item.rarity, 'Legendary', '50th pull must trigger guaranteed Legendary');
assert.strictEqual(hardPityRoll.newPity, 0, 'Pity must reset to 0 after Legendary drop');
console.log(`  ✓ Hard pity successfully verified: 50th pull awarded ${hardPityRoll.results[0].item.name} (Legendary), pity reset to 0.`);

// Test 10-pull Epic guarantee
console.log('Test 4b: Testing 10-pull Epic guarantee...');
let tenPullGuaranteed = 0;
for (let t = 0; t < 50; t++) {
  const tenRoll = rollVoxelGacha(10, [], [], 0);
  const hasSrOrHigher = tenRoll.results.some(r => r.item.rarity === 'Legendary' || r.item.rarity === 'Epic');
  assert(hasSrOrHigher, 'Every 10-pull must have at least one Epic or Legendary');
  tenPullGuaranteed++;
}
console.log(`  ✓ 50 consecutive 10-pulls verified: 100% of pulls contained at least one SR or SSR!`);

// =========================================================================
// TEST 5: AUDIO SYNTHESIZER INTERFACE
// =========================================================================
console.log('Test 5: Testing voxelAudio synthesizer interface...');
assert(typeof voxelAudio.playSpark === 'function', 'playSpark must be a function');
assert(typeof voxelAudio.playCharge === 'function', 'playCharge must be a function');
assert(typeof voxelAudio.playShatter === 'function', 'playShatter must be a function');
assert(typeof voxelAudio.playCardFlip === 'function', 'playCardFlip must be a function');
assert(typeof voxelAudio.playLegendaryStinger === 'function', 'playLegendaryStinger must be a function');
assert(typeof voxelAudio.playEpicStinger === 'function', 'playEpicStinger must be a function');
assert(typeof voxelAudio.playRefundPing === 'function', 'playRefundPing must be a function');

// Safe invocation in Node without window/AudioContext (must not throw)
voxelAudio.playSpark();
voxelAudio.playCharge(0.5);
voxelAudio.playShatter();
voxelAudio.playCardFlip();
voxelAudio.playLegendaryStinger();
voxelAudio.playEpicStinger();
voxelAudio.playRefundPing();
console.log('  ✓ voxelAudio safely handles execution in all environments without throwing.');

console.log('🎉 ALL 5 TEST SUITES PASSED CLEANLY!');
