import { calculateGeometry } from '../src/lib/geometryCalculator.js';
import { solveGeometryFacts, extractFallbackGeometry } from '../src/lib/geometryFactSolver.js';

const problem = "Câu 4. Cho hình lăng trụ đứng ABC.A'B'C' có đáy ABC là tam giác vuông tại B, BC = a, mặt phẳng (A'BC) tạo với đáy một góc 30 độ và tam giác A'BC có diện tích bằng a^2\\sqrt{3}. Tính thể tích khối lăng trụ ABC.A'B'C'.";

const facts = extractFallbackGeometry(problem);
const solved = solveGeometryFacts(facts);

console.log("Solved:", JSON.stringify(solved, null, 2));

const geom = calculateGeometry({
  shapeType: solved.shapeType,
  shapeName: solved.shapeName,
  parameters: solved.parameters,
  appliedRule: solved.appliedRule,
  ruleId: solved.ruleId,
  originalProblemText: problem
});

console.log("\n--- GEOMETRY RESULT ---");
console.log("ShapeName:", geom.shapeName);
console.log("Vertices count:", geom.vertices.length);
console.log("Vertices:", geom.vertices);
console.log("Labels:", geom.labels);
console.log("Faces count:", geom.faces.length);
console.log("Edges count:", geom.edges.length);
console.log("Auxiliary edges:", geom.auxiliary_edges);
console.log("Highlight planes:", geom.highlight_planes);
console.log("Calculations:", geom.calculations);
