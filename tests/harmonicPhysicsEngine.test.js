import assert from 'node:assert';
import { 
  PLANET_GRAVITY,
  getOscillatorState,
  generateSpringPoints
} from '../src/lib/grapher/harmonicPhysicsEngine.js';
import { 
  getTravelingWavePoint,
  getStandingWavePoint,
  getNodesAndAntinodes,
  getProjectileTrajectory 
} from '../src/lib/grapher/waveSimulationEngine.js';

console.log('\n=== RUNNING ADVANCED SIMULATION ENGINES UNIT TESTS ===\n');

// 1. Test Con lắc lò xo & Trọng trường hành tinh
{
  assert.ok(Array.isArray(PLANET_GRAVITY) && PLANET_GRAVITY.length >= 4, 'PLANET_GRAVITY must have at least 4 planets');
  const earth = PLANET_GRAVITY.find(p => p.id === 'earth');
  const moon = PLANET_GRAVITY.find(p => p.id === 'moon');
  assert.strictEqual(earth.g, 9.8, 'Earth gravity should be 9.8 m/s²');
  assert.strictEqual(moon.g, 1.62, 'Moon gravity should be 1.62 m/s²');
  console.log('✅ Passed: Planet gravity parameters');
}

// 2. Test Bảo toàn cơ năng & Kinematics dao động điều hòa
{
  const k = 50; // N/m
  const m = 0.5; // kg
  const A = 10; // cm = 0.1 m
  const omega = 10; // rad/s
  const phi = 0;

  // Tại t = 0: x = A = 10 cm, v = 0 -> Wt = 1/2 k (0.1)^2 = 0.25 J, Wd = 0, W = 0.25 J
  const state0 = getOscillatorState({ A, omega, phi, m, k, t: 0 });
  assert.strictEqual(Number(state0.x.toFixed(2)), 10, 'x(0) should equal +A (10cm)');
  assert.strictEqual(Number(state0.v.toFixed(2)), 0, 'v(0) should equal 0');
  assert.strictEqual(Number(state0.W.toFixed(4)), 0.25, 'Total mechanical energy should equal 0.25J');
  assert.strictEqual(Number(state0.Wt.toFixed(4)), 0.25, 'Potential energy at amplitude should be 0.25J');
  assert.strictEqual(Number(state0.Wd.toFixed(4)), 0, 'Kinetic energy at amplitude should be 0');

  // Tại t = T/4 (sau 1/4 chu kỳ): x = 0, v = -A * omega = -100 cm/s = -1 m/s -> Wd = 0.25 J, Wt = 0
  const T = state0.period;
  const stateT4 = getOscillatorState({ A, omega, phi, m, k, t: T / 4 });
  assert.strictEqual(Math.round(stateT4.x), 0, 'x(T/4) should equal 0 at equilibrium');
  assert.strictEqual(Number(stateT4.W.toFixed(4)), 0.25, 'Energy must be conserved at T/4');
  assert.strictEqual(Number(stateT4.Wd.toFixed(4)), 0.25, 'Kinetic energy at equilibrium should be 0.25J');
  assert.strictEqual(Number(stateT4.Wt.toFixed(4)), 0, 'Potential energy at equilibrium should be 0');

  // Test sinh lò xo xoắn zigzag
  const springPoints = generateSpringPoints(0, 0, 100, 0, 10, 20);
  assert.ok(springPoints.length >= 20, 'Spring points should have zigzag structure');
  console.log('✅ Passed: Mechanical energy conservation & spring generation');
}

// 3. Test Sóng cơ học (Sóng truyền & Sóng dừng)
{
  const lambda = 100;
  const f = 2;
  const A = 20;

  // Sóng chạy tại x = 0, t = 0
  const travelingWave = getTravelingWavePoint({ A, lambda, f, phi: 0, x: 0, t: 0 });
  assert.strictEqual(Math.round(travelingWave), 20, 'Traveling wave amplitude at (0,0) should be A');

  // Sóng dừng: Tại x = 0 (đầu cố định), u luôn bằng 0 mọi lúc t
  const standingNode1 = getStandingWavePoint({ A, lambda, f, x: 0, t: 0.1 });
  const standingNode2 = getStandingWavePoint({ A, lambda, f, x: 0, t: 0.4 });
  assert.strictEqual(Math.round(standingNode1), 0, 'Standing wave node at x=0 must have zero displacement');
  assert.strictEqual(Math.round(standingNode2), 0, 'Standing wave node at x=0 must remain zero at any t');

  // Nút sóng và bụng sóng
  const { nodes, antinodes } = getNodesAndAntinodes(200, 100);
  assert.ok(nodes.includes(0) && nodes.includes(50) && nodes.includes(100), 'Nodes at k * lambda/2');
  assert.ok(antinodes.includes(25) && antinodes.includes(75), 'Antinodes at (2k+1) * lambda/4');
  console.log('✅ Passed: Mechanical wave and standing wave nodes/antinodes');
}

// 4. Test Ném xiên đa hành tinh
{
  const v0 = 20; // m/s
  const angleDeg = 45; // 45 độ cho tầm xa cực đại
  const earth = PLANET_GRAVITY.find(p => p.id === 'earth');
  const moon = PLANET_GRAVITY.find(p => p.id === 'moon');

  const trajEarth = getProjectileTrajectory({ v0, angleDeg, y0: 0, g: earth.g });
  const trajMoon = getProjectileTrajectory({ v0, angleDeg, y0: 0, g: moon.g });

  // Trên Mặt Trăng g nhỏ hơn -> tầm ném xa xMax và độ cao hMax phải lớn hơn nhiều trên Trái Đất
  assert.ok(trajMoon.xMax > trajEarth.xMax * 5, 'Projectile on Moon should travel > 5x farther than Earth');
  assert.ok(trajMoon.hMax > trajEarth.hMax * 5, 'Projectile on Moon should reach > 5x higher than Earth');
  assert.ok(trajMoon.points.length > 20, 'Trajectory points generated accurately');
  console.log('✅ Passed: Multi-planet projectile kinematics');
}

console.log('\n=== ALL ADVANCED SIMULATION UNIT TESTS PASSED (4/4) ===\n');
