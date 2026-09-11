import { extractFallbackGeometry, solveGeometryFacts } from '../src/lib/geometryFactSolver.js';
import { calculateGeometry } from '../src/lib/geometryCalculator.js';

const problemText = "Câu 2. Cho lăng trụ ABCD.A'B'C'D' có ABCD là hình thoi. Hình chiếu của A' lên (ABCD) là trọng tâm của tam giác ABD. Tính thể tích khối lăng trụ ABC.A'B'C' biết AB = a, góc ABC = 120 độ, AA' = a.";

console.log("=== Testing Problem 2 Pipeline from Raw Text ===");
const extracted = extractFallbackGeometry(problemText);
console.log("Extracted shapeType:", extracted.shapeType);
console.log("Extracted facts count:", extracted.givenFacts.length);

const solved = solveGeometryFacts(extracted);
console.log("Solved rule:", solved.appliedRule);
console.log("Solved shapeType:", solved.shapeType);
console.log("Solved sanityCheck:", solved.sanityCheck);

const geo = calculateGeometry({
  ...extracted,
  ...solved,
  parameters: solved.parameters
});
console.log("Geo shapeName:", geo.shapeName);
console.log("Geo labels:", geo.labels);
console.log("Geo auxiliary_edges count:", geo.auxiliary_edges.length);
console.log("Geo highlight_planes:", geo.highlight_planes);
