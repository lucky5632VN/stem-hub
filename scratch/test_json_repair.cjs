function cleanAndRepairGeometryJson(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw.replace(/```json/gi, '').replace(/```/gi, '').trim();
  const firstBrace = s.indexOf('{');
  const lastBrace = s.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    s = s.substring(firstBrace, lastBrace + 1);
  }
  try { return JSON.parse(s); } catch (e) {}

  // 1. Remove comments
  s = s.replace(/\/\/.*$/gm, '');
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');

  // 2. Normalize algebraic variables and expressions: 2a, a, 2*a, a*sqrt(2)
  s = s.replace(/:\s*([0-9]*\.?[0-9]+)\s*\*?\s*a\b/gi, (_, n) => ': ' + (parseFloat(n || 1) * 4).toFixed(2));
  s = s.replace(/:\s*a\s*\*?\s*sqrt\((\d+)\)/gi, (_, r) => ': ' + (4 * Math.sqrt(parseInt(r, 10))).toFixed(2));
  s = s.replace(/:\s*a\b(?!\w)/gi, ': 4');
  s = s.replace(/:\s*\\?sqrt\{?(\d+)\}?/gi, (_, r) => ': ' + Math.sqrt(parseInt(r, 10)).toFixed(2));

  // 2.5 Replace math functions like sin(45), cos(45), tan(45)
  s = s.replace(/sin\((\d+)(?:°|deg)?\)/gi, (_, deg) => Math.sin((parseInt(deg, 10) * Math.PI) / 180).toFixed(3));
  s = s.replace(/cos\((\d+)(?:°|deg)?\)/gi, (_, deg) => Math.cos((parseInt(deg, 10) * Math.PI) / 180).toFixed(3));
  s = s.replace(/tan\((\d+)(?:°|deg)?\)/gi, (_, deg) => Math.tan((parseInt(deg, 10) * Math.PI) / 180).toFixed(3));

  // 2.6 Evaluate any simple unquoted math expressions like "8.00 * 0.707" or "4 / 2"
  s = s.replace(/:\s*([0-9\.\+\-\*\/\s\(\)]+?)(?=[,\}\]])/g, (match, expr) => {
    const trimmed = expr.trim();
    if (!trimmed) return match;
    // If it's already a single clean number, leave it
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return ': ' + trimmed;
    // Otherwise, try to safely calculate arithmetic
    try {
      // Only allow digits, operators, parens, decimal points
      if (/^[0-9\.\+\-\*\/\s\(\)]+$/.test(trimmed)) {
        const val = Function('"use strict"; return (' + trimmed + ')')();
        if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
          return ': ' + Number(val.toFixed(3));
        }
      }
    } catch {}
    return ': ' + (parseFloat(trimmed) || 4);
  });

  // 3. Remove trailing commas before } or ]
  s = s.replace(/,(\s*[}\]])/g, '$1');

  // 4. Escape stray backslashes
  s = s.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');

  try { 
    return JSON.parse(s); 
  } catch (e) {
    return { error: e.message, s };
  }
}

const test1 = `{
  "shapeType": "hinh_chop_day_hcn",
  "parameters": {
    "canhDay": a,
    "canhSC": 2a,
    "chieuCao": a*sqrt(2),
  }
}`;
console.log('Result 1:', cleanAndRepairGeometryJson(test1));

const test3 = `{
  "shapeType": "hinh_chop_day_hcn",
  "shapeName": "Hình chóp S.ABCD",
  "parameters": {
    "canhDay": 1*a,
    "canhBen": 2*a,
    "goc": 45,
    "chieuCao": 2 * a * sin(45)
  },
  "auxiliaryRequests": []
}`;
console.log('Result 3:', cleanAndRepairGeometryJson(test3));

