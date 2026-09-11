// Test Script: Kiểm thử Vector Projection & Midpoint trong Hệ tọa độ 3D
const assert = require('assert');

// 1. Vector subtract: B - A
function vecSub(b, a) {
  return [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
}

// 2. Vector add: A + B
function vecAdd(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

// 3. Dot product
function vecDot(u, v) {
  return u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
}

// 4. Scale vector
function vecScale(u, k) {
  return [u[0] * k, u[1] * k, u[2] * k];
}

// 5. Length squared
function vecLenSq(u) {
  return u[0] * u[0] + u[1] * u[1] + u[2] * u[2];
}

// Midpoint calculation
function calculateMidpoint(p1, p2) {
  return [
    Number(((p1[0] + p2[0]) / 2).toFixed(4)),
    Number(((p1[1] + p2[1]) / 2).toFixed(4)),
    Number(((p1[2] + p2[2]) / 2).toFixed(4)),
  ];
}

// Perpendicular projection of P onto line AB
function calculateProjection(p, a, b) {
  const u = vecSub(b, a);
  const v = vecSub(p, a);
  const lenSq = vecLenSq(u);
  if (lenSq < 1e-9) return a;
  const t = vecDot(v, u) / lenSq;
  const proj = vecAdd(a, vecScale(u, t));
  return [
    Number(proj[0].toFixed(4)),
    Number(proj[1].toFixed(4)),
    Number(proj[2].toFixed(4)),
  ];
}

console.log("================================================================================");
console.log("📐 KIỂM THỬ VECTOR 3D: HÌNH CHIẾU VUÔNG GÓC & TRUNG ĐIỂM");
console.log("================================================================================");

// Case 1: Chóp S.ABCD đáy vuông cạnh 8, SA vuông góc đáy, SA = 6, SB = 10
// A = (0, 0, 0), B = (8, 0, 0), C = (8, 8, 0), D = (0, 8, 0), S = (0, 0, 6)
const A = [0, 0, 0];
const B = [8, 0, 0];
const C = [8, 8, 0];
const S = [0, 0, 6];

// Test 1: Kẻ AH vuông góc với SB
// Tam giác SAB vuông tại A có SA = 6, AB = 8, SB = 10.
// Theo hệ thức lượng: SH * SB = SA^2 => SH * 10 = 36 => SH = 3.6
// Tỉ số t = SH / SB = 3.6 / 10 = 0.36
// H = S + 0.36 * (B - S) = (0, 0, 6) + 0.36 * (8, 0, -6) = (2.88, 0, 3.84)
const H = calculateProjection(A, S, B);
console.log("1. Hình chiếu H của A lên SB:", H);
console.log("   Lý thuyết: H = (2.88, 0, 3.84)");

// Kiểm tra AH vuông góc với SB: (H - A) . (B - S) = 0
const AH = vecSub(H, A);
const SB = vecSub(B, S);
const dotProduct = vecDot(AH, SB);
console.log("   Tích vô hướng AH . SB =", dotProduct.toFixed(6));
assert(Math.abs(dotProduct) < 1e-4, "AH phải vuông góc với SB!");
assert.deepStrictEqual(H, [2.88, 0, 3.84]);
console.log("   => ✅ ĐẠT: AH vuông góc 100% với SB!");

// Test 2: Trung điểm M của SC
// S = (0, 0, 6), C = (8, 8, 0)
// M = (4, 4, 3)
const M = calculateMidpoint(S, C);
console.log("\n2. Trung điểm M của SC:", M);
console.log("   Lý thuyết: M = (4, 4, 3)");
assert.deepStrictEqual(M, [4, 4, 3]);
console.log("   => ✅ ĐẠT: Tọa độ trung điểm M hoàn toàn chính xác!");

console.log("\n================================================================================");
console.log("🏆 TẤT CẢ PHÉP TOÁN VECTOR 3D ĐÃ VƯỢT QUA KIỂM THỬ!");
console.log("================================================================================");
