import fs from 'fs';

async function cleanupReleases() {
  console.log("⏳ Đang kết nối Firebase Hosting REST API...");

  let accessToken = '';
  try {
    const configPath = 'C:\\Users\\dell\\.config\\configstore\\firebase-tools.json';
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    accessToken = config.tokens?.access_token;

    const refreshToken = config.tokens?.refresh_token;
    if (refreshToken) {
      console.log("🔄 Lấy mới Access Token...");
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      });
      const tokenData = await tokenRes.json();
      if (tokenData.access_token) {
        accessToken = tokenData.access_token;
        console.log("🔑 Lấy Access Token mới thành công!");
      }
    }
  } catch (e) {
    console.error("Lỗi đọc config:", e.message);
  }

  if (!accessToken) {
    console.error("❌ Không lấy được Access Token!");
    return;
  }

  const siteId = 'cuoc-thi-ai-e2044';
  
  // 1. Lấy danh sách Versions của site
  const versionsUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${siteId}/sites/${siteId}/versions?pageSize=100`;
  const res = await fetch(versionsUrl, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  const data = await res.json();
  if (!data.versions || !Array.isArray(data.versions)) {
    console.error("❌ Không lấy được danh sách versions:", data);
    return;
  }

  console.log(`📊 Tìm thấy ${data.versions.length} versions trên Firebase Hosting.`);

  // Sắp xếp theo createTime mới nhất lên đầu
  data.versions.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));

  // Giữ lại 3 version mới nhất (tránh xóa nhầm bản live), xóa toàn bộ các version cũ
  const keepVersions = data.versions.slice(0, 3);
  const deleteVersions = data.versions.slice(3);

  console.log(`🌟 Giữ lại ${keepVersions.length} versions mới nhất.`);
  console.log(`🧹 Đang tiến hành xóa ${deleteVersions.length} versions cũ để giải phóng Hosting Storage...`);

  let deletedCount = 0;
  for (const ver of deleteVersions) {
    try {
      const delRes = await fetch(`https://firebasehosting.googleapis.com/v1beta1/${ver.name}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (delRes.ok || delRes.status === 200 || delRes.status === 204) {
        deletedCount++;
        console.log(`  ✅ Đã xóa thành công: ${ver.name}`);
      } else {
        const errText = await delRes.text();
        console.warn(`  ⚠️ Không xóa được ${ver.name}: status ${delRes.status} - ${errText}`);
      }
    } catch (err) {
      console.warn(`  ⚠️ Lỗi:`, err.message);
    }
  }

  console.log(`\n🎉 THÀNH CÔNG! Đã xóa ${deletedCount}/${deleteVersions.length} versions cũ, sẵn sàng Deploy!`);
}

cleanupReleases().catch(console.error);
