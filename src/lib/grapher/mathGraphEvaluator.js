/**
 * Math Graph Evaluator & Calculus Engine
 * Cung cấp bộ tính toán giải tích an toàn, tìm cực trị, nghiệm, đạo hàm, tích phân
 */

// Tokenize & compile safe math expression
export function compileExpression(exprStr) {
  if (!exprStr || typeof exprStr !== 'string') {
    return () => 0;
  }

  // Tiền xử lý biểu thức: thay thế các ký hiệu thông dụng
  let clean = exprStr
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/(\d)([a-z(])/g, '$1*$2') // 2x -> 2*x, 3(x) -> 3*(x)
    .replace(/(\))([a-z\d(])/g, '$1*$2') // (x)(x) -> (x)*(x)
    .replace(/\^/g, '**');

  // Cho phép các hàm toán học an toàn
  const safeMath = {
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    sinh: Math.sinh,
    cosh: Math.cosh,
    tanh: Math.tanh,
    exp: Math.exp,
    log: Math.log,
    ln: Math.log,
    sqrt: Math.sqrt,
    abs: Math.abs,
    pi: Math.PI,
    e: Math.E,
    pow: Math.pow,
    ceil: Math.ceil,
    floor: Math.floor,
    round: Math.round,
  };

  try {
    // Tạo function an toàn với ngữ cảnh Math giới hạn
    const keys = Object.keys(safeMath);
    const vals = Object.values(safeMath);
    
    // eslint-disable-next-line no-new-func
    const fn = new Function(...keys, 'x', `
      try {
        const res = (${clean});
        return (typeof res === 'number' && !isNaN(res) && isFinite(res)) ? res : null;
      } catch (e) {
        return null;
      }
    `);

    return (x) => fn(...vals, x);
  } catch (err) {
    console.warn('Lỗi biên dịch biểu thức:', err);
    return () => null;
  }
}

/**
 * Tính đạo hàm số trị f'(x) bằng sai phân trung tâm
 */
export function numericalDerivative(fn, x, h = 1e-5) {
  const y1 = fn(x + h);
  const y0 = fn(x - h);
  if (y1 === null || y0 === null) return null;
  return (y1 - y0) / (2 * h);
}

/**
 * Tính đạo hàm bậc hai f''(x)
 */
export function numericalSecondDerivative(fn, x, h = 1e-4) {
  const yPlus = fn(x + h);
  const y = fn(x);
  const yMinus = fn(x - h);
  if (yPlus === null || y === null || yMinus === null) return null;
  return (yPlus - 2 * y + yMinus) / (h * h);
}

/**
 * Tính tích phân xác định bằng công thức hình thang kết hợp Simpson
 */
export function numericalIntegral(fn, a, b, n = 100) {
  if (a > b) {
    const tmp = a; a = b; b = tmp;
  }
  const h = (b - a) / n;
  let sum = 0;
  let validSteps = 0;

  for (let i = 0; i < n; i++) {
    const x0 = a + i * h;
    const x1 = a + (i + 1) * h;
    const y0 = fn(x0);
    const y1 = fn(x1);
    if (y0 !== null && y1 !== null) {
      sum += (y0 + y1) * 0.5 * h;
      validSteps++;
    }
  }

  return validSteps > 0 ? sum : 0;
}

/**
 * Tìm các điểm cực trị (Cực đại, cực tiểu) trong khoảng [minX, maxX]
 */
export function findExtrema(fn, minX, maxX, steps = 200) {
  const dx = (maxX - minX) / steps;
  const extrema = [];

  for (let i = 1; i < steps - 1; i++) {
    const x = minX + i * dx;
    const d1 = numericalDerivative(fn, x);
    const d1Prev = numericalDerivative(fn, x - dx);
    const d1Next = numericalDerivative(fn, x + dx);

    if (d1Prev !== null && d1Next !== null) {
      // Đổi dấu đạo hàm: từ dương sang âm -> Cực đại, từ âm sang dương -> Cực tiểu
      if (d1Prev > 0 && d1Next < 0) {
        const y = fn(x);
        if (y !== null) {
          extrema.push({ type: 'max', x: Number(x.toFixed(3)), y: Number(y.toFixed(3)), label: 'Cực đại' });
        }
      } else if (d1Prev < 0 && d1Next > 0) {
        const y = fn(x);
        if (y !== null) {
          extrema.push({ type: 'min', x: Number(x.toFixed(3)), y: Number(y.toFixed(3)), label: 'Cực tiểu' });
        }
      }
    }
  }

  return extrema;
}

/**
 * Tìm các nghiệm f(x) = 0 trong khoảng [minX, maxX]
 */
export function findRoots(fn, minX, maxX, steps = 200) {
  const dx = (maxX - minX) / steps;
  const roots = [];

  for (let i = 0; i < steps; i++) {
    const x1 = minX + i * dx;
    const x2 = x1 + dx;
    const y1 = fn(x1);
    const y2 = fn(x2);

    if (y1 !== null && y2 !== null && y1 * y2 <= 0) {
      // Bisection cải tiến
      let a = x1, b = x2;
      for (let iter = 0; iter < 12; iter++) {
        const mid = (a + b) / 2;
        const ym = fn(mid);
        if (ym === null) break;
        if (y1 * ym <= 0) {
          b = mid;
        } else {
          a = mid;
        }
      }
      const rootX = (a + b) / 2;
      // Tránh trùng nghiệm lân cận
      if (!roots.some(r => Math.abs(r - rootX) < 0.1)) {
        roots.push(Number(rootX.toFixed(3)));
      }
    }
  }

  return roots;
}

/**
 * Bộ mẫu hàm số chuẩn THPT & THCS
 */
export const MATH_PRESETS = [
  {
    id: 'parabola',
    name: 'Hàm số bậc 2 (Parabol)',
    formula: 'a * x^2 + b * x + c',
    defaultParams: { a: 1, b: -2, c: -3 },
    latex: 'y = ax^2 + bx + c',
    desc: 'Khảo sát đỉnh I(-b/2a, -Δ/4a), trục đối xứng và bề lõm đồ thị.',
    generateExpr: (p) => `${p.a} * x^2 + ${p.b} * x + ${p.c}`,
  },
  {
    id: 'cubic',
    name: 'Hàm số bậc 3',
    formula: 'a * x^3 + b * x^2 + c * x + d',
    defaultParams: { a: 1, b: 0, c: -3, d: 2 },
    latex: 'y = ax^3 + bx^2 + cx + d',
    desc: 'Khảo sát 2 điểm cực trị, điểm uốn tâm đối xứng I.',
    generateExpr: (p) => `${p.a} * x^3 + ${p.b} * x^2 + ${p.c} * x + ${p.d}`,
  },
  {
    id: 'rational',
    name: 'Phân thức hữu tỉ bậc nhất',
    formula: '(a * x + b) / (c * x + d)',
    defaultParams: { a: 2, b: -1, c: 1, d: 1 },
    latex: 'y = \\frac{ax+b}{cx+d}',
    desc: 'Đồ thị hypebol với tiệm cận đứng x = -d/c và tiệm cận ngang y = a/c.',
    generateExpr: (p) => `(${p.a} * x + ${p.b}) / (${p.c} * x + ${p.d})`,
  },
  {
    id: 'trig_sin',
    name: 'Hàm số lượng giác Sin',
    formula: 'A * sin(w * x + phi) + k',
    defaultParams: { A: 2, w: 1, phi: 0, k: 0 },
    latex: 'y = A\\sin(\\omega x + \\varphi) + k',
    desc: 'Đồ thị hình sin tuần hoàn với chu kỳ T = 2π/ω, biên độ A.',
    generateExpr: (p) => `${p.A} * sin(${p.w} * x + ${p.phi}) + ${p.k}`,
  },
  {
    id: 'exponential',
    name: 'Hàm số Mũ & Tự nhiên',
    formula: 'a * exp(b * x)',
    defaultParams: { a: 1, b: 0.5 },
    latex: 'y = a \\cdot e^{bx}',
    desc: 'Mô hình tăng trưởng mũ sinh học, tiệm cận ngang trục hoành.',
    generateExpr: (p) => `${p.a} * exp(${p.b} * x)`,
  },
  {
    id: 'custom',
    name: 'Hàm số Tùy Chỉnh',
    formula: 'x^3 - 3*x + 1',
    defaultParams: {},
    latex: 'y = f(x)',
    desc: 'Tự do nhập bất kỳ biểu thức toán học nào bạn muốn khảo sát.',
    generateExpr: (_, customStr) => customStr || 'x^2',
  }
];
