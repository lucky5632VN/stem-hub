/**
 * ============================================================================
 * VOXEL SKIN ENGINE (Standard Minecraft 64x64 UV & Texture Synthesizer)
 * ============================================================================
 * Provides:
 * 1. Standard Minecraft 64x64 skin UV coordinate generator for all body parts.
 * 2. Three.js BoxGeometry UV mapping helpers (Steve 4px arm & Alex 3px arm).
 * 3. Canvas texture synthesizer with 4 rich STEM presets:
 *    - STEM Lab Coat Steve
 *    - Cyber Alex
 *    - Biohazard Hazmat
 *    - Quantum Physicist
 * 4. Skin importer (PNG data URL, File, Blob, legacy 64x32 converter) & exporter.
 * 5. High-speed 2D isometric head avatar snapshot generator (< 1ms).
 * 6. Three.js Texture loader & Cape texture generator.
 * ============================================================================
 */

import * as THREE from 'three';

export const MODEL_TYPES = {
  STEVE: 'steve',
  ALEX: 'alex'
};

export const PRESET_SKINS = {
  STEM_STEVE: 'stem_steve',
  CYBER_ALEX: 'cyber_alex',
  BIOHAZARD_HAZMAT: 'biohazard_hazmat',
  QUANTUM_PHYSICIST: 'quantum_physicist'
};

/**
 * Standard Minecraft 64x64 skin UV definitions.
 * Each part defines w, h, d in voxel dimensions and 6 face rectangles [x1, y1, x2, y2].
 * Coordinates are in texture pixels (0..64).
 */
export const SKIN_PARTS = {
  head: {
    w: 8, h: 8, d: 8,
    faces: {
      right:  [0, 8, 8, 16],
      front:  [8, 8, 16, 16],
      left:   [16, 8, 24, 16],
      back:   [24, 8, 32, 16],
      top:    [8, 0, 16, 8],
      bottom: [16, 0, 24, 8]
    }
  },
  headOverlay: {
    w: 8, h: 8, d: 8,
    faces: {
      right:  [32, 8, 40, 16],
      front:  [40, 8, 48, 16],
      left:   [48, 8, 56, 16],
      back:   [56, 8, 64, 16],
      top:    [40, 0, 48, 8],
      bottom: [48, 0, 56, 8]
    }
  },
  body: {
    w: 8, h: 12, d: 4,
    faces: {
      right:  [16, 20, 20, 32],
      front:  [20, 20, 28, 32],
      left:   [28, 20, 32, 32],
      back:   [32, 20, 40, 32],
      top:    [20, 16, 28, 20],
      bottom: [28, 16, 36, 20]
    }
  },
  bodyOverlay: {
    w: 8, h: 12, d: 4,
    faces: {
      right:  [16, 36, 20, 48],
      front:  [20, 36, 28, 48],
      left:   [28, 36, 32, 48],
      back:   [32, 36, 40, 48],
      top:    [20, 32, 28, 36],
      bottom: [28, 32, 36, 36]
    }
  },
  rightArm: {
    w: 4, h: 12, d: 4,
    faces: {
      right:  [40, 20, 44, 32],
      front:  [44, 20, 48, 32],
      left:   [48, 20, 52, 32],
      back:   [52, 20, 56, 32],
      top:    [44, 16, 48, 20],
      bottom: [48, 16, 52, 20]
    }
  },
  rightArmSlim: {
    w: 3, h: 12, d: 4,
    faces: {
      right:  [40, 20, 44, 32],
      front:  [44, 20, 47, 32],
      left:   [47, 20, 51, 32],
      back:   [51, 20, 54, 32],
      top:    [44, 16, 47, 20],
      bottom: [47, 16, 50, 20]
    }
  },
  rightArmOverlay: {
    w: 4, h: 12, d: 4,
    faces: {
      right:  [40, 36, 44, 48],
      front:  [44, 36, 48, 48],
      left:   [48, 36, 52, 48],
      back:   [52, 36, 56, 48],
      top:    [44, 32, 48, 36],
      bottom: [48, 32, 52, 36]
    }
  },
  rightArmOverlaySlim: {
    w: 3, h: 12, d: 4,
    faces: {
      right:  [40, 36, 44, 48],
      front:  [44, 36, 47, 48],
      left:   [47, 36, 51, 48],
      back:   [51, 36, 54, 48],
      top:    [44, 32, 47, 36],
      bottom: [47, 32, 50, 36]
    }
  },
  leftArm: {
    w: 4, h: 12, d: 4,
    faces: {
      right:  [32, 52, 36, 64],
      front:  [36, 52, 40, 64],
      left:   [40, 52, 44, 64],
      back:   [44, 52, 48, 64],
      top:    [36, 48, 40, 52],
      bottom: [40, 48, 44, 52]
    }
  },
  leftArmSlim: {
    w: 3, h: 12, d: 4,
    faces: {
      right:  [32, 52, 36, 64],
      front:  [36, 52, 39, 64],
      left:   [39, 52, 43, 64],
      back:   [43, 52, 46, 64],
      top:    [36, 48, 39, 52],
      bottom: [39, 48, 42, 52]
    }
  },
  leftArmOverlay: {
    w: 4, h: 12, d: 4,
    faces: {
      right:  [48, 52, 52, 64],
      front:  [52, 52, 56, 64],
      left:   [56, 52, 60, 64],
      back:   [60, 52, 64, 64],
      top:    [52, 48, 56, 52],
      bottom: [56, 48, 60, 52]
    }
  },
  leftArmOverlaySlim: {
    w: 3, h: 12, d: 4,
    faces: {
      right:  [48, 52, 52, 64],
      front:  [52, 52, 55, 64],
      left:   [55, 52, 59, 64],
      back:   [59, 52, 62, 64],
      top:    [52, 48, 55, 52],
      bottom: [55, 48, 58, 52]
    }
  },
  rightLeg: {
    w: 4, h: 12, d: 4,
    faces: {
      right:  [0, 20, 4, 32],
      front:  [4, 20, 8, 32],
      left:   [8, 20, 12, 32],
      back:   [12, 20, 16, 32],
      top:    [4, 16, 8, 20],
      bottom: [8, 16, 12, 20]
    }
  },
  rightLegOverlay: {
    w: 4, h: 12, d: 4,
    faces: {
      right:  [0, 36, 4, 48],
      front:  [4, 36, 8, 48],
      left:   [8, 36, 12, 48],
      back:   [12, 36, 16, 48],
      top:    [4, 32, 8, 36],
      bottom: [8, 32, 12, 36]
    }
  },
  leftLeg: {
    w: 4, h: 12, d: 4,
    faces: {
      right:  [16, 52, 20, 64],
      front:  [20, 52, 24, 64],
      left:   [24, 52, 28, 64],
      back:   [28, 52, 32, 64],
      top:    [20, 48, 24, 52],
      bottom: [24, 48, 28, 52]
    }
  },
  leftLegOverlay: {
    w: 4, h: 12, d: 4,
    faces: {
      right:  [0, 52, 4, 64],
      front:  [4, 52, 8, 64],
      left:   [8, 52, 12, 64],
      back:   [12, 52, 16, 64],
      top:    [4, 48, 8, 52],
      bottom: [8, 48, 12, 52]
    }
  },
  cape: {
    w: 10, h: 16, d: 1,
    faces: {
      right:  [0, 1, 1, 17],
      front:  [1, 1, 11, 17],
      left:   [11, 1, 12, 17],
      back:   [12, 1, 22, 17],
      top:    [1, 0, 11, 1],
      bottom: [11, 0, 21, 1]
    }
  }
};

/**
 * Resolves body part definition handling slim/Alex arm models.
 */
export function getPartDefinition(partName, isSlim = false) {
  if (isSlim) {
    if (partName === 'rightArm') return SKIN_PARTS.rightArmSlim;
    if (partName === 'rightArmOverlay') return SKIN_PARTS.rightArmOverlaySlim;
    if (partName === 'leftArm') return SKIN_PARTS.leftArmSlim;
    if (partName === 'leftArmOverlay') return SKIN_PARTS.leftArmOverlaySlim;
  }
  return SKIN_PARTS[partName] || null;
}

/**
 * Returns normalized UV coordinates [0..1] for all 6 faces of a part.
 * Three.js BoxGeometry face order:
 * 0: +X (character left)
 * 1: -X (character right)
 * 2: +Y (top)
 * 3: -Y (bottom)
 * 4: +Z (front)
 * 5: -Z (back)
 */
export function getSkinUVCoordinates(partName, isSlim = false, texW = 64, texH = 64) {
  const def = getPartDefinition(partName, isSlim);
  if (!def) throw new Error(`Unknown skin part: ${partName}`);

  const faceKeys = ['left', 'right', 'top', 'bottom', 'front', 'back'];
  const uvs = {};

  faceKeys.forEach((faceKey, faceIndex) => {
    const rect = def.faces[faceKey];
    if (!rect) return;
    const [x1, y1, x2, y2] = rect;
    const u0 = x1 / texW;
    const u1 = x2 / texW;
    const v0 = (texH - y2) / texH; // bottom in UV
    const v1 = (texH - y1) / texH; // top in UV

    uvs[faceKey] = {
      faceIndex,
      rect,
      u0, v0, u1, v1,
      // 4 vertices per face: v0(TL), v1(TR), v2(BL), v3(BR)
      vertices: [
        [u0, v1],
        [u1, v1],
        [u0, v0],
        [u1, v0]
      ]
    };
  });

  return uvs;
}

/**
 * Applies Minecraft 64x64 skin UV coordinates directly onto a Three.js BoxGeometry.
 */
export function applySkinUVsToGeometry(geometry, partName, isSlim = false, texW = 64, texH = 64) {
  const def = getPartDefinition(partName, isSlim);
  if (!def) throw new Error(`Unknown skin part: ${partName}`);

  const uvAttr = geometry.attributes.uv;
  if (!uvAttr) return;

  const faceKeys = ['left', 'right', 'top', 'bottom', 'front', 'back'];

  faceKeys.forEach((faceKey, faceIndex) => {
    const rect = def.faces[faceKey];
    if (!rect) return;
    const [x1, y1, x2, y2] = rect;
    const u0 = x1 / texW;
    const u1 = x2 / texW;
    const v0 = (texH - y2) / texH;
    const v1 = (texH - y1) / texH;

    const base = faceIndex * 8;
    // v0: Top-Left
    uvAttr.array[base + 0] = u0;
    uvAttr.array[base + 1] = v1;
    // v1: Top-Right
    uvAttr.array[base + 2] = u1;
    uvAttr.array[base + 3] = v1;
    // v2: Bottom-Left
    uvAttr.array[base + 4] = u0;
    uvAttr.array[base + 5] = v0;
    // v3: Bottom-Right
    uvAttr.array[base + 6] = u1;
    uvAttr.array[base + 7] = v0;
  });

  uvAttr.needsUpdate = true;
  return geometry;
}

/**
 * Factory to create a Three.js BoxGeometry configured with skin UVs.
 */
export function createVoxelBoxGeometry(width, height, depth, partName, isSlim = false, texW = 64, texH = 64) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  applySkinUVsToGeometry(geometry, partName, isSlim, texW, texH);
  return geometry;
}

/* ============================================================================
 * CANVAS & PIXEL BUFFER ABSTRACTION (Browser + Node/SSR Safe)
 * ============================================================================ */

/**
 * Minimal pure JS PNG generator (uses Node zlib if available, or lightweight deflate fallback)
 */
function createMinimalPng(w, h, rgba) {
  if (typeof Buffer !== 'undefined') {
    try {
      // Dynamic import / require zlib in Node
      const zlib = (typeof require === 'function') ? require('zlib') : null;
      if (zlib && zlib.deflateSync) {
        const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
        function crc32(buf) {
          let c = ~0;
          for (let i = 0; i < buf.length; i++) {
            c ^= buf[i];
            for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
          }
          return ~c;
        }
        function makeChunk(type, data) {
          const typeBuf = Buffer.from(type);
          const lenBuf = Buffer.alloc(4);
          lenBuf.writeUInt32BE(data.length, 0);
          const crcBuf = Buffer.alloc(4);
          const body = Buffer.concat([typeBuf, data]);
          crcBuf.writeInt32BE(crc32(body), 0);
          return Buffer.concat([lenBuf, body, crcBuf]);
        }
        const ihdr = Buffer.alloc(13);
        ihdr.writeUInt32BE(w, 0);
        ihdr.writeUInt32BE(h, 4);
        ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
        const ihdrChunk = makeChunk('IHDR', ihdr);
        const raw = Buffer.alloc(h * (w * 4 + 1));
        for (let y = 0; y < h; y++) {
          raw[y * (w * 4 + 1)] = 0;
          for (let x = 0; x < w * 4; x++) {
            raw[y * (w * 4 + 1) + 1 + x] = rgba[y * w * 4 + x];
          }
        }
        const compressed = zlib.deflateSync(raw);
        const idatChunk = makeChunk('IDAT', compressed);
        const iendChunk = makeChunk('IEND', Buffer.alloc(0));
        return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
      }
    } catch (_) {}
  }
  return null;
}

/**
 * Universal PixelCanvas that runs in Browser, SSR, and Node.js
 */
export class UniversalCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    if (typeof document !== 'undefined' && document.createElement) {
      this.domCanvas = document.createElement('canvas');
      this.domCanvas.width = width;
      this.domCanvas.height = height;
      this.ctx = this.domCanvas.getContext('2d', { willReadFrequently: true });
      this.ctx.imageSmoothingEnabled = false;
      this.isDom = true;
    } else {
      this.isDom = false;
      this.data = new Uint8ClampedArray(width * height * 4);
      this.ctx = null;
    }
  }

  setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    if (this.isDom) {
      this.ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
      this.ctx.fillRect(x, y, 1, 1);
    } else {
      const idx = (y * this.width + x) * 4;
      this.data[idx] = r;
      this.data[idx + 1] = g;
      this.data[idx + 2] = b;
      this.data[idx + 3] = a;
    }
  }

  fillRect(x, y, w, h, hexOrRgba) {
    const { r, g, b, a } = parseColor(hexOrRgba);
    if (this.isDom) {
      this.ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
      this.ctx.fillRect(x, y, w, h);
    } else {
      for (let cy = y; cy < y + h; cy++) {
        for (let cx = x; cx < x + w; cx++) {
          this.setPixel(cx, cy, r, g, b, a);
        }
      }
    }
  }

  clearRect(x, y, w, h) {
    if (this.isDom) {
      this.ctx.clearRect(x, y, w, h);
    } else {
      for (let cy = y; cy < y + h; cy++) {
        for (let cx = x; cx < x + w; cx++) {
          if (cx >= 0 && cx < this.width && cy >= 0 && cy < this.height) {
            const idx = (cy * this.width + cx) * 4;
            this.data[idx] = 0;
            this.data[idx + 1] = 0;
            this.data[idx + 2] = 0;
            this.data[idx + 3] = 0;
          }
        }
      }
    }
  }

  getImageData(x = 0, y = 0, w = this.width, h = this.height) {
    if (this.isDom) {
      return this.ctx.getImageData(x, y, w, h);
    }
    const out = new Uint8ClampedArray(w * h * 4);
    for (let cy = 0; cy < h; cy++) {
      for (let cx = 0; cx < w; cx++) {
        const srcIdx = ((y + cy) * this.width + (x + cx)) * 4;
        const dstIdx = (cy * w + cx) * 4;
        out[dstIdx] = this.data[srcIdx];
        out[dstIdx + 1] = this.data[srcIdx + 1];
        out[dstIdx + 2] = this.data[srcIdx + 2];
        out[dstIdx + 3] = this.data[srcIdx + 3];
      }
    }
    return { data: out, width: w, height: h };
  }

  toDataURL(format = 'image/png') {
    if (this.isDom) {
      return this.domCanvas.toDataURL(format);
    }
    const pngBuf = createMinimalPng(this.width, this.height, this.data);
    if (pngBuf) {
      return `data:image/png;base64,${pngBuf.toString('base64')}`;
    }
    return 'data:image/png;base64,';
  }

  getNativeCanvas() {
    return this.domCanvas || this;
  }
}

/**
 * Parses hex (#rgb, #rrggbb, #rrggbbaa) or rgb/rgba string into {r, g, b, a}
 */
export function parseColor(color) {
  if (typeof color === 'object' && color !== null && 'r' in color) {
    return { r: color.r, g: color.g, b: color.b, a: color.a ?? 255 };
  }
  if (!color || typeof color !== 'string') return { r: 0, g: 0, b: 0, a: 255 };

  let c = color.trim();
  if (c.startsWith('#')) {
    c = c.slice(1);
    if (c.length === 3) {
      return {
        r: parseInt(c[0] + c[0], 16),
        g: parseInt(c[1] + c[1], 16),
        b: parseInt(c[2] + c[2], 16),
        a: 255
      };
    }
    if (c.length === 6) {
      return {
        r: parseInt(c.slice(0, 2), 16),
        g: parseInt(c.slice(2, 4), 16),
        b: parseInt(c.slice(4, 6), 16),
        a: 255
      };
    }
    if (c.length === 8) {
      return {
        r: parseInt(c.slice(0, 2), 16),
        g: parseInt(c.slice(2, 4), 16),
        b: parseInt(c.slice(4, 6), 16),
        a: parseInt(c.slice(6, 8), 16)
      };
    }
  }

  const rgbaMatch = c.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (rgbaMatch) {
    return {
      r: Math.round(parseFloat(rgbaMatch[1])),
      g: Math.round(parseFloat(rgbaMatch[2])),
      b: Math.round(parseFloat(rgbaMatch[3])),
      a: rgbaMatch[4] !== undefined ? Math.round(parseFloat(rgbaMatch[4]) * (parseFloat(rgbaMatch[4]) <= 1 ? 255 : 1)) : 255
    };
  }

  return { r: 0, g: 0, b: 0, a: 255 };
}

/**
 * Creates a standard 64x64 skin canvas.
 */
export function createSkinCanvas() {
  return new UniversalCanvas(64, 64);
}

/* ============================================================================
 * PRESET SKINS SYNTHESIZER
 * ============================================================================ */

/**
 * Helper to paint a full box texture (6 faces) with base color and decorative details.
 */
function paintBox(c, partRects, colors) {
  const { base, highlight, shadow, accent } = colors;
  for (const faceKey in partRects.faces) {
    const [x1, y1, x2, y2] = partRects.faces[faceKey];
    c.fillRect(x1, y1, x2 - x1, y2 - y1, base);
    if (highlight) {
      // Top row highlight
      c.fillRect(x1, y1, x2 - x1, 1, highlight);
    }
    if (shadow) {
      // Bottom row shadow
      c.fillRect(x1, y2 - 1, x2 - x1, 1, shadow);
    }
  }
}

/**
 * Preset 1: STEM Lab Coat Steve
 * Classic Steve face, white lab coat, green chemical stains, pens & test tube in pocket,
 * blue work jeans, dark boots, cyan safety goggles on head overlay.
 */
export function generateSTEMSteveSkin(customOptions = {}) {
  const c = createSkinCanvas();

  const skinTone = customOptions.skinTone || '#c99778';
  const skinShadow = '#b68265';
  const hairColor = '#49311d';
  const hairDark = '#302013';
  const eyeWhite = '#ffffff';
  const eyeBlue = '#2c358f';
  const mouthColor = '#683d29';

  const coatWhite = '#f8fafc';
  const coatShadow = '#e2e8f0';
  const coatDark = '#cbd5e1';
  const shirtTeal = '#0d9488';

  const jeansBlue = '#1e3a8a';
  const jeansDark = '#172554';
  const bootsBrown = '#292524';
  const bootsDark = '#1c1917';

  // 1. Head
  paintBox(c, SKIN_PARTS.head, { base: skinTone, shadow: skinShadow });
  // Hair on head top, sides, back
  c.fillRect(8, 0, 8, 8, hairColor); // top
  c.fillRect(0, 8, 8, 3, hairColor); // right
  c.fillRect(16, 8, 8, 3, hairColor); // left
  c.fillRect(24, 8, 8, 8, hairColor); // back
  c.fillRect(25, 12, 6, 4, hairDark); // back hair detail
  // Front face (8..16, 8..16)
  c.fillRect(8, 8, 8, 2, hairColor); // bangs
  c.fillRect(9, 10, 1, 1, hairColor);
  c.fillRect(14, 10, 1, 1, hairColor);
  // Eyes
  c.fillRect(9, 11, 2, 1, eyeWhite);
  c.fillRect(10, 11, 1, 1, eyeBlue);
  c.fillRect(13, 11, 2, 1, eyeWhite);
  c.fillRect(13, 11, 1, 1, eyeBlue);
  // Nose & mouth/beard
  c.fillRect(11, 12, 2, 1, skinShadow);
  c.fillRect(10, 13, 4, 1, mouthColor);
  c.fillRect(11, 13, 2, 1, '#9b5b3a');

  // 2. Head Overlay: Safety Goggles!
  // Goggle frames (gray) + lenses (cyan translucent) + strap (dark slate)
  // Front face overlay (40..48, 8..16)
  c.fillRect(40, 10, 8, 3, '#374151'); // frame
  c.fillRect(41, 11, 2, 2, '#00f2fe'); // left cyan lens
  c.fillRect(45, 11, 2, 2, '#00f2fe'); // right cyan lens
  c.fillRect(41, 11, 1, 1, '#ffffff'); // lens shine
  c.fillRect(45, 11, 1, 1, '#ffffff'); // lens shine
  // Strap around sides and back
  c.fillRect(32, 11, 8, 2, '#1f2937'); // right side strap
  c.fillRect(48, 11, 8, 2, '#1f2937'); // left side strap
  c.fillRect(56, 11, 8, 2, '#1f2937'); // back strap
  c.fillRect(59, 11, 2, 2, '#475569'); // strap adjustment buckle

  // 3. Body: Lab Coat over teal undershirt
  paintBox(c, SKIN_PARTS.body, { base: coatWhite, shadow: coatShadow });
  // Front chest (20..28, 20..32)
  c.fillRect(23, 20, 2, 3, shirtTeal); // V-neck teal undershirt
  c.fillRect(23, 23, 2, 9, coatShadow); // Center coat opening/zipper
  c.fillRect(24, 25, 1, 1, '#94a3b8'); // Button 1
  c.fillRect(24, 28, 1, 1, '#94a3b8'); // Button 2
  // Breast pocket with pens & glowing green chemical vial
  c.fillRect(21, 24, 2, 2, coatDark);
  c.fillRect(21, 23, 1, 1, '#ef4444'); // red pen
  c.fillRect(22, 23, 1, 1, '#3b82f6'); // blue pen
  c.fillRect(21, 25, 1, 1, '#10b981'); // glowing mini vial
  // Neon chemical splatter stains on lower hem
  c.fillRect(26, 29, 2, 2, '#22c55e'); // green splash
  c.fillRect(27, 30, 1, 1, '#86efac');
  c.fillRect(22, 30, 1, 1, '#a855f7'); // purple splash
  // Back of lab coat (32..40, 20..32)
  c.fillRect(35, 22, 2, 10, coatShadow); // back pleat
  c.fillRect(33, 25, 6, 1, coatDark); // waist belt line

  // 4. Body Overlay: Lab Coat Bottom Flaps & STEM ID Lanyard
  // Front overlay (20..28, 36..48)
  c.fillRect(22, 36, 1, 4, '#0284c7'); // blue lanyard strap left
  c.fillRect(25, 36, 1, 4, '#0284c7'); // blue lanyard strap right
  c.fillRect(25, 40, 2, 3, '#fef08a'); // ID card badge
  c.fillRect(25, 40, 2, 1, '#3b82f6'); // ID photo stripe
  c.fillRect(20, 44, 8, 4, coatWhite); // lower coat flaps
  c.fillRect(21, 44, 2, 2, coatDark); // left hip pocket
  c.fillRect(25, 44, 2, 2, coatDark); // right hip pocket
  c.fillRect(32, 44, 8, 4, coatWhite); // back coat flaps

  // 5. Right Arm (Steve 4px): White sleeve + cyan safety gloves
  paintBox(c, SKIN_PARTS.rightArm, { base: coatWhite, shadow: coatShadow });
  // Gloves on hand (y: 28..32)
  c.fillRect(40, 28, 16, 4, '#06b6d4'); // cyan nitrile glove
  c.fillRect(40, 31, 16, 1, '#0891b2'); // glove shadow

  // 6. Left Arm: White sleeve + cyan safety gloves
  paintBox(c, SKIN_PARTS.leftArm, { base: coatWhite, shadow: coatShadow });
  c.fillRect(32, 60, 16, 4, '#06b6d4');
  c.fillRect(32, 63, 16, 1, '#0891b2');

  // Arm Overlays: Lab coat cuffs
  c.fillRect(40, 42, 16, 2, coatWhite);
  c.fillRect(48, 58, 16, 2, coatWhite);

  // 7. Right Leg: Dark blue jeans + dark boots
  paintBox(c, SKIN_PARTS.rightLeg, { base: jeansBlue, shadow: jeansDark });
  // Boots (y: 28..32)
  c.fillRect(0, 28, 16, 4, bootsBrown);
  c.fillRect(0, 31, 16, 1, bootsDark);

  // 8. Left Leg: Dark blue jeans + dark boots
  paintBox(c, SKIN_PARTS.leftLeg, { base: jeansBlue, shadow: jeansDark });
  c.fillRect(16, 60, 16, 4, bootsBrown);
  c.fillRect(16, 63, 16, 1, bootsDark);

  return c;
}

/**
 * Preset 2: Cyber Alex
 * Alex slim arm model, pale cyborg skin, neon orange hair, glowing cyan ocular implant,
 * holographic HUD visor, carbon nano-armor with glowing energy core & circuit traces.
 */
export function generateCyberAlexSkin(customOptions = {}) {
  const c = createSkinCanvas();

  const skinTone = customOptions.skinTone || '#e2e8f0';
  const skinShadow = '#cbd5e1';
  const hairOrange = '#ea580c';
  const hairHighlight = '#f97316';
  const hairDark = '#c2410c';

  const armorSlate = '#0f172a';
  const armorDark = '#020617';
  const armorMid = '#1e293b';
  const cyanGlow = '#00f2fe';
  const cyanBright = '#67e8f9';
  const titaniumSilver = '#94a3b8';

  // 1. Head
  paintBox(c, SKIN_PARTS.head, { base: skinTone, shadow: skinShadow });
  // Orange Hair
  c.fillRect(8, 0, 8, 8, hairOrange);
  c.fillRect(9, 1, 6, 2, hairHighlight);
  c.fillRect(0, 8, 8, 4, hairOrange);
  c.fillRect(16, 8, 8, 4, hairOrange);
  c.fillRect(24, 8, 8, 8, hairOrange);
  c.fillRect(25, 11, 6, 4, hairDark);
  // Face (8..16, 8..16)
  c.fillRect(8, 8, 8, 2, hairOrange);
  c.fillRect(8, 10, 2, 2, hairOrange); // left sideburn
  c.fillRect(14, 10, 2, 1, hairOrange);
  // Left eye (organic emerald)
  c.fillRect(9, 11, 2, 1, '#ffffff');
  c.fillRect(9, 11, 1, 1, '#10b981');
  // Right eye (cybernetic ocular implant with glowing cyan pupil!)
  c.fillRect(13, 11, 2, 1, '#0f172a');
  c.fillRect(13, 11, 1, 1, cyanGlow);
  // Cybernetic face circuitry
  c.fillRect(14, 12, 1, 2, cyanGlow);
  c.fillRect(11, 13, 2, 1, '#f43f5e'); // lips

  // 2. Head Overlay: Cyber Visor & Headset
  // Front HUD visor (40..48, 8..16)
  c.fillRect(40, 10, 8, 2, 'rgba(0, 242, 254, 0.4)');
  c.fillRect(43, 10, 3, 1, cyanBright); // holographic targeting reticle
  c.fillRect(44, 11, 1, 1, cyanGlow);
  // Cyber headset on left ear (48..56, 8..16)
  c.fillRect(48, 11, 3, 3, armorMid);
  c.fillRect(49, 12, 1, 1, cyanGlow);
  c.fillRect(47, 13, 2, 1, titaniumSilver); // mic arm

  // 3. Body: Carbon Nano-Suit & Arc Reactor
  paintBox(c, SKIN_PARTS.body, { base: armorSlate, shadow: armorDark });
  // Center Arc Reactor on front chest (20..28, 20..32)
  c.fillRect(23, 23, 2, 2, cyanBright);
  c.fillRect(22, 23, 4, 1, cyanGlow);
  c.fillRect(23, 22, 2, 4, cyanGlow);
  c.fillRect(23, 23, 2, 2, '#ffffff'); // core center pure white hot
  // Circuit lines down chest
  c.fillRect(21, 26, 1, 4, cyanGlow);
  c.fillRect(26, 26, 1, 4, cyanGlow);
  c.fillRect(22, 29, 4, 1, armorMid);
  // Back spine energy conduit (32..40, 20..32)
  c.fillRect(35, 21, 2, 10, cyanGlow);
  c.fillRect(35, 23, 2, 2, cyanBright);
  c.fillRect(35, 27, 2, 2, cyanBright);

  // 4. Body Overlay: Armor Plates & Shoulder Pauldrons
  c.fillRect(19, 36, 10, 2, armorMid); // collar armor
  c.fillRect(20, 38, 2, 3, titaniumSilver); // left pectoral plate
  c.fillRect(26, 38, 2, 3, titaniumSilver); // right pectoral plate
  c.fillRect(21, 44, 6, 2, armorMid); // tactical belt

  // 5. Right Arm (Alex 3px slim!): Titanium Prosthetic
  paintBox(c, SKIN_PARTS.rightArmSlim, { base: titaniumSilver, shadow: '#64748b' });
  // Glowing cyan power conduits
  c.fillRect(41, 22, 1, 8, cyanGlow);
  c.fillRect(45, 24, 2, 1, cyanGlow);
  c.fillRect(40, 29, 14, 3, armorDark); // hand

  // 6. Left Arm (Alex 3px slim): Tech fabric with holographic projector
  paintBox(c, SKIN_PARTS.leftArmSlim, { base: armorSlate, shadow: armorDark });
  c.fillRect(33, 56, 1, 4, cyanGlow);
  c.fillRect(32, 60, 14, 4, armorMid); // fingerless glove

  // Arm Overlays
  c.fillRect(48, 56, 14, 2, cyanGlow); // holographic wrist cuff

  // 7. Right Leg: Tech runners with thruster vents
  paintBox(c, SKIN_PARTS.rightLeg, { base: armorMid, shadow: armorDark });
  c.fillRect(4, 24, 1, 4, cyanGlow); // calf energy line
  c.fillRect(0, 29, 16, 3, armorDark); // magnetic boot
  c.fillRect(4, 31, 4, 1, cyanGlow); // sole booster

  // 8. Left Leg: Tech runners with thruster vents
  paintBox(c, SKIN_PARTS.leftLeg, { base: armorMid, shadow: armorDark });
  c.fillRect(20, 56, 1, 4, cyanGlow);
  c.fillRect(16, 61, 16, 3, armorDark);
  c.fillRect(20, 63, 4, 1, cyanGlow);

  return c;
}

/**
 * Preset 3: Biohazard Hazmat
 * Bright yellow protective suit, black caution stripes, industrial gas mask / respirator
 * on head overlay with amber visor, and prominent Biohazard Trefoil logo on back.
 */
export function generateBiohazardHazmatSkin(customOptions = {}) {
  const c = createSkinCanvas();

  const yellowSuit = customOptions.suitColor || '#facc15';
  const yellowShadow = '#eab308';
  const yellowDark = '#ca8a04';
  const blackHazard = '#09090b';
  const blackRubber = '#18181b';
  const visorAmber = '#f97316';
  const visorGlow = '#fb923c';
  const canisterGray = '#334155';

  // 1. Head: Yellow hazmat hood
  paintBox(c, SKIN_PARTS.head, { base: yellowSuit, shadow: yellowShadow });
  // Black rubber seal ring around neck
  c.fillRect(16, 6, 8, 2, blackRubber); // neck bottom

  // 2. Head Overlay: Full-Face Gas Mask / Respirator
  // Amber tinted faceplate visor (40..48, 8..16)
  c.fillRect(41, 9, 6, 4, visorAmber);
  c.fillRect(42, 9, 4, 1, visorGlow);
  c.fillRect(42, 10, 2, 1, '#ffffff'); // reflective glare
  // Dual cheek filtration canisters
  c.fillRect(40, 13, 2, 2, canisterGray);
  c.fillRect(46, 13, 2, 2, canisterGray);
  c.fillRect(43, 13, 2, 2, blackRubber); // speech diaphragm valve
  // Mask straps around sides & back
  c.fillRect(32, 11, 8, 2, blackRubber);
  c.fillRect(48, 11, 8, 2, blackRubber);
  c.fillRect(56, 11, 8, 2, blackRubber);

  // 3. Body: Yellow Containment Suit with Biohazard Trefoil on Back
  paintBox(c, SKIN_PARTS.body, { base: yellowSuit, shadow: yellowShadow });
  // Front chest: Heavy-duty central zipper
  c.fillRect(23, 20, 2, 12, blackRubber);
  c.fillRect(24, 21, 1, 10, '#e2e8f0'); // silver zipper teeth
  // Caution stripes on shoulders
  c.fillRect(20, 20, 2, 2, blackHazard);
  c.fillRect(26, 20, 2, 2, blackHazard);

  // BACK: BIOHAZARD TREFOIL LOGO (32..40, 20..32)
  // Bold black 3-circle biohazard symbol
  c.fillRect(34, 23, 4, 1, blackHazard); // top circle arc
  c.fillRect(35, 22, 2, 1, blackHazard);
  c.fillRect(33, 26, 1, 3, blackHazard); // bottom-left arc
  c.fillRect(34, 28, 2, 1, blackHazard);
  c.fillRect(38, 26, 1, 3, blackHazard); // bottom-right arc
  c.fillRect(36, 28, 2, 1, blackHazard);
  c.fillRect(35, 25, 2, 2, blackHazard); // center hub

  // 4. Body Overlay: Oxygen Tank Harness & Pressure Gauge
  c.fillRect(21, 37, 1, 9, blackRubber); // left shoulder strap
  c.fillRect(26, 37, 1, 9, blackRubber); // right shoulder strap
  c.fillRect(21, 41, 6, 1, blackRubber); // chest cross strap
  // Round pressure gauge on left chest
  c.fillRect(21, 39, 2, 2, '#f8fafc');
  c.fillRect(21, 39, 1, 1, '#ef4444'); // red indicator needle

  // 5. Right Arm: Yellow sleeve + heavy black neoprene chemical gloves
  paintBox(c, SKIN_PARTS.rightArm, { base: yellowSuit, shadow: yellowShadow });
  c.fillRect(40, 27, 16, 5, blackRubber);
  c.fillRect(40, 27, 16, 1, blackHazard);

  // 6. Left Arm: Yellow sleeve + heavy black chemical gloves
  paintBox(c, SKIN_PARTS.leftArm, { base: yellowSuit, shadow: yellowShadow });
  c.fillRect(32, 59, 16, 5, blackRubber);
  c.fillRect(32, 59, 16, 1, blackHazard);

  // 7. Right Leg: Yellow hazmat pants + heavy rubber boots
  paintBox(c, SKIN_PARTS.rightLeg, { base: yellowSuit, shadow: yellowShadow });
  c.fillRect(4, 24, 4, 2, blackRubber); // reinforced knee pad
  c.fillRect(0, 28, 16, 4, blackRubber); // boot
  c.fillRect(0, 31, 16, 1, blackHazard); // tread

  // 8. Left Leg: Yellow hazmat pants + heavy rubber boots
  paintBox(c, SKIN_PARTS.leftLeg, { base: yellowSuit, shadow: yellowShadow });
  c.fillRect(20, 56, 4, 2, blackRubber);
  c.fillRect(16, 60, 16, 4, blackRubber);
  c.fillRect(16, 63, 16, 1, blackHazard);

  return c;
}

/**
 * Preset 4: Quantum Physicist
 * Cosmic void purple suit, silver quantum streak hair, glowing violet neuro-glasses,
 * golden Bohr atom on chest, and chalkboard quantum equations on back.
 */
export function generateQuantumPhysicistSkin(customOptions = {}) {
  const c = createSkinCanvas();

  const skinTone = customOptions.skinTone || '#fed7aa';
  const skinShadow = '#fcd34d';
  const hairDark = '#1e1b4b';
  const hairSilver = '#f8fafc';
  const eyeViolet = '#8b5cf6';

  const voidNavy = '#0f172a';
  const cosmicPurple = '#3b0764';
  const purpleMid = '#581c87';
  const purpleGlow = '#a855f7';
  const violetLight = '#c084fc';
  const atomGold = '#f59e0b';
  const chalkMint = '#6ee7b7';

  // 1. Head
  paintBox(c, SKIN_PARTS.head, { base: skinTone, shadow: skinShadow });
  // Dark hair with silver quantum streak
  c.fillRect(8, 0, 8, 8, hairDark);
  c.fillRect(12, 0, 2, 8, hairSilver); // silver quantum streak across top!
  c.fillRect(0, 8, 8, 4, hairDark);
  c.fillRect(16, 8, 8, 4, hairDark);
  c.fillRect(24, 8, 8, 8, hairDark);
  c.fillRect(28, 8, 2, 6, hairSilver); // streak down back
  // Face
  c.fillRect(8, 8, 8, 2, hairDark);
  c.fillRect(12, 8, 2, 2, hairSilver); // silver bangs
  // Violet eyes
  c.fillRect(9, 11, 2, 1, '#ffffff');
  c.fillRect(10, 11, 1, 1, eyeViolet);
  c.fillRect(13, 11, 2, 1, '#ffffff');
  c.fillRect(13, 11, 1, 1, eyeViolet);
  c.fillRect(11, 13, 2, 1, '#e11d48'); // lips

  // 2. Head Overlay: Quantum Neuro-AR Glasses
  c.fillRect(40, 10, 8, 2, 'rgba(168, 85, 247, 0.4)'); // violet AR visor
  c.fillRect(41, 10, 2, 1, violetLight);
  c.fillRect(45, 10, 2, 1, violetLight);
  c.fillRect(32, 10, 8, 1, purpleGlow); // temple frame
  c.fillRect(48, 10, 8, 1, purpleGlow);

  // 3. Body: Cosmic Suit with Golden Bohr Atom & Chalkboard Equations
  paintBox(c, SKIN_PARTS.body, { base: cosmicPurple, shadow: voidNavy });
  // Quantum starry speckles
  c.fillRect(21, 22, 1, 1, violetLight);
  c.fillRect(26, 25, 1, 1, violetLight);
  c.fillRect(22, 29, 1, 1, purpleGlow);

  // Center Front: Golden Rutherford-Bohr Atom Model (20..28, 20..32)
  c.fillRect(23, 24, 2, 2, '#ffffff'); // atomic nucleus hot white
  c.fillRect(22, 24, 4, 2, atomGold);
  c.fillRect(23, 23, 2, 4, atomGold);
  // Elliptical electron orbit rings
  c.fillRect(21, 23, 1, 1, atomGold);
  c.fillRect(26, 26, 1, 1, atomGold);
  c.fillRect(21, 26, 1, 1, atomGold);
  c.fillRect(26, 23, 1, 1, atomGold);

  // BACK: CHALKBOARD QUANTUM EQUATIONS ("Ψ", "E=mc²") (32..40, 20..32)
  // Greek letter Psi (Ψ)
  c.fillRect(34, 23, 1, 3, chalkMint);
  c.fillRect(36, 23, 1, 3, chalkMint);
  c.fillRect(34, 25, 3, 1, chalkMint);
  c.fillRect(35, 23, 1, 5, chalkMint); // center stem
  // E=mc²
  c.fillRect(33, 29, 6, 1, chalkMint); // equation underline
  c.fillRect(34, 28, 1, 1, chalkMint);
  c.fillRect(36, 28, 1, 1, chalkMint);

  // 4. Body Overlay: Quantum Dimensional Shroud
  c.fillRect(20, 36, 8, 2, purpleMid);
  c.fillRect(20, 44, 8, 4, purpleMid);
  c.fillRect(23, 44, 2, 4, purpleGlow);

  // 5. Right Arm: Dark sleeve with glowing quantum wrist rings
  paintBox(c, SKIN_PARTS.rightArmSlim, { base: cosmicPurple, shadow: voidNavy });
  c.fillRect(40, 28, 14, 1, violetLight); // glowing ring
  c.fillRect(40, 30, 14, 2, skinTone); // fingers

  // 6. Left Arm: Dark sleeve with glowing quantum wrist rings
  paintBox(c, SKIN_PARTS.leftArmSlim, { base: cosmicPurple, shadow: voidNavy });
  c.fillRect(32, 60, 14, 1, violetLight);
  c.fillRect(32, 62, 14, 2, skinTone);

  // 7. Right Leg: Void navy trousers + levitation boots
  paintBox(c, SKIN_PARTS.rightLeg, { base: voidNavy, shadow: '#020617' });
  c.fillRect(4, 26, 1, 3, purpleGlow);
  c.fillRect(0, 29, 16, 3, cosmicPurple);
  c.fillRect(4, 31, 4, 1, violetLight); // anti-gravity sole glow

  // 8. Left Leg: Void navy trousers + levitation boots
  paintBox(c, SKIN_PARTS.leftLeg, { base: voidNavy, shadow: '#020617' });
  c.fillRect(20, 58, 1, 3, purpleGlow);
  c.fillRect(16, 61, 16, 3, cosmicPurple);
  c.fillRect(20, 63, 4, 1, violetLight);

  return c;
}

/**
 * Universal preset dispatcher.
 */
export function generatePresetSkin(presetKey, options = {}) {
  const key = (presetKey || '').toLowerCase().replace(/[\s-_]/g, '');
  if (key.includes('steve') || key.includes('labcoat') || key.includes('stem')) {
    return generateSTEMSteveSkin(options);
  }
  if (key.includes('alex') || key.includes('cyber')) {
    return generateCyberAlexSkin(options);
  }
  if (key.includes('bio') || key.includes('hazmat') || key.includes('hazard')) {
    return generateBiohazardHazmatSkin(options);
  }
  if (key.includes('quantum') || key.includes('physic')) {
    return generateQuantumPhysicistSkin(options);
  }
  // Default to STEM Steve
  return generateSTEMSteveSkin(options);
}

/* ============================================================================
 * CAPE TEXTURE SYNTHESIZER
 * ============================================================================ */

/**
 * Generates a 64x32 cape texture.
 * Types: 'stem', 'cyber', 'hazard', 'quantum'
 */
export function generateCapeTexture(capeType = 'stem') {
  const c = new UniversalCanvas(64, 32);
  const type = (capeType || 'stem').toLowerCase();

  if (type.includes('dragon') || type.includes('elo')) {
    // ELO Gold Dragon Cape
    c.fillRect(0, 0, 64, 32, '#b45309');
    c.fillRect(1, 1, 10, 16, '#d97706');
    c.fillRect(12, 1, 10, 16, '#78350f');
    // Golden Dragon Wings & Crown on back (12..22, 1..17)
    c.fillRect(14, 3, 6, 2, '#fde68a'); // Crown
    c.fillRect(16, 2, 2, 1, '#f59e0b');
    // Wing shapes
    c.fillRect(13, 6, 8, 2, '#fbbf24');
    c.fillRect(14, 8, 6, 3, '#f59e0b');
    c.fillRect(15, 11, 4, 3, '#d97706');
    c.fillRect(16, 14, 2, 2, '#fbbf24');
  } else if (type.includes('matrix') || type.includes('cyber')) {
    // Dark matrix grid with green/cyan code rain
    c.fillRect(0, 0, 64, 32, '#052e16');
    c.fillRect(1, 1, 10, 16, '#022c22');
    c.fillRect(12, 1, 10, 16, '#022c22');
    // Green binary digital rain on back (12..22, 1..17)
    const codeCols = [
      [13, 2, 1, 4, '#4ade80'],
      [15, 4, 1, 6, '#22c55e'],
      [17, 1, 1, 8, '#86efac'],
      [19, 5, 1, 7, '#16a34a'],
      [21, 3, 1, 5, '#4ade80'],
      [14, 9, 1, 5, '#15803d'],
      [18, 10, 1, 6, '#86efac']
    ];
    codeCols.forEach(([x, y, w, h, col]) => {
      c.fillRect(x, y, w, h, col);
    });
  } else if (type.includes('aurora') || type.includes('quantum')) {
    // Deep cosmic purple to cyan aurora waves
    c.fillRect(0, 0, 64, 32, '#1e1b4b');
    c.fillRect(1, 1, 10, 16, '#0f172a');
    c.fillRect(12, 1, 10, 16, '#0f172a');
    // Aurora waves on back (12..22, 1..17)
    c.fillRect(12, 4, 10, 2, '#06b6d4');
    c.fillRect(12, 6, 10, 3, '#3b82f6');
    c.fillRect(12, 9, 10, 3, '#8b5cf6');
    c.fillRect(12, 12, 10, 2, '#d946ef');
    // Shimmer sparkles
    c.fillRect(14, 5, 1, 1, '#ffffff');
    c.fillRect(19, 8, 1, 1, '#ffffff');
    c.fillRect(16, 11, 1, 1, '#ffffff');
  } else if (type.includes('creeper') || type.includes('migrator')) {
    // Classic Minecraft Migrator / Creeper Cape
    c.fillRect(0, 0, 64, 32, '#991b1b');
    c.fillRect(1, 1, 10, 16, '#b91c1c');
    c.fillRect(12, 1, 10, 16, '#b91c1c');
    // Dark Creeper Face on back (12..22, 1..17)
    c.fillRect(14, 5, 2, 2, '#450a0a'); // Left eye
    c.fillRect(18, 5, 2, 2, '#450a0a'); // Right eye
    c.fillRect(16, 7, 2, 3, '#450a0a'); // Nose
    c.fillRect(15, 9, 4, 3, '#450a0a'); // Mouth center
    c.fillRect(14, 11, 2, 3, '#450a0a'); // Mouth left
    c.fillRect(18, 11, 2, 3, '#450a0a'); // Mouth right
  } else if (type.includes('hazard')) {
    // Yellow hazard caution stripes
    c.fillRect(0, 0, 64, 32, '#facc15');
    c.fillRect(1, 1, 10, 16, '#eab308');
    c.fillRect(12, 1, 10, 16, '#eab308');
    for (let i = 0; i < 16; i += 4) {
      c.fillRect(12, 1 + i, 10, 2, '#09090b');
    }
  } else {
    // Default STEM Cape: Gradient cyan/blue with golden atom
    c.fillRect(0, 0, 64, 32, '#0369a1');
    c.fillRect(1, 1, 10, 16, '#0284c7');
    c.fillRect(12, 1, 10, 16, '#0284c7');
    // Golden atom on back (12..22, 1..17)
    c.fillRect(16, 7, 2, 2, '#f59e0b'); // center nucleus
    c.fillRect(15, 6, 4, 1, '#fde68a'); // orbit
    c.fillRect(15, 9, 4, 1, '#fde68a');
    c.fillRect(14, 7, 1, 2, '#fde68a');
    c.fillRect(19, 7, 1, 2, '#fde68a');
  }

  return c;
}

/* ============================================================================
 * SKIN IMPORTER & EXPORTER
 * ============================================================================ */

/**
 * Converts a legacy 64x32 Minecraft skin to a modern 64x64 skin.
 */
export function convertLegacySkin(legacyCanvasOrImage) {
  const c = createSkinCanvas();
  const src = legacyCanvasOrImage;

  if (c.isDom) {
    // Draw top 64x32
    c.ctx.drawImage(src, 0, 0, 64, 32);
    // Copy Right Arm (40..56, 16..32) to Left Arm (32..48, 48..64)
    c.ctx.save();
    c.ctx.drawImage(src, 40, 16, 16, 16, 32, 48, 16, 16);
    // Copy Right Leg (0..16, 16..32) to Left Leg (16..32, 48..64)
    c.ctx.drawImage(src, 0, 16, 16, 16, 16, 48, 16, 16);
    c.ctx.restore();
  } else {
    // Buffer-based copy
    const imgData = src.getImageData ? src.getImageData(0, 0, 64, 32) : { data: src.data };
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 64; x++) {
        const idx = (y * 64 + x) * 4;
        c.setPixel(x, y, imgData.data[idx], imgData.data[idx + 1], imgData.data[idx + 2], imgData.data[idx + 3]);
      }
    }
    // Copy arm & leg
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const armIdx = ((16 + y) * 64 + (40 + x)) * 4;
        c.setPixel(32 + x, 48 + y, imgData.data[armIdx], imgData.data[armIdx + 1], imgData.data[armIdx + 2], imgData.data[armIdx + 3]);
        const legIdx = ((16 + y) * 64 + x) * 4;
        c.setPixel(16 + x, 48 + y, imgData.data[legIdx], imgData.data[legIdx + 1], imgData.data[legIdx + 2], imgData.data[legIdx + 3]);
      }
    }
  }

  return c;
}

/**
 * Checks if skin is an Alex (3px arm) model by testing transparency of outer arm pixel column.
 */
export function isAlexSkin(canvasOrImageData) {
  let imgData = null;
  if (canvasOrImageData && canvasOrImageData.getImageData) {
    imgData = canvasOrImageData.getImageData(54, 20, 2, 12);
  } else if (canvasOrImageData && canvasOrImageData.data) {
    imgData = canvasOrImageData;
  }
  if (!imgData || !imgData.data) return false;

  // In Alex skins, column x=54..55 of right arm (y=20..32) is fully transparent
  let transparentCount = 0;
  for (let i = 3; i < imgData.data.length; i += 4) {
    if (imgData.data[i] === 0) transparentCount++;
  }
  return transparentCount > (imgData.data.length / 4) * 0.8;
}

/**
 * Loads a skin from various sources:
 * - Preset string ('stem_steve', 'cyber_alex', etc.)
 * - Data URL
 * - File / Blob
 * - Image URL
 */
export async function loadSkin(source) {
  if (!source) {
    return {
      canvas: generateSTEMSteveSkin(),
      isSlim: false,
      modelType: MODEL_TYPES.STEVE
    };
  }

  // Check preset string
  if (typeof source === 'string' && !source.startsWith('data:') && !source.startsWith('http') && !source.startsWith('/')) {
    const isSlim = source.toLowerCase().includes('alex');
    return {
      canvas: generatePresetSkin(source),
      isSlim,
      modelType: isSlim ? MODEL_TYPES.ALEX : MODEL_TYPES.STEVE
    };
  }

  // Browser Image loading
  if (typeof Image !== 'undefined') {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        let canvas = new UniversalCanvas(64, 64);
        if (img.height === 32) {
          canvas = convertLegacySkin(img);
        } else {
          canvas.ctx.drawImage(img, 0, 0, 64, 64);
        }
        const slim = isAlexSkin(canvas);
        resolve({
          canvas,
          isSlim: slim,
          modelType: slim ? MODEL_TYPES.ALEX : MODEL_TYPES.STEVE
        });
      };

      img.onerror = (err) => reject(new Error(`Failed to load skin image: ${err?.message || 'Network error'}`));

      if (typeof File !== 'undefined' && source instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target.result; };
        reader.onerror = reject;
        reader.readAsDataURL(source);
      } else if (typeof Blob !== 'undefined' && source instanceof Blob) {
        img.src = URL.createObjectURL(source);
      } else {
        img.src = source;
      }
    });
  }

  // Fallback for SSR / Node
  const fallback = generatePresetSkin(source);
  return {
    canvas: fallback,
    isSlim: false,
    modelType: MODEL_TYPES.STEVE
  };
}

/**
 * Exports canvas to PNG Data URL.
 */
export function exportSkin(canvas, format = 'image/png') {
  if (!canvas) return '';
  return canvas.toDataURL ? canvas.toDataURL(format) : '';
}

/**
 * Triggers a browser download of the skin PNG.
 */
export function downloadSkin(canvasOrDataUrl, filename = 'minecraft-stem-skin.png') {
  if (typeof document === 'undefined') return;
  const dataUrl = typeof canvasOrDataUrl === 'string' ? canvasOrDataUrl : exportSkin(canvasOrDataUrl);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ============================================================================
 * HIGH-SPEED 2D ISOMETRIC HEAD AVATAR SNAPSHOT (< 1ms)
 * ============================================================================
 * Renders an iconic 3D isometric cube avatar of the head + overlay layer (hair/goggles)
 * with authentic directional lighting (top bright, side shaded).
 * Ideal for headers, leaderboards, profile avatars, and ranking lists.
 * ============================================================================ */

export function generateIsometricHeadAvatar(skinSource, options = {}) {
  const size = options.size || 128;
  const showOverlay = options.showOverlay !== false;
  const lighting = options.lighting !== false;
  const format = options.format || 'dataUrl'; // 'dataUrl' | 'canvas'

  // Resolve source canvas
  let skinCanvas = null;
  if (skinSource && typeof skinSource.getImageData === 'function') {
    skinCanvas = skinSource;
  } else if (skinSource && typeof skinSource.getContext === 'function') {
    const ctx = skinSource.getContext('2d');
    skinCanvas = {
      isDom: true,
      ctx,
      getImageData: (x, y, w, h) => ctx.getImageData(x, y, w, h)
    };
  } else if (typeof skinSource === 'string' && !skinSource.startsWith('data:') && !skinSource.startsWith('http')) {
    skinCanvas = generatePresetSkin(skinSource);
  } else {
    skinCanvas = generatePresetSkin('stem_steve');
  }

  const out = new UniversalCanvas(size, size);

  // Geometric Isometric Constants
  // dx:dy ratio = 0.866 : 0.5 (30 degrees isometric angle)
  // Total span for 8 units is: 16 * dx wide, 16 * dy + 8 * scaleY high
  const S = (size * 0.84) / 16;
  const dx = 0.866025 * S;
  const dy = 0.5 * S;
  const scaleY = 1.0 * S;
  const cx = size / 2;
  const cy = (size - (16 * dy + 8 * scaleY)) / 2 + 16 * dy;

  // Extract pixel data from 64x64 skin
  const skinImgData = skinCanvas.getImageData(0, 0, 64, 64);
  const data = skinImgData.data;

  function getPixel(x, y) {
    if (x < 0 || x >= 64 || y < 0 || y >= 64) return { r: 0, g: 0, b: 0, a: 0 };
    const idx = (y * 64 + x) * 4;
    return {
      r: data[idx],
      g: data[idx + 1],
      b: data[idx + 2],
      a: data[idx + 3]
    };
  }

  if (out.isDom) {
    const ctx = out.ctx;
    ctx.imageSmoothingEnabled = false;

    // Helper to draw a sheared face using affine transform
    function drawShearedFace(faceRect, transformMatrix, brightnessMul = 1.0) {
      const [fx, fy, fw, fh] = faceRect;
      // Create temporary 8x8 canvas for the face
      const faceCanvas = document.createElement('canvas');
      faceCanvas.width = fw;
      faceCanvas.height = fh;
      const fCtx = faceCanvas.getContext('2d');
      fCtx.imageSmoothingEnabled = false;

      // Extract face slice
      const fData = skinCanvas.getImageData(fx, fy, fw, fh);
      fCtx.putImageData(fData, 0, 0);

      // Apply directional lighting
      if (lighting && brightnessMul !== 1.0) {
        fCtx.save();
        if (brightnessMul > 1.0) {
          fCtx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, brightnessMul - 1.0)})`;
          fCtx.globalCompositeOperation = 'lighter';
        } else {
          fCtx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, 1.0 - brightnessMul)})`;
          fCtx.globalCompositeOperation = 'source-atop';
        }
        fCtx.fillRect(0, 0, fw, fh);
        fCtx.restore();
      }

      ctx.save();
      const [a, b, c, d, e, f] = transformMatrix;
      ctx.setTransform(a, b, c, d, e, f);
      ctx.drawImage(faceCanvas, 0, 0, 8, 8);
      ctx.restore();
    }

    // BASE HEAD
    // 1. Top face (8..16, 0..8): Brightest (+12%)
    drawShearedFace(
      [8, 0, 8, 8],
      [dx / 8, -dy / 8, dx / 8, dy / 8, cx - 8 * dx, cy - 8 * dy],
      1.12
    );

    // 2. Right side face (0..8, 8..16): Shaded (80%)
    drawShearedFace(
      [0, 8, 8, 8],
      [dx / 8, dy / 8, 0, scaleY / 8, cx - 8 * dx, cy - 8 * dy],
      0.80
    );

    // 3. Front face (8..16, 8..16): Normal lighting (98%)
    drawShearedFace(
      [8, 8, 8, 8],
      [dx / 8, -dy / 8, 0, scaleY / 8, cx, cy],
      0.98
    );

    // HEAD OVERLAY (Hair / Goggles / Visor)
    if (showOverlay) {
      const oS = S * 1.08;
      const odx = 0.866025 * oS;
      const ody = 0.5 * oS;
      const oScaleY = 1.0 * oS;
      const ocx = cx;
      const ocy = cy + (scaleY - oScaleY) * 4;

      // Top overlay (40..48, 0..8)
      drawShearedFace(
        [40, 0, 8, 8],
        [odx / 8, -ody / 8, odx / 8, ody / 8, ocx - 8 * odx, ocy - 8 * ody],
        1.12
      );

      // Right overlay (32..40, 8..16)
      drawShearedFace(
        [32, 8, 8, 8],
        [odx / 8, ody / 8, 0, oScaleY / 8, ocx - 8 * odx, ocy - 8 * ody],
        0.80
      );

      // Front overlay (40..48, 8..16)
      drawShearedFace(
        [40, 8, 8, 8],
        [odx / 8, -ody / 8, 0, oScaleY / 8, ocx, ocy],
        0.98
      );
    }
  } else {
    // Pure Buffer rasterization fallback for Node.js / unit tests
    function plotVoxel(px, py, col, lightMul) {
      if (col.a === 0) return;
      const r = Math.min(255, Math.round(col.r * lightMul));
      const g = Math.min(255, Math.round(col.g * lightMul));
      const b = Math.min(255, Math.round(col.b * lightMul));
      const a = col.a;
      out.fillRect(Math.round(px), Math.round(py), Math.ceil(S * 0.9), Math.ceil(S * 0.9), { r, g, b, a });
    }

    // Top face
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const col = getPixel(8 + x, y);
        const px = (cx - 8 * dx) + (x + y) * (dx / 8);
        const py = (cy - 8 * dy) + (y - x) * (dy / 8);
        plotVoxel(px, py, col, 1.15);
      }
    }
    // Front face
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const col = getPixel(8 + x, 8 + y);
        const px = cx + x * (dx / 8);
        const py = cy - x * (dy / 8) + y * (scaleY / 8);
        plotVoxel(px, py, col, 0.98);
      }
    }
    // Right face
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const col = getPixel(x, 8 + y);
        const px = (cx - 8 * dx) + x * (dx / 8);
        const py = (cy - 8 * dy) + x * (dy / 8) + y * (scaleY / 8);
        plotVoxel(px, py, col, 0.80);
      }
    }
  }

  return format === 'canvas' ? out.getNativeCanvas() : out.toDataURL('image/png');
}

/* ============================================================================
 * THREE.JS TEXTURE HELPERS
 * ============================================================================ */

/**
 * Creates a Three.js CanvasTexture from canvas or data URL configured for pixel-perfect voxels.
 */
export function createSkinTexture(canvasOrDataUrl, customThree = THREE) {
  let texture = null;
  const T = customThree || THREE;

  if (typeof canvasOrDataUrl === 'string') {
    texture = new T.TextureLoader().load(canvasOrDataUrl);
  } else if (canvasOrDataUrl && canvasOrDataUrl.isDom) {
    texture = new T.CanvasTexture(canvasOrDataUrl.domCanvas);
  } else if (canvasOrDataUrl && canvasOrDataUrl instanceof HTMLCanvasElement) {
    texture = new T.CanvasTexture(canvasOrDataUrl);
  } else {
    const defaultCanvas = generateSTEMSteveSkin();
    texture = new T.CanvasTexture(defaultCanvas.domCanvas || defaultCanvas);
  }

  texture.magFilter = T.NearestFilter;
  texture.minFilter = T.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return texture;
}

export default {
  MODEL_TYPES,
  PRESET_SKINS,
  SKIN_PARTS,
  getPartDefinition,
  getSkinUVCoordinates,
  applySkinUVsToGeometry,
  createVoxelBoxGeometry,
  createSkinCanvas,
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
  createSkinTexture
};
