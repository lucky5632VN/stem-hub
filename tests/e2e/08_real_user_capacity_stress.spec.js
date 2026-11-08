import { test, expect } from '@playwright/test';

test.describe('E2E Real User - 08: Kiểm Thử Sức Chứa Đa Người Dùng Thật (Concurrent Human Simulation)', () => {

  test('08.1 - Mô phỏng 10 người dùng thật đồng thời truy cập và tương tác mọi phân hệ trên web', async ({ browser }) => {
    const CONCURRENT_USERS = 10;
    const pagesToVisit = ['/', '/phong-lab', '/xep-hang', '/phong-thi', '/admin/knowledge-review'];
    
    console.log(`\n🚀 [08.1] Bắt đầu thử nghiệm sức chứa: ${CONCURRENT_USERS} người dùng thật thao tác đồng thời...`);

    const userSimulations = Array.from({ length: CONCURRENT_USERS }).map(async (_, userIdx) => {
      const userStartTime = Date.now();
      // Mỗi người dùng có một browser context riêng biệt (cookies, cache, session độc lập)
      const context = await browser.newContext({
        viewport: { width: 1280 + userIdx * 10, height: 720 },
        userAgent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) UserSimulation/${userIdx + 1}`
      });
      const page = await context.newPage();
      const userLatencies = [];

      try {
        for (const path of pagesToVisit) {
          const stepStart = Date.now();
          const response = await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 35000 });
          const stepLatency = Date.now() - stepStart;
          userLatencies.push({ path, latency: stepLatency, status: response?.status() || 0 });

          // Mô phỏng độ trễ suy nghĩ của con người (200 - 400ms)
          await page.waitForTimeout(200 + Math.random() * 200);
        }

        const totalUserDuration = Date.now() - userStartTime;
        await context.close();
        return {
          user: userIdx + 1,
          success: true,
          totalDuration: totalUserDuration,
          steps: userLatencies
        };
      } catch (err) {
        await context.close();
        return {
          user: userIdx + 1,
          success: false,
          error: err.message,
          steps: userLatencies
        };
      }
    });

    const results = await Promise.all(userSimulations);

    // Tính toán thống kê hiệu năng
    const successfulUsers = results.filter(r => r.success).length;
    const allLatencies = results.flatMap(r => r.steps.map(s => s.latency));
    const avgLatency = Math.round(allLatencies.reduce((a, b) => a + b, 0) / (allLatencies.length || 1));
    const minLatency = Math.min(...allLatencies);
    const maxLatency = Math.max(...allLatencies);

    console.log(`\n📊 [08.1 KẾT QUẢ SỨC CHỨA ĐA NGƯỜI DÙNG THẬT]:`);
    console.log(`- Số người dùng thật đồng thời: ${CONCURRENT_USERS}/${CONCURRENT_USERS} người`);
    console.log(`- Số phiên hoàn thành 100%: ${successfulUsers}/${CONCURRENT_USERS} (${(successfulUsers / CONCURRENT_USERS * 100).toFixed(1)}%)`);
    console.log(`- Tổng số lượt tải trang thực hiện: ${allLatencies.length} lượt`);
    console.log(`- Độ trễ trung bình: ${avgLatency} ms (Nhanh nhất: ${minLatency} ms | Chậm nhất: ${maxLatency} ms)`);

    expect(successfulUsers).toBeGreaterThanOrEqual(8);
    expect(avgLatency).toBeLessThan(10000);
  });

  test('08.2 - Tăng tải lên 15 người dùng thật đồng thời: Xác định ngưỡng giới hạn chịu tải', async ({ browser }) => {
    test.setTimeout(90000);
    const CONCURRENT_USERS = 15;
    const pagesToVisit = ['/', '/phong-lab', '/xep-hang', '/phong-thi'];
    
    console.log(`\n🔥 [08.2] Tăng áp lực tải: ${CONCURRENT_USERS} người dùng thật thao tác đồng thời...`);

    const userSimulations = Array.from({ length: CONCURRENT_USERS }).map(async (_, userIdx) => {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) UserLoadStress/${userIdx + 1}`
      });
      const page = await context.newPage();
      const userLatencies = [];

      try {
        for (const path of pagesToVisit) {
          const stepStart = Date.now();
          const response = await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 35000 });
          const stepLatency = Date.now() - stepStart;
          userLatencies.push({ path, latency: stepLatency, status: response?.status() || 0 });
          await page.waitForTimeout(100 + Math.random() * 150);
        }

        await context.close();
        return { user: userIdx + 1, success: true, steps: userLatencies };
      } catch (err) {
        await context.close();
        return { user: userIdx + 1, success: false, error: err.message, steps: userLatencies };
      }
    });

    const results = await Promise.all(userSimulations);
    const successfulUsers = results.filter(r => r.success).length;
    const allLatencies = results.flatMap(r => r.steps.map(s => s.latency));
    const avgLatency = Math.round(allLatencies.reduce((a, b) => a + b, 0) / (allLatencies.length || 1));
    const minLatency = Math.min(...allLatencies);
    const maxLatency = Math.max(...allLatencies);

    console.log(`\n📊 [08.2 KẾT QUẢ TẢI 15 NGƯỜI DÙNG THẬT]:`);
    console.log(`- Số người dùng hoàn thành: ${successfulUsers}/${CONCURRENT_USERS} (${(successfulUsers / CONCURRENT_USERS * 100).toFixed(1)}%)`);
    console.log(`- Tổng số yêu cầu trình duyệt: ${allLatencies.length} requests`);
    console.log(`- Độ trễ trung bình: ${avgLatency} ms (Min: ${minLatency} ms | Max: ${maxLatency} ms)`);

    expect(successfulUsers).toBeGreaterThanOrEqual(10);
  });

});

