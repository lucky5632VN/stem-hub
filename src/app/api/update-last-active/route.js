import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyAuth } from '@/lib/verifyAuth';

export async function POST(req) {
  const uid = await verifyAuth(req);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    await adminDb.collection('users').doc(uid).update({
      lastActive: Date.now()
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating presence last active:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
