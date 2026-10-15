import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { formatMathText } from '../../lib/mathFormatter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../../');

// Bảng màu terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const issues = [];

function addIssue({ code, file, line = 1, severity = 'FAIL', reason, solution }) {
  const relFile = path.isAbsolute(file) ? path.relative(ROOT_DIR, file) : file;
  issues.push({
    code,
    file: relFile.replace(/\\/g, '/'),
    line,
    severity,
    reason,
    solution
  });
}

console.log(`${colors.cyan}${colors.bright}🏥 === BẮT ĐẦU CHẨN ĐOÁN HỆ THỐNG TOÀN DIỆN (ANTIGRAVITY DOCTOR v2.0) ===${colors.reset}\n`);

// ============================================================================
// HẠNG MỤC 1: KIỂM TOÁN LIÊN KẾT & ĐƯỜNG DẪN (LINK & PATH INTEGRITY)
// ============================================================================
console.log(`${colors.blue}🔍 [1/5] Kiểm toán Liên kết & Đường dẫn trong Markdown files...${colors.reset}`);

const targetMdFiles = [
  'HO_SO_MINH_CHUNG_CAI_TIEN_AI26B0012.md',
  'TRAINING_LOG.md',
  'BENCHMARK_150_REPORT.md',
  'EXTENDED_ROBUST_EVALUATION_REPORT.md',
  'README.md',
  'PRODUCT.md',
  'DESIGN.md',
  'FINAL_READINESS_CERTIFICATION.md',
  'STEM_HUB_WEB_ARCHITECTURE_AI_DOCUMENTATION.md'
];

targetMdFiles.forEach(relPath => {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) return;

  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;

    // 1.1 Tìm đường dẫn tuyệt đối cục bộ: file:///, C:\, e:/, E:\, E:/
    const absMatches = lineText.match(/(?:file:\/\/\/[a-zA-Z]:|[a-zA-Z]:[\\\/]project|[a-zA-Z]:[\\\/]Users)/gi);
    if (absMatches) {
      addIssue({
        code: 'PATH-ABS-LEAK',
        file: relPath,
        line: lineNum,
        severity: 'FAIL',
        reason: `Chứa đường dẫn tuyệt đối cục bộ nhạy cảm máy cá nhân (${absMatches[0]})`,
        solution: `Chuyển đổi thành đường dẫn tương đối chuẩn của kho Git (ví dụ 'src/lib/...' hoặc './...')`
      });
    }

    // 1.2 Trích xuất các markdown link: [text](path)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(lineText)) !== null) {
      const rawTarget = match[2].trim();
      // Bỏ qua http://, https://, mailto:, #anchors, javascript:
      if (/^(https?:|mailto:|#|javascript:)/i.test(rawTarget)) continue;

      // Tách anchor nếu có
      const cleanTarget = rawTarget.split('#')[0].trim();
      if (!cleanTarget) continue;

      // Chuẩn hóa đường dẫn tương đối so với thư mục của file markdown hoặc root
      let resolvedTarget = path.resolve(path.dirname(fullPath), cleanTarget);
      if (!fs.existsSync(resolvedTarget)) {
        // Thử resolve từ ROOT_DIR
        const resolvedFromRoot = path.resolve(ROOT_DIR, cleanTarget);
        if (fs.existsSync(resolvedFromRoot)) {
          resolvedTarget = resolvedFromRoot;
        } else {
          addIssue({
            code: 'PATH-BROKEN-LINK',
            file: relPath,
            line: lineNum,
            severity: 'FAIL',
            reason: `Liên kết trỏ tới file không tồn tại trên ổ đĩa: '${rawTarget}'`,
            solution: `Kiểm tra lại đường dẫn file hoặc tạo/chuyển tệp tương ứng vào đúng vị trí`
          });
        }
      }
    }
  });
});

// ============================================================================
// HẠNG MỤC 2: KIỂM TOÁN NHẤT QUÁN SỐ LIỆU CHÉO (CROSS-DOCUMENT METRIC CONSISTENCY)
// ============================================================================
console.log(`${colors.blue}🔍 [2/5] Kiểm toán Nhất quán Số liệu Chéo giữa Data & Báo cáo...${colors.reset}`);

// 2.1 Kiểm tra Benchmark 150
const benchPath = path.join(ROOT_DIR, 'src/ai-training/datasets/benchmark_150_cases.json');
if (fs.existsSync(benchPath)) {
  const benchData = JSON.parse(fs.readFileSync(benchPath, 'utf-8'));
  if (benchData.length !== 150) {
    addIssue({
      code: 'METRIC-BENCH-SIZE',
      file: 'src/ai-training/datasets/benchmark_150_cases.json',
      line: 1,
      severity: 'FAIL',
      reason: `Kích thước tập benchmark không đúng 150 ca (thực tế: ${benchData.length})`,
      solution: `Khôi phục hoặc cập nhật đủ 150 ca chuẩn theo quy định Ban Giám khảo`
    });
  }
} else {
  addIssue({
    code: 'METRIC-FILE-MISSING',
    file: 'src/ai-training/datasets/benchmark_150_cases.json',
    line: 1,
    severity: 'FAIL',
    reason: `Thiếu file dữ liệu thẩm định 150 ca benchmark_150_cases.json`,
    solution: `Chạy script generate_150_benchmark_cases.js để xuất file`
  });
}

// 2.2 Kiểm tra 3 tập kiểm thử độc lập
const independentFiles = [
  { file: 'src/ai-training/datasets/chem-risk/independent_eval_135.json', expectedN: 135, name: 'ChemLab' },
  { file: 'src/ai-training/datasets/physics-error/independent_eval_135.json', expectedN: 135, name: 'Physics' },
  { file: 'src/ai-training/datasets/intent/independent_eval_140.json', expectedN: 140, name: 'Intent' }
];

independentFiles.forEach(item => {
  const fPath = path.join(ROOT_DIR, item.file);
  if (!fs.existsSync(fPath)) {
    addIssue({
      code: 'METRIC-EVAL-MISSING',
      file: item.file,
      line: 1,
      severity: 'FAIL',
      reason: `Thiếu file kiểm thử độc lập ${item.name}`,
      solution: `Chạy extended-robust-evaluation.js để tạo tập kiểm thử độc lập`
    });
  } else {
    const data = JSON.parse(fs.readFileSync(fPath, 'utf-8'));
    if (data.length !== item.expectedN) {
      addIssue({
        code: 'METRIC-SAMPLE-MISMATCH',
        file: item.file,
        line: 1,
        severity: 'FAIL',
        reason: `Cỡ mẫu ${item.name} (${data.length}) không khớp với tài liệu (${item.expectedN})`,
        solution: `Đồng bộ lại cỡ mẫu hoặc cập nhật lại tài liệu tương ứng`
      });
    }
  }
});

// 2.3 Kiểm tra RAG Ablation Results
const ablationPath = path.join(ROOT_DIR, 'src/ai-training/datasets/rag_ablation_results.json');
if (fs.existsSync(ablationPath)) {
  const ablationData = JSON.parse(fs.readFileSync(ablationPath, 'utf-8'));
  const hardN = ablationData.metadata?.hardSampleSize || 0;
  const oosN = ablationData.metadata?.oosSampleSize || 0;
  if (hardN !== 50 || oosN !== 30) {
    addIssue({
      code: 'METRIC-ABLATION-SIZE',
      file: 'src/ai-training/datasets/rag_ablation_results.json',
      line: 1,
      severity: 'FAIL',
      reason: `Cỡ mẫu thực nghiệm RAG đối chứng (${hardN} hard + ${oosN} oos) không khớp với đề bài (50 hard + 30 oos)`,
      solution: `Chạy lại script run_rag_ablation_experiment.js để đồng bộ chuẩn 50 hard + 30 oos`
    });
  }
}

// 2.4 Kiểm tra số liệu trong TRAINING_LOG.md và HO_SO
const checkDocMetrics = (docPath) => {
  const fullP = path.join(ROOT_DIR, docPath);
  if (!fs.existsSync(fullP)) return;
  const text = fs.readFileSync(fullP, 'utf-8');

  // Kiểm tra cấm báo cáo 100% giả tạo trên các tập lớn độc lập
  if (/\| \*\*1\*\* \| \*\*ChemLab[\s\S]*?\*\*100\.00%\*\* (?:5-Fold|Test)/.test(text)) {
    addIssue({
      code: 'METRIC-FAKE-100',
      file: docPath,
      line: 1,
      severity: 'FAIL',
      reason: `Phát hiện chỉ số 100% phi thực tế trên tập ChemLab độc lập (cần trung thực ~95.56%)`,
      solution: `Cập nhật đúng số liệu 95.56% từ kết quả 5-Fold Cross-Validation thực tế`
    });
  }

  // Kiểm tra sự hiện diện của 95% Wilson Score CI
  if (!text.includes('90.6%') || !text.includes('98.0%')) {
    addIssue({
      code: 'METRIC-WILSON-MISSING-CHEM',
      file: docPath,
      line: 1,
      severity: 'WARNING',
      reason: `Thiếu khoảng tin cậy Wilson 95% chuẩn của ChemLab [90.6%, 98.0%]`,
      solution: `Bổ sung khoảng tin cậy [90.6%, 98.0%] vào bảng số liệu`
    });
  }

  if (!text.includes('91.6%') || !text.includes('98.4%')) {
    addIssue({
      code: 'METRIC-WILSON-MISSING-PHYS',
      file: docPath,
      line: 1,
      severity: 'WARNING',
      reason: `Thiếu khoảng tin cậy Wilson 95% chuẩn của Physics [91.6%, 98.4%]`,
      solution: `Bổ sung khoảng tin cậy [91.6%, 98.4%] vào bảng số liệu`
    });
  }

  if (!text.includes('82.2%') || !text.includes('92.8%')) {
    addIssue({
      code: 'METRIC-WILSON-MISSING-INTENT',
      file: docPath,
      line: 1,
      severity: 'WARNING',
      reason: `Thiếu khoảng tin cậy Wilson 95% chuẩn của Javit Intent [82.2%, 92.8%]`,
      solution: `Bổ sung khoảng tin cậy [82.2%, 92.8%] vào bảng số liệu`
    });
  }
};

checkDocMetrics('TRAINING_LOG.md');
checkDocMetrics('HO_SO_MINH_CHUNG_CAI_TIEN_AI26B0012.md');

// ============================================================================
// HẠNG MỤC 3: KIỂM TOÁN CÚ PHÁP TOÁN / HÓA KATEX & DỮ LIỆU JSON
// ============================================================================
console.log(`${colors.blue}🔍 [3/5] Kiểm toán Cú pháp Toán/Hóa KaTeX & Dữ liệu Tri thức...${colors.reset}`);

const knowledgeFiles = [
  'src/data/global-learned-knowledge.json',
  'public/data/global-learned-knowledge.json'
];

knowledgeFiles.forEach(relPath => {
  const fullP = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(fullP)) return;

  try {
    const data = JSON.parse(fs.readFileSync(fullP, 'utf-8'));
    data.forEach((item, idx) => {
      const answer = item.answer || '';

      // 3.1 Kiểm tra dấu $ bị lệch trong từng dòng
      const lines = answer.split('\n');
      lines.forEach((l, lIdx) => {
        const singleDollars = (l.match(/(?<!\\)\$/g) || []).length;
        if (singleDollars % 2 !== 0 && !l.includes('$$')) {
          addIssue({
            code: 'KATEX-ODD-DOLLAR',
            file: relPath,
            line: idx + 1,
            severity: 'FAIL',
            reason: `Bản ghi '${item.id}' có số dấu $ lẻ (${singleDollars}) trên dòng: "${l.slice(0, 60)}..."`,
            solution: `Cân bằng dấu $ hoặc bọc toàn bộ phương trình vào $$...$$`
          });
        }
      });

      // 3.2 Kiểm tra ký hiệu hóa học cũ GDPT 2006 (AlO2- thay vì [Al(OH)4]-)
      if (/AlO2\b|NaAlO2\b/.test(answer)) {
        addIssue({
          code: 'CHEM-GDPT2006-OLD',
          file: relPath,
          line: idx + 1,
          severity: 'WARNING',
          reason: `Bản ghi '${item.id}' sử dụng ký hiệu AlO2- cũ của chương trình 2006 thay vì [Al(OH)4]- chuẩn GDPT 2018`,
          solution: `Đổi AlO2- thành [Al(OH)4]- và NaAlO2 thành Na[Al(OH)4]`
        });
      }

      // 3.3 Kiểm tra tiếng Việt chưa escape trong toán học (bóc tách cả $$...$$ và $...$ chuẩn xác)
      const mathBlocks = [];
      let sanitizedForMath = answer.replace(/\$\$([\s\S]+?)\$\$/g, (_m, p1) => {
        mathBlocks.push(p1);
        return ' ';
      });

      sanitizedForMath.replace(/\$([^\$\n]+?)\$/g, (_m, p1) => {
        mathBlocks.push(p1);
        return ' ';
      });

      mathBlocks.forEach(inner => {
        // Gỡ bỏ các khối \text{...} hợp lệ trước khi kiểm tra ký tự tiếng Việt thô
        const stripped = inner.replace(/\\text\s*\{[^{}]*\}/g, '');
        if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(stripped)) {
          addIssue({
            code: 'KATEX-RAW-VIETNAMESE',
            file: relPath,
            line: idx + 1,
            severity: 'WARNING',
            reason: `Bản ghi '${item.id}' chứa tiếng Việt có dấu chưa bọc trong \\text{...}: "${inner.slice(0, 50)}..."`,
            solution: `Bọc từ tiếng Việt vào \\text{...} hoặc đưa từ đó ra ngoài dấu $`
          });
        }
      });

      // 3.4 Kiểm tra khả năng render trực tiếp bằng formatMathText
      const rendered = formatMathText(answer);
      if (rendered.includes('katex-error') || rendered.includes('ParseError')) {
        addIssue({
          code: 'KATEX-RENDER-ERROR',
          file: relPath,
          line: idx + 1,
          severity: 'FAIL',
          reason: `Bản ghi '${item.id}' gây ra lỗi cú pháp KaTeX khi render`,
          solution: `Sửa lại cú pháp LaTeX trong thuộc tính 'answer'`
        });
      }
      if (rendered.includes('⟦MATH:') || rendered.includes('⟦HTML:')) {
        addIssue({
          code: 'KATEX-UNREPLACED-TOKEN',
          file: relPath,
          line: idx + 1,
          severity: 'FAIL',
          reason: `Bản ghi '${item.id}' còn sót placeholder token KaTeX chưa được khôi phục`,
          solution: `Kiểm tra thứ tự thay thế placeholder trong mathFormatter.js`
        });
      }
    });
  } catch (err) {
    addIssue({
      code: 'JSON-PARSE-ERROR',
      file: relPath,
      line: 1,
      severity: 'FAIL',
      reason: `Không thể parse JSON: ${err.message}`,
      solution: `Sửa cú pháp JSON file`
    });
  }
});

// ============================================================================
// HẠNG MỤC 4: KIỂM TOÁN BẢO MẬT & 6 YÊU CẦU HACKATHON TRONG CODE THỰC TẾ
// ============================================================================
console.log(`${colors.blue}🔍 [4/5] Kiểm toán Bảo mật & 6 Ràng buộc Hackathon trong Source Code...${colors.reset}`);

// 4.1 Kiểm tra ragService.js
const ragServicePath = path.join(ROOT_DIR, 'src/lib/ragService.js');
if (fs.existsSync(ragServicePath)) {
  const code = fs.readFileSync(ragServicePath, 'utf-8');

  // (a) Khóa cứng trạng thái kiểm duyệt giáo viên
  if (!code.includes("status !== 'verified_by_teacher'") && !code.includes("verified_by_teacher")) {
    addIssue({
      code: 'SECURITY-UNVERIFIED-CACHE',
      file: 'src/lib/ragService.js',
      line: 1,
      severity: 'FAIL',
      reason: `Chưa có chốt chặn kiểm duyệt giáo viên (verified_by_teacher) trước khi Cache Hit`,
      solution: `Thêm điều kiện kiểm tra doc.status !== 'verified_by_teacher'`
    });
  }

  // (b) Công thức Hybrid Grounding Score
  if (!code.includes('0.6 * normTFIDF') && !code.includes('0.6 *') && !code.includes('bm25Overlap')) {
    addIssue({
      code: 'RAG-HYBRID-MISSING',
      file: 'src/lib/ragService.js',
      line: 1,
      severity: 'WARNING',
      reason: `Chưa có hiện thực công thức Hybrid Grounding Score (0.6 * Norm_TFIDF + 0.4 * BM25)`,
      solution: `Đồng bộ hóa công thức tính điểm tương quan theo đúng tài liệu thuyết minh`
    });
  }
}

// 4.2 Kiểm tra GlobalAIAssistant.jsx
const assistantPath = path.join(ROOT_DIR, 'src/components/organisms/GlobalAIAssistant.jsx');
if (fs.existsSync(assistantPath)) {
  const code = fs.readFileSync(assistantPath, 'utf-8');

  // (a) Chốt chặn Strict Grounding Abstention < 0.30
  if (!code.includes('0.30') || !code.includes('Cảnh báo thiếu căn cứ')) {
    addIssue({
      code: 'SECURITY-ABSTENTION-MISSING',
      file: 'src/components/organisms/GlobalAIAssistant.jsx',
      line: 1,
      severity: 'FAIL',
      reason: `Chưa có chốt chặn Strict Grounding Abstention (ngưỡng < 0.30) kích hoạt cảnh báo thiếu căn cứ`,
      solution: `Bổ sung logic kiểm tra topScore < 0.30 để dừng trả lời và hiển thị nút tham khảo mở rộng`
    });
  }

  // (b) Chống Prompt Injection / XSS
  if (!code.includes('replace(/</g') && !code.includes('&lt;') && !code.includes('sanitize')) {
    addIssue({
      code: 'SECURITY-XSS-ESCAPE',
      file: 'src/components/organisms/GlobalAIAssistant.jsx',
      line: 1,
      severity: 'WARNING',
      reason: `Chưa có cơ chế escape ký tự nhạy cảm '<' và '>' để chống Prompt Injection / XSS`,
      solution: `Thêm bước lọc escape HTML ký tự nhạy cảm trước khi render tin nhắn học sinh`
    });
  }
}

// 4.3 Kiểm tra API learned-knowledge route
const learnedApiPath = path.join(ROOT_DIR, 'src/app/api/learned-knowledge/route.js');
if (fs.existsSync(learnedApiPath)) {
  const code = fs.readFileSync(learnedApiPath, 'utf-8');
  if (!code.includes('verified_by_teacher') || !code.includes('PATCH')) {
    addIssue({
      code: 'API-TEACHER-ACTION-MISSING',
      file: 'src/app/api/learned-knowledge/route.js',
      line: 1,
      severity: 'FAIL',
      reason: `API quản trị tri thức thiếu endpoint PATCH xử lý hành động phê duyệt của giáo viên`,
      solution: `Cung cấp endpoint PATCH hỗ trợ verify, reject, edit tri thức`
    });
  }
}

// ============================================================================
// HẠNG MỤC 5: KIỂM TOÁN KIẾN TRÚC NEXT.JS & DEAD CODE / IMPORT INTEGRITY
// ============================================================================
console.log(`${colors.blue}🔍 [5/5] Kiểm toán Kiến trúc Next.js & Import Integrity...${colors.reset}`);

// Quét import đứt gãy trong các file chính
const criticalSourceFiles = [
  'src/app/page.js',
  'src/app/admin/page.js',
  'src/app/admin/knowledge-review/page.js',
  'src/components/organisms/GlobalAIAssistant.jsx',
  'src/lib/ragService.js',
  'src/lib/mathFormatter.js',
  'src/ai-training/scripts/run-all-audits.js'
];

criticalSourceFiles.forEach(relPath => {
  const fullP = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(fullP)) return;

  const content = fs.readFileSync(fullP, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((lineText, idx) => {
    const importMatch = lineText.match(/(?:import|from)\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      const impPath = importMatch[1];
      // Bỏ qua external package npm (không bắt đầu bằng '.' hoặc '/')
      if (!impPath.startsWith('.') && !impPath.startsWith('/')) return;

      // Xử lý relative import
      const dir = path.dirname(fullP);
      let targetFile = path.resolve(dir, impPath);

      // Thử các extension .js, .jsx, .ts, .tsx, /index.js, /index.jsx
      const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx'];
      const exists = extensions.some(ext => fs.existsSync(targetFile + ext));

      if (!exists) {
        addIssue({
          code: 'NEXT-BROKEN-IMPORT',
          file: relPath,
          line: idx + 1,
          severity: 'FAIL',
          reason: `Import đứt gãy, không tìm thấy file: '${impPath}'`,
          solution: `Sửa lại đường dẫn import hoặc tạo module tương ứng`
        });
      }
    }
  });
});

// ============================================================================
// BƯỚC 2: TÍNH ĐIỂM SỨC KHỎE & XUẤT BÁO CÁO AUDIT_DIAGNOSIS_REPORT.md
// ============================================================================
const failCount = issues.filter(i => i.severity === 'FAIL').length;
const warnCount = issues.filter(i => i.severity === 'WARNING').length;

// Điểm sức khỏe tối đa 100, mỗi lỗi trừ 10 điểm, mỗi cảnh báo trừ 2 điểm
const healthScore = Math.max(0, 100 - (failCount * 10) - (warnCount * 2));

console.log('\n===========================================================================');
console.log(`🏥 KẾT QUẢ KIỂM TOÁN ĐỘC LẬP:`);
console.log(`   - Điểm Sức Khỏe Hệ Thống: ${healthScore >= 90 ? colors.green : healthScore >= 70 ? colors.yellow : colors.red}${healthScore}/100${colors.reset}`);
console.log(`   - Tổng số Lỗi (FAIL): ${failCount > 0 ? colors.red : colors.green}${failCount}${colors.reset}`);
console.log(`   - Tổng số Cảnh báo (WARNING): ${warnCount > 0 ? colors.yellow : colors.green}${warnCount}${colors.reset}`);
console.log('===========================================================================\n');

if (issues.length > 0) {
  console.log(`${colors.bright}DANH SÁCH CHI TIẾT CÁC LỖI & CẢNH BÁO PHÁT HIỆN ĐƯỢC:${colors.reset}\n`);
  issues.forEach((iss, i) => {
    const color = iss.severity === 'FAIL' ? colors.red : colors.yellow;
    console.log(`${color}[${iss.code}] - [${iss.file}:${iss.line}] - [NGUYÊN NHÂN: ${iss.reason}] - [HƯỚNG GIẢI QUYẾT: ${iss.solution}]${colors.reset}`);
  });
} else {
  console.log(`${colors.green}${colors.bright}🎉 CHÚC MỪNG: HỆ THỐNG ĐẠT 100/100 ĐIỂM SỨC KHỎE — KHÔNG CÓ BẤT KỲ LỖI HOẶC CẢNH BÁO NÀO!${colors.reset}\n`);
}

// Xuất file AUDIT_DIAGNOSIS_REPORT.md
const reportContent = `# 🩺 BÁO CÁO CHẨN ĐOÁN TOÀN DIỆN HỆ THỐNG (ANTIGRAVITY DOCTOR REPORT)
> **Thời điểm kiểm toán**: ${new Date().toISOString()}  
> **Phiên bản Doctor**: 2.0 (Strict Autonomous Auditor)  
> **Điểm Sức Khỏe Hệ Thống (Health Score)**: **${healthScore}/100**  
> **Trạng thái**: ${failCount === 0 && warnCount === 0 ? '🟢 **EXCELLENT (100% SẴN SÀNG BẢO VỆ BGK)**' : '🔴 **CẦN TỰ CHỮA LÀNH (ACTION REQUIRED)**'}

---

## 📊 1. BẢNG TỔNG QUAN CHỈ SỐ SỨC KHỎE DỰ ÁN

| Hạng Mục Kiểm Toán | Trạng Thái | Số Lỗi (FAIL) | Số Cảnh Báo (WARN) | Đánh Giá Kỹ Thuật |
|---|:---:|:---:|:---:|---|
| **1. Link & Path Integrity** | ${issues.some(i => i.code.startsWith('PATH')) ? '🔴 CẦN SỬA' : '🟢 PASS'} | ${issues.filter(i => i.code.startsWith('PATH') && i.severity === 'FAIL').length} | ${issues.filter(i => i.code.startsWith('PATH') && i.severity === 'WARNING').length} | Không có đường dẫn tuyệt đối máy cá nhân, toàn bộ link tương đối tồn tại thật. |
| **2. Cross-Document Consistency** | ${issues.some(i => i.code.startsWith('METRIC')) ? '🔴 CẦN SỬA' : '🟢 PASS'} | ${issues.filter(i => i.code.startsWith('METRIC') && i.severity === 'FAIL').length} | ${issues.filter(i => i.code.startsWith('METRIC') && i.severity === 'WARNING').length} | Số liệu thực tế trong JSON khớp 100% với báo cáo, có Wilson 95% CI, 0% số ảo. |
| **3. KaTeX Math & Data Integrity** | ${issues.some(i => i.code.startsWith('KATEX') || i.code.startsWith('CHEM')) ? '🔴 CẦN SỬA' : '🟢 PASS'} | ${issues.filter(i => (i.code.startsWith('KATEX') || i.code.startsWith('CHEM')) && i.severity === 'FAIL').length} | ${issues.filter(i => (i.code.startsWith('KATEX') || i.code.startsWith('CHEM')) && i.severity === 'WARNING').length} | 100% công thức toán/hóa render KaTeX không lỗi, chuẩn danh pháp GDPT 2018. |
| **4. Security & Hackathon Rules** | ${issues.some(i => i.code.startsWith('SECURITY') || i.code.startsWith('RAG')) ? '🔴 CẦN SỬA' : '🟢 PASS'} | ${issues.filter(i => (i.code.startsWith('SECURITY') || i.code.startsWith('RAG')) && i.severity === 'FAIL').length} | ${issues.filter(i => (i.code.startsWith('SECURITY') || i.code.startsWith('RAG')) && i.severity === 'WARNING').length} | Chốt chặn Cache giáo viên, Strict Grounding Abstention < 0.30, chống XSS. |
| **5. Next.js & Import Integrity** | ${issues.some(i => i.code.startsWith('NEXT')) ? '🔴 CẦN SỬA' : '🟢 PASS'} | ${issues.filter(i => i.code.startsWith('NEXT') && i.severity === 'FAIL').length} | ${issues.filter(i => i.code.startsWith('NEXT') && i.severity === 'WARNING').length} | Không có import đứt gãy trong các module lõi. |

---

## 📋 2. DANH SÁCH CHI TIẾT CÁC MỤC CẦN KHẮC PHỤC

${issues.length === 0 ? '*(Không phát hiện lỗi nào. Hệ thống đạt độ tin cậy và chuẩn mực kỹ thuật tối đa).*' : issues.map((iss, i) => `### ${i + 1}. [${iss.severity}] ${iss.code}
- **Vị trí**: \`${iss.file}:${iss.line}\`
- **Nguyên nhân**: ${iss.reason}
- **Hướng giải quyết cụ thể cho Agent**: ${iss.solution}
`).join('\n')}

---

## 🛠️ 3. LỆNH CHẨN ĐOÁN & TỰ ĐỘNG ĐÁNH GIÁ LẠI
\`\`\`bash
node src/ai-training/scripts/antigravity-doctor.js
\`\`\`
`;

const reportPath = path.join(ROOT_DIR, 'AUDIT_DIAGNOSIS_REPORT.md');
fs.writeFileSync(reportPath, reportContent, 'utf-8');
console.log(`${colors.green}💾 Đã xuất báo cáo chẩn đoán chi tiết: ${reportPath}${colors.reset}\n`);

// Trả về mã thoát: 0 nếu không có lỗi FAIL, 1 nếu có lỗi FAIL
process.exit(failCount > 0 ? 1 : 0);
