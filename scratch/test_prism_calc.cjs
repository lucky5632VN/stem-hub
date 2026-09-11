const a = 4;
const h = 4.5; // clear viewable height

// A, B, C
const A = [0, 0, 0];
const B = [a, 0, 0];
const C = [a / 2, Number(((a * Math.sqrt(3)) / 2).toFixed(4)), 0];
const H = [a / 2, 0, 0];

// A' directly above H
const A_prime = [H[0], H[1], h];
const shiftX = A_prime[0] - A[0];
const shiftY = A_prime[1] - A[1];

const B_prime = [B[0] + shiftX, B[1] + shiftY, h];
const C_prime = [C[0] + shiftX, C[1] + shiftY, h];

const vertices = [A, B, C, A_prime, B_prime, C_prime, H];
const labels = ["A", "B", "C", "A'", "B'", "C'", "H"];

const faces = [
  [0, 2, 1],    // Đáy dưới ABC
  [3, 4, 5],    // Đáy trên A'B'C'
  [0, 1, 4, 3], // Mặt bên ABB'A'
  [1, 2, 5, 4], // Mặt bên BCC'B'
  [2, 0, 3, 5]  // Mặt bên CAA'C'
];

const edges = [
  [0, 1], [1, 2], [2, 0], // Đáy dưới
  [3, 4], [4, 5], [5, 3], // Đáy trên
  [0, 3], [1, 4], [2, 5]  // Cạnh bên
];

const auxEdges = [
  [3, 6] // A'H (chiều cao)
];

console.log("Vertices:", vertices);
console.log("Labels:", labels);
console.log("Auxiliary Edge A'H:", auxEdges);
