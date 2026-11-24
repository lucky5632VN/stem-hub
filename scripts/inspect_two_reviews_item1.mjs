import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const envContent = fs.readFileSync('.env.local', 'utf8');
const regex = /^\s*([A-Za-z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^#\r\n]*))/gm;
let m;
while ((m = regex.exec(envContent)) !== null) {
  const key = m[1];
  let val = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : m[4]);
  if (val !== undefined && !process.env[key]) {
    process.env[key] = val.trim();
  }
}

let cleanKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim();
const app = initializeApp({
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'cuoc-thi-ai-e2044',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: cleanKey
  })
});
const db = getFirestore(app);
const auth = getAuth(app);

async function main() {
  console.log('=== [MỤC 1] KIỂM TRA CHI TIẾT 2 PHIẾU GÂY RA MA TRẬN 2 MẪU (rev_150_hoa_bench_hoa_01 & 02) ===\n');
  const targetIds = ['rev_150_hoa_bench_hoa_01', 'rev_150_hoa_bench_hoa_02'];

  for (const id of targetIds) {
    const docSnap = await db.collection('expert_reviews').doc(id).get();
    if (!docSnap.exists) {
      console.log(`Document ${id} không tồn tại trong Firestore!`);
      continue;
    }
    const d = docSnap.data();
    let claims = {};
    let userEmailPrefix = 'N/A';
    if (d.reviewerUid) {
      try {
        const u = await auth.getUser(d.reviewerUid);
        claims = u.customClaims || {};
        if (u.email) {
          const parts = u.email.split('@');
          userEmailPrefix = `${parts[0].slice(0, 3)}***@${parts[1]}`;
        }
      } catch (e) {
        claims = { error: e.message };
      }
    }
    const rawUid = String(d.reviewerUid || '');
    const maskedUid = rawUid.length > 8 ? `${rawUid.slice(0, 4)}...${rawUid.slice(-4)}` : '***';

    console.log(`Phiếu: ${id}`);
    console.log(`  - reviewerType: ${d.reviewerType}`);
    console.log(`  - reviewerCode: ${d.reviewerCode || 'chưa gán'}`);
    console.log(`  - reviewerUid (đã che): ${maskedUid}`);
    console.log(`  - Email tài khoản (đã che): ${userEmailPrefix}`);
    console.log(`  - Claims của tài khoản: ${JSON.stringify(claims)}`);
    console.log(`    + Có claim reviewerType teacher? ${claims.reviewerType === 'teacher' ? 'CÓ' : 'KHÔNG'}`);
    console.log(`    + Có claim team_self? ${claims.reviewerType === 'team_self' ? 'CÓ' : 'KHÔNG'}`);
    console.log(`  - source: ${d.source || 'portal'}`);
    console.log(`  - sampleId: ${d.sampleId}`);
    console.log(`  - Thuộc bộ dữ liệu: benchmark (mã ${d.sampleId} thuộc tập 150 benchmark cases)`);
    console.log(`  - createdAt / timestamp: ${d.timestamp || d.createdAt}`);
    console.log(`  - aiVerdict: ${d.aiVerdict}`);
    console.log(`  - overallVerdict: ${d.verdict}`);
    console.log(`  - dap_an: ${d.dap_an} | trinh_bay: ${d.trinh_bay}`);
    console.log(`  - isDemo: ${d.isDemo}`);
    console.log(`  - notes: ${d.notes}\n`);
  }

  // Tra cứu ai đã cấp claims cho tài khoản reviewerUid (sZmj...bHI3)
  console.log('=== TRA CỨU ADMIN LOGS: AI CẤP CLAIMS CHO TÀI KHOẢN sZmj...bHI3 ===');
  const targetUid = 'sZmjOcLHQlcLfKEtpQmGxJfAbHI3';
  const adminSnap = await db.collection('admin_logs').get();
  let found = false;
  adminSnap.docs.forEach(doc => {
    const d = doc.data();
    if (d.targetUid === targetUid || (d.details && d.details.targetUid === targetUid) || d.userId === targetUid) {
      found = true;
      const adminUid = String(d.adminUid || d.performedBy || '');
      const maskedAdmin = adminUid.length > 8 ? `${adminUid.slice(0, 4)}...${adminUid.slice(-4)}` : '***';
      console.log(`- Thời điểm: ${d.timestamp || d.createdAt}`);
      console.log(`  Hành động: ${d.action || d.type}`);
      console.log(`  Người thực hiện (adminUid đã che): ${maskedAdmin}`);
      console.log(`  Đối tượng (targetUid đã che): ${targetUid.slice(0, 4)}...${targetUid.slice(-4)}`);
      console.log(`  Chi tiết log: ${JSON.stringify(d.details || d.payload || {})}`);
    }
  });
  if (!found) {
    console.log(`Không tìm thấy bản ghi cấp quyền cụ thể cho UID ${targetUid.slice(0, 4)}...${targetUid.slice(-4)} trong 39 admin_logs (có thể cấp qua Firebase Console hoặc script CLI admin cấp trực tiếp).`);
  }
}

main().then(() => process.exit(0)).catch(console.error);

