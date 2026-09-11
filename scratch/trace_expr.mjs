const DEFAULT_A_VALUE = 4;

function trace(val) {
  let s = String(val).trim().toLowerCase();
  console.log('Input:', s);

  s = s
    .replace(/\\sqrt\{(\d+)\}/g, '_SQRT_($1)')
    .replace(/\\sqrt\s*(\d+)/g, '_SQRT_($1)')
    .replace(/căn\s*bậc\s*(?:hai\s*)?(?:của\s*)?(\d+)/g, '_SQRT_($1)')
    .replace(/căn\s*(\d+)/g, '_SQRT_($1)')
    .replace(/√(\d+)/g, '_SQRT_($1)')
    .replace(/sqrt\((\d+)\)/g, '_SQRT_($1)')
    .replace(/sqrt(\d+)/g, '_SQRT_($1)');
  console.log('Step 1 (sqrt to _SQRT_):', s);

  s = s
    .replace(/([0-9.]+)\s*\*?\s*a\s*\*?\s*_SQRT_\((\d+)\)/gi, (_, k, n) => `(${parseFloat(k) * DEFAULT_A_VALUE} * Math.sqrt(${n}))`)
    .replace(/a\s*\*?\s*_SQRT_\((\d+)\)/gi, (_, n) => `(${DEFAULT_A_VALUE} * Math.sqrt(${n}))`)
    .replace(/([0-9.]+)\s*\*?\s*_SQRT_\((\d+)\)/gi, (_, k, n) => `(${k} * Math.sqrt(${n}))`);
  console.log('Step 2 (a*_SQRT_):', s);

  s = s.replace(/_SQRT_\((\d+)\)/g, 'Math.sqrt($1)');
  console.log('Step 3 (remaining _SQRT_ to Math.sqrt):', s);

  s = s.replace(/\ba\^2\b/g, String(DEFAULT_A_VALUE * DEFAULT_A_VALUE));
  console.log('Step 4 (a^2):', s);

  s = s.replace(/([0-9.]+)\s*\*?\s*a\b/g, (_, n) => `${n} * ${DEFAULT_A_VALUE}`);
  console.log('Step 5 (num*a):', s);

  s = s.replace(/\ba\b/g, String(DEFAULT_A_VALUE));
  console.log('Step 6 (a):', s);

  s = s.replace(/\^/g, '**');
  console.log('Step 7 (^ to **):', s);

  try {
    const fn = new Function('Math', `"use strict"; return (${s});`);
    const res = fn(Math);
    console.log('Result:', res);
  } catch (err) {
    console.log('Error evaluating:', err.message);
  }
}

trace('a^2\\sqrt{3}');
trace('a^2*sqrt(3)');
trace('a^2*\\sqrt{3}');
