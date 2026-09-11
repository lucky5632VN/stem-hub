import { DEFAULT_A_VALUE } from '../src/lib/geometryFactSolver.js';

function stripVietnamese(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function parseNumericValue(val, defaultVal = 4) {
  if (typeof val === 'number') return val;
  if (!val) return defaultVal;

  let s = String(val).trim().toLowerCase();
  if (/^-?\d+(\.\d+)?$/.test(s)) return parseFloat(s);

  // 1. Chèn dấu nhân giữa số/chữ/mũ đứng trước căn thức
  s = s.replace(/([0-9a-zA-Z^]+)\s*\\?(?:sqrt|√|căn)/gi, '$1 * sqrt');

  // 2. Chèn dấu nhân giữa hệ số và ẩn a: 2a -> 2 * a, 3a -> 3 * a
  s = s.replace(/(\d+)\s*a\b/gi, '$1 * a');

  // 3. Chuyển các dạng căn thức về token an toàn __SQRT__(...) TRƯỚC để gỡ bỏ ngoặc nhọn lồng nhau
  s = s
    .replace(/\\?sqrt\{([^{}]+)\}/g, '__SQRT__($1)')
    .replace(/\\?sqrt\s*\((\d+)\)/g, '__SQRT__($1)')
    .replace(/\\?sqrt\s*(\d+)/g, '__SQRT__($1)')
    .replace(/căn\s*bậc\s*(?:hai\s*)?(?:của\s*)?(\d+)/g, '__SQRT__($1)')
    .replace(/căn\s*(\d+)/g, '__SQRT__($1)')
    .replace(/√(\d+)/g, '__SQRT__($1)');

  // 4. Chuyển phân số LaTeX: \frac{a}{b} -> ((a)/(b)) sau khi đã gỡ bỏ ngoặc của \sqrt
  s = s.replace(/\\?frac\{([^{}]+)\}\{([^{}]+)\}/gi, '(($1)/($2))');

  // 5. Thay ẩn a bằng DEFAULT_A_VALUE
  s = s.replace(/\ba\b/g, String(DEFAULT_A_VALUE));

  // 6. Bổ sung dấu nhân nếu còn số hoặc đóng ngoặc đứng trước __SQRT__
  s = s.replace(/(\d+)\s*(?=__SQRT__|\()/g, '$1 * ');
  s = s.replace(/\)\s*(?=__SQRT__|\()/g, ') * ');
  s = s.replace(/(__SQRT__\([^)]+\))\s*(\d+)/g, '$1 * $2');

  // 7. Hoàn trả __SQRT__ về Math.sqrt
  s = s.replace(/__SQRT__/g, 'Math.sqrt');

  // 8. Chuyển lũy thừa ^ sang **
  s = s.replace(/\^/g, '**');

  try {
    const fn = new Function('Math', `"use strict"; return (${s});`);
    const res = fn(Math);
    if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
      return Number(res.toFixed(4));
    }
  } catch {}

  const parsed = parseFloat(s);
  return !isNaN(parsed) ? parsed : defaultVal;
}

function getFactLength(fact, defaultVal = 4) {
  if (!fact) return defaultVal;
  const valStr = String(fact.value || '').toLowerCase().trim();

  if (valStr.includes('a') || valStr.includes('sqrt') || valStr.includes('√') || valStr.includes('*')) {
    const fromFormula = parseNumericValue(valStr, defaultVal);
    if (fromFormula && !isNaN(fromFormula) && fromFormula > 0) {
      return fromFormula;
    }
  }

  if (typeof fact.numericValue === 'number' && !isNaN(fact.numericValue)) {
    if (valStr.includes('2a') && Math.abs(fact.numericValue - 2) < 0.001) return 2 * DEFAULT_A_VALUE;
    if (valStr.includes('3a') && Math.abs(fact.numericValue - 3) < 0.001) return 3 * DEFAULT_A_VALUE;
    if (valStr.includes('4a') && Math.abs(fact.numericValue - 4) < 0.001) return 4 * DEFAULT_A_VALUE;
    if ((valStr === 'a' || valStr === '1a') && Math.abs(fact.numericValue - 1) < 0.001) return DEFAULT_A_VALUE;
    return fact.numericValue;
  }

  return parseNumericValue(fact.value, defaultVal);
}

function findLengthFact(facts, ...aliases) {
  if (!Array.isArray(facts)) return null;
  const aliasLower = aliases.map(a => stripVietnamese(a));
  return facts.find(f => {
    if (f.type !== 'length') return false;
    const elem = stripVietnamese(f.element || f.segment?.join('') || f.name || '');
    return aliasLower.includes(elem);
  }) || null;
}

function findAngleFact(facts, ...keywords) {
  if (!Array.isArray(facts)) return null;
  const kwLower = keywords.map(k => stripVietnamese(k));
  return facts.find(f => {
    if (f.type !== 'angle') return false;
    const between = Array.isArray(f.between) ? f.between.map(stripVietnamese).join(' ') : '';
    const desc = stripVietnamese(f.name || f.element || '');
    const full = between + ' ' + desc;
    return kwLower.every(kw => full.includes(kw));
  }) || null;
}

// Test Gemini's output
const geminiJson = {
  "shapeType": "hinh_lang_tru_dung_tam_giac",
  "shapeName": "Hình lăng trụ đứng ABC.A'B'C'",
  "givenFacts": [
    {
      "type": "property",
      "element": "ABC",
      "description": "tam giác vuông tại B"
    },
    {
      "type": "length",
      "element": "BC",
      "value": "a",
      "numericValue": 1.0
    },
    {
      "type": "angle",
      "between": [
        "(A'BC)",
        "mp_day"
      ],
      "degrees": 30
    },
    {
      "type": "area",
      "element": "A'BC",
      "value": "a^2\\sqrt{3}",
      "numericValue": 1.732
    }
  ]
};

// Check rule 13 match:
const sLower = String(geminiJson.shapeType || '').toLowerCase();
const isPrism = sLower.includes('lang_tru') || sLower.includes('prism') || ['hinh_lang_tru_tam_giac_deu', 'hinh_lang_tru_dung_tam_giac', 'hinh_hop_chu_nhat', 'khac'].includes(sLower);
const areaFact = geminiJson.givenFacts.find(f => f.type === 'area' || (f.element && stripVietnamese(f.element).includes('dientich')));
const angleFact = findAngleFact(geminiJson.givenFacts, 'a\'bc', 'day') || findAngleFact(geminiJson.givenFacts, 'matben', 'day') || findAngleFact(geminiJson.givenFacts, 'day');

console.log('isPrism:', isPrism);
console.log('areaFact:', areaFact);
console.log('angleFact:', angleFact);
console.log('Rule 13 matches:', isPrism && !!(areaFact && angleFact));
