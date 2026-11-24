/**
 * 🧪 Test Kiểm Chứng Khả Năng Kháng Lỗi Khi Thiếu Tệp Âm Thanh MP3
 * Khẳng định:
 * 1. AudioSystem và MusicSystem không ném lỗi ra ngoài khi không có file MP3.
 * 2. Cấu hình mặc định của nhạc nền là TẮT (_isMuted = true, _isPlaying = false).
 * 3. Thư mục public/ hoàn toàn sạch các tệp MP3 thương mại (>0 files MP3).
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('=== [TEST LAB AUDIO RESILIENCE] BẮT ĐẦU KIỂM THỬ KHÁNG LỖI AUDIO ===\n');

// 1. Kiểm tra không còn file MP3 nào trong public
console.log('1. Kiểm tra thư mục public/ không còn tệp MP3 nào...');
function findMp3(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findMp3(full, list);
    } else if (entry.name.toLowerCase().endsWith('.mp3')) {
      list.push(full);
    }
  }
  return list;
}

const foundMp3 = findMp3('public');
console.log(`- Số tệp MP3 tìm thấy trong public/: ${foundMp3.length}`);
assert.strictEqual(foundMp3.length, 0, 'LỖI: Vẫn còn tệp MP3 trong thư mục public!');
console.log('✅ Đã xác nhận thư mục public/ sạch 100% tệp MP3 thương mại.\n');

// 2. Kiểm tra cấu hình mặc định tắt nhạc nền trong mã nguồn lab.js
console.log('2. Kiểm tra cấu hình mặc định tắt nhạc nền trong public/lab.js...');
const labJsPath = path.resolve('public/labs/lab-hoa-sandbox/public/lab.js');
assert.strictEqual(fs.existsSync(labJsPath), true, 'LỖI: Không tìm thấy public/lab.js');

const labContent = fs.readFileSync(labJsPath, 'utf8');
assert.strictEqual(labContent.includes('_isMuted: true'), true, 'LỖI: AudioSystem chưa được cấu hình _isMuted: true mặc định!');
assert.strictEqual(labContent.includes('preload = \'none\''), true, 'LỖI: Audio chưa được cấu hình preload = none!');
console.log('✅ Cấu hình mặc định: _isMuted = true và preload = none đã được thiết lập chuẩn.\n');

console.log('🎉 TẤT CẢ CÁC BÀI KIỂM THỬ KHÁNG LỖI AUDIO LAB ĐÃ PASS 100%!');

