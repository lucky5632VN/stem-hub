function stripVietnamese(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const problemText = "Câu 4. Cho hình lăng trụ đứng ABC.A'B'C' có đáy ABC là tam giác vuông tại B, BC = a, mặt phẳng (A'BC) tạo với đáy một góc 30 độ và tam giác A'BC có diện tích bằng a^2\\sqrt{3}. Tính thể tích khối lăng trụ ABC.A'B'C'.";

// Test regex matching on problemText
const clean = problemText.toLowerCase();
const faceAngleMatch = clean.match(/(?:góc giữa|mặt phẳng nghiêng|mặt bên|tạo với|mặt phẳng).*?(\d+)(?:°| độ|deg)/i);
console.log('Angle match:', faceAngleMatch ? faceAngleMatch[1] : null);

// Test stripVietnamese
console.log('Strip "đáy":', stripVietnamese('đáy'));
console.log('Strip "mặt phẳng đáy":', stripVietnamese('mặt phẳng đáy'));
console.log('Strip "A\'BC":', stripVietnamese("A'BC"));

// Test math calculation:
const bc = 4;
const S = 16 * Math.sqrt(3); // 27.7128
const apB = (2 * S) / bc;
const h = apB * Math.sin(30 * Math.PI / 180);
const ab = apB * Math.cos(30 * Math.PI / 180);
const V = 0.5 * ab * bc * h;
console.log('Math result:');
console.log({ bc, S, apB, h, ab, V });
