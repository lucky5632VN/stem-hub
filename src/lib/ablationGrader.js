/**
 * 📜 Auto-Grader chuẩn hóa cho Ablation Benchmark
 * Tuân thủ quy tắc đóng băng: docs/quy-tac-cham-ablation.md (Mục 3.2 & 3.3)
 */

export function matchNumericalAnswer(groundTruth, responseText, tolerance = 0.02) {
  if (!responseText || !groundTruth) return { isCorrect: false, rule: 'missing_input' };
  
  const text = String(responseText);
  const gtStr = String(groundTruth).trim();

  // 1. Kiểm tra mã 4 chữ số (ví dụ: "3412", "1256", "4132", "2603")
  if (/^\d{4}$/.test(gtStr)) {
    const codeRegex = new RegExp(`\\b${gtStr}\\b`);
    const isMatched = codeRegex.test(text);
    return {
      isCorrect: isMatched,
      matchedValue: gtStr,
      rule: '4_digit_code_exact_match'
    };
  }

  // 2. Kiểm tra câu trắc nghiệm (ví dụ ground truth: "B. (1; 0)" hoặc "A. 4" hoặc "B. x = 4")
  const mcqMatch = gtStr.match(/^([A-D])\.\s*(.*)$/);
  if (mcqMatch) {
    const letter = mcqMatch[1]; // "B"
    const content = mcqMatch[2].trim(); // "(1; 0)"

    // Kiểm tra mẫu phương án chữ cái: "Đáp án B", "Chọn B", "Phương án B", hoặc đứng đầu/cuối dòng
    const letterRegex = new RegExp(`(?:đáp án|chọn|phương án|kết quả|^|\\s)(${letter})(?:\\.|\\)|\\s|$)`, 'i');
    const hasLetter = letterRegex.test(text);

    // Kiểm tra nội dung phương án
    const contentNormalized = content.replace(/,/g, '.').toLowerCase();
    const textNormalized = text.replace(/,/g, '.').toLowerCase();
    const hasContent = textNormalized.includes(contentNormalized);

    if (hasLetter || hasContent) {
      return {
        isCorrect: true,
        matchedValue: hasLetter ? letter : content,
        rule: 'mcq_letter_or_content_match'
      };
    }

    return {
      isCorrect: false,
      rule: 'mcq_mismatch'
    };
  }

  // 3. Chuẩn hóa giá trị kỳ vọng (Ground Truth)
  const gtClean = gtStr.replace(/,/g, '.').replace(/[^\d.-]/g, '');
  const gtNum = parseFloat(gtClean);
  if (isNaN(gtNum)) {
    // Fallback so khớp chuỗi
    return {
      isCorrect: text.toLowerCase().includes(gtStr.toLowerCase()),
      rule: 'string_fallback'
    };
  }

  // 4. Trích xuất tất cả các số trong phản hồi (chuẩn hóa dấu phẩy thành dấu chấm)
  const normalizedText = text.replace(/(\d+),(\d+)/g, '$1.$2');
  const numberTokens = [];
  const numRegex = /[-+]?\d*\.?\d+/g;
  let match;
  while ((match = numRegex.exec(normalizedText)) !== null) {
    const val = parseFloat(match[0]);
    if (!isNaN(val)) {
      numberTokens.push(val);
    }
  }

  if (numberTokens.length === 0) {
    return { isCorrect: false, rule: 'no_numbers_found' };
  }

  // Tìm trong các số được trích xuất (ưu tiên từ cuối văn bản lên - tức câu kết luận)
  let bestDiff = Infinity;
  let bestVal = null;

  for (let i = numberTokens.length - 1; i >= 0; i--) {
    const val = numberTokens[i];
    const diff = Math.abs(val - gtNum);
    if (diff <= tolerance) {
      return {
        isCorrect: true,
        extractedValue: val,
        groundTruthValue: gtNum,
        diff,
        tolerance,
        rule: 'numerical_tolerance_match'
      };
    }
    if (diff < bestDiff) {
      bestDiff = diff;
      bestVal = val;
    }
  }

  return {
    isCorrect: false,
    extractedValue: bestVal,
    groundTruthValue: gtNum,
    bestDiff,
    tolerance,
    rule: 'numerical_out_of_tolerance'
  };
}

