import { db, auth } from './firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function logAdminAction(action, targetId, targetName, detail) {
  try {
    const adminEmail = auth.currentUser ? auth.currentUser.email : 'admin123@gmail.com';
    const logCol = collection(db, 'admin_logs');
    const logDocRef = doc(logCol);
    await setDoc(logDocRef, {
      id: logDocRef.id,
      action,
      targetId: targetId || '',
      targetName: targetName || '',
      detail: detail || '',
      adminEmail,
      timestamp: serverTimestamp()
    });
    console.log(`[Audit Log] Ghi nhận hành động: ${action} bởi ${adminEmail}`);
  } catch (error) {
    console.error("Lỗi khi ghi log admin:", error);
  }
}
