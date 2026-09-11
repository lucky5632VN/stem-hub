const ab = 12;
const bc = 4;
const h = 6.9282;
const visualH = Math.min(Math.max(h, 4 * 0.9), 4 * 2.2);

const A = [ab, 0, 0];
const B = [0, 0, 0];
const C = [0, bc, 0];

const A_prime = [ab, 0, visualH];
const B_prime = [0, 0, visualH];
const C_prime = [0, bc, visualH];

const vertices = [A, B, C, A_prime, B_prime, C_prime];
const labels = ["A", "B", "C", "A'", "B'", "C'"];
const faces = [
  [0, 2, 1],    // Đáy dưới ABC
  [3, 4, 5],    // Đáy trên A'B'C'
  [0, 1, 4, 3], // ABB'A'
  [1, 2, 5, 4], // BCC'B'
  [2, 0, 3, 5]  // CAA'C'
];
const edges = [
  [0, 1], [1, 2], [2, 0],
  [3, 4], [4, 5], [5, 3],
  [0, 3], [1, 4], [2, 5]
];
const aux = [
  [3, 1] // A'B
];

console.log("Vertices:", vertices);
console.log("Faces:", faces);
console.log("Edges:", edges);
console.log("Aux:", aux);
