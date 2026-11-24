import fs from 'fs';
import path from 'path';

const datasetPath = path.resolve('reports/ablation/ablation_dataset_100.json');
const hashPath = path.resolve('reports/ablation/dataset_hash.json');

const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
const hashInfo = JSON.parse(fs.readFileSync(hashPath, 'utf8'));

let md = `# 📋 BẢNG ĐỐI CHIẾU ĐÁP ÁN CHUẨN 100 CÂU THỰC NGHIỆM ABLATION (ANSWER KEY REVIEW)\n\n`;
md += `> **Tập dữ liệu**: \`reports/ablation/ablation_dataset_100.json\`  \n`;
md += `> **Mã băm SHA-256 hiện tại**: \`${hashInfo.sha256}\`  \n`;
md += `> **Thời điểm khóa hash**: ${hashInfo.locked_at}  \n`;
md += `> **Nguyên tắc**: Gắn nhãn trung thực nguồn gốc biên soạn ("Nhóm biên soạn" hoặc "LLM-assisted"). Cột "Nguồn xác nhận" để trống khi chưa có văn bản/đề thi chính thức xác nhận (tuyệt đối không đoán). Cột "Người đã kiểm" dành cho người dùng trực tiếp thẩm tra và ký duyệt trước khi kích hoạt lệnh chạy API thật.\n\n`;

md += `| STT | ID | Phân tầng | Môn | Câu hỏi | Đáp án chuẩn (Ground Truth) | Nguồn SGK đối chiếu | Nguồn xác nhận | Loại nguồn | Tác giả biên soạn | Người đã kiểm |\n`;
md += `|:---:|:---:|---|:---:|---|---|---|---|:---:|:---:|:---:|\n`;

dataset.cases.forEach((c, idx) => {
  let author = 'Nhóm biên soạn';
  let sourceType = 'SGK-SBT';
  let confirmedSource = ''; // Tuyệt đối không điền khi chưa có nguồn chính thức được xác nhận (để trống, không đoán)

  if (c.stratum === 'out_of_scope') {
    author = 'LLM-assisted';
    sourceType = 'nhóm tự soạn';
  } else if (c.id.startsWith('ABL_IN_CONCEPT_')) {
    author = 'LLM-assisted (AI gợi ý, nhóm đối soát SGK)';
    sourceType = 'SGK-SBT';
  } else if (c.id.startsWith('ABL_IN_NUM_0')) {
    author = 'LLM-assisted (AI gợi ý số liệu)';
    sourceType = 'SGK-SBT';
  } else {
    author = 'Nhóm biên soạn (Trích từ bộ SGK 150 ca)';
    sourceType = 'SGK-SBT';
  }

  const qClean = c.question.replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const gtClean = c.ground_truth.replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const srcClean = (c.sgk_source || 'N/A').replace(/\|/g, '\\|');

  md += `| ${idx + 1} | \`${c.id}\` | \`${c.stratum}\` | ${c.subject} | ${qClean} | ${gtClean} | ${srcClean} | ${confirmedSource} | ${sourceType} | ${author} | [ ] |\n`;
});

const outPath = path.resolve('docs/ablation-answer-key-review.md');
fs.writeFileSync(outPath, md, 'utf8');
console.log('✅ Generated', outPath, 'with', dataset.cases.length, 'cases with 2 new columns (Nguồn xác nhận, Loại nguồn).');
