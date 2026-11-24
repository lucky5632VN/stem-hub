import assert from 'assert';

console.log('=== TEST: QUY TẮC KÍCH HOẠT HUY HIỆU GIÁO VIÊN XEM XÉT ===\n');

function evaluateTeacherBadge(chunk) {
  if (!chunk) return { showBadge: false, reason: 'Không có chunk' };

  // Rule 1: team_self không bao giờ kích hoạt huy hiệu
  if (chunk.reviewerType === 'team_self' || chunk.isTeamMember === true) {
    return { showBadge: false, reason: 'team_self tuyệt đối không kích hoạt huy hiệu' };
  }

  // Rule 2: Phải có ít nhất 2 giáo viên khác nhau đồng ý
  const teacherCount = Number(chunk.verifiedTeacherCount || (Array.isArray(chunk.verifiedTeachers) ? chunk.verifiedTeachers.length : 0));
  if (teacherCount < 2) {
    return { showBadge: false, reason: '1 phiếu không đủ (yêu cầu ít nhất 2 giáo viên đồng thuận)' };
  }

  // Rule 3: Phải có cờ isTeacherVerified
  if (!chunk.isTeacherVerified) {
    return { showBadge: false, reason: 'Chưa được đánh dấu isTeacherVerified' };
  }

  return {
    showBadge: true,
    badgeText: `Đã được giáo viên xem xét (${teacherCount} giáo viên)`
  };
}

// Case 1: team_self đánh giá -> Không kích hoạt
const res1 = evaluateTeacherBadge({
  reviewerType: 'team_self',
  verifiedTeacherCount: 3,
  isTeacherVerified: true
});
assert.strictEqual(res1.showBadge, false, 'team_self không được kích hoạt dù count > 2');
console.log('✅ [PASS] Test 1: team_self không bao giờ kích hoạt huy hiệu.');

// Case 2: Chỉ có 1 giáo viên đánh giá -> Không kích hoạt
const res2 = evaluateTeacherBadge({
  reviewerType: 'teacher',
  verifiedTeacherCount: 1,
  isTeacherVerified: true
});
assert.strictEqual(res2.showBadge, false, '1 phiếu không đủ kích hoạt');
console.log('✅ [PASS] Test 2: Một phiếu giáo viên không đủ (cần tối thiểu 2).');

// Case 3: 2 giáo viên đánh giá hợp lệ -> Kích hoạt đúng text mới
const res3 = evaluateTeacherBadge({
  reviewerType: 'teacher',
  verifiedTeacherCount: 2,
  isTeacherVerified: true
});
assert.strictEqual(res3.showBadge, true);
assert.strictEqual(res3.badgeText, 'Đã được giáo viên xem xét (2 giáo viên)');
assert.strictEqual(res3.badgeText.includes('Chuẩn GDPT 2018'), false, 'Đã bỏ cụm Chuẩn GDPT 2018');
console.log('✅ [PASS] Test 3: Đủ 2 giáo viên hợp lệ kích hoạt huy hiệu chuẩn: "Đã được giáo viên xem xét (2 giáo viên)".');

// Case 4: 3 giáo viên đánh giá hợp lệ -> Kích hoạt đúng text mới
const res4 = evaluateTeacherBadge({
  reviewerType: 'teacher',
  verifiedTeachers: ['GV_TOAN_01', 'GV_TOAN_02', 'GV_TOAN_03'],
  isTeacherVerified: true
});
assert.strictEqual(res4.showBadge, true);
assert.strictEqual(res4.badgeText, 'Đã được giáo viên xem xét (3 giáo viên)');
console.log('✅ [PASS] Test 4: Mảng 3 giáo viên kích hoạt đúng "Đã được giáo viên xem xét (3 giáo viên)".');

console.log('\n🎉 TẤT CẢ KIỂM THỬ HUY HIỆU GIÁO VIÊN ĐÃ PASS THÀNH CÔNG!');

