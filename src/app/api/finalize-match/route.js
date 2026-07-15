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

  const { matchId } = body;
  if (!matchId) {
    return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });
  }

  const matchRef = adminDb.collection('match_rooms').doc(matchId);
  const settingsRef = adminDb.collection('config').doc('systemSettings');

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      const matchDoc = await transaction.get(matchRef);
      if (!matchDoc.exists) {
        throw new Error('Match room not found');
      }
      const roomData = matchDoc.data();
      if (roomData.status === 'result') {
        return { success: true, alreadyFinalized: true };
      }

      const p1Prog = roomData.player1Progress || 0;
      const p2Prog = roomData.player2Progress || 0;
      const timeRemaining = roomData.timeRemaining !== undefined ? roomData.timeRemaining : 60;

      if (p1Prog < 100 && p2Prog < 100 && timeRemaining > 0) {
        throw new Error('Trận đấu chưa kết thúc (thời gian chưa hết và chưa có ai đạt 100% tiến độ).');
      }

      let winnerId = 'draw';
      if (p1Prog > p2Prog) {
        winnerId = roomData.player1.uid;
      } else if (p2Prog > p1Prog) {
        winnerId = roomData.player2.uid;
      }

      const p1Ref = adminDb.collection('users').doc(roomData.player1.uid);
      const p2Ref = adminDb.collection('users').doc(roomData.player2.uid);

      const [p1Doc, p2Doc, settingsSnap] = await Promise.all([
        transaction.get(p1Ref),
        transaction.get(p2Ref),
        transaction.get(settingsRef)
      ]);

      if (!p1Doc.exists || !p2Doc.exists) {
        throw new Error('One of the players user doc not found.');
      }

      const p1Data = p1Doc.data();
      const p2Data = p2Doc.data();

      const p1Elo = p1Data.stats?.elo !== undefined ? p1Data.stats.elo : 1000;
      const p2Elo = p2Data.stats?.elo !== undefined ? p2Data.stats.elo : 1000;

      let expMultiplier = 1.0;
      let pvpCrystalStake = 50;
      let pvpEloFactor = 25;

      if (settingsSnap.exists) {
        const settings = settingsSnap.data();
        if (settings.expMultiplier !== undefined) expMultiplier = Number(settings.expMultiplier);
        if (settings.pvpCrystalStake !== undefined) pvpCrystalStake = Number(settings.pvpCrystalStake);
        if (settings.pvpEloFactor !== undefined) pvpEloFactor = Number(settings.pvpEloFactor);
      }

      const expectedP1 = 1 / (1 + Math.pow(10, (p2Elo - p1Elo) / 400));
      const expectedP2 = 1 / (1 + Math.pow(10, (p1Elo - p2Elo) / 400));

      let scoreP1 = 0.5;
      let scoreP2 = 0.5;
      if (winnerId === roomData.player1.uid) {
        scoreP1 = 1;
        scoreP2 = 0;
      } else if (winnerId === roomData.player2.uid) {
        scoreP1 = 0;
        scoreP2 = 1;
      }

      let eloChangeP1 = Math.round(pvpEloFactor * (scoreP1 - expectedP1));
      let eloChangeP2 = Math.round(pvpEloFactor * (scoreP2 - expectedP2));

      if (winnerId === roomData.player1.uid) {
        eloChangeP1 = Math.max(15, Math.min(32, eloChangeP1));
        eloChangeP2 = -eloChangeP1;
      } else if (winnerId === roomData.player2.uid) {
        eloChangeP2 = Math.max(15, Math.min(32, eloChangeP2));
        eloChangeP1 = -eloChangeP2;
      } else {
        eloChangeP1 = Math.round(eloChangeP1);
        eloChangeP2 = Math.round(eloChangeP2);
      }

      let p1ExpChange = Math.floor((winnerId === roomData.player1.uid ? 250 : winnerId === 'draw' ? 100 : 50) * expMultiplier);
      let p2ExpChange = Math.floor((winnerId === roomData.player2.uid ? 250 : winnerId === 'draw' ? 100 : 50) * expMultiplier);

      let p1CrystalChange = winnerId === roomData.player1.uid ? pvpCrystalStake : 0;
      let p2CrystalChange = winnerId === roomData.player2.uid ? pvpCrystalStake : 0;

      const p1Stats = p1Data.stats || {};
      const p1Pers = p1Data.personalization || {};
      const newEloP1 = Math.max(0, p1Elo + eloChangeP1);
      const newExpP1 = (p1Stats.exp || 0) + p1ExpChange;
      let newLevelP1 = p1Stats.level || 1;
      let nextLevelExpP1 = p1Stats.nextLevelExp || 1000;
      while (newExpP1 >= nextLevelExpP1) {
        newLevelP1 += 1;
        nextLevelExpP1 = newLevelP1 * 1000;
      }

      transaction.update(p1Ref, {
        'stats.elo': newEloP1,
        'stats.exp': newExpP1,
        'stats.level': newLevelP1,
        'stats.nextLevelExp': nextLevelExpP1,
        'stats.wins': (p1Stats.wins || 0) + (winnerId === roomData.player1.uid ? 1 : 0),
        'stats.losses': (p1Stats.losses || 0) + (winnerId === roomData.player2.uid ? 1 : 0),
        'personalization.crystals': (p1Pers.crystals || 0) + p1CrystalChange,
        'personalization.elo': newEloP1,
        'personalization.level': newLevelP1
      });

      const p2Stats = p2Data.stats || {};
      const p2Pers = p2Data.personalization || {};
      const newEloP2 = Math.max(0, p2Elo + eloChangeP2);
      const newExpP2 = (p2Stats.exp || 0) + p2ExpChange;
      let newLevelP2 = p2Stats.level || 1;
      let nextLevelExpP2 = p2Stats.nextLevelExp || 1000;
      while (newExpP2 >= nextLevelExpP2) {
        newLevelP2 += 1;
        nextLevelExpP2 = newLevelP2 * 1000;
      }

      transaction.update(p2Ref, {
        'stats.elo': newEloP2,
        'stats.exp': newExpP2,
        'stats.level': newLevelP2,
        'stats.nextLevelExp': nextLevelExpP2,
        'stats.wins': (p2Stats.wins || 0) + (winnerId === roomData.player2.uid ? 1 : 0),
        'stats.losses': (p2Stats.losses || 0) + (winnerId === roomData.player1.uid ? 1 : 0),
        'personalization.crystals': (p2Pers.crystals || 0) + p2CrystalChange,
        'personalization.elo': newEloP2,
        'personalization.level': newLevelP2
      });

      transaction.update(matchRef, {
        status: 'result',
        winnerId: winnerId,
        player1EloChange: eloChangeP1,
        player2EloChange: eloChangeP2,
        player1ExpChange: p1ExpChange,
        player2ExpChange: p2ExpChange,
        player1CrystalChange: p1CrystalChange,
        player2CrystalChange: p2CrystalChange
      });

      return {
        success: true,
        winnerId,
        player1: { eloChange: eloChangeP1, expChange: p1ExpChange, crystalChange: p1CrystalChange },
        player2: { eloChange: eloChangeP2, expChange: p2ExpChange, crystalChange: p2CrystalChange }
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error finalizing match:', error);
    return NextResponse.json({ error: error.message || 'Transaction failed' }, { status: 500 });
  }
}
