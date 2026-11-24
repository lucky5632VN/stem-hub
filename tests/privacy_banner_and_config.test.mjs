/**
 * 🧪 tests/privacy_banner_and_config.test.mjs
 * Kiểm thử tính nhất quán của cấu hình duy nhất (Single Source of Truth)
 * cho Nhật ký AI và Nội dung Banner UI:
 * 1. Môi trường Production mặc định (không đặt biến): Nhật ký TẮT (true), banner thông báo "không lưu".
 * 2. Môi trường Production khi đặt DISABLE_AI_REASONING_LOG='false': Nhật ký BẬT (false), banner thông báo "lưu 7 ngày".
 * 3. Môi trường Development mặc định: Nhật ký BẬT (false).
 * 4. Môi trường Development khi đặt DISABLE_AI_REASONING_LOG='true': Nhật ký TẮT (true).
 */

import assert from 'assert';
import { getReasoningLogConfig } from '../src/lib/systemConfig.js';

console.log('========================================================================');
console.log('🛡️ KIỂM THỬ NGUỒN CẤU HÌNH DUY NHẤT & BANNER GIAO DIỆN');
console.log('========================================================================\n');

// 1. Production mặc định (không đặt biến)
const prodDefault = getReasoningLogConfig({ NODE_ENV: 'production' });
assert.strictEqual(prodDefault.isLogDisabled, true, 'Prod mặc định phải tắt log (true)');
assert.strictEqual(prodDefault.bannerText, 'Hệ thống không lưu nhật ký câu hỏi.');
console.log('✅ [PASS] 1. Production mặc định -> isLogDisabled: true, banner: "Hệ thống không lưu nhật ký câu hỏi."');

// 2. Production đặt DISABLE_AI_REASONING_LOG='false'
const prodExplicitFalse = getReasoningLogConfig({ NODE_ENV: 'production', DISABLE_AI_REASONING_LOG: 'false' });
assert.strictEqual(prodExplicitFalse.isLogDisabled, false, 'Prod khi đặt false phải bật log (false)');
assert.strictEqual(prodExplicitFalse.bannerText, 'Hệ thống lưu ẩn danh câu hỏi rút gọn trong 7 ngày.');
console.log('✅ [PASS] 2. Production đặt false -> isLogDisabled: false, banner: "Hệ thống lưu ẩn danh câu hỏi rút gọn trong 7 ngày."');

// 3. Development mặc định (không đặt biến)
const devDefault = getReasoningLogConfig({ NODE_ENV: 'development' });
assert.strictEqual(devDefault.isLogDisabled, false, 'Dev mặc định phải bật log (false)');
assert.strictEqual(devDefault.bannerText, 'Hệ thống lưu ẩn danh câu hỏi rút gọn trong 7 ngày.');
console.log('✅ [PASS] 3. Development mặc định -> isLogDisabled: false, banner: "Hệ thống lưu ẩn danh câu hỏi rút gọn trong 7 ngày."');

// 4. Development đặt DISABLE_AI_REASONING_LOG='true'
const devExplicitTrue = getReasoningLogConfig({ NODE_ENV: 'development', DISABLE_AI_REASONING_LOG: 'true' });
assert.strictEqual(devExplicitTrue.isLogDisabled, true, 'Dev khi đặt true phải tắt log (true)');
assert.strictEqual(devExplicitTrue.bannerText, 'Hệ thống không lưu nhật ký câu hỏi.');
console.log('✅ [PASS] 4. Development đặt true -> isLogDisabled: true, banner: "Hệ thống không lưu nhật ký câu hỏi."');

// 5. Kiểm tra câu thông báo kèm theo luôn cố định
assert.strictEqual(prodDefault.noticeText, 'Dữ liệu được xử lý qua dịch vụ Gemini của Google; không nhập thông tin cá nhân.');
console.log('✅ [PASS] 5. Câu khuyến cáo Google Gemini luôn hiện diện và chính xác.\n');

console.log('🎉 TẤT CẢ CÁC TRẠNG THÁI CẤU HÌNH VÀ BANNER ĐỀU ĐẠT CHUẨN!\n');

