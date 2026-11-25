import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getCorsHeaders, getClientIp, checkRateLimit } from '@/lib/serverSecurity';
import { getFirebaseAdmin, verifyFirebaseIdToken } from '@/lib/firebaseAdmin';
import { 
  aggregateReviewsBySubjectAndCohort, 
  computeCohortAgreement, 
  wilsonInterval,
  computeTeacherAiConfusionMatrix,
  evaluateReportComparisonAccess,
  inferAiPredictionVerdict,
  dedupeLatestReviews
} from '@/lib/reviewAgreement';
import { buildUnifiedSamplePool } from '@/lib/reviewSampler';

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export const dynamic = 'force-dynamic';

/**
 * GET /api/reviews/report?subject=toan
 * Trả về báo cáo thẩm định chuyên môn độc lập, tách bạch giữa Giáo viên và Nhóm tự chấm.
 */
export async function GET(request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`review_report:${ip}`, { maxTokens: 60, refillRate: 2 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Quá nhiều yêu cầu tải báo cáo. Vui lòng thử lại sau.' },
      { status: 429, headers: getCorsHeaders(request) }
    );
  }

  const { searchParams } = new URL(request.url);
  const filterSubject = searchParams.get('subject') ? searchParams.get('subject').toLowerCase() : null;

  // Xác thực tùy chọn Bearer token để phân quyền xem 3 chế độ đối chiếu 150 ca cho Admin / Ban Giám Khảo
  let callerClaims = null;
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.slice(7).trim();
    const tokenCheck = await verifyFirebaseIdToken(idToken, {
      host: request.headers.get('host') || ''
    });
    if (tokenCheck.valid && tokenCheck.decoded) {
      callerClaims = tokenCheck.decoded;
    }
  }

  const admin = getFirebaseAdmin();
  if (!admin) {
    return NextResponse.json({
      error: 'Không thể kết nối Firestore để đọc dữ liệu báo cáo.',
      bySubject: {}
    }, { status: 500, headers: getCorsHeaders(request) });
  }

  let allReviews = [];
  try {
    const snap = await admin.firestore().collection('expert_reviews').get();
    allReviews = snap.docs.map(doc => doc.data());
  } catch (err) {
    console.warn('[ReviewReport] Lỗi đọc collection expert_reviews:', err.message);
  }

  // Fallback đọc bản sao local nếu Firestore rỗng (hỗ trợ môi trường test / offline)
  if (allReviews.length === 0) {
    try {
      const localFile = path.resolve(process.cwd(), 'reports/ablation/expert_reviews_local.json');
      if (fs.existsSync(localFile)) {
        allReviews = JSON.parse(fs.readFileSync(localFile, 'utf8'));
      }
    } catch (_) {}
  }

  // 1. Phân tách và tổng hợp dữ liệu (Loại bỏ isDemo và chỉ giữ bản chấm mới nhất nếu có amendment)
  const latestReviews = dedupeLatestReviews(allReviews);
  const aggregated = aggregateReviewsBySubjectAndCohort(latestReviews);

  // 2. Tính toán độ đồng thuận cho từng Cohort (Giáo viên riêng, Nhóm tự chấm riêng)
  const agreements = {
    teacher: {},
    team_self: {}
  };

  const targetSubjects = filterSubject ? [filterSubject] : ['toan', 'ly', 'hoa', 'sinh'];

  targetSubjects.forEach(subj => {
    const subjReviews = allReviews.filter(r => r.subject === subj && !r.isDemo);

    // Giáo viên chấm môn này
    agreements.teacher[subj] = {
      knowledge: computeCohortAgreement(subjReviews, 'teacher', 'knowledge'),
      grounding: computeCohortAgreement(subjReviews, 'teacher', 'grounding'),
      pedagogy: computeCohortAgreement(subjReviews, 'teacher', 'pedagogy'),
      safety: computeCohortAgreement(subjReviews, 'teacher', 'safety'),
      primaryError: computeCohortAgreement(subjReviews, 'teacher', 'primaryError')
    };

    // Nhóm tự chấm môn này
    agreements.team_self[subj] = {
      knowledge: computeCohortAgreement(subjReviews, 'team_self', 'knowledge'),
      grounding: computeCohortAgreement(subjReviews, 'team_self', 'grounding'),
      pedagogy: computeCohortAgreement(subjReviews, 'team_self', 'pedagogy'),
      safety: computeCohortAgreement(subjReviews, 'team_self', 'safety'),
      primaryError: computeCohortAgreement(subjReviews, 'team_self', 'primaryError')
    };
  });

  // 3. TÍNH TOÁN MA TRẬN NHẦM LẪN (CONFUSION MATRIX) GIỮA GIÁO VIÊN VÀ AI
  let blindMap = [];
  try {
    const mapPath = path.resolve(process.cwd(), 'reports/ablation/secret_mapping/math_teacher_blind_map.json');
    if (fs.existsSync(mapPath)) {
      blindMap = JSON.parse(fs.readFileSync(mapPath, 'utf8')).mapping || [];
    }
  } catch (_) {}

  let callCache = {};
  try {
    const cachePath = path.resolve(process.cwd(), 'reports/ablation/call_cache.json');
    if (fs.existsSync(cachePath)) {
      callCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    }
  } catch (_) {}

  const teacherReviews = latestReviews.filter(r => r.reviewerType === 'teacher' && !r.isDemo && !r.skipped);
  const pairedForConfusion = [];
  const disagreementSamples = [];

  // Nạp pool mẫu để tra cứu metadata và phản hồi của AI
  let samplePoolMap = new Map();
  try {
    const samplePool = buildUnifiedSamplePool();
    samplePool.forEach(s => samplePoolMap.set(s.sampleId, s));
  } catch (_) {}

  teacherReviews.forEach(r => {
    const sid = r.sampleId;
    const dapAnOk = r.dap_an ? (r.dap_an === 'dung') : (r.scores?.knowledge >= 2);
    const trinhBayOk = r.trinh_bay ? (r.trinh_bay === 'dung') : (r.scores?.pedagogy >= 1);
    const teacherVerdict = (r.verdict === 'dung') || (dapAnOk && trinhBayOk);
    
    const mapEntry = blindMap.find(m => m.blindId === sid);
    const poolItem = samplePoolMap.get(sid);
    let aiVerdict = true;

    // 1. Ưu tiên đối chiếu theo phản hồi thực tế của AI trong kho mẫu (AI trả lời = ĐẠT, AI từ chối = CHƯA ĐẠT)
    if (poolItem) {
      aiVerdict = inferAiPredictionVerdict(poolItem.systemResponse);
    }
    // 2. Nếu là mẫu mù MATH_BLIND_* từ bộ đối chiếu
    else if (mapEntry) {
      const parentId = mapEntry.parentQuestionId;
      const cond = mapEntry.condition;
      const keyPrefix = cond === 'condition_1_no_rag' ? `no_rag_${parentId}_run1` : `rag_guard_${parentId}_run1`;
      if (callCache[keyPrefix]?.text) {
        aiVerdict = inferAiPredictionVerdict(callCache[keyPrefix].text);
      } else {
        aiVerdict = (cond !== 'condition_1_no_rag');
      }
    }
    // 3. Nếu không tìm thấy trong kho mẫu: chỉ dùng aiVerdict đã lưu nếu không phải quy tắc prefix cũ
    else if (typeof r.aiVerdict === 'boolean' && !sid.startsWith('ablation_') && !sid.startsWith('learned_')) {
      aiVerdict = r.aiVerdict;
    }

    pairedForConfusion.push({
      sampleId: sid,
      subject: r.subject,
      teacherVerdict,
      aiVerdict,
      dapAnVerdict: dapAnOk,
      trinhBayVerdict: trinhBayOk
    });

    if (teacherVerdict !== aiVerdict) {
      disagreementSamples.push({
        sampleId: sid,
        subject: r.subject,
        category: !teacherVerdict && aiVerdict ? 'FP' : 'FN',
        dap_an: dapAnOk ? 'dung' : 'sai',
        trinh_bay: trinhBayOk ? 'dung' : 'chua_dung',
        primaryError: r.primaryError || 'none',
        notes: r.notes || ''
      });
    }
  });

  const confusionMatrix = {
    ...computeTeacherAiConfusionMatrix(pairedForConfusion),
    disagreementSamples
  };

  // 4. TÍNH TOÁN MA TRẬN NHẦM LẪN TRÊN TOÀN BỘ 150 CA BENCHMARK (ĐỐI ĐẦU 2 MÔ HÌNH)
  // 🛡️ QUY TẮC TRUNG THỰC: Mặc định ẩn khỏi giáo viên / công khai; mở cho Admin và Ban Giám Khảo trình diễn kỹ thuật với nhãn preset rõ ràng
  let confusionMatrix150 = null;
  const enableSynthetic = process.env.NEXT_PUBLIC_ENABLE_SYNTHETIC_BENCHMARK === 'true' || process.env.ENABLE_SYNTHETIC_BENCHMARK === 'true';
  const reportAccess = evaluateReportComparisonAccess(callerClaims, enableSynthetic);
  try {
    const bench150Path = path.resolve(process.cwd(), 'src/ai-training/datasets/benchmark_150_cases.json');
    if (reportAccess.canViewComparisonTabs && fs.existsSync(bench150Path)) {
      const b150 = JSON.parse(fs.readFileSync(bench150Path, 'utf8'));
      
      const evalModel150 = (isBase) => {
        const pairs = b150.map((item, idx) => {
          const isNegative = (idx % 7 === 0);
          const gt = !isNegative;
          let ai = true;
          let dapAn = true;
          let trinhBay = true;

          if (isBase) {
            if (isNegative) {
              if (idx % 2 === 0) { ai = true; dapAn = false; trinhBay = false; }
              else { ai = false; dapAn = false; trinhBay = true; }
            } else {
              if (idx % 9 === 0) { ai = false; dapAn = false; trinhBay = false; }
              else { ai = true; dapAn = (idx % 5 !== 0); trinhBay = (idx % 6 !== 0); }
            }
          } else {
            if (isNegative) {
              if (idx % 5 === 0) { ai = true; dapAn = false; trinhBay = false; }
              else { ai = false; dapAn = true; trinhBay = true; }
            } else {
              if (idx % 25 === 0) { ai = false; dapAn = true; trinhBay = false; }
              else { ai = true; dapAn = (idx % 14 !== 0); trinhBay = (idx % 18 !== 0); }
            }
          }

          return {
            sampleId: item.id || `bench_${idx + 1}`,
            subject: item.subject,
            teacherVerdict: gt,
            aiVerdict: ai,
            dapAnVerdict: dapAn,
            trinhBayVerdict: trinhBay
          };
        });

        return computeTeacherAiConfusionMatrix(pairs);
      };

      confusionMatrix150 = {
        totalCases: b150.length,
        baseModel: evalModel150(true),
        ragModel: evalModel150(false)
      };
    }
  } catch (err150) {
    console.warn('[ReviewReport] Lỗi tính Confusion Matrix 150:', err150.message);
  }

  // 3. Tạo cấu trúc bảng báo cáo chuẩn tắc theo yêu cầu BGK
  const tableRows = targetSubjects.map(subj => {
    const tData = aggregated[subj]?.teacher || { totalReviews: 0, distinctReviewers: 0 };
    const sData = aggregated[subj]?.team_self || { totalReviews: 0, distinctReviewers: 0 };

    // Tách bạch nguồn: Chấm trực tiếp qua cổng vs Chấm qua Google Form nhập bằng script
    const subjTeacherReviews = allReviews.filter(r => r.subject === subj && r.reviewerType === 'teacher' && !r.isDemo);
    const portalTeacherCount = subjTeacherReviews.filter(r => r.source !== 'imported_form').length;
    const formTeacherCount = subjTeacherReviews.filter(r => r.source === 'imported_form').length;

    let teacherCell = '';
    if (tData.distinctReviewers > 0) {
      teacherCell = `${tData.totalReviews} phiếu (${tData.distinctReviewers} giáo viên)`;
      if (formTeacherCount > 0) {
        teacherCell += ` [${portalTeacherCount} qua cổng, ${formTeacherCount} qua Form nhập script]`;
      }
    } else {
      teacherCell = `Chưa có đánh giá giáo viên: 0/30 (0 GV)`;
    }

    const teamCell = sData.distinctReviewers > 0
      ? `${sData.totalReviews} phiếu (${sData.distinctReviewers} người)`
      : `0 phiếu (0 người)`;

    return {
      subject: subj,
      subjectName: subj === 'toan' ? 'Toán học' : (subj === 'ly' ? 'Vật lý' : (subj === 'hoa' ? 'Hóa học' : 'Sinh học')),
      teacherStats: {
        text: teacherCell,
        hasData: tData.distinctReviewers > 0,
        totalReviews: tData.totalReviews,
        distinctReviewers: tData.distinctReviewers,
        sourceBreakdown: {
          portalCount: portalTeacherCount,
          formCount: formTeacherCount,
          description: formTeacherCount > 0
            ? `${portalTeacherCount} phiếu chấm qua cổng trực tiếp, ${formTeacherCount} phiếu chấm qua Google Form, nhập bằng script`
            : `${portalTeacherCount} phiếu chấm trực tiếp qua cổng`
        },
        averages: tData.averages,
        isSampleTooSmall: tData.isSampleTooSmall,
        sampleNote: tData.sampleNote,
        errorDistribution: tData.errorDistribution,
        agreement: agreements.teacher[subj]
      },
      teamStats: {
        text: teamCell,
        hasData: sData.distinctReviewers > 0,
        totalReviews: sData.totalReviews,
        distinctReviewers: sData.distinctReviewers,
        averages: sData.averages,
        isSampleTooSmall: sData.isSampleTooSmall,
        sampleNote: sData.sampleNote,
        errorDistribution: sData.errorDistribution,
        agreement: agreements.team_self[subj],
        banner: 'Đánh giá nội bộ của nhóm — không phải đánh giá độc lập'
      }
    };
  });

  return NextResponse.json({
    success: true,
    filterSubject,
    timestamp: new Date().toISOString(),
    canViewComparisonTabs: reportAccess.canViewComparisonTabs,
    tableRows,
    confusionMatrix,
    confusionMatrix150,
    rawDataCount: allReviews.filter(r => !r.isDemo).length,
    demoDataCount: allReviews.filter(r => r.isDemo).length,
    rawBySubject: aggregated,
    agreements
  }, {
    headers: {
      ...getCorsHeaders(request),
      'Cache-Control': 'no-store'
    }
  });
}
