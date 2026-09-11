/**
 * Mô phỏng đường đi của tia laser qua các gương trong phòng thí nghiệm (Client-Side).
 * @param {Array} mirrors Mảng các gương { x, y, angle }
 * @param {Object} sourcePos Vị trí nguồn phát { x, y }
 * @param {Object} targetPos Vị trí mục tiêu { x, y }
 * @returns {Object} { isHit: boolean, path: Array }
 */
export function calculateLaserPath(mirrors, sourcePos = { x: 45, y: 140 }, targetPos = { x: 295, y: 140 }) {
  let currentPos = { ...sourcePos };
  let currentDir = { x: 0, y: -1 }; // Hướng ban đầu: đi dọc lên trên
  const path = [{ ...currentPos }];
  const maxReflections = 10;
  let isHit = false;

  for (let step = 0; step < maxReflections; step++) {
    let nextObstacle = null;
    let minDistance = Infinity;
    let isTarget = false;

    // 1. Kiểm tra xem mục tiêu (targetPos) có nằm trên đường đi của tia laser hiện tại không
    if (currentDir.x !== 0) {
      // Laser đang đi ngang
      if (Math.abs(targetPos.y - currentPos.y) < 5) {
        const dx = targetPos.x - currentPos.x;
        // Đi cùng hướng (dx và currentDir.x cùng dấu)
        if (dx * currentDir.x > 0) {
          const dist = Math.abs(dx);
          if (dist < minDistance) {
            minDistance = dist;
            nextObstacle = targetPos;
            isTarget = true;
          }
        }
      }
    } else {
      // Laser đang đi dọc
      if (Math.abs(targetPos.x - currentPos.x) < 5) {
        const dy = targetPos.y - currentPos.y;
        // Đi cùng hướng (dy và currentDir.y cùng dấu)
        if (dy * currentDir.y > 0) {
          const dist = Math.abs(dy);
          if (dist < minDistance) {
            minDistance = dist;
            nextObstacle = targetPos;
            isTarget = true;
          }
        }
      }
    }

    // 2. Kiểm tra xem các gương có nằm trên đường đi hiện tại không
    for (const mirror of mirrors) {
      // Bỏ qua gương hiện tại nếu tia laser vừa xuất phát từ chính gương đó
      if (Math.abs(mirror.x - currentPos.x) < 5 && Math.abs(mirror.y - currentPos.y) < 5) {
        continue;
      }

      if (currentDir.x !== 0) {
        // Laser đang đi ngang
        if (Math.abs(mirror.y - currentPos.y) < 5) {
          const dx = mirror.x - currentPos.x;
          if (dx * currentDir.x > 0) {
            const dist = Math.abs(dx);
            if (dist < minDistance) {
              minDistance = dist;
              nextObstacle = mirror;
              isTarget = false;
            }
          }
        }
      } else {
        // Laser đang đi dọc
        if (Math.abs(mirror.x - currentPos.x) < 5) {
          const dy = mirror.y - currentPos.y;
          if (dy * currentDir.y > 0) {
            const dist = Math.abs(dy);
            if (dist < minDistance) {
              minDistance = dist;
              nextObstacle = mirror;
              isTarget = false;
            }
          }
        }
      }
    }

    // Nếu không tìm thấy vật cản tiếp theo, laser đi ra khỏi vùng lab
    if (!nextObstacle) {
      path.push({
        x: currentPos.x + currentDir.x * 500,
        y: currentPos.y + currentDir.y * 500
      });
      break;
    }

    // Tiến tia laser đến vật cản tiếp theo
    currentPos = { x: nextObstacle.x, y: nextObstacle.y };
    path.push({ ...currentPos });

    // Nếu chạm mục tiêu
    if (isTarget) {
      isHit = true;
      break;
    }

    // Tính toán góc phản xạ vật lý (theta_physical) tại gương
    const theta = nextObstacle.angle;
    let theta_physical = 0;

    if (nextObstacle.offset !== undefined) {
      theta_physical = theta + nextObstacle.offset;
    } else {
      // Ánh xạ góc vật lý tương ứng với vị trí 3 gương (tương thích ngược)
      if (Math.abs(nextObstacle.x - 45) < 5 && Math.abs(nextObstacle.y - 50) < 5) {
        // Gương A
        theta_physical = theta + 90;
      } else if (Math.abs(nextObstacle.x - 175) < 5 && Math.abs(nextObstacle.y - 50) < 5) {
        // Gương B
        theta_physical = theta - 45;
      } else if (Math.abs(nextObstacle.x - 175) < 5 && Math.abs(nextObstacle.y - 140) < 5) {
        // Gương C
        theta_physical = theta - 90;
      } else {
        theta_physical = theta;
      }
    }

    // Chuyển sang Radian
    const rad = (theta_physical * Math.PI) / 180;

    // Vector pháp tuyến của gương n = (-sin(rad), cos(rad))
    const n = { x: -Math.sin(rad), y: Math.cos(rad) };

    // Công thức phản xạ vector: d' = d - 2(d.n)n
    const dot = currentDir.x * n.x + currentDir.y * n.y;
    let nextDirX = currentDir.x - 2 * dot * n.x;
    let nextDirY = currentDir.y - 2 * dot * n.y;

    // Làm tròn về 4 hướng chính (-1, 0, 1) để tránh sai số dấu phẩy động
    nextDirX = Math.round(nextDirX);
    nextDirY = Math.round(nextDirY);

    // Dừng lại nếu vector hướng mới triệt tiêu
    if (nextDirX === 0 && nextDirY === 0) {
      break;
    }

    currentDir = { x: nextDirX, y: nextDirY };
  }

  return { isHit, path };
}

import { diagnosePhysicsAttempt } from './physicsErrorDiagnostic.js';

export function diagnosePhysicsError(userParams, targetParams) {
  return diagnosePhysicsAttempt(userParams, targetParams);
}

