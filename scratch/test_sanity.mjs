import { parseNumericValue } from '../src/lib/geometryFactSolver.js';

const fact = {
  type: 'area',
  element: "A'BC",
  value: 'a^2\\sqrt{3}',
  numericValue: 1.732
};

const rawAreaStr = String(fact.value || '').toLowerCase();
const expected = (rawAreaStr.includes('a') || !fact.numericValue || fact.numericValue < 2)
  ? parseNumericValue(fact.value, 16 * Math.sqrt(3))
  : fact.numericValue;

const h = 6.928203;
const ab = 12;
const bc = 4;
const apB = Math.sqrt(h * h + ab * ab);
const computedArea = 0.5 * apB * bc;

console.log('Expected:', expected);
console.log('Computed area:', computedArea);
console.log('Diff:', Math.abs(expected - computedArea));
