import { solveGeometryFacts, runSanityCheck, extractFallbackGeometry, FACT_SOLVER_RULES } from '../src/lib/geometryFactSolver.js';
import { calculateGeometry, normalizeShapeType } from '../src/lib/geometryCalculator.js';
import { toNaturalVietnameseMathText } from '../src/lib/mathFormatter.js';

console.log("=================================================");
console.log("   AUTOMATED GEOMETRY ENGINE COMPREHENSIVE SUITE ");
console.log("=================================================");

const testCases = [
  {
    id: "TC1_LangTruXien_DayThoi_TrongTam",
    name: "Lăng trụ xiên ABCD.A'B'C'D' đáy hình thoi, hình chiếu A' là trọng tâm ABD",
    problemText: "Cho lăng trụ ABCD.A'B'C'D' có ABCD là hình thoi cạnh a, góc ABC = 120 độ. Hình chiếu vuông góc của A' lên (ABCD) là trọng tâm của tam giác ABD. Biết AA' = a.",
    expectedShape: "hinh_lang_tru_tu_giac_xien",
    expectedRule: "lang_tru_day_thoi_chieu_trong_tam_abd"
  },
  {
    id: "TC2_LangTruXien_DayTamGiac_TrungDiem",
    name: "Lăng trụ xiên ABC.A'B'C' hình chiếu A' là trung điểm AB",
    problemText: "Cho hình lăng trụ ABC.A'B'C' có đáy ABC là tam giác đều cạnh a. Hình chiếu vuông góc của A' trên (ABC) là trung điểm H của AB.",
    expectedShape: "hinh_lang_tru_tam_giac_xien",
    expectedRule: "lang_tru_xien_h_chieu_ab"
  },
  {
    id: "TC3_LangTruXien_DayTamGiac_TrongTam",
    name: "Lăng trụ xiên ABC.A'B'C' hình chiếu A' là trọng tâm tam giác ABC",
    problemText: "Cho hình lăng trụ ABC.A'B'C' có đáy ABC là tam giác đều cạnh a. Hình chiếu vuông góc của A' lên mặt phẳng (ABC) trùng với trọng tâm của tam giác ABC.",
    expectedShape: "hinh_lang_tru_tam_giac_xien",
    expectedRule: null
  },
  {
    id: "TC4_LangTruDung_TamGiac",
    name: "Lăng trụ đứng tam giác ABC.A'B'C'",
    problemText: "Cho hình lăng trụ đứng ABC.A'B'C' có đáy ABC là tam giác vuông tại A, AB = 3, AC = 4, chiều cao AA' = 5.",
    expectedShape: "hinh_lang_tru_tam_giac_deu",
    expectedRule: null
  },
  {
    id: "TC5_HinhHopChuNhat",
    name: "Hình hộp chữ nhật ABCD.A'B'C'D'",
    problemText: "Cho hình hộp chữ nhật ABCD.A'B'C'D' có đáy là hình chữ nhật AB = 4, AD = 5, chiều cao AA' = 6.",
    expectedShape: "hinh_hop_chu_nhat",
    expectedRule: null
  },
  {
    id: "TC6_Chop_SAPerpDay_DayHCN",
    name: "Hình chóp S.ABCD có SA vuông góc đáy, đáy hình chữ nhật",
    problemText: "Cho hình chóp S.ABCD có đáy ABCD là hình chữ nhật, AB = a, AD = 2a, SA vuông góc với mặt phẳng (ABCD), SA = a căn 3.",
    expectedShape: "hinh_chop_day_hcn",
    expectedRule: null
  },
  {
    id: "TC7_Chop_SAPerpDay_DayTamGiac_GocMatBen",
    name: "Hình chóp S.ABC có SA vuông góc đáy, góc mặt bên (SBC) và đáy là 60 độ",
    problemText: "Cho hình chóp S.ABC có SA vuông góc với mặt phẳng đáy, tam giác ABC vuông cân tại A có BC = 4 căn 2. Góc giữa mặt bên (SBC) và đáy bằng 60 độ.",
    expectedShape: "hinh_chop_tam_giac",
    expectedRule: "chop_sabc_sa_perp_face_angle"
  },
  {
    id: "TC8_ChopTuGiacDeu",
    name: "Hình chóp tứ giác đều S.ABCD",
    problemText: "Cho hình chóp tứ giác đều S.ABCD có cạnh đáy bằng 4, chiều cao SO = 5.",
    expectedShape: "hinh_chop_tu_giac_deu",
    expectedRule: null
  },
  {
    id: "TC9_ChopTamGiacDeu",
    name: "Hình chóp tam giác đều S.ABC",
    problemText: "Cho hình chóp tam giác đều S.ABC có cạnh đáy bằng 4, chiều cao bằng 6.",
    expectedShape: "hinh_chop_tam_giac_deu",
    expectedRule: null
  },
  {
    id: "TC10_LangTruDung_DayVuong_DienTichApBC",
    name: "Lăng trụ đứng ABC.A'B'C' đáy vuông tại B, S_A'BC = a^2*sqrt(3), góc (A'BC) và đáy là 30 độ",
    problemText: "Câu 4. Cho hình lăng trụ đứng ABC.A'B'C' có đáy ABC là tam giác vuông tại B, BC = a, mặt phẳng (A'BC) tạo với đáy một góc 30 độ và tam giác A'BC có diện tích bằng a^2\\sqrt{3}. Tính thể tích khối lăng trụ ABC.A'B'C'.",
    expectedShape: "hinh_lang_tru_dung_tam_giac",
    expectedRule: "prism_face_triangle_area_and_angle"
  }
];

let totalTests = 0;
let passedTests = 0;
let failedTests = [];

function checkCollinear(p1, p2, p3, eps = 1e-4) {
  // Check if 3 points are collinear
  const v1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
  const v2 = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
  const cross = [
    v1[1] * v2[2] - v1[2] * v2[1],
    v1[2] * v2[0] - v1[0] * v2[2],
    v1[0] * v2[1] - v1[1] * v2[0]
  ];
  const len = Math.sqrt(cross[0]*cross[0] + cross[1]*cross[1] + cross[2]*cross[2]);
  return len < eps;
}

for (const tc of testCases) {
  totalTests++;
  console.log(`\n--- Running [${tc.id}] ${tc.name} ---`);

  // 1. Text normalization test
  const naturalText = toNaturalVietnameseMathText(tc.problemText);
  console.log("  [1] Natural Text:", naturalText);

  // 2. Shape normalization test
  const normalizedType = normalizeShapeType(tc.expectedShape, naturalText);
  console.log(`  [2] Normalized ShapeType: ${normalizedType} (expected: ${tc.expectedShape})`);

  // 3. Extraction & Fallback test
  const extracted = extractFallbackGeometry(naturalText);
  console.log(`  [3] Extracted facts: ${extracted.givenFacts.length}, raw shape: ${extracted.shapeType}`);

  // 4. Fact Solver test
  const solved = solveGeometryFacts(extracted);
  console.log(`  [4] Solved appliedRule: ${solved.appliedRule || 'none'}, shapeType: ${solved.shapeType}`);
  console.log(`      SanityCheck: passed=${solved.sanityCheck?.passed}, maxDiscrepancy=${solved.sanityCheck?.maxDiscrepancy}`);

  // 5. 3D Calculator test
  let geo = null;
  try {
    geo = calculateGeometry({
      ...extracted,
      ...solved,
      parameters: solved.parameters || extracted.parameters || { canhDay: 4, chieuCao: 5 }
    });
    console.log(`  [5] 3D Geometry: ${geo.shapeName}`);
    console.log(`      Vertices count: ${geo.vertices.length}, Faces count: ${geo.faces.length}, Edges count: ${geo.edges.length}`);
    console.log(`      Auxiliary edges count: ${geo.auxiliary_edges.length}`);
  } catch (err) {
    console.error(`  [5] ERROR calculating geometry:`, err.message);
    failedTests.push({ tc, reason: `calculateGeometry crashed: ${err.message}` });
    continue;
  }

  // 6. Mathematical Invariants Check:
  const errors = [];
  
  // A. Vertices validity: All vertices must be 3D numbers, finite, not NaN
  for (let i = 0; i < geo.vertices.length; i++) {
    const v = geo.vertices[i];
    if (!Array.isArray(v) || v.length < 3 || v.some(x => typeof x !== 'number' || isNaN(x) || !isFinite(x))) {
      errors.push(`Vertex ${i} is invalid: ${JSON.stringify(v)}`);
    }
  }

  // B. Prism Lateral Vector Equality Check:
  if (normalizedType.includes('lang_tru')) {
    // Top vertices must be shifted from bottom vertices by a consistent vector
    const numBase = normalizedType.includes('tu_giac') ? 4 : 3;
    if (geo.vertices.length >= numBase * 2) {
      const u0 = [
        geo.vertices[numBase][0] - geo.vertices[0][0],
        geo.vertices[numBase][1] - geo.vertices[0][1],
        geo.vertices[numBase][2] - geo.vertices[0][2]
      ];
      for (let k = 1; k < numBase; k++) {
        const uk = [
          geo.vertices[numBase + k][0] - geo.vertices[k][0],
          geo.vertices[numBase + k][1] - geo.vertices[k][1],
          geo.vertices[numBase + k][2] - geo.vertices[k][2]
        ];
        const diff = Math.sqrt(
          Math.pow(u0[0] - uk[0], 2) + Math.pow(u0[1] - uk[1], 2) + Math.pow(u0[2] - uk[2], 2)
        );
        if (diff > 0.05) {
          errors.push(`Lateral edge ${k} not parallel to edge 0: diff=${diff}`);
        }
      }
    }
  }

  // C. Sanity check check:
  if (solved.sanityCheck && !solved.sanityCheck.passed) {
    errors.push(`Sanity check failed: discrepancy=${solved.sanityCheck.maxDiscrepancy}`);
  }

  if (errors.length > 0) {
    console.error(`  ❌ FAILED:`, errors);
    failedTests.push({ tc, reason: errors.join('; ') });
  } else {
    console.log(`  ✅ PASSED`);
    passedTests++;
  }
}

console.log("\n=================================================");
console.log(`RESULTS: ${passedTests}/${totalTests} PASSED, ${failedTests.length} FAILED`);
if (failedTests.length > 0) {
  console.log("Failed tests details:", JSON.stringify(failedTests, null, 2));
}
console.log("=================================================");
