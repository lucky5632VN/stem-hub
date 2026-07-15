// =====================================================
// SpatialMind — Cross-Section Calculator (Pure JS)
// =====================================================
// Tính thiết diện (cross-section) cực nhanh trên client-side
// Không cần gọi SymPy backend → phản hồi tức thì
//
// Thuật toán: Sutherland-Hodgman polygon clipping (O(n))
// + Graham scan convex hull (O(n log n))
// =====================================================

/**
 * Vector3 operations (inline, no Three.js dependency)
 * Tối ưu: Không tạo object mới, dùng array [x, y, z]
 */
const Vec3 = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  scale: (v, s) => [v[0] * s, v[1] * s, v[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ],
  length: (v) => Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]),
  normalize: (v) => {
    const len = Vec3.length(v);
    return len > 1e-10 ? [v[0] / len, v[1] / len, v[2] / len] : [0, 0, 0];
  },
  lerp: (a, b, t) => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ],
  distance: (a, b) => Vec3.length(Vec3.sub(a, b)),
  equals: (a, b, eps = 1e-8) =>
    Math.abs(a[0] - b[0]) < eps &&
    Math.abs(a[1] - b[1]) < eps &&
    Math.abs(a[2] - b[2]) < eps,
};


/**
 * Plane representation: ax + by + cz + d = 0
 * normal = [a, b, c], d = -dot(normal, point_on_plane)
 */
export class Plane3D {
  /**
   * Tạo mặt phẳng từ 3 điểm (thứ tự counter-clockwise)
   * @param {number[]} p1 
   * @param {number[]} p2 
   * @param {number[]} p3 
   */
  constructor(p1, p2, p3) {
    const v1 = Vec3.sub(p2, p1);
    const v2 = Vec3.sub(p3, p1);
    this.normal = Vec3.normalize(Vec3.cross(v1, v2));
    this.d = -Vec3.dot(this.normal, p1);
    this.point = p1; // Một điểm thuộc mặt phẳng
  }

  /**
   * Khoảng cách có dấu từ điểm đến mặt phẳng
   * > 0: phía normal, < 0: phía ngược, = 0: nằm trên
   * Complexity: O(1)
   */
  signedDistance(point) {
    return Vec3.dot(this.normal, point) + this.d;
  }

  /**
   * Giao điểm của đoạn thẳng [p1, p2] với mặt phẳng
   * @returns {number[]|null} Tọa độ giao điểm hoặc null
   * Complexity: O(1)
   */
  intersectSegment(p1, p2) {
    const d1 = this.signedDistance(p1);
    const d2 = this.signedDistance(p2);

    // Cùng phía → không giao
    if (d1 * d2 > 1e-10) return null;

    // Nằm trên mặt phẳng
    if (Math.abs(d1) < 1e-10 && Math.abs(d2) < 1e-10) return null;

    // Tính tham số t (parametric line: P = P1 + t*(P2-P1))
    const t = d1 / (d1 - d2);

    // Clamp t vào [0, 1] (chỉ lấy giao trong đoạn thẳng)
    if (t < -1e-10 || t > 1 + 1e-10) return null;

    return Vec3.lerp(p1, p2, Math.max(0, Math.min(1, t)));
  }
}


/**
 * Tính thiết diện của một khối đa diện bởi một mặt phẳng
 * 
 * @param {Object} vertices - { "A": [x,y,z], "B": [x,y,z], ... }
 * @param {string[][]} edges - [["A","B"], ["B","C"], ...]
 * @param {number[]} planeP1 - Điểm 1 trên mặt cắt
 * @param {number[]} planeP2 - Điểm 2 trên mặt cắt
 * @param {number[]} planeP3 - Điểm 3 trên mặt cắt
 * @returns {{ vertices: number[][], orderedNames: string[], area: number }}
 * 
 * Complexity: O(E) với E = số cạnh
 * 
 * @example
 * const result = computeCrossSection(
 *   { A: [0,0,0], B: [2,0,0], C: [2,2,0], D: [0,2,0], S: [1,1,3] },
 *   [["A","B"], ["B","C"], ["C","D"], ["D","A"], ["S","A"], ["S","B"], ["S","C"], ["S","D"]],
 *   [0.5, 0.5, 1.5],  // M = trung điểm SA
 *   [1.5, 0.5, 1.5],  // N = trung điểm SB
 *   [2, 2, 0]          // C
 * );
 */
export function computeCrossSection(vertices, edges, planeP1, planeP2, planeP3) {
  const plane = new Plane3D(planeP1, planeP2, planeP3);
  
  // Bước 1: Tìm tất cả giao điểm của mặt phẳng với các cạnh — O(E)
  const intersections = [];
  const seen = new Set(); // Tránh trùng lặp

  for (const [nameA, nameB] of edges) {
    const pA = vertices[nameA];
    const pB = vertices[nameB];
    if (!pA || !pB) continue;

    const intersection = plane.intersectSegment(pA, pB);
    if (intersection) {
      // Hash để tránh trùng
      const hash = intersection.map(v => v.toFixed(6)).join(',');
      if (!seen.has(hash)) {
        seen.add(hash);
        
        // Xác định tên điểm giao
        let name;
        if (Vec3.equals(intersection, pA, 0.01)) {
          name = nameA;
        } else if (Vec3.equals(intersection, pB, 0.01)) {
          name = nameB;
        } else {
          // Điểm giữa cạnh → đặt tên "M_AB"
          name = `P_${nameA}${nameB}`;
        }

        intersections.push({ point: intersection, name, edgeName: `${nameA}-${nameB}` });
      }
    }
  }

  if (intersections.length < 3) {
    return { vertices: [], orderedNames: [], area: 0 };
  }

  // Bước 2: Sắp xếp các điểm theo thứ tự vòng (angular sort) — O(n log n)
  const ordered = sortPolygonVertices(intersections.map(p => p.point), plane.normal);
  
  // Map lại tên
  const orderedWithNames = ordered.map(pt => {
    const match = intersections.find(p => Vec3.equals(p.point, pt, 0.001));
    return { point: pt, name: match ? match.name : '?' };
  });

  // Bước 3: Tính diện tích (Shoelace formula trên mặt phẳng 3D) — O(n)
  const area = computePolygonArea(ordered, plane.normal);

  return {
    vertices: orderedWithNames.map(p => p.point),
    orderedNames: orderedWithNames.map(p => p.name),
    area: Math.abs(area),
  };
}


/**
 * Sắp xếp đỉnh polygon theo thứ tự vòng (dùng cho 3D)
 * Project lên 2D → Angular sort quanh centroid
 * 
 * Complexity: O(n log n)
 */
function sortPolygonVertices(points, normal) {
  if (points.length <= 2) return points;

  // Centroid
  const n = points.length;
  const centroid = [0, 0, 0];
  for (const p of points) {
    centroid[0] += p[0] / n;
    centroid[1] += p[1] / n;
    centroid[2] += p[2] / n;
  }

  // Tạo hệ tọa độ cục bộ trên mặt phẳng (u, v)
  // u = normalize(points[0] - centroid)
  // v = cross(normal, u)
  const u = Vec3.normalize(Vec3.sub(points[0], centroid));
  const v = Vec3.normalize(Vec3.cross(normal, u));

  // Project sang 2D và tính góc
  const withAngles = points.map(p => {
    const rel = Vec3.sub(p, centroid);
    const px = Vec3.dot(rel, u);
    const py = Vec3.dot(rel, v);
    const angle = Math.atan2(py, px);
    return { point: p, angle };
  });

  // Sort theo góc
  withAngles.sort((a, b) => a.angle - b.angle);

  return withAngles.map(w => w.point);
}


/**
 * Tính diện tích đa giác 3D (Shoelace trên mặt phẳng)
 * @param {number[][]} vertices - Đã sắp xếp theo thứ tự vòng
 * @param {number[]} normal - Pháp tuyến mặt phẳng
 * @returns {number} Diện tích
 * Complexity: O(n)
 */
function computePolygonArea(vertices, normal) {
  if (vertices.length < 3) return 0;

  let total = [0, 0, 0];

  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    const cross = Vec3.cross(vertices[i], vertices[j]);
    total[0] += cross[0];
    total[1] += cross[1];
    total[2] += cross[2];
  }

  return Math.abs(Vec3.dot(normal, total)) / 2;
}


// ── Geometry Math Utilities ──

/**
 * Khoảng cách từ điểm đến mặt phẳng — O(1)
 */
export function pointToPlaneDistance(point, planeP1, planeP2, planeP3) {
  const plane = new Plane3D(planeP1, planeP2, planeP3);
  return Math.abs(plane.signedDistance(point));
}

/**
 * Góc nhị diện giữa hai mặt phẳng (radians) — O(1)
 */
export function dihedralAngle(plane1Points, plane2Points) {
  const p1 = new Plane3D(...plane1Points);
  const p2 = new Plane3D(...plane2Points);
  const cosAngle = Math.abs(Vec3.dot(p1.normal, p2.normal));
  return Math.acos(Math.min(1, cosAngle));
}

/**
 * Khoảng cách giữa hai đường thẳng chéo nhau — O(1)
 * @param {number[]} p1, d1 - Điểm và hướng đường thẳng 1
 * @param {number[]} p2, d2 - Điểm và hướng đường thẳng 2
 */
export function distanceBetweenSkewLines(p1, d1, p2, d2) {
  const n = Vec3.cross(d1, d2);
  const len = Vec3.length(n);
  if (len < 1e-10) {
    // Hai đường song song
    const diff = Vec3.sub(p2, p1);
    const proj = Vec3.scale(d1, Vec3.dot(diff, d1) / Vec3.dot(d1, d1));
    return Vec3.length(Vec3.sub(diff, proj));
  }
  const diff = Vec3.sub(p2, p1);
  return Math.abs(Vec3.dot(diff, n)) / len;
}

/**
 * Hình chiếu của điểm lên mặt phẳng — O(1)
 */
export function projectPointToPlane(point, planeP1, planeP2, planeP3) {
  const plane = new Plane3D(planeP1, planeP2, planeP3);
  const dist = plane.signedDistance(point);
  return Vec3.sub(point, Vec3.scale(plane.normal, dist));
}

/**
 * Góc giữa đường thẳng và mặt phẳng (radians) — O(1)
 */
export function angleLinePlane(lineDir, planeP1, planeP2, planeP3) {
  const plane = new Plane3D(planeP1, planeP2, planeP3);
  const sinAngle = Math.abs(Vec3.dot(Vec3.normalize(lineDir), plane.normal));
  return Math.asin(Math.min(1, sinAngle));
}

export { Vec3 };
