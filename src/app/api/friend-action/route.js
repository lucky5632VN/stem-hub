import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyAuth } from '@/lib/verifyAuth';

export async function POST(req) {
  const uid = await verifyAuth(req);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { actionType, payload } = body;
  if (!actionType || !payload || !payload.targetUid) {
    return NextResponse.json({ error: 'Missing actionType or targetUid' }, { status: 400 });
  }

  const targetUid = payload.targetUid;
  const myUserRef = adminDb.collection('users').doc(uid);
  const targetUserRef = adminDb.collection('users').doc(targetUid);

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      const myDoc = await transaction.get(myUserRef);
      const targetDoc = await transaction.get(targetUserRef);

      if (!myDoc.exists || !targetDoc.exists) {
        throw new Error('One or both user docs not found.');
      }

      const myData = myDoc.data();
      const targetData = targetDoc.data();

      const myFriends = myData.friends || [];
      const myIncoming = myData.incomingRequests || [];
      const myOutgoing = myData.outgoingRequests || [];

      const targetFriends = targetData.friends || [];
      const targetIncoming = targetData.incomingRequests || [];
      const targetOutgoing = targetData.outgoingRequests || [];

      switch (actionType) {
        case 'SEND_REQUEST': {
          if (targetIncoming.some(r => r.uid === uid)) {
            return { success: true, message: 'Already sent request.' };
          }

          const myInfo = {
            uid: uid,
            displayName: myData.displayName || 'Học viên',
            elo: myData.personalization?.elo || myData.stats?.elo || 1000,
            level: myData.personalization?.level || myData.stats?.level || 1,
            activeTitle: myData.personalization?.activeTitle || 'apprentice',
            avatarFrame: myData.personalization?.avatarFrame || 'default'
          };

          const newTargetIncoming = [...targetIncoming, myInfo];
          const newMyOutgoing = [...myOutgoing, targetUid];

          transaction.update(targetUserRef, { incomingRequests: newTargetIncoming });
          transaction.update(myUserRef, { outgoingRequests: newMyOutgoing });

          return { success: true };
        }

        case 'ACCEPT_REQUEST': {
          const senderInfo = myIncoming.find(r => r.uid === targetUid) || {
            uid: targetUid,
            displayName: targetData.displayName || 'Học viên',
            elo: targetData.personalization?.elo || targetData.stats?.elo || 1000,
            level: targetData.personalization?.level || targetData.stats?.level || 1,
            activeTitle: targetData.personalization?.activeTitle || 'apprentice',
            avatarFrame: targetData.personalization?.avatarFrame || 'default'
          };

          const newMyIncoming = myIncoming.filter(r => r.uid !== targetUid);
          const newMyFriends = [...myFriends, senderInfo];

          const newTargetOutgoing = targetOutgoing.filter(id => id !== uid);
          const myInfo = {
            uid: uid,
            displayName: myData.displayName || 'Học viên',
            elo: myData.personalization?.elo || myData.stats?.elo || 1000,
            level: myData.personalization?.level || myData.stats?.level || 1,
            activeTitle: myData.personalization?.activeTitle || 'apprentice',
            avatarFrame: myData.personalization?.avatarFrame || 'default'
          };
          const newTargetFriends = [...targetFriends, myInfo];

          transaction.update(myUserRef, {
            incomingRequests: newMyIncoming,
            friends: newMyFriends
          });
          transaction.update(targetUserRef, {
            outgoingRequests: newTargetOutgoing,
            friends: newTargetFriends
          });

          return { success: true };
        }

        case 'DECLINE_REQUEST': {
          const newMyIncoming = myIncoming.filter(r => r.uid !== targetUid);
          const newTargetOutgoing = targetOutgoing.filter(id => id !== uid);

          transaction.update(myUserRef, { incomingRequests: newMyIncoming });
          transaction.update(targetUserRef, { outgoingRequests: newTargetOutgoing });

          return { success: true };
        }

        case 'UNFRIEND': {
          const newMyFriends = myFriends.filter(f => f.uid !== targetUid);
          const newTargetFriends = targetFriends.filter(f => f.uid !== uid);

          transaction.update(myUserRef, { friends: newMyFriends });
          transaction.update(targetUserRef, { friends: newTargetFriends });

          return { success: true };
        }

        default:
          throw new Error('Friend action type không hợp lệ.');
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in friend action API:', error);
    return NextResponse.json({ error: error.message || 'Transaction failed' }, { status: 500 });
  }
}
