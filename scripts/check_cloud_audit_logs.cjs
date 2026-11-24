const fs = require('fs');
const path = require('path');
const { JWT } = require('google-auth-library');

const envLocalPath = path.resolve('.env.local');
let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
let projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'cuoc-thi-ai-e2044';

if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (match) {
      const k = match[1];
      let v = match[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (k === 'FIREBASE_CLIENT_EMAIL' && !clientEmail) clientEmail = v;
      if (k === 'FIREBASE_PRIVATE_KEY' && !privateKey) privateKey = v;
      if (k === 'FIREBASE_PROJECT_ID' && !projectId) projectId = v;
    }
  }
}

if (!clientEmail || !privateKey) {
  console.log('Firebase credentials not found in environment.');
  process.exit(1);
}

let cleanKey = privateKey.replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim();
const crypto = require('crypto');
let normalizedPem = cleanKey;
try {
  const lines = cleanKey.split('\n').map(l => l.trim()).filter(Boolean);
  const b64 = lines.slice(1, -1).join('');
  const buf = Buffer.from(b64, 'base64');
  const k = crypto.createPrivateKey({ key: buf, format: 'der', type: 'pkcs8' });
  normalizedPem = k.export({ type: 'pkcs8', format: 'pem' });
} catch (e) {}

async function checkCloudAuditLogs() {
  console.log('========================================================================');
  console.log('🔍 KIỂM TRA TRẠNG THÁI CLOUD AUDIT LOGS (DATA ACCESS) CHO FIRESTORE');
  console.log('========================================================================');
  console.log('Project ID:', projectId);
  console.log('Service Account:', clientEmail);

  try {
    const client = new JWT({
      email: clientEmail,
      key: normalizedPem,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    const res = await client.request({
      url: `https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}:getIamPolicy`,
      method: 'POST'
    });

    const auditConfigs = res.data.auditConfigs || [];
    console.log('\nAudit Configs count:', auditConfigs.length);

    const firestoreAudit = auditConfigs.find(c => c.service === 'firestore.googleapis.com' || c.service === 'allServices');
    if (firestoreAudit) {
      console.log('✅ Tìm thấy cấu hình Audit Logs cho Firestore:');
      console.log(JSON.stringify(firestoreAudit, null, 2));
    } else {
      console.log('⚠️ CHƯA CÓ cấu hình Data Access Audit Logs riêng cho Firestore (auditConfigs trống hoặc không có firestore.googleapis.com / allServices).');
      console.log('Mặc định Google Cloud: Chỉ ghi Admin Activity logs (miễn phí), KHÔNG ghi Data Access logs (DATA_READ / DATA_WRITE) cho Firestore.');
    }
  } catch (err) {
    console.log('⚠️ Không thể đọc IAM Policy:', err.message);
    if (err.response) {
      console.log('HTTP Status:', err.response.status);
      console.log('Error details:', JSON.stringify(err.response.data));
    }
    console.log('\nNhận định kỹ thuật: Service account Firebase Admin mặc định không có quyền resourcemanager.projects.getIamPolicy.');
    console.log('Theo mặc định mặc định của Google Cloud Platform trên mọi project mới tạo:');
    console.log('- Admin Activity audit logs: LUÔN BẬT (ghi lại ai sửa rules, sửa index, tạo/xóa database).');
    console.log('- Data Access audit logs (DATA_WRITE/DATA_READ): MẶC ĐỊNH TẮT (vì sinh dung lượng log rất lớn và tính phí Cloud Logging).');
  }
}

checkCloudAuditLogs();
