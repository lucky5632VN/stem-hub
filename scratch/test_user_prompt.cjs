const problem = "Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh a, cạnh bên SA vuông góc với mặt phẳng đáy, góc giữa đường thẳng SC và mặt phẳng (ABCD) bằng 45° và SC = 2a. Tính thể tích V của khối chóp S.ABCD.";

function extractFallbackGeometry(problemText) {
  const clean = (problemText || '').toLowerCase();
  let shapeType = 'hinh_chop_day_hcn';
  let shapeName = 'Hình chóp S.ABCD (SA ⊥ đáy)';
  let a = 4;
  let h = 5;

  const canhMatch = clean.match(/cạnh(?:\s*đáy)?\s*(?:bằng\s*)?(\d+(?:\.\d+)?)/i);
  if (canhMatch) a = parseFloat(canhMatch[1]) || 4;

  const hMatch = clean.match(/(?:chiều cao|đường cao|sa|sh)\s*(?:bằng\s*)?(\d+(?:\.\d+)?)/i);
  if (hMatch) h = parseFloat(hMatch[1]) || 5;

  if (clean.includes('45') && clean.includes('sc')) {
    h = Number((a * Math.SQRT2).toFixed(2));
  }

  if (clean.includes('sa vuông góc') || clean.includes('sa ⊥') || clean.includes('đáy là hình vuông') || clean.includes('đáy abcd') || clean.includes('s.abcd')) {
    if (clean.includes('tứ giác đều') || clean.includes('chóp đều s.abcd')) {
      shapeType = 'hinh_chop_tu_giac_deu';
      shapeName = 'Hình chóp tứ giác đều S.ABCD';
    } else {
      shapeType = 'hinh_chop_day_hcn';
      shapeName = 'Hình chóp S.ABCD (SA ⊥ đáy)';
    }
  } else if (clean.includes('tứ giác đều') || clean.includes('chóp đều s.abcd')) {
    shapeType = 'hinh_chop_tu_giac_deu';
    shapeName = 'Hình chóp tứ giác đều S.ABCD';
  } else if (clean.includes('tam giác đều') || clean.includes('tứ diện đều') || /\bs\.abc\b/i.test(clean)) {
    shapeType = 'hinh_chop_tam_giac_deu';
    shapeName = 'Hình chóp tam giác đều S.ABC';
  } else if (clean.includes('lập phương') || clean.includes('hộp chữ nhật')) {
    shapeType = 'hinh_hop_chu_nhat';
    shapeName = clean.includes('lập phương') ? "Hình lập phương ABCD.A'B'C'D'" : "Hình hộp chữ nhật ABCD.A'B'C'D'";
  } else if (clean.includes('lăng trụ')) {
    shapeType = 'hinh_lang_tru_tam_giac_deu';
    shapeName = "Hình lăng trụ đứng ABC.A'B'C'";
  } else if (clean.includes('nón')) {
    shapeType = 'hinh_non';
    shapeName = 'Hình nón tròn xoay';
  } else if (clean.includes('trụ')) {
    shapeType = 'hinh_tru';
    shapeName = 'Hình trụ tròn xoay';
  } else if (clean.includes('cầu')) {
    shapeType = 'hinh_cau';
    shapeName = 'Hình cầu';
  } else {
    shapeType = 'hinh_chop_day_hcn';
    shapeName = 'Hình chóp S.ABCD (SA ⊥ đáy)';
  }


  return {
    shapeType,
    shapeName,
    parameters: {
      canhDay: a,
      chieuDai: a,
      chieuRong: a,
      chieuCao: h,
      banKinh: a / 2
    },
    auxiliaryRequests: [],
    donVi: 'cm',
    originalProblemText: problemText
  };
}

console.log(extractFallbackGeometry(problem));
