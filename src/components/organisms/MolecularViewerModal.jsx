'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { 
  X, RotateCw, Dna, FlaskConical, 
  Sparkles, Layers, Info, Check, Eye, Plus, Trash2, 
  Flame, Play, RefreshCcw, Atom, ArrowRight, AlertTriangle, ShieldCheck,
  Zap, Compass, Thermometer, Wind, Beaker
} from 'lucide-react';
import { playSound } from '@/lib/sound';

// ─── 1. BẢNG DỮ LIỆU NGUYÊN TỐ HÓA HỌC (ELEMENT PALETTE) ─────────────────────
const ELEMENT_DATA = {
  H: { symbol: 'H', name: 'Hydro', color: '#ffffff', radius: 0.30, valence: 1, mass: '1.008 g/mol', eneg: 2.20 },
  O: { symbol: 'O', name: 'Oxy', color: '#ef4444', radius: 0.45, valence: 2, mass: '15.999 g/mol', eneg: 3.44 },
  C: { symbol: 'C', name: 'Cacbon', color: '#475569', radius: 0.45, valence: 4, mass: '12.011 g/mol', eneg: 2.55 },
  N: { symbol: 'N', name: 'Nitơ', color: '#3b82f6', radius: 0.42, valence: 3, mass: '14.007 g/mol', eneg: 3.04 },
  Na: { symbol: 'Na', name: 'Natri', color: '#a855f7', radius: 0.50, valence: 1, mass: '22.990 g/mol', eneg: 0.93 },
  Cl: { symbol: 'Cl', name: 'Clo', color: '#22c55e', radius: 0.52, valence: 1, mass: '35.450 g/mol', eneg: 3.16 },
  Fe: { symbol: 'Fe', name: 'Sắt', color: '#f97316', radius: 0.50, valence: 3, mass: '55.845 g/mol', eneg: 1.83 },
  S: { symbol: 'S', name: 'Lưu huỳnh', color: '#eab308', radius: 0.48, valence: 2, mass: '32.060 g/mol', eneg: 2.58 },
  // Đơn phân Sinh học
  A: { symbol: 'A', name: 'Adenin', color: '#3b82f6', radius: 0.48, valence: 2, mass: '135.13 g/mol' },
  T: { symbol: 'T', name: 'Thymin', color: '#ef4444', radius: 0.48, valence: 2, mass: '126.11 g/mol' },
  G: { symbol: 'G', name: 'Guanin', color: '#10b981', radius: 0.48, valence: 3, mass: '151.13 g/mol' },
  X: { symbol: 'X', name: 'Xitôzin', color: '#f59e0b', radius: 0.48, valence: 3, mass: '111.10 g/mol' }
};

// ─── 2. THƯ VIỆN PHÂN TỬ 3D CHUẨN KHOA HỌC (STANDARD LIBRARY) ────────────────
const MOLECULES = {
  // ─── HÓA HỌC THPT (CHỈ HIỂN THỊ KHI Ở PHÒNG LAB HÓA) ──────────────────────
  h2o: {
    id: 'h2o',
    category: 'chem',
    name: 'Nước (H₂O)',
    formula: 'H₂O',
    mass: '18.015 g/mol',
    desc: 'Phân tử có cấu tạo góc 104.5° do cặp electron tự do của Oxy đẩy hai liên kết O-H. Là dung môi phân cực quan trọng nhất của sự sống.',
    facts: [
      'Góc liên kết ∠H-O-H: 104.5°',
      'Độ dài liên kết O-H: 0.96 Å',
      'Phân tử phân cực mạnh, tạo mạng lưới liên kết Hydro liên phân tử'
    ],
    atoms: [
      { element: 'O', pos: [0, 0, 0], color: '#ef4444', radius: 0.45 },
      { element: 'H', pos: [0.757, 0.586, 0], color: '#ffffff', radius: 0.28 },
      { element: 'H', pos: [-0.757, 0.586, 0], color: '#ffffff', radius: 0.28 }
    ],
    bonds: [{ from: 0, to: 1 }, { from: 0, to: 2 }]
  },
  nacl: {
    id: 'nacl',
    category: 'chem',
    name: 'Tinh thể Muối Ăn (NaCl)',
    formula: 'NaCl',
    mass: '58.44 g/mol',
    desc: 'Mạng tinh thể ion lập phương tâm diện (FCC). Mỗi ion Na⁺ được bao quanh bởi 6 ion Cl⁻ và ngược lại.',
    facts: [
      'Cấu trúc mạng: Lập phương tâm diện (Face-Centered Cubic)',
      'Lực liên kết: Lực hút tĩnh điện giữa ion Na⁺ và Cl⁻',
      'Nhiệt độ nóng chảy cao: 801 °C, dẫn điện khi nóng chảy hoặc hòa tan'
    ],
    atoms: [
      { element: 'Na', pos: [-1, -1, -1], color: '#a855f7', radius: 0.38 },
      { element: 'Cl', pos: [1, -1, -1], color: '#22c55e', radius: 0.52 },
      { element: 'Cl', pos: [-1, 1, -1], color: '#22c55e', radius: 0.52 },
      { element: 'Na', pos: [1, 1, -1], color: '#a855f7', radius: 0.38 },
      { element: 'Cl', pos: [-1, -1, 1], color: '#22c55e', radius: 0.52 },
      { element: 'Na', pos: [1, -1, 1], color: '#a855f7', radius: 0.38 },
      { element: 'Na', pos: [-1, 1, 1], color: '#a855f7', radius: 0.38 },
      { element: 'Cl', pos: [1, 1, 1], color: '#22c55e', radius: 0.52 }
    ],
    bonds: [
      { from: 0, to: 1 }, { from: 1, to: 3 }, { from: 3, to: 2 }, { from: 2, to: 0 },
      { from: 4, to: 5 }, { from: 5, to: 7 }, { from: 7, to: 6 }, { from: 6, to: 4 },
      { from: 0, to: 4 }, { from: 1, to: 5 }, { from: 2, to: 6 }, { from: 3, to: 7 }
    ]
  },
  ch4: {
    id: 'ch4',
    category: 'chem',
    name: 'Metan (CH₄)',
    formula: 'CH₄',
    mass: '16.04 g/mol',
    desc: 'Hydrocacbon no đơn giản nhất. Nguyên tử Cacbon ở trạng thái lai hóa sp³ tạo thành hình tứ diện đều hoàn hảo.',
    facts: [
      'Lai hóa sp³: Góc liên kết ∠H-C-H bằng đúng 109.5°',
      'Độ dài liên kết C-H: 1.09 Å',
      'Phân tử không phân cực, thành phần chính của khí thiên nhiên'
    ],
    atoms: [
      { element: 'C', pos: [0, 0, 0], color: '#475569', radius: 0.45 },
      { element: 'H', pos: [0.89, 0.89, 0.89], color: '#ffffff', radius: 0.28 },
      { element: 'H', pos: [-0.89, -0.89, 0.89], color: '#ffffff', radius: 0.28 },
      { element: 'H', pos: [-0.89, 0.89, -0.89], color: '#ffffff', radius: 0.28 },
      { element: 'H', pos: [0.89, -0.89, -0.89], color: '#ffffff', radius: 0.28 }
    ],
    bonds: [{ from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 }, { from: 0, to: 4 }]
  },
  co2: {
    id: 'co2',
    category: 'chem',
    name: 'Khí Cacbonic (CO₂)',
    formula: 'CO₂',
    mass: '44.01 g/mol',
    desc: 'Phân tử thẳng có liên kết cộng hóa trị phân cực nhưng đối xứng, momen lưỡng cực tổng bằng 0.',
    facts: [
      'Cấu trúc thẳng: Góc liên kết ∠O-C-O = 180°',
      'Nguyên tử C lai hóa sp với 2 liên kết đôi O=C=O',
      'Sản phẩm chính của phản ứng đốt cháy hợp chất hữu cơ'
    ],
    atoms: [
      { element: 'C', pos: [0, 0, 0], color: '#475569', radius: 0.45 },
      { element: 'O', pos: [-1.2, 0, 0], color: '#ef4444', radius: 0.45 },
      { element: 'O', pos: [1.2, 0, 0], color: '#ef4444', radius: 0.45 }
    ],
    bonds: [{ from: 0, to: 1 }, { from: 0, to: 2 }]
  },
  nh3: {
    id: 'nh3',
    category: 'chem',
    name: 'Amoniac (NH₃)',
    formula: 'NH₃',
    mass: '17.03 g/mol',
    desc: 'Phân tử hình chóp tam giác với nguyên tử N ở đỉnh chóp, góc liên kết ∠H-N-H = 107°.',
    facts: [
      'Dạng hình học: Hình chóp tam giác đáy đều',
      'Độ tan cực lớn trong nước do tạo liên kết Hydro',
      'Có tính bazơ yếu do cặp electron tự do trên nguyên tử Nitơ'
    ],
    atoms: [
      { element: 'N', pos: [0, 0.25, 0], color: '#3b82f6', radius: 0.42 },
      { element: 'H', pos: [0.85, -0.25, 0.4], color: '#ffffff', radius: 0.28 },
      { element: 'H', pos: [-0.85, -0.25, 0.4], color: '#ffffff', radius: 0.28 },
      { element: 'H', pos: [0, -0.25, -0.9], color: '#ffffff', radius: 0.28 }
    ],
    bonds: [{ from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 }]
  },
  c2h5oh: {
    id: 'c2h5oh',
    category: 'chem',
    name: 'Ethanol / Cồn (C₂H₅OH)',
    formula: 'C₂H₅OH',
    mass: '46.07 g/mol',
    desc: 'Ancol no đơn chức bậc I, có nhóm chức hydroxyl (-OH) tạo liên kết Hydro làm nhiệt độ sôi cao hơn hydrocacbon tương ứng.',
    facts: [
      'Nhóm chức: Hydroxyl (-OH) liên kết trực tiếp với gốc etyl',
      'Nhiệt độ sôi: 78.37 °C, tan vô hạn trong nước',
      'Ứng dụng: Nhiên liệu sinh học, dung môi, chất sát trùng y tế'
    ],
    atoms: [
      { element: 'C', pos: [-0.9, -0.2, 0], color: '#475569', radius: 0.45 },
      { element: 'C', pos: [0.5, 0.2, 0], color: '#475569', radius: 0.45 },
      { element: 'O', pos: [1.4, -0.7, 0], color: '#ef4444', radius: 0.45 },
      { element: 'H', pos: [2.2, -0.4, 0], color: '#ffffff', radius: 0.28 },
      { element: 'H', pos: [-1.4, 0.4, 0.7], color: '#ffffff', radius: 0.28 },
      { element: 'H', pos: [-1.4, 0.4, -0.7], color: '#ffffff', radius: 0.28 },
      { element: 'H', pos: [-0.9, -1.2, 0], color: '#ffffff', radius: 0.28 },
      { element: 'H', pos: [0.5, 0.8, 0.8], color: '#ffffff', radius: 0.28 },
      { element: 'H', pos: [0.5, 0.8, -0.8], color: '#ffffff', radius: 0.28 }
    ],
    bonds: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
      { from: 0, to: 4 }, { from: 0, to: 5 }, { from: 0, to: 6 },
      { from: 1, to: 7 }, { from: 1, to: 8 }
    ]
  },
  c6h6: {
    id: 'c6h6',
    category: 'chem',
    name: 'Benzen (C₆H₆)',
    formula: 'C₆H₆',
    mass: '78.11 g/mol',
    desc: 'Vòng thơm cơ bản nhất trong Hóa học hữu cơ. 6 nguyên tử C lai hóa sp² tạo thành vòng lục giác đều phẳng với hệ electron pi bất định xứ.',
    facts: [
      'Cấu trúc phẳng: Tất cả 6 góc ∠C-C-C đều bằng 120°',
      'Độ dài 6 liên kết C-C tương đương nhau: 1.39 Å (giữa đơn và đôi)',
      'Hệ thơm bền vững theo quy tắc Hückel (4n + 2 = 6 electron pi)'
    ],
    atoms: [
      { element: 'C', pos: [1.3, 0, 0], color: '#475569', radius: 0.45 },
      { element: 'C', pos: [0.65, 1.13, 0], color: '#475569', radius: 0.45 },
      { element: 'C', pos: [-0.65, 1.13, 0], color: '#475569', radius: 0.45 },
      { element: 'C', pos: [-1.3, 0, 0], color: '#475569', radius: 0.45 },
      { element: 'C', pos: [-0.65, -1.13, 0], color: '#475569', radius: 0.45 },
      { element: 'C', pos: [0.65, -1.13, 0], color: '#475569', radius: 0.45 },
      { element: 'H', pos: [2.2, 0, 0], color: '#ffffff', radius: 0.28 },
      { element: 'H', pos: [1.1, 1.9, 0], color: '#ffffff', radius: 0.28 },
      { element: 'H', pos: [-1.1, 1.9, 0], color: '#ffffff', radius: 0.28 },
      { element: 'H', pos: [-2.2, 0, 0], color: '#ffffff', radius: 0.28 },
      { element: 'H', pos: [-1.1, -1.9, 0], color: '#ffffff', radius: 0.28 },
      { element: 'H', pos: [1.1, -1.9, 0], color: '#ffffff', radius: 0.28 }
    ],
    bonds: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
      { from: 3, to: 4 }, { from: 4, to: 5 }, { from: 5, to: 0 },
      { from: 0, to: 6 }, { from: 1, to: 7 }, { from: 2, to: 8 },
      { from: 3, to: 9 }, { from: 4, to: 10 }, { from: 5, to: 11 }
    ]
  },

  // ─── SINH HỌC DI TRUYỀN (CHỈ HIỂN THỊ KHI Ở PHÒNG LAB SINH) ────────────────
  dna_helix: {
    id: 'dna_helix',
    category: 'bio',
    name: 'Chuỗi Xoắn Kép ADN (B-DNA)',
    formula: '(C₁₁H₁₂O₆N₅P)ₙ',
    mass: '~650 Da / cặp nu',
    desc: 'Mô hình kinh điển của Watson & Crick (1953). Hai mạch polynucleotit ngược chiều song song xoắn đều quanh trục chung.',
    facts: [
      'Đường kính vòng xoắn: 20 Å (2 nm)',
      'Chiều cao 1 chu kỳ xoắn: 34 Å gồm đúng 10 cặp nucleotit',
      'Khoảng cách giữa 2 cặp bazơ kế tiếp: 3.4 Å, góc xoay 36°'
    ],
    atoms: [
      { element: 'P', pos: [1.2, -2.0, 0], color: '#f59e0b', radius: 0.38 },
      { element: 'C', pos: [0.97, -1.6, 0.7], color: '#3b82f6', radius: 0.35 },
      { element: 'P', pos: [0.37, -1.2, 1.14], color: '#f59e0b', radius: 0.38 },
      { element: 'C', pos: [-0.37, -0.8, 1.14], color: '#3b82f6', radius: 0.35 },
      { element: 'P', pos: [-0.97, -0.4, 0.7], color: '#f59e0b', radius: 0.38 },
      { element: 'C', pos: [-1.2, 0, 0], color: '#3b82f6', radius: 0.35 },
      { element: 'P', pos: [-0.97, 0.4, -0.7], color: '#f59e0b', radius: 0.38 },
      { element: 'C', pos: [-0.37, 0.8, -1.14], color: '#3b82f6', radius: 0.35 },
      { element: 'P', pos: [0.37, 1.2, -1.14], color: '#f59e0b', radius: 0.38 },
      { element: 'C', pos: [0.97, 1.6, -0.7], color: '#3b82f6', radius: 0.35 },
      { element: 'P', pos: [1.2, 2.0, 0], color: '#f59e0b', radius: 0.38 },
      { element: 'P', pos: [-1.2, -2.0, 0], color: '#ef4444', radius: 0.38 },
      { element: 'C', pos: [-0.97, -1.6, -0.7], color: '#10b981', radius: 0.35 },
      { element: 'P', pos: [-0.37, -1.2, -1.14], color: '#ef4444', radius: 0.38 },
      { element: 'C', pos: [0.37, -0.8, -1.14], color: '#10b981', radius: 0.35 },
      { element: 'P', pos: [0.97, -0.4, -0.7], color: '#ef4444', radius: 0.38 },
      { element: 'C', pos: [1.2, 0, 0], color: '#10b981', radius: 0.35 },
      { element: 'P', pos: [0.97, 0.4, 0.7], color: '#ef4444', radius: 0.38 },
      { element: 'C', pos: [0.37, 0.8, 1.14], color: '#10b981', radius: 0.35 },
      { element: 'P', pos: [-0.37, 1.2, 1.14], color: '#ef4444', radius: 0.38 },
      { element: 'C', pos: [-0.97, 1.6, 0.7], color: '#10b981', radius: 0.35 },
      { element: 'P', pos: [-1.2, 2.0, 0], color: '#ef4444', radius: 0.38 }
    ],
    bonds: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 },
      { from: 4, to: 5 }, { from: 5, to: 6 }, { from: 6, to: 7 }, { from: 7, to: 8 },
      { from: 8, to: 9 }, { from: 9, to: 10 },
      { from: 11, to: 12 }, { from: 12, to: 13 }, { from: 13, to: 14 }, { from: 14, to: 15 },
      { from: 15, to: 16 }, { from: 16, to: 17 }, { from: 17, to: 18 }, { from: 18, to: 19 },
      { from: 19, to: 20 }, { from: 20, to: 21 },
      { from: 0, to: 11 }, { from: 2, to: 13 }, { from: 4, to: 15 },
      { from: 6, to: 17 }, { from: 8, to: 19 }, { from: 10, to: 21 }
    ]
  },
  base_pair_at: {
    id: 'base_pair_at',
    category: 'bio',
    name: 'Cặp Bazơ Adenin - Thymin (A = T)',
    formula: 'C₅H₅N₅ • C₅H₆N₂O₂',
    mass: '261.24 g/mol',
    desc: 'Cặp bazơ bổ sung liên kết bằng chính xác 2 liên kết Hydro theo nguyên tắc bổ sung SGK Sinh học 12.',
    facts: [
      'Số liên kết Hydro: Đúng 2 liên kết Hydro (A = T)',
      'Khoảng cách giữa hai liên kết H: ~2.8 Å đến 3.0 Å',
      'Độ bền nhiệt thấp hơn cặp G-X (3 liên kết Hydro)'
    ],
    atoms: [
      { element: 'N', pos: [-1.8, 0.8, 0], color: '#3b82f6', radius: 0.4 },
      { element: 'C', pos: [-1.2, 0, 0], color: '#475569', radius: 0.42 },
      { element: 'N', pos: [-1.8, -0.8, 0], color: '#3b82f6', radius: 0.4 },
      { element: 'C', pos: [-2.6, 0, 0], color: '#475569', radius: 0.42 },
      { element: 'N', pos: [-0.4, 0.5, 0], color: '#3b82f6', radius: 0.4 },
      { element: 'O', pos: [0.6, 0.5, 0], color: '#ef4444', radius: 0.42 },
      { element: 'C', pos: [1.3, 0, 0], color: '#475569', radius: 0.42 },
      { element: 'N', pos: [0.6, -0.5, 0], color: '#3b82f6', radius: 0.4 },
      { element: 'C', pos: [1.8, -0.8, 0], color: '#475569', radius: 0.42 },
      { element: 'C', pos: [2.5, 0, 0], color: '#475569', radius: 0.42 },
      { element: 'O', pos: [-0.4, -0.5, 0], color: '#ef4444', radius: 0.42 }
    ],
    bonds: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 0 },
      { from: 1, to: 4 }, { from: 5, to: 6 }, { from: 6, to: 7 }, { from: 7, to: 8 },
      { from: 8, to: 9 }, { from: 9, to: 6 }
    ],
    hBonds: [{ from: 4, to: 5 }, { from: 7, to: 10 }]
  },
  base_pair_gx: {
    id: 'base_pair_gx',
    category: 'bio',
    name: 'Cặp Bazơ Guanin - Xitôzin (G ≡ X)',
    formula: 'C₅H₅N₅O • C₄H₅N₃O',
    mass: '262.23 g/mol',
    desc: 'Cặp bazơ bổ sung liên kết bằng chính xác 3 liên kết Hydro cực kỳ bền vững. Càng nhiều cặp G-X phân tử ADN càng khó biến tính nhiệt.',
    facts: [
      'Số liên kết Hydro: Đúng 3 liên kết Hydro (G ≡ X)',
      'Độ bền nhiệt cao hơn cặp A-T',
      'Đột biến thay thế cặp G-X bằng A-T làm giảm nhiệt độ nóng chảy của gen'
    ],
    atoms: [
      { element: 'O', pos: [-0.6, 0.9, 0], color: '#ef4444', radius: 0.42 },
      { element: 'N', pos: [-0.6, 0, 0], color: '#3b82f6', radius: 0.4 },
      { element: 'N', pos: [-0.6, -0.9, 0], color: '#3b82f6', radius: 0.4 },
      { element: 'C', pos: [-1.4, 0.5, 0], color: '#475569', radius: 0.42 },
      { element: 'C', pos: [-1.4, -0.5, 0], color: '#475569', radius: 0.42 },
      { element: 'N', pos: [0.6, 0.9, 0], color: '#3b82f6', radius: 0.4 },
      { element: 'N', pos: [0.6, 0, 0], color: '#3b82f6', radius: 0.4 },
      { element: 'O', pos: [0.6, -0.9, 0], color: '#ef4444', radius: 0.42 },
      { element: 'C', pos: [1.4, 0.5, 0], color: '#475569', radius: 0.42 },
      { element: 'C', pos: [1.4, -0.5, 0], color: '#475569', radius: 0.42 }
    ],
    bonds: [
      { from: 0, to: 3 }, { from: 3, to: 1 }, { from: 1, to: 4 }, { from: 4, to: 2 },
      { from: 5, to: 8 }, { from: 8, to: 6 }, { from: 6, to: 9 }, { from: 9, to: 7 }
    ],
    hBonds: [{ from: 0, to: 5 }, { from: 1, to: 6 }, { from: 2, to: 7 }]
  }
};

// ─── 3. ĐỘNG CƠ SUY LUẬN PHẢN ỨNG HÓA HỌC TỰ ĐỘNG (REACTION INFERENCE ENGINE) ──
function detectReactionFromAtoms(atoms) {
  if (!atoms || atoms.length === 0) return null;
  
  const counts = {};
  atoms.forEach(a => {
    counts[a.element] = (counts[a.element] || 0) + 1;
  });

  const elements = Object.keys(counts);

  // 1. Phản ứng H + O -> H2O (Nước)
  if (counts['H'] >= 2 && counts['O'] >= 1 && elements.length === 2) {
    return {
      id: 'h2_o2',
      name: 'Đốt cháy Khí Hydro trong Oxy (Tạo Nước)',
      type: 'Phản ứng Oxi hóa - Khử / Tỏa nhiệt cực mạnh',
      equation: '2H₂ (k) + O₂ (k) ➔ 2H₂O (hơi)',
      condition: 'Nhiệt độ (t° > 550°C hoặc tia lửa điện mồi)',
      enthalpy: 'ΔᵣH°₂₉₈ = -483.6 kJ (Tỏa nhiệt dữ dội, nổ mạnh ở tỉ lệ 2:1)',
      phenomenon: 'Hỗn hợp nổ mạnh tạo ngọn lửa màu xanh nhạt tỏa nhiều nhiệt, sau phản ứng có các giọt nước tinh khiết ngưng tụ trên thành bình làm mờ kính.',
      redox: 'H⁰ → H⁺¹ + 1e (Chất khử) | O⁰ + 2e → O⁻² (Chất oxi hóa)',
      bondNature: '2 liên kết cộng hóa trị phân cực O-H dạng góc 104.5°.',
      productsDesc: '2 phân tử Nước (H₂O)',
      products: [
        { element: 'O', pos: [-1.2, 0, 0] },
        { element: 'H', pos: [-1.8, 0.5, 0] },
        { element: 'H', pos: [-0.6, 0.5, 0] },
        { element: 'O', pos: [1.2, 0, 0] },
        { element: 'H', pos: [0.6, 0.5, 0] },
        { element: 'H', pos: [1.8, 0.5, 0] }
      ],
      productBonds: [
        { from: 0, to: 1, type: 'single' },
        { from: 0, to: 2, type: 'single' },
        { from: 3, to: 4, type: 'single' },
        { from: 3, to: 5, type: 'single' }
      ]
    };
  }

  // 2. Phản ứng Na + Cl -> NaCl (Muối ăn)
  if (counts['Na'] >= 1 && counts['Cl'] >= 1 && elements.length === 2) {
    return {
      id: 'na_cl',
      name: 'Kim loại Natri cháy trong khí Clo (Tạo Muối Ăn)',
      type: 'Phản ứng Oxi hóa - Khử / Hình thành mạng tinh thể ion',
      equation: '2Na (r) + Cl₂ (k) ➔ 2NaCl (r)',
      condition: 'Đun nóng nhẹ (t°)',
      enthalpy: 'ΔᵣH°₂₉₈ = -822.2 kJ (Tỏa nhiệt và phát sáng chói lọi)',
      phenomenon: 'Natri nóng chảy cháy rực rỡ với ngọn lửa màu vàng chói trong khí Clo màu vàng lục, tạo ra khói trắng dày đặc là các vi tinh thể muối ăn NaCl bám vào thành bình.',
      redox: 'Na⁰ → Na⁺ + 1e (Chất khử mạnh) | Cl⁰ + 1e → Cl⁻ (Chất oxi hóa mạnh)',
      bondNature: 'Liên kết ion hình thành do lực hút tĩnh điện giữa cation Na⁺ và anion Cl⁻.',
      productsDesc: 'Tinh thể Muối Ăn Natri Clorua (NaCl)',
      products: [
        { element: 'Na', pos: [-1.2, 0, 0] },
        { element: 'Cl', pos: [-0.2, 0, 0] },
        { element: 'Na', pos: [1.0, 0, 0] },
        { element: 'Cl', pos: [2.0, 0, 0] }
      ],
      productBonds: [
        { from: 0, to: 1, type: 'ionic' },
        { from: 2, to: 3, type: 'ionic' }
      ]
    };
  }

  // 3. Phản ứng C + O -> CO2 (Khí cacbonic)
  if (counts['C'] >= 1 && counts['O'] >= 1 && elements.length === 2) {
    const isExcess = counts['O'] >= 2;
    return {
      id: isExcess ? 'c_o2' : 'c_co',
      name: isExcess ? 'Đốt cháy Cacbon hoàn toàn trong Oxy' : 'Đốt cháy Cacbon thiếu Oxy (Sinh CO)',
      type: 'Phản ứng Cháy / Tỏa nhiệt ứng dụng chất đốt',
      equation: isExcess ? 'C (r) + O₂ (k) ➔ CO₂ (k)' : '2C (r) + O₂ (k) ➔ 2CO (k)',
      condition: 'Nhiệt độ cao (t° > 400°C)',
      enthalpy: isExcess ? 'ΔᵣH°₂₉₈ = -393.5 kJ/mol (Tỏa nhiều nhiệt)' : 'ΔᵣH°₂₉₈ = -221.0 kJ/mol',
      phenomenon: isExcess 
        ? 'Than cháy sáng đỏ cam không khói, sinh ra khí CO2 không màu làm đục nước vôi trong Ca(OH)2.' 
        : 'Than cháy âm ỉ sinh khí CO độc hại do thiếu dưỡng khí oxi.',
      redox: 'C⁰ → C⁺⁴ + 4e (Chất khử) | O⁰ + 2e → O⁻²',
      bondNature: '2 liên kết cộng hóa trị đôi phân cực O=C=O (cấu trúc đường thẳng 180°).',
      productsDesc: isExcess ? 'Khí Cacbonic (CO₂)' : 'Khí Cacbon Monoxit (CO)',
      products: [
        { element: 'C', pos: [0, 0, 0] },
        { element: 'O', pos: [-1.2, 0, 0] },
        { element: 'O', pos: [1.2, 0, 0] }
      ],
      productBonds: [
        { from: 0, to: 1, type: 'double' },
        { from: 0, to: 2, type: 'double' }
      ]
    };
  }

  // 4. Phản ứng Fe + S -> FeS (Sắt sunfua)
  if (counts['Fe'] >= 1 && counts['S'] >= 1 && elements.length === 2) {
    return {
      id: 'fe_s',
      name: 'Sắt tác dụng với Lưu huỳnh',
      type: 'Phản ứng Hóa hợp / Oxi hóa - Khử',
      equation: 'Fe (r) + S (r) ➔ FeS (r)',
      condition: 'Nhiệt độ mồi (t° đun nóng một góc)',
      enthalpy: 'ΔᵣH°₂₉₈ = -100.0 kJ/mol (Tỏa nhiệt tự tiếp diễn)',
      phenomenon: 'Hỗn hợp nung đỏ thì phản ứng tự cháy lan toả ra toàn khối, tạo thành chất rắn màu đen xám FeS không còn tính nhiễm từ (không bị nam châm hút).',
      redox: 'Fe⁰ → Fe⁺² + 2e | S⁰ + 2e → S⁻²',
      bondNature: 'Liên kết ion - cộng hóa trị chuyển tiếp trong mạng tinh thể FeS.',
      productsDesc: 'Hợp chất Sắt(II) Sunfua (FeS)',
      products: [
        { element: 'Fe', pos: [-0.6, 0, 0] },
        { element: 'S', pos: [0.6, 0, 0] }
      ],
      productBonds: [{ from: 0, to: 1, type: 'ionic' }]
    };
  }

  // 5. Phản ứng Fe + Cl -> FeCl3 (Sắt(III) clorua)
  if (counts['Fe'] >= 1 && counts['Cl'] >= 2 && elements.length === 2) {
    return {
      id: 'fe_cl',
      name: 'Dây sắt cháy trong khí Clo',
      type: 'Phản ứng Oxi hóa - Khử đưa sắt lên số oxi hóa cực đại (+3)',
      equation: '2Fe (r) + 3Cl₂ (k) ➔ 2FeCl₃ (r)',
      condition: 'Nhiệt độ (t°)',
      enthalpy: 'ΔᵣH°₂₉₈ = -399.5 kJ/mol (Tỏa nhiệt mạnh)',
      phenomenon: 'Dây sắt nung đỏ đưa vào bình khí Clo cháy sáng chói, sinh ra khói màu nâu đỏ bám thành bình là các hạt tinh thể FeCl3.',
      redox: 'Fe⁰ → Fe⁺³ + 3e | Cl⁰ + 1e → Cl⁻',
      bondNature: 'Liên kết ion / cộng hóa trị phân cực mạnh.',
      productsDesc: 'Muối Sắt(III) Clorua (FeCl₃)',
      products: [
        { element: 'Fe', pos: [0, 0, 0] },
        { element: 'Cl', pos: [0, 1.2, 0] },
        { element: 'Cl', pos: [-1.0, -0.7, 0] },
        { element: 'Cl', pos: [1.0, -0.7, 0] }
      ],
      productBonds: [
        { from: 0, to: 1, type: 'single' },
        { from: 0, to: 2, type: 'single' },
        { from: 0, to: 3, type: 'single' }
      ]
    };
  }

  // 6. Phản ứng H + Cl -> HCl
  if (counts['H'] >= 1 && counts['Cl'] >= 1 && elements.length === 2) {
    return {
      id: 'h_cl',
      name: 'Khí Hydro cháy trong khí Clo',
      type: 'Phản ứng Hóa hợp quang hóa',
      equation: 'H₂ (k) + Cl₂ (k) ➔ 2HCl (k)',
      condition: 'Ánh sáng hoặc nhiệt độ (as / t°)',
      enthalpy: 'ΔᵣH°₂₉₈ = -184.6 kJ/mol (Tỏa nhiệt)',
      phenomenon: 'Hỗn hợp nổ khi chiếu sáng mạnh. Khí sinh ra không màu, bốc khói trong không khí ẩm và làm quỳ tím ẩm hóa đỏ ngay lập tức.',
      redox: 'H⁰ → H⁺¹ + 1e | Cl⁰ + 1e → Cl⁻¹',
      bondNature: 'Liên kết cộng hóa trị phân cực mạnh giữa H và Cl.',
      productsDesc: 'Khí Hiđro Clorua (HCl)',
      products: [
        { element: 'H', pos: [-0.6, 0, 0] },
        { element: 'Cl', pos: [0.6, 0, 0] }
      ],
      productBonds: [{ from: 0, to: 1, type: 'single' }]
    };
  }

  // 7. Phản ứng N + H -> NH3
  if (counts['N'] >= 1 && counts['H'] >= 2 && elements.length === 2) {
    return {
      id: 'n_h',
      name: 'Tổng hợp Amoniac (Haber-Bosch)',
      type: 'Phản ứng Thuận nghịch công nghiệp',
      equation: 'N₂ (k) + 3H₂ (k) ⇌ 2NH₃ (k)',
      condition: '450°C, 200 atm, Xúc tác Fe',
      enthalpy: 'ΔᵣH°₂₉₈ = -92.2 kJ/mol (Tỏa nhiệt)',
      phenomenon: 'Khí Amoniac sinh ra có mùi khai đặc trưng, tan vô hạn trong nước tạo dung dịch kiềm làm xanh quỳ tím.',
      redox: 'N⁰ + 3e → N⁻³ | H⁰ → H⁺¹ + 1e',
      bondNature: '3 liên kết cộng hóa trị phân cực N-H dạng hình chóp tam giác, còn 1 cặp e tự do.',
      productsDesc: 'Khí Amoniac (NH₃)',
      products: [
        { element: 'N', pos: [0, 0.2, 0] },
        { element: 'H', pos: [-0.8, -0.4, 0.4] },
        { element: 'H', pos: [0.8, -0.4, 0.4] },
        { element: 'H', pos: [0, -0.4, -0.8] }
      ],
      productBonds: [
        { from: 0, to: 1, type: 'single' },
        { from: 0, to: 2, type: 'single' },
        { from: 0, to: 3, type: 'single' }
      ]
    };
  }

  // 8. Phản ứng C + H + O (Đốt cháy Metan CH4 + 2O2 -> CO2 + 2H2O)
  if (counts['C'] >= 1 && counts['H'] >= 2 && counts['O'] >= 2) {
    return {
      id: 'ch4_o2',
      name: 'Đốt cháy khí Metan (Khí gas thiên nhiên)',
      type: 'Phản ứng Cháy hoàn toàn hydrocacbon',
      equation: 'CH₄ (k) + 2O₂ (k) ➔ CO₂ (k) + 2H₂O (hơi)',
      condition: 'Nhiệt độ mồi lửa (t°)',
      enthalpy: 'ΔᵣH°₂₉₈ = -890.3 kJ/mol (Tỏa nhiệt cực lớn cấp năng lượng)',
      phenomenon: 'Khí cháy sạch với ngọn lửa màu xanh lam đặc trưng, không có bụi than, sinh ra CO2 và hơi nước tỏa lượng nhiệt lớn.',
      redox: 'C⁻⁴ → C⁺⁴ + 8e | O⁰ + 2e → O⁻²',
      bondNature: 'Bẻ gãy 4 liên kết C-H và 2 liên kết O=O; tạo thành 2 liên kết C=O và 4 liên kết O-H.',
      productsDesc: 'Khí Cacbonic (CO₂) và Hơi nước (H₂O)',
      products: [
        { element: 'C', pos: [0, 1.2, 0] },
        { element: 'O', pos: [-1.1, 1.2, 0] },
        { element: 'O', pos: [1.1, 1.2, 0] },
        { element: 'O', pos: [-1.4, -0.9, 0] },
        { element: 'H', pos: [-2.0, -0.5, 0] },
        { element: 'H', pos: [-0.8, -0.5, 0] },
        { element: 'O', pos: [1.4, -0.9, 0] },
        { element: 'H', pos: [0.8, -0.5, 0] },
        { element: 'H', pos: [2.0, -0.5, 0] }
      ],
      productBonds: [
        { from: 0, to: 1, type: 'double' },
        { from: 0, to: 2, type: 'double' },
        { from: 3, to: 4, type: 'single' },
        { from: 3, to: 5, type: 'single' },
        { from: 6, to: 7, type: 'single' },
        { from: 6, to: 8, type: 'single' }
      ]
    };
  }

  // 9. Phản ứng S + O -> SO2
  if (counts['S'] >= 1 && counts['O'] >= 2 && elements.length === 2) {
    return {
      id: 's_o2',
      name: 'Đốt cháy Lưu huỳnh trong Oxy',
      type: 'Phản ứng Oxi hóa - Khử',
      equation: 'S (r) + O₂ (k) ➔ SO₂ (k)',
      condition: 'Nhiệt độ (t°)',
      enthalpy: 'ΔᵣH°₂₉₈ = -296.8 kJ/mol (Tỏa nhiệt)',
      phenomenon: 'Lưu huỳnh cháy trong oxi với ngọn lửa sáng rực màu xanh, sinh ra khí SO2 có mùi hắc nồng đặc trưng.',
      redox: 'S⁰ → S⁺⁴ + 4e | O⁰ + 2e → O⁻²',
      bondNature: 'Cấu trúc góc với 2 liên kết cộng hóa trị S=O.',
      productsDesc: 'Khí Lưu huỳnh Đioxit (SO₂)',
      products: [
        { element: 'S', pos: [0, 0.4, 0] },
        { element: 'O', pos: [-1.0, -0.4, 0] },
        { element: 'O', pos: [1.0, -0.4, 0] }
      ],
      productBonds: [
        { from: 0, to: 1, type: 'double' },
        { from: 0, to: 2, type: 'double' }
      ]
    };
  }

  // 10. Phản ứng Trung hòa NaOH + HCl -> NaCl + H2O
  if (counts['Na'] >= 1 && counts['Cl'] >= 1 && counts['O'] >= 1 && counts['H'] >= 2) {
    return {
      id: 'naoh_hcl',
      name: 'Phản ứng Trung hòa Axit - Bazơ',
      type: 'Phản ứng Trao đổi ion trong dung dịch',
      equation: 'HCl + NaOH ➔ NaCl + H₂O',
      condition: 'Nhiệt độ phòng (Phản ứng tức thời)',
      enthalpy: 'ΔᵣH°₂₉₈ = -57.3 kJ/mol (Tỏa nhiệt làm ấm dung dịch)',
      phenomenon: 'Phản ứng không tạo khí hay kết tủa nhưng dung dịch ấm lên rõ rệt. Nồng độ pH chuyển về mức trung tính pH ≈ 7.',
      redox: 'Bản chất trao đổi ion: H⁺ + OH⁻ ➔ H₂O (Số oxi hóa giữ nguyên)',
      bondNature: 'Tạo liên kết cộng hóa trị phân cực H-O-H và giải phóng các ion Na⁺, Cl⁻ tự do.',
      productsDesc: 'Muối ăn (NaCl) và Nước (H₂O)',
      products: [
        { element: 'Na', pos: [-1.2, 0, 0] },
        { element: 'Cl', pos: [-0.3, 0, 0] },
        { element: 'O', pos: [1.2, 0, 0] },
        { element: 'H', pos: [0.6, 0.5, 0] },
        { element: 'H', pos: [1.8, 0.5, 0] }
      ],
      productBonds: [
        { from: 0, to: 1, type: 'ionic' },
        { from: 2, to: 3, type: 'single' },
        { from: 2, to: 4, type: 'single' }
      ]
    };
  }

  // 11. Ghép đôi bazơ nitơ Sinh học (A - T hoặc G - X)
  if (counts['A'] >= 1 && counts['T'] >= 1) {
    return {
      id: 'bio_at',
      name: 'Liên kết Bổ sung Adenin - Thymin (A = T)',
      type: 'Tương tác liên kết Hydro sinh học di truyền',
      equation: 'Adenin + Thymin ➔ Cặp A = T (2 liên kết H)',
      condition: 'Cấu trúc không gian chuỗi xoắn kép ADN',
      enthalpy: 'Liên kết Hydro bền vững giữ 2 mạch polynucleotit ngược chiều',
      phenomenon: 'Hình thành đúng 2 liên kết Hydro giữa N-H...O và N-H...N theo nguyên tắc bổ sung SGK Sinh học 12.',
      redox: 'Tương tác tĩnh điện phân cực giữa nguyên tử H dương điện và O, N âm điện.',
      bondNature: '2 liên kết Hydro liên phân tử.',
      productsDesc: 'Cặp Bazơ Nitơ Bổ Sung A = T',
      products: [
        { element: 'A', pos: [-0.8, 0, 0] },
        { element: 'T', pos: [0.8, 0, 0] }
      ],
      productBonds: [{ from: 0, to: 1, type: 'hbond' }]
    };
  }

  if (counts['G'] >= 1 && counts['X'] >= 1) {
    return {
      id: 'bio_gx',
      name: 'Liên kết Bổ sung Guanin - Xitôzin (G ≡ X)',
      type: 'Tương tác liên kết Hydro sinh học di truyền',
      equation: 'Guanin + Xitôzin ➔ Cặp G ≡ X (3 liên kết H)',
      condition: 'Cấu trúc không gian chuỗi xoắn kép ADN',
      enthalpy: '3 liên kết Hydro cực kỳ bền vững nhiệt',
      phenomenon: 'Hình thành đúng 3 liên kết Hydro (G ≡ X). Càng nhiều cặp G-X gen càng có nhiệt độ nóng chảy cao.',
      redox: 'Tương tác tĩnh điện 3 cầu Hydro.',
      bondNature: '3 liên kết Hydro liên phân tử.',
      productsDesc: 'Cặp Bazơ Nitơ Bổ Sung G ≡ X',
      products: [
        { element: 'G', pos: [-0.8, 0, 0] },
        { element: 'X', pos: [0.8, 0, 0] }
      ],
      productBonds: [{ from: 0, to: 1, type: 'hbond' }]
    };
  }

  // Không phản ứng
  return {
    id: 'no_reaction',
    name: 'Không xảy ra phản ứng hóa học',
    type: 'Hỗn hợp bền / Không có phản ứng trong điều kiện thường',
    equation: 'Chưa đủ điều kiện phản ứng giữa các nguyên tố này',
    condition: 'Cần bổ sung thêm tác nhân (Oxy để đốt cháy, Clo để oxi hóa, hoặc dung môi thích hợp)',
    enthalpy: 'ΔH = 0 (Không phát sinh trao đổi nhiệt)',
    phenomenon: 'Các nguyên tử không có tương tác phá vỡ lớp vỏ electron để tạo liên kết mới trong điều kiện này.',
    redox: 'Không có sự chuyển dịch electron giữa các nguyên tố.',
    bondNature: 'Giữ nguyên cấu trúc tự do ban đầu.',
    productsDesc: 'Hỗn hợp giữ nguyên',
    products: atoms.map(a => ({ ...a })),
    productBonds: []
  };
}

// ─── COMPONENT CHÍNH: KÍNH HIỂN VI & XƯỞNG PHẢN ỨNG 3D ─────────────────────
export default function MolecularViewerModal({ isOpen, onClose, initialCategory = 'chem' }) {
  const isChem = initialCategory === 'chem';

  // Chế độ: 'library' (thư viện mẫu chuẩn) | 'builder' (tự do lắp ghép & tạo phản ứng)
  const [activeTab, setActiveTab] = useState(isChem ? 'builder' : 'library');
  const [selectedMoleculeKey, setSelectedMoleculeKey] = useState(isChem ? 'h2o' : 'dna_helix');
  const [viewStyle, setViewStyle] = useState('ball_stick'); // 'ball_stick' | 'space_filling' | 'wireframe'
  const [autoRotate, setAutoRotate] = useState(true);

  // Trạng thái Lắp ghép tự do (Builder States)
  const [builderAtoms, setBuilderAtoms] = useState([]);
  const [builderBonds, setBuilderBonds] = useState([]);
  const [selectedAtomIdx, setSelectedAtomIdx] = useState(null);
  const [hoveredAtom, setHoveredAtom] = useState(null);
  const [bondType, setBondType] = useState('single');

  // Trạng thái Phản ứng hóa học
  const [inferredReaction, setInferredReaction] = useState(null);
  const [reactionPhase, setReactionPhase] = useState('idle'); // 'idle' | 'heating' | 'breaking' | 'recombining' | 'done'
  const [lastExecutedReaction, setLastExecutedReaction] = useState(null);
  const [showNoReactionWarning, setShowNoReactionWarning] = useState(false);

  // Three.js Refs
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const moleculeGroupRef = useRef(null);
  const particlesRef = useRef(null);
  const shockwaveRef = useRef(null);
  const ambientLightRef = useRef(null);
  const atomMeshesRef = useRef([]);
  const hoveredAtomIdxRef = useRef(null);
  const isDraggingRef = useRef(false);
  const previousMousePosRef = useRef({ x: 0, y: 0 });

  // Tự động phân tích phản ứng mỗi khi học sinh thêm nguyên tử hoặc nối liên kết
  useEffect(() => {
    if (activeTab === 'builder' && builderAtoms.length > 0) {
      const detected = detectReactionFromAtoms(builderAtoms);
      setInferredReaction(detected);
    } else {
      setInferredReaction(null);
    }
  }, [builderAtoms, builderBonds, activeTab]);

  // Phân lập tuyệt đối danh mục theo môn học
  useEffect(() => {
    setSelectedMoleculeKey(isChem ? 'h2o' : 'dna_helix');
    setActiveTab(isChem ? 'builder' : 'library');
    setReactionPhase('idle');
    setLastExecutedReaction(null);
    setBuilderAtoms([]);
    setBuilderBonds([]);
    setSelectedAtomIdx(null);
    setHoveredAtom(null);
  }, [isChem]);

  const activeMol = MOLECULES[selectedMoleculeKey] || (isChem ? MOLECULES.h2o : MOLECULES.dna_helix);

  // ─── KHỞI TẠO THREE.JS WEBGL SCENE VỚI HỆ THỐNG HẠT NĂNG LƯỢNG ─────────────
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#070b12');

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ánh sáng Studio
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf43f5e, 0.8);
    dirLight2.position.set(-5, -5, -3);
    scene.add(dirLight2);

    const molGroup = new THREE.Group();
    scene.add(molGroup);
    moleculeGroupRef.current = molGroup;

    // Hệ thống Hạt Năng Lượng (Energy Reaction Particles)
    const particleCount = 80;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = [];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 4;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      particleVelocities.push({
        x: (Math.random() - 0.5) * 0.04,
        y: (Math.random() - 0.5) * 0.04,
        z: (Math.random() - 0.5) * 0.04
      });
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.12,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = { mesh: particles, velocities: particleVelocities };

    // Vòng Sóng Xung Kích Phản Ứng (Shockwave Ring)
    const ringGeo = new THREE.RingGeometry(0.1, 0.25, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    const shockwave = new THREE.Mesh(ringGeo, ringMat);
    scene.add(shockwave);
    shockwaveRef.current = shockwave;

    // Animation Loop
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Tự xoay khi không có phản ứng
      if (autoRotate && molGroup && reactionPhase === 'idle') {
        molGroup.rotation.y += 0.006;
      }

      // Hoạt cảnh hạt năng lượng khi phản ứng nổ ra
      if (particlesRef.current) {
        const { mesh, velocities } = particlesRef.current;
        const posAttr = mesh.geometry.attributes.position;
        if (reactionPhase === 'heating' || reactionPhase === 'breaking' || reactionPhase === 'recombining') {
          mesh.material.opacity = Math.min(1, mesh.material.opacity + 0.08);
          for (let i = 0; i < particleCount; i++) {
            posAttr.array[i * 3] += velocities[i].x * 1.5;
            posAttr.array[i * 3 + 1] += velocities[i].y * 1.5;
            posAttr.array[i * 3 + 2] += velocities[i].z * 1.5;
            if (Math.abs(posAttr.array[i * 3]) > 4) posAttr.array[i * 3] *= -0.2;
            if (Math.abs(posAttr.array[i * 3 + 1]) > 4) posAttr.array[i * 3 + 1] *= -0.2;
            if (Math.abs(posAttr.array[i * 3 + 2]) > 4) posAttr.array[i * 3 + 2] *= -0.2;
          }
          posAttr.needsUpdate = true;
        } else {
          mesh.material.opacity = Math.max(0, mesh.material.opacity - 0.04);
        }
      }

      // Hiệu ứng sóng năng lượng Shockwave lan tỏa khi hoàn tất
      if (shockwaveRef.current) {
        if (reactionPhase === 'done' && shockwaveRef.current.scale.x < 15) {
          shockwaveRef.current.scale.x += 0.35;
          shockwaveRef.current.scale.y += 0.35;
          shockwaveRef.current.material.opacity = Math.max(0, 1 - shockwaveRef.current.scale.x / 15);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Mouse Controls & 3D Hover Raycasting
    const dom = renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseDown = (e) => {
      isDraggingRef.current = true;
      previousMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      if (isDraggingRef.current && molGroup) {
        const deltaX = e.clientX - previousMousePosRef.current.x;
        const deltaY = e.clientY - previousMousePosRef.current.y;
        molGroup.rotation.y += deltaX * 0.008;
        molGroup.rotation.x += deltaY * 0.008;
        previousMousePosRef.current = { x: e.clientX, y: e.clientY };
        dom.style.cursor = 'grabbing';
        return;
      }

      // Khi không kéo chuột, thực hiện Raycasting để hover nguyên tử
      if (atomMeshesRef.current.length > 0) {
        const rect = dom.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(atomMeshesRef.current);
        if (intersects.length > 0) {
          dom.style.cursor = 'pointer';
          const hitMesh = intersects[0].object;
          const hitIdx = hitMesh.userData.index;

          atomMeshesRef.current.forEach(m => {
            if (m === hitMesh) {
              m.scale.set(1.18, 1.18, 1.18);
            } else {
              m.scale.set(1.0, 1.0, 1.0);
            }
          });

          if (hoveredAtomIdxRef.current !== hitIdx) {
            hoveredAtomIdxRef.current = hitIdx;
            setHoveredAtom(hitMesh.userData.atom);
            playSound.hover?.();
          }
        } else {
          dom.style.cursor = 'grab';
          atomMeshesRef.current.forEach(m => m.scale.set(1.0, 1.0, 1.0));
          if (hoveredAtomIdxRef.current !== null) {
            hoveredAtomIdxRef.current = null;
            setHoveredAtom(null);
          }
        }
      } else {
        dom.style.cursor = 'grab';
      }
    };

    const handleMouseUp = () => { 
      isDraggingRef.current = false; 
      dom.style.cursor = 'grab';
    };

    const handleMouseLeave = () => {
      isDraggingRef.current = false;
      atomMeshesRef.current.forEach(m => m.scale.set(1.0, 1.0, 1.0));
      hoveredAtomIdxRef.current = null;
      setHoveredAtom(null);
      dom.style.cursor = 'grab';
    };

    const handleWheel = (e) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.005;
      camera.position.z = Math.max(2.5, Math.min(18, camera.position.z));
    };

    const handleClick = (e) => {
      if (activeTab !== 'builder') return;
      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(atomMeshesRef.current);
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const clickedIdx = hitMesh.userData.index;
        handleAtomSelect(clickedIdx);
      }
    };

    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('mouseleave', handleMouseLeave);
    dom.addEventListener('wheel', handleWheel, { passive: false });
    dom.addEventListener('click', handleClick);

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('mouseleave', handleMouseLeave);
      dom.removeEventListener('wheel', handleWheel);
      dom.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [isOpen, autoRotate, activeTab, reactionPhase]);

  // ─── DỰNG HÌNH CHO TAB 1: THƯ VIỆN PHÂN TỬ ────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'library' || !moleculeGroupRef.current || !activeMol) return;
    const group = moleculeGroupRef.current;
    clearGroup(group);
    atomMeshesRef.current = [];

    // 1. Atoms
    activeMol.atoms.forEach((atom, idx) => {
      let r = atom.radius;
      if (viewStyle === 'space_filling') r *= 1.8;
      else if (viewStyle === 'wireframe') r *= 0.5;

      const sphereGeo = new THREE.SphereGeometry(r, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: atom.color,
        roughness: 0.25,
        metalness: 0.15,
        wireframe: viewStyle === 'wireframe'
      });
      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.set(...atom.pos);
      mesh.userData = { atom, index: idx };
      group.add(mesh);
    });

    // 2. Covalent/Ionic Bonds
    if (viewStyle !== 'space_filling' && activeMol.bonds) {
      activeMol.bonds.forEach(bond => {
        renderBondCylinder(group, activeMol.atoms[bond.from].pos, activeMol.atoms[bond.to].pos, viewStyle);
      });
    }

    // 3. Hydrogen Bonds
    if (activeMol.hBonds) {
      activeMol.hBonds.forEach(hb => {
        renderHydrogenBond(group, activeMol.atoms[hb.from].pos, activeMol.atoms[hb.to].pos);
      });
    }
  }, [activeTab, activeMol, viewStyle]);

  // ─── DỰNG HÌNH CHO TAB 2: XƯỞNG LẮP GHÉP & PHẢN ỨNG ────────────────────────
  useEffect(() => {
    if (activeTab !== 'builder' || !moleculeGroupRef.current) return;
    const group = moleculeGroupRef.current;
    clearGroup(group);
    atomMeshesRef.current = [];

    // 1. Dựng các nguyên tử do học sinh tự tạo
    builderAtoms.forEach((atom, idx) => {
      const isSelected = selectedAtomIdx === idx;
      const sphereGeo = new THREE.SphereGeometry(atom.radius, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: atom.color,
        roughness: 0.25,
        metalness: 0.2,
        emissive: isSelected ? new THREE.Color(0x38bdf8) : (reactionPhase === 'heating' ? new THREE.Color(0xff4400) : new THREE.Color(0x000000)),
        emissiveIntensity: isSelected ? 0.6 : (reactionPhase === 'heating' ? 0.7 : 0)
      });
      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.set(...atom.pos);
      mesh.userData = { atom, index: idx };
      group.add(mesh);
      atomMeshesRef.current.push(mesh);

      // Vòng tròn hào quang phát sáng nguyên tử đang chọn
      if (isSelected) {
        const ringGeo = new THREE.RingGeometry(atom.radius * 1.3, atom.radius * 1.5, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(...atom.pos);
        group.add(ring);
      }
    });

    // 2. Dựng các liên kết (trừ khi đang ở giai đoạn đứt gãy)
    if (reactionPhase !== 'breaking') {
      builderBonds.forEach(bond => {
        if (builderAtoms[bond.from] && builderAtoms[bond.to]) {
          const p1 = builderAtoms[bond.from].pos;
          const p2 = builderAtoms[bond.to].pos;
          if (bond.type === 'hbond') {
            renderHydrogenBond(group, p1, p2);
          } else {
            renderBondCylinder(group, p1, p2, viewStyle, bond.type);
          }
        }
      });
    }
  }, [activeTab, builderAtoms, builderBonds, selectedAtomIdx, reactionPhase, viewStyle]);

  // ─── THREE.JS HELPER FUNCTIONS ────────────────────────────────────────────
  function clearGroup(group) {
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }
  }

  function renderBondCylinder(group, pos1, pos2, style, type = 'single') {
    const p1 = new THREE.Vector3(...pos1);
    const p2 = new THREE.Vector3(...pos2);
    const dist = p1.distanceTo(p2);
    const dir = new THREE.Vector3().subVectors(p2, p1).normalize();

    let cylRadius = style === 'wireframe' ? 0.04 : 0.08;
    let bondColor = '#94a3b8';
    if (type === 'ionic') bondColor = '#c084fc';
    if (type === 'double') cylRadius = 0.12;
    if (type === 'triple') cylRadius = 0.15;

    const cylGeo = new THREE.CylinderGeometry(cylRadius, cylRadius, dist, 16);
    const cylMat = new THREE.MeshStandardMaterial({
      color: bondColor,
      roughness: 0.4,
      metalness: 0.1
    });

    const bondMesh = new THREE.Mesh(cylGeo, cylMat);
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    bondMesh.position.copy(mid);

    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    bondMesh.quaternion.copy(quat);

    group.add(bondMesh);
  }

  function renderHydrogenBond(group, pos1, pos2) {
    const p1 = new THREE.Vector3(...pos1);
    const p2 = new THREE.Vector3(...pos2);
    const dist = p1.distanceTo(p2);
    const dir = new THREE.Vector3().subVectors(p2, p1).normalize();

    const cylGeo = new THREE.CylinderGeometry(0.05, 0.05, dist, 12);
    const cylMat = new THREE.MeshBasicMaterial({
      color: '#facc15',
      transparent: true,
      opacity: 0.85
    });

    const hbMesh = new THREE.Mesh(cylGeo, cylMat);
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    hbMesh.position.copy(mid);

    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    hbMesh.quaternion.copy(quat);

    group.add(hbMesh);
  }

  // ─── THAO TÁC CỦA HỌC SINH (INTERACTIVE BUILDER ACTIONS) ───────────────────
  // Thêm nguyên tử đơn lẻ vào không gian 3D
  const addAtom = (symbol) => {
    const el = ELEMENT_DATA[symbol];
    if (!el) return;

    setShowNoReactionWarning(false);
    const count = builderAtoms.length;
    const angle = (count * 1.15) % (2 * Math.PI);
    const dist = 0.8 + (count * 0.35) % 2.2;
    const x = Number((Math.cos(angle) * dist).toFixed(2));
    const y = Number((Math.sin(angle) * dist).toFixed(2));
    const z = Number(((count % 3 - 1) * 0.3).toFixed(2));

    const newAtom = {
      id: `atom_${Date.now()}_${count}`,
      element: el.symbol,
      name: el.name,
      pos: [x, y, z],
      color: el.color,
      radius: el.radius,
      valence: el.valence
    };

    setBuilderAtoms(prev => [...prev, newAtom]);
    playSound.click?.();
  };

  // Thêm nhanh các cặp chất phản ứng mẫu
  const addQuickCompound = (type) => {
    setShowNoReactionWarning(false);
    clearBuilder();

    if (type === 'h2_o2') {
      // 2 H2 + O2
      setBuilderAtoms([
        { id: 'h1', element: 'H', name: 'Hydro', pos: [-2.2, 0.4, 0], color: '#ffffff', radius: 0.30, valence: 1 },
        { id: 'h2', element: 'H', name: 'Hydro', pos: [-2.2, -0.4, 0], color: '#ffffff', radius: 0.30, valence: 1 },
        { id: 'h3', element: 'H', name: 'Hydro', pos: [-1.2, 0.4, 0], color: '#ffffff', radius: 0.30, valence: 1 },
        { id: 'h4', element: 'H', name: 'Hydro', pos: [-1.2, -0.4, 0], color: '#ffffff', radius: 0.30, valence: 1 },
        { id: 'o1', element: 'O', name: 'Oxy', pos: [1.6, 0.6, 0], color: '#ef4444', radius: 0.45, valence: 2 },
        { id: 'o2', element: 'O', name: 'Oxy', pos: [1.6, -0.6, 0], color: '#ef4444', radius: 0.45, valence: 2 }
      ]);
      setBuilderBonds([
        { from: 0, to: 1, type: 'single' },
        { from: 2, to: 3, type: 'single' },
        { from: 4, to: 5, type: 'double' }
      ]);
    } else if (type === 'na_cl2') {
      // 2 Na + Cl2
      setBuilderAtoms([
        { id: 'na1', element: 'Na', name: 'Natri', pos: [-2.0, 0.5, 0], color: '#a855f7', radius: 0.50, valence: 1 },
        { id: 'na2', element: 'Na', name: 'Natri', pos: [-2.0, -0.5, 0], color: '#a855f7', radius: 0.50, valence: 1 },
        { id: 'cl1', element: 'Cl', name: 'Clo', pos: [1.5, 0.6, 0], color: '#22c55e', radius: 0.52, valence: 1 },
        { id: 'cl2', element: 'Cl', name: 'Clo', pos: [1.5, -0.6, 0], color: '#22c55e', radius: 0.52, valence: 1 }
      ]);
      setBuilderBonds([{ from: 2, to: 3, type: 'single' }]);
    } else if (type === 'c_o2') {
      // C + O2
      setBuilderAtoms([
        { id: 'c1', element: 'C', name: 'Cacbon', pos: [-1.5, 0, 0], color: '#475569', radius: 0.45, valence: 4 },
        { id: 'o1', element: 'O', name: 'Oxy', pos: [1.2, 0.6, 0], color: '#ef4444', radius: 0.45, valence: 2 },
        { id: 'o2', element: 'O', name: 'Oxy', pos: [1.2, -0.6, 0], color: '#ef4444', radius: 0.45, valence: 2 }
      ]);
      setBuilderBonds([{ from: 1, to: 2, type: 'double' }]);
    } else if (type === 'fe_s') {
      // Fe + S
      setBuilderAtoms([
        { id: 'fe1', element: 'Fe', name: 'Sắt', pos: [-1.2, 0, 0], color: '#f97316', radius: 0.50, valence: 3 },
        { id: 's1', element: 'S', name: 'Lưu huỳnh', pos: [1.2, 0, 0], color: '#eab308', radius: 0.48, valence: 2 }
      ]);
      setBuilderBonds([]);
    } else if (type === 'ch4_2o2') {
      // CH4 + 2 O2
      setBuilderAtoms([
        { id: 'c1', element: 'C', name: 'Cacbon', pos: [-1.8, 0, 0], color: '#475569', radius: 0.45, valence: 4 },
        { id: 'h1', element: 'H', name: 'Hydro', pos: [-2.4, 0.6, 0], color: '#ffffff', radius: 0.30, valence: 1 },
        { id: 'h2', element: 'H', name: 'Hydro', pos: [-1.2, 0.6, 0], color: '#ffffff', radius: 0.30, valence: 1 },
        { id: 'h3', element: 'H', name: 'Hydro', pos: [-2.4, -0.6, 0], color: '#ffffff', radius: 0.30, valence: 1 },
        { id: 'h4', element: 'H', name: 'Hydro', pos: [-1.2, -0.6, 0], color: '#ffffff', radius: 0.30, valence: 1 },
        { id: 'o1', element: 'O', name: 'Oxy', pos: [1.2, 0.9, 0], color: '#ef4444', radius: 0.45, valence: 2 },
        { id: 'o2', element: 'O', name: 'Oxy', pos: [2.0, 0.9, 0], color: '#ef4444', radius: 0.45, valence: 2 },
        { id: 'o3', element: 'O', name: 'Oxy', pos: [1.2, -0.9, 0], color: '#ef4444', radius: 0.45, valence: 2 },
        { id: 'o4', element: 'O', name: 'Oxy', pos: [2.0, -0.9, 0], color: '#ef4444', radius: 0.45, valence: 2 }
      ]);
      setBuilderBonds([
        { from: 0, to: 1, type: 'single' }, { from: 0, to: 2, type: 'single' },
        { from: 0, to: 3, type: 'single' }, { from: 0, to: 4, type: 'single' },
        { from: 5, to: 6, type: 'double' }, { from: 7, to: 8, type: 'double' }
      ]);
    } else if (type === 'h2_cl2') {
      // H2 + Cl2
      setBuilderAtoms([
        { id: 'h1', element: 'H', name: 'Hydro', pos: [-1.8, 0.4, 0], color: '#ffffff', radius: 0.30, valence: 1 },
        { id: 'h2', element: 'H', name: 'Hydro', pos: [-1.8, -0.4, 0], color: '#ffffff', radius: 0.30, valence: 1 },
        { id: 'cl1', element: 'Cl', name: 'Clo', pos: [1.6, 0.6, 0], color: '#22c55e', radius: 0.52, valence: 1 },
        { id: 'cl2', element: 'Cl', name: 'Clo', pos: [1.6, -0.6, 0], color: '#22c55e', radius: 0.52, valence: 1 }
      ]);
      setBuilderBonds([
        { from: 0, to: 1, type: 'single' },
        { from: 2, to: 3, type: 'single' }
      ]);
    } else if (type === 'n2_3h2') {
      // N2 + 3 H2
      setBuilderAtoms([
        { id: 'n1', element: 'N', name: 'Nitơ', pos: [-2.2, 0.5, 0], color: '#3b82f6', radius: 0.42, valence: 3 },
        { id: 'n2', element: 'N', name: 'Nitơ', pos: [-2.2, -0.5, 0], color: '#3b82f6', radius: 0.42, valence: 3 },
        { id: 'h1', element: 'H', name: 'Hydro', pos: [1.2, 1.0, 0], color: '#ffffff', radius: 0.30, valence: 1 },
        { id: 'h2', element: 'H', name: 'Hydro', pos: [1.8, 1.0, 0], color: '#ffffff', radius: 0.30, valence: 1 },
        { id: 'h3', element: 'H', name: 'Hydro', pos: [1.2, 0, 0], color: '#ffffff', radius: 0.30, valence: 1 },
        { id: 'h4', element: 'H', name: 'Hydro', pos: [1.8, 0, 0], color: '#ffffff', radius: 0.30, valence: 1 },
        { id: 'h5', element: 'H', name: 'Hydro', pos: [1.2, -1.0, 0], color: '#ffffff', radius: 0.30, valence: 1 },
        { id: 'h6', element: 'H', name: 'Hydro', pos: [1.8, -1.0, 0], color: '#ffffff', radius: 0.30, valence: 1 }
      ]);
      setBuilderBonds([
        { from: 0, to: 1, type: 'triple' },
        { from: 2, to: 3, type: 'single' },
        { from: 4, to: 5, type: 'single' },
        { from: 6, to: 7, type: 'single' }
      ]);
    }
    playSound.click?.();
  };

  // Click chọn nguyên tử & Tạo liên kết giữa 2 nguyên tử
  const handleAtomSelect = (clickedIdx) => {
    if (selectedAtomIdx === null) {
      setSelectedAtomIdx(clickedIdx);
      playSound.click?.();
    } else if (selectedAtomIdx === clickedIdx) {
      setSelectedAtomIdx(null);
    } else {
      const from = selectedAtomIdx;
      const to = clickedIdx;

      const existingIdx = builderBonds.findIndex(
        b => (b.from === from && b.to === to) || (b.from === to && b.to === from)
      );

      if (existingIdx >= 0) {
        // Đổi loại liên kết: single -> double -> triple -> gỡ bỏ
        setBuilderBonds(prev => {
          const current = prev[existingIdx];
          if (current.type === 'single') {
            const next = [...prev];
            next[existingIdx] = { ...current, type: 'double' };
            return next;
          } else if (current.type === 'double') {
            const next = [...prev];
            next[existingIdx] = { ...current, type: 'triple' };
            return next;
          } else {
            return prev.filter((_, i) => i !== existingIdx);
          }
        });
      } else {
        setBuilderBonds(prev => [...prev, { from, to, type: bondType }]);
      }

      setSelectedAtomIdx(null);
      playSound.click?.();
    }
  };

  // Tự động nối liên kết thông minh
  const autoBond = () => {
    const newBonds = [];
    const usedValence = new Array(builderAtoms.length).fill(0);

    for (let i = 0; i < builderAtoms.length; i++) {
      for (let j = i + 1; j < builderAtoms.length; j++) {
        const a1 = builderAtoms[i];
        const a2 = builderAtoms[j];
        const p1 = new THREE.Vector3(...a1.pos);
        const p2 = new THREE.Vector3(...a2.pos);
        const dist = p1.distanceTo(p2);

        if (dist <= 2.2 && usedValence[i] < a1.valence && usedValence[j] < a2.valence) {
          const isIonic = (a1.element === 'Na' && a2.element === 'Cl') || (a1.element === 'Cl' && a2.element === 'Na');
          const isBioPair = (a1.element === 'A' && a2.element === 'T') || (a1.element === 'G' && a2.element === 'X');

          newBonds.push({
            from: i,
            to: j,
            type: isIonic ? 'ionic' : (isBioPair ? 'hbond' : 'single')
          });
          usedValence[i]++;
          usedValence[j]++;
        }
      }
    }
    setBuilderBonds(newBonds);
    playSound.click?.();
  };

  // ─── TÍNH TOÁN HÓA TRỊ & QUY TẮC BÁT TỬ (OCTET) CHO HỌC SINH ──────────────
  const getAtomValenceInfo = (atomIdx) => {
    if (!builderAtoms[atomIdx]) return null;
    const atom = builderAtoms[atomIdx];
    let used = 0;
    builderBonds.forEach(b => {
      if (b.from === atomIdx || b.to === atomIdx) {
        if (b.type === 'double') used += 2;
        else if (b.type === 'triple') used += 3;
        else used += 1;
      }
    });

    const max = atom.valence || 1;
    return {
      used,
      max,
      satisfied: used === max,
      remaining: Math.max(0, max - used),
      isOver: used > max
    };
  };

  const getSystemOctetStatus = () => {
    if (builderAtoms.length === 0) return null;
    let allSatisfied = true;
    let totalMissing = 0;
    let hasOver = false;

    builderAtoms.forEach((_, idx) => {
      const info = getAtomValenceInfo(idx);
      if (info) {
        if (info.isOver) hasOver = true;
        if (!info.satisfied) {
          allSatisfied = false;
          totalMissing += info.remaining;
        }
      }
    });

    return { allSatisfied, totalMissing, hasOver };
  };

  // Tính năng bão hòa Hydro tự động (+H) cho học sinh ghép mạch Hữu cơ
  const autoSaturateHydrogen = () => {
    const newAtoms = [...builderAtoms];
    const newBonds = [...builderBonds];
    let addedCount = 0;

    builderAtoms.forEach((atom, parentIdx) => {
      const info = getAtomValenceInfo(parentIdx);
      if (!info || info.remaining <= 0) return;

      const parentPos = atom.pos;
      for (let k = 0; k < info.remaining; k++) {
        const hIdx = newAtoms.length;
        const offsetAngle = ((k + 1) * (2 * Math.PI / Math.max(1, info.remaining))) + parentIdx * 0.6;
        const dist = 0.95;
        const hPos = [
          Number((parentPos[0] + Math.cos(offsetAngle) * dist).toFixed(2)),
          Number((parentPos[1] + Math.sin(offsetAngle) * dist).toFixed(2)),
          Number((parentPos[2] + ((k % 2 === 0 ? 1 : -1) * 0.35)).toFixed(2))
        ];

        newAtoms.push({
          id: `h_sat_${Date.now()}_${hIdx}`,
          element: 'H',
          name: 'Hydro',
          pos: hPos,
          color: '#ffffff',
          radius: 0.30,
          valence: 1
        });

        newBonds.push({
          from: parentIdx,
          to: hIdx,
          type: 'single'
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setBuilderAtoms(newAtoms);
      setBuilderBonds(newBonds);
      playSound.success?.();
    }
  };

  // Điều khiển Camera 3D cho học sinh dùng Trackpad máy tính trường
  const handleZoomIn = () => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = Math.max(2.5, cameraRef.current.position.z - 0.8);
    playSound.click?.();
  };

  const handleZoomOut = () => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = Math.min(18, cameraRef.current.position.z + 0.8);
    playSound.click?.();
  };

  const handleResetCamera = () => {
    if (!cameraRef.current || !moleculeGroupRef.current) return;
    cameraRef.current.position.set(0, 0, 7.5);
    cameraRef.current.lookAt(0, 0, 0);
    moleculeGroupRef.current.rotation.set(0, 0, 0);
    playSound.click?.();
  };

  // Xóa toàn bộ bàn làm việc
  const clearBuilder = () => {
    setBuilderAtoms([]);
    setBuilderBonds([]);
    setSelectedAtomIdx(null);
    setReactionPhase('idle');
    setLastExecutedReaction(null);
    setShowNoReactionWarning(false);
  };

  // ─── KÍCH HOẠT PHẢN ỨNG HÓA HỌC 3D VỚI HIỆU ỨNG PT & KQ HOÀN CHỈNH ─────────
  const triggerReaction = () => {
    const reaction = detectReactionFromAtoms(builderAtoms);
    if (!reaction || reaction.id === 'no_reaction') {
      setShowNoReactionWarning(true);
      playSound.click?.();
      return;
    }

    setShowNoReactionWarning(false);
    setLastExecutedReaction(reaction);
    setReactionPhase('heating');
    playSound.click?.();

    // 1. Giai đoạn 1: Nung nóng / Kích hoạt năng lượng (800ms)
    // Tăng ánh sáng sân khấu sang màu đỏ lửa
    if (ambientLightRef.current) {
      ambientLightRef.current.color.setHex(0xff5500);
      ambientLightRef.current.intensity = 2.0;
    }

    setTimeout(() => {
      setReactionPhase('breaking');

      // 2. Giai đoạn 2: Bẻ gãy các liên kết cũ (700ms)
      setTimeout(() => {
        setReactionPhase('recombining');

        // 3. Giai đoạn 3: Các nguyên tử bay mượt mà vào vị trí sản phẩm mới (Smooth LERP)
        const startPositions = builderAtoms.map(a => [...a.pos]);
        const targetPositions = reaction.products.map(p => [...p.pos]);
        const startTime = Date.now();
        const duration = 1200;

        const interval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(1, elapsed / duration);
          // EaseOutBack cho cảm giác va chạm nảy sinh động
          const c1 = 1.70158;
          const c3 = c1 + 1;
          const ease = 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2);

          setBuilderAtoms(prev => prev.map((atom, idx) => {
            if (!targetPositions[idx]) return atom;
            const sp = startPositions[idx] || [0, 0, 0];
            const tp = targetPositions[idx];
            return {
              ...atom,
              pos: [
                sp[0] + (tp[0] - sp[0]) * Math.min(1.05, ease),
                sp[1] + (tp[1] - sp[1]) * Math.min(1.05, ease),
                sp[2] + (tp[2] - sp[2]) * Math.min(1.05, ease)
              ]
            };
          }));

          if (progress >= 1) {
            clearInterval(interval);
            // 4. Giai đoạn 4: Tạo liên kết sản phẩm, nổ sóng xung kích & Hoàn tất
            setBuilderBonds(reaction.productBonds.map(b => ({ ...b })));
            setReactionPhase('done');

            // Reset sóng xung kích Shockwave
            if (shockwaveRef.current) {
              shockwaveRef.current.scale.set(0.1, 0.1, 0.1);
              shockwaveRef.current.material.opacity = 1.0;
            }

            // Trả lại ánh sáng studio tự nhiên
            if (ambientLightRef.current) {
              ambientLightRef.current.color.setHex(0xffffff);
              ambientLightRef.current.intensity = 0.9;
            }

            playSound.success?.();
          }
        }, 30);

      }, 700);
    }, 800);
  };

  // Xem lại phản ứng (Replay)
  const replayReaction = () => {
    if (!lastExecutedReaction) return;
    setReactionPhase('idle');
    setBuilderAtoms(lastExecutedReaction.products.map((p, idx) => ({
      id: `prod_${idx}`,
      element: p.element,
      name: ELEMENT_DATA[p.element]?.name || p.element,
      pos: [...p.pos],
      color: ELEMENT_DATA[p.element]?.color || '#ffffff',
      radius: ELEMENT_DATA[p.element]?.radius || 0.4,
      valence: ELEMENT_DATA[p.element]?.valence || 1
    })));
  };

  if (!isOpen) return null;

  // Bảng nguyên tố theo môn học
  const elementKeys = isChem ? ['H', 'O', 'C', 'N', 'Na', 'Cl', 'Fe', 'S'] : ['A', 'T', 'G', 'X'];

  return (
    <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-6xl h-[92vh] bg-[#0c1017] border border-cyan-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
        
        {/* Nút đóng modal */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700"
          title="Đóng Kính hiển vi"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── CỘT TRÁI: ĐIỀU HƯỚNG & XƯỞNG LẮP GHÉP (CHỈ HÓA HOẶC CHỈ SINH) ── */}
        <div className="w-full md:w-84 border-r border-slate-800/80 bg-[#090d14]/90 flex flex-col p-4 shrink-0 overflow-y-auto">
          {/* Header Phòng Lab */}
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800 mb-3">
            <div className={`p-2 rounded-xl ${isChem ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
              {isChem ? <FlaskConical className="w-5 h-5 animate-pulse" /> : <Dna className="w-5 h-5 animate-pulse" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                {isChem ? 'Kính Hiển Vi Hóa Học' : 'Kính Hiển Vi Sinh Học'}
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                {isChem ? 'Xưởng Lắp Ghép & Phản Ứng 3D' : 'Mô Hình Di Truyền & ADN'}
              </p>
            </div>
          </div>

          {/* 2 Tabs Chế độ: Thư Viện vs Xưởng Lắp Ghép & Phản Ứng */}
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 mb-3">
            <button
              onClick={() => setActiveTab('library')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'library'
                  ? (isChem ? 'bg-amber-500 text-black shadow-md' : 'bg-emerald-500 text-black shadow-md')
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Thư Viện
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'builder'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Atom className="w-3.5 h-3.5" /> Xưởng Phản Ứng
            </button>
          </div>

          {/* NỘI DUNG TAB 1: THƯ VIỆN PHÂN TỬ CHUẨN */}
          {activeTab === 'library' && (
            <div className="space-y-3">
              <div>
                <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${isChem ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isChem ? <FlaskConical className="w-3.5 h-3.5" /> : <Dna className="w-3.5 h-3.5" />}
                  {isChem ? 'Danh Sách Phân Tử Hóa Học' : 'Mô Hình Sinh Học Di Truyền'}
                </div>
                <div className="space-y-1.5">
                  {Object.values(MOLECULES).filter(m => m.category === (isChem ? 'chem' : 'bio')).map(mol => (
                    <button
                      key={mol.id}
                      onClick={() => setSelectedMoleculeKey(mol.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer border ${
                        selectedMoleculeKey === mol.id
                          ? (isChem 
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm' 
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm')
                          : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 border-transparent hover:border-slate-800'
                      }`}
                    >
                      <span className="font-semibold">{mol.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">{mol.formula}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* NỘI DUNG TAB 2: TỰ DO LẮP GHÉP NGUYÊN TỐ & TẠO PHẢN ỨNG */}
          {activeTab === 'builder' && (
            <div className="space-y-3.5">
              {/* Bảng chọn nguyên tố để thêm */}
              <div>
                <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Atom className="w-3.5 h-3.5" /> Bảng Nguyên Tố Tự Do</span>
                  <span className="text-[9px] text-slate-400 font-normal">Click để thả vào 3D</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {elementKeys.map(sym => {
                    const el = ELEMENT_DATA[sym];
                    return (
                      <button
                        key={sym}
                        onClick={() => addAtom(sym)}
                        className="p-2 rounded-xl bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 flex flex-col items-center justify-center transition-all cursor-pointer group"
                        title={`${el.name} (Hóa trị ${el.valence}, M=${el.mass})`}
                      >
                        <span className="text-base font-black" style={{ color: el.color }}>{sym}</span>
                        <span className="text-[9px] text-slate-400 group-hover:text-slate-200 truncate w-full text-center">{el.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nút thả nhanh các cặp chất phản ứng */}
              <div>
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> Thả Nhanh Cặp Phản Ứng
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <button
                    onClick={() => addQuickCompound('h2_o2')}
                    className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left transition-all cursor-pointer"
                  >
                    <div className="font-bold text-white">2H₂ + O₂</div>
                    <div className="text-[9px] text-cyan-400">Tạo Nước H₂O</div>
                  </button>
                  <button
                    onClick={() => addQuickCompound('na_cl2')}
                    className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left transition-all cursor-pointer"
                  >
                    <div className="font-bold text-white">2Na + Cl₂</div>
                    <div className="text-[9px] text-purple-400">Tạo Muối NaCl</div>
                  </button>
                  <button
                    onClick={() => addQuickCompound('c_o2')}
                    className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left transition-all cursor-pointer"
                  >
                    <div className="font-bold text-white">C + O₂</div>
                    <div className="text-[9px] text-orange-400">Cháy tạo CO₂</div>
                  </button>
                  <button
                    onClick={() => addQuickCompound('fe_s')}
                    className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left transition-all cursor-pointer"
                  >
                    <div className="font-bold text-white">Fe + S</div>
                    <div className="text-[9px] text-amber-400">Tạo FeS đen</div>
                  </button>
                  <button
                    onClick={() => addQuickCompound('h2_cl2')}
                    className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left transition-all cursor-pointer"
                  >
                    <div className="font-bold text-white">H₂ + Cl₂</div>
                    <div className="text-[9px] text-emerald-400">Tạo Khí HCl</div>
                  </button>
                  <button
                    onClick={() => addQuickCompound('n2_3h2')}
                    className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left transition-all cursor-pointer"
                  >
                    <div className="font-bold text-white">N₂ + 3H₂</div>
                    <div className="text-[9px] text-blue-400">Tổng hợp NH₃</div>
                  </button>
                </div>
              </div>

              {/* Tùy chọn kiểu liên kết nối */}
              <div>
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-cyan-400" /> Kiểu Liên Kết Nối</span>
                  <span className="text-[9px] text-cyan-300">Click 2 nguyên tử để nối</span>
                </div>
                <div className="grid grid-cols-3 gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setBondType('single')}
                    className={`py-1 rounded-lg font-medium cursor-pointer transition-all ${
                      bondType === 'single' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Đơn (-)
                  </button>
                  <button
                    onClick={() => setBondType('double')}
                    className={`py-1 rounded-lg font-medium cursor-pointer transition-all ${
                      bondType === 'double' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Đôi (=)
                  </button>
                  <button
                    onClick={() => setBondType('triple')}
                    className={`py-1 rounded-lg font-medium cursor-pointer transition-all ${
                      bondType === 'triple' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Ba (≡)
                  </button>
                </div>
              </div>

              {/* Nút hành động bàn làm việc */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex gap-2">
                  <button
                    onClick={autoBond}
                    disabled={builderAtoms.length < 2}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                    title="Tự động nối các nguyên tử gần nhau theo hóa trị"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Tự Nối Liên Kết
                  </button>
                  <button
                    onClick={clearBuilder}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium cursor-pointer transition-all"
                    title="Xóa hết bàn làm việc"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={autoSaturateHydrogen}
                  disabled={builderAtoms.length === 0}
                  className="w-full py-1.5 px-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-40 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-cyan-500/30"
                  title="Tự động gắn Hydro vào các hóa trị còn trống (Bão hòa)"
                >
                  <Atom className="w-3.5 h-3.5 text-cyan-400" /> + Bão Hòa Hydro (Ghép H)
                </button>
              </div>

              {/* Nút Kích hoạt phản ứng chính */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={triggerReaction}
                  disabled={builderAtoms.length === 0 || reactionPhase !== 'idle'}
                  className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xl ${
                    inferredReaction && inferredReaction.id !== 'no_reaction'
                      ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white shadow-orange-500/30 hover:brightness-110 animate-pulse border border-orange-400/50'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  {reactionPhase === 'idle' && (
                    inferredReaction && inferredReaction.id !== 'no_reaction' 
                      ? '🔥 TIẾN HÀNH PHẢN ỨNG HÓA HỌC' 
                      : 'THỬ TẠO PHẢN ỨNG'
                  )}
                  {reactionPhase === 'heating' && 'Đang Nung Nóng Phân Tử...'}
                  {reactionPhase === 'breaking' && 'Bẻ Gãy Liên Kết Cũ...'}
                  {reactionPhase === 'recombining' && 'Tạo Liên Kết Mới...'}
                  {reactionPhase === 'done' && '✓ Phản Ứng Đã Hoàn Tất!'}
                </button>

                {showNoReactionWarning && (
                  <div className="mt-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-[11px] text-rose-300 leading-relaxed flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>Hỗn hợp này không phản ứng trong điều kiện thường. Hãy thử thêm Oxy (O), Clo (Cl) hoặc Lưu huỳnh (S) để tạo phản ứng!</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── KHÔNG GIAN TRUNG TÂM: 3D WEBGL VIEWER & HIỆU ỨNG PHƯƠNG TRÌNH ── */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Controls Bar */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700/60 shadow-lg">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                autoRotate ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Bật/Tắt tự động xoay"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tự Xoay</span>
            </button>

            <div className="w-[1px] h-4 bg-slate-700 mx-1" />

            {/* Kiểu hiển thị */}
            <button
              onClick={() => setViewStyle('ball_stick')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewStyle === 'ball_stick' ? 'bg-slate-700 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cầu & Que
            </button>
            <button
              onClick={() => setViewStyle('space_filling')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewStyle === 'space_filling' ? 'bg-slate-700 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Không Gian
            </button>
            <button
              onClick={() => setViewStyle('wireframe')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewStyle === 'wireframe' ? 'bg-slate-700 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Khung Que
            </button>
          </div>

          {/* ⚡ HIỆU ỨNG PHƯƠNG TRÌNH PHẢN ỨNG NỔI BẬT (HOLOGRAM REACTION CARD) ⚡ */}
          {activeTab === 'builder' && (lastExecutedReaction || (inferredReaction && inferredReaction.id !== 'no_reaction')) && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 max-w-xl w-[92%] bg-slate-950/90 backdrop-blur-xl border border-amber-500/50 rounded-2xl p-3.5 shadow-2xl shadow-orange-500/20 text-center animate-in zoom-in-95 duration-200">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1.5 mb-1">
                <Flame className="w-3.5 h-3.5 text-orange-400 animate-bounce" /> 
                {reactionPhase === 'done' 
                  ? '✓ PHẢN ỨNG HÓA HỌC ĐÃ HOÀN TẤT (HIỆU SUẤT 100%)' 
                  : (reactionPhase === 'idle' ? 'PHÁT HIỆN PHẢN ỨNG TIỀM NĂNG TỪ CÁC NGUYÊN TỐ' : '⚡ ĐANG TIẾN HÀNH PHẢN ỨNG 3D...')}
              </div>
              
              {/* Phương trình hóa học chữ to phát sáng neon */}
              <div className="text-lg md:text-xl font-black font-mono tracking-wide py-1 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400">
                {(lastExecutedReaction || inferredReaction).equation}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-1 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  {(lastExecutedReaction || inferredReaction).condition}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  {(lastExecutedReaction || inferredReaction).enthalpy.split('(')[0]}
                </span>
              </div>
            </div>
          )}

          {/* Floating Hover Tooltip trên Canvas 3D */}
          {hoveredAtom && (
            <div className="absolute top-20 left-4 z-30 pointer-events-none bg-slate-950/90 backdrop-blur-md border border-cyan-500/50 rounded-2xl px-3 py-2 shadow-xl flex items-center gap-2.5 animate-in fade-in duration-150">
              <div 
                className="w-4 h-4 rounded-full border border-white/40 shadow-sm shrink-0"
                style={{ backgroundColor: hoveredAtom.color }} 
              />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{hoveredAtom.name} ({hoveredAtom.element})</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                    Hóa trị {hoveredAtom.valence}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Click để chọn • Click nguyên tử thứ hai để nối liên kết
                </div>
              </div>
            </div>
          )}

          {/* Canvas Mount */}
          <div ref={mountRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" />

          {/* HUD Điều Khiển Camera Trực Quan Cho Học Sinh (Trackpad Friendly) */}
          <div className="absolute bottom-5 right-5 z-20 flex flex-col gap-1.5 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/60 shadow-xl">
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-cyan-500 hover:text-black text-slate-200 transition-all cursor-pointer flex items-center justify-center"
              title="Phóng to (+)"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-cyan-500 hover:text-black text-slate-200 transition-all cursor-pointer flex items-center justify-center"
              title="Thu nhỏ (-)"
            >
              <span className="text-base font-bold leading-none block px-0.5">−</span>
            </button>
            <button
              onClick={handleResetCamera}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-cyan-500 hover:text-black text-slate-200 transition-all cursor-pointer flex items-center justify-center"
              title="Đặt lại góc nhìn ban đầu (Reset)"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Chú thích thao tác góc dưới */}
          <div className="absolute bottom-4 left-4 z-20 text-[10px] text-slate-400 bg-slate-900/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 pointer-events-none flex items-center gap-2">
            <span>🖱️ Kéo chuột xoay 360° • Cuộn chuột phóng to/thu nhỏ</span>
            {activeTab === 'builder' && (
              <span className="text-cyan-400 font-semibold">• Click lần lượt 2 nguyên tử để ghép liên kết</span>
            )}
          </div>
        </div>

        {/* ── CỘT PHẢI: BẢNG KẾT QUẢ KHOA HỌC CHUẨN XÁC VÀ CHI TIẾT ── */}
        <div className="w-full md:w-88 border-t md:border-t-0 md:border-l border-slate-800/80 bg-[#090d14]/90 flex flex-col p-5 shrink-0 overflow-y-auto">
          {activeTab === 'library' ? (
            /* Thông số thư viện */
            <div className="space-y-4">
              <div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                  isChem 
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}>
                  {isChem ? 'Hóa Học THPT' : 'Sinh Học 12'}
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">{activeMol.name}</h3>
                <p className={`text-xs font-mono font-bold ${isChem ? 'text-amber-400' : 'text-emerald-400'}`}>{activeMol.formula}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs leading-relaxed text-slate-300">
                {activeMol.desc}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" /> Đặc Điểm Cấu Trúc
                </h4>
                <div className="space-y-2">
                  {activeMol.facts?.map((fact, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{fact}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Khối lượng mol:</span>
                  <span className="font-mono text-slate-200">{activeMol.mass}</span>
                </div>
                <div className="flex justify-between">
                  <span>Số nguyên tử:</span>
                  <span className="font-mono text-slate-200">{activeMol.atoms?.length} nguyên tử</span>
                </div>
              </div>
            </div>
          ) : (
            /* BẢNG KẾT QUẢ PHẢN ỨNG HÓA HỌC CHI TIẾT */
            <div className="space-y-3.5">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase">
                  {isChem ? 'Kết Quả Phản Ứng Hóa Học' : 'Kết Quả Tương Tác Di Truyền'}
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">
                  {lastExecutedReaction 
                    ? lastExecutedReaction.name 
                    : (inferredReaction && inferredReaction.id !== 'no_reaction' ? inferredReaction.name : 'Chưa Kích Hoạt Phản Ứng')}
                </h3>
                {lastExecutedReaction && (
                  <p className="text-xs font-mono text-cyan-400 font-bold mt-0.5">{lastExecutedReaction.equation}</p>
                )}
              </div>

              {/* Thông tin trạng thái bàn thí nghiệm & Thước đo Octet */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-2.5">
                <div className="flex justify-between text-slate-300">
                  <span>Số nguyên tử trên bàn:</span>
                  <span className="font-mono text-cyan-400 font-bold">{builderAtoms.length}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Số liên kết đã ghép:</span>
                  <span className="font-mono text-cyan-400 font-bold">{builderBonds.length}</span>
                </div>

                {/* Huy hiệu Quy tắc Bát tử (Octet) & Độ bền phân tử */}
                {(() => {
                  const octet = getSystemOctetStatus();
                  if (!octet) return null;
                  return (
                    <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                      octet.allSatisfied && builderAtoms.length > 1
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : (octet.hasOver 
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-300')
                    }`}>
                      {octet.allSatisfied && builderAtoms.length > 1 ? (
                        <>
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span><strong>Bền vững (Octet):</strong> Đạt hóa trị bão hòa chuẩn SGK!</span>
                        </>
                      ) : octet.hasOver ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span><strong>Vượt quá hóa trị:</strong> Có nguyên tử vượt liên kết tự nhiên!</span>
                        </>
                      ) : (
                        <>
                          <Info className="w-4 h-4 text-amber-400 shrink-0" />
                          <span><strong>Chưa bão hòa:</strong> Thiếu {octet.totalMissing} liên kết để đạt Octet.</span>
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* Card chi tiết nguyên tử đang được chọn */}
                {selectedAtomIdx !== null && builderAtoms[selectedAtomIdx] && (() => {
                  const selAtom = builderAtoms[selectedAtomIdx];
                  const info = getAtomValenceInfo(selectedAtomIdx);
                  return (
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/40 text-xs space-y-1.5 animate-in fade-in">
                      <div className="flex justify-between items-center text-slate-200">
                        <span className="font-bold flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: selAtom.color }} />
                          {selAtom.name} ({selAtom.element})
                        </span>
                        {info && (
                          <span className={`font-mono font-bold ${info.satisfied ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {info.used} / {info.max} liên kết
                          </span>
                        )}
                      </div>
                      {info && (
                        <>
                          <div className="flex gap-1">
                            {Array.from({ length: info.max }).map((_, i) => (
                              <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full ${
                                  i < info.used ? (info.isOver ? 'bg-rose-500' : 'bg-cyan-400') : 'bg-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {info.satisfied 
                              ? '✓ Đã đạt hóa trị bão hòa chuẩn theo SGK' 
                              : `⚡ Còn thiếu ${info.remaining} liên kết. Click nguyên tử khác để nối!`}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* BẢNG KẾT QUẢ KHOA HỌC (HIỆN TƯỢNG, NHIỆT PHẢN ỨNG, OXI HÓA KHỬ, LIÊN KẾT) */}
              {(lastExecutedReaction || (inferredReaction && inferredReaction.id !== 'no_reaction')) ? (
                (() => {
                  const r = lastExecutedReaction || inferredReaction;
                  return (
                    <div className="space-y-2.5">
                      {/* 1. Hiện tượng thực nghiệm */}
                      <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs space-y-1">
                        <div className="font-bold text-slate-200 flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-cyan-400" /> Hiện Tượng Thực Nghiệm
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {r.phenomenon}
                        </p>
                      </div>

                      {/* 2. Biến thiên Enthalpy */}
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs space-y-1">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5">
                          <Thermometer className="w-3.5 h-3.5 text-orange-400" /> Nhiệt Động Học (Enthalpy)
                        </div>
                        <p className="text-amber-100/90 text-[11px] font-mono leading-relaxed">
                          {r.enthalpy}
                        </p>
                      </div>

                      {/* 3. Bản chất quá trình Oxi hóa - Khử */}
                      <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs space-y-1">
                        <div className="font-bold text-slate-200 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-yellow-400" /> Chuyển Dịch Electron / Số Oxi Hóa
                        </div>
                        <p className="text-slate-300 text-[11px] font-mono leading-relaxed">
                          {r.redox}
                        </p>
                      </div>

                      {/* 4. Bản chất liên kết hóa học sản phẩm */}
                      <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs space-y-1">
                        <div className="font-bold text-slate-200 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Bản Chất Liên Kết Sản Phẩm
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {r.bondNature}
                        </p>
                      </div>

                      {/* Nút Xem lại hoặc Khám phá sản phẩm */}
                      {lastExecutedReaction && (
                        <div className="pt-2 flex gap-2">
                          <button
                            onClick={replayReaction}
                            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                          >
                            <RefreshCcw className="w-3.5 h-3.5 text-cyan-400" /> Xem Lại Sản Phẩm
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="p-3 rounded-2xl bg-slate-900/30 border border-slate-800/80 text-xs text-slate-400 leading-relaxed space-y-2">
                  <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-cyan-400" /> Hướng Dẫn Tự Do Sáng Tạo:
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li>Click chọn các nguyên tố trên bảng để thả vào không gian 3D.</li>
                    <li>Click lần lượt 2 nguyên tử để tự tay nối liên kết (hoặc dùng nút <em>Tự Nối Liên Kết</em>).</li>
                    <li>Bấm nút <strong>🔥 Tiến Hành Phản Ứng</strong> để quan sát phản ứng xảy ra trong thời gian thực!</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
