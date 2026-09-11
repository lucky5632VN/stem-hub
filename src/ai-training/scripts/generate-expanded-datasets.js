import fs from 'fs';
import path from 'path';

console.log('⚡ Đang khởi tạo bộ tạo dữ liệu mở rộng cho STEM HUB AI...');

// ==========================================
// 1. CHEM RISK DATASET GENERATION (180 samples)
// ==========================================
const chemRiskSamples = [];
for (let i = 0; i < 180; i++) {
  // Random values
  const temp = Math.floor(Math.random() * 105) + 15; // 15 - 120 °C
  const energy = Math.floor(Math.random() * 100); // 0 - 100%
  const violations = Math.floor(Math.random() * 5); // 0 - 4
  const chemCount = Math.floor(Math.random() * 8) + 1; // 1 - 8
  const hasHazard = Math.random() > 0.6 ? 1 : 0;

  // Formula score
  const score = (temp / 120.0) * 0.45 + ((100 - energy) / 100.0) * 0.25 + (violations / 5.0) * 0.2 + (hasHazard * 0.1);

  let label = 0;
  let labelName = "An toàn";
  if (score >= 0.55 || violations >= 2 || temp >= 85 || energy <= 30) {
    label = 2;
    labelName = "Nguy hiểm";
  } else if (score >= 0.30 || violations >= 1 || temp >= 45 || energy <= 70 || hasHazard === 1) {
    label = 1;
    labelName = "Cảnh báo";
  }

  chemRiskSamples.push({ temp, energy, violations, chemCount, hasHazard, label, labelName });
}

const chemPath = path.resolve('src/ai-training/datasets/chem-risk/risk-dataset.json');
fs.mkdirSync(path.dirname(chemPath), { recursive: true });
fs.writeFileSync(chemPath, JSON.stringify(chemRiskSamples, null, 2));

// Generate Unseen Chem Test Set (30 samples)
const chemUnseen = [];
for (let i = 0; i < 30; i++) {
  const temp = Math.floor(Math.random() * 105) + 15;
  const energy = Math.floor(Math.random() * 100);
  const violations = Math.floor(Math.random() * 5);
  const chemCount = Math.floor(Math.random() * 8) + 1;
  const hasHazard = Math.random() > 0.5 ? 1 : 0;
  const score = (temp / 120.0) * 0.45 + ((100 - energy) / 100.0) * 0.25 + (violations / 5.0) * 0.2 + (hasHazard * 0.1);
  let label = 0;
  let labelName = "An toàn";
  if (score >= 0.55 || violations >= 2 || temp >= 85 || energy <= 30) {
    label = 2;
    labelName = "Nguy hiểm";
  } else if (score >= 0.30 || violations >= 1 || temp >= 45 || energy <= 70 || hasHazard === 1) {
    label = 1;
    labelName = "Cảnh báo";
  }
  chemUnseen.push({ temp, energy, violations, chemCount, hasHazard, label, labelName });
}
const chemUnseenPath = path.resolve('src/ai-training/datasets/chem-risk/unseen-test-chem.json');
fs.writeFileSync(chemUnseenPath, JSON.stringify(chemUnseen, null, 2));

// ==========================================
// 2. PHYSICS ERROR DATASET GENERATION (120 samples)
// ==========================================
const physicsSamples = [];
for (let i = 0; i < 120; i++) {
  const type = i % 3;
  let angleDiff = 0, posOffset = 0, indexDiff = 0, errorType = "";
  if (type === 0) { // Angle error dominant
    angleDiff = 15.0 + Math.random() * 25.0;
    posOffset = Math.random() * 4.0;
    indexDiff = Math.random() * 0.05;
    errorType = "Sai góc tới (Incidence Angle Error)";
  } else if (type === 1) { // Position offset dominant
    angleDiff = Math.random() * 4.0;
    posOffset = 25.0 + Math.random() * 50.0;
    indexDiff = Math.random() * 0.05;
    errorType = "Sai vị trí thấu kính/gương (Element Alignment Error)";
  } else { // Index error dominant
    angleDiff = Math.random() * 4.0;
    posOffset = Math.random() * 4.0;
    indexDiff = 0.20 + Math.random() * 0.50;
    errorType = "Sai chiết suất môi trường (Refractive Index Error)";
  }
  physicsSamples.push({
    angleDiff: parseFloat(angleDiff.toFixed(2)),
    posOffset: parseFloat(posOffset.toFixed(2)),
    indexDiff: parseFloat(indexDiff.toFixed(3)),
    label: type,
    errorType
  });
}
const physPath = path.resolve('src/ai-training/datasets/physics-error/attempts.json');
fs.mkdirSync(path.dirname(physPath), { recursive: true });
fs.writeFileSync(physPath, JSON.stringify(physicsSamples, null, 2));

// Generate Unseen Physics Test Set (30 samples)
const physicsUnseen = [];
for (let i = 0; i < 30; i++) {
  const type = i % 3;
  let angleDiff = 0, posOffset = 0, indexDiff = 0, errorType = "";
  if (type === 0) {
    angleDiff = 16.0 + Math.random() * 20.0;
    posOffset = Math.random() * 3.5;
    indexDiff = Math.random() * 0.04;
    errorType = "Sai góc tới (Incidence Angle Error)";
  } else if (type === 1) {
    angleDiff = Math.random() * 3.5;
    posOffset = 30.0 + Math.random() * 40.0;
    indexDiff = Math.random() * 0.04;
    errorType = "Sai vị trí thấu kính/gương (Element Alignment Error)";
  } else {
    angleDiff = Math.random() * 3.5;
    posOffset = Math.random() * 3.5;
    indexDiff = 0.25 + Math.random() * 0.40;
    errorType = "Sai chiết suất môi trường (Refractive Index Error)";
  }
  physicsUnseen.push({
    angleDiff: parseFloat(angleDiff.toFixed(2)),
    posOffset: parseFloat(posOffset.toFixed(2)),
    indexDiff: parseFloat(indexDiff.toFixed(3)),
    label: type,
    errorType
  });
}
const physUnseenPath = path.resolve('src/ai-training/datasets/physics-error/unseen-test-physics.json');
fs.writeFileSync(physUnseenPath, JSON.stringify(physicsUnseen, null, 2));

// ==========================================
// 3. INTENT CLASSIFIER DATASET (300 samples = 50 per class x 6 classes)
// ==========================================
const intentTemplates = {
  nav_phongthi: [
    "Mở phòng thi thử cho tôi", "Tôi muốn luyện đề thi THPT quốc gia", "Chuyển sang trang thi", "Làm đề thi thử hóa", "Vào phòng thi trực tuyến",
    "Cho tôi thi thử môn toán", "Thi thử môn vật lý 15 phút", "Vào làm bài thi THPT", "Trang thi thử đại học", "Mở danh sách đề thi",
    "Muốn làm đề thi thử sinh học", "Vào phòng thi 45 phút", "Mở trang thi trực tuyến", "Bắt đầu làm bài thi", "Luyện giải đề đại học",
    "Tôi cần thi thử ngay", "Mở phần thi trắc nghiệm", "Luyện đề trắc nghiệm toán", "Đề thi thử hóa học 2026", "Vào thi thử lý 12",
    "Cho làm đề thi thử", "Thi trực tuyến THPT QG", "Bắt đầu thi thử môn sinh", "Mở giao diện phòng thi", "Làm bài kiểm tra 15p",
    "Kiểm tra 45p hóa học", "Vào làm đề thi ngay", "Trang luyện đề THPT", "Tôi muốn làm bài thi", "Mở phòng thi toán",
    "Vào làm bài thi hóa", "Thi thử vật lý lớp 12", "Luyện tập đề thi tổng hợp", "Cho làm test 15 phút", "Vào phần làm đề thi",
    "Mở trang đề thi quốc gia", "Thi thử toán học", "Luyện đề sinh học 12", "Vào phòng thi trắc nghiệm", "Thi trắc nghiệm hóa 12",
    "Mở mục thi thử", "Đi tới phòng thi", "Làm đề thi thử ngay", "Vào phòng kiểm tra", "Bắt đầu làm bài kiểm tra",
    "Chuyển tới trang phòng thi", "Mở giao diện làm đề thi", "Vào thi thử pvp thi đấu", "Mở phòng thi trắc nghiệm online", "Làm bài thi thử toán lý hóa"
  ],
  nav_dautruong: [
    "Vào đấu trường sinh tử pvp", "Thách đấu đấu trường 1v1", "Tôi muốn đấu pvp với bạn học", "Mở trang đấu trường PvP", "Chuyển sang đấu trường",
    "Thách đấu bạn bè 1v1", "Vào phòng chờ đấu trường", "Đấu pvp toán học", "Thách đấu môn hóa 1v1", "Tìm đối thủ đấu trường",
    "Vào làm trận pvp 1v1", "Mở bảng xếp hạng đấu trường", "Đấu trường tri thức 1v1", "Thách đấu vật lý pvp", "Tạo phòng đấu 1v1",
    "Ghép trận đấu trường ngay", "Vào chơi pvp trực tuyến", "Đấu 1v1 môn sinh học", "Mở chế độ thách đấu", "Tìm trận 1v1 nhanh",
    "Chơi đấu trường PvP", "Vào đấu trường học tập", "Thách đấu xem ai điểm cao hơn", "Vào thi đấu 1v1", "Mở sảnh chờ đấu trường",
    "Vào game pvp 1v1", "Đấu trường xếp hạng elo", "Tìm đối thủ pvp toán", "Thách đấu pvp lý hóa", "Mở trang thách đấu 1v1",
    "Vào chế độ thi đấu pvp", "Thách đấu sinh học 1v1", "Ghép hàng chờ đấu trường", "Mở đấu trường xếp hạng", "Vào chiến đấu pvp 1v1",
    "Chơi pvp cùng bạn", "Thách đấu trực tiếp 1v1", "Vào phòng đấu PvP", "Mở trang PvP Đấu trường", "Tìm trận đấu PvP ngay",
    "Bắt đầu trận đấu 1v1", "Vào giao diện đấu trường", "Đi tới sảnh PvP", "Thách đấu người chơi khác", "Vào phòng thi đấu 1v1",
    "Vào đấu trường điểm Elo", "Đấu 1v1 thách đấu tri thức", "Mở mục PvP Đấu trường", "Vào đấu trường trực tuyến", "Bắt đầu thách đấu 1v1"
  ],
  nav_hoso: [
    "Mở hồ sơ cá nhân của tôi", "Xem avatar chibi và danh hiệu", "Đổi trang phục hồ sơ", "Mở trang cá nhân", "Xem thông tin tài khoản",
    "Vào trang hồ sơ người dùng", "Xem danh hiệu đã đạt được", "Đổi khung avatar chibi", "Xem điểm kinh nghiệm exp", "Mở tủ đồ chibi",
    "Xem lịch sử học tập", "Xem thứ hạng Elo của tôi", "Trang trí avatar cá nhân", "Mở trang thông tin hồ sơ", "Xem bộ sưu tập danh hiệu",
    "Xem số tinh thể hiện có", "Đổi vật phẩm avatar", "Vào mục hồ sơ cá nhân", "Xem level và cấp độ", "Mở bảng trang bị chibi",
    "Xem hồ sơ thành tích", "Chỉnh sửa hồ sơ cá nhân", "Xem avatar và khung hình", "Vào xem profile cá nhân", "Mở trang thành tích học tập",
    "Xem huy hiệu đã nhận", "Thay đổi trang phục chibi", "Vào trang thông tin cá nhân", "Mở hồ sơ học sinh", "Xem điểm Elo và Rank",
    "Xem danh sách vật phẩm", "Mở tủ đồ thời trang chibi", "Xem số trận thắng thua", "Mở phần hồ sơ cá nhân", "Xem thông tin level",
    "Vào trang chỉnh sửa profile", "Mở trang bị danh hiệu", "Xem kinh nghiệm tích lũy", "Vào kiểm tra hồ sơ", "Mở avatar chibi của tôi",
    "Xem bộ trang phục avatar", "Vào trang cá nhân học viên", "Mở khung viền avatar", "Xem bảng thành tựu", "Vào trang cài đặt hồ sơ",
    "Mở trang cá nhân của tôi", "Xem tổng số tinh thể", "Xem lịch sử thi đấu pvp", "Vào xem thông tin profile", "Mở trang cá nhân học sinh"
  ],
  nav_story: [
    "Vào mạng xã hội story xem bài viết", "Mở trang story học tập", "Xem bài đăng của các bạn", "Chuyển sang trang Story", "Mở bảng tin học tập",
    "Xem tin tức mạng xã hội", "Đăng bài viết lên story", "Vào mạng xã hội STEM", "Xem chia sẻ kinh nghiệm học tập", "Mở trang bài viết cộng đồng",
    "Xem tin mới trên story", "Vào lướt story học tập", "Xem thảo luận của học sinh", "Mở mục tin tức cộng đồng", "Đọc các bài viết hay",
    "Vào diễn đàn story", "Xem bài đăng mới nhất", "Mở trang mạng xã hội", "Xem story của bạn bè", "Đăng cảm nghĩ lên story",
    "Vào trang bảng tin", "Đọc bài viết chia sẻ mẹo thi", "Xem tin tức STEM HUB", "Mở giao diện Story mạng xã hội", "Lướt story học tập",
    "Xem bài viết môn hóa học", "Xem chia sẻ mẹo giải toán", "Vào feed bài viết story", "Mở trang cộng đồng học sinh", "Đăng câu hỏi lên story",
    "Xem bài đăng môn vật lý", "Vào mạng xã hội bài viết", "Đọc tin tức giáo dục", "Mở bảng tin cộng đồng", "Xem thảo luận bài tập",
    "Vào trang tin tức story", "Xem các bài chia sẻ kinh nghiệm", "Mở trang feeds bài viết", "Xem bài đăng nổi bật", "Đăng thảo luận lên story",
    "Vào mục story học tập", "Xem thông tin bài đăng mới", "Mở mạng xã hội STEM HUB", "Đọc các bài viết hướng dẫn", "Xem story cộng đồng học sinh",
    "Vào trang chia sẻ kiến thức", "Mở feed tin tức story", "Đọc thảo luận giải đề", "Xem bài đăng từ giáo viên", "Mở diễn đàn thảo luận story"
  ],
  toggle_theme: [
    "Đổi giao diện sáng tối", "Bật chế độ dark mode", "Tắt chế độ tối đổi sang chế độ sáng", "Chuyển sang giao diện tối", "Bật chế độ sáng",
    "Đổi màu nền website", "Bật giao diện ban đêm", "Chuyển theme sáng tối", "Bật chế độ xem đêm", "Tắt dark mode",
    "Chuyển sang light mode", "Đổi giao diện sang màu tối", "Đổi giao diện sang màu sáng", "Bật phông nền tối", "Đổi chế độ hiển thị sáng tối",
    "Tắt giao diện tối", "Chuyển màu nền sáng", "Bật chế độ giao diện tối", "Bật chế độ giao diện sáng", "Đổi theme website sang dark",
    "Chuyển theme website sang light", "Bật chế độ ban ngày", "Bật dark theme", "Tắt dark theme", "Đổi tone màu sáng tối",
    "Chuyển sang phông nền sáng", "Chuyển sang phông nền tối", "Đổi màn hình sang chế độ tối", "Đổi màn hình sang chế độ sáng", "Bật chế độ đọc ban đêm",
    "Tắt chế độ đọc ban đêm", "Thay đổi theme sáng tối", "Chuyển màu màn hình", "Đổi giao diện tối cho đỡ mỏi mắt", "Bật chế độ ánh sáng đêm",
    "Tắt ánh sáng đêm", "Chuyển nền đen", "Chuyển nền trắng", "Đổi giao diện màu đen", "Đổi giao diện màu trắng",
    "Bật chế độ xem tối", "Tắt chế độ xem tối", "Thay đổi màu nền app", "Chuyển sang giao diện ban đêm", "Chuyển sang giao diện ban ngày",
    "Bật nền tối cyberpunk", "Đổi theme màn hình", "Bật chế độ hiển thị đêm", "Tắt giao diện ban đêm", "Chuyển đổi giao diện sáng tối"
  ],
  stem_query: [
    "Phản ứng este xà phòng hóa là gì", "Công thức glucozơ tráng bạc tạo bao nhiêu ag", "Phương trình sắt tác dụng axit hcl", "Giải thích phản ứng trùng hợp polime", "Tính chất hóa học của anken ankin",
    "Công thức dao động điều hòa x bằng a cos", "Hiện tượng cộng hưởng xảy ra khi nào", "Tổng trở mạch rlc nối tiếp tính như thế nào", "Định luật khúc xạ ánh sáng n1 sin i", "Công thức tính bước sóng lambda",
    "Công thức đạo hàm hàm số mũ và logarit", "Tính diện tích hình phẳng bằng tích phân", "Phương trình bậc hai có 2 nghiệm phân biệt khi nào", "Công thức tính thể tích khối chóp", "Cách tìm tiệm cận đứng và tiệm cận ngang",
    "Cấu trúc xoắn kép adn nguyên tắc bổ sung", "Định luật cân bằng hardy-weinberg quần thể", "Mô hình khảm động màng sinh chất tế bào", "Quá trình phiên mã và dịch mã tổng hợp protein", "Quy luật phân li độc lập của mendel",
    "Tính khối lượng kết tủa baso4", "Sóng dừng trên dây hai đầu cố định", "Tính tích phân xác định từ 0 đến 1", "Cơ chế di truyền và biến dị ở cấp độ tế bào", "Phản ứng nhiệt nhôm tạo ra chất gì",
    "Chu kỳ dao động của con lắc đơn", "Giải phương trình lượng giác cơ bản", "Đột biến gen và đột biến nhiễm sắc thể", "Đồng đẳng và đồng phân là gì", "Gia tốc trọng trường và lực hấp dẫn",
    "Tính đạo hàm cấp hai của hàm số", "Quá trình quang hợp ở thực vật c3 c4", "Kim loại kiềm và kiềm thổ phản ứng với nước", "Tần số góc và pha ban đầu của dao động", "Số phức và tọa độ điểm biểu diễn",
    "Các giai đoạn nguyên phân và giảm phân", "Axit béo khan và phản ứng thủy phân", "Hiện tượng quang điện ngoài và thuyết lượng tử", "Tính khoảng cách từ điểm đến mặt phẳng", "Hoạt động của enzim và màng tế bào",
    "Đồng độ mol và nồng độ phần trăm", "Vận tốc cực đại trong dao động điều hòa", "Cực trị của hàm số bậc ba", "Nhiễm sắc thể giới tính và di truyền liên kết", "Sự điện phân dung dịch cuso4",
    "Mạch dao động lc và sóng điện từ", "Tính thể tích khối cầu bán kính r", "Sinh sản vô tính và hữu tính ở động vật", "Phản ứng tráng gương của anđehit", "Định luật bảo toàn động lượng và năng lượng"
  ]
};

const intentSamples = [];
for (const [intent, texts] of Object.entries(intentTemplates)) {
  texts.forEach(t => {
    let subject = null;
    if (intent === 'stem_query') {
      const qLower = t.toLowerCase();
      if (qLower.includes('hóa') || qLower.includes('este') || qLower.includes('axit') || qLower.includes('phản ứng') || qLower.includes('chất')) subject = 'hoa';
      else if (qLower.includes('lý') || qLower.includes('sóng') || qLower.includes('dao động') || qLower.includes('mạch') || qLower.includes('quang')) subject = 'ly';
      else if (qLower.includes('toán') || qLower.includes('đạo hàm') || qLower.includes('tích phân') || qLower.includes('phương trình') || qLower.includes('hàm số')) subject = 'toan';
      else if (qLower.includes('sinh') || qLower.includes('adn') || qLower.includes('gen') || qLower.includes('tế bào') || qLower.includes('mendel')) subject = 'sinh';
    }
    intentSamples.push({ text: t, intent, subject });
  });
}
const intentPath = path.resolve('src/ai-training/datasets/intent/intent-samples.json');
fs.mkdirSync(path.dirname(intentPath), { recursive: true });
fs.writeFileSync(intentPath, JSON.stringify(intentSamples, null, 2));

// Generate Unseen Intent Test Set (30 brand-new test queries with typos, slang, informal phrasings)
const unseenIntentSamples = [
  { text: "cho tui va0 phong thj thu", intent: "nav_phongthi", subject: null },
  { text: "mở trang luyen de thpt 2026", intent: "nav_phongthi", subject: null },
  { text: "muon thi thu mon toan cap toc", intent: "nav_phongthi", subject: "toan" },
  { text: "cho lam bai test 15p hoa", intent: "nav_phongthi", subject: "hoa" },
  { text: "chuyen den trang thi thu dai hoc", intent: "nav_phongthi", subject: null },
  
  { text: "solo 1v1 voi ban hoc pvp", intent: "nav_dautruong", subject: null },
  { text: "mo dautruong pvp nha", intent: "nav_dautruong", subject: null },
  { text: "thach dau tran pvp 1vs1", intent: "nav_dautruong", subject: null },
  { text: "tim doi thu ghep tran 1v1", intent: "nav_dautruong", subject: null },
  { text: "cho tui vao dau truong pvp ngay", intent: "nav_dautruong", subject: null },

  { text: "xem cai hoso chibi cua tui", intent: "nav_hoso", subject: null },
  { text: "mo trang ca nhan xem rank elo", intent: "nav_hoso", subject: null },
  { text: "doi avatar chibi cute", intent: "nav_hoso", subject: null },
  { text: "xem danh hieu voi badge hien co", intent: "nav_hoso", subject: null },
  { text: "cho tui xem profile hoc sinh", intent: "nav_hoso", subject: null },

  { text: "mo story xem bai viet moi", intent: "nav_story", subject: null },
  { text: "vao mang xa hoi doc tin stem", intent: "nav_story", subject: null },
  { text: "luet story xem tin tuc ban be", intent: "nav_story", subject: null },
  { text: "dang bai chia se len story", intent: "nav_story", subject: null },
  { text: "mo dien dan thao luan story", intent: "nav_story", subject: null },

  { text: "bat darkmode cho diu mat", intent: "toggle_theme", subject: null },
  { text: "doi nenh sang toi nha nova", intent: "toggle_theme", subject: null },
  { text: "tat che do toi chuyen sang sang", intent: "toggle_theme", subject: null },
  { text: "doi theme sang den", intent: "toggle_theme", subject: null },
  { text: "bat giao dien xem ban dem", intent: "toggle_theme", subject: null },

  { text: "axit axetic phan ung voi sôđa tao gi", intent: "stem_query", subject: "hoa" },
  { text: "tinh chu ky con lac lo xo theo m va k", intent: "stem_query", subject: "ly" },
  { text: "nguyen ham cua ham so sin x la gi", intent: "stem_query", subject: "toan" },
  { text: "dot bien diem va dot bien khung gen", intent: "stem_query", subject: "sinh" },
  { text: "quy tac octet trong lien ket hoa hoc", intent: "stem_query", subject: "hoa" }
];
const unseenIntentPath = path.resolve('src/ai-training/datasets/intent/unseen-test-intent.json');
fs.writeFileSync(unseenIntentPath, JSON.stringify(unseenIntentSamples, null, 2));

console.log('✅ Đã tạo xong tất cả các bộ dữ liệu mở rộng & Unseen Test Sets!');
console.log(`- Chem Risk: ${chemRiskSamples.length} mẫu train, 30 mẫu unseen test`);
console.log(`- Physics Error: ${physicsSamples.length} mẫu train, 30 mẫu unseen test`);
console.log(`- Intent Classifier: ${intentSamples.length} mẫu train (50 câu/lớp x 6 lớp), 30 mẫu unseen test`);
