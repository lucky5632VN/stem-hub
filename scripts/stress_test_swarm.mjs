import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:3000';

const USER_ACTIONS = [
  // 1. AI Chat Query
  async (userId) => {
    const questions = [
      "Este đơn chức mạch hở có công thức gì?",
      "Giải thích định luật II Newton và ứng dụng trong thực tế?",
      "Cơ chế tự nhân đôi của phân tử ADN diễn ra như thế nào?",
      "Tính đạo hàm của hàm số y = ln(x^2 + 1)?",
      "Hiện tượng cộng hưởng điện xảy ra khi nào?"
    ];
    const q = questions[userId % questions.length];
    const start = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': `student_${userId}`,
          'x-forwarded-for': `192.168.1.${10 + (userId % 60)}`
        },
        body: JSON.stringify({ message: q, history: [] }),
        signal: AbortSignal.timeout(12000)
      });
      const duration = performance.now() - start;
      return { action: 'AI_CHAT', status: res.status, duration };
    } catch (err) {
      return { action: 'AI_CHAT', status: err.name === 'TimeoutError' ? 408 : 0, error: err.message, duration: performance.now() - start };
    }
  },

  // 2. 3D Math Lab Computation
  async (userId) => {
    const mathProblems = [
      "Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh a, SA vuông góc với đáy ABCD, SA = a căn 2.",
      "Cho hình chóp tam giác đều S.ABC có cạnh đáy bằng a, góc giữa mặt bên và đáy bằng 60 độ.",
      "Cho tứ diện đều ABCD có cạnh bằng a. Tính thể tích khối tứ diện.",
      "Cho hình chóp S.ABCD có đáy là hình vuông cạnh a, SA vuông góc mặt đáy, góc giữa SC và đáy bằng 45 độ."
    ];
    const problem = mathProblems[userId % mathProblems.length];
    const start = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/api/lab-toan/generate-3d`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': `student_${userId}`,
          'x-forwarded-for': `192.168.1.${10 + (userId % 60)}`
        },
        body: JSON.stringify({ problemText: problem }),
        signal: AbortSignal.timeout(12000)
      });
      const duration = performance.now() - start;
      return { action: 'MATH_3D_LAB', status: res.status, duration };
    } catch (err) {
      return { action: 'MATH_3D_LAB', status: err.name === 'TimeoutError' ? 408 : 0, error: err.message, duration: performance.now() - start };
    }
  },

  // 3. RAG Knowledge Corpus Fetch
  async (userId) => {
    const start = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/api/learned-knowledge?onlyVerified=true&t=${Date.now()}`, {
        headers: {
          'x-user-id': `student_${userId}`,
          'x-forwarded-for': `192.168.1.${10 + (userId % 60)}`
        },
        signal: AbortSignal.timeout(5000)
      });
      const duration = performance.now() - start;
      return { action: 'RAG_FETCH', status: res.status, duration };
    } catch (err) {
      return { action: 'RAG_FETCH', status: err.name === 'TimeoutError' ? 408 : 0, error: err.message, duration: performance.now() - start };
    }
  },

  // 4. Health Check / Static Navigation
  async (userId) => {
    const start = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/api/health`, {
        headers: {
          'x-user-id': `student_${userId}`,
          'x-forwarded-for': `192.168.1.${10 + (userId % 60)}`
        },
        signal: AbortSignal.timeout(4000)
      });
      const duration = performance.now() - start;
      return { action: 'HEALTH_CHECK', status: res.status, duration };
    } catch (err) {
      return { action: 'HEALTH_CHECK', status: err.name === 'TimeoutError' ? 408 : 0, error: err.message, duration: performance.now() - start };
    }
  }
];

async function runVirtualUser(userId, requestCountPerUser) {
  const results = [];
  for (let i = 0; i < requestCountPerUser; i++) {
    // Phân bổ hành động: 40% Chat AI, 25% 3D Math Lab, 20% RAG Fetch, 15% Health Check
    const rand = Math.random();
    let actionIdx = 0;
    if (rand < 0.40) actionIdx = 0;
    else if (rand < 0.65) actionIdx = 1;
    else if (rand < 0.85) actionIdx = 2;
    else actionIdx = 3;

    const res = await USER_ACTIONS[actionIdx](userId);
    results.push(res);
    // Độ trễ suy nghĩ ngẫu nhiên giữa các thao tác của học sinh thật (50ms - 200ms)
    await new Promise(r => setTimeout(r, 50 + Math.random() * 150));
  }
  return results;
}

function calculatePercentile(array, percentile) {
  if (array.length === 0) return 0;
  const sorted = [...array].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function runWave(waveName, concurrentUsers, requestCountPerUser) {
  console.log(`\n========================================================================`);
  console.log(`🚀 [${waveName}] KHỞI CHẠY TẢI VỚI ${concurrentUsers} HỌC SINH ĐỒNG THỜI (TỔNG: ${concurrentUsers * requestCountPerUser} REQUESTS)`);
  console.log(`========================================================================`);

  const waveStart = performance.now();
  const userPromises = [];

  for (let i = 0; i < concurrentUsers; i++) {
    userPromises.push(runVirtualUser(i, requestCountPerUser));
  }

  const allUserResults = await Promise.all(userPromises);
  const waveDuration = (performance.now() - waveStart) / 1000;

  const flatResults = allUserResults.flat();
  const total = flatResults.length;

  const statusCounts = {};
  const actionStats = {};
  const latencies = [];

  for (const r of flatResults) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    latencies.push(r.duration);

    if (!actionStats[r.action]) {
      actionStats[r.action] = { total: 0, ok: 0, throttled: 0, errors: 0, latencies: [] };
    }
    actionStats[r.action].total++;
    if (r.status === 200) actionStats[r.action].ok++;
    else if (r.status === 429) actionStats[r.action].throttled++;
    else actionStats[r.action].errors++;
    actionStats[r.action].latencies.push(r.duration);
  }

  const okCount = statusCounts[200] || 0;
  const throttledCount = statusCounts[429] || 0;
  const timeoutCount = statusCounts[408] || 0;
  const serverErrorCount = (statusCounts[500] || 0) + (statusCounts[502] || 0) + (statusCounts[503] || 0);
  const connErrorCount = statusCounts[0] || 0;

  const p50 = calculatePercentile(latencies, 50).toFixed(1);
  const p95 = calculatePercentile(latencies, 95).toFixed(1);
  const p99 = calculatePercentile(latencies, 99).toFixed(1);
  const avg = (latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1)).toFixed(1);
  const rps = (total / waveDuration).toFixed(1);

  console.log(`⏱️ Thời gian hoàn tất: ${waveDuration.toFixed(2)}s | Tốc độ xử lý: ${rps} requests/giây`);
  console.log(`📊 Kết quả:`);
  console.log(`   - ✅ Thành công (HTTP 200): ${okCount}/${total} (${((okCount / total) * 100).toFixed(1)}%)`);
  if (throttledCount > 0) {
    console.log(`   - ⚡ Quá tải Rate Limit (HTTP 429): ${throttledCount} (${((throttledCount / total) * 100).toFixed(1)}%)`);
  }
  if (timeoutCount > 0) {
    console.log(`   - ⏳ Hết thời gian chờ (Timeout 408): ${timeoutCount}`);
  }
  if (serverErrorCount > 0) {
    console.log(`   - 💥 Lỗi máy chủ (HTTP 500+): ${serverErrorCount}`);
  }
  if (connErrorCount > 0) {
    console.log(`   - 🔌 Từ chối kết nối (Connection Refused): ${connErrorCount}`);
  }

  console.log(`📈 Độ trễ phản hồi (Latency):`);
  console.log(`   - Trung bình (Avg): ${avg}ms`);
  console.log(`   - Trung vị (P50):    ${p50}ms`);
  console.log(`   - 95% nhanh hơn:     ${p95}ms`);
  console.log(`   - 99% nhanh hơn:     ${p99}ms`);

  console.log(`\n📋 Chi tiết từng tính năng:`);
  for (const [action, st] of Object.entries(actionStats)) {
    const actAvg = (st.latencies.reduce((a, b) => a + b, 0) / (st.latencies.length || 1)).toFixed(1);
    const actP95 = calculatePercentile(st.latencies, 95).toFixed(1);
    console.log(`   * ${action.padEnd(14)}: ${st.ok}/${st.total} OK | Rate Limit: ${st.throttled} | Lỗi: ${st.errors} | P95: ${actP95}ms`);
  }

  return {
    waveName,
    concurrentUsers,
    total,
    okCount,
    throttledCount,
    serverErrorCount,
    timeoutCount,
    connErrorCount,
    avgLatency: avg,
    p95Latency: p95,
    rps
  };
}

async function main() {
  console.log(`========================================================================`);
  console.log(`🔥 HỆ THỐNG KIỂM THỬ TẢI ĐỒNG THỜI ĐA HỌC SINH (STRESS-TEST SWARM)`);
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Mục tiêu: Tăng tải liên tục qua 5 cấp độ để tìm ngưỡng sập và nghẽn`);
  console.log(`========================================================================`);

  const summary = [];

  // Wave 1: 5 Người dùng (Mức cơ bản)
  summary.push(await runWave('Level 1 - Nhóm học tập', 5, 5));
  await new Promise(r => setTimeout(r, 2000));

  // Wave 2: 20 Người dùng (1 Lớp học thực tế)
  summary.push(await runWave('Level 2 - Lớp học 20 học sinh', 20, 5));
  await new Promise(r => setTimeout(r, 2000));

  // Wave 3: 50 Người dùng (Giải đấu STEM cấp trường)
  summary.push(await runWave('Level 3 - Giải đấu 50 học sinh', 50, 5));
  await new Promise(r => setTimeout(r, 2000));

  // Wave 4: 100 Người dùng (Chạm ngưỡng trần Firebase Spark 100 kết nối)
  summary.push(await runWave('Level 4 - Chạm trần 100 kết nối', 100, 5));
  await new Promise(r => setTimeout(r, 2000));

  // Wave 5: 150 Người dùng (Vượt ngưỡng trần để đo mức độ quá tải)
  summary.push(await runWave('Level 5 - Quá tải 150 người dùng', 150, 5));

  console.log(`\n========================================================================`);
  console.log(`🏆 BẢNG TỔNG KẾT TĂNG TẢI QUA CÁC CẤP ĐỘ (STRESS-TEST RAMP-UP REPORT)`);
  console.log(`========================================================================`);
  console.log(`| Cấp độ | Số User | Tổng Req | Tỷ lệ 200 OK | Tỷ lệ 429 Limit | Lỗi 5xx | Độ trễ P95 | Tốc độ (RPS) |`);
  console.log(`| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |`);
  for (const s of summary) {
    const okPercent = ((s.okCount / s.total) * 100).toFixed(1) + '%';
    const limitPercent = ((s.throttledCount / s.total) * 100).toFixed(1) + '%';
    console.log(`| ${s.waveName.padEnd(28)} | ${String(s.concurrentUsers).padEnd(7)} | ${String(s.total).padEnd(8)} | ${okPercent.padEnd(12)} | ${limitPercent.padEnd(15)} | ${String(s.serverErrorCount).padEnd(7)} | ${(s.p95Latency + 'ms').padEnd(10)} | ${s.rps} |`);
  }
  console.log(`========================================================================`);
}

main().catch(console.error);

