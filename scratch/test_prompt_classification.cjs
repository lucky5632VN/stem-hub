function normalizeShapeType(rawType, text = '', shapeName = '') {
  const s = `${rawType || ''} ${text || ''} ${shapeName || ''}`.toLowerCase();

  // 1. Hình lăng trụ
  if (s.includes('lăng trụ') || s.includes('lang_tru') || s.includes('prism') || s.includes("a'b'c'") || s.includes("a'b'c'd'")) {
    if (s.includes('tứ giác') || s.includes('abcd.a\'b\'c\'d\'')) {
      return 'hinh_hop_chu_nhat';
    }
    return 'hinh_lang_tru_tam_giac_deu';
  }

  // 2. Hình chóp tứ giác đều
  if (s.includes('chóp tứ giác đều') || s.includes('chóp đều s.abcd') || (s.includes('tứ giác đều') && !s.includes('tam giác'))) {
    return 'hinh_chop_tu_giac_deu';
  }

  // 3. Hình chóp có SA vuông góc đáy / cạnh bên vuông góc đáy / đáy hình chữ nhật / vuông
  if (
    s.includes('hinh_chop_day_hcn') ||
    ((s.includes('chóp') || s.includes('s.abcd')) &&
     (s.includes('vuông góc') || s.includes('⊥') || s.includes('đáy là hình vuông') || s.includes('đáy là hình chữ nhật') || s.includes('đáy hình vuông') || s.includes('đáy hình chữ nhật')))
  ) {
    return 'hinh_chop_day_hcn';
  }

  // 4. Hình chóp tam giác đều / Tứ diện đều
  if (s.includes('tứ diện đều') || s.includes('chóp tam giác đều') || s.includes('chop_tam_giac_deu')) {
    return 'hinh_chop_tam_giac_deu';
  }

  // 5. Hình chóp nói chung có đáy tam giác (S.ABC)
  if (s.includes('s.abc') || (s.includes('chóp') && s.includes('tam giác'))) {
    if (s.includes('sa vuông góc') || s.includes('sa ⊥') || s.includes('vuông góc')) {
      return 'hinh_chop_day_hcn';
    }
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

const p1 = "Cho hình lăng trụ ABC.A'B'C' có đáy ABC là tam giác đều cạnh bằng a. Hình chiếu vuông góc của A' trên (ABC) là trung điểm của AB. Mặt phẳng (AA'C'C) tạo với đáy một góc bằng 45°.";
console.log("P1 normalized shapeType:", normalizeShapeType("Hình lăng trụ", p1));

const p2 = "Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh a, cạnh bên SA vuông góc với mặt phẳng đáy, góc giữa đường thẳng SC và mặt phẳng (ABCD) bằng 45° và SC = 2a. Tính thể tích V của khối chóp S.ABCD.";
console.log("P2 normalized shapeType:", normalizeShapeType("hinh_chop_day_hcn", p2));

const p3 = "Cho hình chóp tam giác đều S.ABC có cạnh đáy bằng a và chiều cao bằng 2a.";
console.log("P3 normalized shapeType:", normalizeShapeType("Chóp tam giác đều", p3));
