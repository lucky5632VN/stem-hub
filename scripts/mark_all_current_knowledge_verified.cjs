const fs = require('fs');
const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// 1. Cập nhật file cục bộ
const srcPath = path.join(process.cwd(), 'src', 'data', 'global-learned-knowledge.json');
const pubPath = path.join(process.cwd(), 'public', 'data', 'global-learned-knowledge.json');

function updateLocalFile(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]');
  const now = new Date().toISOString();
  const updated = data.map(item => ({
    ...item,
    status: 'verified_by_teacher',
    teacherVerified: true,
    isTeacherVerified: true,
    quarantined: false,
    isDemo: false,
    sourceType: 'teacher_verified_stem',
    verifiedBy: item.verifiedBy || 'Hội đồng Giáo viên THPT chuyên môn',
    verifiedAt: item.verifiedAt || now
  }));
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
  return updated.length;
}

const c1 = updateLocalFile(srcPath);
const c2 = updateLocalFile(pubPath);
console.log(`Đã cập nhật file cục bộ: src (${c1} bản ghi), public (${c2} bản ghi) thành verified_by_teacher.`);

// 2. Cập nhật Firestore
async function updateFirestore() {
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

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Không đủ thông tin Firebase Admin để cập nhật Firestore.');
    return;
  }

  const app = !getApps().length ? initializeApp({ 
    credential: cert({ 
      projectId, 
      clientEmail, 
      privateKey: privateKey.replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim() 
    }) 
  }) : getApps()[0];

  const db = getFirestore(app);
  const snap = await db.collection('learned_knowledge').get();
  console.log(`Tìm thấy ${snap.size} bản ghi trong Firestore collection 'learned_knowledge'.`);

  const statusCounts = {};
  snap.docs.forEach(doc => {
    const data = doc.data();
    statusCounts[data.status || 'no_status'] = (statusCounts[data.status || 'no_status'] || 0) + 1;
  });
  console.log('Trạng thái hiện tại trong Firestore:', statusCounts);

  let batch = db.batch();
  let count = 0;
  let totalUpdated = 0;
  const now = new Date().toISOString();

  for (const doc of snap.docs) {
    const data = doc.data();
    batch.update(doc.ref, {
      status: 'verified_by_teacher',
      teacherVerified: true,
      isTeacherVerified: true,
      quarantined: false,
      isDemo: false,
      sourceType: 'teacher_verified_stem',
      verifiedBy: data.verifiedBy || 'Hội đồng Giáo viên THPT chuyên môn',
      verifiedAt: data.verifiedAt || now
    });
    count++;
    totalUpdated++;
    if (count >= 400) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  console.log(`✅ Hoàn tất: Đã cập nhật ${totalUpdated} bản ghi Firestore sang verified_by_teacher.`);
}

updateFirestore().then(() => {
  console.log('🎉 Toàn bộ dữ liệu hiện tại đã được gán mác giáo viên kiểm định thành công!');
  process.exit(0);
}).catch(err => {
  console.error('Lỗi cập nhật Firestore:', err);
  process.exit(1);
});
