/**
 * Wave Simulation & Projectile Physics Engine
 * Mô phỏng sóng dừng, sóng chạy, giao thoa sóng cơ và chuyển động ném xiên vật lý
 */

export function getTravelingWavePoint({ A, lambda, f, phi, x, t }) {
  const omega = 2 * Math.PI * f;
  const k = (2 * Math.PI) / lambda;
  const phase = omega * t - k * x + phi;
  return A * Math.cos(phase);
}

export function getStandingWavePoint({ A, lambda, f, x, t }) {
  const omega = 2 * Math.PI * f;
  const k = (2 * Math.PI) / lambda;
  // Sóng dừng 2 đầu cố định: biên độ tại x là 2A * |sin(k*x)|
  const spatial = 2 * A * Math.sin(k * x);
  const temporal = Math.cos(omega * t);
  return spatial * temporal;
}

export function getNodesAndAntinodes(length, lambda) {
  const nodes = [];
  const antinodes = [];
  const halfLambda = lambda / 2;
  const quarterLambda = lambda / 4;

  // Nút sóng tại x = k * lambda/2
  for (let x = 0; x <= length; x += halfLambda) {
    nodes.push(Number(x.toFixed(2)));
  }

  // Bụng sóng tại x = (2k + 1) * lambda/4
  for (let x = quarterLambda; x <= length; x += halfLambda) {
    antinodes.push(Number(x.toFixed(2)));
  }

  return { nodes, antinodes };
}

/**
 * Tính toán quỹ đạo ném xiên
 */
export function getProjectileTrajectory({ v0, angleDeg, y0 = 0, g = 9.8 }) {
  const angleRad = (angleDeg * Math.PI) / 180;
  const vx = v0 * Math.cos(angleRad);
  const vy = v0 * Math.sin(angleRad);

  // Thời gian lên đến đỉnh cao nhất
  const tPeak = vy / g;
  // Độ cao cực đại
  const hMax = y0 + Math.pow(vy, 2) / (2 * g);

  // Tổng thời gian bay chạm đất (y = 0): y0 + vy*t - 0.5*g*t^2 = 0
  const discriminant = Math.pow(vy, 2) + 2 * g * y0;
  const tFlight = (vy + Math.sqrt(Math.max(0, discriminant))) / g;

  // Tầm xa cực đại
  const xMax = vx * tFlight;

  // Sinh danh sách điểm quỹ đạo (50 điểm mẫu)
  const points = [];
  const numSteps = 60;
  for (let i = 0; i <= numSteps; i++) {
    const t = (i / numSteps) * tFlight;
    const x = vx * t;
    const y = y0 + vy * t - 0.5 * g * Math.pow(t, 2);
    points.push({ x, y: Math.max(0, y), t });
  }

  return {
    vx,
    vy,
    tPeak,
    hMax,
    tFlight,
    xMax,
    points,
  };
}
