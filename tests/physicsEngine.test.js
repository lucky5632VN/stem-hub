const assert = require('assert');
const { calculateLaserPath } = require('../functions/physicsEngine');

console.log("=== RUNNING PHYSICS ENGINE UNIT TESTS ===");

// Helper to print test result
function runTestCase(name, fn) {
  try {
    fn();
    console.log(`✅ Passed: ${name}`);
  } catch (err) {
    console.error(`❌ Failed: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// Case 1: Trúng qua 1 gương
runTestCase("Case 1: Hit target via 1 mirror reflection", () => {
  const mirrors = [
    { x: 45, y: 50, angle: 45 } // Gương A
  ];
  const source = { x: 45, y: 140 };
  const target = { x: 295, y: 50 }; // Đích thẳng hàng bên phải gương A
  const result = calculateLaserPath(mirrors, source, target);
  
  assert.strictEqual(result.isHit, true, "Laser should hit the target");
  assert.strictEqual(result.path.length, 3, "Path should have 3 points (source, mirror A, target)");
  assert.deepStrictEqual(result.path[0], source);
  assert.deepStrictEqual(result.path[1], { x: 45, y: 50 });
  assert.deepStrictEqual(result.path[2], target);
});

// Case 2: Trúng qua 2 gương
runTestCase("Case 2: Hit target via 2 mirrors reflection", () => {
  const mirrors = [
    { x: 45, y: 50, angle: 45 },  // Gương A
    { x: 175, y: 50, angle: 90 }  // Gương B
  ];
  const source = { x: 45, y: 140 };
  const target = { x: 175, y: 140 }; // Đích thẳng hàng bên dưới gương B
  const result = calculateLaserPath(mirrors, source, target);
  
  assert.strictEqual(result.isHit, true, "Laser should hit the target");
  assert.strictEqual(result.path.length, 4, "Path should have 4 points (source, A, B, target)");
  assert.deepStrictEqual(result.path[0], source);
  assert.deepStrictEqual(result.path[1], { x: 45, y: 50 });
  assert.deepStrictEqual(result.path[2], { x: 175, y: 50 });
  assert.deepStrictEqual(result.path[3], target);
});

// Case 3: Trúng qua cả 3 gương
runTestCase("Case 3: Hit target via all 3 mirrors reflection (standard course)", () => {
  const mirrors = [
    { x: 45, y: 50, angle: 45 },   // Gương A
    { x: 175, y: 50, angle: 90 },  // Gương B
    { x: 175, y: 140, angle: 135 } // Gương C
  ];
  const source = { x: 45, y: 140 };
  const target = { x: 295, y: 140 };
  const result = calculateLaserPath(mirrors, source, target);
  
  assert.strictEqual(result.isHit, true, "Laser should hit the target");
  assert.strictEqual(result.path.length, 5, "Path should have 5 points (source, A, B, C, target)");
  assert.deepStrictEqual(result.path[0], source);
  assert.deepStrictEqual(result.path[1], { x: 45, y: 50 });
  assert.deepStrictEqual(result.path[2], { x: 175, y: 50 });
  assert.deepStrictEqual(result.path[3], { x: 175, y: 140 });
  assert.deepStrictEqual(result.path[4], target);
});

// Case 4: Trượt do xoay sai 1 gương
runTestCase("Case 4: Miss target due to misaligned mirror A", () => {
  const mirrors = [
    { x: 45, y: 50, angle: 90 },   // Gương A xoay sai (90 thay vì 45)
    { x: 175, y: 50, angle: 90 },
    { x: 175, y: 140, angle: 135 }
  ];
  const source = { x: 45, y: 140 };
  const target = { x: 295, y: 140 };
  const result = calculateLaserPath(mirrors, source, target);
  
  assert.strictEqual(result.isHit, false, "Laser should NOT hit the target");
  // Laser đi từ nguồn lên A(90) rồi dội ngược thẳng xuống dưới ra ngoài lab
  assert.deepStrictEqual(result.path[1], { x: 45, y: 50 });
  assert.ok(result.path[2].y > 200, "Laser should reflect downwards");
});

// Case 5: Phản xạ vượt quá 10 lần (vòng lặp vô hạn)
runTestCase("Case 5: Handle infinite reflection loops gracefully (capped at 10)", () => {
  const mirrors = [
    { x: 45, y: 50, angle: 45 },   // Gương A bẻ sang phải
    { x: 175, y: 50, angle: 135 }  // Gương B bẻ ngược sang trái
  ];
  const source = { x: 45, y: 140 };
  const target = { x: 295, y: 140 };
  const result = calculateLaserPath(mirrors, source, target);
  
  assert.strictEqual(result.isHit, false, "Laser should NOT hit the target");
  assert.ok(result.path.length <= 12, "Path length should be capped safely");
  console.log(`Note: Reflection loop stopped after ${result.path.length - 1} steps.`);
});

// Case 6: Dynamic offset on custom coordinates
runTestCase("Case 6: Dynamic offset on custom coordinates", () => {
  const mirrors = [
    { x: 100, y: 100, angle: 0, offset: 135 } // Tọa độ tùy ý, góc logic 0 với offset 135 độ
  ];
  const source = { x: 100, y: 200 };
  const target = { x: 200, y: 100 };
  const result = calculateLaserPath(mirrors, source, target);
  
  assert.strictEqual(result.isHit, true, "Laser should hit the target with custom offset");
  assert.strictEqual(result.path.length, 3, "Path should have 3 points");
  assert.deepStrictEqual(result.path[0], source);
  assert.deepStrictEqual(result.path[1], { x: 100, y: 100 });
  assert.deepStrictEqual(result.path[2], target);
});

console.log("=== ALL PHYSICS ENGINE UNIT TESTS PASSED SUCCESSFULLY! ===");
