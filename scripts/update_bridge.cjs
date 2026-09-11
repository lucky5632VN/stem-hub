const fs = require('fs');
const path = require('path');

const bridgePath = path.resolve('public/labs/shared/stem-lab-ai-bridge.js');
let content = fs.readFileSync(bridgePath, 'utf-8');

const subjectDefsCode = `
  const SUBJECT_DEFINITIONS = {
    toan: {
      name: 'Toán học',
      labName: 'phòng thí nghiệm Toán học 3D',
      keywords: [
        'lăng trụ', 'lang tru', 'hình chóp', 'hinh chop', 'hình hộp', 'hinh hop', 'thể tích', 'the tich',
        'diện tích', 'dien tich', 'hình nón', 'hinh non', 'hình trụ', 'hinh tru', 'mặt cầu', 'mat cau',
        'tứ diện', 'tu dien', 'tam giác', 'tam giac', 'vector', 'vecto', 'tọa độ', 'toa do', 'oxyz',
        'đạo hàm', 'dao ham', 'tích phân', 'tich phan', 'nguyên hàm', 'nguyen ham', 'khảo sát hàm số',
        'cực trị', 'cuc tri', 'tiệm cận', 'tiem can', 'xác suất', 'xac suat', 'biến cố', 'tổ hợp', 'chỉnh hợp',
        'số phức', 'so phuc', 'logarit', 'lũy thừa', 'luỹ thừa', 'phương trình bậc', 'hệ phương trình',
        'bất phương trình', 'lượng giác', 'sin', 'cos', 'tan', 'cotan', 'đồ thị hàm số'
      ]
    },
    ly: {
      name: 'Vật lý',
      labName: 'phòng thí nghiệm Vật lý Ảo',
      keywords: [
        'con lắc', 'con lac', 'dao động điều hòa', 'dao dong', 'chu kỳ', 'chu ky', 'tần số', 'tan so',
        'vận tốc', 'gia tốc', 'quãng đường', 'rơi tự do', 'lực ma sát', 'lực hấp dẫn', 'định luật newton',
        'động năng', 'thế năng', 'cơ năng', 'công suất', 'áp suất', 'nhiệt lượng', 'nhiệt độ',
        'khí lý tưởng', 'sóng cơ', 'bước sóng', 'giao thoa sóng', 'sóng dừng', 'âm học',
        'điện trường', 'điện tích', 'hiệu điện thế', 'cường độ dòng điện', 'định luật ôm', 'dinh luat om',
        'điện trở', 'ampe kế', 'vôn kế', 'mạch rlc', 'từ trường', 'cảm ứng từ', 'lực từ', 'lực lorentz',
        'quang hình', 'khúc xạ', 'phản xạ', 'thấu kính', 'lăng kính', 'quang điện', 'hạt nhân', 'phóng xạ'
      ]
    },
    hoa: {
      name: 'Hóa học',
      labName: 'phòng thí nghiệm Hóa học Ảo',
      keywords: [
        'phản ứng', 'phan ung', 'hóa học', 'chất kết tủa', 'ket tua', 'axit', 'bazơ', 'bazo', 'muối',
        'oxit', 'bảng tuần hoàn', 'kim loại', 'phi kim', 'kiềm', 'ancol', 'rượu', 'este', 'xà phòng hóa',
        'lipit', 'chất béo', 'glucozơ', 'saccarozơ', 'tinh bột', 'xenlulozơ', 'cacbohidrat',
        'amin', 'amino axit', 'peptit', 'protein', 'polime', 'ankan', 'anken', 'ankin',
        'benzen', 'phenol', 'andehit', 'axit axetic', 'hcl', 'h2so4', 'naoh', 'caco3',
        'điện phân', 'ăn mòn kim loại', 'nồng độ mol', 'dung dịch', 'ống nghiệm', 'quỳ tím', 'phenolphtalein'
      ]
    },
    sinh: {
      name: 'Sinh học',
      labName: 'phòng thí nghiệm Sinh học Ảo',
      keywords: [
        'tế bào', 'te bao', 'màng sinh chất', 'ti thể', 'lục lạp', 'nhân tế bào',
        'adn', 'arn', 'dna', 'rna', 'gen', 'alen', 'nhiễm sắc thể', 'nst', 'nuclêôtit',
        'nhân đôi', 'tái bản', 'phiên mã', 'dịch mã', 'đột biến', 'nguyên phân', 'giảm phân',
        'giao tử', 'hợp tử', 'menđen', 'menden', 'quy luật di truyền', 'sơ đồ lai', 'f1', 'f2',
        'hoán vị gen', 'liên kết gen', 'di truyền quần thể', 'hardy-weinberg', 'tiến hóa',
        'chọn lọc tự nhiên', 'sinh thái', 'quang hợp', 'hô hấp tế bào', 'chuỗi thức ăn',
        'hệ sinh thái', 'thoát hơi nước', 'tuần hoàn máu', 'tiêu hóa'
      ]
    }
  };

  /**
   * Kiểm tra ranh giới môn học của câu hỏi đối với phòng Lab hiện tại.
   * Nếu câu hỏi rõ ràng thuộc môn khác, từ chối lịch sự và hướng dẫn sang phòng lab phù hợp.
   */
  function checkSubjectBoundary(userQuery, labSubject = 'stem') {
    const normSubj = (labSubject || 'stem').toLowerCase();
    if (normSubj === 'stem' || !SUBJECT_DEFINITIONS[normSubj]) {
      return { allowed: true };
    }

    const currentDef = SUBJECT_DEFINITIONS[normSubj];
    const cleanQ = normalizeText(userQuery);

    // Bỏ qua kiểm tra với các câu hỏi chào hỏi, giao tiếp chung ngắn gọn
    const isGreeting = /^(chào|xin chào|hello|hi|bạn là ai|giới thiệu|hướng dẫn|chức năng|giúp tôi|cứu|help|test)/i.test(cleanQ);
    if (isGreeting && cleanQ.split(' ').length <= 6) {
      return { allowed: true };
    }

    // Đếm số từ khóa khớp với môn hiện tại
    let currentMatches = 0;
    for (const kw of currentDef.keywords) {
      if (cleanQ.includes(kw)) {
        currentMatches++;
      }
    }

    // Đếm số từ khóa khớp với các môn khác
    let highestOtherMatches = 0;
    let otherSubjKey = null;

    for (const [subjKey, def] of Object.entries(SUBJECT_DEFINITIONS)) {
      if (subjKey === normSubj) continue;
      let matches = 0;
      for (const kw of def.keywords) {
        if (cleanQ.includes(kw)) {
          matches++;
        }
      }
      if (matches > highestOtherMatches) {
        highestOtherMatches = matches;
        otherSubjKey = subjKey;
      }
    }

    // Nếu câu hỏi hoàn toàn không có từ khóa môn này, nhưng lại khớp rõ rệt môn khác
    if (currentMatches === 0 && highestOtherMatches >= 1 && otherSubjKey) {
      const otherDef = SUBJECT_DEFINITIONS[otherSubjKey];
      return {
        allowed: false,
        otherSubject: otherSubjKey,
        otherSubjectName: otherDef.name,
        refusal: \`Tôi là Chuyên gia AI chuyên sâu môn \${currentDef.name} của STEM HUB. Tôi chỉ giải đáp các kiến thức, bài tập và thí nghiệm thuộc phạm vi môn \${currentDef.name}. Đối với câu hỏi về môn \${otherDef.name}, bạn vui lòng chuyển sang \${otherDef.labName} để được hỗ trợ chuyên sâu và mô phỏng trực quan tốt nhất nhé!\`
      };
    }

    return { allowed: true };
  }
`;

// Insert subjectDefsCode before checkLabLearnedCache if not already present
if (!content.includes('checkSubjectBoundary')) {
  content = content.replace('async function checkLabLearnedCache', subjectDefsCode + '\n  async function checkLabLearnedCache');
  content = content.replace('checkLabLearnedCache,', 'checkLabLearnedCache,\n    checkSubjectBoundary,\n    SUBJECT_DEFINITIONS,');
}

fs.writeFileSync(bridgePath, content, 'utf-8');
console.log('✅ Updated public/labs/shared/stem-lab-ai-bridge.js');

// Also mirror to PhysicsLab and lab_sinh
fs.writeFileSync(path.resolve('public/labs/PhysicsLab/stem-lab-ai-bridge.js'), content, 'utf-8');
fs.writeFileSync(path.resolve('public/labs/lab_sinh/dist/stem-lab-ai-bridge.js'), content, 'utf-8');
console.log('✅ Mirrored to PhysicsLab and lab_sinh');
