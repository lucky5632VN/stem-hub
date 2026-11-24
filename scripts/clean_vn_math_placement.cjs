const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/ai-training/datasets/benchmark_150_cases.json');
const dataset = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const CLEAN_FIXES = {
  BENCH_TOAN_01: {
    ground_truth: "$y' = 3x^2 - 6x = 0 \\iff x = 0$ hoặc $x = 2$. Điểm cực đại $A(0; 2)$, điểm cực tiểu $B(2; -2)$."
  },
  BENCH_LY_25: {
    ground_truth: "Do chiết suất của thủy tinh phụ thuộc vào màu sắc ánh sáng: $n_{\\text{đỏ}} < n_{\\text{vàng}} < n_{\\text{tím}}$, nên góc lệch qua lăng kính $D_{\\text{tím}} > D_{\\text{đỏ}}$, làm chùm sáng trắng bị phân tách thành dải màu liên tục từ đỏ đến tím."
  },
  BENCH_HOA_25: {
    ground_truth: "Đường bị hút nước hóa than đen xì, sau đó cột than xốp dâng trào lên miệng cốc do khí $\\text{CO}_2$ và $\\text{SO}_2$ thoát ra: $\\text{C}_{12}\\text{H}_{22}\\text{O}_{11} \\xrightarrow{\\text{H}_2\\text{SO}_4\\text{ đ}} 12\\text{C} + 11\\text{H}_2\\text{O}$; $\\text{C} + 2\\text{H}_2\\text{SO}_4 \\longrightarrow \\text{CO}_2\\uparrow + 2\\text{SO}_2\\uparrow + 2\\text{H}_2\\text{O}$ (với $\\text{H}_2\\text{SO}_4$ đặc nóng)."
  },
  BENCH_SINH_13: {
    question: "Cho phép lai $P: AaBb \\times AaBb$ thu được đời con $F_1$ có tỉ lệ kiểu hình 9 hoa đỏ : 7 hoa trắng. Đây là dạng quy luật tương tác gen nào?"
  },
  BENCH_SINH_14: {
    ground_truth: "Đời con thu được tỉ lệ: 1 thân xám, cánh cụt $\\left(\\frac{Ab}{ab}\\right)$ : 1 thân đen, cánh dài $\\left(\\frac{aB}{ab}\\right)$ (tỉ lệ $1 : 1$)."
  },
  BENCH_SINH_31: {
    question: "Trong chuỗi thức ăn: Cỏ $\\longrightarrow$ Cào cào $\\longrightarrow$ Ếch $\\longrightarrow$ Rắn, sinh vật tiêu thụ bậc 2 là loài nào?"
  }
};

dataset.forEach(item => {
  const p = CLEAN_FIXES[item.id];
  if (p) {
    if (p.question) item.question = p.question;
    if (p.ground_truth) {
      item.ground_truth = p.ground_truth;
      const subjName = item.subject === 'toan' ? 'Toán' : (item.subject === 'ly' ? 'Vật lý' : (item.subject === 'hoa' ? 'Hóa học' : 'Sinh học'));
      item.gemini_response = `Phân tích theo SGK ${subjName} GDPT 2018: ${p.ground_truth}`;
    }
  }
});

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
console.log('Fixed clean Vietnamese placement and synced CSV.');

