/**
 * Harmonic Physics Engine
 * Mô phỏng dao động điều hòa, con lắc lò xo, con lắc đơn, biểu đồ năng lượng bảo toàn
 */

export const PLANET_GRAVITY = [
  { id: 'earth', name: 'Trái Đất', g: 9.8, desc: 'g = 9.80 m/s²' },
  { id: 'moon', name: 'Mặt Trăng', g: 1.62, desc: 'g = 1.62 m/s² (1/6 Trái Đất)' },
  { id: 'mars', name: 'Sao Hỏa', g: 3.71, desc: 'g = 3.71 m/s² (~38% Trái Đất)' },
  { id: 'jupiter', name: 'Sao Mộc', g: 24.79, desc: 'g = 24.79 m/s² (Trọng trường cực lớn)' },
];

/**
 * Tính toán trạng thái dao động điều hòa tại thời điểm t
 */
export function getOscillatorState({ A, omega, phi, m, k, t }) {
  // x(t) = A * cos(omega * t + phi) (đơn vị: cm)
  const phase = omega * t + phi;
  const x = A * Math.cos(phase);
  
  // v(t) = -A * omega * sin(phase) (đơn vị: cm/s)
  const v = -A * omega * Math.sin(phase);
  
  // a(t) = -A * omega^2 * cos(phase) = -omega^2 * x (đơn vị: cm/s²)
  const a = -Math.pow(omega, 2) * x;

  // Tính năng lượng (Joule) - quy đổi x sang mét (x / 100), v sang m/s (v / 100)
  const xMeters = x / 100;
  const vMeters = v / 100;
  const effectiveK = k || (m * Math.pow(omega, 2));

  const Wt = 0.5 * effectiveK * Math.pow(xMeters, 2); // Thế năng
  const Wd = 0.5 * m * Math.pow(vMeters, 2);          // Động năng
  const W = 0.5 * effectiveK * Math.pow(A / 100, 2);  // Cơ năng bảo toàn

  const period = (2 * Math.PI) / omega; // Chu kỳ T (s)
  const frequency = 1 / period;         // Tần số f (Hz)

  return {
    t,
    x,
    v,
    a,
    phase: ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI),
    Wt,
    Wd,
    W,
    period,
    frequency,
  };
}

/**
 * Sinh tọa độ vẽ lò xo xoắn zigzag từ điểm gốc (x0, y0) đến điểm gắn quả nặng (x1, y1)
 */
export function generateSpringPoints(x0, y0, x1, y1, coils = 12, width = 24) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  const points = [{ x: x0, y: y0 }];
  const leadIn = 25; // Đoạn thẳng đầu
  const leadOut = 25; // Đoạn thẳng đuôi
  const activeLength = Math.max(20, length - leadIn - leadOut);
  const step = activeLength / (coils * 2);

  // Điểm sau leadIn
  points.push({
    x: x0 + Math.cos(angle) * leadIn,
    y: y0 + Math.sin(angle) * leadIn,
  });

  const perpAngle = angle + Math.PI / 2;

  for (let i = 1; i <= coils * 2; i++) {
    const curDist = leadIn + i * step;
    const side = (i % 2 === 1) ? 1 : -1;
    const offset = side * (width / 2);

    const baseX = x0 + Math.cos(angle) * curDist;
    const baseY = y0 + Math.sin(angle) * curDist;

    points.push({
      x: baseX + Math.cos(perpAngle) * offset,
      y: baseY + Math.sin(perpAngle) * offset,
    });
  }

  // Điểm trước leadOut
  points.push({
    x: x1 - Math.cos(angle) * leadOut,
    y: y1 - Math.sin(angle) * leadOut,
  });

  points.push({ x: x1, y: y1 });
  return points;
}
