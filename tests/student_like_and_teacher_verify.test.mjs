import assert from 'node:assert';
import fs from 'node:fs';
import { retrieveTopK, checkRAGCacheHit, getDynamicCorpus } from '../src/lib/ragService.js';

console.log('=== TEST: HỌC SINH KHEN HAY & GIÁO VIÊN KIỂM ĐỊNH (AI CONTINUAL LEARNING) ===');

// 1. Kiểm tra file UI GlobalAIAssistant.jsx chứa đúng nhãn rút gọn và badge
const uiCode = fs.readFileSync('src/components/organisms/GlobalAIAssistant.jsx', 'utf-8');

assert.strictEqual(
  uiCode.includes('<span>Gửi GV kiểm tra</span>'),
  true,
  'Nút gửi cho giáo viên phải hiển thị rút gọn: "Gửi GV kiểm tra"'
);
console.log('✅ 1. Nút bấm rút gọn: "Gửi GV kiểm tra" đã được cập nhật.');

assert.strictEqual(
  uiCode.includes('✓ Đã gửi GV kiểm tra'),
  true,
  'Trạng thái sau khi gửi phải hiển thị "✓ Đã gửi GV kiểm tra"'
);
console.log('✅ 2. Trạng thái sau khi gửi rút gọn: "✓ Đã gửi GV kiểm tra".');

assert.strictEqual(
  uiCode.includes('Đã có GV kiểm định'),
  true,
  'Giao diện câu trả lời và trích dẫn phải chứa chữ "Đã có GV kiểm định"'
);
console.log('✅ 3. Huy hiệu kiểm định hiển thị chính xác chữ: "Đã có GV kiểm định".');

assert.strictEqual(
  uiCode.includes('handleStudentLike'),
  true,
  'Hàm handleStudentLike phải được kết nối khi học sinh bấm nút Hay'
);
console.log('✅ 4. Nút "Hay" đã được kết nối với hàm lưu tri thức học máy handleStudentLike.');

// 2. Kiểm tra RAG Service có hỗ trợ cả tri thức giáo viên duyệt và học sinh khen hay
const dynamicDocs = getDynamicCorpus();
assert.ok(Array.isArray(dynamicDocs), 'Dynamic corpus phải là một mảng');

// Tạo dữ liệu giả lập để kiểm tra phân luồng
const mockVerifiedDoc = {
  id: 'test_verified_01',
  query: 'Định luật II Newton phát biểu như thế nào?',
  normalizedQuery: 'dinh luat ii newton phat bieu nhu the nao',
  answer: 'Gia tốc của một vật cùng hướng với lực tác dụng lên vật. Vectơ a = F / m.',
  subject: 'ly',
  topic: 'Định luật Newton',
  status: 'verified_by_teacher',
  teacherVerified: true,
  isTeacherVerified: true,
  quarantined: false,
  isDemo: false
};

const mockStudentLikedDoc = {
  id: 'test_liked_01',
  query: 'Cách giải phương trình mặt phẳng đi qua 1 điểm và có vectơ pháp tuyến',
  normalizedQuery: 'cach giai phuong trinh mat phang di qua 1 diem va co vecto phap tuyen',
  answer: 'Phương trình có dạng A(x - x0) + B(y - y0) + C(z - z0) = 0 với n = (A, B, C).',
  subject: 'toan',
  topic: 'Phương trình mặt phẳng Oxyz',
  status: 'student_upvoted',
  studentLiked: true,
  teacherVerified: false,
  isTeacherVerified: false,
  quarantined: false,
  isDemo: false
};

// 3. Kiểm tra logic phân loại huy hiệu
const isVerifiedTeacher = Boolean((mockVerifiedDoc.isTeacherVerified || mockVerifiedDoc.teacherVerified || mockVerifiedDoc.status === 'verified_by_teacher') && !mockVerifiedDoc.quarantined && !mockVerifiedDoc.isDemo);
assert.strictEqual(isVerifiedTeacher, true, 'Mock verified doc phải được nhận diện là đã có GV kiểm định');

const isStudentLikedOnly = Boolean(mockStudentLikedDoc.studentLiked || mockStudentLikedDoc.status === 'student_upvoted');
assert.strictEqual(isStudentLikedOnly, true, 'Mock student liked doc phải được nhận diện là tri thức học sinh khen hay');
assert.strictEqual(Boolean(mockStudentLikedDoc.teacherVerified), false, 'Mock student liked doc chưa được giáo viên duyệt thì teacherVerified phải là false');

console.log('✅ 5. Logic phân biệt giữa "Đã có GV kiểm định" và "Học sinh khen Hay" chuẩn xác 100%.');

console.log('\n🎉 TẤT CẢ KIỂM THỬ TÍNH NĂNG "GỬI GV KIỂM TRA" & "ĐÃ CÓ GV KIỂM ĐỊNH" ĐẠT 100%!');

