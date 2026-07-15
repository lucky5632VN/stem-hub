import { adminAuth } from './firebaseAdmin';

export async function verifyAuth(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.split('Bearer ')[1];
    if (!token) return null;

    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('🔑 [Auth Verification Failed]:', error);
    return null;
  }
}
