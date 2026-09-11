import { EXAM_DATABASE } from '@/data/exams';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const fetchFirestoreQuestions = async (subject) => {
  try {
    const qRef = collection(db, 'questions');
    const q = query(qRef, where('subject', '==', subject), where('status', '==', 'public'));
    const snap = await getDocs(q);
    const result = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      if (data && data.text) {
        if (data.type === 'tf') {
          const choices = data.statements || data.choices || [];
          result.push({
            type: 'tf',
            text: data.text,
            choices: Array.isArray(choices) ? choices : [],
            correct: Array.isArray(data.correct) ? data.correct : [true, true, true, true],
            note: data.explanation || ''
          });
        } else if (data.type === 'sa') {
          result.push({
            type: 'sa',
            text: data.text,
            choices: [data.correctAnswer || data.choices?.[0] || ''],
            correct: 0,
            correctAnswer: data.correctAnswer || '',
            note: data.explanation || ''
          });
        } else if (Array.isArray(data.choices) && data.choices.length >= 2) {
          result.push({
            type: 'mcq',
            text: data.text,
            choices: data.choices,
            correct: data.correct !== undefined ? Number(data.correct) : 0,
            note: data.explanation || ''
          });
        }
      }
    });
    return result;
  } catch (e) {
    console.warn(`[Firestore Question Bank] Chưa kết nối được câu hỏi môn ${subject}, dùng fallback:`, e);
    return [];
  }
};

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

// === FALLBACK DATA FOR STEM ARENA ===
export const FALLBACK_PHYSICS_MCQS = [
  {
    type: 'mcq',
    text: 'Một vật dao động điều hòa với phương trình $x = A\\cos(\\omega t + \\varphi)$. Đại lượng $\\omega$ được gọi là:',
    choices: ['Tần số góc của dao động', 'Chu kỳ của dao động', 'Pha ban đầu của dao động', 'Li độ của dao động'],
    correct: 0,
    note: 'Trong phương trình dao động điều hòa, omega là tần số góc.'
  },
  {
    type: 'mcq',
    text: 'Cơ năng của một con lắc lò xo dao động điều hòa tỉ lệ thuận với:',
    choices: ['Li độ dao động', 'Tần số dao động', 'Bình phương biên độ dao động', 'Biên độ dao động'],
    correct: 2,
    note: 'Cơ năng W = 0.5 * k * A^2, do đó tỉ lệ thuận với bình phương biên độ.'
  },
  {
    type: 'mcq',
    text: 'Hiện tượng cộng hưởng xảy ra khi:',
    choices: ['Tần số của lực cưỡng bức bằng tần số dao động riêng', 'Chu kỳ lực cưỡng bức lớn hơn chu kỳ riêng', 'Biên độ của lực cưỡng bức bằng biên độ riêng', 'Tần số lực cưỡng bức rất lớn'],
    correct: 0,
    note: 'Cộng hưởng xảy ra khi tần số lực cưỡng bức bằng tần số dao động riêng của hệ.'
  },
  {
    type: 'mcq',
    text: 'Một sóng cơ truyền trong một môi trường với tốc độ $v$ và tần số $f$. Bước sóng $\\lambda$ được tính bằng:',
    choices: ['$\\lambda = v.f$', '$\\lambda = v/f$', '$\\lambda = f/v$', '$\\lambda = 2\\pi v/f$'],
    correct: 1,
    note: 'Công thức bước sóng: lambda = v / f.'
  },
  {
    type: 'mcq',
    text: 'Cường độ âm chuẩn là $I_0 = 10^{-12} \\, \\text{W/m}^2$. Tại một điểm có cường độ âm $I = 10^{-10} \\, \\text{W/m}^2$, mức cường độ âm tại đó là:',
    choices: ['2 dB', '10 dB', '20 dB', '100 dB'],
    correct: 2,
    note: 'L = 10 log(I / I0) = 10 log(10^-10 / 10^-12) = 20 dB.'
  },
  {
    type: 'mcq',
    text: 'Trong sơ đồ khối của một máy phát thanh vô tuyến đơn giản, không có bộ phận nào sau đây?',
    choices: ['Mạch biến điệu', 'Mạch khuếch đại', 'Mạch tách sóng', 'Mạch phát sóng'],
    correct: 2,
    note: 'Máy phát thanh không có mạch tách sóng (mạch tách sóng ở máy thu thanh).'
  },
  {
    type: 'mcq',
    text: 'Chiết suất của nước đối với ánh sáng đơn sắc màu lam, đỏ, lục, tím tăng dần theo thứ tự:',
    choices: ['Đỏ, lục, lam, tím', 'Tím, lam, lục, đỏ', 'Đỏ, lam, lục, tím', 'Lục, đỏ, lam, tím'],
    correct: 0,
    note: 'Chiết suất tăng dần từ đỏ đến tím: n_đỏ < n_lục < n_lam < n_tím.'
  },
  {
    type: 'mcq',
    text: 'Tia hồng ngoại có tần số như thế nào so với ánh sáng nhìn thấy?',
    choices: ['Nhỏ hơn tần số của ánh sáng đỏ', 'Lớn hơn tần số của ánh sáng tím', 'Lớn hơn tần số ánh sáng đỏ', 'Nhỏ hơn tần số ánh sáng tím'],
    correct: 0,
    note: 'Tia hồng ngoại có bước sóng lớn hơn ánh sáng đỏ nên tần số nhỏ hơn ánh sáng đỏ.'
  },
  {
    type: 'mcq',
    text: 'Giới hạn quang điện của một kim loại là $\\lambda_0 = 0.30 \\, \\mu\\text{m}$. Công thoát của electron khỏi kim loại này là (lấy $h = 6.625 \\cdot 10^{-34} \\, \\text{J.s}, c = 3 \\cdot 10^8 \\, \\text{m/s}$):',
    choices: ['$\\approx 6.625 \\cdot 10^{-19} \\, \\text{J}$', '$\\approx 4.14 \\, \\text{eV}$', '$\\approx 6.625 \\cdot 10^{-20} \\, \\text{J}$', '$\\approx 1.24 \\, \\text{eV}$'],
    correct: 1,
    note: 'A = hc / lambda_0 = 6.625e-34 * 3e8 / 0.3e-6 = 6.625e-19 J ≈ 4.14 eV.'
  },
  {
    type: 'mcq',
    text: 'Theo thuyết lượng tử ánh sáng, phát biểu nào sau đây sai?',
    choices: ['Năng lượng của mọi photon đều bằng nhau', 'Photon chỉ tồn tại ở trạng thái chuyển động', 'Trong chân không, photon bay với tốc độ c = 3.10^8 m/s', 'Ánh sáng được tạo thành bởi các hạt gọi là photon'],
    correct: 0,
    note: 'Năng lượng photon E = hf phụ thuộc vào tần số của ánh sáng đơn sắc, nên không phải mọi photon đều bằng nhau.'
  }
];

export const FALLBACK_MATH_MCQS = [
  {
    type: 'mcq',
    text: 'Tìm đạo hàm của hàm số $y = \\ln(x^2 + 1)$.',
    choices: [
      '$y\' = \\frac{2x}{x^2 + 1}$',
      '$y\' = \\frac{1}{x^2 + 1}$',
      '$y\' = \\frac{x}{x^2 + 1}$',
      '$y\' = 2x(x^2 + 1)$'
    ],
    correct: 0,
    note: 'Ta có (ln(u))\' = u\'/u = 2x/(x^2 + 1).'
  },
  {
    type: 'mcq',
    text: 'Cho hàm số $y = x^3 - 3x^2 + 2$. Điểm cực đại của đồ thị hàm số là:',
    choices: [
      '$(0; 2)$',
      '$(2; -2)$',
      '$(1; 0)$',
      '$(0; 0)$'
    ],
    correct: 0,
    note: 'Đạo hàm y\' = 3x^2 - 6x = 0 => x = 0 (cực đại, y = 2) hoặc x = 2 (cực tiểu, y = -2).'
  },
  {
    type: 'mcq',
    text: 'Tính tích phân $I = \\int_0^1 e^x \\, dx$.',
    choices: [
      '$e - 1$',
      '$e$',
      '$1$',
      '$e + 1$'
    ],
    correct: 0,
    note: 'I = [e^x] từ 0 đến 1 = e^1 - e^0 = e - 1.'
  },
  {
    type: 'mcq',
    text: 'Trong không gian Oxyz, cho mặt phẳng $(P): 2x - y + 3z - 4 = 0$. Một vectơ pháp tuyến của $(P)$ là:',
    choices: [
      '$\\vec{n} = (2; -1; 3)$',
      '$\\vec{n} = (2; 1; 3)$',
      '$\\vec{n} = (2; -1; -4)$',
      '$\\vec{n} = (2; 1; -4)$'
    ],
    correct: 0,
    note: 'Vectơ pháp tuyến của mặt phẳng Ax + By + Cz + D = 0 là n = (A; B; C) = (2; -1; 3).'
  },
  {
    type: 'mcq',
    text: 'Tìm tiệm cận ngang của đồ thị hàm số $y = \\frac{2x - 1}{x + 3}$.',
    choices: [
      '$y = 2$',
      '$y = -3$',
      '$x = -3$',
      '$y = -\\frac{1}{3}$'
    ],
    correct: 0,
    note: 'Tiệm cận ngang của đồ thị hàm số y = (ax+b)/(cx+d) là y = a/c = 2.'
  },
  {
    type: 'mcq',
    text: 'Tìm nguyên hàm của hàm số $f(x) = \\cos x + x$.',
    choices: [
      '$F(x) = \\sin x + \\frac{1}{2}x^2 + C$',
      '$F(x) = -\\sin x + \\frac{1}{2}x^2 + C$',
      '$F(x) = \\sin x + x^2 + C$',
      '$F(x) = -\\sin x + x^2 + C$'
    ],
    correct: 0,
    note: 'Ta có ∫(cos x + x)dx = sin x + x^2 / 2 + C.'
  },
  {
    type: 'mcq',
    text: 'Tính giá trị cực đại $y_{CĐ}$ của hàm số $y = -x^2 + 4x + 1$.',
    choices: [
      '$5$',
      '$2$',
      '$1$',
      '$3$'
    ],
    correct: 0,
    note: 'Hàm số đạt giá trị cực đại tại đỉnh x = -b/(2a) = 2. Khi đó y_CĐ = y(2) = 5.'
  },
  {
    type: 'mcq',
    text: 'Cho cấp số cộng $(u_n)$ có $u_1 = 3$, công sai $d = 2$. Tính $u_5$.',
    choices: [
      '$11$',
      '$9$',
      '$13$',
      '$15$'
    ],
    correct: 0,
    note: 'Ta có u_5 = u_1 + 4d = 3 + 4 * 2 = 11.'
  },
  {
    type: 'mcq',
    text: 'Tìm tập xác định của hàm số $y = (x - 2)^{-3}$.',
    choices: [
      '$\\mathbb{R} \\setminus \\{2\\}$',
      '$(2; +\\infty)$',
      '$\\mathbb{R}$',
      '$[2; +\\infty)$'
    ],
    correct: 0,
    note: 'Vì số mũ -3 là nguyên âm nên hàm số xác định khi x - 2 ≠ 0 <=> x ≠ 2. Tập xác định: D = ℝ \\ {2}.'
  },
  {
    type: 'mcq',
    text: 'Với a, b là các số thực dương tùy ý và $a \\neq 1$, giá trị của $\\log_a(a^3 b)$ bằng:',
    choices: [
      '$3 + \\log_a b$',
      '$3 \\log_a b$',
      '$3 - \\log_a b$',
      '$\\frac{3}{\\log_a b}$'
    ],
    correct: 0,
    note: 'log_a(a^3 * b) = log_a(a^3) + log_a(b) = 3 + log_a(b).'
  }
];

export const FALLBACK_BIO_QUESTIONS = [
  {
    type: 'mcq',
    text: 'Quy luật phân ly độc lập của Mendel áp dụng khi?',
    choices: ['Các gen nằm trên NST khác nhau','Các gen liên kết cùng NST','Chỉ khi gen trội trội hoàn toàn','Gen trên NST giới tính'],
    correct: 0,
    note: 'Mendelian independent assortment: các gen nằm trên cặp NST tương đồng khác nhau'
  },
  {
    type: 'mcq',
    text: 'Ở đời F2 của phép lai đơn tính Aa × Aa, kiểu hình lặn chiếm tỉ lệ?',
    choices: ['1/4','1/2','3/4','0'],
    correct: 0,
    note: 'F2: 1AA:2Aa:1aa → aa = 1/4 = 25%'
  },
  {
    type: 'mcq',
    text: 'Trong nguyên phân, NST kép xếp hàng ở mặt phẳng xích đạo vào kỳ nào?',
    choices: ['Kỳ giữa','Kỳ đầu','Kỳ sau','Kỳ cuối'],
    correct: 0,
    note: 'Kỳ giữa (Metaphase): NST kép co ngắn cực đại, xếp một hàng ở mặt phẳng xích đạo'
  },
  {
    type: 'tf',
    context: 'Khi nói về cơ chế di truyền ở sinh vật nhân thực, các phát biểu sau đây đúng hay sai?',
    statements: [
      'Quá trình phiên mã luôn diễn ra đồng thời với dịch mã.',
      'Enzyme RNA polymerase trượt trên mạch khuôn theo chiều từ 3\' đến 5\'.',
      'Sự nhân đôi DNA diễn ra theo nguyên tắc bổ sung và bán bảo tồn.',
      'Tất cả các codon đều mã hóa cho axit amin.'
    ],
    correct: [false, true, true, false],
    note: 'Phiên mã dịch mã độc lập ở nhân thực. RNA polymerase đi 3\'->5\'. Codon kết thúc không mã hóa axit amin.'
  }
];

// === HÀM BÓC TÁCH CÂU HỎI TỪ EXAM_DATABASE (HỖ TRỢ CẢ 3 DẠNG: MCQ, TF, SA) ===
const parseExamQuestionsForSubject = (subject) => {
  const result = [];
  try {
    if (typeof EXAM_DATABASE !== 'undefined' && Array.isArray(EXAM_DATABASE)) {
      EXAM_DATABASE.forEach(exam => {
        if (exam.subject === subject && Array.isArray(exam.questions)) {
          const questions = exam.questions;
          let i = 0;

          const isOptionTrueFalse = (opts) => {
            if (!Array.isArray(opts) || opts.length !== 2) return false;
            const o0 = String(opts[0]).toLowerCase().trim();
            const o1 = String(opts[1]).toLowerCase().trim();
            const isTrueWord = (s) => s.includes('đúng') || s === 'đ' || s === 'true' || s === 't';
            const isFalseWord = (s) => s.includes('sai') || s === 's' || s === 'false' || s === 'f';
            return (isTrueWord(o0) && isFalseWord(o1)) || (isFalseWord(o0) && isTrueWord(o1));
          };

          const aRegex = /(?:^|\s|<p>|<strong>|<b>)(?:a|A)(?:\)|:|\.|\-)\s+/;
          const bRegex = /(?:^|\s|<p>|<strong>|<b>)(?:b|B)(?:\)|:|\.|\-)\s+/;
          const cRegex = /(?:^|\s|<p>|<strong>|<b>)(?:c|C)(?:\)|:|\.|\-)\s+/;
          const dRegex = /(?:^|\s|<p>|<strong>|<b>)(?:d|D)(?:\)|:|\.|\-)\s+/;

          while (i < questions.length) {
            const q = questions[i];

            // 1. Phân tích chuỗi 4 nhận định a, b, c, d liên tiếp dạng Đúng/Sai
            if (
              i + 3 < questions.length &&
              isOptionTrueFalse(q.options) &&
              aRegex.test(q.text) &&
              isOptionTrueFalse(questions[i+1].options) &&
              bRegex.test(questions[i+1].text) &&
              isOptionTrueFalse(questions[i+2].options) &&
              cRegex.test(questions[i+2].text) &&
              isOptionTrueFalse(questions[i+3].options) &&
              dRegex.test(questions[i+3].text)
            ) {
              const qA = questions[i];
              const qB = questions[i+1];
              const qC = questions[i+2];
              const qD = questions[i+3];

              const matchA = qA.text.match(aRegex);
              let context = qA.text;
              let aText = qA.text;
              if (matchA) {
                const idxA = qA.text.indexOf(matchA[0]);
                context = qA.text.substring(0, idxA).trim();
                aText = qA.text.substring(idxA + matchA[0].length).trim();
              }

              const matchB = qB.text.match(bRegex);
              const bText = matchB ? qB.text.substring(qB.text.indexOf(matchB[0]) + matchB[0].length).trim() : qB.text;

              const matchC = qC.text.match(cRegex);
              const cText = matchC ? qC.text.substring(qC.text.indexOf(matchC[0]) + matchC[0].length).trim() : qC.text;

              const matchD = qD.text.match(dRegex);
              const dText = matchD ? qD.text.substring(qD.text.indexOf(matchD[0]) + matchD[0].length).trim() : qD.text;

              const getCorrectValue = (qObj) => {
                const correctIdx = qObj.correctAnswer;
                const correctText = String(qObj.options[correctIdx]).toLowerCase().trim();
                return correctText.includes('đúng') || correctText === 'đ' || correctText === 'true';
              };

              result.push({
                type: 'tf',
                context: context || 'Xác định Đúng/Sai cho các nhận định sau:',
                statements: [aText || 'Nhận định A', bText || 'Nhận định B', cText || 'Nhận định C', dText || 'Nhận định D'],
                correct: [getCorrectValue(qA), getCorrectValue(qB), getCorrectValue(qC), getCorrectValue(qD)],
                note: [
                  qA.explanation ? `a) ${qA.explanation}` : '',
                  qB.explanation ? `b) ${qB.explanation}` : '',
                  qC.explanation ? `c) ${qC.explanation}` : '',
                  qD.explanation ? `d) ${qD.explanation}` : ''
                ].filter(Boolean).join('<br/>')
              });

              i += 4;
            } else {
              // 2. Dạng Trả lời ngắn / Con số
              if (q.type === 'short_answer' || q.type === 'sa' || q.correctShortAnswer !== undefined) {
                result.push({
                  type: 'sa',
                  text: q.text,
                  correctAnswer: q.correctShortAnswer ?? q.correctAnswer ?? q.correct ?? '',
                  note: q.explanation || ''
                });
              }
              // 3. Dạng Đúng/Sai đơn lẻ (có cấu trúc statements)
              else if (q.type === 'true_false' || q.type === 'tf') {
                result.push({
                  type: 'tf',
                  context: q.context || q.text,
                  statements: (q.statements || []).map(s => typeof s === 'string' ? s : (s.text || '')),
                  correct: (q.statements || []).map(s => typeof s === 'string' ? false : (s.correctValue ?? false)),
                  note: q.explanation || ''
                });
              }
              // 4. Dạng Trắc nghiệm 4 lựa chọn (MCQ)
              else if ((q.type === 'mcq' || !q.type) && Array.isArray(q.options) && q.options.length >= 2) {
                result.push({
                  type: 'mcq',
                  text: q.text,
                  choices: q.options,
                  correct: q.correctAnswer !== undefined ? Number(q.correctAnswer) : 0,
                  note: q.explanation || ''
                });
              }
              i += 1;
            }
          }
        }
      });
    }
  } catch (e) {
    console.warn(`Lỗi tải câu hỏi môn ${subject} từ EXAM_DATABASE:`, e);
  }
  return result;
};

// === MULTIPLAYER INFINITE MATCH POOLS ===

export const generateMathMatchPool = async (seenHistory = []) => {
  let pool = await fetchFirestoreQuestions('math');
  const examPool = parseExamQuestionsForSubject('math');
  pool = [...pool, ...examPool];

  if (pool.length === 0) {
    pool = [...FALLBACK_MATH_MCQS];
  }

  let available = pool.filter(q => !seenHistory.includes(q.text || q.context));
  if (available.length === 0) {
    available = pool;
  }

  const shuffled = shuffleArray(available);
  return shuffled.map((q, idx) => ({ ...q, id: `math_q_${idx}`, idx }));
};

export const generatePhysicsMatchPool = async (seenHistory = []) => {
  let pool = await fetchFirestoreQuestions('physics');
  const examPool = parseExamQuestionsForSubject('physics');
  pool = [...pool, ...examPool];

  if (pool.length === 0) {
    pool = [...FALLBACK_PHYSICS_MCQS];
  }

  let available = pool.filter(q => !seenHistory.includes(q.text || q.context));
  if (available.length === 0) {
    available = pool;
  }

  const shuffled = shuffleArray(available);
  return shuffled.map((q, idx) => ({ ...q, id: `phys_q_${idx}`, idx }));
};

export const generateBiologyMatchPool = async (seenHistory = []) => {
  let pool = await fetchFirestoreQuestions('biology');
  const examPool = parseExamQuestionsForSubject('biology');
  pool = [...pool, ...examPool];

  Object.values(BIO_BANKS).forEach(bank => {
    bank.questions.forEach(q => {
      pool.push({
        type: 'mcq',
        text: q.text,
        choices: q.choices,
        correct: q.correct,
        note: q.note || ''
      });
    });
  });

  if (pool.length === 0) {
    pool = [...FALLBACK_BIO_QUESTIONS];
  }

  let available = pool.filter(q => !seenHistory.includes(q.text || q.context));
  if (available.length === 0) {
    available = pool;
  }

  const shuffled = shuffleArray(available);
  return shuffled.map((q, idx) => ({ ...q, id: `bio_q_${idx}`, idx }));
};

export const FALLBACK_CHEMISTRY_MCQS = [
  {
    type: 'mcq',
    text: 'Dung dịch làm quỳ tím chuyển sang màu đỏ là:',
    choices: ['HCl', 'NaOH', 'NaCl', 'H2O'],
    correct: 0,
    note: 'Dung dịch axit làm quỳ tím hóa đỏ (HCl).'
  },
  {
    type: 'mcq',
    text: 'Kim loại nào sau đây phản ứng mãnh liệt với nước ở nhiệt độ thường?',
    choices: ['Natri (Na)', 'Sắt (Fe)', 'Đồng (Cu)', 'Vàng (Au)'],
    correct: 0,
    note: 'Natri (Na) là kim loại kiềm phản ứng mạnh với nước giải phóng H2.'
  },
  {
    type: 'mcq',
    text: 'Chất nào sau đây là este có mùi thơm đặc trưng của chuối chín?',
    choices: ['Isoamyl axetat', 'Ethyl axetat', 'Methyl fomat', 'Benzyl axetat'],
    correct: 0,
    note: 'Isoamyl axetat (CH3COOCH2CH2CH(CH3)2) có mùi thơm quả chuối chín.'
  },
  {
    type: 'mcq',
    text: 'Công thức hóa học của vôi sống là:',
    choices: ['CaO', 'Ca(OH)2', 'CaCO3', 'CaSO4'],
    correct: 0,
    note: 'Vôi sống là Canxi oxit (CaO).'
  },
  {
    type: 'mcq',
    text: 'Khí nào sau đây gây ra hiệu ứng nhà kính chính trên Trái Đất?',
    choices: ['CO2', 'O2', 'N2', 'H2'],
    correct: 0,
    note: 'Khí cacbonic (CO2) là khí nhà kính phổ biến nhất.'
  },
  {
    type: 'mcq',
    text: 'Thuốc thử dùng để nhận biết hồ tinh bột là:',
    choices: ['Dung dịch Iot (I2)', 'Dung dịch AgNO3', 'Dung dịch Cu(OH)2', 'Quỳ tím'],
    correct: 0,
    note: 'Iot tạo với hồ tinh bột hợp chất màu xanh tím đặc trưng.'
  },
  {
    type: 'tf',
    context: 'Cho các phát biểu về este và lipid, xác định Đúng hoặc Sai cho mỗi nhận định:',
    statements: [
      'Tất cả các este đều tan tốt trong nước.',
      'Chất béo là trieste của glycerol với axit béo.',
      'Thủy phân este trong môi trường kiềm gọi là phản ứng xà phòng hóa.',
      'Dầu mỡ động thực vật có cùng thành phần với dầu mỡ bôi trơn máy.'
    ],
    correct: [false, true, true, false],
    note: 'Este ít tan trong nước. Chất béo là trieste của glycerol. Thủy phân este trong kiềm = xà phòng hóa. Dầu bôi trơn máy là hydrocarbon.'
  }
];

export const generateChemistryMatchPool = async (seenHistory = []) => {
  let pool = await fetchFirestoreQuestions('chemistry');
  const examPool = parseExamQuestionsForSubject('chemistry');
  pool = [...pool, ...examPool];

  CHEMISTRY_MISSIONS.forEach(m => {
    pool.push({
      type: 'mcq',
      text: `Trong phản ứng điều chế/thí nghiệm "${m.name}", phương trình hóa học đúng là gì?`,
      choices: [m.equation, '2NaOH + H2SO4 -> Na2SO4 + 2H2O', 'CaCO3 -> CaO + CO2', '2H2 + O2 -> 2H2O'],
      correct: 0,
      note: m.instructions
    });
  });

  if (pool.length === 0) {
    pool = [...FALLBACK_CHEMISTRY_MCQS];
  }

  let available = pool.filter(q => !seenHistory.includes(q.text || q.context));
  if (available.length === 0) {
    available = pool;
  }

  const shuffled = shuffleArray(available);
  return shuffled.map((q, idx) => ({ ...q, id: `chem_q_${idx}`, idx }));
};


