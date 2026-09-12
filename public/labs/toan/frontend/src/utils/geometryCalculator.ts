/**
 * MODULE TÍNH TOÁN HÌNH HỌC TẤT ĐỊNH (TẦNG 2 - SELF-BUILT GEOMETRY ENGINE)
 * Nhận tham số hình học có cấu trúc từ Tầng 1 (LLM) và:
 * 1. Tính toán 100% chính xác bằng toán học tất định (Diện tích, Thể tích, Đường cao, Trung đoạn, ...)
 * 2. Tự động sinh tọa độ các đỉnh (vertices), lưới mặt (faces), và các cạnh (edges) chuẩn mực.
 * 3. Hỗ trợ Kẻ Đường Phụ (Auxiliary Geometry): Hình chiếu vuông góc (Projection), Trung điểm (Midpoint).
 * 4. Chuẩn bị ngữ cảnh toán học đầy đủ (ShapeContext) phục vụ hiển thị UI và Chat Hỏi-Đáp.
 */

export type Point3D = [number, number, number];

export function vecSub(b: Point3D, a: Point3D): Point3D {
  return [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
}

export function vecAdd(a: Point3D, b: Point3D): Point3D {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function vecDot(u: Point3D, v: Point3D): number {
  return u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
}

export function vecScale(u: Point3D, k: number): Point3D {
  return [u[0] * k, u[1] * k, u[2] * k];
}

export function vecLenSq(u: Point3D): number {
  return u[0] * u[0] + u[1] * u[1] + u[2] * u[2];
}

/**
 * 1. Tìm trung điểm của đoạn thẳng P1 - P2: M = (P1 + P2) / 2
 */
export function calculateMidpoint(p1: Point3D, p2: Point3D): Point3D {
  return [
    Number(((p1[0] + p2[0]) / 2).toFixed(4)),
    Number(((p1[1] + p2[1]) / 2).toFixed(4)),
    Number(((p1[2] + p2[2]) / 2).toFixed(4)),
  ];
}

/**
 * 2. Tìm hình chiếu vuông góc của điểm P lên đường thẳng đi qua A và B:
 * Vector chỉ phương: u = B - A
 * Vector từ A đến P: v = P - A
 * Hệ số chiếu: t = (v . u) / ||u||^2
 * Điểm hình chiếu: H = A + t * u
 */
export function calculateProjection(p: Point3D, a: Point3D, b: Point3D): Point3D {
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

export interface GeometryCalculations {
  canhDay?: number;
  chieuDai?: number;
  chieuRong?: number;
  chieuCao?: number;
  banKinh?: number;
  dienTichDay?: number;
  dienTichXungQuanh?: number;
  dienTichToanPhan?: number;
  dienTichMatCau?: number;
  theTich?: number;
  trungDoan?: number;
  canhBen?: number;
  duongSinh?: number;
  duongCheo?: number;
  canhSA?: number;
  canhSB?: number;
  canhSC?: number;
  canhSD?: number;
  chuViDay?: number;
  donVi: string;
  congThuc: Record<string, string>;
  detailedSolution?: string;
}

export interface ShapeContext {
  shapeType: string;
  shapeName: string;
  parameters: Record<string, any>;
  calculations: GeometryCalculations;
  vertices: number[][];
  faces: number[][];
  edges: number[][];
  visible_edges: number[][];
  hidden_edges: number[][];
  auxiliary_edges: number[][];
  auxiliary_labels: string[];
  highlight_planes?: { points: string[]; indices: number[]; color?: string; name?: string }[];
  vertex_labels: string[];
  labels: string[];
  originalProblemText: string;
  auxiliaryRequests?: any[];
}

export function normalizeShapeType(rawType: string = '', text: string = '', shapeName: string = ''): string {
  const s = `${rawType || ''} ${text || ''} ${shapeName || ''}`.toLowerCase();

  // 0. Manual UI config shapes
  if (s.includes('pyramid_square')) return 'hinh_chop_tu_giac_deu';
  if (s.includes('pyramid_triangle')) return 'hinh_chop_tam_giac_deu';
  if (s.includes('prism_regular')) return 'hinh_lang_tru_tam_giac_deu';
  if (s.includes('box')) return 'hinh_hop_chu_nhat';
  if (s.includes('cone')) return 'hinh_non';
  if (s.includes('sphere')) return 'hinh_cau';

  // 1. Hình lăng trụ
  if (s.includes('hinh_lang_tru_tu_giac_xien')) {
    return 'hinh_lang_tru_tu_giac_xien';
  }
  if (s.includes('hinh_lang_tru_tam_giac_xien')) {
    return 'hinh_lang_tru_tam_giac_xien';
  }
  if (s.includes('hinh_lang_tru_dung_tam_giac')) {
    return 'hinh_lang_tru_dung_tam_giac';
  }

  if (s.includes('lăng trụ') || s.includes('lang_tru') || s.includes('prism') || s.includes("a'b'c'") || s.includes("a'b'c'd'")) {
    const isExplicitDung = s.includes('đứng') || s.includes('dung') || s.includes('tam giác đều') || s.includes('tam_giac_deu');
    const isOblique = !isExplicitDung && (s.includes('xiên') || s.includes('xien') || s.includes('trọng tâm') || s.includes('trong_tam') ||
                      s.includes('trung điểm') || s.includes('trung_diem') || s.includes('hình chiếu') || s.includes('hinh chieu') ||
                      s.includes('chiếu của'));
    const isQuad = s.includes('tứ giác') || s.includes("a'b'c'd'") || s.includes('abcd') || s.includes('thoi') || s.includes('hình thoi') || s.includes('bình hành');

    if (isQuad) {
      if (isOblique || s.includes('thoi') || s.includes('hình thoi')) {
        return 'hinh_lang_tru_tu_giac_xien';
      }
      return 'hinh_hop_chu_nhat';
    }

    if (isOblique) {
      return 'hinh_lang_tru_tam_giac_xien';
    }
    if (s.includes('vuông tại') || s.includes('dung_tam_giac') || s.includes('lăng trụ đứng')) {
      return 'hinh_lang_tru_dung_tam_giac';
    }
    return 'hinh_lang_tru_tam_giac_deu';
  }

  // 2. Hình chóp tứ giác đều
  if (s.includes('chóp tứ giác đều') || s.includes('chóp đều s.abcd') || (s.includes('tứ giác đều') && !s.includes('tam giác'))) {
    return 'hinh_chop_tu_giac_deu';
  }

  // 3. Hình chóp tam giác (S.ABC) có SA vuông góc đáy / cạnh bên vuông góc đáy
  const isTriPyramid = (s.includes('s.abc') && !s.includes('s.abcd')) ||
                       (s.includes('chóp') && s.includes('tam giác') && !s.includes('tứ giác')) ||
                       s.includes('hinh_chop_tam_giac');
  if (isTriPyramid) {
    if (s.includes('tứ diện đều') || s.includes('chóp tam giác đều') || s.includes('chop_tam_giac_deu') || (s.includes('đều') && !s.includes('vuông góc') && !s.includes('sa'))) {
      return 'hinh_chop_tam_giac_deu';
    }
    return 'hinh_chop_tam_giac';
  }

  // 4. Hình chóp tứ giác (S.ABCD) có SA vuông góc đáy / đáy hình chữ nhật / vuông
  if (
    s.includes('hinh_chop_day_hcn') ||
    ((s.includes('chóp') || s.includes('s.abcd')) &&
     (s.includes('vuông góc') || s.includes('⊥') || s.includes('đáy là hình vuông') || s.includes('đáy là hình chữ nhật') || s.includes('đáy hình vuông') || s.includes('đáy hình chữ nhật')))
  ) {
    return 'hinh_chop_day_hcn';
  }

  // 5. Hình chóp tam giác đều / Tứ diện đều (nếu sót)
  if (s.includes('tứ diện đều') || s.includes('chóp tam giác đều') || s.includes('chop_tam_giac_deu')) {
    return 'hinh_chop_tam_giac_deu';
  }

  // 6. Hình lập phương / Hình hộp chữ nhật
  if (s.includes('lập phương') || s.includes('hộp chữ nhật') || s.includes('hinh_hop')) {
    return 'hinh_hop_chu_nhat';
  }

  // 7. Hình tròn xoay
  if (s.includes('nón') || s.includes('non')) return 'hinh_non';
  if (s.includes('trụ') || s.includes('tru')) return 'hinh_tru';
  if (s.includes('cầu') || s.includes('cau')) return 'hinh_cau';

  // 8. Chóp S.ABCD
  if (s.includes('s.abcd')) {
    return 'hinh_chop_day_hcn';
  }

  return 'hinh_chop_day_hcn';
}

export function calculateGeometry(llmData: any): ShapeContext {
  if (!llmData) {
    throw new Error("Dữ liệu đầu vào không hợp lệ.");
  }

  const rawShapeType = llmData.shapeType || '';
  const originalProblemText = llmData.originalProblemText || '';
  let shapeName = llmData.shapeName || '';
  const shapeType = normalizeShapeType(rawShapeType, originalProblemText, shapeName);

  let params: any = {};
  if (Array.isArray(llmData.parameters)) {
    for (const p of llmData.parameters) {
      if (p && typeof p === 'object') {
        const key = String(p.name || p.key || '').toLowerCase();
        const val = p.value || p.val;
        if (key.includes('đáy') || key.includes('cạnh') || key.includes('side') || key.includes('base')) {
          params.canhDay = parseFloat(val) || 4;
        } else if (key.includes('cao') || key.includes('height') || key.includes('a\'') || key.includes('sh') || key.includes('sa')) {
          params.chieuCao = parseFloat(val) || 5;
        } else if (key.includes('dài') || key.includes('length')) {
          params.chieuDai = parseFloat(val) || 4;
        } else if (key.includes('rộng') || key.includes('width')) {
          params.chieuRong = parseFloat(val) || 4;
        } else if (key.includes('kính') || key.includes('radius')) {
          params.banKinh = parseFloat(val) || 3;
        }
      }
    }
  } else if (llmData.parameters && typeof llmData.parameters === 'object') {
    params = { ...llmData.parameters };
  }

  const donVi = llmData.donVi || 'cm';

  let calculations: GeometryCalculations = { donVi, congThuc: {} };
  let vertices: number[][] = [];
  let faces: number[][] = [];
  let edges: number[][] = [];
  let labels: string[] = [];
  const auxiliary_edges: number[][] = [];
  const auxiliary_labels: string[] = [];
  const highlight_planes: { points: string[]; indices: number[]; color?: string; name?: string }[] = [];

  // =========================================================================
  // 1. HÌNH CHÓP TAM GIÁC ĐỀU (S.ABC)
  // =========================================================================
  if (shapeType === 'hinh_chop_tam_giac_deu') {
    const a = Number(params.canhDay) || 4;
    const h = Number(params.chieuCao) || 5;
    if (!shapeName) shapeName = 'Hình chóp tam giác đều S.ABC';

    const dienTichDay = (Math.sqrt(3) / 4) * Math.pow(a, 2);
    const theTich = (1 / 3) * dienTichDay * h;
    const R = a / Math.sqrt(3); // Bán kính đường tròn ngoại tiếp đáy
    const r = a / (2 * Math.sqrt(3)); // Bán kính đường tròn nội tiếp đáy
    const trungDoan = Math.sqrt(Math.pow(h, 2) + Math.pow(r, 2));
    const canhBen = Math.sqrt(Math.pow(h, 2) + Math.pow(R, 2));
    const chuViDay = 3 * a;
    const dienTichXungQuanh = (1 / 2) * chuViDay * trungDoan;
    const dienTichToanPhan = dienTichXungQuanh + dienTichDay;

    calculations = {
      canhDay: a,
      chieuCao: h,
      dienTichDay: Number(dienTichDay.toFixed(3)),
      dienTichXungQuanh: Number(dienTichXungQuanh.toFixed(3)),
      dienTichToanPhan: Number(dienTichToanPhan.toFixed(3)),
      theTich: Number(theTich.toFixed(3)),
      trungDoan: Number(trungDoan.toFixed(3)),
      canhBen: Number(canhBen.toFixed(3)),
      chuViDay: Number(chuViDay.toFixed(3)),
      donVi,
      congThuc: {
        dienTichDay: "S_{đáy} = \\frac{a^2\\sqrt{3}}{4}",
        theTich: "V = \\frac{1}{3} S_{đáy} h = \\frac{a^2 h \\sqrt{3}}{12}",
        dienTichXungQuanh: "S_{xq} = \\frac{1}{2} P_{đáy} d",
        dienTichToanPhan: "S_{tp} = S_{xq} + S_{đáy}",
        canhBen: "l = \\sqrt{h^2 + R^2}"
      }
    };

    // Cân đối tỉ lệ chiều cao hiển thị 3D chuẩn SGK (không bị bẹp dúm hoặc nhọn hoắt)
    const visualH = Math.min(Math.max(h, a * 0.9), a * 2.2);

    // Đỉnh S (0, 0, visualH)
    vertices.push([0, 0, visualH]);
    labels.push("S");

    // Đáy tam giác đều ABC trọng tâm tại (0,0,0)
    vertices.push([0, Number(R.toFixed(4)), 0]); // A
    vertices.push([Number((a / 2).toFixed(4)), Number((-R / 2).toFixed(4)), 0]); // B
    vertices.push([Number((-a / 2).toFixed(4)), Number((-R / 2).toFixed(4)), 0]); // C
    labels.push("A", "B", "C");

    faces = [
      [0, 1, 2], // SAB
      [0, 2, 3], // SBC
      [0, 3, 1], // SCA
      [1, 3, 2]  // ABC đáy
    ];
    edges = [
      [0, 1], [0, 2], [0, 3], // Cạnh bên SA, SB, SC
      [1, 2], [2, 3], [3, 1]  // Cạnh đáy AB, BC, CA
    ];
  }

  // =========================================================================
  // 2. HÌNH CHÓP TỨ GIÁC ĐỀU (S.ABCD)
  // =========================================================================
  else if (shapeType === 'hinh_chop_tu_giac_deu') {
    const a = Number(params.canhDay) || 4;
    const h = Number(params.chieuCao) || 5;
    if (!shapeName) shapeName = 'Hình chóp tứ giác đều S.ABCD';

    const dienTichDay = Math.pow(a, 2);
    const theTich = (1 / 3) * dienTichDay * h;
    const r = a / 2;
    const R = (a * Math.sqrt(2)) / 2;
    const trungDoan = Math.sqrt(Math.pow(h, 2) + Math.pow(r, 2));
    const canhBen = Math.sqrt(Math.pow(h, 2) + Math.pow(R, 2));
    const chuViDay = 4 * a;
    const dienTichXungQuanh = 2 * a * trungDoan;
    const dienTichToanPhan = dienTichXungQuanh + dienTichDay;

    calculations = {
      canhDay: a,
      chieuCao: h,
      dienTichDay: Number(dienTichDay.toFixed(3)),
      dienTichXungQuanh: Number(dienTichXungQuanh.toFixed(3)),
      dienTichToanPhan: Number(dienTichToanPhan.toFixed(3)),
      theTich: Number(theTich.toFixed(3)),
      trungDoan: Number(trungDoan.toFixed(3)),
      canhBen: Number(canhBen.toFixed(3)),
      chuViDay: Number(chuViDay.toFixed(3)),
      donVi,
      congThuc: {
        dienTichDay: "S_{đáy} = a^2",
        theTich: "V = \\frac{1}{3} a^2 h",
        dienTichXungQuanh: "S_{xq} = 2 a d",
        dienTichToanPhan: "S_{tp} = S_{xq} + S_{đáy}"
      }
    };

    // Cân đối tỉ lệ chiều cao hiển thị 3D chuẩn SGK
    const visualH = Math.min(Math.max(h, a * 0.9), a * 2.2);

    // Đỉnh S
    vertices.push([0, 0, visualH]);
    labels.push("S");

    // Đáy hình vuông ABCD
    const half = Number((a / 2).toFixed(4));
    vertices.push([-half, -half, 0]); // A (1)
    vertices.push([half, -half, 0]);  // B (2)
    vertices.push([half, half, 0]);   // C (3)
    vertices.push([-half, half, 0]);  // D (4)
    labels.push("A", "B", "C", "D");

    faces = [
      [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], // Mặt bên
      [1, 4, 3, 2] // Đáy
    ];
    edges = [
      [0, 1], [0, 2], [0, 3], [0, 4], // Cạnh bên SA, SB, SC, SD
      [1, 2], [2, 3], [3, 4], [4, 1]  // Cạnh đáy
    ];
  }

  // =========================================================================
  // 3B. HÌNH LĂNG TRỤ TỨ GIÁC XIÊN / ĐÁY HÌNH THOI (ABCD.A'B'C'D')
  // =========================================================================
  else if (shapeType === 'hinh_lang_tru_tu_giac_xien') {
    const a = Number(params.canhDay || params.chieuDai) || 4;

    // Góc ∠BAD = 60° (vì ∠ABC = 120° trong hình thoi), tam giác ABD đều cạnh a
    const angleA = (60 * Math.PI) / 180;
    const AG = (a * Math.sqrt(3)) / 3;
    const mathH = Number(Math.sqrt(Math.max(0.01, a * a - AG * AG)).toFixed(3)); // a*sqrt(6)/3
    const userH = Number(params.chieuCao);
    const h = (userH && userH > 0 && userH !== 6) ? userH : mathH;
    const viewH = Math.max(h, 3.5);

    // Đáy ABCD: Hình thoi cạnh a
    const A = [0, 0, 0];
    const D = [a, 0, 0];
    const B = [Number((a * Math.cos(angleA)).toFixed(4)), Number((a * Math.sin(angleA)).toFixed(4)), 0];
    const C = [Number((B[0] + a).toFixed(4)), B[1], 0];

    // G: Trọng tâm tam giác ABD = (A + B + D) / 3
    const G = [
      Number(((A[0] + B[0] + D[0]) / 3).toFixed(4)),
      Number(((A[1] + B[1] + D[1]) / 3).toFixed(4)),
      0
    ];

    // Đỉnh A' thẳng đứng trên G với chiều cao viewH
    const A_prime = [G[0], G[1], viewH];

    // Vector tịnh tiến cạnh bên u = AA' (xiên)
    const shiftX = A_prime[0] - A[0];
    const shiftY = A_prime[1] - A[1];

    // Các đỉnh đáy trên B', C', D' theo vector u
    const B_prime = [Number((B[0] + shiftX).toFixed(4)), Number((B[1] + shiftY).toFixed(4)), viewH];
    const C_prime = [Number((C[0] + shiftX).toFixed(4)), Number((C[1] + shiftY).toFixed(4)), viewH];
    const D_prime = [Number((D[0] + shiftX).toFixed(4)), Number((D[1] + shiftY).toFixed(4)), viewH];

    // Đỉnh: 0..3: ABCD, 4..7: A'B'C'D', 8: G
    vertices.push(A, B, C, D, A_prime, B_prime, C_prime, D_prime, G);
    labels.push("A", "B", "C", "D", "A'", "B'", "C'", "D'", "G");

    faces = [
      [0, 3, 2, 1], // Đáy dưới ABCD
      [4, 5, 6, 7], // Đáy trên A'B'C'D'
      [0, 1, 5, 4], // Mặt bên ABB'A'
      [1, 2, 6, 5], // Mặt bên BCC'B'
      [2, 3, 7, 6], // Mặt bên CDD'C'
      [3, 0, 4, 7]  // Mặt bên DAA'D'
    ];

    edges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // Cạnh đáy dưới ABCD
      [4, 5], [5, 6], [6, 7], [7, 4], // Cạnh đáy trên A'B'C'D'
      [0, 4], [1, 5], [2, 6], [3, 7]  // Các cạnh bên xiên AA', BB', CC', DD'
    ];

    // Đường phụ toán học:
    // [4, 8]: Chiều cao A'G vuông góc đáy tại trọng tâm G
    // [1, 3]: Đường chéo BD tạo thành tam giác đều ABD
    // [0, 8]: Đoạn AG (khoảng cách từ A tới trọng tâm G)
    // [0, 2]: Đường chéo AC chia đôi hình thoi (cho khối lăng trụ tam giác ABC.A'B'C')
    auxiliary_edges.push([4, 8], [1, 3], [0, 8], [0, 2]);
    auxiliary_labels.push("G");

    highlight_planes.push({
      points: ["A", "B", "C"],
      indices: [0, 1, 2],
      color: "#10b981",
      name: "Đáy ΔABC"
    });

    const dienTichABC = (Math.sqrt(3) / 4) * Math.pow(a, 2);
    const theTichABC = dienTichABC * h;
    const theTichABCD = dienTichABC * 2 * h;

    shapeName = "Hình lăng trụ xiên ABCD.A'B'C'D' (A'G ⊥ đáy tại trọng tâm G của ΔABD)";
    calculations = {
      canhDay: a,
      chieuCao: Number(h.toFixed(3)),
      dienTichDay: Number(dienTichABC.toFixed(3)),
      theTich: Number(theTichABC.toFixed(3)),
      donVi,
      congThuc: {
        dienTichDay: "S_{\\Delta ABC} = \\frac{a^2\\sqrt{3}}{4}",
        chieuCao: "A'G = \\sqrt{AA'^2 - AG^2} = \\frac{a\\sqrt{6}}{3}",
        theTich: "V_{ABC.A'B'C'} = S_{\\Delta ABC} \\cdot A'G = \\frac{a^3\\sqrt{2}}{4}",
        theTichToanKhoi: `V_{ABCD.A'B'C'D'} = 2 \\cdot V_{ABC.A'B'C'} = ${Number(theTichABCD.toFixed(3))}`
      }
    };
  }

  // =========================================================================
  // 3. HÌNH HỘP CHỮ NHẬT / HÌNH LẬP PHƯƠNG (ABCD.A'B'C'D')
  // =========================================================================
  else if (shapeType === 'hinh_hop_chu_nhat') {
    if (originalProblemText && (originalProblemText.includes('thoi') || /trọng\s*tâm/i.test(originalProblemText) || /lăng\s*trụ\s*xiên/i.test(originalProblemText))) {
      return calculateGeometry({ ...llmData, shapeType: 'hinh_lang_tru_tu_giac_xien' });
    }

    const a = Number(params.chieuDai || params.canhDay) || 5;
    const b = Number(params.chieuRong || params.canhDay) || 4;
    const c = Number(params.chieuCao) || 3;
    if (!shapeName) shapeName = (a === b && b === c) ? 'Hình lập phương ABCD.A\'B\'C\'D\'' : 'Hình hộp chữ nhật ABCD.A\'B\'C\'D\'';

    const dienTichDay = a * b;
    const chuViDay = 2 * (a + b);
    const dienTichXungQuanh = chuViDay * c;
    const dienTichToanPhan = dienTichXungQuanh + 2 * dienTichDay;
    const theTich = a * b * c;
    const duongCheo = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2) + Math.pow(c, 2));

    calculations = {
      chieuDai: a,
      chieuRong: b,
      chieuCao: c,
      dienTichDay: Number(dienTichDay.toFixed(3)),
      dienTichXungQuanh: Number(dienTichXungQuanh.toFixed(3)),
      dienTichToanPhan: Number(dienTichToanPhan.toFixed(3)),
      theTich: Number(theTich.toFixed(3)),
      duongCheo: Number(duongCheo.toFixed(3)),
      donVi,
      congThuc: {
        dienTichDay: "S_{đáy} = a \\cdot b",
        theTich: "V = a \\cdot b \\cdot c",
        dienTichXungQuanh: "S_{xq} = 2(a + b)c",
        dienTichToanPhan: "S_{tp} = S_{xq} + 2S_{đáy}",
        duongCheo: "d = \\sqrt{a^2 + b^2 + c^2}"
      }
    };

    const hx = a / 2, hy = b / 2;
    // Đáy dưới (z = 0)
    vertices.push([-hx, -hy, 0]); // 0: A
    vertices.push([hx, -hy, 0]);  // 1: B
    vertices.push([hx, hy, 0]);   // 2: C
    vertices.push([-hx, hy, 0]);  // 3: D
    // Đáy trên (z = c)
    vertices.push([-hx, -hy, c]); // 4: A'
    vertices.push([hx, -hy, c]);  // 5: B'
    vertices.push([hx, hy, c]);   // 6: C'
    vertices.push([-hx, hy, c]);  // 7: D'
    labels.push("A", "B", "C", "D", "A'", "B'", "C'", "D'");

    faces = [
      [0, 3, 2, 1], // Đáy dưới
      [4, 5, 6, 7], // Đáy trên
      [0, 1, 5, 4], // Mặt trước
      [2, 3, 7, 6], // Mặt sau
      [0, 4, 7, 3], // Mặt trái
      [1, 2, 6, 5]  // Mặt phải
    ];
    edges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // Cạnh đáy dưới
      [4, 5], [5, 6], [6, 7], [7, 4], // Cạnh đáy trên
      [0, 4], [1, 5], [2, 6], [3, 7]  // Cạnh bên
    ];
  }

  // =========================================================================
  // 4. HÌNH CHÓP CÓ SA VUÔNG GÓC ĐÁY (S.ABCD / S.ABC)
  // =========================================================================
  else if (shapeType === 'hinh_chop_day_hcn' || shapeType === 'hinh_chop_tam_giac') {
    const isTriangularBase = Boolean(
      shapeType === 'hinh_chop_tam_giac' ||
      (originalProblemText && /s\.abc\b/i.test(originalProblemText) && !/s\.abcd/i.test(originalProblemText))
    );

    const rawA = Number(params.chieuDai || params.canhDay);
    const rawB = Number(params.chieuRong || params.canhDay);
    const isSquare = Boolean(
      params.canhDay ||
      (originalProblemText && /đáy\s*(là\s*)?hình\s*vuông|hình\s*vuông/i.test(originalProblemText))
    );
    const a = rawA || 4;
    const b = isSquare ? a : (rawB || 4);
    const h = Number(params.chieuCao) || 4;

    // Cân đối tỉ lệ chiều cao hiển thị 3D chuẩn SGK (đảm bảo trực quan, không bị bẹp dúm hoặc nhọn hoắt)
    const baseSpan = Math.max(a, b || a, 3);
    const visualH = Math.min(Math.max(h, baseSpan * 0.9), baseSpan * 2.2);

    if (isTriangularBase) {
      if (!shapeName) shapeName = 'Hình chóp S.ABC (SA ⊥ đáy)';
      const dienTichDay = 0.5 * a * b;
      const theTich = (1 / 3) * dienTichDay * h;
      const sb = Math.sqrt(h * h + a * a);
      const sc = Math.sqrt(h * h + b * b);

      calculations = {
        canhDay: a,
        chieuCao: h,
        dienTichDay: Number(dienTichDay.toFixed(3)),
        theTich: Number(theTich.toFixed(3)),
        canhSA: h,
        canhSB: Number(sb.toFixed(3)),
        canhSC: Number(sc.toFixed(3)),
        donVi,
        congThuc: {
          dienTichDay: "S_{đáy} = \\frac{1}{2} a \\cdot b",
          theTich: "V = \\frac{1}{3} S_{đáy} h"
        }
      };

      // Đáy tam giác ABC
      vertices.push([0, 0, 0]); // 0: A
      vertices.push([a, 0, 0]); // 1: B
      vertices.push([0, b, 0]); // 2: C
      // Đỉnh S ngay trên đỉnh A
      vertices.push([0, 0, visualH]); // 3: S
      labels.push("A", "B", "C", "S");

      faces = [
        [0, 2, 1], // Đáy ABC
        [3, 0, 1], // SAB
        [3, 1, 2], // SBC
        [3, 2, 0]  // SCA
      ];
      edges = [
        [0, 1], [1, 2], [2, 0], // Đáy
        [3, 0], [3, 1], [3, 2]  // SA, SB, SC
      ];

      // Nếu đề bài có góc giữa mặt bên (SBC) và đáy: tự động kẻ đường phụ AH ⊥ BC và SH ⊥ BC
      const hasFaceAngle = Boolean(
        (llmData.appliedRule && llmData.appliedRule.includes('SBC')) ||
        (llmData.ruleId && llmData.ruleId.includes('sbc')) ||
        (originalProblemText && /(sbc).*?(đáy|abc)|(đáy|abc).*?(sbc)/i.test(originalProblemText))
      );

      if (hasFaceAngle) {
        // Tọa độ hình chiếu H của A(0,0) lên đường thẳng BC
        const hX = Number(((a * b * b) / (a * a + b * b)).toFixed(4));
        const hY = Number(((a * a * b) / (a * a + b * b)).toFixed(4));
        const hIndex = vertices.length;
        vertices.push([hX, hY, 0]); // 4: H
        labels.push("H");
        auxiliary_edges.push([0, hIndex]); // AH
        auxiliary_edges.push([3, hIndex]); // SH
        auxiliary_labels.push("H");
        highlight_planes.push({
          points: ["S", "A", "H"],
          indices: [3, 0, hIndex],
          color: '#f59e0b',
          name: 'Góc nghiêng mặt bên (SAH)'
        });
      }
    } else {
      const isRhombus = Boolean(
        params.isHinhThoi ||
        (originalProblemText && /hình\s*thoi/i.test(originalProblemText))
      );

      if (isRhombus) {
        const AC = Number(params.duongCheoAC || params.chieuDai) || (4 * Math.sqrt(3));
        const BD = Number(params.duongCheoBD || params.chieuRong) || 4;
        const dienTichDay = 0.5 * AC * BD;
        const theTich = (1 / 3) * dienTichDay * h;
        if (!shapeName) shapeName = 'Hình chóp S.ABCD (đáy hình thoi, (SAB) ⊥ đáy)';

        calculations = {
          canhDay: a,
          chieuCao: h,
          dienTichDay: Number(dienTichDay.toFixed(3)),
          theTich: Number(theTich.toFixed(3)),
          canhSA: Number(Math.sqrt(h * h + Math.pow(a / 2, 2)).toFixed(3)),
          canhSB: Number(Math.sqrt(h * h + Math.pow(a / 2, 2)).toFixed(3)),
          donVi,
          congThuc: {
            dienTichDay: "S_{đáy} = \\frac{1}{2} AC \\cdot BD",
            theTich: "V = \\frac{1}{3} S_{đáy} h = \\frac{a^3\\sqrt{3}}{12}"
          }
        };

        const halfAC = Number((AC / 2).toFixed(4));
        const halfBD = Number((BD / 2).toFixed(4));
        const hX = Number((-halfAC / 2).toFixed(4));
        const hY = Number((-halfBD / 2).toFixed(4));

        // 4 đỉnh đáy hình thoi tâm tại gốc (0,0)
        vertices.push([-halfAC, 0, 0]); // 0: A
        vertices.push([0, -halfBD, 0]); // 1: B
        vertices.push([halfAC, 0, 0]);  // 2: C
        vertices.push([0, halfBD, 0]);   // 3: D
        // Đỉnh S vuông góc đáy tại H (trung điểm AB)
        vertices.push([hX, hY, visualH]); // 4: S
        labels.push("A", "B", "C", "D", "S");

        faces = [
          [0, 1, 2, 3], // Đáy ABCD
          [4, 0, 1],    // SAB
          [4, 1, 2],    // SBC
          [4, 2, 3],    // SCD
          [4, 3, 0]     // SDA
        ];
        edges = [
          [0, 1], [1, 2], [2, 3], [3, 0], // Cạnh đáy
          [4, 0], [4, 1], [4, 2], [4, 3]  // SA, SB, SC, SD
        ];

        // Đường cao phụ SH (H là trung điểm AB)
        const hIndex = vertices.length;
        vertices.push([hX, hY, 0]); // 5: H
        labels.push("H");
        auxiliary_edges.push([4, hIndex]); // SH ⊥ đáy
        auxiliary_labels.push("H");
        highlight_planes.push({
          points: ["S", "A", "B"],
          indices: [4, 0, 1],
          color: '#f59e0b',
          name: 'Mặt bên vuông cân (SAB) ⊥ đáy'
        });

      } else {
        if (!shapeName) {
          shapeName = isSquare ? 'Hình chóp S.ABCD (đáy hình vuông, SA ⊥ đáy)' : 'Hình chóp S.ABCD (SA ⊥ đáy)';
        }

        const dienTichDay = a * b;
        const theTich = (1 / 3) * dienTichDay * h;
        const sb = Math.sqrt(h * h + a * a);
        const sd = Math.sqrt(h * h + b * b);
        const sc = Math.sqrt(h * h + a * a + b * b);

        calculations = {
          chieuDai: a,
          chieuRong: b,
          chieuCao: h,
          dienTichDay: Number(dienTichDay.toFixed(3)),
          theTich: Number(theTich.toFixed(3)),
          canhSA: h,
          canhSB: Number(sb.toFixed(3)),
          canhSD: Number(sd.toFixed(3)),
          canhSC: Number(sc.toFixed(3)),
          donVi,
          congThuc: {
            dienTichDay: isSquare ? "S_{đáy} = a^2" : "S_{đáy} = a \\cdot b",
            theTich: "V = \\frac{1}{3} S_{đáy} h"
          }
        };

        // Điểm A tại gốc tọa độ (0, 0, 0)
        vertices.push([0, 0, 0]); // 0: A
        vertices.push([a, 0, 0]); // 1: B
        vertices.push([a, b, 0]); // 2: C
        vertices.push([0, b, 0]); // 3: D
        // Đỉnh S ngay trên đỉnh A (SA ⊥ đáy)
        vertices.push([0, 0, visualH]); // 4: S
        labels.push("A", "B", "C", "D", "S");

        faces = [
          [0, 3, 2, 1], // Đáy ABCD
          [4, 0, 1],    // SAB
          [4, 1, 2],    // SBC
          [4, 2, 3],    // SCD
          [4, 3, 0]     // SDA
        ];
        edges = [
          [0, 1], [1, 2], [2, 3], [3, 0], // Đáy
          [4, 0], [4, 1], [4, 2], [4, 3]  // SA, SB, SC, SD
        ];
      }
    }
  }

  // =========================================================================
  // 5. HÌNH LĂNG TRỤ TAM GIÁC (ABC.A'B'C' - ĐỨNG HOẶC XIÊN)
  // =========================================================================
  else if (shapeType === 'hinh_lang_tru_tam_giac_deu' || shapeType === 'hinh_lang_tru_tam_giac_xien' || shapeType === 'hinh_lang_tru_dung_tam_giac') {
    const a = Number(params.canhDay) || 4;
    const isOblique = Boolean(
      shapeType === 'hinh_lang_tru_tam_giac_xien' ||
      (originalProblemText &&
      (/hình\s*chiếu.*A'.*trọng\s*tâm/i.test(originalProblemText) ||
       /hình\s*chiếu.*A'.*trung\s*điểm/i.test(originalProblemText) ||
       /hình\s*chiếu.*A'.*AB/i.test(originalProblemText) ||
       /lăng\s*trụ\s*xiên/i.test(originalProblemText) ||
       /trọng\s*tâm/i.test(originalProblemText)))
    );

    const dienTichDay = (Math.sqrt(3) / 4) * Math.pow(a, 2);

    if (isOblique) {
      const isCentroid = /trọng\s*tâm/i.test(originalProblemText) || /trong_tam/i.test(originalProblemText);
      const mathH = isCentroid
        ? Number((Math.sqrt(Math.max(0.01, a * a - Math.pow((a * Math.sqrt(3)) / 3, 2)))).toFixed(3))
        : Number(((a * Math.sqrt(3)) / 4).toFixed(3));
      const userH = Number(params.chieuCao);
      const h = (userH && userH > 0 && userH !== 6) ? userH : mathH;
      const viewH = Math.max(h, 4.0); // Chiều cao hiển thị 3D thoáng mắt

      const projName = isCentroid ? "trọng tâm G của ΔABC" : "trung điểm H của AB";
      const projLabel = isCentroid ? "G" : "H";
      shapeName = `Hình lăng trụ xiên ABC.A'B'C' (A'${projLabel} ⊥ đáy tại ${projName})`;
      const theTich = dienTichDay * h;

      calculations = {
        canhDay: a,
        chieuCao: h,
        dienTichDay: Number(dienTichDay.toFixed(3)),
        theTich: Number(theTich.toFixed(3)),
        donVi,
        congThuc: {
          dienTichDay: "S_{\\Delta ABC} = \\frac{a^2\\sqrt{3}}{4}",
          chieuCao: `h = A'${projLabel}`,
          theTich: `V = S_{\\Delta ABC} \\cdot A'${projLabel} = ${Number(theTich.toFixed(3))}`
        }
      };

      // Đáy dưới ABC
      const A = [0, 0, 0];
      const B = [a, 0, 0];
      const C = [a / 2, Number(((a * Math.sqrt(3)) / 2).toFixed(4)), 0];

      // Điểm chiếu trên đáy: Trọng tâm G hoặc Trung điểm H
      const projPoint = isCentroid
        ? [a / 2, Number(((a * Math.sqrt(3)) / 6).toFixed(4)), 0]
        : [a / 2, 0, 0];

      // Đỉnh A' thẳng đứng trên điểm chiếu với chiều cao viewH
      const A_prime = [projPoint[0], projPoint[1], viewH];
      const shiftX = A_prime[0] - A[0];
      const shiftY = A_prime[1] - A[1];

      // Các đỉnh đáy trên B', C' theo vector tịnh tiến AA'
      const B_prime = [B[0] + shiftX, B[1] + shiftY, viewH];
      const C_prime = [C[0] + shiftX, C[1] + shiftY, viewH];

      // Đỉnh 0..2: ABC, Đỉnh 3..5: A'B'C', Đỉnh 6: Điểm chiếu (G hoặc H)
      vertices.push(A, B, C, A_prime, B_prime, C_prime, projPoint);
      labels.push("A", "B", "C", "A'", "B'", "C'", projLabel);

      faces = [
        [0, 2, 1],    // Đáy dưới ABC
        [3, 4, 5],    // Đáy trên A'B'C'
        [0, 1, 4, 3], // Mặt bên ABB'A'
        [1, 2, 5, 4], // Mặt bên BCC'B'
        [2, 0, 3, 5]  // Mặt bên CAA'C'
      ];
      edges = [
        [0, 1], [1, 2], [2, 0], // Đáy dưới
        [3, 4], [4, 5], [5, 3], // Đáy trên
        [0, 3], [1, 4], [2, 5]  // Cạnh bên xiên
      ];

      // Đường cao A'P (đỉnh 3 nối đỉnh 6)
      auxiliary_edges.push([3, 6]);
      auxiliary_labels.push(projLabel);

    } else if (
      params.isRightTriangleBase ||
      (params.chieuDai && params.chieuRong && Math.abs(Number(params.chieuDai) - Number(params.chieuRong)) > 0.001) ||
      (originalProblemText && /vuông tại/i.test(originalProblemText))
    ) {
      const ab = Number(params.chieuDai) || a;
      const bc = Number(params.chieuRong) || a;
      const h = Number(params.chieuCao) || 6;
      const sDay = 0.5 * ab * bc;
      const ac = Math.sqrt(ab * ab + bc * bc);
      const dienTichXungQuanh = (ab + bc + ac) * h;
      const dienTichToanPhan = dienTichXungQuanh + 2 * sDay;
      const theTich = sDay * h;

      if (!shapeName) shapeName = "Hình lăng trụ đứng ABC.A'B'C' (đáy vuông tại B)";

      calculations = {
        canhDay: bc,
        chieuDai: ab,
        chieuRong: bc,
        chieuCao: h,
        dienTichDay: Number(sDay.toFixed(3)),
        dienTichXungQuanh: Number(dienTichXungQuanh.toFixed(3)),
        dienTichToanPhan: Number(dienTichToanPhan.toFixed(3)),
        theTich: Number(theTich.toFixed(3)),
        donVi,
        congThuc: {
          dienTichDay: "S_{\\Delta ABC} = \\frac{1}{2} AB \\cdot BC",
          theTich: "V = S_{\\Delta ABC} \\cdot h"
        }
      };

      // Đặt B tại góc vuông, căn chỉnh tọa độ quanh gốc
      const B = [-ab / 2, -bc / 2, 0];
      const A = [ab / 2, -bc / 2, 0];
      const C = [-ab / 2, bc / 2, 0];

      // Đáy dưới (z = 0)
      vertices.push(A); // 0: A
      vertices.push(B); // 1: B
      vertices.push(C); // 2: C

      // Đáy trên (z = h)
      vertices.push([A[0], A[1], h]); // 3: A'
      vertices.push([B[0], B[1], h]); // 4: B'
      vertices.push([C[0], C[1], h]); // 5: C'
      labels.push("A", "B", "C", "A'", "B'", "C'");

      faces = [
        [0, 2, 1],    // Đáy dưới ACB
        [3, 4, 5],    // Đáy trên A'B'C'
        [0, 1, 4, 3], // Mặt bên ABB'A'
        [1, 2, 5, 4], // Mặt bên BCC'B'
        [2, 0, 3, 5]  // Mặt bên CAA'C'
      ];
      edges = [
        [0, 1], [1, 2], [2, 0], // Đáy dưới
        [3, 4], [4, 5], [5, 3], // Đáy trên
        [0, 3], [1, 4], [2, 5]  // Cạnh bên
      ];

      // Nếu đề bài có mặt phẳng (A'BC) hoặc đoạn A'B: bổ sung đường phụ A'B và highlight mặt phẳng (A'BC)
      const hasPlaneApBC = Boolean(
        (llmData.appliedRule && llmData.appliedRule.includes("A'BC")) ||
        (llmData.ruleId && llmData.ruleId.includes('prism_face_triangle_area_and_angle')) ||
        (originalProblemText && /(a'bc|a'b)/i.test(originalProblemText))
      );

      if (hasPlaneApBC) {
        auxiliary_edges.push([3, 1]); // Đường chéo A'B (nối A' và B)
        highlight_planes.push({
          points: ["A'", "B", "C"],
          indices: [3, 1, 2],
          color: '#f59e0b',
          name: "Mặt phẳng (A'BC)"
        });
      }
    } else {
      const h = Number(params.chieuCao) || 6;
      if (!shapeName) shapeName = 'Hình lăng trụ tam giác đều ABC.A\'B\'C\'';

      const dienTichXungQuanh = 3 * a * h;
      const dienTichToanPhan = dienTichXungQuanh + 2 * dienTichDay;
      const theTich = dienTichDay * h;

      calculations = {
        canhDay: a,
        chieuCao: h,
        dienTichDay: Number(dienTichDay.toFixed(3)),
        dienTichXungQuanh: Number(dienTichXungQuanh.toFixed(3)),
        dienTichToanPhan: Number(dienTichToanPhan.toFixed(3)),
        theTich: Number(theTich.toFixed(3)),
        donVi,
        congThuc: {
          dienTichDay: "S_{đáy} = \\frac{a^2\\sqrt{3}}{4}",
          theTich: "V = S_{đáy} \\cdot h = \\frac{a^2 h \\sqrt{3}}{4}",
          dienTichXungQuanh: "S_{xq} = 3 a h"
        }
      };

      const R = a / Math.sqrt(3);
      // Đáy dưới (z = 0)
      vertices.push([0, Number(R.toFixed(4)), 0]); // 0: A
      vertices.push([Number((a / 2).toFixed(4)), Number((-R / 2).toFixed(4)), 0]); // 1: B
      vertices.push([Number((-a / 2).toFixed(4)), Number((-R / 2).toFixed(4)), 0]); // 2: C
      // Đáy trên (z = h)
      vertices.push([0, Number(R.toFixed(4)), h]); // 3: A'
      vertices.push([Number((a / 2).toFixed(4)), Number((-R / 2).toFixed(4)), h]); // 4: B'
      vertices.push([Number((-a / 2).toFixed(4)), Number((-R / 2).toFixed(4)), h]); // 5: C'
      labels.push("A", "B", "C", "A'", "B'", "C'");

      faces = [
        [0, 2, 1],    // Đáy dưới
        [3, 4, 5],    // Đáy trên
        [0, 1, 4, 3], // Mặt bên ABB'A'
        [1, 2, 5, 4], // Mặt bên BCC'B'
        [2, 0, 3, 5]  // Mặt bên CAA'C'
      ];
      edges = [
        [0, 1], [1, 2], [2, 0], // Đáy dưới
        [3, 4], [4, 5], [5, 3], // Đáy trên
        [0, 3], [1, 4], [2, 5]  // Cạnh bên
      ];
    }
  }

  // =========================================================================
  // 6. HÌNH TRỤ TRÒN XOAY
  // =========================================================================
  else if (shapeType === 'hinh_tru') {
    const r = Number(params.banKinh) || 3;
    const h = Number(params.chieuCao) || 6;
    if (!shapeName) shapeName = 'Hình trụ tròn xoay';

    const dienTichDay = Math.PI * Math.pow(r, 2);
    const dienTichXungQuanh = 2 * Math.PI * r * h;
    const dienTichToanPhan = dienTichXungQuanh + 2 * dienTichDay;
    const theTich = Math.PI * Math.pow(r, 2) * h;

    calculations = {
      banKinh: r,
      chieuCao: h,
      dienTichDay: Number(dienTichDay.toFixed(3)),
      dienTichXungQuanh: Number(dienTichXungQuanh.toFixed(3)),
      dienTichToanPhan: Number(dienTichToanPhan.toFixed(3)),
      theTich: Number(theTich.toFixed(3)),
      donVi,
      congThuc: {
        dienTichDay: "S_{đáy} = \\pi r^2",
        dienTichXungQuanh: "S_{xq} = 2\\pi r h",
        dienTichToanPhan: "S_{tp} = 2\\pi r h + 2\\pi r^2",
        theTich: "V = \\pi r^2 h"
      }
    };

    // Dựng 16 điểm vành tròn đáy dưới và 16 điểm vành tròn đáy trên
    const SEGMENTS = 16;
    for (let i = 0; i < SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * 2 * Math.PI;
      vertices.push([Number((r * Math.cos(angle)).toFixed(4)), Number((r * Math.sin(angle)).toFixed(4)), 0]);
    }
    for (let i = 0; i < SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * 2 * Math.PI;
      vertices.push([Number((r * Math.cos(angle)).toFixed(4)), Number((r * Math.sin(angle)).toFixed(4)), h]);
    }
    labels = ["O", "O'"];

    for (let i = 0; i < SEGMENTS; i++) {
      const next = (i + 1) % SEGMENTS;
      edges.push([i, next]); // Đáy dưới
      edges.push([i + SEGMENTS, next + SEGMENTS]); // Đáy trên
      if (i % 4 === 0) edges.push([i, i + SEGMENTS]); // Đường sinh chính
      faces.push([i, next, next + SEGMENTS, i + SEGMENTS]);
    }
  }

  // =========================================================================
  // 7. HÌNH NÓN TRÒN XOAY
  // =========================================================================
  else if (shapeType === 'hinh_non') {
    const r = Number(params.banKinh) || 3;
    const h = Number(params.chieuCao) || 5;
    if (!shapeName) shapeName = 'Hình nón tròn xoay';

    const duongSinh = Math.sqrt(r * r + h * h);
    const dienTichDay = Math.PI * Math.pow(r, 2);
    const dienTichXungQuanh = Math.PI * r * duongSinh;
    const dienTichToanPhan = dienTichXungQuanh + dienTichDay;
    const theTich = (1 / 3) * Math.PI * Math.pow(r, 2) * h;

    calculations = {
      banKinh: r,
      chieuCao: h,
      duongSinh: Number(duongSinh.toFixed(3)),
      dienTichDay: Number(dienTichDay.toFixed(3)),
      dienTichXungQuanh: Number(dienTichXungQuanh.toFixed(3)),
      dienTichToanPhan: Number(dienTichToanPhan.toFixed(3)),
      theTich: Number(theTich.toFixed(3)),
      donVi,
      congThuc: {
        duongSinh: "l = \\sqrt{r^2 + h^2}",
        dienTichDay: "S_{đáy} = \\pi r^2",
        dienTichXungQuanh: "S_{xq} = \\pi r l",
        dienTichToanPhan: "S_{tp} = \\pi r l + \\pi r^2",
        theTich: "V = \\frac{1}{3}\\pi r^2 h"
      }
    };

    // Đỉnh S (0, 0, h)
    vertices.push([0, 0, h]);
    labels.push("S");

    // Đáy nón 16 điểm
    const SEGMENTS = 16;
    for (let i = 0; i < SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * 2 * Math.PI;
      vertices.push([Number((r * Math.cos(angle)).toFixed(4)), Number((r * Math.sin(angle)).toFixed(4)), 0]);
    }
    for (let i = 1; i <= SEGMENTS; i++) {
      const next = i === SEGMENTS ? 1 : i + 1;
      edges.push([i, next]); // Đáy
      if ((i - 1) % 4 === 0) edges.push([0, i]); // Đường sinh chính
      faces.push([0, i, next]);
    }
  }

  // =========================================================================
  // 8. HÌNH CẦU
  // =========================================================================
  else if (shapeType === 'hinh_cau') {
    const r = Number(params.banKinh) || 3;
    if (!shapeName) shapeName = 'Hình cầu';

    const dienTichMatCau = 4 * Math.PI * Math.pow(r, 2);
    const theTich = (4 / 3) * Math.PI * Math.pow(r, 3);

    calculations = {
      banKinh: r,
      dienTichMatCau: Number(dienTichMatCau.toFixed(3)),
      theTich: Number(theTich.toFixed(3)),
      donVi,
      congThuc: {
        dienTichMatCau: "S = 4\\pi r^2",
        theTich: "V = \\frac{4}{3}\\pi r^3"
      }
    };

    // Sinh các vòng tròn kinh tuyến, vĩ tuyến
    const SEGMENTS = 16;
    // Vòng xích đạo (z = 0)
    for (let i = 0; i < SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * 2 * Math.PI;
      vertices.push([Number((r * Math.cos(angle)).toFixed(4)), Number((r * Math.sin(angle)).toFixed(4)), 0]);
      edges.push([i, (i + 1) % SEGMENTS]);
    }
    // Vòng kinh tuyến (y = 0)
    const baseIdx = vertices.length;
    for (let i = 0; i < SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * 2 * Math.PI;
      vertices.push([Number((r * Math.cos(angle)).toFixed(4)), 0, Number((r * Math.sin(angle)).toFixed(4))]);
      edges.push([baseIdx + i, baseIdx + ((i + 1) % SEGMENTS)]);
    }
    labels.push("O");
  }

  // Khối hình mặc định / khác
  else {
    shapeName = shapeName || 'Khối hình không gian 3D';
  }

  // ── XỬ LÝ KẺ ĐƯỜNG PHỤ (AUXILIARY GEOMETRY) ─────────────────────────────
  const auxRequests = Array.isArray(llmData.auxiliaryRequests) ? llmData.auxiliaryRequests : [];

  const findIndexByLabel = (lbl: string): number => {
    if (!lbl) return -1;
    const clean = lbl.trim().toUpperCase();
    return labels.findIndex(l => l.trim().toUpperCase() === clean);
  };

  for (const req of auxRequests) {
    if (!req || typeof req !== 'object') continue;
    const reqType = (req.type || '').toLowerCase();

    // 1. Hình chiếu vuông góc (Perpendicular projection)
    if (reqType === 'perpendicular' || reqType === 'vuong_goc') {
      const fromLabel = req.from || req.point || req.fromPoint || req.point1;
      const fromIdx = findIndexByLabel(fromLabel);
      const linePts = Array.isArray(req.toLine)
        ? req.toLine
        : (Array.isArray(req.onLine)
          ? req.onLine
          : (Array.isArray(req.line_segment)
            ? req.line_segment
            : (Array.isArray(req.segment)
              ? req.segment
              : (req.point1 && req.point2 && req.point1 !== fromLabel ? [req.point1, req.point2] : []))));
      const lineIdx1 = findIndexByLabel(linePts[0]);
      const lineIdx2 = findIndexByLabel(linePts[1]);

      if (fromIdx !== -1 && lineIdx1 !== -1 && lineIdx2 !== -1) {
        const pFrom = vertices[fromIdx] as Point3D;
        const pA = vertices[lineIdx1] as Point3D;
        const pB = vertices[lineIdx2] as Point3D;

        const pH = calculateProjection(pFrom, pA, pB);
        const pointName = (req.pointName || req.new_point_name || req.name || req.label || 'H').trim().toUpperCase();

        let hIdx = findIndexByLabel(pointName);
        if (hIdx === -1) {
          vertices.push(pH);
          labels.push(pointName);
          auxiliary_labels.push(pointName);
          hIdx = vertices.length - 1;
        }

        auxiliary_edges.push([fromIdx, hIdx]);
        const isExistingEdge = edges.some(([u, v]) => (u === lineIdx1 && v === lineIdx2) || (u === lineIdx2 && v === lineIdx1));
        const isAlreadyAux = auxiliary_edges.some(([u, v]) => (u === lineIdx1 && v === lineIdx2) || (u === lineIdx2 && v === lineIdx1));
        if (!isExistingEdge && !isAlreadyAux) {
          auxiliary_edges.push([lineIdx1, lineIdx2]);
        }
      }
    }

    // 2. Trung điểm (Midpoint)
    else if (reqType === 'midpoint' || reqType === 'trung_diem') {
      const linePts = Array.isArray(req.onLine)
        ? req.onLine
        : (Array.isArray(req.toLine)
          ? req.toLine
          : (Array.isArray(req.line_segment)
            ? req.line_segment
            : (req.point1 && req.point2 ? [req.point1, req.point2] : [])));
      const lineIdx1 = findIndexByLabel(linePts[0]);
      const lineIdx2 = findIndexByLabel(linePts[1]);

      if (lineIdx1 !== -1 && lineIdx2 !== -1) {
        const p1 = vertices[lineIdx1] as Point3D;
        const p2 = vertices[lineIdx2] as Point3D;
        const pM = calculateMidpoint(p1, p2);
        const pointName = (req.pointName || req.new_point_name || req.name || req.label || 'M').trim().toUpperCase();

        let mIdx = findIndexByLabel(pointName);
        if (mIdx === -1) {
          vertices.push(pM);
          labels.push(pointName);
          auxiliary_labels.push(pointName);
          mIdx = vertices.length - 1;
        }

        const connFrom = req.connectFrom || req.from;
        if (connFrom) {
          const connIdx = findIndexByLabel(connFrom);
          if (connIdx !== -1) {
            auxiliary_edges.push([connIdx, mIdx]);
          }
        }
      }
    }

    // 3. Đoạn thẳng nối 2 điểm (Segment / Connect)
    else if (reqType === 'segment' || reqType === 'connect' || reqType === 'doan_thang') {
      const fromIdx = findIndexByLabel(req.from || req.point1 || req.fromPoint);
      const toIdx = findIndexByLabel(req.to || req.point2 || req.pointName || req.new_point_name || req.toPoint);
      if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
        auxiliary_edges.push([fromIdx, toIdx]);
      }
    }

    // 4. Tô màu mặt phẳng thiết diện (Highlight plane)
    else if (reqType === 'highlight_plane' || reqType === 'plane' || reqType === 'thiet_dien') {
      const rawPts = Array.isArray(req.points) ? req.points : (Array.isArray(req.vertices) ? req.vertices : (Array.isArray(req.plane) ? req.plane : []));
      const cleanPts = rawPts.map((p: any) => (typeof p === 'string' ? p.trim().toUpperCase() : '')).filter(Boolean);
      const pointIndices = cleanPts.map((p: string) => findIndexByLabel(p)).filter((idx: number) => idx !== -1);

      if (pointIndices.length >= 3) {
        highlight_planes.push({
          points: cleanPts,
          indices: pointIndices,
          color: req.color || '#a371f7',
          name: req.name || `(${cleanPts.join('')})`
        });

        for (let i = 0; i < pointIndices.length; i++) {
          const u = pointIndices[i];
          const v = pointIndices[(i + 1) % pointIndices.length];
          const existsInEdges = edges.some(([a, b]) => (a === u && b === v) || (a === v && b === u));
          const existsInAux = auxiliary_edges.some(([a, b]) => (a === u && b === v) || (a === v && b === u));
          if (!existsInEdges && !existsInAux) {
            auxiliary_edges.push([u, v]);
          }
        }
      }
    }
  }

  return {
    shapeType,
    shapeName,
    parameters: params,
    calculations,
    vertices,
    faces,
    edges,
    visible_edges: edges,
    hidden_edges: [],
    auxiliary_edges,
    auxiliary_labels,
    highlight_planes,
    vertex_labels: labels,
    labels,
    originalProblemText,
    auxiliaryRequests: auxRequests
  };
}
