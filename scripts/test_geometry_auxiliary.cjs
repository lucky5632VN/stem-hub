const { calculateGeometry } = require('../src/lib/geometryCalculator.js');
const assert = require('assert');

console.log("================================================================================");
console.log("📐 KIỂM THỬ TẦNG 2: XỬ LÝ KẺ ĐƯỜNG PHỤ (AUXILIARY GEOMETRY)");
console.log("================================================================================");

const input = {
  shapeType: "hinh_chop_day_hcn",
  shapeName: "S.ABCD (SA vuông góc đáy)",
  parameters: {
    canhDay: 8,
    chieuDai: 8,
    chieuRong: 8,
    chieuCao: 6
  },
  auxiliaryRequests: [
    {
      type: "perpendicular",
      from: "A",
      toLine: ["S", "B"],
      pointName: "H"
    },
    {
      type: "midpoint",
      onLine: ["S", "C"],
      pointName: "M",
      connectFrom: "A"
    }
  ],
  donVi: "cm",
  originalProblemText: "Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh 8cm, SA vuông góc với đáy và SA = 6cm. Kẻ AH vuông góc với SB tại H. Gọi M là trung điểm của SC. Kẻ AM."
};

const result = calculateGeometry(input);

console.log("Shape:", result.shapeName);
console.log("Số lượng đỉnh gốc + phụ:", result.vertices.length);
console.log("Danh sách nhãn:", result.labels);
console.log("Nhãn điểm phụ:", result.auxiliary_labels);
console.log("Danh sách tọa độ:");
result.labels.forEach((lbl, idx) => {
  console.log(`  ${lbl}:`, result.vertices[idx]);
});

console.log("\nDanh sách cạnh phụ (auxiliary_edges):", result.auxiliary_edges);
result.auxiliary_edges.forEach(([p1, p2]) => {
  console.log(`  Đoạn ${result.labels[p1]}${result.labels[p2]}:`, result.vertices[p1], "->", result.vertices[p2]);
});

// Assertions
assert(result.labels.includes("H"), "Phải có nhãn H");
assert(result.labels.includes("M"), "Phải có nhãn M");
assert(result.auxiliary_labels.includes("H"), "H phải nằm trong auxiliary_labels");
assert(result.auxiliary_labels.includes("M"), "M phải nằm trong auxiliary_labels");
assert(result.auxiliary_edges.length === 2, "Phải có đúng 2 cạnh phụ (AH và AM)");

// Verify H coordinates: A=(0,0,0), S=(0,0,6), B=(8,0,0)
const hIdx = result.labels.indexOf("H");
const H = result.vertices[hIdx];
console.log("\nKiểm tra tọa độ H:", H);
assert.deepStrictEqual(H, [2.88, 0, 3.84], "Tọa độ H phải bằng [2.88, 0, 3.84]");

// Verify M coordinates: S=(0,0,6), C=(8,8,0) => M=(4,4,3)
const mIdx = result.labels.indexOf("M");
const M = result.vertices[mIdx];
console.log("Kiểm tra tọa độ M:", M);
assert.deepStrictEqual(M, [4, 4, 3], "Tọa độ M phải bằng [4, 4, 3]");

console.log("\n================================================================================");
console.log("🏆 TẤT CẢ PHÉP TÍNH ĐƯỜNG PHỤ (GIAI ĐOẠN 5) ĐẠT ĐỘ CHÍNH XÁC 100%!");
console.log("================================================================================");
