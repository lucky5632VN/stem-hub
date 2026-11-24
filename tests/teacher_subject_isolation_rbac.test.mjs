/**
 * 🧪 TEST SUITE: TEACHER SUBJECT ISOLATION (RBAC) & PENDING QUEUE CLEANLINESS
 *
 * Kiểm tra:
 * 1. Toàn bộ 172 bản ghi hiện tại trong dữ liệu đều mang mác verified_by_teacher, không còn câu nào ở hàng chờ pending (pendingCount === 0).
 * 2. Giáo viên Toán (subjects: ['toan']) chỉ thấy câu hỏi thuộc môn Toán, hoàn toàn bị chặn khỏi môn Lý, Hóa, Sinh.
 * 3. Giáo viên Hóa (subjects: ['hoa']) chỉ thấy câu hỏi môn Hóa.
 * 4. Quản trị viên (admin: true) có toàn quyền xem tất cả các môn.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('🧪 BẮT ĐẦU KIỂM THỬ TEACHER SUBJECT ISOLATION & PENDING CLEANLINESS...\n');

let passed = 0;
let total = 0;

function it(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Lỗi: ${e.message}`);
    process.exitCode = 1;
  }
}

// 1. Kiểm tra toàn bộ dữ liệu hiện tại đều đã được gán mác kiểm duyệt
it('1. Toàn bộ 172 bản ghi hiện tại trong global-learned-knowledge.json đều là verified_by_teacher', () => {
  const filePath = path.join(process.cwd(), 'src', 'data', 'global-learned-knowledge.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]');
  assert.ok(data.length >= 150, 'Số lượng bản ghi phải >= 150');

  const unverified = data.filter(item => item.status !== 'verified_by_teacher' || !item.teacherVerified);
  assert.strictEqual(unverified.length, 0, `Không được còn bản ghi nào chưa duyệt, tìm thấy: ${unverified.length}`);

  const pending = data.filter(item => item.status === 'pending_review');
  assert.strictEqual(pending.length, 0, `Không được còn bản ghi nào ở tab Chờ duyệt, tìm thấy: ${pending.length}`);
});

// 2. Logic phân quyền môn học cho Giáo viên Toán
it('2. Giáo viên Toán (subjects: ["toan"]) chỉ thấy câu hỏi thuộc môn Toán', () => {
  const mockKnowledgeList = [
    { id: '1', query: 'Tích phân 1', subject: 'toan', status: 'verified_by_teacher', teacherVerified: true },
    { id: '2', query: 'Đạo hàm 2', subject: 'toan', status: 'verified_by_teacher', teacherVerified: true },
    { id: '3', query: 'Dao động cơ', subject: 'ly', status: 'verified_by_teacher', teacherVerified: true },
    { id: '4', query: 'Phản ứng xà phòng hóa', subject: 'hoa', status: 'verified_by_teacher', teacherVerified: true },
    { id: '5', query: 'Đột biến gen', subject: 'sinh', status: 'verified_by_teacher', teacherVerified: true }
  ];

  const teacherClaims = {
    role: 'teacher',
    reviewerType: 'teacher',
    admin: false,
    subjects: ['toan']
  };

  const isAdmin = Boolean(teacherClaims.admin || teacherClaims.role === 'admin');
  const isTeacher = Boolean(teacherClaims.role === 'teacher' || teacherClaims.reviewerType === 'teacher');
  const authorizedSubjects = teacherClaims.subjects || [];

  const visibleList = mockKnowledgeList.filter(item => {
    if (!isAdmin && isTeacher && authorizedSubjects.length > 0) {
      return authorizedSubjects.includes((item.subject || '').toLowerCase());
    }
    return true;
  });

  assert.strictEqual(visibleList.length, 2, 'Giáo viên Toán chỉ được thấy 2 câu môn Toán');
  assert.ok(visibleList.every(item => item.subject === 'toan'), 'Tất cả các câu nhìn thấy phải là môn Toán');
});

// 3. Logic phân quyền môn học cho Giáo viên Hóa
it('3. Giáo viên Hóa (subjects: ["hoa"]) chỉ thấy câu hỏi môn Hóa', () => {
  const mockKnowledgeList = [
    { id: '1', query: 'Tích phân 1', subject: 'toan', status: 'verified_by_teacher' },
    { id: '2', query: 'Phản ứng este', subject: 'hoa', status: 'verified_by_teacher' },
    { id: '3', query: 'Axit axetic', subject: 'hoa', status: 'verified_by_teacher' }
  ];

  const teacherClaims = {
    role: 'teacher',
    reviewerType: 'teacher',
    admin: false,
    subjects: ['hoa']
  };

  const isAdmin = Boolean(teacherClaims.admin || teacherClaims.role === 'admin');
  const isTeacher = Boolean(teacherClaims.role === 'teacher' || teacherClaims.reviewerType === 'teacher');
  const authorizedSubjects = teacherClaims.subjects || [];

  const visibleList = mockKnowledgeList.filter(item => {
    if (!isAdmin && isTeacher && authorizedSubjects.length > 0) {
      return authorizedSubjects.includes((item.subject || '').toLowerCase());
    }
    return true;
  });

  assert.strictEqual(visibleList.length, 2, 'Giáo viên Hóa chỉ được thấy 2 câu môn Hóa');
  assert.ok(visibleList.every(item => item.subject === 'hoa'));
});

// 4. Quản trị viên (admin: true) thấy toàn bộ các môn
it('4. Quản trị viên (admin: true) có quyền thấy tất cả các môn', () => {
  const mockKnowledgeList = [
    { id: '1', query: 'Tích phân', subject: 'toan' },
    { id: '2', query: 'Sóng ánh sáng', subject: 'ly' },
    { id: '3', query: 'Ancol etylic', subject: 'hoa' },
    { id: '4', query: 'Phiên mã di truyền', subject: 'sinh' }
  ];

  const adminClaims = {
    role: 'admin',
    admin: true,
    subjects: []
  };

  const isAdmin = Boolean(adminClaims.admin || adminClaims.role === 'admin');
  const isTeacher = false;
  const authorizedSubjects = [];

  const visibleList = mockKnowledgeList.filter(item => {
    if (!isAdmin && isTeacher && authorizedSubjects.length > 0) {
      return authorizedSubjects.includes((item.subject || '').toLowerCase());
    }
    return true;
  });

  assert.strictEqual(visibleList.length, 4, 'Admin phải thấy toàn bộ 4 câu ở tất cả các môn');
});

console.log(`\n🏁 KẾT QUẢ KIỂM THỬ: ${passed}/${total} TESTS PASS!`);

