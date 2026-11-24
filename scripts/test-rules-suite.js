// ⚠️ FILE NÀY ĐÃ BỊ VÔ HIỆU HÓA HOÀN TOÀN THEO QUY TẮC TRUNG THỰC (REQUIREMENT 9).
// Lý do: File cũ chứa cơ chế giả lập fallback `if (isStandalone) gotPass = expectedPass;`,
// dẫn đến việc tự động báo PASS ngay cả khi không kết nối được Firestore Emulator thật.
//
// BỘ KIỂM THỬ AN NINH DUY NHẤT HỢP LỆ VÀ ĐƯỢC CHỨNG THỰC TRÊN EMULATOR THẬT HIỆN NAY LÀ:
// tests/firestore.rules.test.js
// Lệnh chạy: npm run test:security (hoặc firebase emulators:exec --only firestore "node tests/firestore.rules.test.js")

throw new Error('[DEPRECATED & DISABLED] scripts/test-rules-suite.js đã bị vô hiệu hóa theo Quy tắc Trung thực. Vui lòng sử dụng tests/firestore.rules.test.js');
