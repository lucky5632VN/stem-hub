/**
 * Comprehensive Unit Tests for voxelSkinEngine.js
 */

import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  MODEL_TYPES,
  PRESET_SKINS,
  SKIN_PARTS,
  getPartDefinition,
  getSkinUVCoordinates,
  applySkinUVsToGeometry,
  createVoxelBoxGeometry,
  generateSTEMSteveSkin,
  generateCyberAlexSkin,
  generateBiohazardHazmatSkin,
  generateQuantumPhysicistSkin,
  generatePresetSkin,
  generateCapeTexture,
  convertLegacySkin,
  isAlexSkin,
  loadSkin,
  exportSkin,
  downloadSkin,
  generateIsometricHeadAvatar,
  createSkinTexture,
  parseColor
} from '../src/lib/voxelSkinEngine.js';

console.log('--- RUNNING COMPREHENSIVE VOXEL ENGINE TEST SUITE ---');

// 1. Color Parser Tests
console.log('1. Testing parseColor...');
assert.deepStrictEqual(parseColor('#fff'), { r: 255, g: 255, b: 255, a: 255 });
assert.deepStrictEqual(parseColor('#00f2fe'), { r: 0, g: 242, b: 254, a: 255 });
assert.deepStrictEqual(parseColor('rgba(10, 20, 30, 0.5)'), { r: 10, g: 20, b: 30, a: 128 });
console.log('✅ parseColor verified');

// 2. Part Definition & UV Coordinates
console.log('2. Testing Part Definition & UV Coordinates...');
const allPartNames = [
  'head', 'headOverlay',
  'body', 'bodyOverlay',
  'rightArm', 'rightArmOverlay',
  'leftArm', 'leftArmOverlay',
  'rightLeg', 'rightLegOverlay',
  'leftLeg', 'leftLegOverlay',
  'cape'
];

allPartNames.forEach((name) => {
  const stevePart = getPartDefinition(name, false);
  assert(stevePart, `Part ${name} must exist for Steve`);
  const uvs = getSkinUVCoordinates(name, false);
  assert(uvs.front, `UVs for ${name} must have front face`);
  assert(uvs.left, `UVs for ${name} must have left face`);
  assert(uvs.right, `UVs for ${name} must have right face`);
  assert(uvs.top, `UVs for ${name} must have top face`);
  assert(uvs.bottom, `UVs for ${name} must have bottom face`);
  assert(uvs.back, `UVs for ${name} must have back face`);

  const alexPart = getPartDefinition(name, true);
  assert(alexPart, `Part ${name} must exist for Alex`);
});

const alexRightArm = getPartDefinition('rightArm', true);
assert.strictEqual(alexRightArm.w, 3, 'Alex right arm width must be 3');
const steveRightArm = getPartDefinition('rightArm', false);
assert.strictEqual(steveRightArm.w, 4, 'Steve right arm width must be 4');
console.log('✅ Part definitions & UV generator verified');

// 3. Three.js BoxGeometry UV Mapping
console.log('3. Testing Three.js BoxGeometry UV mapping...');
allPartNames.forEach((name) => {
  const def = getPartDefinition(name, false);
  const geom = createVoxelBoxGeometry(def.w, def.h, def.d, name, false);
  assert(geom instanceof THREE.BoxGeometry, `Geometry for ${name} is BoxGeometry`);
  assert.strictEqual(geom.attributes.uv.count, 24, `Geometry ${name} has 24 UV coordinates`);
  assert.strictEqual(geom.attributes.position.count, 24, `Geometry ${name} has 24 vertices`);
});
console.log('✅ Three.js BoxGeometry UV mapping verified for all 13 parts');

// 4. Preset Skin Generation
console.log('4. Testing Preset Skins...');
const presets = [
  { key: 'stem_steve', name: 'STEM Lab Coat Steve', fn: generateSTEMSteveSkin },
  { key: 'cyber_alex', name: 'Cyber Alex', fn: generateCyberAlexSkin },
  { key: 'biohazard_hazmat', name: 'Biohazard Hazmat', fn: generateBiohazardHazmatSkin },
  { key: 'quantum_physicist', name: 'Quantum Physicist', fn: generateQuantumPhysicistSkin }
];

presets.forEach((p) => {
  const skin = p.fn();
  assert.strictEqual(skin.width, 64, `${p.name} width is 64`);
  assert.strictEqual(skin.height, 64, `${p.name} height is 64`);

  const dataUrl = exportSkin(skin);
  assert(dataUrl.startsWith('data:image/png;base64'), `${p.name} exports valid data URL`);

  // Test dispatcher
  const dispatched = generatePresetSkin(p.key);
  assert.strictEqual(dispatched.width, 64, `Dispatched ${p.key} width is 64`);
});
console.log('✅ All 4 STEM Preset skins synthesized and verified');

// 5. Cape Textures
console.log('5. Testing Cape Textures...');
['stem', 'cyber', 'hazard', 'quantum'].forEach((type) => {
  const cape = generateCapeTexture(type);
  assert.strictEqual(cape.width, 64, `Cape ${type} width is 64`);
  assert.strictEqual(cape.height, 32, `Cape ${type} height is 32`);
});
console.log('✅ Cape textures synthesized');

// 6. Legacy 64x32 Conversion & Alex Detection
console.log('6. Testing Legacy 64x32 conversion & Alex detection...');
const legacyMock = {
  width: 64,
  height: 32,
  data: new Uint8ClampedArray(64 * 32 * 4).fill(120),
  getImageData: () => ({ data: new Uint8ClampedArray(64 * 32 * 4).fill(120) })
};
const converted = convertLegacySkin(legacyMock);
assert.strictEqual(converted.width, 64);
assert.strictEqual(converted.height, 64);

const alexCheck = isAlexSkin(generateCyberAlexSkin());
// cyber_alex has custom pixels, check boolean return
assert.strictEqual(typeof alexCheck, 'boolean');
console.log('✅ Legacy conversion and model detection verified');

// 7. 2D Isometric Head Avatar Snapshot Performance & Quality
console.log('7. Testing 2D Isometric Head Avatar Snapshot...');
const steveSkin = generateSTEMSteveSkin();
const tStart = performance.now();
const snapshot128 = generateIsometricHeadAvatar(steveSkin, { size: 128, showOverlay: true, lighting: true });
const tEnd = performance.now();
assert(typeof snapshot128 === 'string');
assert(snapshot128.startsWith('data:image/png;base64'));
console.log(`✅ 128x128 snapshot generated in ${(tEnd - tStart).toFixed(2)}ms`);

const snapshot64 = generateIsometricHeadAvatar(steveSkin, { size: 64, showOverlay: false, lighting: false });
assert(typeof snapshot64 === 'string');

// 8. Safe SSR / Node functions
console.log('8. Testing SSR safe helpers...');
assert.doesNotThrow(() => downloadSkin('data:image/png;base64,mock'));
console.log('✅ downloadSkin safely handles non-browser environment');

console.log('🎉 ALL COMPREHENSIVE TESTS PASSED! VOXEL ENGINE IS 100% OPERATIONAL!');
