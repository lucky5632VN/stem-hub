import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(req) {
  // Bảo vệ route bằng CRON_SECRET nếu cấu hình trên Vercel
  const authHeader = req.headers.get('authorization');
  const { searchParams } = new URL(req.url);
  const secretParam = searchParams.get('secret');

  if (
    process.env.CRON_SECRET && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}` && 
    secretParam !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = Date.now();
    const staleThresholdMs = 15000; // 15 giây không gửi heartbeat

    const matchRoomsRef = adminDb.collection('match_rooms');
    const querySnap = await matchRoomsRef.where('status', '==', 'playing').get();

    let cleaned = 0;
    const promises = [];

    querySnap.forEach(docSnap => {
      const room = docSnap.data();
      const lastHeartbeat = room.lastHeartbeat || 0;

      if (now - lastHeartbeat > staleThresholdMs) {
        cleaned += 1;
        promises.push(docSnap.ref.update({
          status: 'abandoned',
          abandonedAt: now,
          notes: 'Room abandoned due to missing host heartbeat.'
        }));
      }
    });

    await Promise.all(promises);
    return NextResponse.json({ success: true, cleanedRooms: cleaned });
  } catch (error) {
    console.error('Error running stale matches cleanup:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
