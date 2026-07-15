import { EXAM_DATABASE } from '@/data/exams';

// === DỮ LIỆU BÀI TẬP SINH HỌC ARENA ===
export const BIO_BANKS = {
  punnett: {
    label: 'Di truyền Mendel', icon: '🧬',
    questions: [
      { text: 'Quy luật phân ly độc lập của Mendel áp dụng khi?', choices: ['Các gen nằm trên NST khác nhau','Các gen liên kết cùng NST','Chỉ khi gen trội trội hoàn toàn','Gen trên NST giới tính'], correct: 0, note: 'Mendelian independent assortment: các gen nằm trên cặp NST tương đồng khác nhau' },
      { text: 'Ở đời F2 của phép lai đơn tính Aa × Aa, kiểu hình lặn chiếm tỉ lệ?', choices: ['1/4','1/2','3/4','0'], correct: 0, note: 'F2: 1AA:2Aa:1aa → aa = 1/4 = 25%' },
      { text: 'Điều kiện để quy luật Mendel nghiệm đúng là?', choices: ['Quần thể đủ lớn, gen trội trội hoàn toàn','Quần thể nhỏ','Gen liên kết','Đột biến cao'], correct: 0, note: 'Mendel nghiệm đúng: quần thể lớn, gen phân ly độc lập, trội hoàn toàn' }
    ]
  },
  celldiv: {
    label: 'Phân bào (Nguyên phân & Giảm phân)', icon: '🔬',
    questions: [
      { text: 'Trong nguyên phân, NST kép xếp hàng ở mặt phẳng xích đạo vào kỳ nào?', choices: ['Kỳ giữa','Kỳ đầu','Kỳ sau','Kỳ cuối'], correct: 0, note: 'Kỳ giữa (Metaphase): NST kép co ngắn cực đại, xếp một hàng ở mặt phẳng xích đạo' },
      { text: 'Tâm động NST bị tách đôi trong nguyên phân xảy ra ở kỳ nào?', choices: ['Kỳ sau','Kỳ giữa','Kỳ đầu','Kỳ cuối'], correct: 0, note: 'Kỳ sau (Anaphase): tâm động tách đôi, các NST đơn di chuyển về 2 cực' },
      { text: 'Thứ tự đúng các kỳ của nguyên phân là?', choices: ['Kỳ đầu→Kỳ giữa→Kỳ sau→Kỳ cuối','Kỳ giữa→Kỳ đầu→Kỳ sau→Kỳ cuối','Kỳ đầu→Kỳ sau→Kỳ giữa→Kỳ cuối','Kỳ đầu→Kỳ cuối→Kỳ giữa→Kỳ sau'], correct: 0, note: 'Prophase→Metaphase→Anaphase→Telophase (PMAT)' },
      { text: 'Người (2n=46), sau nguyên phân, tế bào con có bao nhiêu NST?', choices: ['46 NST (2n)','23 NST (n)','92 NST (4n)','48 NST'], correct: 0, note: 'Nguyên phân giữ nguyên bộ NST: 2n → 2n = 46' },
      { text: 'Điểm khác biệt chính của giảm phân so với nguyên phân là?', choices: ['Tạo tế bào đơn bội (n), có 2 lần phân chia','Xảy ra ở tế bào sinh dưỡng','Chỉ có 1 lần phân chia','Không có kỳ trung gian'], correct: 0, note: 'Giảm phân: 2 lần phân chia → 4 tế bào n (giao tử)' },
      { text: 'Ý nghĩa sinh học của nguyên phân là?', choices: ['Tăng sinh tế bào, tái sinh mô, sinh sản vô tính','Tạo đa dạng di truyền','Giảm bộ NST một nửa','Tạo giao tử để thụ tinh'], correct: 0, note: 'Nguyên phân duy trì bộ NST ổn định qua các thế hệ tế bào' },
      { text: 'Trong kỳ đầu của nguyên phân, hiện tượng nào KHÔNG xảy ra?', choices: ['NST xếp hàng ở mặt phẳng xích đạo','NST bắt đầu co xoắn','Thoi phân bào hình thành','Màng nhân tan biến'], correct: 0, note: 'NST xếp hàng ở xích đạo là đặc điểm của Kỳ giữa' },
      { text: 'Giảm phân tạo ra bao nhiêu tế bào con từ 1 tế bào ban đầu?', choices: ['4 tế bào (n)','2 tế bào (2n)','4 tế bào (2n)','2 tế bào (n)'], correct: 0, note: 'Giảm phân I + II → 4 tế bào con đơn bội (n)' }
    ]
  },
  organelle: {
    label: 'Bào quan tế bào', icon: '🦠',
    questions: [
      { text: '"Nhà máy điện" sản xuất ATP chủ yếu trong tế bào là bào quan nào?', choices: ['Ty thể (Mitochondria)','Lục lạp','Ribosome','Nhân tế bào'], correct: 0, note: 'Ty thể thực hiện hô hấp hiếu khí, tạo 36-38 ATP/molecule glucose' },
      { text: 'Bào quan tổng hợp protein là?', choices: ['Ribosome','Bộ máy Golgi','Lysosome','Không bào'], correct: 0, note: 'Ribosome là nơi dịch mã (translation) mRNA → chuỗi polypeptide' },
      { text: 'Bào quan thực hiện quang hợp ở tế bào thực vật là?', choices: ['Lục lạp (Chloroplast)','Ty thể','Ribosome','Màng tế bào'], correct: 0, note: 'Lục lạp chứa diệp lục hấp thụ ánh sáng → quang hợp' },
      { text: 'Chức năng của bộ máy Golgi là?', choices: ['Đóng gói và vận chuyển protein','Tổng hợp protein','Sản xuất ATP','Phân giải chất thải'], correct: 0, note: 'Golgi nhận protein từ lưới nội chất, chỉnh sửa, đóng gói, vận chuyển đến đích' },
      { text: 'Lysosome có chức năng?', choices: ['Tiêu hóa nội bào, phân giải vật chất','Tổng hợp lipid','Quang hợp','Sản xuất ATP'], correct: 0, note: 'Lysosome chứa enzyme tiêu hóa - phân giải bào quan hỏng, vi khuẩn, chất thải' },
      { text: 'Cấu trúc kiểm soát vật chất ra vào tế bào là?', choices: ['Màng sinh chất','Thành tế bào','Nhân tế bào','Ribosome'], correct: 0, note: 'Màng sinh chất có tính thấm chọn lọc - điều tiết vật chất ra vào tế bào' },
      { text: 'Nhân tế bào có chức năng chủ yếu là?', choices: ['Mang thông tin DT, điều khiển hoạt động TB','Tổng hợp protein','Sản xuất năng lượng','Bảo vệ tế bào'], correct: 0, note: 'Nhân chứa DNA mang thông tin di truyền, điều khiển mọi hoạt động sống' },
      { text: 'Lưới nội chất hạt (rough ER) có đặc điểm nổi bật là?', choices: ['Gắn ribosome, tổng hợp protein tiết','Không có ribosome, tổng hợp lipid','Tạo ATP','Phân giải glucose'], correct: 0, note: 'Rough ER gắn ribosome → tổng hợp protein tiết ra ngoài hoặc gắn màng' }
    ]
  },
  photosynthesis: {
    label: 'Quang hợp & Hô hấp tế bào', icon: '🌿',
    questions: [
      { text: 'Phương trình tổng quát của quang hợp là?', choices: ['6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂','C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O','CO₂ + H₂O → CH₂O + O₂','6H₂O → 6O₂ + 12H'], correct: 0, note: '6CO₂ + 6H₂O + ánh sáng → C₆H₁₂O₆ + 6O₂' },
      { text: 'Pha sáng của quang hợp diễn ra ở đâu?', choices: ['Màng thylakoid','Chất nền lục lạp (stroma)','Tế bào chất','Màng ty thể'], correct: 0, note: 'Pha sáng: màng thylakoid nơi có diệp lục hấp thụ ánh sáng' },
      { text: 'Pha tối (chu trình Calvin) diễn ra ở đâu?', choices: ['Chất nền lục lạp (stroma)','Màng thylakoid','Tế bào chất','Nhân tế bào'], correct: 0, note: 'Chu trình Calvin diễn ra trong chất nền lục lạp, không cần ánh sáng trực tiếp' },
      { text: 'Sản phẩm của pha sáng cung cấp cho pha tối là?', choices: ['ATP và NADPH','Glucose và O₂','CO₂ và H₂O','RuBP và G3P'], correct: 0, note: 'Pha sáng tạo ATP (năng lượng) và NADPH (chất khử) cho chu trình Calvin' },
      { text: 'Đường phân (Glycolysis) diễn ra ở đâu trong tế bào?', choices: ['Tế bào chất','Chất nền ty thể','Màng trong ty thể','Nhân tế bào'], correct: 0, note: 'Glycolysis xảy ra trong tế bào chất: glucose → 2 pyruvate + 2 ATP (thực) + 2 NADH' },
      { text: 'Chu trình Krebs diễn ra ở đâu?', choices: ['Chất nền ty thể','Tế bào chất','Màng thylakoid','Màng trong ty thể'], correct: 0, note: 'Chu trình Krebs (Citric acid cycle) diễn ra trong chất nền ty thể' },
      { text: '1 phân tử glucose hô hấp hiếu khí tạo bao nhiêu ATP?', choices: ['36-38 ATP','2 ATP','18 ATP','100 ATP'], correct: 0, note: 'Hô hấp hiếu khí: Glycolysis(2) + Krebs(2) + Chuỗi chuyền e(32-34) ≈ 36-38 ATP' },
      { text: 'Sản phẩm cuối cùng của hô hấp hiếu khí là?', choices: ['CO₂, H₂O và ATP','Glucose và O₂','Lactate và ATP','Ethanol và CO₂'], correct: 0, note: 'Hô hấp hiếu khí: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP' }
    ]
  }
};

// === DANH SÁCH NHIỆM VỤ HÓA HỌC ===
export const CHEMISTRY_MISSIONS = [
  {
    id: 'mission_01_cl2_synthesis',
    name: 'Điều chế khí Clo (Cl₂)',
    equation: 'MnO₂ + 4HCl → MnCl₂ + Cl₂↑ + 2H₂O',
    hazard: 'Độc hại cao (Cần Tủ hút + Kính + Găng tay)',
    instructions: 'Kéo một Cốc thủy tinh hoặc Bình tam giác vào bàn làm việc. Lắp đặt Tủ hút khí độc và mặc đầy đủ bảo hộ (Kính, Găng tay, Áo blouse). Sau đó lấy hóa chất HCl đặc và bột MnO₂ đổ vào dụng cụ, đun nóng nhẹ trên đèn Bunsen để giải phóng khí Clo (màu vàng lục).',
    isMatch: (reaction) => {
      const eq = (reaction.equation || '').toLowerCase();
      const reactants = reaction.reactants || [];
      return (
        eq.includes('cl2') || 
        eq.includes('clo') || 
        (reactants.includes('mno2') && reactants.includes('hcl')) || 
        (reactants.includes('mno2_powder') && reactants.includes('hcl_conc'))
      );
    }
  },
  {
    id: 'mission_02_nacl_neutralization',
    name: 'Chuẩn độ trung hòa muối ăn (NaCl)',
    equation: 'HCl + NaOH → NaCl + H₂O',
    hazard: 'Ăn mòn mạnh (Cần Kính + Găng tay)',
    instructions: 'Kéo một Cốc thủy tinh vào bàn làm việc. Mặc đầy đủ Kính bảo hộ và Găng tay chống axit/kiềm. Lấy dung dịch Axit Clohydric (HCl) và dung dịch Kiềm Natri Hydroxit (NaOH) đổ vào cốc theo tỉ lệ thể tích cân bằng để thực hiện phản ứng trung hòa tạo muối NaCl và nước.',
    isMatch: (reaction) => {
      const eq = (reaction.equation || '').toLowerCase();
      const reactants = reaction.reactants || [];
      return (
        eq.includes('nacl') || 
        (reactants.includes('hcl') && reactants.includes('naoh')) || 
        (reactants.includes('hcl_dil') && reactants.includes('naoh_dil'))
      );
    }
  },
  {
    id: 'mission_03_esterification',
    name: 'Phản ứng Este hóa (Ethyl Axetat)',
    equation: 'CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O',
    hazard: 'Dễ cháy, acid đặc ăn mòn (Cần Kính + Găng tay)',
    instructions: 'Kéo Cốc thủy tinh vào bàn. Đổ dung dịch Axit Axetic (CH₃COOH) và Rượu Etylic (C₂H₅OH) vào. Thêm vài giọt Axit Sunfuric đặc (H₂SO₄ đặc) làm xúc tác rồi bật đèn cồn Bunsen đun nóng để tạo thành Ethyl Axetat có mùi thơm quả chín ngọt ngào nổi lên trên.',
    isMatch: (reaction) => {
      const eq = (reaction.equation || '').toLowerCase();
      const reactants = reaction.reactants || [];
      return (
        eq.includes('ester') || 
        eq.includes('ethyl_acetate') || 
        eq.includes('este') ||
        (reactants.includes('ch3cooh') && reactants.includes('ethanol')) ||
        (reactants.includes('ch3cooh_glacial') && reactants.includes('c2h5oh'))
      );
    }
  },
  {
    id: 'mission_04_thermite_reaction',
    name: 'Phản ứng Nhiệt nhôm (Thermite)',
    equation: 'Fe₂O₃ + 2Al → 2Fe + Al₂O₃',
    hazard: 'Tỏa nhiệt cực kỳ mãnh liệt (Cần Kính + Găng tay)',
    instructions: 'Cho bột Sắt(III) Oxit (Fe₂O₃) và bột Nhôm (Al) vào cốc thủy tinh đặt trên giá đỡ. Bật đèn cồn Bunsen dưới cốc đun nóng mạnh để khơi mào phản ứng nhiệt nhôm tỏa nhiệt cực độ (>2000°C), giải phóng sắt nóng chảy lỏng sáng chói.',
    isMatch: (reaction) => {
      const eq = (reaction.equation || '').toLowerCase();
      const reactants = reaction.reactants || [];
      return (
        eq.includes('thermite') || 
        eq.includes('nhiệt nhôm') ||
        eq.includes('fe2o3 + 2al') || 
        (reactants.includes('fe2o3') && reactants.includes('al'))
      );
    }
  },
  {
    id: 'mission_05_na_combustion',
    name: 'Đốt cháy kim loại Natri (Na)',
    equation: '4Na + O₂ → 2Na₂O',
    hazard: 'Cháy nổ cực kỳ mãnh liệt (Cần Kính + Găng tay)',
    instructions: 'Thả một mẩu Natri kim loại (Na) vào cốc thủy tinh đặt trên giá đỡ. Bật đèn cồn Bunsen dưới cốc hoặc cho tiếp xúc với Oxy (O₂) để kích hoạt phản ứng cháy tỏa nhiệt mãnh liệt tạo ra Natri Oxit màu trắng.',
    isMatch: (reaction) => {
      const eq = (reaction.equation || '').toLowerCase();
      const reactants = reaction.reactants || [];
      return (
        eq.includes('na2o') || 
        eq.includes('na oxit') ||
        (reactants.includes('na_metal') && (reactants.includes('o2') || reactants.includes('o2_gas') || eq.includes('o2') || eq.includes('cháy')))
      );
    }
  },
  {
    id: 'mission_06_copper_complex',
    name: 'Hòa tan kết tủa tạo phức Đồng Amoniac',
    equation: 'Cu(OH)₂ + 4NH₃ → [Cu(NH₃)₄]²⁺ + 2OH⁻',
    hazard: 'Mùi khai NH₃ bay hơi độc hại (Cần Tủ hút + Kính + Găng tay)',
    instructions: 'Đổ dung dịch CuSO₄ and NaOH vào cốc để tạo kết tủa Cu(OH)₂ xanh lam. Bật tủ hút khí độc, sau đó nhỏ dung dịch Amoniac (NH₃) vào cốc. Quan sát kết tủa xanh lam tan biến, dung dịch chuyển sang màu xanh thẫm cực kỳ lộng lẫy.',
    isMatch: (reaction) => {
      const eq = (reaction.equation || '').toLowerCase();
      const reactants = reaction.reactants || [];
      return (
        eq.includes('[cu(nh3)4]') || 
        eq.includes('cu_oh_2+nh3') || 
        eq.includes('cuso4+nh3') ||
        (reactants.includes('cuso4') && reactants.includes('nh3')) ||
        (reactants.includes('cu_oh_2') && reactants.includes('nh3'))
      );
    }
  },
  {
    id: 'mission_07_fe_cl2_combustion',
    name: 'Đốt cháy Sắt trong khí Clo',
    equation: '2Fe + 3Cl₂ → 2FeCl₃',
    hazard: 'Khí Clo độc hại cao (Cần Tủ hút + Kính + Găng tay)',
    instructions: 'Lắp đặt Tủ hút khí độc. Cho bột Sắt (Fe) vào cốc chứa đầy khí Clo (Cl₂). Dùng đèn Bunsen nung nóng đỏ để sắt phản ứng mãnh liệt với clo, giải phóng những đám khói màu nâu đỏ đặc trưng của Sắt(III) Clorua.',
    isMatch: (reaction) => {
      const eq = (reaction.equation || '').toLowerCase();
      const reactants = reaction.reactants || [];
      return (
        eq.includes('fecl3') || 
        eq.includes('fe + cl2') ||
        (reactants.includes('fe') && reactants.includes('cl2_gas'))
      );
    }
  },
  {
    id: 'mission_08_biuret_test',
    name: 'Nhận biết Protein (Phản ứng Biuret)',
    equation: 'Protein + Cu(OH)₂ → Phức chất màu tím',
    hazard: 'Ăn mòn da nhẹ (Cần Kính + Găng tay)',
    instructions: 'Đổ dung dịch lòng trắng trứng (Albumin) vào cốc. Thêm dung dịch CuSO₄ và NaOH vào cốc để tạo môi trường kiềm chứa Cu(OH)₂. Quan sát phản ứng tạo phức chất Biuret màu tím violet lãng mạn.',
    isMatch: (reaction) => {
      const eq = (reaction.equation || '').toLowerCase();
      const reactants = reaction.reactants || [];
      return (
        eq.includes('biuret') || 
        eq.includes('albumin') ||
        (reactants.includes('albumin') && reactants.includes('cuso4') && reactants.includes('naoh'))
      );
    }
  },
  {
    id: 'mission_09_iodine_starch',
    name: 'Nhận biết Tinh bột bằng Iot',
    equation: 'Tinh bột + I₂ → Phức màu xanh tím',
    hazard: 'An toàn (Cần Kính)',
    instructions: 'Cho dung dịch tinh bột (Starch) vào cốc. Nhỏ vài giọt dung dịch Iot (Iodine) vào. Dung dịch sẽ ngay lập tức chuyển sang màu xanh tím đậm đặc trưng của phức chất tinh bột-iot.',
    isMatch: (reaction) => {
      const eq = (reaction.equation || '').toLowerCase();
      const reactants = reaction.reactants || [];
      return (
        eq.includes('complex-blue-black') || 
        eq.includes('starch') ||
        (reactants.includes('starch') && reactants.includes('iodine'))
      );
    }
  },
  {
    id: 'mission_10_h2_explosion',
    name: 'Phản ứng nổ của khí Hydro (H₂)',
    equation: '2H₂ + O₂ → 2H₂O',
    hazard: 'Nguy cơ nổ mạnh (Cần Kính + Găng tay)',
    instructions: 'Cho khí Hydro (H₂_gas) and khí Oxy (O₂_gas) vào cốc. Dùng đèn cồn Bunsen châm lửa đun nóng để kích hoạt phản ứng cháy cực nhanh tỏa nhiệt mạnh, tạo ra tiếng nổ "pop" giòn tan đặc trưng của hydro.',
    isMatch: (reaction) => {
      const eq = (reaction.equation || '').toLowerCase();
      const reactants = reaction.reactants || [];
      return (
        eq.includes('h2_combustion') || 
        eq.includes('explosion-pop') ||
        (reactants.includes('h2_gas') && reactants.includes('o2_gas'))
      );
    }
  }
];

// --- HÀM TRỘN ---
export const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// --- TOÁN HỌC POOL ---
export const getMathQuestionPool = () => {
  const pool = [];
  const operators = ['+', '-', '*', 'combo'];
  for (let i = 0; i < 60; i++) {
    const seed = i;
    const op = operators[seed % operators.length];
    let eq = '';
    let ans = { x: 0, y: 0 };
    
    const x1 = ((seed * 3) % 7) - 3;
    const y1 = ((seed * 5) % 7) - 3;
    const x2 = ((seed * 7) % 7) - 3;
    const y2 = ((seed * 11) % 7) - 3;
    
    if (op === '+') {
      eq = `A(${x1}, ${y1}) + B(${x2}, ${y2}) = P(x, y)`;
      ans = { x: x1 + x2, y: y1 + y2 };
    } else if (op === '-') {
      eq = `u(${x1}, ${y1}) - v(${x2}, ${y2}) = P(x, y)`;
      ans = { x: x1 - x2, y: y1 - y2 };
    } else if (op === '*') {
      const k = (seed % 2) + 2;
      eq = `${k} * w(${x1}, ${y1}) = P(x, y)`;
      ans = { x: k * x1, y: k * y1 };
    } else {
      eq = `2*A(${x1}, ${y1}) + B(${x2}, ${y2}) = P(x, y)`;
      ans = { x: 2 * x1 + x2, y: 2 * y1 + y2 };
    }
    pool.push({ eq, ans, coord: ans });
  }
  return pool;
};

// === VẬT LÝ POOL ===
export const getPhysicsTargetPool = () => {
  // Chỉ trả về các tổ hợp góc gương thực sự hợp lệ theo vật lý (laser trúng mục tiêu).
  // Các tổ hợp này được xác định bởi server-side physicsEngine.js.
  // Lưu ý: với layout gương hiện tại (A tại (45,50), B tại (175,50), C tại (175,140)),
  // chỉ có một đường phản xạ hợp lệ: A=45°, B=90°, C=135°.
  return [
    [45, 90, 135]
  ];
};


// === HÀM SINH CÂU HỎI THEO BỘ LỌC (LỚN HƠN) CHO MULTIPLAYER ===

export const generateBioPool = (seenHistory = [], count = 30) => {
  const pool = [];
  Object.values(BIO_BANKS).forEach(bank => {
    bank.questions.forEach(q => {
      pool.push({
        text: q.text,
        choices: q.choices,
        correct: q.correct,
        note: q.note || ''
      });
    });
  });

  try {
    if (typeof EXAM_DATABASE !== 'undefined' && Array.isArray(EXAM_DATABASE)) {
      EXAM_DATABASE.forEach(exam => {
        if (exam.subject === 'biology' && Array.isArray(exam.questions)) {
          exam.questions.forEach(q => {
            if (q.type === 'mcq' && Array.isArray(q.options) && q.options.length >= 2) {
              pool.push({
                text: q.text,
                choices: q.options,
                correct: q.correctAnswer,
                note: q.explanation || ''
              });
            }
          });
        }
      });
    }
  } catch (e) {
    console.warn("Lỗi tải câu hỏi Sinh học từ EXAM_DATABASE:", e);
  }

  let available = pool.filter(q => !seenHistory.includes(q.text));
  if (available.length < count) {
    available = pool;
  }
  return shuffleArray(available).slice(0, count);
};

export const generateMathPool = (seenHistory = [], count = 20) => {
  const pool = getMathQuestionPool();
  let available = pool.filter(q => !seenHistory.includes(q.eq));
  if (available.length < count) {
    available = pool;
  }
  return shuffleArray(available).slice(0, count);
};

export const generatePhysicsPool = (seenHistory = [], count = 10) => {
  const pool = getPhysicsTargetPool();
  let available = pool.filter(t => !seenHistory.includes(t.join('-')));
  if (available.length < count) {
    available = pool;
  }
  return shuffleArray(available).slice(0, count);
};

export const generateChemistryPool = (seenHistory = [], count = 5) => {
  let available = CHEMISTRY_MISSIONS.filter(m => !seenHistory.includes(m.id));
  if (available.length < count) {
    available = CHEMISTRY_MISSIONS;
  }
  return shuffleArray(available).slice(0, count);
};
