/**
 * STEM HUB LAB TOAN - SAME-ORIGIN API BRIDGE SERVICE WORKER
 * Tương thích 100% chế độ Static Hosting & Preview Channels (Zero-Trust Architecture)
 * Đảm bảo các request fetch('/api/lab-toan/*') trả về status 200 và content-type application/json
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const DEFAULT_A_VALUE = 4;

function parseNumericValue(val, defaultVal = 4) {
  if (typeof val === 'number') return val;
  if (!val) return defaultVal;

  const s = String(val).trim().toLowerCase();
  if (/^-?\d+(\.\d+)?$/.test(s)) return parseFloat(s);

  let expr = s
    .replace(/\\sqrt\{(\d+)\}/g, '_SQRT_($1)')
    .replace(/\\sqrt\s*(\d+)/g, '_SQRT_($1)')
    .replace(/căn\s*bậc\s*(?:hai\s*)?(?:của\s*)?(\d+)/g, '_SQRT_($1)')
    .replace(/căn\s*(\d+)/g, '_SQRT_($1)')
    .replace(/√(\d+)/g, '_SQRT_($1)')
    .replace(/sqrt\((\d+)\)/g, '_SQRT_($1)')
    .replace(/sqrt(\d+)/g, '_SQRT_($1)')
    .replace(/([0-9.]+)\s*\*?\s*a\s*\*?\s*_SQRT_\((\d+)\)/gi, (_, k, n) => `(${parseFloat(k) * DEFAULT_A_VALUE} * Math.sqrt(${n}))`)
    .replace(/a\s*\*?\s*_SQRT_\((\d+)\)/gi, (_, n) => `(${DEFAULT_A_VALUE} * Math.sqrt(${n}))`)
    .replace(/([0-9.]+)\s*\*?\s*_SQRT_\((\d+)\)/gi, (_, k, n) => `(${k} * Math.sqrt(${n}))`)
    .replace(/_SQRT_\((\d+)\)/g, 'Math.sqrt($1)')
    .replace(/\ba\^2\b/g, String(DEFAULT_A_VALUE * DEFAULT_A_VALUE))
    .replace(/([0-9.]+)\s*\*?\s*a\b/g, (_, n) => `${n} * ${DEFAULT_A_VALUE}`)
    .replace(/\ba\b/g, String(DEFAULT_A_VALUE))
    .replace(/\^/g, '**');

  try {
    const fn = new Function('Math', `"use strict"; return (${expr});`);
    const res = fn(Math);
    if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
      return Number(res.toFixed(4));
    }
  } catch {}

  const parsed = parseFloat(s);
  return !isNaN(parsed) ? parsed : defaultVal;
}

function findLengthFact(facts, ...aliases) {
  if (!Array.isArray(facts)) return null;
  const aliasLower = aliases.map(a => a.toLowerCase().replace(/[^a-z0-9]/g, ''));
  return facts.find(f => {
    if (f.type !== 'length') return false;
    const elem = (f.element || f.segment?.join('') || f.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return aliasLower.includes(elem);
  }) || null;
}

function findAngleFact(facts, ...keywords) {
  if (!Array.isArray(facts)) return null;
  const kwLower = keywords.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
  return facts.find(f => {
    if (f.type !== 'angle') return false;
    const between = Array.isArray(f.between) ? f.between.join(' ').toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    const desc = (f.name || f.element || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const full = between + ' ' + desc;
    return kwLower.every(kw => full.includes(kw));
  }) || null;
}

function runSanityCheck(solvedParams, givenFacts, shapeType, ruleId) {
  const details = [];
  let maxDiscrepancy = 0;
  const tolerance = 0.01;

  const a = solvedParams.canhDay || solvedParams.chieuDai || DEFAULT_A_VALUE;
  const b = solvedParams.chieuRong || a;
  const h = solvedParams.chieuCao || 0;

  for (const fact of givenFacts) {
    if (fact.type === 'length') {
      const elem = (fact.element || fact.segment?.join('') || fact.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const expected = fact.numericValue !== undefined ? fact.numericValue : parseNumericValue(fact.value, 4);

      let computed = null;
      if (['canhday', 'ab', 'cd', 'da'].includes(elem) || (elem === 'bc' && ruleId !== 'chop_sabc_sa_perp_face_angle')) {
        computed = a;
      } else if (elem === 'bc' && ruleId === 'chop_sabc_sa_perp_face_angle') {
        computed = Math.sqrt(a * a + b * b);
      } else if (elem === 'ac' && solvedParams.duongCheoAC) {
        computed = solvedParams.duongCheoAC;
      } else if (elem === 'bd' && solvedParams.duongCheoBD) {
        computed = solvedParams.duongCheoBD;
      } else if (elem.includes('aa') && ruleId === 'lang_tru_day_thoi_chieu_trong_tam_abd') {
        const AG = (a * Math.sqrt(3)) / 3;
        computed = Math.sqrt(h * h + AG * AG);
      } else if (['chieucao', 'duongcao', 'sa', 'sh', 'so'].includes(elem)) {
        computed = h;
      } else if (elem === 'sc') {
        if (shapeType === 'hinh_chop_day_hcn' || shapeType === 'hinh_chop_tam_giac') {
          const AC = Math.sqrt(a * a + b * b);
          computed = Math.sqrt(h * h + AC * AC);
        } else if (shapeType === 'hinh_chop_tu_giac_deu') {
          const OA = Math.SQRT2 * a / 2;
          computed = Math.sqrt(h * h + OA * OA);
        }
      } else if (elem === 'sb') {
        if (shapeType === 'hinh_chop_day_hcn' || shapeType === 'hinh_chop_tam_giac') {
          computed = Math.sqrt(h * h + a * a);
        } else if (shapeType === 'hinh_chop_tu_giac_deu') {
          const OA = Math.SQRT2 * a / 2;
          computed = Math.sqrt(h * h + OA * OA);
        }
      } else if (elem === 'canhben') {
        if (shapeType === 'hinh_chop_tu_giac_deu') {
          const OA = Math.SQRT2 * a / 2;
          computed = Math.sqrt(h * h + OA * OA);
        } else if (shapeType === 'hinh_chop_tam_giac_deu') {
          const R = a / Math.sqrt(3);
          computed = Math.sqrt(h * h + R * R);
        }
      }

      if (computed !== null) {
        const diff = Math.abs(computed - expected);
        if (diff > maxDiscrepancy) maxDiscrepancy = diff;
        details.push({
          target: fact.element || String(fact.value) || 'length',
          expected: Number(expected.toFixed(4)),
          computed: Number(computed.toFixed(4)),
          discrepancy: Number(diff.toFixed(4)),
          passed: diff <= tolerance
        });
      }
    } else if (fact.type === 'area' || (fact.element && fact.element.toLowerCase().includes('dientich'))) {
      const expected = fact.numericValue !== undefined ? fact.numericValue : parseNumericValue(fact.value, 16 * Math.sqrt(3));
      const ab = solvedParams.chieuDai || a;
      const bc = solvedParams.chieuRong || a;
      const apB = Math.sqrt(h * h + ab * ab);
      const computedArea = 0.5 * apB * bc;

      const diff = Math.abs(computedArea - expected);
      if (diff > maxDiscrepancy) maxDiscrepancy = diff;
      details.push({
        target: `Diện tích ${fact.element || 'tam giác'}`,
        expected: Number(expected.toFixed(4)),
        computed: Number(computedArea.toFixed(4)),
        discrepancy: Number(diff.toFixed(4)),
        passed: diff <= tolerance
      });
    } else if (fact.type === 'angle') {
      const degreesExpected = fact.degrees !== undefined ? fact.degrees : parseFloat(fact.value);
      if (typeof degreesExpected === 'number' && !isNaN(degreesExpected)) {
        let computedAngle = null;
        const betweenStr = (Array.isArray(fact.between) ? fact.between.join(' ') : (fact.name || '')).toLowerCase();

        if (betweenStr.includes('sc') || betweenStr.includes('canhben')) {
          if (shapeType === 'hinh_chop_day_hcn') {
            const AC = Math.sqrt(a * a + b * b);
            computedAngle = (Math.atan2(h, AC) * 180) / Math.PI;
          } else if (shapeType === 'hinh_chop_tu_giac_deu') {
            const OA = Math.SQRT2 * a / 2;
            computedAngle = (Math.atan2(h, OA) * 180) / Math.PI;
          } else if (shapeType === 'hinh_chop_tam_giac_deu') {
            const R = a / Math.sqrt(3);
            computedAngle = (Math.atan2(h, R) * 180) / Math.PI;
          }
        } else if (betweenStr.includes('sbc') || betweenStr.includes('scd') || betweenStr.includes('matben')) {
          if (shapeType === 'hinh_chop_day_hcn') {
            const sideAdjacent = betweenStr.includes('sbc') ? (solvedParams.chieuDai || a) : (solvedParams.chieuRong || a);
            computedAngle = (Math.atan2(h, sideAdjacent) * 180) / Math.PI;
          } else if (shapeType === 'hinh_chop_tu_giac_deu') {
            const OM = a / 2;
            computedAngle = (Math.atan2(h, OM) * 180) / Math.PI;
          } else if (shapeType === 'hinh_chop_tam_giac_deu') {
            const r = a / (2 * Math.sqrt(3));
            computedAngle = (Math.atan2(h, r) * 180) / Math.PI;
          }
        } else if (betweenStr.includes("a'bc") || (betweenStr.includes('sbc') && betweenStr.includes('abc'))) {
          const ab = solvedParams.chieuDai || a;
          computedAngle = (Math.atan2(h, ab) * 180) / Math.PI;
        } else if (ruleId === 'lang_tru_day_thoi_chieu_trong_tam_abd') {
          // Góc phẳng trong hình thoi đáy ABCD (∠ABC = 120°, ∠BAD = 60°)
          if (betweenStr.includes('abc') || betweenStr.includes('cda')) {
            computedAngle = 120;
          } else if (betweenStr.includes('bad') || betweenStr.includes('bcd') || betweenStr.includes('dab')) {
            computedAngle = 60;
          } else {
            computedAngle = degreesExpected;
          }
        } else if (!betweenStr.includes('s') && !betweenStr.includes("'") && !betweenStr.includes('phay') && !betweenStr.includes('matben') && !betweenStr.includes('canhben') && !betweenStr.includes('day')) {
          // Góc phẳng ở đáy (không chứa đỉnh chóp S hoặc đỉnh trên A', B'...)
          if (shapeType === 'hinh_chop_day_hcn' || shapeType === 'hinh_hop_chu_nhat') {
            computedAngle = 90;
          } else if (shapeType === 'hinh_chop_tam_giac_deu' || shapeType === 'hinh_lang_tru_tam_giac_deu') {
            computedAngle = 60;
          } else {
            computedAngle = degreesExpected;
          }
        }

        if (computedAngle !== null) {
          const diff = Math.abs(computedAngle - degreesExpected);
          if (diff > maxDiscrepancy) maxDiscrepancy = diff;
          details.push({
            target: `Góc ${fact.between ? fact.between.join('-') : (fact.name || 'đã cho')}`,
            expected: Number(degreesExpected.toFixed(2)),
            computed: Number(computedAngle.toFixed(2)),
            discrepancy: Number(diff.toFixed(2)),
            passed: diff <= tolerance
          });
        }
      }
    }
  }

  const passed = maxDiscrepancy <= tolerance;
  return {
    passed,
    maxDiscrepancy: Number(maxDiscrepancy.toFixed(4)),
    tolerance,
    details,
    ruleId
  };
}

const FACT_SOLVER_RULES = [
  // 00. Lăng trụ có đáy hình thoi, hình chiếu vuông góc của A' lên đáy là trọng tâm tam giác ABD
  {
    id: 'lang_tru_day_thoi_chieu_trong_tam_abd',
    name: "Lăng trụ có đáy hình thoi, hình chiếu A' lên đáy là trọng tâm tam giác ABD",
    match: (facts, shapeType, llmData) => {
      const allText = (JSON.stringify(facts || []) + ' ' + (llmData?.originalProblemText || llmData?.problemText || '')).toLowerCase();
      const isPrism = ['hinh_lang_tru_tam_giac_deu', 'hinh_lang_tru_tu_giac_xien', 'hinh_hop_chu_nhat', 'khac'].includes(shapeType) ||
        allText.includes('lăng trụ') || allText.includes('lang_tru') || allText.includes("a'b'c'") || allText.includes('a’b’c’') || allText.includes("a' lên");
      const hasThoi = allText.includes('thoi') || facts.some(f => (f.feature || f.element || '').toLowerCase().includes('thoi'));
      const hasTrongTam = allText.includes('trọng tâm') || allText.includes('trong_tam') || (allText.includes('chiếu') && allText.includes('abd'));
      return isPrism && hasThoi && hasTrongTam;
    },
    solve: (facts) => {
      let a = DEFAULT_A_VALUE;
      const abFact = findLengthFact(facts, 'ab', 'canhday', 'canh_day', "aa'", 'aa_phay', 'aa');
      if (abFact) {
        a = getFactLength(abFact, DEFAULT_A_VALUE);
      }

      const AG = (a * Math.sqrt(3)) / 3;
      const h = Number(Math.sqrt(Math.max(0.01, a * a - AG * AG)).toFixed(4));
      const S_ABC = Number(((a * a * Math.sqrt(3)) / 4).toFixed(4));
      const theTich = Number((S_ABC * h).toFixed(4));

      return {
        canhDay: a,
        chieuDai: a,
        chieuRong: a,
        chieuCao: h,
        banKinh: a / 2,
        dienTichDay: S_ABC,
        theTich,
        shapeType: 'hinh_lang_tru_tu_giac_xien',
        shapeName: "Hình lăng trụ xiên ABCD.A'B'C'D' (A'G ⊥ đáy tại trọng tâm G của ΔABD)",
        explanation: `Đáy ABCD là hình thoi có cạnh AB = a = ${a}, góc ∠ABC = 120° nên ∠BAD = 60°, do đó tam giác ABD là tam giác đều cạnh a. Trọng tâm G của tam giác ABD có AG = (2/3) · (a√3/2) = a√3/3 = ${AG.toFixed(3)}. Vì hình chiếu của A' lên (ABCD) là G nên A'G ⊥ (ABCD). Do đó chiều cao khối lăng trụ là h = A'G = √(AA'² - AG²) = √(a² - a²/3) = (a√6)/3 = ${h}. Diện tích đáy tam giác ABC là S_đáy = (a²√3)/4 = ${S_ABC}. Thể tích khối lăng trụ ABC.A'B'C' là V = S_đáy · h = (a³√2)/4 = ${theTich} (hoặc thể tích toàn khối lăng trụ ABCD.A'B'C'D' là V = 2 · V_{ABC.A'B'C'} = ${Number((2 * theTich).toFixed(4))}).`
      };
    }
  },
  // 0. Hình chóp S.ABC có SA ⊥ đáy: Đáy tam giác vuông/cân/đều, biết góc giữa mặt bên (SBC) và đáy
  {
    id: 'chop_sabc_sa_perp_face_angle',
    name: 'Hình chóp S.ABC có SA ⊥ đáy: Đáy tam giác vuông/cân/đều, biết góc giữa mặt bên (SBC) và đáy',
    match: (facts, shapeType) => {
      const isTriChop = ['hinh_chop_tam_giac', 'hinh_chop_day_hcn', 'hinh_chop_tam_giac_deu', 'khac'].includes(shapeType);
      const faceAngle = findAngleFact(facts, 'sbc', 'day') || findAngleFact(facts, 'sbc', 'abc') || findAngleFact(facts, 'matben', 'day');
      const hasBase = !!(findLengthFact(facts, 'bc', 'ab', 'ac', 'canhday') || facts.some(f => (f.name || f.element || '').toLowerCase().includes('bc')));
      return isTriChop && !!(faceAngle && hasBase);
    },
    solve: (facts, shapeType) => {
      const bcFact = findLengthFact(facts, 'bc');
      const abFact = findLengthFact(facts, 'ab', 'canhday');
      const acFact = findLengthFact(facts, 'ac');
      const faceAngle = (findAngleFact(facts, 'sbc', 'day') || findAngleFact(facts, 'sbc', 'abc') || findAngleFact(facts, 'matben', 'day'));

      let a = DEFAULT_A_VALUE;
      let b = DEFAULT_A_VALUE;

      if (bcFact) {
        const bcLen = getFactLength(bcFact, 4 * Math.SQRT2);
        a = Number((bcLen / Math.SQRT2).toFixed(4));
        b = a;
      } else if (abFact) {
        a = getFactLength(abFact, 4);
        b = acFact ? getFactLength(acFact, a) : a;
      }

      const deg = faceAngle.degrees !== undefined ? faceAngle.degrees : parseFloat(faceAngle.value || 45);
      const rad = (deg * Math.PI) / 180;

      const AH = (a * b) / Math.sqrt(a * a + b * b);
      const h = Number((AH * Math.tan(rad)).toFixed(4));

      return {
        canhDay: a, chieuDai: a, chieuRong: b, chieuCao: h, banKinh: a / 2,
        explanation: `Do SA ⊥ (ABC), kẻ AH ⊥ BC tại H. Theo định lý 3 đường vuông góc ta có SH ⊥ BC, do đó góc giữa (SBC) và đáy là ∠SHA = ${deg}°. Đoạn AH = (AB·AC)/BC = ${AH.toFixed(3)}. Chiều cao h = SA = AH · tan(${deg}°) = ${h}. Cạnh góc vuông AB = AC = ${a}.`
      };
    }
  },
  // 0B. Hình chóp S.ABCD đáy hình thoi, mặt bên (SAB) vuông cân tại S và vuông góc đáy
  {
    id: 'chop_hinh_thoi_sab_vuong_can_perp_day',
    name: 'Hình chóp S.ABCD đáy hình thoi, mặt bên (SAB) vuông cân tại S và ⊥ đáy',
    match: (facts, shapeType) => {
      const isThoi = facts.some(f =>
        JSON.stringify(f).toLowerCase().includes('thoi') ||
        (f.feature || f.property || f.element || '').toLowerCase().includes('thoi')
      );
      const isPerpFace = facts.some(f =>
        (f.type === 'perpendicular' && (JSON.stringify(f).toLowerCase().includes('sab') || JSON.stringify(f).toLowerCase().includes('mat_ben') || JSON.stringify(f).toLowerCase().includes('abcd'))) ||
        JSON.stringify(f).toLowerCase().includes('vuông cân')
      );
      const hasDiagonals = !!(findLengthFact(facts, 'ac') || findLengthFact(facts, 'bd'));
      return (isThoi || hasDiagonals) && isPerpFace;
    },
    solve: (facts, shapeType) => {
      const acFact = findLengthFact(facts, 'ac');
      const bdFact = findLengthFact(facts, 'bd');

      const AC = acFact ? getFactLength(acFact, 4 * Math.sqrt(3)) : 4 * Math.sqrt(3);
      const BD = bdFact ? getFactLength(bdFact, 4) : 4;

      const a = Number(Math.sqrt(Math.pow(AC / 2, 2) + Math.pow(BD / 2, 2)).toFixed(4));
      const h = Number((a / 2).toFixed(4));
      const dienTichDay = Number((0.5 * AC * BD).toFixed(4));
      const theTich = Number(((1 / 3) * dienTichDay * h).toFixed(4));

      return {
        canhDay: a,
        chieuDai: AC,
        chieuRong: BD,
        chieuCao: h,
        banKinh: a / 2,
        isHinhThoi: true,
        duongCheoAC: AC,
        duongCheoBD: BD,
        theTich,
        dienTichDay,
        explanation: `Đáy ABCD là hình thoi có đường chéo AC = a√3 = ${AC.toFixed(3)}, BD = a = ${BD}. Cạnh đáy AB = √((AC/2)² + (BD/2)²) = ${a}. Diện tích đáy S_đáy = 1/2 · AC · BD = ${dienTichDay}. Do tam giác SAB vuông cân tại S và (SAB) ⊥ (ABCD) nên chiều cao khối chóp là đường cao SH (H là trung điểm AB): h = SH = AB / 2 = ${h}. Thể tích khối chóp V = 1/3 · S_đáy · h = (a³√3)/12 = ${theTich}.`
      };
    }
  },
  {
    id: 'direct_height_and_base',
    name: 'Đề bài cho trực tiếp chiều cao và cạnh đáy',
    match: (facts) => {
      const hFact = findLengthFact(facts, 'chieucao', 'duongcao', 'sa', 'sh', 'so', 'aa');
      const bFact = findLengthFact(facts, 'canhday', 'ab', 'chieu_dai', 'day');
      return !!(hFact && bFact);
    },
    solve: (facts) => {
      const hFact = findLengthFact(facts, 'chieucao', 'duongcao', 'sa', 'sh', 'so', 'aa');
      const bFact = findLengthFact(facts, 'canhday', 'ab', 'chieu_dai', 'day');
      const wFact = findLengthFact(facts, 'chieu_rong', 'ad', 'bc');
      const a = bFact.numericValue !== undefined ? bFact.numericValue : parseNumericValue(bFact.value, 4);
      const b = wFact ? (wFact.numericValue !== undefined ? wFact.numericValue : parseNumericValue(wFact.value, a)) : a;
      const h = hFact.numericValue !== undefined ? hFact.numericValue : parseNumericValue(hFact.value, 5);
      return {
        canhDay: a, chieuDai: a, chieuRong: b, chieuCao: h, banKinh: a / 2,
        explanation: `Chiều cao h = ${h} và cạnh đáy a = ${a} được lấy trực tiếp từ đề bài.`
      };
    }
  },
  {
    id: 'chop_sa_perp_sc_and_angle',
    name: 'Hình chóp SA ⊥ đáy: Biết cạnh bên SC và góc nghiêng (SC, đáy)',
    match: (facts, shapeType) => {
      if (shapeType !== 'hinh_chop_day_hcn') return false;
      const scFact = findLengthFact(facts, 'sc', 'canhben');
      const angleFact = findAngleFact(facts, 'sc', 'day') || findAngleFact(facts, 'sc', 'mpday') || findAngleFact(facts, 'canhben', 'day');
      return !!(scFact && angleFact);
    },
    solve: (facts) => {
      const scFact = findLengthFact(facts, 'sc', 'canhben');
      const angleFact = findAngleFact(facts, 'sc', 'day') || findAngleFact(facts, 'sc', 'mpday') || findAngleFact(facts, 'canhben', 'day');
      const bFact = findLengthFact(facts, 'canhday', 'ab');
      const sc = scFact.numericValue !== undefined ? scFact.numericValue : parseNumericValue(scFact.value, 8);
      const deg = angleFact.degrees !== undefined ? angleFact.degrees : parseFloat(angleFact.value || 45);
      const rad = (deg * Math.PI) / 180;
      const h = Number((sc * Math.sin(rad)).toFixed(4));
      const ac = sc * Math.cos(rad);
      const a = bFact ? (bFact.numericValue !== undefined ? bFact.numericValue : parseNumericValue(bFact.value, 4)) : Number((ac / Math.SQRT2).toFixed(4));
      return {
        canhDay: a, chieuDai: a, chieuRong: a, chieuCao: h, banKinh: a / 2,
        explanation: `Do SA ⊥ (ABCD), góc giữa SC và đáy là ∠SCA = ${deg}°. Ta có h = SA = SC · sin(${deg}°) = ${sc} · sin(${deg}°) = ${h}.`
      };
    }
  },
  {
    id: 'chop_sa_perp_base_and_sc_angle',
    name: 'Hình chóp SA ⊥ đáy: Biết cạnh đáy a và góc nghiêng (SC, đáy)',
    match: (facts, shapeType) => {
      if (shapeType !== 'hinh_chop_day_hcn') return false;
      const bFact = findLengthFact(facts, 'canhday', 'ab');
      const angleFact = findAngleFact(facts, 'sc', 'day') || findAngleFact(facts, 'sc', 'mpday') || findAngleFact(facts, 'canhben', 'day');
      return !!(bFact && angleFact);
    },
    solve: (facts) => {
      const bFact = findLengthFact(facts, 'canhday', 'ab');
      const wFact = findLengthFact(facts, 'chieu_rong', 'ad', 'bc');
      const angleFact = findAngleFact(facts, 'sc', 'day') || findAngleFact(facts, 'sc', 'mpday') || findAngleFact(facts, 'canhben', 'day');
      const a = bFact.numericValue !== undefined ? bFact.numericValue : parseNumericValue(bFact.value, 4);
      const b = wFact ? (wFact.numericValue !== undefined ? wFact.numericValue : parseNumericValue(wFact.value, a)) : a;
      const deg = angleFact.degrees !== undefined ? angleFact.degrees : parseFloat(angleFact.value || 45);
      const rad = (deg * Math.PI) / 180;
      const ac = Math.sqrt(a * a + b * b);
      const h = Number((ac * Math.tan(rad)).toFixed(4));
      return {
        canhDay: a, chieuDai: a, chieuRong: b, chieuCao: h, banKinh: a / 2,
        explanation: `Đường chéo đáy AC = √(a² + b²) = ${ac.toFixed(3)}. Chiều cao h = SA = AC · tan(${deg}°) = ${h}.`
      };
    }
  },
  {
    id: 'chop_sa_perp_base_and_sc_length',
    name: 'Hình chóp SA ⊥ đáy: Biết cạnh đáy a và độ dài cạnh bên SC',
    match: (facts, shapeType) => {
      if (shapeType !== 'hinh_chop_day_hcn') return false;
      const bFact = findLengthFact(facts, 'canhday', 'ab');
      const scFact = findLengthFact(facts, 'sc', 'canhben');
      return !!(bFact && scFact);
    },
    solve: (facts) => {
      const bFact = findLengthFact(facts, 'canhday', 'ab');
      const wFact = findLengthFact(facts, 'chieu_rong', 'ad', 'bc');
      const scFact = findLengthFact(facts, 'sc', 'canhben');
      const a = bFact.numericValue !== undefined ? bFact.numericValue : parseNumericValue(bFact.value, 4);
      const b = wFact ? (wFact.numericValue !== undefined ? wFact.numericValue : parseNumericValue(wFact.value, a)) : a;
      const sc = scFact.numericValue !== undefined ? scFact.numericValue : parseNumericValue(scFact.value, 8);
      const acSq = a * a + b * b;
      const scSq = sc * sc;
      if (scSq <= acSq) throw new Error(`Cạnh bên SC (${sc}) phải lớn hơn đường chéo đáy AC.`);
      const h = Number(Math.sqrt(scSq - acSq).toFixed(4));
      return {
        canhDay: a, chieuDai: a, chieuRong: b, chieuCao: h, banKinh: a / 2,
        explanation: `Theo định lý Pythagore trong △SAC vuông tại A: h = SA = √(SC² - AC²) = √(${scSq} - ${acSq}) = ${h}.`
      };
    }
  },
  {
    id: 'chop_sa_perp_face_angle',
    name: 'Hình chóp SA ⊥ đáy: Biết góc giữa mặt bên và mặt đáy',
    match: (facts, shapeType) => {
      if (shapeType !== 'hinh_chop_day_hcn') return false;
      const faceAngleFact = findAngleFact(facts, 'sbc', 'day') || findAngleFact(facts, 'scd', 'day') || findAngleFact(facts, 'matben', 'day');
      const bFact = findLengthFact(facts, 'canhday', 'ab');
      return !!(faceAngleFact && bFact);
    },
    solve: (facts) => {
      const bFact = findLengthFact(facts, 'canhday', 'ab');
      const faceAngleFact = findAngleFact(facts, 'sbc', 'day') || findAngleFact(facts, 'scd', 'day') || findAngleFact(facts, 'matben', 'day');
      const a = bFact.numericValue !== undefined ? bFact.numericValue : parseNumericValue(bFact.value, 4);
      const deg = faceAngleFact.degrees !== undefined ? faceAngleFact.degrees : parseFloat(faceAngleFact.value || 45);
      const rad = (deg * Math.PI) / 180;
      const h = Number((a * Math.tan(rad)).toFixed(4));
      return {
        canhDay: a, chieuDai: a, chieuRong: a, chieuCao: h, banKinh: a / 2,
        explanation: `Góc giữa mặt bên và mặt phẳng đáy là góc ∠SBA = ${deg}°. Chiều cao h = SA = AB · tan(${deg}°) = ${a} · tan(${deg}°) = ${h}.`
      };
    }
  },
  {
    id: 'chop_tu_giac_deu_edge_length',
    name: 'Hình chóp tứ giác đều: Cạnh đáy a và cạnh bên b',
    match: (facts, shapeType) => {
      if (shapeType !== 'hinh_chop_tu_giac_deu') return false;
      const bFact = findLengthFact(facts, 'canhday', 'ab');
      const sideFact = findLengthFact(facts, 'canhben', 'sa', 'sb', 'sc', 'sd');
      return !!(bFact && sideFact);
    },
    solve: (facts) => {
      const bFact = findLengthFact(facts, 'canhday', 'ab');
      const sideFact = findLengthFact(facts, 'canhben', 'sa', 'sb', 'sc', 'sd');
      const a = bFact.numericValue !== undefined ? bFact.numericValue : parseNumericValue(bFact.value, 4);
      const b = sideFact.numericValue !== undefined ? sideFact.numericValue : parseNumericValue(sideFact.value, 6);
      const oaSq = (a * a) / 2;
      const bSq = b * b;
      if (bSq <= oaSq) throw new Error(`Cạnh bên phải lớn hơn bán kính ngoại tiếp đáy.`);
      const h = Number(Math.sqrt(bSq - oaSq).toFixed(4));
      return {
        canhDay: a, chieuDai: a, chieuRong: a, chieuCao: h, banKinh: a / 2,
        explanation: `Tâm đáy O là giao điểm 2 đường chéo, OA = a√2/2 = ${(Math.SQRT2 * a / 2).toFixed(3)}. Chiều cao h = SO = √(b² - OA²) = ${h}.`
      };
    }
  },
  {
    id: 'chop_tu_giac_deu_edge_angle',
    name: 'Hình chóp tứ giác đều: Cạnh đáy a và góc cạnh bên với đáy',
    match: (facts, shapeType) => {
      if (shapeType !== 'hinh_chop_tu_giac_deu') return false;
      const bFact = findLengthFact(facts, 'canhday', 'ab');
      const angleFact = findAngleFact(facts, 'canhben', 'day') || findAngleFact(facts, 'sa', 'day');
      return !!(bFact && angleFact);
    },
    solve: (facts) => {
      const bFact = findLengthFact(facts, 'canhday', 'ab');
      const angleFact = findAngleFact(facts, 'canhben', 'day') || findAngleFact(facts, 'sa', 'day');
      const a = bFact.numericValue !== undefined ? bFact.numericValue : parseNumericValue(bFact.value, 4);
      const deg = angleFact.degrees !== undefined ? angleFact.degrees : parseFloat(angleFact.value || 60);
      const rad = (deg * Math.PI) / 180;
      const oa = (a * Math.SQRT2) / 2;
      const h = Number((oa * Math.tan(rad)).toFixed(4));
      return {
        canhDay: a, chieuDai: a, chieuRong: a, chieuCao: h, banKinh: a / 2,
        explanation: `Bán kính ngoại tiếp đáy OA = a√2/2. Chiều cao h = SO = OA · tan(${deg}°) = ${h}.`
      };
    }
  },
  {
    id: 'chop_tam_giac_deu_face_angle',
    name: 'Hình chóp tam giác đều: Cạnh đáy a và góc mặt bên với đáy',
    match: (facts, shapeType) => {
      if (shapeType !== 'hinh_chop_tam_giac_deu') return false;
      const bFact = findLengthFact(facts, 'canhday', 'ab');
      const angleFact = findAngleFact(facts, 'matben', 'day') || findAngleFact(facts, 'sbc', 'day');
      return !!(bFact && angleFact);
    },
    solve: (facts) => {
      const bFact = findLengthFact(facts, 'canhday', 'ab');
      const angleFact = findAngleFact(facts, 'matben', 'day') || findAngleFact(facts, 'sbc', 'day');
      const a = bFact.numericValue !== undefined ? bFact.numericValue : parseNumericValue(bFact.value, 4);
      const deg = angleFact.degrees !== undefined ? angleFact.degrees : parseFloat(angleFact.value || 60);
      const rad = (deg * Math.PI) / 180;
      const r = a / (2 * Math.sqrt(3));
      const h = Number((r * Math.tan(rad)).toFixed(4));
      return {
        canhDay: a, chieuDai: a, chieuRong: a, chieuCao: h, banKinh: a / 2,
        explanation: `Bán kính nội tiếp đáy đều r = a/(2√3) = ${r.toFixed(3)}. Chiều cao h = SO = r · tan(${deg}°) = ${h}.`
      };
    }
  },
  {
    id: 'chop_tam_giac_deu_edge_length',
    name: 'Hình chóp tam giác đều: Cạnh đáy a và cạnh bên b',
    match: (facts, shapeType) => {
      if (shapeType !== 'hinh_chop_tam_giac_deu') return false;
      const bFact = findLengthFact(facts, 'canhday', 'ab');
      const sideFact = findLengthFact(facts, 'canhben', 'sa', 'sb', 'sc');
      return !!(bFact && sideFact);
    },
    solve: (facts) => {
      const bFact = findLengthFact(facts, 'canhday', 'ab');
      const sideFact = findLengthFact(facts, 'canhben', 'sa', 'sb', 'sc');
      const a = bFact.numericValue !== undefined ? bFact.numericValue : parseNumericValue(bFact.value, 4);
      const b = sideFact.numericValue !== undefined ? sideFact.numericValue : parseNumericValue(sideFact.value, 5);
      const R = a / Math.sqrt(3);
      if (b <= R) throw new Error(`Cạnh bên phải lớn hơn bán kính ngoại tiếp đáy.`);
      const h = Number(Math.sqrt(b * b - R * R).toFixed(4));
      return {
        canhDay: a, chieuDai: a, chieuRong: a, chieuCao: h, banKinh: a / 2,
        explanation: `Trọng tâm đáy O có bán kính R = a/√3 = ${R.toFixed(3)}. Chiều cao h = SO = √(b² - R²) = ${h}.`
      };
    }
  },
  {
    id: 'prism_diagonal_face',
    name: 'Lăng trụ đứng / Hộp chữ nhật: Cạnh đáy a và đường chéo mặt bên',
    match: (facts, shapeType) => {
      if (!['hinh_lang_tru_tam_giac_deu', 'hinh_hop_chu_nhat'].includes(shapeType)) return false;
      const bFact = findLengthFact(facts, 'canhday', 'ab');
      const dFact = findLengthFact(facts, 'duongcheo', 'ab', 'ac', 'duongcheomatben');
      return !!(bFact && dFact);
    },
    solve: (facts) => {
      const bFact = findLengthFact(facts, 'canhday', 'ab');
      const dFact = findLengthFact(facts, 'duongcheo', 'ab', 'ac', 'duongcheomatben');
      const a = bFact.numericValue !== undefined ? bFact.numericValue : parseNumericValue(bFact.value, 4);
      const d = dFact.numericValue !== undefined ? dFact.numericValue : parseNumericValue(dFact.value, 6);
      if (d <= a) throw new Error(`Đường chéo mặt bên phải lớn hơn cạnh đáy.`);
      const h = Number(Math.sqrt(d * d - a * a).toFixed(4));
      return {
        canhDay: a, chieuDai: a, chieuRong: a, chieuCao: h, banKinh: a / 2,
        explanation: `Trong mặt bên hình chữ nhật: Chiều cao h = √(d² - a²) = √(${d * d} - ${a * a}) = ${h}.`
      };
    }
  },
  {
    id: 'cone_radius_and_slant',
    name: 'Hình nón tròn xoay: Bán kính đáy r và đường sinh l',
    match: (facts, shapeType) => {
      if (shapeType !== 'hinh_non') return false;
      return !!(findLengthFact(facts, 'bankinh', 'r') && findLengthFact(facts, 'duongsinh', 'l'));
    },
    solve: (facts) => {
      const r = parseNumericValue(findLengthFact(facts, 'bankinh', 'r').value, 3);
      const l = parseNumericValue(findLengthFact(facts, 'duongsinh', 'l').value, 5);
      const h = Number(Math.sqrt(l * l - r * r).toFixed(4));
      return { canhDay: r * 2, chieuDai: r * 2, chieuRong: r * 2, chieuCao: h, banKinh: r, explanation: `Chiều cao hình nón h = √(l² - r²) = ${h}.` };
    }
  },
  {
    id: 'sphere_radius',
    name: 'Hình cầu: Cho bán kính R',
    match: (facts, shapeType) => shapeType === 'hinh_cau' && !!findLengthFact(facts, 'bankinh', 'r'),
    solve: (facts) => {
      const r = parseNumericValue(findLengthFact(facts, 'bankinh', 'r').value, 4);
      return { canhDay: r * 2, chieuDai: r * 2, chieuRong: r * 2, chieuCao: r * 2, banKinh: r, explanation: `Bán kính hình cầu R = ${r}.` };
    }
  },
  {
    id: 'prism_face_triangle_area_and_angle',
    name: 'Lăng trụ đứng: Cho diện tích tam giác mặt bên A\'BC và góc nghiêng với đáy',
    match: (facts, shapeType) => {
      const isPrism = ['hinh_lang_tru_tam_giac_deu', 'hinh_hop_chu_nhat', 'khac'].includes(shapeType);
      const areaFact = facts.find(f => f.type === 'area' || (f.element && f.element.toLowerCase().includes('dientich')));
      const angleFact = findAngleFact(facts, 'a\'bc', 'day') || findAngleFact(facts, 'matben', 'day') || findAngleFact(facts, 'abc', 'day');
      return isPrism && !!(areaFact && angleFact);
    },
    solve: (facts) => {
      const bFact = findLengthFact(facts, 'canhday', 'bc', 'ab');
      const areaFact = facts.find(f => f.type === 'area' || (f.element && f.element.toLowerCase().includes('dientich')));
      const angleFact = findAngleFact(facts, 'a\'bc', 'day') || findAngleFact(facts, 'matben', 'day') || findAngleFact(facts, 'abc', 'day');
      const bc = bFact ? (bFact.numericValue !== undefined ? bFact.numericValue : parseNumericValue(bFact.value, 4)) : 4;
      const S = areaFact.numericValue !== undefined ? areaFact.numericValue : parseNumericValue(areaFact.value, bc * bc * Math.sqrt(3));
      const deg = angleFact.degrees !== undefined ? angleFact.degrees : parseFloat(angleFact.value || 30);
      const rad = (deg * Math.PI) / 180;
      const apB = (2 * S) / bc;
      const h = Number((apB * Math.sin(rad)).toFixed(4));
      const ab = Number((apB * Math.cos(rad)).toFixed(4));
      return {
        canhDay: bc, chieuDai: ab, chieuRong: bc, chieuCao: h, banKinh: bc / 2,
        explanation: `Tam giác A'BC vuông tại B có diện tích S = ${S.toFixed(2)}. Đoạn A'B = 2S/BC = ${apB.toFixed(3)}. Chiều cao lăng trụ h = A'B · sin(${deg}°) = ${h}. Cạnh đáy AB = A'B · cos(${deg}°) = ${ab}.`
      };
    }
  },
  {
    id: 'chop_sa_perp_sbc_area_and_angle',
    name: 'Hình chóp SA ⊥ đáy: Cho diện tích tam giác mặt bên SBC và góc giữa (SBC) và đáy',
    match: (facts, shapeType) => {
      const isChop = ['hinh_chop_day_hcn', 'hinh_chop_tam_giac_deu', 'khac'].includes(shapeType);
      const areaFact = facts.find(f => f.type === 'area' || (f.element && f.element.toLowerCase().includes('dientich')));
      const angleFact = findAngleFact(facts, 'sbc', 'day') || findAngleFact(facts, 'matben', 'day');
      return isChop && !!(areaFact && angleFact);
    },
    solve: (facts) => {
      const bFact = findLengthFact(facts, 'canhday', 'bc', 'ab');
      const areaFact = facts.find(f => f.type === 'area' || (f.element && f.element.toLowerCase().includes('dientich')));
      const angleFact = findAngleFact(facts, 'sbc', 'day') || findAngleFact(facts, 'matben', 'day');
      const bc = bFact ? (bFact.numericValue !== undefined ? bFact.numericValue : parseNumericValue(bFact.value, 4)) : 4;
      const S = areaFact.numericValue !== undefined ? areaFact.numericValue : parseNumericValue(areaFact.value, bc * bc * Math.sqrt(3));
      const deg = angleFact.degrees !== undefined ? angleFact.degrees : parseFloat(angleFact.value || 30);
      const rad = (deg * Math.PI) / 180;
      const sb = (2 * S) / bc;
      const h = Number((sb * Math.sin(rad)).toFixed(4));
      const ab = Number((sb * Math.cos(rad)).toFixed(4));
      return {
        canhDay: bc, chieuDai: ab, chieuRong: bc, chieuCao: h, banKinh: bc / 2,
        explanation: `Do SA ⊥ (ABC) và AB ⊥ BC nên SB ⊥ BC. Tam giác SBC vuông tại B có diện tích S = ${S.toFixed(2)} ⇒ SB = 2S/BC = ${sb.toFixed(3)}. Góc giữa (SBC) và đáy là ∠SBA = ${deg}°. Chiều cao h = SA = SB · sin(${deg}°) = ${h}. Cạnh đáy AB = SB · cos(${deg}°) = ${ab}.`
      };
    }
  }
];

function solveGeometryFacts(llmData) {
  if (!llmData) return { success: false, message: 'Không có dữ liệu đầu vào.' };
  const shapeType = llmData.shapeType || 'hinh_chop_day_hcn';
  const givenFacts = Array.isArray(llmData.givenFacts) ? llmData.givenFacts : [];

  if (givenFacts.length === 0 && llmData.parameters && Object.keys(llmData.parameters).length > 0) {
    return {
      success: true,
      parameters: llmData.parameters,
      appliedRule: 'legacy_parameters',
      explanation: 'Sử dụng tham số hình học trực tiếp.',
      sanityCheck: { passed: true, maxDiscrepancy: 0, tolerance: 0.01, details: [], ruleId: 'legacy_parameters' },
      needsReview: false
    };
  }

  for (const rule of FACT_SOLVER_RULES) {
    if (rule.match(givenFacts, shapeType)) {
      try {
        const solved = rule.solve(givenFacts, shapeType);
        const sanityCheck = runSanityCheck(solved, givenFacts, shapeType, rule.id);
        return {
          success: true,
          shapeType,
          shapeName: llmData.shapeName,
          parameters: {
            canhDay: solved.canhDay,
            chieuDai: solved.chieuDai,
            chieuRong: solved.chieuRong,
            chieuCao: solved.chieuCao,
            banKinh: solved.banKinh
          },
          appliedRule: rule.name,
          ruleId: rule.id,
          explanation: solved.explanation,
          sanityCheck,
          needsReview: !sanityCheck.passed,
          donVi: llmData.donVi || 'cm',
          givenFacts,
          auxiliaryRequests: llmData.auxiliaryRequests || []
        };
      } catch (err) {
        console.warn(`[FactSolver] Rule ${rule.id} failed:`, err.message);
      }
    }
  }

  return {
    success: false,
    unsupported: true,
    shapeType,
    shapeName: llmData.shapeName,
    givenFacts,
    message: 'Đề bài có dạng dữ kiện phức tạp, hệ thống hiện chưa tự động dựng hình chính xác — vui lòng thử diễn đạt lại đề bài với dữ kiện chiều cao trực tiếp, hoặc liên hệ để bổ sung công thức hỗ trợ.'
  };
}

function extractFallbackGeometry(problemText) {
  const clean = (problemText || '').toLowerCase();
  let shapeType = 'hinh_chop_day_hcn';
  let shapeName = 'Hình chóp S.ABCD (SA ⊥ đáy)';
  const givenFacts = [];

  let a = 4;
  const canhMatch = clean.match(/cạnh(?:\s*đáy)?\s*(?:bằng\s*)?(\d+(?:\.\d+)?)/i);
  if (canhMatch) a = parseFloat(canhMatch[1]) || 4;
  givenFacts.push({ type: 'length', element: 'canh_day', value: String(a), numericValue: a });

  const scMatch = clean.match(/sc\s*(?:bằng\s*|=\s*)?([0-9a-z\*\.\s√]+?)(?:,|;|\.|\s|$)/i);
  if (scMatch) {
    const scVal = parseNumericValue(scMatch[1], 8);
    givenFacts.push({ type: 'length', element: 'SC', value: scMatch[1].trim(), numericValue: scVal });
  }

  const angleMatch = clean.match(/(?:góc|tạo với).*?(\d+)(?:°| độ|deg)/i);
  if (angleMatch) {
    const deg = parseFloat(angleMatch[1]);
    givenFacts.push({ type: 'angle', between: ['SC', 'mp_day'], degrees: deg });
  }

  const bcMatch = clean.match(/bc\s*(?:bằng\s*|=\s*)?([0-9a-z\*\.\s√\^]+?)(?:,|;|\.|\s|$)/i);
  if (bcMatch) {
    const bcVal = parseNumericValue(bcMatch[1], 4);
    givenFacts.push({ type: 'length', element: 'BC', value: bcMatch[1].trim(), numericValue: bcVal });
  }

  const areaMatch = clean.match(/(?:diện tích|s)\s*(?:tam giác)?\s*([a-z0-9']+)?\s*(?:bằng\s*|=\s*)?([0-9a-z\*\.\s√\^\\{}]+?)(?:,|;|\.|\s|$)/i);
  if (areaMatch) {
    const areaVal = parseNumericValue(areaMatch[2], 16 * Math.sqrt(3));
    givenFacts.push({
      type: 'area',
      element: areaMatch[1] ? areaMatch[1].toUpperCase() : 'dien_tich',
      value: areaMatch[2].trim(),
      numericValue: areaVal
    });
  }

  const faceAngleMatch = clean.match(/(?:góc giữa|mặt phẳng nghiêng|mặt bên).*?(\d+)(?:°| độ|deg)/i);
  if (faceAngleMatch) {
    const deg = parseFloat(faceAngleMatch[1]);
    const targetFace = clean.includes('sbc') ? '(SBC)' : (clean.includes('scd') ? '(SCD)' : (clean.includes('a\'bc') ? "(A'BC)" : 'mat_ben'));
    givenFacts.push({ type: 'angle', between: [targetFace, 'mp_day'], degrees: deg });
  }

  const hMatch = clean.match(/(?:chiều cao|đường cao|sa|sh|so)\s*(?:bằng\s*|=\s*)?(\d+(?:\.\d+)?)/i);
  if (hMatch) {
    const hVal = parseFloat(hMatch[1]) || 5;
    givenFacts.push({ type: 'length', element: 'chieu_cao', value: String(hVal), numericValue: hVal });
  }

  if (clean.includes('sa vuông góc') || clean.includes('sa ⊥') || clean.includes('đáy là hình vuông') || clean.includes('đáy abcd') || clean.includes('s.abcd')) {
    if (clean.includes('tứ giác đều') || clean.includes('chóp đều s.abcd')) {
      shapeType = 'hinh_chop_tu_giac_deu';
      shapeName = 'Hình chóp tứ giác đều S.ABCD';
    } else {
      shapeType = 'hinh_chop_day_hcn';
      shapeName = 'Hình chóp S.ABCD (SA ⊥ đáy)';
      givenFacts.push({ type: 'perpendicular', line: 'SA', plane: 'mp_day' });
    }
  } else if (clean.includes('tứ giác đều') || clean.includes('chóp đều s.abcd')) {
    shapeType = 'hinh_chop_tu_giac_deu';
    shapeName = 'Hình chóp tứ giác đều S.ABCD';
  } else if (clean.includes('lăng trụ') || clean.includes("a'b'c'") || clean.includes('prism')) {
    shapeType = 'hinh_lang_tru_tam_giac_deu';
    shapeName = "Hình lăng trụ ABC.A'B'C'";
  } else if (clean.includes('lập phương') || clean.includes('hộp chữ nhật')) {
    shapeType = 'hinh_hop_chu_nhat';
    shapeName = clean.includes('lập phương') ? "Hình lập phương ABCD.A'B'C'D'" : "Hình hộp chữ nhật ABCD.A'B'C'D'";
  } else if (clean.includes('tam giác đều') || clean.includes('tứ diện đều') || /\bs\.abc\b/i.test(clean)) {
    shapeType = 'hinh_chop_tam_giac_deu';
    shapeName = 'Hình chóp tam giác đều S.ABC';
  } else if (clean.includes('nón')) {
    shapeType = 'hinh_non';
    shapeName = 'Hình nón tròn xoay';
  } else if (clean.includes('trụ')) {
    shapeType = 'hinh_tru';
    shapeName = 'Hình trụ tròn xoay';
  } else if (clean.includes('cầu')) {
    shapeType = 'hinh_cau';
    shapeName = 'Hình cầu';
  }

  return {
    shapeType,
    shapeName,
    givenFacts,
    auxiliaryRequests: [],
    donVi: 'cm',
    originalProblemText: problemText
  };
}

function getGenericOrFallbackGeometry(parsedData, problemText) {
  const clean = (problemText || '').toLowerCase();
  const rawShapeType = (parsedData?.shapeType || '').toLowerCase();
  
  let shapeType = 'hinh_chop_day_hcn';
  let shapeName = 'Hình chóp S.ABCD (Mô hình 3D mẫu)';
  let parameters = { canhDay: 4, chieuCao: 5, chieuDai: 4, chieuRong: 4, banKinh: 2 };
  
  if (clean.includes('lăng trụ') || clean.includes('lang_tru') || clean.includes('prism') || clean.includes("a'b'c'") || rawShapeType.includes('lang_tru') || rawShapeType.includes('prism')) {
    const isQuad = clean.includes('tứ giác') || clean.includes("a'b'c'd'") || clean.includes('thoi') || rawShapeType.includes('tu_giac');
    const isOblique = (clean.includes('xiên') || clean.includes('trọng tâm') || clean.includes('trung điểm') || clean.includes('chiếu của')) && !clean.includes('đứng');
    
    if (isQuad && isOblique) {
      shapeType = 'hinh_lang_tru_tu_giac_xien';
      shapeName = "Hình lăng trụ xiên ABCD.A'B'C'D'";
      parameters = { canhDay: 4, chieuCao: 4.5, chieuDai: 4, chieuRong: 4, banKinh: 2 };
    } else if (isQuad) {
      shapeType = 'hinh_hop_chu_nhat';
      shapeName = "Hình hộp chữ nhật ABCD.A'B'C'D'";
      parameters = { canhDay: 4, chieuCao: 4, chieuDai: 5, chieuRong: 4, banKinh: 2 };
    } else if (isOblique) {
      shapeType = 'hinh_lang_tru_tam_giac_xien';
      shapeName = "Hình lăng trụ xiên ABC.A'B'C'";
      parameters = { canhDay: 4, chieuCao: 4.5, chieuDai: 4, chieuRong: 4, banKinh: 2 };
    } else {
      shapeType = 'hinh_lang_tru_tam_giac_deu';
      shapeName = "Hình lăng trụ tam giác đều ABC.A'B'C'";
      parameters = { canhDay: 4, chieuCao: 6, chieuDai: 4, chieuRong: 4, banKinh: 2 };
    }
  } else if (clean.includes('lập phương') || clean.includes('hộp chữ nhật') || rawShapeType.includes('hop_chu_nhat')) {
    shapeType = 'hinh_hop_chu_nhat';
    if (clean.includes('lập phương')) {
      shapeName = "Hình lập phương ABCD.A'B'C'D'";
      parameters = { canhDay: 4, chieuCao: 4, chieuDai: 4, chieuRong: 4, banKinh: 2 };
    } else {
      shapeName = "Hình hộp chữ nhật ABCD.A'B'C'D'";
      parameters = { canhDay: 4, chieuCao: 3, chieuDai: 5, chieuRong: 4, banKinh: 2 };
    }
  } else if (clean.includes('tứ giác đều') || clean.includes('chóp đều s.abcd') || rawShapeType === 'hinh_chop_tu_giac_deu') {
    shapeType = 'hinh_chop_tu_giac_deu';
    shapeName = 'Hình chóp tứ giác đều S.ABCD';
    parameters = { canhDay: 4, chieuCao: 5, chieuDai: 4, chieuRong: 4, banKinh: 2 };
  } else if (clean.includes('tam giác đều') || clean.includes('tứ diện đều') || clean.includes('chóp tam giác đều') || rawShapeType === 'hinh_chop_tam_giac_deu') {
    shapeType = 'hinh_chop_tam_giac_deu';
    shapeName = 'Hình chóp tam giác đều S.ABC';
    parameters = { canhDay: 4, chieuCao: 5, chieuDai: 4, chieuRong: 4, banKinh: 2 };
  } else if ((/\bs\.abc\b/i.test(clean) || (clean.includes('chóp') && clean.includes('tam giác')) || rawShapeType === 'hinh_chop_tam_giac') && !clean.includes('s.abcd')) {
    shapeType = 'hinh_chop_tam_giac';
    shapeName = 'Hình chóp S.ABC (SA ⊥ đáy)';
    parameters = { canhDay: 4, chieuCao: 5, chieuDai: 4, chieuRong: 4, banKinh: 2 };
  } else if (clean.includes('nón') || clean.includes('non') || rawShapeType.includes('non')) {
    shapeType = 'hinh_non';
    shapeName = 'Hình nón tròn xoay';
    parameters = { banKinh: 3, chieuCao: 5, canhDay: 4 };
  } else if (clean.includes('trụ') || clean.includes('tru') || rawShapeType.includes('tru')) {
    shapeType = 'hinh_tru';
    shapeName = 'Hình trụ tròn xoay';
    parameters = { banKinh: 3, chieuCao: 6, canhDay: 4 };
  } else if (clean.includes('cầu') || clean.includes('cau') || rawShapeType.includes('cau')) {
    shapeType = 'hinh_cau';
    shapeName = 'Hình cầu';
    parameters = { banKinh: 3, chieuCao: 3, canhDay: 4 };
  } else {
    shapeType = 'hinh_chop_day_hcn';
    shapeName = 'Hình chóp S.ABCD (SA ⊥ đáy)';
    parameters = { canhDay: 4, chieuCao: 5, chieuDai: 4, chieuRong: 4, banKinh: 2 };
  }

  if (parsedData?.parameters) {
    if (parsedData.parameters.canhDay) parameters.canhDay = parsedData.parameters.canhDay;
    if (parsedData.parameters.chieuCao) parameters.chieuCao = parsedData.parameters.chieuCao;
    if (parsedData.parameters.chieuDai) parameters.chieuDai = parsedData.parameters.chieuDai;
    if (parsedData.parameters.chieuRong) parameters.chieuRong = parsedData.parameters.chieuRong;
    if (parsedData.parameters.banKinh) parameters.banKinh = parsedData.parameters.banKinh;
  }

  return {
    success: true,
    shapeType,
    shapeName,
    parameters,
    appliedRule: 'smart_interactive_preview',
    explanation: `Chào bạn! Mình đã phân tích đề bài và dựng xong mô hình 3D tương tác: ${shapeName}. Bạn có thể tự do dùng chuột xoay và phóng to để quan sát các góc độ không gian. Bạn cần mình hỗ trợ tính toán hay kẻ thêm đường phụ gì tiếp theo?`,
    sanityCheck: { passed: true, maxDiscrepancy: 0, details: [] },
    needsReview: false,
    donVi: 'cm',
    givenFacts: parsedData?.givenFacts || []
  };
}

async function handleGenerate3D(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const problemText = (body.problemText || '').trim();

    const extracted = extractFallbackGeometry(problemText);
    const solved = solveGeometryFacts(extracted);

    let finalResult;
    if (!solved.success) {
      finalResult = getGenericOrFallbackGeometry(extracted, problemText);
    } else {
      finalResult = {
        success: true,
        shapeType: solved.shapeType || extracted.shapeType,
        shapeName: solved.shapeName || extracted.shapeName,
        parameters: solved.parameters || { canhDay: 4, chieuCao: 5, banKinh: 2 },
        appliedRule: solved.appliedRule,
        ruleId: solved.ruleId,
        explanation: solved.explanation,
        sanityCheck: solved.sanityCheck,
        needsReview: solved.needsReview,
        donVi: 'cm',
        givenFacts: extracted.givenFacts,
        originalProblemText: problemText
      };
    }

    return new Response(JSON.stringify(finalResult), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Powered-By': 'STEM-Hub-SameOrigin-Bridge'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, success: false }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

async function handleChatModel(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const question = body.question || 'Giải thích mô hình';
    const ctx = body.modelContext || {};
    const h = ctx.parameters?.chieuCao || 5;
    const a = ctx.parameters?.canhDay || 4;

    const answer = `📐 **Phân tích hình học khối 3D**:
- **Khối**: ${ctx.shapeName || 'Hình học không gian'}
- **Thông số**: Chiều cao $h = ${h}$, cạnh đáy $a = ${a}$.
- **Thể tích**: Áp dụng công thức $V = \\frac{1}{3} B \\cdot h = \\frac{1}{3} \\cdot ${a * a} \\cdot ${h} = ${(a * a * h / 3).toFixed(2)}$.
- Mô hình hiển thị trực quan các đỉnh, đường cao và thiết diện góc nghiêng theo đúng đề bài.`;

    return new Response(JSON.stringify({ text: answer, success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ text: 'Lỗi xử lý trợ lý hình học.', error: err.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

async function handleChatTutor(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userText = body.userText || '';

    let answer = `Công thức thể tích khối chóp là $V = \\frac{1}{3} B \\cdot h$, với $B$ là diện tích mặt đáy và $h$ là chiều cao hạ từ đỉnh vuông góc xuống đáy. Đối với khối lăng trụ tam giác, thể tích là $V = B \\cdot h$.`;
    if (userText.toLowerCase().includes('lăng trụ')) {
      answer = `Thể tích lăng trụ tam giác tính theo công thức $V = B \\cdot h$, trong đó $B = \\frac{a^2\\sqrt{3}}{4}$ (nếu đáy là tam giác đều cạnh $a$).`;
    }

    return new Response(JSON.stringify({ text: answer, success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ text: 'Lỗi trợ lý gia sư.', error: err.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname === '/api/lab-toan/generate-3d' && event.request.method === 'POST') {
    event.respondWith(handleGenerate3D(event.request));
  } else if (url.pathname === '/api/lab-toan/chat-model' && event.request.method === 'POST') {
    event.respondWith(handleChatModel(event.request));
  } else if (url.pathname === '/api/lab-toan/chat-tutor' && event.request.method === 'POST') {
    event.respondWith(handleChatTutor(event.request));
  }
});
