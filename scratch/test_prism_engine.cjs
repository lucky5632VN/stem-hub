function testEngine() {
  const a = 4;
  const h = Number(((a * Math.sqrt(3)) / 4).toFixed(3)); // 1.732
  const viewH = Math.max(h, 4.0); // 4.0 for nice 3D view

  const A = [0, 0, 0];
  const B = [a, 0, 0];
  const C = [a / 2, Number(((a * Math.sqrt(3)) / 2).toFixed(4)), 0];

  const H = [a / 2, 0, 0]; // midpoint of AB
  const K = [a / 4, Number(((a * Math.sqrt(3)) / 4).toFixed(4)), 0]; // proj of H on AC

  const A_prime = [H[0], H[1], viewH];
  const shiftX = A_prime[0] - A[0];
  const shiftY = A_prime[1] - A[1];

  const B_prime = [B[0] + shiftX, B[1] + shiftY, viewH];
  const C_prime = [C[0] + shiftX, C[1] + shiftY, viewH];

  const vertices = [A, B, C, A_prime, B_prime, C_prime, H, K];
  const labels = ["A", "B", "C", "A'", "B'", "C'", "H", "K"];

  const faces = [
    [0, 2, 1],
    [3, 4, 5],
    [0, 1, 4, 3],
    [1, 2, 5, 4],
    [2, 0, 3, 5]
  ];

  const edges = [
    [0, 1], [1, 2], [2, 0],
    [3, 4], [4, 5], [5, 3],
    [0, 3], [1, 4], [2, 5]
  ];

  const aux_edges = [
    [3, 6], // A'H (đường cao)
    [6, 7], // HK (vuông góc AC)
    [3, 7]  // A'K (góc 45°)
  ];

  console.log("Vertices count:", vertices.length);
  console.log("Edges count:", edges.length);
  console.log("Aux edges count:", aux_edges.length);
  console.log("Calculations: V =", ((Math.sqrt(3) / 4) * a * a * h).toFixed(3));
}

testEngine();
