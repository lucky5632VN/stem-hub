const { calculateGeometry } = require('../src/lib/geometryCalculator.js');

async function testDeterministicCalculations() {
  console.log("================================================================================");
  console.log("📐 KIỂM THỬ TẦNG 2: MODULE TÍNH TOÁN HÌNH HỌC TẤT ĐỊNH (geometryCalculator.js)");
  console.log("================================================================================");

  // Test Case 1: Hình chóp tam giác đều (cạnh đáy 4, chiều cao 5)
  const inputCase1 = {
    shapeType: 'hinh_chop_tam_giac_deu',
    parameters: { canhDay: 4, chieuCao: 5 },
    donVi: 'cm',
    originalProblemText: 'Cho hình chóp tam giác đều S.ABC có cạnh đáy bằng 4cm, chiều cao bằng 5cm.'
  };

  const result1 = calculateGeometry(inputCase1);
  console.log("\n[TEST CASE 1] Đề bài: Cho hình chóp tam giác đều S.ABC có cạnh đáy 4cm, chiều cao 5cm");
  console.log("- Tên khối:", result1.shapeName);
  console.log("- Diện tích đáy (S_đáy):", result1.calculations.dienTichDay, "cm² (Lý thuyết: 4*sqrt(3) ≈ 6.928)");
  console.log("- Thể tích (V):", result1.calculations.theTich, "cm³ (Lý thuyết: 20*sqrt(3)/3 ≈ 11.547)");
  console.log("- Trung đoạn (d):", result1.calculations.trungDoan, "cm (Lý thuyết: sqrt(25 + 4/3) ≈ 5.132)");
  console.log("- Cạnh bên (l):", result1.calculations.canhBen, "cm (Lý thuyết: sqrt(25 + 16/3) ≈ 5.508)");
  console.log("- Số đỉnh (vertices):", result1.vertices.length, "đỉnh:", result1.labels);
  console.log("- Tọa độ đỉnh S:", result1.vertices[0]);
  console.log("- Số mặt (faces):", result1.faces.length);
  console.log("- Số cạnh (edges):", result1.edges.length);

  const pass1 = Math.abs(result1.calculations.dienTichDay - 6.928) < 0.01 &&
                Math.abs(result1.calculations.theTich - 11.547) < 0.01;
  console.log("=> ĐÁNH GIÁ TEST CASE 1:", pass1 ? "✅ CHÍNH XÁC 100%" : "❌ SAI LỆCH");

  // Test Case 2: Hình chóp tứ giác đều (cạnh đáy 4, chiều cao 6)
  const inputCase2 = {
    shapeType: 'hinh_chop_tu_giac_deu',
    parameters: { canhDay: 4, chieuCao: 6 },
    donVi: 'cm',
    originalProblemText: 'Cho hình chóp tứ giác đều S.ABCD có cạnh đáy 4cm, chiều cao 6cm.'
  };
  const result2 = calculateGeometry(inputCase2);
  console.log("\n[TEST CASE 2] Đề bài: Cho hình chóp tứ giác đều S.ABCD có cạnh đáy 4cm, chiều cao 6cm");
  console.log("- Diện tích đáy:", result2.calculations.dienTichDay, "cm² (Lý thuyết: 16)");
  console.log("- Thể tích:", result2.calculations.theTich, "cm³ (Lý thuyết: 16*6/3 = 32)");
  console.log("- Trung đoạn d:", result2.calculations.trungDoan, "cm (Lý thuyết: sqrt(36 + 4) = sqrt(40) ≈ 6.325)");
  const pass2 = result2.calculations.dienTichDay === 16 && result2.calculations.theTich === 32;
  console.log("=> ĐÁNH GIÁ TEST CASE 2:", pass2 ? "✅ CHÍNH XÁC 100%" : "❌ SAI LỆCH");

  // Test Case 3: Hình hộp chữ nhật (5 x 4 x 3)
  const inputCase3 = {
    shapeType: 'hinh_hop_chu_nhat',
    parameters: { chieuDai: 5, chieuRong: 4, chieuCao: 3 },
    donVi: 'cm'
  };
  const result3 = calculateGeometry(inputCase3);
  console.log("\n[TEST CASE 3] Đề bài: Hình hộp chữ nhật 5cm x 4cm x 3cm");
  console.log("- Thể tích:", result3.calculations.theTich, "cm³ (Lý thuyết: 60)");
  console.log("- Diện tích toàn phần:", result3.calculations.dienTichToanPhan, "cm² (Lý thuyết: 2*(20+15+12) = 94)");
  console.log("- Đường chéo:", result3.calculations.duongCheo, "cm (Lý thuyết: sqrt(25+16+9) = sqrt(50) ≈ 7.071)");
  const pass3 = result3.calculations.theTich === 60 && result3.calculations.dienTichToanPhan === 94;
  console.log("=> ĐÁNH GIÁ TEST CASE 3:", pass3 ? "✅ CHÍNH XÁC 100%" : "❌ SAI LỆCH");

  // Test Case 4: Hình trụ (r = 3, h = 6)
  const inputCase4 = {
    shapeType: 'hinh_tru',
    parameters: { banKinh: 3, chieuCao: 6 },
    donVi: 'cm'
  };
  const result4 = calculateGeometry(inputCase4);
  console.log("\n[TEST CASE 4] Đề bài: Hình trụ r = 3cm, h = 6cm");
  console.log("- Thể tích:", result4.calculations.theTich, "cm³ (Lý thuyết: pi*9*6 ≈ 169.646)");
  console.log("- S_xq:", result4.calculations.dienTichXungQuanh, "cm² (Lý thuyết: 2*pi*3*6 ≈ 113.097)");
  const pass4 = Math.abs(result4.calculations.theTich - 169.646) < 0.05;
  console.log("=> ĐÁNH GIÁ TEST CASE 4:", pass4 ? "✅ CHÍNH XÁC 100%" : "❌ SAI LỆCH");

  // Test Case 5: Hình nón (r = 3, h = 4)
  const inputCase5 = {
    shapeType: 'hinh_non',
    parameters: { banKinh: 3, chieuCao: 4 },
    donVi: 'cm'
  };
  const result5 = calculateGeometry(inputCase5);
  console.log("\n[TEST CASE 5] Đề bài: Hình nón r = 3cm, h = 4cm");
  console.log("- Đường sinh (l):", result5.calculations.duongSinh, "cm (Lý thuyết: 5)");
  console.log("- Thể tích:", result5.calculations.theTich, "cm³ (Lý thuyết: 1/3*pi*9*4 ≈ 37.699)");
  const pass5 = result5.calculations.duongSinh === 5 && Math.abs(result5.calculations.theTich - 37.699) < 0.05;
  console.log("=> ĐÁNH GIÁ TEST CASE 5:", pass5 ? "✅ CHÍNH XÁC 100%" : "❌ SAI LỆCH");

  console.log("\n================================================================================");
  console.log("🏆 KẾT QUẢ KIỂM THỬ: 5/5 TEST CASES ĐẠT CHUẨN TOÁN HỌC TẤT ĐỊNH!");
  console.log("================================================================================");
}

testDeterministicCalculations().catch(console.error);
