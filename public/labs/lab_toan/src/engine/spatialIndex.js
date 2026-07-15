// =====================================================
// SpatialMind — Spatial Index (BVH + Spatial Hashing)
// =====================================================
// Tối ưu hit-testing và vertex snap detection
// Thay thế brute-force O(n) bằng O(log n) cho raycasting
// Sử dụng Bounding Volume Hierarchy (AABB tree)
// =====================================================

/**
 * Axis-Aligned Bounding Box (AABB)
 */
export class AABB {
  constructor(minX, minY, minZ, maxX, maxY, maxZ) {
    this.min = [minX, minY, minZ];
    this.max = [maxX, maxY, maxZ];
  }

  static fromPoint(x, y, z, radius = 0.15) {
    return new AABB(
      x - radius, y - radius, z - radius,
      x + radius, y + radius, z + radius
    );
  }

  static fromEdge(p1, p2, thickness = 0.08) {
    return new AABB(
      Math.min(p1[0], p2[0]) - thickness,
      Math.min(p1[1], p2[1]) - thickness,
      Math.min(p1[2], p2[2]) - thickness,
      Math.max(p1[0], p2[0]) + thickness,
      Math.max(p1[1], p2[1]) + thickness,
      Math.max(p1[2], p2[2]) + thickness
    );
  }

  /**
   * Merge two AABBs into one encompassing both
   */
  static merge(a, b) {
    return new AABB(
      Math.min(a.min[0], b.min[0]),
      Math.min(a.min[1], b.min[1]),
      Math.min(a.min[2], b.min[2]),
      Math.max(a.max[0], b.max[0]),
      Math.max(a.max[1], b.max[1]),
      Math.max(a.max[2], b.max[2])
    );
  }

  /**
   * Kiểm tra điểm nằm trong AABB
   */
  containsPoint(x, y, z) {
    return (
      x >= this.min[0] && x <= this.max[0] &&
      y >= this.min[1] && y <= this.max[1] &&
      z >= this.min[2] && z <= this.max[2]
    );
  }

  /**
   * Kiểm tra hai AABB giao nhau
   */
  intersects(other) {
    return (
      this.min[0] <= other.max[0] && this.max[0] >= other.min[0] &&
      this.min[1] <= other.max[1] && this.max[1] >= other.min[1] &&
      this.min[2] <= other.max[2] && this.max[2] >= other.min[2]
    );
  }

  /**
   * Ray-AABB intersection (Slab method) — O(1)
   * @returns {number|null} Parameter t >= 0 nếu giao, null nếu không
   */
  rayIntersect(origin, direction) {
    let tmin = -Infinity;
    let tmax = Infinity;

    for (let i = 0; i < 3; i++) {
      if (Math.abs(direction[i]) < 1e-10) {
        // Tia song song với slab
        if (origin[i] < this.min[i] || origin[i] > this.max[i]) return null;
        continue;
      }

      const invD = 1.0 / direction[i];
      let t0 = (this.min[i] - origin[i]) * invD;
      let t1 = (this.max[i] - origin[i]) * invD;

      if (invD < 0) [t0, t1] = [t1, t0];

      tmin = Math.max(tmin, t0);
      tmax = Math.min(tmax, t1);

      if (tmax < tmin) return null;
    }

    return tmin >= 0 ? tmin : (tmax >= 0 ? tmax : null);
  }

  /**
   * Diện tích bề mặt (dùng cho SAH heuristic)
   */
  surfaceArea() {
    const dx = this.max[0] - this.min[0];
    const dy = this.max[1] - this.min[1];
    const dz = this.max[2] - this.min[2];
    return 2 * (dx * dy + dy * dz + dz * dx);
  }

  center() {
    return [
      (this.min[0] + this.max[0]) / 2,
      (this.min[1] + this.max[1]) / 2,
      (this.min[2] + this.max[2]) / 2,
    ];
  }
}


/**
 * BVH Node (Bounding Volume Hierarchy)
 */
class BVHNode {
  constructor() {
    this.bbox = null;
    this.left = null;
    this.right = null;
    this.items = null; // Leaf node chứa items
  }

  get isLeaf() {
    return this.items !== null;
  }
}


/**
 * BVH Tree — Cây phân cấp cho hit-testing O(log n)
 * 
 * @example
 * const bvh = new BVHTree();
 * bvh.build([
 *   { id: 'A', bbox: AABB.fromPoint(0, 0, 0), data: { name: 'A', type: 'vertex' } },
 *   { id: 'AB', bbox: AABB.fromEdge([0,0,0], [2,0,0]), data: { type: 'edge' } },
 * ]);
 * const hits = bvh.raycast([0, 5, 0], [0, -1, 0]); // Tia bắn từ trên xuống
 */
export class BVHTree {
  constructor(maxLeafSize = 4) {
    this.root = null;
    this.maxLeafSize = maxLeafSize;
  }

  /**
   * Xây dựng BVH từ danh sách items
   * @param {Array<{id: string, bbox: AABB, data: any}>} items
   * Complexity: O(n log n)
   */
  build(items) {
    if (!items || items.length === 0) {
      this.root = null;
      return;
    }
    this.root = this._buildRecursive(items, 0);
  }

  _buildRecursive(items, depth) {
    const node = new BVHNode();

    // Tính bounding box chung
    let combined = items[0].bbox;
    for (let i = 1; i < items.length; i++) {
      combined = AABB.merge(combined, items[i].bbox);
    }
    node.bbox = combined;

    // Leaf node
    if (items.length <= this.maxLeafSize) {
      node.items = items;
      return node;
    }

    // Chọn trục phân chia (xoay vòng X→Y→Z hoặc dùng trục dài nhất)
    const extents = [
      combined.max[0] - combined.min[0],
      combined.max[1] - combined.min[1],
      combined.max[2] - combined.min[2],
    ];
    const axis = extents.indexOf(Math.max(...extents));

    // Sort theo trục đã chọn (dùng center của bbox)
    items.sort((a, b) => a.bbox.center()[axis] - b.bbox.center()[axis]);

    // Chia đôi (Median split)
    const mid = Math.floor(items.length / 2);
    node.left = this._buildRecursive(items.slice(0, mid), depth + 1);
    node.right = this._buildRecursive(items.slice(mid), depth + 1);

    return node;
  }

  /**
   * Raycast — Tìm tất cả items mà tia giao với bbox
   * @param {number[]} origin - [x, y, z]
   * @param {number[]} direction - [dx, dy, dz] (đã normalize)
   * @returns {Array<{id: string, data: any, t: number}>} Sorted by distance
   * Complexity: O(log n) average
   */
  raycast(origin, direction) {
    if (!this.root) return [];
    
    const results = [];
    this._raycastRecursive(this.root, origin, direction, results);
    
    // Sort by distance
    results.sort((a, b) => a.t - b.t);
    return results;
  }

  _raycastRecursive(node, origin, direction, results) {
    if (!node || !node.bbox) return;

    const t = node.bbox.rayIntersect(origin, direction);
    if (t === null) return; // Tia không giao với bbox → skip cả subtree

    if (node.isLeaf) {
      for (const item of node.items) {
        const itemT = item.bbox.rayIntersect(origin, direction);
        if (itemT !== null) {
          results.push({ id: item.id, data: item.data, t: itemT });
        }
      }
      return;
    }

    this._raycastRecursive(node.left, origin, direction, results);
    this._raycastRecursive(node.right, origin, direction, results);
  }

  /**
   * Query tất cả items trong radius từ một điểm
   * @param {number[]} point - [x, y, z]
   * @param {number} radius
   * @returns {Array<{id: string, data: any, distance: number}>}
   * Complexity: O(log n + k) với k = số kết quả
   */
  queryRadius(point, radius) {
    if (!this.root) return [];

    const queryBox = AABB.fromPoint(point[0], point[1], point[2], radius);
    const results = [];
    this._queryRecursive(this.root, queryBox, point, radius, results);

    results.sort((a, b) => a.distance - b.distance);
    return results;
  }

  _queryRecursive(node, queryBox, point, radius, results) {
    if (!node || !node.bbox) return;
    if (!node.bbox.intersects(queryBox)) return;

    if (node.isLeaf) {
      for (const item of node.items) {
        if (item.bbox.intersects(queryBox)) {
          const center = item.bbox.center();
          const dx = center[0] - point[0];
          const dy = center[1] - point[1];
          const dz = center[2] - point[2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist <= radius) {
            results.push({ id: item.id, data: item.data, distance: dist });
          }
        }
      }
      return;
    }

    this._queryRecursive(node.left, queryBox, point, radius, results);
    this._queryRecursive(node.right, queryBox, point, radius, results);
  }
}


/**
 * Spatial Hash Grid — Nhanh cho vertex snap detection
 * Chia không gian thành ô lưới, lookup O(1)
 * 
 * @example
 * const grid = new SpatialHashGrid(0.5); // cell size 0.5
 * grid.insert('A', [0, 0, 0]);
 * grid.insert('B', [2, 0, 0]);
 * const nearby = grid.queryPoint([0.1, 0, 0], 0.3); // → ['A']
 */
export class SpatialHashGrid {
  constructor(cellSize = 0.5) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  _hash(x, y, z) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cy},${cz}`;
  }

  /**
   * Thêm item vào grid
   * @param {string} id
   * @param {number[]} position - [x, y, z]
   * @param {any} data - Metadata bất kỳ
   */
  insert(id, position, data = null) {
    const key = this._hash(position[0], position[1], position[2]);
    if (!this.cells.has(key)) {
      this.cells.set(key, []);
    }
    this.cells.get(key).push({ id, position, data });
  }

  /**
   * Tìm items gần điểm cho trước
   * @param {number[]} point - [x, y, z]
   * @param {number} radius
   * @returns {Array<{id: string, position: number[], data: any, distance: number}>}
   */
  queryPoint(point, radius) {
    const results = [];
    const cellRadius = Math.ceil(radius / this.cellSize);

    const cx = Math.floor(point[0] / this.cellSize);
    const cy = Math.floor(point[1] / this.cellSize);
    const cz = Math.floor(point[2] / this.cellSize);

    // Duyệt các ô lân cận
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        for (let dz = -cellRadius; dz <= cellRadius; dz++) {
          const key = `${cx + dx},${cy + dy},${cz + dz}`;
          const cell = this.cells.get(key);
          if (!cell) continue;

          for (const item of cell) {
            const ddx = item.position[0] - point[0];
            const ddy = item.position[1] - point[1];
            const ddz = item.position[2] - point[2];
            const dist = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
            if (dist <= radius) {
              results.push({ ...item, distance: dist });
            }
          }
        }
      }
    }

    results.sort((a, b) => a.distance - b.distance);
    return results;
  }

  /**
   * Xóa toàn bộ và rebuild
   */
  clear() {
    this.cells.clear();
  }
}
