const DEFAULT_A_VALUE = 4;

function parseBetter(val, defaultVal = 4) {
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
  } catch (err) {
    console.warn('parseBetter error on:', s, err.message);
  }

  const parsed = parseFloat(s);
  return !isNaN(parsed) ? parsed : defaultVal;
}

console.log("a^2\\sqrt{3} ->", parseBetter("a^2\\sqrt{3}"));
console.log("a^2*sqrt(3) ->", parseBetter("a^2*sqrt(3)"));
console.log("a\\sqrt{3} ->", parseBetter("a\\sqrt{3}"));
console.log("2a\\sqrt{3} ->", parseBetter("2a\\sqrt{3}"));
console.log("\\frac{a^2\\sqrt{3}}{4} ->", parseBetter("\\frac{a^2\\sqrt{3}}{4}"));
console.log("a^3\\sqrt{2}/4 ->", parseBetter("a^3\\sqrt{2}/4"));
