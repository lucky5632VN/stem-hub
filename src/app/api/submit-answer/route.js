import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyAuth } from '@/lib/verifyAuth';
import { calculateLaserPath } from '@/lib/physicsEngine';

const CHEMISTRY_MISSIONS = [
  { id: 'mission_01_cl2_synthesis' },
  { id: 'mission_02_nacl_neutralization' },
  { id: 'mission_03_esterification' },
  { id: 'mission_04_thermite_reaction' },
  { id: 'mission_05_na_combustion' },
  { id: 'mission_06_copper_complex' },
  { id: 'mission_07_fe_cl2_combustion' },
  { id: 'mission_08_biuret_test' },
  { id: 'mission_09_iodine_starch' },
  { id: 'mission_10_h2_explosion' }
];

function checkChemistryMatch(missionId, equation, reactants) {
  const eq = (equation || '').toLowerCase();
  const reqs = reactants || [];
  if (missionId === 'mission_01_cl2_synthesis') {
    return eq.includes('cl2') || eq.includes('clo') || (reqs.includes('mno2') && reqs.includes('hcl')) || (reqs.includes('mno2_powder') && reqs.includes('hcl_conc'));
  }
  if (missionId === 'mission_02_nacl_neutralization') {
    return eq.includes('nacl') || (reqs.includes('hcl') && reqs.includes('naoh')) || (reqs.includes('hcl_dil') && reqs.includes('naoh_dil'));
  }
  if (missionId === 'mission_03_esterification') {
    return eq.includes('ester') || eq.includes('ethyl_acetate') || eq.includes('este') || (reqs.includes('ch3cooh') && reqs.includes('ethanol')) || (reqs.includes('ch3cooh_glacial') && reqs.includes('c2h5oh'));
  }
  if (missionId === 'mission_04_thermite_reaction') {
    return eq.includes('thermite') || eq.includes('nhiệt nhôm') || eq.includes('fe2o3 + 2al') || (reqs.includes('fe2o3') && reqs.includes('al'));
  }
  if (missionId === 'mission_05_na_combustion') {
    return eq.includes('na2o') || eq.includes('na oxit') || (reqs.includes('na_metal') && (reqs.includes('o2') || reqs.includes('o2_gas') || eq.includes('o2') || eq.includes('cháy')));
  }
  if (missionId === 'mission_06_copper_complex') {
    return eq.includes('[cu(nh3)4]') || eq.includes('cu_oh_2+nh3') || eq.includes('cuso4+nh3') || (reqs.includes('cuso4') && reqs.includes('nh3')) || (reqs.includes('cu_oh_2') && reqs.includes('nh3'));
  }
  if (missionId === 'mission_07_fe_cl2_combustion') {
    return eq.includes('fecl3') || eq.includes('fe + cl2') || (reqs.includes('fe') && reqs.includes('cl2_gas'));
  }
  if (missionId === 'mission_08_biuret_test') {
    return eq.includes('biuret') || eq.includes('albumin') || (reqs.includes('albumin') && reqs.includes('cuso4') && reqs.includes('naoh'));
  }
  if (missionId === 'mission_09_iodine_starch') {
    return eq.includes('complex-blue-black') || eq.includes('starch') || (reqs.includes('starch') && reqs.includes('iodine'));
  }
  if (missionId === 'mission_10_h2_explosion') {
    return eq.includes('h2_combustion') || eq.includes('explosion-pop') || (reqs.includes('h2_gas') && reqs.includes('o2_gas'));
  }
  return false;
}

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

  const { matchId, questionId, selectedAnswer } = body;

  if (!matchId) {
    return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });
  }

  const matchRef = adminDb.collection('match_rooms').doc(matchId);
  const matchDoc = await matchRef.get();
  if (!matchDoc.exists) {
    return NextResponse.json({ error: 'Match room not found' }, { status: 404 });
  }

  const roomData = matchDoc.data();
  if (roomData.status !== 'playing') {
    return NextResponse.json({ error: 'Match is not in playing state' }, { status: 400 });
  }

  const isPlayer1 = roomData.player1.uid === uid;
  const isPlayer2 = roomData.player2.uid === uid;
  if (!isPlayer1 && !isPlayer2) {
    return NextResponse.json({ error: 'You are not a participant in this match' }, { status: 403 });
  }

  const subject = roomData.subject;
  const matchData = roomData.matchData || {};
  const questionPool = matchData.questionPool || [];

  let correct = false;
  let currentProgress = 0;
  let explanation = '';

  if (subject === 'biology') {
    const qIndex = Number(questionId);
    if (isNaN(qIndex) || qIndex < 0 || qIndex >= questionPool.length) {
      return NextResponse.json({ error: 'Invalid questionId' }, { status: 400 });
    }
    const q = questionPool[qIndex];
    correct = q.correct === selectedAnswer;
    explanation = q.note || '';

    const scoreKey = isPlayer1 ? 'player1Score' : 'player2Score';
    const currentScore = roomData[scoreKey] || 0;
    const newScore = correct ? currentScore + 1 : currentScore;

    const nextQ = qIndex + 1;
    if (nextQ >= questionPool.length) {
      const pct = Math.round((newScore / questionPool.length) * 100);
      currentProgress = pct >= 60 ? Math.min(100, pct + 10) : pct;
    } else {
      currentProgress = Math.round((nextQ / questionPool.length) * 100);
    }

    const updateData = {
      [scoreKey]: newScore,
      [isPlayer1 ? 'player1Progress' : 'player2Progress']: currentProgress
    };
    await matchRef.update(updateData);
  } else if (subject === 'math') {
    const astIndex = Number(questionId);
    if (isNaN(astIndex) || astIndex < 0 || astIndex >= questionPool.length) {
      return NextResponse.json({ error: 'Invalid asteroidIndex' }, { status: 400 });
    }
    const target = questionPool[astIndex];
    const userX = selectedAnswer.x;
    const userY = selectedAnswer.y;
    correct = target.coord.x === userX && target.coord.y === userY;

    const scoreKey = isPlayer1 ? 'player1Score' : 'player2Score';
    const currentScore = roomData[scoreKey] || 0;
    const newScore = correct ? currentScore + 1 : currentScore;

    const nextIndex = astIndex + 1;
    if (nextIndex >= questionPool.length) {
      currentProgress = 100;
    } else {
      currentProgress = Math.floor((nextIndex / questionPool.length) * 100);
    }

    const updateData = {
      [scoreKey]: newScore,
      [isPlayer1 ? 'player1Progress' : 'player2Progress']: currentProgress
    };
    await matchRef.update(updateData);
  } else if (subject === 'physics') {
    try {
      const { physMirrors } = selectedAnswer || {};
      if (!physMirrors || !Array.isArray(physMirrors) || physMirrors.length < 3) {
        return NextResponse.json({ error: 'physMirrors is missing or invalid' }, { status: 400 });
      }

      const physTarget = (matchData.physTarget && Array.isArray(matchData.physTarget) && matchData.physTarget.length === 3)
        ? matchData.physTarget
        : [45, 90, 135];

      const isMatchTarget = Number(physMirrors[0]) === physTarget[0] &&
                            Number(physMirrors[1]) === physTarget[1] &&
                            Number(physMirrors[2]) === physTarget[2];

      const mirrors = physMirrors.map((angle, idx) => ({
        x: idx === 0 ? 45 : 175,
        y: idx === 2 ? 140 : 50,
        angle: Number(angle) || 0
      }));
      const result = calculateLaserPath(mirrors, { x: 45, y: 140 }, { x: 295, y: 140 });

      correct = !!(isMatchTarget && result.isHit);
      currentProgress = correct ? 100 : 0;

      console.log(`Physics API submission: uid=${uid}, physMirrors=[${physMirrors}], physTarget=[${physTarget}], isMatchTarget=${isMatchTarget}, isHit=${result.isHit}, correct=${correct}`);

      const updateData = {
        [isPlayer1 ? 'player1Progress' : 'player2Progress']: currentProgress
      };
      await matchRef.update(updateData);
    } catch (err) {
      console.error("Error in physics submitAnswer:", err);
      return NextResponse.json({ error: `Physics calculation failed: ${err.message}` }, { status: 500 });
    }
  } else if (subject === 'chemistry') {
    const { type, equation, reactants, chemicalId, chemTemp, chemHCl, chemNaOH, chemEvap } = selectedAnswer;
    const currentProg = isPlayer1 ? (roomData.player1Progress || 0) : (roomData.player2Progress || 0);

    if (type === 'chemistry_reaction_complete') {
      const isMatch = checkChemistryMatch(questionId, equation, reactants);
      let isPhysicallyValid = true;
      let validationNote = '';

      if (chemTemp !== undefined) {
        const temp = Number(chemTemp);
        if (isNaN(temp) || temp < 85) {
          isPhysicallyValid = false;
          validationNote = `Nhiệt độ không đủ (${temp}°C < 85°C), phản ứng không thể xảy ra.`;
        }
      }

      if (isPhysicallyValid && chemHCl !== undefined && chemNaOH !== undefined) {
        const hcl = Number(chemHCl);
        const naoh = Number(chemNaOH);
        if (hcl <= 0 || naoh <= 0 || hcl / naoh < 0.5 || hcl / naoh > 2.0) {
          isPhysicallyValid = false;
          validationNote = `Tỷ lệ hóa chất không hợp lệ (HCl=${hcl}, NaOH=${naoh}).`;
        }
      }

      if (chemEvap !== undefined) {
        const evap = Number(chemEvap);
        if (isNaN(evap) || evap < 95) {
          isPhysicallyValid = false;
          validationNote = `Chưa bốc hơi đủ (${evap}% < 95%).`;
        }
      }

      const idclEnergy = selectedAnswer.idclEnergy !== undefined ? Number(selectedAnswer.idclEnergy) : undefined;
      if (idclEnergy !== undefined && idclEnergy >= 100) {
        isPhysicallyValid = false;
        validationNote = `IDCL energy=${idclEnergy}% (không có thao tác thí nghiệm thực tế).`;
        console.warn(`Chemistry IFRAME_CHEAT_DETECTED: uid=${uid}, idclEnergy=${idclEnergy}`);
      }

      if (isMatch && isPhysicallyValid) {
        correct = true;
        currentProgress = 100;
        console.log(`Chemistry CORRECT: uid=${uid}, mission=${questionId}`);
      } else {
        if (!isMatch) console.warn(`Chemistry MISMATCH: uid=${uid}, mission=${questionId}, equation=${equation}`);
        if (!isPhysicallyValid) console.warn(`Chemistry INVALID_PHYSICAL: uid=${uid}, note=${validationNote}`);
        currentProgress = Math.min(90, currentProg + 15);
      }
    } else if (type === 'chemistry_safety_violation') {
      currentProgress = Math.max(0, currentProg - 10);
    }

    const updateData = {
      [isPlayer1 ? 'player1Progress' : 'player2Progress']: currentProgress
    };
    await matchRef.update(updateData);
  }

  const logMsg = correct 
    ? `✅ [Server] ${uid === roomData.player1.uid ? 'Player 1' : 'Player 2'} trả lời đúng (Tiến độ: ${currentProgress}%)`
    : `❌ [Server] ${uid === roomData.player1.uid ? 'Player 1' : 'Player 2'} trả lời sai (Tiến độ: ${currentProgress}%)`;

  const logsKey = isPlayer1 ? 'player1Logs' : 'player2Logs';
  const currentLogs = roomData[logsKey] || [];
  const updatedLogs = [logMsg, ...currentLogs].slice(0, 10);

  await matchRef.update({
    [logsKey]: updatedLogs
  });

  return NextResponse.json({ correct, currentProgress, explanation });
}
