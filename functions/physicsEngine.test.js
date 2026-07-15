const { calculateLaserPath } = require('./physicsEngine');

// Định nghĩa vị trí nguồn và mục tiêu
const sourcePos = { x: 45, y: 140 };
const targetPos = { x: 295, y: 140 };

// 5 Test Cases
const testCases = [
  {
    name: "Case 1: Bắn trúng Lõi năng lượng qua cả 3 gương (45, 90, 135)",
    mirrors: [
      { x: 45, y: 50, angle: 45 },
      { x: 175, y: 50, angle: 90 },
      { x: 175, y: 140, angle: 135 }
    ],
    expectedHit: true
  },
  {
    name: "Case 2: Bắn trúng qua 1 gương duy nhất (xoay A=45, B và C để trống hoặc sai nhưng không chắn đường)",
    mirrors: [
      { x: 45, y: 50, angle: 45 }
      // Target thực tế không trúng vì laser rẽ sang phải, đi thẳng tiếp và không gặp gương B, C để bẻ xuống
    ],
    expectedHit: false
  },
  {
    name: "Case 3: Bắn trượt do xoay sai gương A (xoay A=90 độ làm laser đi sai hướng)",
    mirrors: [
      { x: 45, y: 50, angle: 90 },
      { x: 175, y: 50, angle: 90 },
      { x: 175, y: 140, angle: 135 }
    ],
    expectedHit: false
  },
  {
    name: "Case 4: Bắn trượt do xoay sai gương B (xoay B=45 độ làm laser phản chiếu chệch ra ngoài)",
    mirrors: [
      { x: 45, y: 50, angle: 45 },
      { x: 175, y: 50, angle: 45 },
      { x: 175, y: 140, angle: 135 }
    ],
    expectedHit: false
  },
  {
    name: "Case 5: Vòng lặp phản xạ vô hạn (gương xếp đối nhau tạo phản chiếu lặp, giới hạn 10 bước)",
    mirrors: [
      { x: 45, y: 50, angle: 45 },      // Laser đi từ dưới lên gặp A(45) -> rẽ phải sang B
      { x: 175, y: 50, angle: 0 },       // Laser đi ngang gặp B(0) -> phản xạ ngược lại A
      { x: 45, y: 50, angle: 45 }        // Tạo vòng lặp vô hạn
    ],
    expectedHit: false
  }
];

let failed = false;

console.log("=== RUNNING PHYSICS ENGINE UNIT TESTS ===");
testCases.forEach((tc, idx) => {
  const result = calculateLaserPath(tc.mirrors, sourcePos, targetPos);
  const passed = result.isHit === tc.expectedHit;
  
  console.log(`\nTest #${idx + 1}: ${tc.name}`);
  console.log(`- Kết quả: ${result.isHit ? '🎯 TRÚNG' : '❌ TRƯỢT'}`);
  console.log(`- Số đoạn laser: ${result.path.length - 1}`);
  console.log(`- Path:`, result.path);
  if (passed) {
    console.log(`✅ PASSED`);
  } else {
    console.log(`❌ FAILED (Expected: ${tc.expectedHit}, Got: ${result.isHit})`);
    failed = true;
  }
});

console.log("\n=========================================");
if (failed) {
  console.log("❌ MỘT SỐ TEST CASE BỊ THẤT BẠI!");
  process.exit(1);
} else {
  console.log("✅ TẤT CẢ CÁC TEST CASES ĐÃ PASS THÀNH CÔNG!");
  process.exit(0);
}
