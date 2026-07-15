/**
 * Script tự sinh exams_seed.js với chính xác 100 đề mỗi môn Toán/Lý/Hóa/Sinh (Tổng 400 đề)
 * - Nạp đầy đủ câu hỏi từ kho câu hỏi cào được (structured_new_exams.json, raw_questions.json, physics_mcq_pool.json)
 * - Tự động điền đáp án & lời giải chi tiết từ solved_questions_cache.json
 * - Các đề sinh thêm có đầy đủ câu hỏi rút ngẫu nhiên từ pool cùng môn, chuẩn cấu trúc 3 phần THPT 2026
 * - Phân bổ chuẩn danh mục: bo-gddt (100 đề), so-gddt (150 đề), truong-chuyen (150 đề) trên toàn hệ thống.
 * Chạy: node scripts/generate_exams_seed.js
 */
const fs = require('fs');
const path = require('path');

const PROVINCES = [
  'Hà Nội','TP. Hồ Chí Minh','Đà Nẵng','Hải Phòng','Cần Thơ',
  'Nghệ An','Thanh Hóa','Hà Tĩnh','Quảng Bình','Quảng Trị',
  'Thừa Thiên Huế','Quảng Nam','Quảng Ngãi','Bình Định','Phú Yên',
  'Khánh Hòa','Ninh Thuận','Bình Thuận','Vĩnh Phúc','Bắc Ninh',
  'Hải Dương','Hưng Yên','Nam Định','Ninh Bình','Thái Bình',
  'Hà Nam','Phú Thọ','Thái Nguyên','Bắc Giang','Lạng Sơn',
  'Quảng Ninh','Hòa Bình','Sơn La','Yên Bái','Lào Cai',
  'Tuyên Quang','Hà Giang','Cao Bằng','Bắc Kạn','Điện Biên',
  'Lai Châu','Lâm Đồng','Đắk Lắk','Đắk Nông','Gia Lai',
  'Kon Tum','Bình Dương','Đồng Nai','Bà Rịa-Vũng Tàu','Long An',
  'Tiền Giang','Bến Tre','Trà Vinh','Vĩnh Long','Đồng Tháp',
  'An Giang','Kiên Giang','Hậu Giang','Sóc Trăng','Bạc Liêu',
  'Cà Mau','Bình Phước','Tây Ninh'
];

const SCHOOLS = [
  'THPT Chuyên','THPT Lê Hồng Phong','THPT Nguyễn Trãi','THPT Chu Văn An',
  'THPT Phan Đình Phùng','THPT Kim Liên','THPT Trần Phú','THPT Nguyễn Huệ',
  'THPT Lê Quý Đôn','THPT Chuyên Lam Sơn','THPT Chuyên Phan Bội Châu'
];

const SUBJECTS = [
  { key: 'math',      label: 'Toán Học',  minutes: 90, mcq: 12, tf: 4, sa: 6 },
  { key: 'physics',   label: 'Vật Lý',    minutes: 50, mcq: 18, tf: 4, sa: 6 },
  { key: 'chemistry', label: 'Hóa Học',   minutes: 50, mcq: 18, tf: 4, sa: 6 },
  { key: 'biology',   label: 'Sinh Học',  minutes: 50, mcq: 18, tf: 4, sa: 6 }
];

const YEARS = [2024, 2025, 2026];

// Hàm trộn mảng
function shuffle(arr) {
  return arr.slice().sort(() => Math.random() - 0.5);
}

// Hàm lấy mẫu ngẫu nhiên
function getRandomSample(arr, count) {
  if (!arr || arr.length === 0) return [];
  const result = [];
  const len = arr.length;
  if (len >= count) {
    const indices = new Set();
    while (indices.size < count) {
      indices.add(Math.floor(Math.random() * len));
    }
    indices.forEach(idx => {
      result.push(JSON.parse(JSON.stringify(arr[idx])));
    });
  } else {
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * len);
      result.push(JSON.parse(JSON.stringify(arr[idx])));
    }
  }
  return result;
}

// Tải dữ liệu cào và giải quyết đáp án từ cache
function loadScrapedData() {
  const scratchDir = path.join(__dirname, '../scratch');
  const cachePath = path.join(scratchDir, 'solved_questions_cache.json');
  const newExamsPath = path.join(scratchDir, 'structured_new_exams.json');
  const rawQuestionsPath = path.join(scratchDir, 'raw_questions.json');
  const physicsMcqPath = path.join(scratchDir, 'physics_mcq_pool.json');

  let cache = {};
  if (fs.existsSync(cachePath)) {
    cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  }

  const allRawExams = [];

  // Đọc 39 đề Hóa/Toán/Sinh
  if (fs.existsSync(newExamsPath)) {
    const newExams = JSON.parse(fs.readFileSync(newExamsPath, 'utf8'));
    allRawExams.push(...newExams);
  }

  // Đọc 7 đề Vật lý
  if (fs.existsSync(rawQuestionsPath)) {
    const rawExams = JSON.parse(fs.readFileSync(rawQuestionsPath, 'utf8'));
    allRawExams.push(...rawExams);
  }

  // Cập nhật đáp án & giải thích từ cache cho từng câu hỏi
  allRawExams.forEach(exam => {
    if (exam.questions) {
      exam.questions.forEach(q => {
        const cacheItem = cache[q.id];
        if (cacheItem) {
          q.explanation = cacheItem.explanation || q.explanation;
          if (q.type === 'mcq') {
            if (typeof cacheItem.correctAnswerIndex === 'number') {
              q.correctAnswer = cacheItem.correctAnswerIndex;
            }
          } else if (q.type === 'true_false') {
            if (Array.isArray(cacheItem.correctValues)) {
              q.statements.forEach((s, sIdx) => {
                if (sIdx < cacheItem.correctValues.length) {
                  s.correctValue = cacheItem.correctValues[sIdx];
                }
              });
            }
          } else if (q.type === 'short_answer') {
            if (cacheItem.correctValue !== undefined) {
              q.correctShortAnswer = String(cacheItem.correctValue);
            }
          }
        }
      });
    }
  });

  // Gom pool câu hỏi theo môn học
  const questionPools = { math: [], physics: [], chemistry: [], biology: [] };

  allRawExams.forEach(exam => {
    if (exam.questions && exam.questions.length > 0) {
      exam.questions.forEach(q => {
        questionPools[exam.subject].push(q);
      });
    }
  });

  // Đọc thêm physics_mcq_pool.json để bổ sung câu hỏi Vật lý
  if (fs.existsSync(physicsMcqPath)) {
    const physicsPool = JSON.parse(fs.readFileSync(physicsMcqPath, 'utf8'));
    physicsPool.forEach((q, idx) => {
      // Đồng bộ đáp án & giải thích từ cache cho pool Vật lý đại cương
      const cacheItem = cache[q.id];
      if (cacheItem) {
        q.explanation = cacheItem.explanation || q.explanation;
        if (typeof cacheItem.correctAnswerIndex === 'number') {
          q.correctAnswer = cacheItem.correctAnswerIndex;
        }
      }
      questionPools.physics.push(q);
    });
  }

  return { allRawExams, questionPools };
}

function run() {
  const { allRawExams, questionPools } = loadScrapedData();

  console.log(`📊 Tải thành công ${allRawExams.length} đề thi thực tế.`);
  console.log("📊 Số lượng câu hỏi thu thập được:");
  Object.entries(questionPools).forEach(([k, v]) => console.log(` - ${k}: ${v.length} câu`));

  // 1. Chuẩn hóa và phân loại các đề thi thực tế
  const processedRealExams = allRawExams.map((exam, idx) => {
    let cat = 'bo-gddt';
    const titleLower = exam.title.toLowerCase();
    
    if (titleLower.includes('sở gd') || titleLower.includes('so gd')) {
      cat = 'so-gddt';
    } else if (titleLower.includes('chuyên') || titleLower.includes('chuyen') || titleLower.includes('trường') || titleLower.includes('truong')) {
      cat = 'truong-chuyen';
    }

    let province = 'Bộ GD&ĐT';
    if (cat !== 'bo-gddt') {
      const foundProv = PROVINCES.find(p => titleLower.includes(p.toLowerCase()));
      province = foundProv || (cat === 'so-gddt' ? 'Sở GD&ĐT' : 'Trường THPT');
    }

    // Sinh slug ID duy nhất cho đề thi thực tế
    const examId = `${exam.subject}_real_${idx + 1}`;

    // Chuẩn hóa ID câu hỏi của đề thực tế để tránh trùng lặp
    const questions = (exam.questions || []).map((q, qIdx) => ({
      ...q,
      id: `${examId}_q${qIdx + 1}`
    }));

    return {
      id: examId,
      title: exam.title,
      subject: exam.subject,
      subjectLabel: exam.subjectLabel || (exam.subject === 'math' ? 'Toán Học' : exam.subject === 'physics' ? 'Vật Lý' : exam.subject === 'chemistry' ? 'Hóa Học' : 'Sinh Học'),
      category: cat,
      province,
      year: exam.year || 2026,
      timeLimit: exam.timeLimit || (exam.subject === 'math' ? 5400 : 3000),
      type: 'thpt_chuan',
      typeLabel: `Cấu trúc 2026 (${questions.length} câu)`,
      sourceUrl: exam.sourceUrl || null,
      questions
    };
  });

  // 2. Tính toán phân bổ category cần sinh thêm để đạt: bo-gddt (100 đề), so-gddt (150 đề), truong-chuyen (150 đề)
  const boCount = processedRealExams.filter(e => e.category === 'bo-gddt').length;
  const soCount = processedRealExams.filter(e => e.category === 'so-gddt').length;
  const chuyênCount = processedRealExams.filter(e => e.category === 'truong-chuyen').length;

  const boNeeded = 100 - boCount;
  const soNeeded = 150 - soCount;
  const chuyênNeeded = 150 - chuyênCount;

  console.log(`\n📊 Phân bổ đề thực tế: bo-gddt: ${boCount}, so-gddt: ${soCount}, truong-chuyen: ${chuyênCount}`);
  console.log(`📊 Số lượng cần sinh thêm: bo-gddt: ${boNeeded}, so-gddt: ${soNeeded}, truong-chuyen: ${chuyênNeeded}`);

  // Tạo pool category cần sinh thêm
  let categoryPool = [];
  for (let i = 0; i < boNeeded; i++) categoryPool.push('bo-gddt');
  for (let i = 0; i < soNeeded; i++) categoryPool.push('so-gddt');
  for (let i = 0; i < chuyênNeeded; i++) categoryPool.push('truong-chuyen');
  
  // Trộn pool category để phân phối ngẫu nhiên đều đặn
  categoryPool = shuffle(categoryPool);

  const finalExams = [...processedRealExams];
  let catIndex = 0;

  // 3. Tiến hành sinh đề cho từng môn học để đạt chính xác 100 đề mỗi môn
  SUBJECTS.forEach(subj => {
    const subjectRealExams = processedRealExams.filter(e => e.subject === subj.key);
    let currentCount = subjectRealExams.length;
    const TARGET = 100;
    let virtualIdx = 1;

    console.log(` - Môn ${subj.label}: Hiện có ${currentCount} đề thực tế, sinh thêm ${TARGET - currentCount} đề.`);

    const subjectPool = questionPools[subj.key];

    while (currentCount < TARGET) {
      const examId = `${subj.key}_virtual_${virtualIdx}`;
      const year = YEARS[virtualIdx % YEARS.length];
      const prov = PROVINCES[virtualIdx % PROVINCES.length];
      const school = SCHOOLS[virtualIdx % SCHOOLS.length];
      const cat = categoryPool[catIndex++];

      let title = '';
      let province = '';

      if (cat === 'bo-gddt') {
        title = `Đề thi thử ${subj.label} tốt nghiệp THPT ${year} – Bộ GD&ĐT – Đề số ${virtualIdx}`;
        province = 'Bộ GD&ĐT';
      } else if (cat === 'so-gddt') {
        title = `Đề thi thử ${subj.label} tốt nghiệp THPT ${year} – Sở GD&ĐT ${prov} – Lần ${Math.floor(virtualIdx / 3) + 1}`;
        province = prov;
      } else {
        title = `Đề thi thử ${subj.label} tốt nghiệp THPT ${year} – Trường ${school} ${prov}`;
        province = prov;
      }

      // Rút ngẫu nhiên các câu hỏi cho đề tự sinh theo cấu trúc 3 phần chuẩn THPT 2026
      const mcqPool = subjectPool.filter(q => q.type === 'mcq');
      const tfPool = subjectPool.filter(q => q.type === 'true_false' || q.type === 'tf');
      const saPool = subjectPool.filter(q => q.type === 'short_answer' || q.type === 'sa');

      const sampledMcqs = getRandomSample(mcqPool, subj.mcq);
      const sampledTfs = getRandomSample(tfPool, subj.tf);
      const sampledSas = getRandomSample(saPool, subj.sa);

      const combinedQuestions = [...sampledMcqs, ...sampledTfs, ...sampledSas].map((q, qIdx) => {
        // Đổi ID câu hỏi để tránh trùng lặp
        const newQ = {
          ...q,
          id: `${examId}_q${qIdx + 1}`
        };
        // Format lại text tiêu đề câu hỏi nếu cần
        return newQ;
      });

      finalExams.push({
        id: examId,
        title,
        subject: subj.key,
        subjectLabel: subj.label,
        category: cat,
        province,
        year,
        timeLimit: subj.minutes * 60,
        type: 'thpt_chuan',
        typeLabel: `Cấu trúc 2026 (${combinedQuestions.length} câu)`,
        sourceUrl: null,
        questions: combinedQuestions
      });

      currentCount++;
      virtualIdx++;
    }
  });

  // 4. Kiểm tra phân bổ kết quả sau khi sinh
  const finalCounts = finalExams.reduce((acc, e) => {
    acc[e.subject] = (acc[e.subject] || 0) + 1;
    return acc;
  }, {});

  const finalCats = finalExams.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 Thống kê đề thi sau khi sinh seed:');
  console.log(' - Theo môn học:');
  Object.entries(finalCounts).forEach(([k, v]) => console.log(`   * ${k}: ${v} đề`));
  console.log(' - Theo danh mục (Category):');
  Object.entries(finalCats).forEach(([k, v]) => console.log(`   * ${k}: ${v} đề`));
  console.log(` - Tổng cộng: ${finalExams.length} đề`);

  // Ghi kết quả ra src/data/exams_seed.js
  const output = `// Danh sách đề thi – tự sinh bởi scripts/generate_exams_seed.js
// Chạy lại: node scripts/generate_exams_seed.js để tái tạo
export const SCRAPED_EXAMS_SEED = ${JSON.stringify(finalExams, null, 2)};
`;

  const outPath = path.join(__dirname, '../src/data/exams_seed.js');
  fs.writeFileSync(outPath, output, 'utf8');
  console.log(`\n✅ Đã ghi ${finalExams.length} đề thi hoàn chỉnh vào ${outPath}`);
}

run();
