const path = require('path');

async function run() {
  const { solveGeometryFacts, runSanityCheck, FACT_SOLVER_RULES } = await import('../src/lib/geometryFactSolver.js');

  console.log("===============================================================================");
  console.log("KIỂM THỬ BỘ GIẢI HỆ DỮ KIỆN HÌNH HỌC (FACT SOLVER) & SANITY CHECK (KIỂM TRA CHÉO)");
  console.log("===============================================================================\n");

  const testCases = [
    {
      name: "0. Ca đã gây lỗi trước đây: SC = 2a, góc 45°, đáy hình vuông cạnh a",
      problemText: "Cho hình chóp S.ABCD có đáy là hình vuông cạnh a, SA ⊥ đáy, SC = 2a và góc giữa SC và đáy là 45°",
      input: {
        shapeType: "hinh_chop_day_hcn",
        shapeName: "Hình chóp S.ABCD (SA ⊥ đáy)",
        givenFacts: [
          { type: "length", element: "SC", value: "2a", numericValue: 8 },
          { type: "angle", between: ["SC", "mp_day"], degrees: 45 },
          { type: "length", element: "canh_day", value: "a", numericValue: 4 }
        ],
        donVi: "cm"
      }
    },
    {
      name: "1. THPT Test 1: Đáy vuông cạnh a, SA ⊥ đáy, góc (SC, đáy) = 60°",
      problemText: "Cho hình chóp S.ABCD có đáy là hình vuông cạnh a, SA ⊥ (ABCD), góc giữa SC và mặt phẳng đáy bằng 60°",
      input: {
        shapeType: "hinh_chop_day_hcn",
        shapeName: "Hình chóp S.ABCD (SA ⊥ đáy)",
        givenFacts: [
          { type: "length", element: "canh_day", value: "a", numericValue: 4 },
          { type: "angle", between: ["SC", "mp_day"], degrees: 60 }
        ],
        donVi: "cm"
      }
    },
    {
      name: "2. THPT Test 2: Đáy vuông cạnh a, SA ⊥ đáy, cạnh bên SC = a√5",
      problemText: "Cho hình chóp S.ABCD có đáy là hình vuông cạnh a, SA ⊥ đáy, SC = a*sqrt(5)",
      input: {
        shapeType: "hinh_chop_day_hcn",
        shapeName: "Hình chóp S.ABCD (SA ⊥ đáy)",
        givenFacts: [
          { type: "length", element: "canh_day", value: "a", numericValue: 4 },
          { type: "length", element: "SC", value: "a*sqrt(5)", numericValue: Number((4 * Math.sqrt(5)).toFixed(4)) }
        ],
        donVi: "cm"
      }
    },
    {
      name: "3. THPT Test 3: Đáy vuông cạnh a, SA ⊥ đáy, góc mặt bên (SCD) và đáy bằng 45°",
      problemText: "Cho hình chóp S.ABCD có đáy là hình vuông cạnh a, SA ⊥ đáy, góc giữa (SCD) và đáy bằng 45°",
      input: {
        shapeType: "hinh_chop_day_hcn",
        shapeName: "Hình chóp S.ABCD (SA ⊥ đáy)",
        givenFacts: [
          { type: "length", element: "canh_day", value: "a", numericValue: 4 },
          { type: "angle", between: ["(SCD)", "mp_day"], degrees: 45 }
        ],
        donVi: "cm"
      }
    },
    {
      name: "4. THPT Test 4: Chóp tứ giác đều S.ABCD, cạnh đáy a, cạnh bên a√3",
      problemText: "Cho hình chóp tứ giác đều S.ABCD có cạnh đáy bằng a, cạnh bên bằng a√3",
      input: {
        shapeType: "hinh_chop_tu_giac_deu",
        shapeName: "Hình chóp tứ giác đều S.ABCD",
        givenFacts: [
          { type: "length", element: "canh_day", value: "a", numericValue: 4 },
          { type: "length", element: "canh_ben", value: "a*sqrt(3)", numericValue: Number((4 * Math.sqrt(3)).toFixed(4)) }
        ],
        donVi: "cm"
      }
    },
    {
      name: "5. THPT Test 5: Chóp tam giác đều S.ABC, cạnh đáy a, góc mặt bên với đáy bằng 60°",
      problemText: "Cho hình chóp tam giác đều S.ABC có cạnh đáy bằng a, góc giữa mặt bên và đáy bằng 60°",
      input: {
        shapeType: "hinh_chop_tam_giac_deu",
        shapeName: "Hình chóp tam giác đều S.ABC",
        givenFacts: [
          { type: "length", element: "canh_day", value: "a", numericValue: 4 },
          { type: "angle", between: ["mat_ben", "mp_day"], degrees: 60 }
        ],
        donVi: "cm"
      }
    },
    {
      name: "6. Kiểm thử Sanity Check phát hiện dữ kiện mâu thuẫn (Needs Review)",
      problemText: "Đề bài cho mâu thuẫn: SC = 12 nhưng góc SC và đáy = 45°, cạnh đáy a = 4",
      input: {
        shapeType: "hinh_chop_day_hcn",
        shapeName: "Hình chóp S.ABCD (SA ⊥ đáy)",
        givenFacts: [
          { type: "length", element: "SC", value: "12", numericValue: 12 },
          { type: "angle", between: ["SC", "mp_day"], degrees: 45 },
          { type: "length", element: "canh_day", value: "a", numericValue: 4 }
        ],
        donVi: "cm"
      }
    },
    {
      name: "7. Kiểm thử từ chối trung thực khi dữ kiện chưa được hỗ trợ (Unsupported Fallback)",
      problemText: "Cho khối đa diện 20 mặt ngũ giác đều cạnh a...",
      input: {
        shapeType: "khoi_da_dien_khac",
        shapeName: "Khối đa diện đều 20 mặt",
        givenFacts: [
          { type: "length", element: "canh_ngu_giac", value: "4", numericValue: 4 },
          { type: "shape_feature", name: "20_mat_ngu_giac" }
        ],
        donVi: "cm"
      }
    },
    {
      name: "8. THPT Test: Chóp S.ABC đáy vuông tại B, SA ⊥ đáy, góc mặt bên 30°, diện tích a^2*sqrt(3)",
      problemText: "Cho hình chóp tam giác S.ABC có đáy ABC là tam giác vuông tại B, SA ⊥ đáy, BC = a, góc giữa (SBC) và đáy là 30°, diện tích tam giác SBC bằng a^2*sqrt(3)",
      input: {
        shapeType: "hinh_chop_day_hcn",
        shapeName: "Hình chóp S.ABC (SA ⊥ đáy)",
        givenFacts: [
          { type: "length", element: "BC", value: "a", numericValue: 4 },
          { type: "area", element: "SBC", value: "a^2*sqrt(3)", numericValue: Number((16 * Math.sqrt(3)).toFixed(4)) },
          { type: "angle", between: ["(SBC)", "mp_day"], degrees: 30 }
        ],
        donVi: "cm"
      }
    }
  ];

  for (const tc of testCases) {
    console.log(`\n-------------------------------------------------------------------------------`);
    console.log(`📌 ${tc.name}`);
    console.log(`Đề bài: "${tc.problemText}"`);
    console.log(`Dữ kiện trích xuất:`, JSON.stringify(tc.input.givenFacts));

    const result = solveGeometryFacts(tc.input);

    if (result.success) {
      console.log(`✅ Kết quả Fact Solver: THÀNH CÔNG`);
      console.log(`- Quy tắc áp dụng: ${result.appliedRule} (id: ${result.ruleId})`);
      console.log(`- Giải thích toán học: ${result.explanation}`);
      console.log(`- Tham số giải ra:`, result.parameters);
      console.log(`- Sanity Check: ${result.sanityCheck.passed ? 'PASS (Khớp toán học)' : 'FAIL / CẦN XEM LẠI'}`);
      console.log(`- Độ lệch cực đại (maxDiscrepancy): ${result.sanityCheck.maxDiscrepancy}`);
      console.log(`- Chi tiết kiểm tra chéo:`, result.sanityCheck.details);
      console.log(`- Cảnh báo NeedsReview: ${result.needsReview}`);
    } else {
      console.log(`⚠️ Kết quả Fact Solver: TỪ CHỐI TRUNG THỰC (Unsupported)`);
      console.log(`- Thông báo cho học sinh: "${result.message}"`);
    }
  }
}

run().catch(console.error);
