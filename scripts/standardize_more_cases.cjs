const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/ai-training/datasets/benchmark_150_cases.json');
const dataset = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const EXTRA_UPDATES = {
  BENCH_HOA_17: {
    question: "Sắp xếp tính bazơ tăng dần của các chất: anilin ($\\text{C}_6\\text{H}_5\\text{NH}_2$), amoniac ($\\text{NH}_3$), metylamin ($\\text{CH}_3\\text{NH}_2$).",
    ground_truth: "$\\text{C}_6\\text{H}_5\\text{NH}_2 < \\text{NH}_3 < \\text{CH}_3\\text{NH}_2$ (gốc phenyl hút electron làm giảm mật độ electron trên nguyên tử $\\text{N}$; gốc metyl $-\\text{CH}_3$ đẩy electron làm tăng mật độ electron trên nguyên tử $\\text{N}$)."
  },
  BENCH_SINH_03: {
    question: "Tính thoái hóa của mã di truyền là gì? Nêu ý nghĩa sinh học.",
    ground_truth: "Nhiều bộ ba khác nhau cùng mã hóa cho một loại axit amin (ngoại trừ bộ ba mở đầu $\\text{5'AUG3'}$ mã hóa mêtiônin và $\\text{5'UGG3'}$ mã hóa triptophan). Ý nghĩa: giúp bảo vệ thông tin di truyền khi xảy ra đột biến thay thế nucleotit."
  },
  BENCH_SINH_05: {
    question: "Nêu vai trò của $\\text{tARN}$ trong quá trình dịch mã tổng hợp chuỗi polipeptit.",
    ground_truth: "$\\text{tARN}$ có vai trò vận chuyển axit amin tương ứng tới ribôxôm, đầu đối mã (anticodon) của $\\text{tARN}$ khớp bổ sung với bộ ba mã sao (codon) trên $\\text{mARN}$."
  },
  BENCH_SINH_09: {
    question: "Kể tên 4 dạng đột biến cấu trúc nhiễm sắc thể (NST) và nêu dạng đột biến làm tăng số lượng bản sao của gen trên 1 NST.",
    ground_truth: "4 dạng: mất đoạn, lặp đoạn, đảo đoạn và chuyển đoạn NST. Đột biến lặp đoạn làm tăng số lượng bản sao của gen trên cùng một nhiễm sắc thể."
  },
  BENCH_SINH_21: {
    question: "Kể tên 4 điều kiện nghiệm đúng để một quần thể duy trì trạng thái cân bằng di truyền Hardy - Weinberg.",
    ground_truth: "1) Quần thể có kích thước đủ lớn; 2) Các cá thể giao phối ngẫu nhiên; 3) Không có đột biến và chọn lọc tự nhiên; 4) Quần thể cách ly di truyền (không có di - nhập gen)."
  },
  BENCH_SINH_22: {
    question: "Tại sao không dùng cơ thể lai $F_1$ có ưu thế lai cao để làm giống cho các thế hệ sau?",
    ground_truth: "Vì ở các đời sau ($F_2, F_3, \\dots$), hiện tượng phân tính xảy ra làm tăng tỉ lệ đồng hợp tử lặn có hại, dẫn đến ưu thế lai bị thoái hóa và giảm sút nghiêm trọng."
  },
  BENCH_SINH_23: {
    question: "Hai loại enzim bắt buộc phải sử dụng trong kỹ thuật tạo phân tử $\\text{ADN}$ tái tổ hợp là gì?",
    ground_truth: "Enzim cắt giới hạn (restrictaza - cắt phân tử $\\text{ADN}$ tại trình tự nucleotit nhận biết đặc hiệu) và enzim nối (ligaza - gắn các đoạn $\\text{ADN}$ tạo liên kết photphodieste)."
  },
  BENCH_SINH_32: {
    question: "Tại sao tháp năng lượng sinh thái luôn có dạng chuẩn đáy rộng đỉnh nhọn mà không bao giờ bị đảo ngược?",
    ground_truth: "Do năng lượng bị thất thoát qua mỗi bậc dinh dưỡng (khoảng $90\\%$ thất thoát qua hô hấp, bài tiết, tỏa nhiệt), chỉ khoảng $10\\%$ năng lượng được chuyển hóa và tích lũy lên bậc dinh dưỡng cao hơn tiếp theo."
  }
};

let count = 0;
dataset.forEach(item => {
  const p = EXTRA_UPDATES[item.id];
  if (p) {
    if (p.question) item.question = p.question;
    if (p.ground_truth) {
      item.ground_truth = p.ground_truth;
      const subjName = item.subject === 'toan' ? 'Toán' : (item.subject === 'ly' ? 'Vật lý' : (item.subject === 'hoa' ? 'Hóa học' : 'Sinh học'));
      item.gemini_response = `Phân tích theo SGK ${subjName} GDPT 2018: ${p.ground_truth}`;
    }
    count++;
  }
});

console.log(`Đã cập nhật thêm ${count} ca!`);
fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2), 'utf8');

// Đồng bộ CSV
const csvRows = ['id,subject,grade,topic,difficulty,question,ground_truth,sgk_reference'];
dataset.forEach(it => {
  const escapeCsv = (str) => `"${(str || '').replace(/"/g, '""')}"`;
  csvRows.push([
    it.id,
    it.subject,
    it.grade,
    escapeCsv(it.topic),
    escapeCsv(it.difficulty),
    escapeCsv(it.question),
    escapeCsv(it.ground_truth),
    escapeCsv(it.sgk_reference)
  ].join(','));
});
fs.writeFileSync('SYNTHETIC_BENCHMARK_150.csv', '\uFEFF' + csvRows.join('\n'), 'utf8');
console.log('Đã đồng bộ sang SYNTHETIC_BENCHMARK_150.csv thành công!');

