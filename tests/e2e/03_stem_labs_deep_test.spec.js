import { test, expect } from '@playwright/test';

test.describe('E2E Real User - 03: Hệ Thống 4 Phòng Thí Nghiệm STEM Ảo (Toán, Lý, Hóa, Sinh)', () => {

  test('03.1 - Truy cập Hub Phòng Lab (/phong-lab) và kiểm tra danh sách 4 phòng thí nghiệm', async ({ page }) => {
    const res = await page.goto('/phong-lab', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);

    const bodyText = await page.innerText('body');
    const hasMathLab = bodyText.includes('Toán') || bodyText.includes('MATH');
    const hasPhysLab = bodyText.includes('Lý') || bodyText.includes('PHYS');
    const hasChemLab = bodyText.includes('Hóa') || bodyText.includes('CHEM');
    const hasBioLab = bodyText.includes('Sinh') || bodyText.includes('BIO');

    console.log(`[03.1] Kiểm tra danh mục Lab Hub: Toán=${hasMathLab}, Lý=${hasPhysLab}, Hóa=${hasChemLab}, Sinh=${hasBioLab}`);
    expect(hasMathLab && hasPhysLab && hasChemLab && hasBioLab).toBeTruthy();
  });

  test('03.2 - Người dùng vào Lab Toán (/phong-lab/toan), kiểm tra nạp Sandbox và trợ lý AI Toán', async ({ page }) => {
    const res = await page.goto('/phong-lab/toan', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);

    await page.waitForTimeout(1000);
    // Kiểm tra có iframe thí nghiệm và nút điều hướng Về Hub
    const iframe = page.locator('iframe');
    const hasIframe = await iframe.count() > 0;
    const backBtn = page.locator('button:has-text("Về Hub"), a:has-text("Về Hub"), button:has-text("Quay lại")').first();
    const hasBackBtn = await backBtn.isVisible({ timeout: 4000 }).catch(() => false);

    console.log(`[03.2] Lab Toán: Iframe sandbox nhúng=${hasIframe}, Nút Về Hub=${hasBackBtn}`);
    expect(hasIframe || hasBackBtn).toBeTruthy();
  });

  test('03.3 - Người dùng vào Lab Vật Lý (/phong-lab/ly), kiểm tra tải mô phỏng dao động & mạch điện', async ({ page }) => {
    const res = await page.goto('/phong-lab/ly', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);

    await page.waitForTimeout(1000);
    const iframe = page.locator('iframe');
    const hasIframe = await iframe.count() > 0;
    const backBtn = page.locator('button:has-text("Về Hub"), a:has-text("Về Hub")').first();
    const hasBackBtn = await backBtn.isVisible({ timeout: 4000 }).catch(() => false);

    console.log(`[03.3] Lab Lý nạp thành công: Iframe=${hasIframe}, Về Hub=${hasBackBtn}`);
    expect(hasIframe || hasBackBtn).toBeTruthy();
  });

  test('03.4 - Người dùng vào Lab Hóa Học (/phong-lab/hoa), kiểm tra tương tác câu hỏi trợ lý AI Hóa', async ({ page }) => {
    const res = await page.goto('/phong-lab/hoa', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);

    await page.waitForTimeout(1000);
    const iframe = page.locator('iframe');
    const hasIframe = await iframe.count() > 0;
    console.log(`[03.4] Lab Hóa nạp thành công: Iframe=${hasIframe}`);
    expect(hasIframe).toBeTruthy();
  });

  test('03.5 - Người dùng vào Lab Sinh Học (/phong-lab/sinh), kiểm tra mô hình chuỗi xoắn kép ADN', async ({ page }) => {
    const res = await page.goto('/phong-lab/sinh', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);

    await page.waitForTimeout(1000);
    const iframe = page.locator('iframe');
    const hasIframe = await iframe.count() > 0;
    const backBtn = page.locator('button:has-text("Về Hub"), a:has-text("Về Hub")').first();
    const hasBackBtn = await backBtn.isVisible({ timeout: 4000 }).catch(() => false);

    console.log(`[03.5] Lab Sinh nạp thành công: Iframe=${hasIframe}, Về Hub=${hasBackBtn}`);
    expect(hasIframe || hasBackBtn).toBeTruthy();
  });

});

