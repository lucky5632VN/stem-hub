import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:3000';

// Bộ hành động mô phỏng toàn bộ trải nghiệm học sinh trên website
const ALL_PAGE_ACTIONS = [
  // 1. Tải Trang chủ (Landing Page)
  async (uid) => {
    const s = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/`, {
        headers: { 'x-user-id': `student_${uid}` },
        signal: AbortSignal.timeout(4000)
      });
      return { feature: 'Trang chủ (Home)', status: res.status, duration: performance.now() - s };
    } catch (e) {
      return { feature: 'Trang chủ (Home)', status: e.name === 'TimeoutError' ? 408 : 0, duration: performance.now() - s };
    }
  },

  // 2. Tải Tổng quan Phòng Lab STEM
  async (uid) => {
    const s = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/phong-lab`, {
        headers: { 'x-user-id': `student_${uid}` },
        signal: AbortSignal.timeout(4000)
      });
      return { feature: 'Phòng Lab (Tổng quan)', status: res.status, duration: performance.now() - s };
    } catch (e) {
      return { feature: 'Phòng Lab (Tổng quan)', status: e.name === 'TimeoutError' ? 408 : 0, duration: performance.now() - s };
    }
  },

  // 3. Tải Phòng Lab Vật lý 3D
  async (uid) => {
    const s = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/phong-lab/ly`, {
        headers: { 'x-user-id': `student_${uid}` },
        signal: AbortSignal.timeout(4000)
      });
      return { feature: 'Lab Vật Lý 3D', status: res.status, duration: performance.now() - s };
    } catch (e) {
      return { feature: 'Lab Vật Lý 3D', status: e.name === 'TimeoutError' ? 408 : 0, duration: performance.now() - s };
    }
  },

  // 4. Tải Phòng Lab Hóa học 3D
  async (uid) => {
    const s = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/phong-lab/hoa`, {
        headers: { 'x-user-id': `student_${uid}` },
        signal: AbortSignal.timeout(4000)
      });
      return { feature: 'Lab Hóa Học 3D', status: res.status, duration: performance.now() - s };
    } catch (e) {
      return { feature: 'Lab Hóa Học 3D', status: e.name === 'TimeoutError' ? 408 : 0, duration: performance.now() - s };
    }
  },

  // 5. Tải Phòng Lab Sinh học 3D
  async (uid) => {
    const s = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/phong-lab/sinh`, {
        headers: { 'x-user-id': `student_${uid}` },
        signal: AbortSignal.timeout(4000)
      });
      return { feature: 'Lab Sinh Học 3D', status: res.status, duration: performance.now() - s };
    } catch (e) {
      return { feature: 'Lab Sinh Học 3D', status: e.name === 'TimeoutError' ? 408 : 0, duration: performance.now() - s };
    }
  },

  // 6. Tải Phòng Lab Toán Không Gian 3D
  async (uid) => {
    const s = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/phong-lab/toan`, {
        headers: { 'x-user-id': `student_${uid}` },
        signal: AbortSignal.timeout(4000)
      });
      return { feature: 'Lab Toán Hình Không Gian', status: res.status, duration: performance.now() - s };
    } catch (e) {
      return { feature: 'Lab Toán Hình Không Gian', status: e.name === 'TimeoutError' ? 408 : 0, duration: performance.now() - s };
    }
  },

  // 7. Phòng Thi Trắc Nghiệm STEM
  async (uid) => {
    const s = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/phong-thi`, {
        headers: { 'x-user-id': `student_${uid}` },
        signal: AbortSignal.timeout(4000)
      });
      return { feature: 'Phòng Thi Trắc Nghiệm', status: res.status, duration: performance.now() - s };
    } catch (e) {
      return { feature: 'Phòng Thi Trắc Nghiệm', status: e.name === 'TimeoutError' ? 408 : 0, duration: performance.now() - s };
    }
  },

  // 8. Đấu Trường Kiến Thức 1v1
  async (uid) => {
    const s = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/dau-truong`, {
        headers: { 'x-user-id': `student_${uid}` },
        signal: AbortSignal.timeout(4000)
      });
      return { feature: 'Đấu Trường 1v1', status: res.status, duration: performance.now() - s };
    } catch (e) {
      return { feature: 'Đấu Trường 1v1', status: e.name === 'TimeoutError' ? 408 : 0, duration: performance.now() - s };
    }
  },

  // 9. Bảng Xếp Hạng Elo & Điểm Số
  async (uid) => {
    const s = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/xep-hang`, {
        headers: { 'x-user-id': `student_${uid}` },
        signal: AbortSignal.timeout(4000)
      });
      return { feature: 'Bảng Xếp Hạng', status: res.status, duration: performance.now() - s };
    } catch (e) {
      return { feature: 'Bảng Xếp Hạng', status: e.name === 'TimeoutError' ? 408 : 0, duration: performance.now() - s };
    }
  },

  // 10. Hồ Sơ Học Sinh & Huy Hiệu
  async (uid) => {
    const s = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/ho-so`, {
        headers: { 'x-user-id': `student_${uid}` },
        signal: AbortSignal.timeout(4000)
      });
      return { feature: 'Hồ Sơ Học Sinh', status: res.status, duration: performance.now() - s };
    } catch (e) {
      return { feature: 'Hồ Sơ Học Sinh', status: e.name === 'TimeoutError' ? 408 : 0, duration: performance.now() - s };
    }
  },

  // 11. Truyện Khoa Học Tương Tác
  async (uid) => {
    const s = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/story`, {
        headers: { 'x-user-id': `student_${uid}` },
        signal: AbortSignal.timeout(4000)
      });
      return { feature: 'Truyện STEM Tương Tác', status: res.status, duration: performance.now() - s };
    } catch (e) {
      return { feature: 'Truyện STEM Tương Tác', status: e.name === 'TimeoutError' ? 408 : 0, duration: performance.now() - s };
    }
  },

  // 12. Gửi Phản Hồi / Liên Hệ (API Contact)
  async (uid) => {
    const s = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': `student_${uid}`
        },
        body: JSON.stringify({
          name: `Học sinh ${uid}`,
          email: `student_${uid}@school.edu.vn`,
          userId: `student_${uid}`,
          subject: 'Góp ý về phòng thí nghiệm',
          message: `Em thấy thí nghiệm Vật lý rất trực quan và dễ hiểu!`
        }),
        signal: AbortSignal.timeout(5000)
      });
      return { feature: 'Gửi Liên Hệ (API Contact)', status: res.status, duration: performance.now() - s };
    } catch (e) {
      return { feature: 'Gửi Liên Hệ (API Contact)', status: e.name === 'TimeoutError' ? 408 : 0, duration: performance.now() - s };
    }
  },

  // 13. Hỏi đáp Trợ Lý AI Chatbot
  async (uid) => {
    const questions = [
      "Este đơn chức mạch hở có công thức tổng quát là gì?",
      "Nêu ý nghĩa định luật II Newton?",
      "Cấu trúc không gian của chuỗi xoắn kép ADN?",
      "Tính đạo hàm của y = sin(2x)?",
      "Điều kiện xảy ra cộng hưởng điện xoay chiều?"
    ];
    const q = questions[uid % questions.length];
    const s = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': `student_${uid}`
        },
        body: JSON.stringify({ message: q }),
        signal: AbortSignal.timeout(10000)
      });
      return { feature: 'AI Chatbot Trợ Lý', status: res.status, duration: performance.now() - s };
    } catch (e) {
      return { feature: 'AI Chatbot Trợ Lý', status: e.name === 'TimeoutError' ? 408 : 0, duration: performance.now() - s };
    }
  },

  // 14. Gia sư Toán AI (Chat Tutor)
  async (uid) => {
    const s = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/api/lab-toan/chat-tutor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': `student_${uid}`
        },
        body: JSON.stringify({
          userText: "Làm thế nào để tính khoảng cách từ điểm đến mặt phẳng?",
          chatHistory: []
        }),
        signal: AbortSignal.timeout(10000)
      });
      return { feature: 'Gia Sư Toán AI (Chat Tutor)', status: res.status, duration: performance.now() - s };
    } catch (e) {
      return { feature: 'Gia Sư Toán AI (Chat Tutor)', status: e.name === 'TimeoutError' ? 408 : 0, duration: performance.now() - s };
    }
  },

  // 15. Dựng Hình Học Không Gian 3D (Generate 3D)
  async (uid) => {
    const problems = [
      "Cho hình chóp S.ABCD đáy hình vuông cạnh a, SA vuông góc đáy.",
      "Cho hình chóp tam giác đều S.ABC cạnh đáy a, góc 60 độ.",
      "Cho khối tứ diện đều ABCD cạnh a.",
      "Cho lăng trụ đứng ABC.A'B'C' đáy tam giác vuông tại A."
    ];
    const problem = problems[uid % problems.length];
    const s = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/api/lab-toan/generate-3d`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': `student_${uid}`
        },
        body: JSON.stringify({ problemText: problem }),
        signal: AbortSignal.timeout(10000)
      });
      return { feature: 'Dựng Khối Toán 3D', status: res.status, duration: performance.now() - s };
    } catch (e) {
      return { feature: 'Dựng Khối Toán 3D', status: e.name === 'TimeoutError' ? 408 : 0, duration: performance.now() - s };
    }
  },

  // 16. Tra Cứu Kho Tri Thức RAG
  async (uid) => {
    const s = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/api/learned-knowledge?onlyVerified=true&t=${Date.now()}`, {
        headers: { 'x-user-id': `student_${uid}` },
        signal: AbortSignal.timeout(4000)
      });
      return { feature: 'Kho Tri Thức Tự Học RAG', status: res.status, duration: performance.now() - s };
    } catch (e) {
      return { feature: 'Kho Tri Thức Tự Học RAG', status: e.name === 'TimeoutError' ? 408 : 0, duration: performance.now() - s };
    }
  },

  // 17. Health Check
  async (uid) => {
    const s = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/api/health`, {
        headers: { 'x-user-id': `student_${uid}` },
        signal: AbortSignal.timeout(3000)
      });
      return { feature: 'Health Check API', status: res.status, duration: performance.now() - s };
    } catch (e) {
      return { feature: 'Health Check API', status: e.name === 'TimeoutError' ? 408 : 0, duration: performance.now() - s };
    }
  }
];

function calculatePercentile(array, percentile) {
  if (array.length === 0) return 0;
  const sorted = [...array].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function simulateRealStudentUser(studentId, stepsPerStudent) {
  const results = [];
  for (let s = 0; s < stepsPerStudent; s++) {
    // Chọn ngẫu nhiên tính năng để giả lập các hành vi đa dạng của học sinh
    const actIdx = Math.floor(Math.random() * ALL_PAGE_ACTIONS.length);
    const res = await ALL_PAGE_ACTIONS[actIdx](studentId);
    results.push(res);
    await new Promise(r => setTimeout(r, 40 + Math.random() * 120));
  }
  return results;
}

async function runComprehensiveStressTest(studentCount, stepsPerStudent) {
  console.log(`\n========================================================================`);
  console.log(`🌐 KIỂM THỬ TẢI TOÀN BỘ TÍNH NĂNG TRANG WEB (${studentCount} HỌC SINH ĐỒNG THỜI)`);
  console.log(`   Số tác vụ mỗi học sinh: ${stepsPerStudent} | Tổng cộng: ${studentCount * stepsPerStudent} requests`);
  console.log(`========================================================================`);

  const start = performance.now();
  const promises = [];
  for (let i = 0; i < studentCount; i++) {
    promises.push(simulateRealStudentUser(i, stepsPerStudent));
  }

  const allResults = await Promise.all(promises);
  const totalDuration = (performance.now() - start) / 1000;
  const flat = allResults.flat();
  const total = flat.length;

  const stats = {};
  const latencies = [];

  for (const r of flat) {
    latencies.push(r.duration);
    if (!stats[r.feature]) {
      stats[r.feature] = { total: 0, ok: 0, rateLimited: 0, errors: 0, latencies: [] };
    }
    stats[r.feature].total++;
    if (r.status === 200) stats[r.feature].ok++;
    else if (r.status === 429) stats[r.feature].rateLimited++;
    else stats[r.feature].errors++;
    stats[r.feature].latencies.push(r.duration);
  }

  const okTotal = flat.filter(r => r.status === 200).length;
  const errorTotal = flat.filter(r => r.status >= 500).length;
  const rateLimitTotal = flat.filter(r => r.status === 429).length;

  const avg = (latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1)).toFixed(1);
  const p95 = calculatePercentile(latencies, 95).toFixed(1);
  const rps = (total / totalDuration).toFixed(1);

  console.log(`⏱️ Thời gian thực thi: ${totalDuration.toFixed(2)}s | Tốc độ xử lý: ${rps} requests/giây`);
  console.log(`📊 Tổng quan:`);
  console.log(`   - ✅ Thành công (HTTP 200): ${okTotal}/${total} (${((okTotal / total) * 100).toFixed(1)}%)`);
  console.log(`   - ⚡ Quá tải Rate Limit (HTTP 429): ${rateLimitTotal}`);
  console.log(`   - 💥 Lỗi máy chủ (HTTP 500+): ${errorTotal}`);
  console.log(`   - 📈 Độ trễ trung bình: ${avg}ms | P95: ${p95}ms`);

  console.log(`\n📋 Kết quả chi tiết trên từng tính năng:`);
  console.log(`| Tính năng | Đạt / Tổng | Tỷ lệ OK | P95 Latency | Trạng thái |`);
  console.log(`| :--- | :---: | :---: | :---: | :---: |`);
  for (const [feat, st] of Object.entries(stats)) {
    const actP95 = calculatePercentile(st.latencies, 95).toFixed(1);
    const okPct = ((st.ok / st.total) * 100).toFixed(1) + '%';
    const tag = st.ok === st.total ? '✅ Hoàn hảo' : (st.ok / st.total > 0.9 ? '⚠️ Tốt' : '❌ Cần xem lại');
    console.log(`| ${feat.padEnd(28)} | ${String(st.ok).padStart(3)} / ${String(st.total).padEnd(3)} | ${okPct.padEnd(8)} | ${(actP95 + 'ms').padEnd(11)} | ${tag} |`);
  }
}

async function main() {
  console.log(`========================================================================`);
  console.log(`🚀 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN MỌI CHỨC NĂNG CỦA HỆ THỐNG STEM HUB`);
  console.log(`========================================================================`);

  // Giai đoạn 1: 30 học sinh đồng thời sử dụng mọi tính năng (tương đương 1 phòng máy)
  await runComprehensiveStressTest(30, 8);
  await new Promise(r => setTimeout(r, 2000));

  // Giai đoạn 2: 70 học sinh đồng thời (tương đương 2 lớp thi cùng lúc)
  await runComprehensiveStressTest(70, 8);
}

main().catch(console.error);

