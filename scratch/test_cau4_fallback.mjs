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

  s = s.replace(/([0-9a-zA-Z^]+)\s*\\?(?:sqrt|√|căn)/gi, '$1 * sqrt');
  s = s.replace(/(\d+)\s*a\b/gi, '$1 * a');
  s = s
    .replace(/\\?sqrt\{([^{}]+)\}/g, '__SQRT__($1)')
    .replace(/\\?sqrt\s*\((\d+)\)/g, '__SQRT__($1)')
    .replace(/\\?sqrt\s*(\d+)/g, '__SQRT__($1)')
    .replace(/căn\s*bậc\s*(?:hai\s*)?(?:của\s*)?(\d+)/g, '__SQRT__($1)')
    .replace(/căn\s*(\d+)/g, '__SQRT__($1)')
    .replace(/√(\d+)/g, '__SQRT__($1)');
  s = s.replace(/\\?frac\{([^{}]+)\}\{([^{}]+)\}/gi, '(($1)/($2))');
  s = s.replace(/\ba\b/g, String(DEFAULT_A_VALUE));
  s = s.replace(/(\d+)\s*(?=__SQRT__|\()/g, '$1 * ');
  s = s.replace(/\)\s*(?=__SQRT__|\()/g, ') * ');
  s = s.replace(/(__SQRT__\([^)]+\))\s*(\d+)/g, '$1 * $2');
  s = s.replace(/__SQRT__/g, 'Math.sqrt');
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

function extractFallback(problemText) {
  const clean = (problemText || '').toLowerCase();
  let shapeType = 'hinh_chop_day_hcn';
  let shapeName = 'Hình chóp S.ABCD (SA ⊥ đáy)';
  const givenFacts = [];

  // Lengths
  const segRegex = /\b(ab|bc|cd|da|ad|ac|bd|sa|sb|sc|sd|so|sh|aa'|aa)\s*(?:bằng\s*|=)\s*([^\n,;.]+)/gi;
  let m;
  while ((m = segRegex.exec(clean)) !== null) {
    const segName = m[1].toUpperCase();
    const rawVal = m[2].trim();
    if (rawVal && !rawVal.includes('vuông') && !rawVal.includes('song song')) {
      const val = parseNumericValue(rawVal);
      if (!givenFacts.some(f => f.element === segName)) {
        givenFacts.push({ type: 'length', element: segName, value: rawVal, numericValue: val });
      }
    }
  }

  // Area
  const areaMatch = clean.match(/(?:diện tích|s_[a-z0-9']+|\bs\s*=|s\s*\([a-z0-9']+\))\s*(?:tam giác)?\s*([a-z0-9']+)?\s*(?:bằng|=)?\s*([0-9a-z\*\.\s√\^\\{}_/()]+?)(?:$|[\n,;.])/i);
  if (areaMatch) {
    const rawVal = areaMatch[2].trim();
    const areaVal = parseNumericValue(rawVal, 16 * Math.sqrt(3));
    const elemName = clean.includes("a'bc") ? "A'BC" : (clean.includes('sbc') ? 'SBC' : 'dien_tich');
    givenFacts.push({ type: 'area', element: elemName, value: rawVal, numericValue: areaVal });
  }

  // Angle
  const faceAngleMatch = clean.match(/(?:góc giữa|mặt phẳng nghiêng|mặt bên|tạo với|mặt phẳng).*?(\d+)(?:°| độ|deg)/i);
  if (faceAngleMatch) {
    const deg = parseFloat(faceAngleMatch[1]);
    const targetFace = clean.includes("a'bc") ? "(A'BC)" : (clean.includes('sbc') ? '(SBC)' : 'mat_ben');
    givenFacts.push({ type: 'angle', between: [targetFace, 'mp_day'], degrees: deg });
  }

  if (clean.includes('lăng trụ') || clean.includes("a'b'c'")) {
    shapeType = 'hinh_lang_tru_dung_tam_giac';
    shapeName = "Hình lăng trụ đứng ABC.A'B'C'";
  }

  return { shapeType, shapeName, givenFacts };
}

const text = "Câu 4. Cho hình lăng trụ đứng ABC.A'B'C' có đáy ABC là tam giác vuông tại B, BC = a, mặt phẳng (A'BC) tạo với đáy một góc 30 độ và tam giác A'BC có diện tích bằng a^2\\sqrt{3}. Tính thể tích khối lăng trụ ABC.A'B'C'.";
const ext = extractFallback(text);
console.log('Extracted Fallback:', JSON.stringify(ext, null, 2));
