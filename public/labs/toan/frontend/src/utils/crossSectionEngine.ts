import type { CrossSectionData, PlaneDefinition } from '../types/geometry';

/**
 * Vector3 pure math helper
 */
const Vec3 = {
  sub: (a: number[], b: number[]): number[] => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  add: (a: number[], b: number[]): number[] => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  scale: (v: number[], s: number): number[] => [v[0] * s, v[1] * s, v[2] * s],
  dot: (a: number[], b: number[]): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a: number[], b: number[]): number[] => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ],
  length: (v: number[]): number => Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]),
  normalize: (v: number[]): number[] => {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return len > 1e-9 ? [v[0] / len, v[1] / len, v[2] / len] : [0, 0, 1];
  },
  lerp: (a: number[], b: number[], t: number): number[] => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ],
  distance: (a: number[], b: number[]): number => {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
};

/**
 * Tính toán mặt cắt thiết diện không gian 3D Client-side theo SGK Hình học 11
 */
export function calculateLocalCrossSection(
  vertices: number[][],
  edges: number[][],
  plane: PlaneDefinition
): CrossSectionData {
  if (!vertices || vertices.length < 3 || !edges || edges.length === 0) {
    return {
      polygon_vertices: [],
      area: 0,
      perimeter: 0,
      shape_name: 'Chưa có mô hình',
      num_vertices: 0,
      error: 'Vui lòng chọn hình khối hợp lệ'
    };
  }

  const normal = Vec3.normalize(plane.normal);
  const pointOnPlane = plane.point;

  // d(P) = dot(normal, P - pointOnPlane)
  const signedDistance = (p: number[]): number => {
    return Vec3.dot(normal, Vec3.sub(p, pointOnPlane));
  };

  const intersections: number[][] = [];
  const eps = 1e-5;

  for (const edge of edges) {
    const idxA = edge[0];
    const idxB = edge[1];
    const pA = vertices[idxA];
    const pB = vertices[idxB];
    if (!pA || !pB) continue;

    const dA = signedDistance(pA);
    const dB = signedDistance(pB);

    // Cùng một phía (không giao)
    if (dA * dB > eps) continue;

    const diff = dA - dB;
    if (Math.abs(diff) < 1e-9) {
      // Cả 2 điểm nằm trên mặt phẳng
      if (Math.abs(dA) < eps) {
        intersections.push(pA);
        intersections.push(pB);
      }
      continue;
    }

    const t = dA / diff;
    if (t >= -eps && t <= 1 + eps) {
      const clampedT = Math.max(0, Math.min(1, t));
      const interPt = Vec3.lerp(pA, pB, clampedT);
      
      // Kiểm tra trùng lặp
      const isDuplicate = intersections.some(
        (existing) => Vec3.distance(existing, interPt) < 0.02
      );
      if (!isDuplicate) {
        intersections.push(interPt);
      }
    }
  }

  if (intersections.length < 3) {
    return {
      polygon_vertices: [],
      area: 0,
      perimeter: 0,
      shape_name: 'Mặt phẳng không cắt khối hình',
      num_vertices: intersections.length,
      error: 'Mặt phẳng (P) không cắt qua đủ các cạnh của hình khối để tạo thiết diện.'
    };
  }

  // Sắp xếp các điểm theo thứ tự vòng quanh trọng tâm (Angular Sort)
  const n = intersections.length;
  const centroid = [0, 0, 0];
  for (const pt of intersections) {
    centroid[0] += pt[0] / n;
    centroid[1] += pt[1] / n;
    centroid[2] += pt[2] / n;
  }

  // Tạo hệ tọa độ cơ sở (u, v) trên mặt phẳng vuông góc với normal
  let u = Vec3.cross(normal, [0, 0, 1]);
  if (Vec3.length(u) < 0.1) {
    u = Vec3.cross(normal, [0, 1, 0]);
  }
  u = Vec3.normalize(u);
  const v = Vec3.normalize(Vec3.cross(normal, u));

  // Tính góc phân cực
  const sorted = [...intersections].map((pt) => {
    const rel = Vec3.sub(pt, centroid);
    const px = Vec3.dot(rel, u);
    const py = Vec3.dot(rel, v);
    const angle = Math.atan2(py, px);
    return { pt, angle };
  });

  sorted.sort((a, b) => a.angle - b.angle);
  const polygon = sorted.map((s) => s.pt);

  // Tính chu vi
  let perimeter = 0;
  for (let i = 0; i < polygon.length; i++) {
    const next = (i + 1) % polygon.length;
    perimeter += Vec3.distance(polygon[i], polygon[next]);
  }

  // Tính diện tích 3D bằng công thức Shoelace tích có hướng
  let totalCross = [0, 0, 0];
  for (let i = 0; i < polygon.length; i++) {
    const next = (i + 1) % polygon.length;
    const cr = Vec3.cross(polygon[i], polygon[next]);
    totalCross = Vec3.add(totalCross, cr);
  }
  const area = Math.abs(Vec3.dot(normal, totalCross)) / 2;

  // Xác định tên đa giác thiết diện chuẩn hình học SGK
  let shapeName = 'Đa giác thiết diện';
  if (polygon.length === 3) {
    shapeName = 'Tam giác thiết diện';
  } else if (polygon.length === 4) {
    shapeName = 'Tứ giác thiết diện';
  } else if (polygon.length === 5) {
    shapeName = 'Ngũ giác thiết diện';
  } else if (polygon.length === 6) {
    shapeName = 'Lục giác thiết diện';
  } else {
    shapeName = `Đa giác ${polygon.length} cạnh`;
  }

  return {
    polygon_vertices: polygon,
    area: Number(area.toFixed(3)),
    perimeter: Number(perimeter.toFixed(3)),
    shape_name: shapeName,
    num_vertices: polygon.length,
    error: null
  };
}
