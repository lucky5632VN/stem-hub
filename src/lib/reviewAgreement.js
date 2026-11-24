/**
 * 📊 REVIEW AGREEMENT & INTER-RATER RELIABILITY ENGINE (ESM)
 * 
 * Tính toán độ đồng thuận giữa các người chấm độc lập:
 * - Tỷ lệ phần trăm đồng thuận (Percent Agreement: P_o)
 * - Hệ số tương quan định danh Cohen's Kappa (κ) cho các cặp người chấm
 * - Khoảng tin cậy Wilson 95% Confidence Interval
 * 
 * ⚠️ QUY TẮC CỐT LÕI (PROMPT 0 & NHIỆM VỤ 6):
 * - TUYỆT ĐỐI KHÔNG GHÉP KAPPA HOẶC GỘP ĐIỂM GIỮA GIÁO VIÊN VÀ NHÓM TỰ CHẤM.
 * - Mọi phép đo phân tích độc lập theo từng `reviewerType` ("teacher" riêng, "team_self" riêng).
 */

/**
 * Tính khoảng tin cậy Wilson 95% CI cho tỷ lệ k / n
 */
export function wilsonInterval(k, n, confidence = 0.95) {
  if (n <= 0) return { lower: 0, upper: 0, mean: 0 };
  const p = k / n;
  const z = confidence === 0.99 ? 2.576 : (confidence === 0.90 ? 1.645 : 1.96);
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;

  return {
    lower: Math.max(0, Number((center - margin).toFixed(4))),
    upper: Math.min(1, Number((center + margin).toFixed(4))),
    mean: Number(p.toFixed(4)),
    k,
    n
  };
}

/**
 * Tính Cohen's Kappa giữa 2 người chấm trên tập mẫu chung
 * @param {Array<{sampleId: string, val1: any, val2: any}>} pairedData
 * @returns {Object} { kappa, percentAgreement, commonCount, po, pe }
 */
export function computeCohenKappa(pairedData) {
  const n = pairedData.length;
  if (n === 0) {
    return { kappa: null, percentAgreement: 0, commonCount: 0, po: 0, pe: 0, note: 'Không có mẫu chung' };
  }

  // Thu thập danh sách các nhãn giá trị xuất hiện
  const categories = [...new Set(pairedData.flatMap(d => [String(d.val1), String(d.val2)]))];
  
  // 1. Tính số lượng khớp quan sát thực tế (Observed Agreement: P_o)
  let agreeCount = 0;
  pairedData.forEach(d => {
    if (String(d.val1) === String(d.val2)) {
      agreeCount++;
    }
  });
  const po = agreeCount / n;

  // 2. Tính số lượng kỳ vọng ngẫu nhiên (Expected Agreement: P_e)
  const count1 = {};
  const count2 = {};
  categories.forEach(c => {
    count1[c] = 0;
    count2[c] = 0;
  });

  pairedData.forEach(d => {
    count1[String(d.val1)]++;
    count2[String(d.val2)]++;
  });

  let pe = 0;
  categories.forEach(c => {
    pe += (count1[c] / n) * (count2[c] / n);
  });

  // 3. Tính Kappa
  let kappa = 0;
  if (Math.abs(1 - pe) < 1e-9) {
    kappa = Math.abs(1 - po) < 1e-9 ? 1.0 : 0.0;
  } else {
    kappa = (po - pe) / (1 - pe);
  }

  return {
    kappa: Number(kappa.toFixed(4)),
    percentAgreement: Number((po * 100).toFixed(2)),
    commonCount: n,
    po: Number(po.toFixed(4)),
    pe: Number(pe.toFixed(4))
  };
}

/**
 * Phân tích độ đồng thuận cho một nhóm đối tượng (Cohort) cùng loại ("teacher" hoặc "team_self")
 * @param {Array<Object>} reviews - Danh sách các phiếu chấm
 * @param {string} cohortType - "teacher" | "team_self"
 * @param {string} criterion - Tiêu chí chấm: 'knowledge' | 'grounding' | 'pedagogy' | 'safety' | 'totalScore' | 'primaryError'
 * @returns {Object}
 */
export function computeCohortAgreement(reviews, cohortType, criterion = 'knowledge') {
  if (!cohortType || (cohortType !== 'teacher' && cohortType !== 'team_self')) {
    throw new Error(`cohortType bắt buộc là 'teacher' hoặc 'team_self' (Không được ghép lẫn lộn)`);
  }

  // 1. Lọc nghiêm ngặt chỉ lấy các review thuộc cohortType yêu cầu và không phải demo
  const filtered = reviews.filter(r => 
    r.reviewerType === cohortType && 
    !r.isDemo && 
    !r.skipped &&
    r.reviewerUid
  );

  // Nhóm theo reviewerUid
  const reviewerMap = {};
  filtered.forEach(r => {
    if (!reviewerMap[r.reviewerUid]) {
      reviewerMap[r.reviewerUid] = {};
    }
    let val = null;
    if (criterion === 'primaryError') {
      val = r.primaryError || 'none';
    } else if (criterion === 'totalScore') {
      val = r.totalScore;
    } else if (r.scores && r.scores[criterion] !== undefined) {
      val = r.scores[criterion];
    }
    if (val !== null && val !== undefined) {
      reviewerMap[r.reviewerUid][r.sampleId] = val;
    }
  });

  const reviewerUids = Object.keys(reviewerMap);
  const numReviewers = reviewerUids.length;

  if (numReviewers < 2) {
    return {
      cohortType,
      criterion,
      numReviewers,
      numPairs: 0,
      meanPercentAgreement: null,
      meanKappa: null,
      pairs: [],
      status: numReviewers === 0 ? 'Chưa có người chấm' : 'Cần ít nhất 2 người chấm cùng loại để tính độ đồng thuận'
    };
  }

  // Tính từng cặp (Pairwise Kappa)
  const pairs = [];
  let sumAgreement = 0;
  let sumKappa = 0;
  let validKappaPairs = 0;

  for (let i = 0; i < reviewerUids.length; i++) {
    for (let j = i + 1; j < reviewerUids.length; j++) {
      const u1 = reviewerUids[i];
      const u2 = reviewerUids[j];
      const map1 = reviewerMap[u1];
      const map2 = reviewerMap[u2];

      const commonSampleIds = Object.keys(map1).filter(sId => map2[sId] !== undefined);
      if (commonSampleIds.length > 0) {
        const pairedData = commonSampleIds.map(sId => ({
          sampleId: sId,
          val1: map1[sId],
          val2: map2[sId]
        }));

        const result = computeCohenKappa(pairedData);
        pairs.push({
          reviewer1: u1,
          reviewer2: u2,
          commonCount: result.commonCount,
          percentAgreement: result.percentAgreement,
          kappa: result.kappa
        });

        sumAgreement += result.percentAgreement;
        if (result.kappa !== null) {
          sumKappa += result.kappa;
          validKappaPairs++;
        }
      }
    }
  }

  const meanAgreement = pairs.length > 0 ? Number((sumAgreement / pairs.length).toFixed(2)) : null;
  const meanKappa = validKappaPairs > 0 ? Number((sumKappa / validKappaPairs).toFixed(4)) : null;

  return {
    cohortType,
    criterion,
    numReviewers,
    numPairs: pairs.length,
    meanPercentAgreement: meanAgreement,
    meanKappa: meanKappa,
    pairs
  };
}

/**
 * Thống kê tổng hợp điểm số và phân bố lỗi tách bạch theo Môn & Cohort
 * @param {Array<Object>} reviews - Toàn bộ phiếu chấm
 * @returns {Object} { bySubject: { toan: { teacher: {...}, team_self: {...} } } }
 */
export function aggregateReviewsBySubjectAndCohort(reviews) {
  const cleanReviews = reviews.filter(r => !r.isDemo);
  const subjects = ['toan', 'ly', 'hoa', 'sinh'];
  const cohorts = ['teacher', 'team_self'];

  const report = {};

  subjects.forEach(subj => {
    report[subj] = {};
    cohorts.forEach(coh => {
      const cohortReviews = cleanReviews.filter(r => 
        r.subject === subj && 
        r.reviewerType === coh && 
        !r.skipped
      );

      const reviewerSet = new Set(cohortReviews.map(r => r.reviewerUid));
      const sampleSet = new Set(cohortReviews.map(r => r.sampleId));
      const n = cohortReviews.length;

      // Tính điểm trung bình các tiêu chí
      let sumKnowledge = 0;
      let sumGrounding = 0;
      let sumPedagogy = 0;
      let sumSafety = 0;
      let sumTotal = 0;

      const errorDist = {
        none: 0,
        sai_kien_thuc: 0,
        thieu_nguon: 0,
        nguon_khong_lien_quan: 0,
        sai_don_vi: 0,
        dien_dat: 0,
        khac: 0
      };

      cohortReviews.forEach(r => {
        const sc = r.scores || {};
        sumKnowledge += Number(sc.knowledge || 0);
        sumGrounding += Number(sc.grounding || 0);
        sumPedagogy += Number(sc.pedagogy || 0);
        sumSafety += Number(sc.safety || 0);
        sumTotal += Number(r.totalScore || 0);

        const err = r.primaryError || 'none';
        if (errorDist[err] !== undefined) {
          errorDist[err]++;
        } else {
          errorDist.khac++;
        }
      });

      // Kiểm tra cỡ mẫu để đưa ra khuyến cáo khái quát
      const isSampleTooSmall = n < 30;

      report[subj][coh] = {
        subject: subj,
        cohortType: coh,
        totalReviews: n,
        distinctReviewers: reviewerSet.size,
        distinctSamples: sampleSet.size,
        isSampleTooSmall,
        sampleNote: isSampleTooSmall ? 'Mẫu quá nhỏ để khái quát' : 'Đạt cỡ mẫu khuyến nghị (n >= 30)',
        averages: n > 0 ? {
          knowledge: Number((sumKnowledge / n).toFixed(2)),
          grounding: Number((sumGrounding / n).toFixed(2)),
          pedagogy: Number((sumPedagogy / n).toFixed(2)),
          safety: Number((sumSafety / n).toFixed(2)),
          total: Number((sumTotal / n).toFixed(2))
        } : null,
        errorDistribution: errorDist,
        skippedCount: cleanReviews.filter(r => r.subject === subj && r.reviewerType === coh && r.skipped).length
      };
    });
  });

  return report;
}

/**
 * 🎯 TÍNH TOÁN MA TRẬN NHẦM LẪN (CONFUSION MATRIX) GIỮA GIÁO VIÊN VÀ AI
 * 
 * - Giáo viên (Teacher) đóng vai trò Ground Truth (Thẩm định chuẩn mực của con người).
 * - AI (Hệ thống RAG / Mô hình) đóng vai trò Predicted Label (Dự đoán / Tự động chấm).
 * 
 * Các trường hợp:
 * - True Positive (TP): GV đánh giá ĐÚNG & AI đánh giá ĐÚNG (AI giải chuẩn và được GV xác nhận)
 * - False Positive (FP): GV đánh giá SAI & AI đánh giá ĐÚNG (AI tự nhận đúng nhưng GV phát hiện sai kết quả hoặc sai trình bày - ảo tưởng)
 * - False Negative (FN): GV đánh giá ĐÚNG & AI đánh giá SAI (AI tự từ chối hoặc chấm trượt câu mà GV thấy giải đúng)
 * - True Negative (TN): GV đánh giá SAI & AI đánh giá SAI (AI từ chối đúng hoặc nhận diện đúng câu sai)
 * 
 * @param {Array<{ sampleId: string, teacherVerdict: 'dung'|'sai'|boolean, aiVerdict: 'dung'|'sai'|boolean, dapAnVerdict?: 'dung'|'sai'|boolean, trinhBayVerdict?: 'dung'|'sai'|boolean }>} pairedList
 * @returns {Object} { matrix: { tp, fp, fn, tn }, metrics: { accuracy, precision, recall, specificity, f1Score, cohenKappa, disagreementRate, wilsonAccuracy }, breakdown: {...} }
 */
export function computeTeacherAiConfusionMatrix(pairedList = []) {
  const cleanList = pairedList.filter(item => item && item.teacherVerdict !== undefined && item.aiVerdict !== undefined);
  const n = cleanList.length;

  if (n === 0) {
    return {
      totalSamples: 0,
      matrix: { tp: 0, fp: 0, fn: 0, tn: 0 },
      metrics: {
        accuracy: 0,
        precision: 0,
        recall: 0,
        specificity: 0,
        f1Score: 0,
        cohenKappa: null,
        disagreementRate: 0,
        wilsonAccuracy: { lowerPct: 0, upperPct: 0, meanPct: 0 }
      },
      breakdown: {
        dapAnTotal: 0,
        dapAnCorrectCount: 0,
        dapAnAccuracyPct: 0,
        trinhBayTotal: 0,
        trinhBayCorrectCount: 0,
        trinhBayAccuracyPct: 0
      },
      note: 'Chưa có mẫu đối chiếu giữa Giáo viên và AI'
    };
  }

  let tp = 0, fp = 0, fn = 0, tn = 0;
  let dapAnAgree = 0, trinhBayAgree = 0;
  let dapAnTotal = 0, trinhBayTotal = 0;

  cleanList.forEach(item => {
    const isTeacherPositive = item.teacherVerdict === 'dung' || item.teacherVerdict === true || item.teacherVerdict === 1;
    const isAiPositive = item.aiVerdict === 'dung' || item.aiVerdict === true || item.aiVerdict === 1;

    if (isTeacherPositive && isAiPositive) {
      tp++;
    } else if (!isTeacherPositive && isAiPositive) {
      fp++;
    } else if (isTeacherPositive && !isAiPositive) {
      fn++;
    } else {
      tn++;
    }

    if (item.dapAnVerdict !== undefined) {
      dapAnTotal++;
      if (item.dapAnVerdict === 'dung' || item.dapAnVerdict === true || item.dapAnVerdict === 1) {
        dapAnAgree++;
      }
    }
    if (item.trinhBayVerdict !== undefined) {
      trinhBayTotal++;
      if (item.trinhBayVerdict === 'dung' || item.trinhBayVerdict === true || item.trinhBayVerdict === 1) {
        trinhBayAgree++;
      }
    }
  });

  const accuracy = (tp + tn) / n;
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
  const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
  const specificity = (tn + fp) > 0 ? tn / (tn + fp) : 0;
  const f1Positive = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  
  // F1 lớp Chưa đạt (Negative)
  const precisionNeg = (tn + fn) > 0 ? tn / (tn + fn) : 0;
  const recallNeg = (tn + fp) > 0 ? tn / (tn + fp) : 0;
  const f1Negative = (precisionNeg + recallNeg) > 0 ? (2 * precisionNeg * recallNeg) / (precisionNeg + recallNeg) : 0;

  // Đối chứng "Luôn trả lời Đạt" (All-Positive baseline)
  const actualPos = tp + fn;
  const actualNeg = fp + tn;
  const baselineAccuracy = actualPos / n;
  const baselineF1Positive = (2 * actualPos) / (2 * actualPos + actualNeg);
  const baselineKappa = 0.0;

  const disagreementRate = (fp + fn) / n;

  const kappaPairs = cleanList.map(item => ({
    val1: (item.teacherVerdict === 'dung' || item.teacherVerdict === true || item.teacherVerdict === 1) ? '1' : '0',
    val2: (item.aiVerdict === 'dung' || item.aiVerdict === true || item.aiVerdict === 1) ? '1' : '0'
  }));
  const kappaRes = computeCohenKappa(kappaPairs);
  const wilsonAccuracy = wilsonInterval(tp + tn, n, 0.95);

  return {
    totalSamples: n,
    matrix: { tp, fp, fn, tn },
    metrics: {
      accuracy: Number((accuracy * 100).toFixed(2)),
      precision: Number((precision * 100).toFixed(2)),
      recall: Number((recall * 100).toFixed(2)),
      specificity: Number((specificity * 100).toFixed(2)),
      f1Score: Number((f1Positive * 100).toFixed(2)),
      f1Positive: Number((f1Positive * 100).toFixed(2)),
      f1Negative: Number((f1Negative * 100).toFixed(2)),
      baselineAccuracy: Number((baselineAccuracy * 100).toFixed(2)),
      baselineF1Positive: Number((baselineF1Positive * 100).toFixed(2)),
      baselineKappa: 0,
      cohenKappa: kappaRes.kappa,
      disagreementRate: Number((disagreementRate * 100).toFixed(2)),
      wilsonAccuracy: {
        lowerPct: Number((wilsonAccuracy.lower * 100).toFixed(2)),
        upperPct: Number((wilsonAccuracy.upper * 100).toFixed(2)),
        meanPct: Number((wilsonAccuracy.mean * 100).toFixed(2))
      }
    },
    breakdown: {
      dapAnTotal,
      dapAnCorrectCount: dapAnAgree,
      dapAnAccuracyPct: dapAnTotal > 0 ? Number(((dapAnAgree / dapAnTotal) * 100).toFixed(2)) : 0,
      trinhBayTotal,
      trinhBayCorrectCount: trinhBayAgree,
      trinhBayAccuracyPct: trinhBayTotal > 0 ? Number(((trinhBayAgree / trinhBayTotal) * 100).toFixed(2)) : 0
    }
  };
}

export default {
  wilsonInterval,
  computeCohenKappa,
  computeCohortAgreement,
  aggregateReviewsBySubjectAndCohort,
  computeTeacherAiConfusionMatrix
};
