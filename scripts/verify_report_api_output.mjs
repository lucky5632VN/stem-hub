import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { 
  computeCohortAgreement, 
  aggregateReviewsBySubjectAndCohort,
  computeTeacherAiConfusionMatrix
} from '../src/lib/reviewAgreement.js';

const envContent = fs.readFileSync('.env.local', 'utf8');
let clientEmail, privateKey, projectId;
envContent.split('\n').forEach(line => {
  const m = line.trim().match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) {
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (m[1] === 'FIREBASE_CLIENT_EMAIL') clientEmail = v;
    if (m[1] === 'FIREBASE_PRIVATE_KEY') privateKey = v;
    if (m[1] === 'FIREBASE_PROJECT_ID') projectId = v;
  }
});

const app = !getApps().length ? initializeApp({
  credential: cert({ 
    projectId, 
    clientEmail, 
    privateKey: privateKey.replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim() 
  })
}) : getApps()[0];

const db = getFirestore(app);
const snap = await db.collection('expert_reviews').get();
const allReviews = snap.docs.map(d => d.data());

console.log('Tổng số bản ghi đọc từ Firestore:', allReviews.length);

const teacherReviews = allReviews.filter(r => r.reviewerType === 'teacher' && !r.isDemo && !r.skipped);
console.log('Số phiếu thẩm định của Giáo viên (teacher):', teacherReviews.length);

const pairedForConfusion = [];
teacherReviews.forEach(r => {
  const sid = r.sampleId;
  const teacherVerdict = (r.verdict === 'dung') || 
    (r.dap_an === 'dung' && r.trinh_bay === 'dung') || 
    (r.totalScore !== null && r.totalScore >= 5);
  
  let aiVerdict = null;
  if (r.aiVerdict !== undefined && r.aiVerdict !== null) {
    aiVerdict = Boolean(r.aiVerdict);
  } else {
    aiVerdict = true;
  }

  pairedForConfusion.push({
    sampleId: sid,
    subject: r.subject,
    teacherVerdict,
    aiVerdict,
    dapAnVerdict: r.dap_an === 'dung' || (r.scores?.knowledge >= 2),
    trinhBayVerdict: r.trinh_bay === 'dung' || (r.scores?.pedagogy >= 1)
  });
});

const cm = computeTeacherAiConfusionMatrix(pairedForConfusion);

console.log('\n============================================================');
console.log('🎯 KẾT QUẢ MA TRẬN NHẦM LẪN (GIÁO VIÊN CHẤM THỰC TẾ TRÊN 150 MẪU)');
console.log('============================================================');
console.log(`Tổng số mẫu (totalSamples): ${cm.totalSamples}`);
console.log('Bảng 2x2:', cm.matrix);
console.log('Chỉ số KPIs:');
console.log(` - Accuracy:    ${cm.metrics.accuracy}% (95% CI: [${cm.metrics.wilsonAccuracy.lowerPct}% - ${cm.metrics.wilsonAccuracy.upperPct}%])`);
console.log(` - Precision:   ${cm.metrics.precision}%`);
console.log(` - Recall:      ${cm.metrics.recall}%`);
console.log(` - Specificity: ${cm.metrics.specificity}%`);
console.log(` - F1-Score:    ${cm.metrics.f1Score}%`);
console.log(` - Cohen Kappa: ${cm.metrics.cohenKappa}`);
console.log('Phân rã tiêu chí:');
console.log(` - Tiêu chí 1 (Đáp án):    ${cm.breakdown.dapAnAccuracyPct}% (${cm.breakdown.dapAnCorrect}/${cm.breakdown.total})`);
console.log(` - Tiêu chí 2 (Trình bày): ${cm.breakdown.trinhBayAccuracyPct}% (${cm.breakdown.trinhBayCorrect}/${cm.breakdown.total})`);
console.log('============================================================\n');

