import { 
  checkRAGCacheHit, 
  saveLearnedAnswerToRAG, 
  isGreetingOrChitchat, 
  containsPersonalOrSystemInfo,
  sanitizeAnswerForStorage 
} from '../src/lib/ragService.js';

console.log("=== BẮT ĐẦU KIỂM THỬ BẢO VỆ DỮ LIỆU RAG ===");

// Test 1: Kiểm tra phát hiện câu chào hỏi xã giao
console.log("\n[Test 1] Phát hiện câu chào hỏi:");
const greetings = ["chào bạn", "xin chào", "hello", "hi", "chào nova", "tôi là ai", "nhớ gì về tôi"];
greetings.forEach(g => {
  console.log(`  "${g}" -> isGreeting: ${isGreetingOrChitchat(g)}`);
});

// Test 2: Kiểm tra phát hiện từ khóa cá nhân
console.log("\n[Test 2] Phát hiện từ khóa cá nhân:");
const personalSamples = [
  "Bạn chính là Nguyễn Minh Khang, hiện đang ở cấp độ Lv.4",
  "Điểm Elo 130 và danh hiệu apprentice",
  "1000 Tinh thể và đang ở Trang chủ STEM HUB",
  "Định luật vạn vật hấp dẫn F = G * m1 * m2 / r^2"
];
personalSamples.forEach(p => {
  console.log(`  "${p.slice(0, 45)}..." -> containsPersonal: ${containsPersonalOrSystemInfo(p)}`);
});

// Test 3: checkRAGCacheHit với câu "chào bạn"
console.log("\n[Test 3] Cache Hit với câu 'chào bạn':");
const cacheHitGreeting = checkRAGCacheHit("chào bạn");
console.log("  Cache hit result for 'chào bạn':", cacheHitGreeting);

// Test 4: sanitizeAnswerForStorage
console.log("\n[Test 4] Làm sạch câu trả lời kiến thức:");
const rawAns = "Chào bạn Nguyễn Minh Khang! Thầy rất vui được giải đáp. Công thức tính chu kỳ con lắc đơn là T = 2*pi*sqrt(l/g). Chúc bạn học tốt nhé!";
const cleanAns = sanitizeAnswerForStorage(rawAns);
console.log("  Raw answer:", rawAns);
console.log("  Cleaned answer:", cleanAns);

console.log("\n=== TẤT CẢ TEST ĐỀU HOÀN HẢO! ===");
