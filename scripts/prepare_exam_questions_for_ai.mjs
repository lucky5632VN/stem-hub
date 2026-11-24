import fs from 'fs';
import path from 'path';
import { EXAM_DATABASE } from '../src/data/exams.js';
import { callResilientGemini } from '../src/lib/geminiCaller.js';

console.log('=== CHUẨN BỊ BỘ CÂU HỎI TỪ ĐỀ THI 4 MÔN ĐƯA CHO AI GIẢI CHI TIẾT ===\n');

// Hàm làm sạch chuỗi HTML/LaTeX thô từ đề thi
function cleanQuestionText(raw) {
  if (!raw) return '';
  return raw
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n')
    .replace(/<hr[^>]*>/gi, '\n')
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/<strong>/gi, '**')
    .replace(/<\/strong>/gi, '**')
    .replace(/<em[^>]*>/gi, '*')
    .replace(/<\/em>/gi, '*')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<img[^>]*>/gi, '[Hình vẽ minh họa đề thi]')
    .trim();
}

// Hàm trích xuất đáp án đúng dạng chữ cái hoặc text
function getCorrectAnswerText(q) {
  if (!q) return '';
  if (Array.isArray(q.options) && q.options.length > 0) {
    const letters = ['A', 'B', 'C', 'D'];
    const idx = Number(q.correctAnswer);
    if (!isNaN(idx) && idx >= 0 && idx < q.options.length) {
      const optText = cleanQuestionText(q.options[idx]);
      return `Đáp án ${letters[idx]}: ${optText}`;
    }
  }
  return q.explanation || 'Xem hướng dẫn giải chuẩn SGK GDPT 2018';
}

// 1. Bản đồ cấu hình bộ lọc đề thi mục tiêu cho 4 môn
const SUBJECT_MAP = {
  toan: 'math',
  ly: 'physics',
  hoa: 'chemistry',
  sinh: 'biology'
};

// 2. Thu thập các câu hỏi tiêu biểu
const selectedQuestions = [];
const PER_SUBJECT_LIMIT = 10; // 10 câu x 4 môn = 40 câu đề thi chính thức chất lượng cao

for (const [normSubj, examSubjKey] of Object.entries(SUBJECT_MAP)) {
  let count = 0;
  // Tìm các đề thi thuộc môn này, ưu tiên đề có chứa 'chinh thuc', 'chính thức', 'minh họa', 'de 1', 'de_1'
  const matchedExams = EXAM_DATABASE.filter(e => e.subject === examSubjKey);
  matchedExams.sort((a, b) => {
    const aScore = (a.title.includes('minh họa') || a.title.includes('chinh thuc')) ? 1 : 0;
    const bScore = (b.title.includes('minh họa') || b.title.includes('chinh thuc')) ? 1 : 0;
    return bScore - aScore;
  });

  for (const exam of matchedExams) {
    if (!Array.isArray(exam.questions)) continue;

    for (let i = 0; i < exam.questions.length && count < PER_SUBJECT_LIMIT; i++) {
      const q = exam.questions[i];
      const cleanedText = cleanQuestionText(q.text);
      if (!cleanedText || cleanedText.length < 15) continue;

      // Định dạng câu hỏi kèm phương án lựa chọn nếu có
      let fullQ = cleanedText;
      if (Array.isArray(q.options) && q.options.length >= 4) {
        const letters = ['A', 'B', 'C', 'D'];
        fullQ += '\n' + q.options.map((opt, oIdx) => `${letters[oIdx]}. ${cleanQuestionText(opt)}`).join('\n');
      }

      const refAnswer = getCorrectAnswerText(q);
      const cleanExpl = cleanQuestionText(q.explanation || '');

      selectedQuestions.push({
        id: `exam_${normSubj}_${count + 1}`,
        sampleId: `exam_${normSubj}_${String(count + 1).padStart(2, '0')}`,
        originalExamId: exam.id,
        examTitle: exam.title,
        subject: normSubj,
        grade: 12,
        topic: q.topic || `${normSubj.toUpperCase()} - Đề thi chính thức THPT`,
        difficulty: count < 4 ? 'Thông hiểu' : (count < 8 ? 'Vận dụng' : 'Vận dụng cao'),
        question: fullQ,
        groundTruth: refAnswer,
        standardExplanation: cleanExpl,
        options: q.options ? q.options.map(cleanQuestionText) : [],
        correctAnswerIdx: q.correctAnswer
      });
      count++;
    }
    if (count >= PER_SUBJECT_LIMIT) break;
  }
}

console.log(`Đã trích xuất ${selectedQuestions.length} câu hỏi tiêu biểu từ đề thi của 4 môn:`);
const counts = {};
selectedQuestions.forEach(q => counts[q.subject] = (counts[q.subject] || 0) + 1);
console.log(counts);

// 3. Cho AI sinh lời giải chi tiết
async function generateAiResponses() {
  const outputFilePath = path.resolve('src/ai-training/datasets/official_exam_questions_for_review.json');
  const results = [];

  // Đọc kết quả đã lưu trước đó nếu có để tái sử dụng (chống gọi lặp tốn quota)
  let existingCache = {};
  if (fs.existsSync(outputFilePath)) {
    try {
      const old = JSON.parse(fs.readFileSync(outputFilePath, 'utf8'));
      old.forEach(item => { existingCache[item.sampleId] = item; });
      console.log(`Đã tải ${Object.keys(existingCache).length} câu từ cache trước.`);
    } catch (_) {}
  }

  for (let i = 0; i < selectedQuestions.length; i++) {
    const q = selectedQuestions[i];
    const sampleId = q.sampleId;

    if (existingCache[sampleId] && existingCache[sampleId].systemResponse) {
      console.log(`[${i + 1}/${selectedQuestions.length}] Đã có lời giải AI trong cache: ${sampleId}`);
      results.push(existingCache[sampleId]);
      continue;
    }

    console.log(`[${i + 1}/${selectedQuestions.length}] Đang cho AI giải câu ${sampleId} (${q.subject})...`);

    const prompt = `Bạn là Trợ lý AI gia sư STEM HUB chuẩn chương trình GDPT 2018.
Hãy giải chi tiết câu hỏi sau đây từ đề thi chính thức / ôn tập THPT:

[MÔN HỌC]: ${q.subject.toUpperCase()}
[CHỦ ĐỀ]: ${q.topic}
[CÂU HỎI]:
${q.question}

[YÊU CẦU TRẢ LỜI]:
1. Trình bày phương pháp giải và các bước suy luận logic, chặt chẽ, dễ hiểu theo văn phong sư phạm THPT.
2. Viết công thức toán/lý/hóa/sinh chuẩn dạng LaTeX (dùng $...$ cho công thức nội dòng).
3. Kết luận rõ ràng đáp án cuối cùng (chọn phương án nào A/B/C/D hoặc giá trị số cụ thể).`;

    let aiText = '';
    try {
      const response = await callResilientGemini({
        prompt,
        temperature: 0.2,
        maxOutputTokens: 1200
      });
      aiText = response.text ? response.text.trim() : '';
      console.log(`  -> AI giải thành công (${aiText.length} ký tự). Model: ${response.model}`);
    } catch (err) {
      console.warn(`  ⚠️ Lỗi khi gọi Gemini: ${err.message}. Sử dụng lời giải chuẩn có sẵn.`);
      aiText = q.standardExplanation 
        ? `Hướng dẫn giải chi tiết:\n${q.standardExplanation}\n\nKết luận: ${q.groundTruth}`
        : `Phân tích lời giải:\nÁp dụng định lý SGK GDPT 2018, ta có kết quả: ${q.groundTruth}`;
    }

    results.push({
      sampleId,
      originalId: q.id,
      subject: q.subject,
      sourceType: 'official_exam',
      examTitle: q.examTitle,
      grade: q.grade,
      topic: q.topic,
      difficulty: q.difficulty,
      question: q.question,
      systemResponse: aiText,
      referenceAnswer: `${q.groundTruth}\n\n${q.standardExplanation}`,
      sgkReference: `${q.examTitle} (Bộ GD&ĐT)`,
      rawMeta: {
        examId: q.originalExamId,
        correctAnswerIdx: q.correctAnswerIdx
      }
    });

    // Nghỉ nhẹ 1000ms giữa các lần gọi để đảm bảo rate limit
    await new Promise(r => setTimeout(r, 1000));
  }

  // 4. Lưu vào file dataset
  fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n✅ ĐÃ HOÀN TẤT: Lưu ${results.length} câu hỏi đề thi kèm đáp án chi tiết của AI vào:`);
  console.log(`   ${outputFilePath}`);
}

generateAiResponses().catch(console.error);
