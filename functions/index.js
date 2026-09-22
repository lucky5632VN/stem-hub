const functions = require('firebase-functions');
const admin = require('firebase-admin');

// If running in the Functions Emulator, do NOT override emulator host env vars.
// Previously this code removed emulator env vars which caused local functions
// to connect to production Firestore/Auth and produced permission errors.
if (process.env.FUNCTIONS_EMULATOR) {
  console.log("🔥 [Functions Emulator] Detected FUNCTIONS_EMULATOR; using local emulators if configured.");
}

admin.initializeApp();
const db = admin.firestore();
// NOTE: physicsEngine laser module deprecated for new mixed gameplay
// const { calculateLaserPath } = require('./physicsEngine');

// === BẢN ĐỒ PHẢN ỨNG HÓA HỌC TRÊN SERVER ===
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

// MÚI GIỜ VIỆT NAM +7
const getVNTimeStr = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const vnDate = new Date(utc + (3600000 * 7));
  return vnDate.toISOString().split('T')[0];
};

// === 1. SUBMIT ANSWER FUNCTION (ANTI-CHEAT & SERVER SIDE PROGRESS) ===
exports.submitAnswer = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }
  const uid = context.auth.uid;
  const { matchId, questionId, selectedAnswer, actingForBotId, stepIndex } = data;

  if (!matchId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing matchId.');
  }

  const matchRef = db.collection('match_rooms').doc(matchId);
  const matchDoc = await matchRef.get();
  if (!matchDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Match room not found.');
  }

  const roomData = matchDoc.data();
  if (roomData.status !== 'playing') {
    throw new functions.https.HttpsError('failed-precondition', 'Match is not in playing state.');
  }

  const isPlayer1 = roomData.player1.uid === uid;
  const isPlayer2 = roomData.player2 ? roomData.player2.uid === uid : false;
  if (!isPlayer1 && !isPlayer2) {
    throw new functions.https.HttpsError('permission-denied', 'You are not a participant in this match.');
  }

  // === NHÁNH XỬ LÝ HÀNH ĐỘNG HỘ BOT (PLAYBACK CLOCK) ===
  if (actingForBotId) {
    if (!roomData.isBotMatch || roomData.botUid !== actingForBotId) {
      throw new functions.https.HttpsError('invalid-argument', 'Tài khoản bot không khớp với phòng đấu.');
    }

    const scriptDoc = await matchRef.collection('bot_schedules').doc('script').get();
    if (!scriptDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Kịch bản hành động của bot không tồn tại.');
    }

    const { schedule = [] } = scriptDoc.data();
    const idx = Number(stepIndex);
    const step = (idx >= 0 && idx < schedule.length) ? schedule[idx] : null;

    if (!step) {
      return { success: false, reason: 'Out of range stepIndex' };
    }

    const isBotP1 = roomData.player1.uid === actingForBotId;
    const scoreKey = isBotP1 ? 'player1Score' : 'player2Score';
    const progKey = isBotP1 ? 'player1Progress' : 'player2Progress';
    const logsKey = isBotP1 ? 'player1Logs' : 'player2Logs';
    const botRole = isBotP1 ? 'p1' : 'p2';

    // 1. KIỂM TRA ĐÓNG BĂNG: NẾU BOT ĐANG BỊ ĐÓNG BĂNG THÌ KHÔNG THỂ NỘP CÂU TRẢ LỜI
    const botEffects = roomData.activeEffects?.[botRole] || {};
    const now = Date.now();
    if (botEffects.frozenUntil && botEffects.frozenUntil > now) {
      console.log(`❄️ [Server Bot submitAnswer] Bot đang bị đóng băng đến ${botEffects.frozenUntil} -> Chặn trả lời.`);
      return { success: false, reason: 'Bot is currently frozen by player card.' };
    }

    // 2. KIỂM TRA MÙ SƯƠNG: NẾU BOT ĐANG BỊ MÙ SƯƠNG THÌ TĂNG TỶ LỆ TRẢ LỜI SAI (40%)
    let isStepCorrect = step.isCorrect;
    if (botEffects.fogUntil && botEffects.fogUntil > now) {
      if (Math.random() < 0.40) {
        isStepCorrect = false;
      }
    }

    const currentScore = roomData[scoreKey] || 0;
    const newScore = isStepCorrect ? currentScore + (step.scoreDelta || 1) : currentScore;

    // 3. TÍNH TIẾN ĐỘ THỰC TẾ (CỘNG TÍCH LŨY, BẢO LƯU TIẾN ĐỘ ĐÃ BỊ NGƯỜI CHƠI CƯỚP)
    const currentProgress = roomData[progKey] || 0;
    const totalSteps = roomData.subject === 'chemistry' ? 5 : Math.max(30, schedule.length || 30);
    const stepProgDelta = 100 / totalSteps;
    const newProgress = Math.min(100, Math.max(0, currentProgress + (isStepCorrect ? stepProgDelta : 0)));

    const botName = isBotP1 ? roomData.player1.name : (roomData.player2?.name || 'Đối thủ');
    const logMsg = isStepCorrect
      ? `✅ [Server] ${botName} trả lời đúng (Tiến độ: ${Math.round(newProgress)}%)`
      : `❌ [Server] ${botName} trả lời sai (Tiến độ: ${Math.round(newProgress)}%)`;

    const currentLogs = roomData[logsKey] || [];
    const updatedLogs = [logMsg, ...currentLogs].slice(0, 10);

    const cpKey = isBotP1 ? 'player1Checkpoint' : 'player2Checkpoint';
    const botProgKey = isBotP1 ? 'botProgress1' : 'botProgress';

    await matchRef.update({
      [scoreKey]: newScore,
      [progKey]: newProgress,
      [logsKey]: updatedLogs,
      [cpKey]: { progress: newProgress, score: newScore, timestamp: Date.now() },
      [botProgKey]: newProgress
    });

    return { success: true, correct: isStepCorrect, currentProgress: newProgress };
  }

  const subject = roomData.subject;
  const matchData = roomData.matchData || {};
  const questionPool = matchData.questionPool || [];

  let correct = false;
  let currentProgress = 0;
  let explanation = '';

  const challengeMode = matchData.challengeMode || (subject === 'biology' ? 'mcq' : 'practical');

  if (subject === 'math') {
    const astIndex = Number(questionId);
    if (isNaN(astIndex) || astIndex < 0 || astIndex >= questionPool.length) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid questionId.');
    }
    const target = questionPool[astIndex];
    let scoreAdded = 0;
    
    // Nhận diện loại câu hỏi dựa trên type của câu hỏi đó
    if (target.type === 'mcq' || Array.isArray(target.choices)) {
      const selectedStr = String(selectedAnswer);
      const correctStr = String(target.correct);
      const indexMap = { '0': 'A', '1': 'B', '2': 'C', '3': 'D' };
      const correctChar = indexMap[correctStr] || correctStr;
      const selectedChar = indexMap[selectedStr] || selectedStr;
      
      correct = (correctStr === selectedStr) || (correctChar.toUpperCase() === selectedChar.toUpperCase());
      scoreAdded = correct ? 1 : 0;
      explanation = target.note || target.explanation || '';
    } else if (target.type === 'tf' || target.type === 'true_false') {
      const answers = Array.isArray(selectedAnswer)
        ? selectedAnswer
        : selectedAnswer && Array.isArray(selectedAnswer.answers)
          ? selectedAnswer.answers
          : [];
      let correctCount = 0;
      const totalStatements = Array.isArray(target.correct) ? target.correct.length : 4;
      if (Array.isArray(target.correct) && answers.length === target.correct.length) {
        answers.forEach((val, idx) => {
          if (val === target.correct[idx]) correctCount++;
        });
      }
      scoreAdded = totalStatements > 0 ? correctCount / totalStatements : 0;
      correct = scoreAdded === 1;
      explanation = target.note || target.explanation || '';
    } else if (target.type === 'sa' || target.type === 'short_answer') {
      const userVal = String(selectedAnswer).trim().toLowerCase();
      const rawTarget = target.correctShortAnswer ?? target.correctAnswer ?? target.correct ?? target.answer ?? '';
      const targetVal = String(rawTarget).trim().toLowerCase();
      const userNum = parseFloat(userVal);
      const targetNum = parseFloat(targetVal);
      if (!isNaN(userNum) && !isNaN(targetNum)) {
        correct = Math.abs(userNum - targetNum) <= 0.1;
      } else {
        correct = userVal === targetVal;
      }
      scoreAdded = correct ? 1 : 0;
      explanation = target.note || target.explanation || '';
    } else if (target.type === 'practical_volume') {
      const userVal = (typeof selectedAnswer === 'object' && selectedAnswer !== null)
        ? Number(selectedAnswer.x)
        : Number(selectedAnswer);
      correct = Math.abs(userVal - Number(target.correct)) <= 0.1;
      scoreAdded = correct ? 1 : 0;
      explanation = target.note || target.explanation || '';
    } else {
      const userX = selectedAnswer && selectedAnswer.x !== undefined ? Number(selectedAnswer.x) : NaN;
      const userY = selectedAnswer && selectedAnswer.y !== undefined ? Number(selectedAnswer.y) : NaN;
      const targetCoord = target.coord || target.ans || { x: 0, y: 0 };
      correct = targetCoord.x === userX && targetCoord.y === userY;
      scoreAdded = correct ? 1 : 0;
      explanation = target.note || target.explanation || '';
    }

    const scoreKey = isPlayer1 ? 'player1Score' : 'player2Score';
    const currentScore = roomData[scoreKey] || 0;
    const newScore = currentScore + scoreAdded;

    const progKey = isPlayer1 ? 'player1Progress' : 'player2Progress';
    const currentProg = roomData[progKey] || 0;
    const stepDelta = Math.round(100 / Math.max(1, questionPool.length));
    currentProgress = Math.min(100, Math.max(0, currentProg + (scoreAdded > 0 ? stepDelta : 0)));

    const updateData = {
      [scoreKey]: newScore,
      [isPlayer1 ? 'player1Progress' : 'player2Progress']: currentProgress
    };
    await matchRef.update(updateData);
  } else if (subject === 'biology') {
    const qIndex = Number(questionId);
    if (isNaN(qIndex) || qIndex < 0 || qIndex >= questionPool.length) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid questionId.');
    }
    const q = questionPool[qIndex];
    if (!q) {
      throw new functions.https.HttpsError('not-found', 'Question not found.');
    }
    let scoreAdded = 0;

    if (q.type === 'mcq' || Array.isArray(q.choices)) {
      const selectedStr = String(selectedAnswer);
      const correctStr = String(q.correct);
      const indexMap = { '0': 'A', '1': 'B', '2': 'C', '3': 'D' };
      const correctChar = indexMap[correctStr] || correctStr;
      const selectedChar = indexMap[selectedStr] || selectedStr;

      correct = (correctStr === selectedStr) || (correctChar.toUpperCase() === selectedChar.toUpperCase());
      scoreAdded = correct ? 1 : 0;
      explanation = q.note || q.explanation || '';
    } else if (q.type === 'tf' || q.type === 'true_false') {
      const answers = Array.isArray(selectedAnswer)
        ? selectedAnswer
        : selectedAnswer && Array.isArray(selectedAnswer.answers)
          ? selectedAnswer.answers
          : [];
      let correctCount = 0;
      const totalStatements = Array.isArray(q.correct) ? q.correct.length : 4;
      if (Array.isArray(q.correct) && answers.length === q.correct.length) {
        answers.forEach((val, idx) => {
          if (val === q.correct[idx]) correctCount++;
        });
      }
      scoreAdded = totalStatements > 0 ? correctCount / totalStatements : 0;
      correct = scoreAdded === 1;
      explanation = q.note || q.explanation || '';
    } else if (q.type === 'sa' || q.type === 'short_answer') {
      const userVal = String(selectedAnswer).trim().toLowerCase();
      const rawTarget = q.correctShortAnswer ?? q.correctAnswer ?? q.correct ?? q.answer ?? '';
      const targetVal = String(rawTarget).trim().toLowerCase();
      const userNum = parseFloat(userVal);
      const targetNum = parseFloat(targetVal);
      if (!isNaN(userNum) && !isNaN(targetNum)) {
        correct = Math.abs(userNum - targetNum) <= 0.1;
      } else {
        correct = userVal === targetVal;
      }
      scoreAdded = correct ? 1 : 0;
      explanation = q.note || q.explanation || '';
    } else if (q.type === 'practical_dna') {
      const submitted = typeof selectedAnswer === 'object' && selectedAnswer.answer
        ? String(selectedAnswer.answer).trim().toUpperCase()
        : String(selectedAnswer).trim().toUpperCase();
      const expected = String(q.templateStrand || '')
        .split('')
        .map((ch) => {
          if (ch === 'A') return 'U';
          if (ch === 'T') return 'A';
          if (ch === 'G') return 'X';
          if (ch === 'X') return 'G';
          return ch;
        })
        .join('');
      correct = submitted === expected;
      scoreAdded = correct ? 1 : 0;
      explanation = q.note || q.explanation || `Chuỗi đúng là: ${expected}.`;
    } else if (q.type === 'practical_cycle') {
      const answerOrder = Array.isArray(selectedAnswer)
        ? selectedAnswer
        : selectedAnswer && Array.isArray(selectedAnswer.answer)
          ? selectedAnswer.answer
          : [];
      const expectedOrder = Array.isArray(q.correctOrder) ? q.correctOrder : [];
      correct = answerOrder.length === expectedOrder.length && answerOrder.every((step, idx) => step === expectedOrder[idx]);
      scoreAdded = correct ? 1 : 0;
      explanation = q.note || q.explanation || `Thứ tự đúng: ${expectedOrder.join(' → ')}.`;
    } else {
      correct = String(selectedAnswer) === String(q.correct);
      scoreAdded = correct ? 1 : 0;
      explanation = q.note || q.explanation || '';
    }

    const scoreKey = isPlayer1 ? 'player1Score' : 'player2Score';
    const currentScore = roomData[scoreKey] || 0;
    const newScore = currentScore + scoreAdded;

    const progKey = isPlayer1 ? 'player1Progress' : 'player2Progress';
    const currentProg = roomData[progKey] || 0;
    const stepDelta = Math.round(100 / Math.max(1, questionPool.length));
    currentProgress = Math.min(100, Math.max(0, currentProg + (scoreAdded > 0 ? stepDelta : 0)));
    if (qIndex === questionPool.length - 1 && newScore / questionPool.length >= 0.6) {
      currentProgress = Math.min(100, currentProgress + 10);
    }

    const updateData = {
      [scoreKey]: newScore,
      [isPlayer1 ? 'player1Progress' : 'player2Progress']: currentProgress
    };
    await matchRef.update(updateData);
  } else if (subject === 'physics') {
    const qIndex = Number(questionId);
    if (isNaN(qIndex) || qIndex < 0 || qIndex >= questionPool.length) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid questionId.');
    }
    const q = questionPool[qIndex];
    if (!q) {
      throw new functions.https.HttpsError('not-found', 'Question not found.');
    }
    let scoreAdded = 0;

    if (q.type === 'mcq' || Array.isArray(q.choices)) {
      const selectedStr = String(selectedAnswer);
      const correctStr = String(q.correct);
      const indexMap = { '0': 'A', '1': 'B', '2': 'C', '3': 'D' };
      const correctChar = indexMap[correctStr] || correctStr;
      const selectedChar = indexMap[selectedStr] || selectedStr;
      
      correct = (correctStr === selectedStr) || (correctChar.toUpperCase() === selectedChar.toUpperCase());
      scoreAdded = correct ? 1 : 0;
      explanation = q.note || q.explanation || '';
    } else if (q.type === 'tf' || q.type === 'true_false') {
      const answers = Array.isArray(selectedAnswer)
        ? selectedAnswer
        : selectedAnswer && Array.isArray(selectedAnswer.answers)
          ? selectedAnswer.answers
          : [];
      let correctCount = 0;
      const totalStatements = Array.isArray(q.correct) ? q.correct.length : 4;
      if (Array.isArray(q.correct) && answers.length === q.correct.length) {
        answers.forEach((val, idx) => {
          if (val === q.correct[idx]) correctCount++;
        });
      }
      scoreAdded = totalStatements > 0 ? correctCount / totalStatements : 0;
      correct = scoreAdded === 1;
      explanation = q.note || q.explanation || '';
    } else if (q.type === 'sa' || q.type === 'short_answer') {
      const userVal = String(selectedAnswer).trim().toLowerCase();
      const rawTarget = q.correctShortAnswer ?? q.correctAnswer ?? q.correct ?? q.answer ?? '';
      const targetVal = String(rawTarget).trim().toLowerCase();
      const userNum = parseFloat(userVal);
      const targetNum = parseFloat(targetVal);
      if (!isNaN(userNum) && !isNaN(targetNum)) {
        correct = Math.abs(userNum - targetNum) <= 0.1;
      } else {
        correct = userVal === targetVal;
      }
      scoreAdded = correct ? 1 : 0;
      explanation = q.note || q.explanation || '';
    } else {
      const selectedStr = String(selectedAnswer);
      const correctStr = String(q.correct);
      const indexMap = { '0': 'A', '1': 'B', '2': 'C', '3': 'D' };
      const correctChar = indexMap[correctStr] || correctStr;
      const selectedChar = indexMap[selectedStr] || selectedChar;
      correct = (correctStr === selectedStr) || (correctChar.toUpperCase() === selectedChar.toUpperCase());
      scoreAdded = correct ? 1 : 0;
      explanation = q.note || q.explanation || '';
    }

    const scoreKey = isPlayer1 ? 'player1Score' : 'player2Score';
    const currentScore = roomData[scoreKey] || 0;
    const newScore = currentScore + scoreAdded;

    const progKey = isPlayer1 ? 'player1Progress' : 'player2Progress';
    const currentProg = roomData[progKey] || 0;
    const stepDelta = Math.round(100 / Math.max(1, questionPool.length));
    currentProgress = Math.min(100, Math.max(0, currentProg + (scoreAdded > 0 ? stepDelta : 0)));
    if (qIndex === questionPool.length - 1 && newScore / questionPool.length >= 0.6) {
      currentProgress = Math.min(100, currentProgress + 10);
    }
    const updateData = {
      [scoreKey]: newScore,
      [isPlayer1 ? 'player1Progress' : 'player2Progress']: currentProgress
    };
    await matchRef.update(updateData);
  } else if (subject === 'chemistry') {
      const { type, equation, reactants, chemicalId, chemTemp, chemHCl, chemNaOH, chemEvap } = selectedAnswer;
    const currentProg = isPlayer1 ? (roomData.player1Progress || 0) : (roomData.player2Progress || 0);

    if (type === 'chemistry_reaction_complete') {
      // --- LAYER 1: Kiểm tra phản ứng có khớp nhiệm vụ đề bài không ---
      const isMatch = checkChemistryMatch(questionId, equation, reactants);

      // --- LAYER 2 (tối thiểu): Validate ngưỡng vật lý nếu client gửi kèm dữ liệu thô ---
      // Quy tắc: Nếu client gửi chemTemp, phải >= 85 (phản ứng xảy ra, dưới đó không thể hoàn thành)
      // Nếu client gửi chemHCl và chemNaOH, tỷ lệ HCl/NaOH phải trong khoảng hợp lý [0.5, 2.0]
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
        // Cả hai phải > 0 và tỷ lệ trong khoảng [0.5, 2.0] để coi là phản ứng hợp lệ
        if (hcl <= 0 || naoh <= 0 || hcl / naoh < 0.5 || hcl / naoh > 2.0) {
          isPhysicallyValid = false;
          validationNote = `Tỷ lệ hóa chất không hợp lệ (HCl=${hcl}, NaOH=${naoh}).`;
        }
      }

      if (chemEvap !== undefined) {
        const evap = Number(chemEvap);
        // Nếu client gửi chemEvap, phải >= 95% để coi là hoàn thành
        if (isNaN(evap) || evap < 95) {
          isPhysicallyValid = false;
          validationNote = `Chưa bốc hơi đủ (${evap}% < 95%).`;
        }
      }

      // --- LAYER 3: Validate dữ liệu IDCL từ iframe (chặn console injection) ---
      // iframe gửi kèm energy (IDCL sustainability score) và waste.
      // Nếu energy === 100 (giá trị khởi tạo mặc định, không có thí nghiệm nào xảy ra),
      // đây là dấu hiệu rõ ràng của gian lận qua console (học sinh chưa làm gì cả).
      // Kẻ gian lận sẽ gửi energy=100 vì không biết giá trị thực sau khi làm thí nghiệm.
      // Học sinh thực sự làm thí nghiệm sẽ có energy < 100 do IDCL trừ điểm theo lãng phí.
      const idclEnergy = selectedAnswer.idclEnergy !== undefined ? Number(selectedAnswer.idclEnergy) : undefined;
      if (idclEnergy !== undefined && idclEnergy >= 100) {
        // energy=100 nghĩa là không có thao tác nào được thực hiện trong iframe
        isPhysicallyValid = false;
        validationNote = `IDCL energy=${idclEnergy}% (không có thao tác thí nghiệm thực tế).`;
        functions.logger.warn(`Chemistry IFRAME_CHEAT_DETECTED: uid=${uid}, idclEnergy=${idclEnergy}`);
      }

      // --- LAYER 4: Kiểm tra chữ ký bảo mật SHA-256 ---
      const signature = selectedAnswer.signature;
      if (!signature) {
        isPhysicallyValid = false;
        validationNote = `Thiếu chữ ký bảo mật hóa học.`;
      } else {
        const crypto = require('crypto');
        const wasteVal = selectedAnswer.waste !== undefined ? Number(selectedAnswer.waste) : 0;
        const energyVal = selectedAnswer.idclEnergy !== undefined ? Number(selectedAnswer.idclEnergy) : 0;
        const msgStr = `reaction_complete:${matchId}:${uid}:${equation || ''}:${reactants || ''}:${energyVal}:${wasteVal}`;
        const expectedSig = crypto.createHmac('sha256', uid).update(msgStr).digest('hex');
        if (signature !== expectedSig) {
          isPhysicallyValid = false;
          validationNote = `Chữ ký bảo mật hóa học không hợp lệ.`;
          functions.logger.warn(`Chemistry SIGNATURE_MISMATCH: uid=${uid}, got=${signature}, expected=${expectedSig}`);
        }
      }

      if (isMatch && isPhysicallyValid) {
        correct = true;
        currentProgress = 100;
        functions.logger.info(`Chemistry CORRECT: uid=${uid}, mission=${questionId}, temp=${chemTemp}, hcl=${chemHCl}, naoh=${chemNaOH}, evap=${chemEvap}`);
      } else {
        if (!isMatch) {
          functions.logger.warn(`Chemistry MISMATCH: uid=${uid}, mission=${questionId}, equation=${equation}`);
        }
        if (!isPhysicallyValid) {
          functions.logger.warn(`Chemistry INVALID_PHYSICAL: uid=${uid}, note=${validationNote}`);
        }
        currentProgress = Math.min(90, currentProg + 15);
      }
    } else if (type === 'chemistry_safety_violation') {
      const signature = selectedAnswer.signature;
      let isSigValid = false;
      if (signature) {
        const crypto = require('crypto');
        const msgStr = `safety_violation:${matchId}:${uid}`;
        const expectedSig = crypto.createHmac('sha256', uid).update(msgStr).digest('hex');
        isSigValid = (signature === expectedSig);
      }
      if (isSigValid) {
        currentProgress = Math.max(0, currentProg - 10);
      } else {
        functions.logger.warn(`Chemistry SAFETY_VIOLATION SIGNATURE_MISMATCH: uid=${uid}`);
      }
    }

    const updateData = {
      [isPlayer1 ? 'player1Progress' : 'player2Progress']: currentProgress
    };
    await matchRef.update(updateData);
  }

  // Ghi log hành động
  const logMsg = correct 
    ? `✅ [Server] ${uid === roomData.player1.uid ? 'Player 1' : 'Player 2'} trả lời đúng (Tiến độ: ${currentProgress}%)`
    : `❌ [Server] ${uid === roomData.player1.uid ? 'Player 1' : 'Player 2'} trả lời sai (Tiến độ: ${currentProgress}%)`;

  const logsKey = isPlayer1 ? 'player1Logs' : 'player2Logs';
  const currentLogs = roomData[logsKey] || [];
  const updatedLogs = [logMsg, ...currentLogs].slice(0, 10);

  await matchRef.update({
    [logsKey]: updatedLogs
  });

  return { correct, currentProgress, explanation };
});

// === 1.5. ASSIGN BOT OPPONENT FUNCTION (SERVER-SIDE SCRIPT GENERATION & BOT LOCKING) ===
exports.assignBotOpponent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }
  const uid = context.auth.uid;
  const { subject = 'math', activeRoomId } = data;

  const playerRef = db.collection('users').doc(uid);
  const playerSnap = await playerRef.get();
  if (!playerSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Player profile not found.');
  }
  const playerData = playerSnap.data();
  const playerElo = playerData.stats?.elo !== undefined ? playerData.stats.elo : (playerData.personalization?.elo || 1000);

  // 1. Tìm và chọn 1 bot khả dụng trong Firestore
  const botQuerySnap = await db.collection('users')
    .where('isBotAccount', '==', true)
    .where('botStatus', '==', 'available')
    .limit(10)
    .get();

  let botDocs = botQuerySnap.docs;
  if (botDocs.length === 0) {
    const fallbackSnap = await db.collection('users').where('isBotAccount', '==', true).limit(10).get();
    botDocs = fallbackSnap.docs;
  }

  if (botDocs.length === 0) {
    throw new functions.https.HttpsError('unavailable', 'Không tìm thấy tài khoản bot khả dụng.');
  }

  const chosenDoc = botDocs[Math.floor(Math.random() * botDocs.length)];
  const chosenBot = { uid: chosenDoc.id, ...chosenDoc.data() };

  // Khóa trạng thái bot
  await chosenDoc.ref.update({ botStatus: 'in_match' });

  // 2. Xác định ID phòng đấu
  let roomId = activeRoomId;
  if (!roomId) {
    roomId = `room_${uid}_${Date.now()}`;
  }

  const roomRef = db.collection('match_rooms').doc(roomId);
  const existingRoomSnap = await roomRef.get();

  // 3. Sinh kịch bản hành động cho bot server-side (Non-linear distribution & ELO target ~50%)
  const botElo = chosenBot.stats?.elo || playerElo;
  const eloDiff = botElo - playerElo;
  let baseAccuracy = 0.55 + (eloDiff / 800);
  baseAccuracy = Math.max(0.35, Math.min(0.80, baseAccuracy));

  // Bot ELO thấp sẽ suy nghĩ kỹ và trả lời thong thả hơn (nhịp học sinh thật 15-28s/câu)
  const eloSpeedFactor = Math.max(0.9, Math.min(1.3, 1.0 + (100 - botElo) / 250));

  let totalSteps = 30;
  if (subject === 'chemistry') totalSteps = 5;

  const schedule = [];
  let cumulativeTimeMs = 0;

  for (let i = 0; i < totalSteps; i++) {
    const isCorrect = Math.random() < baseAccuracy;

    let stepDelay = 0;
    if (subject === 'chemistry') {
      // Hóa học (5 bước): Thao tác mô phỏng thí nghiệm & phản ứng tốn 18-32 giây mỗi giai đoạn
      stepDelay = Math.floor((18000 + Math.random() * 14000) * eloSpeedFactor);
    } else if (subject === 'math' || subject === 'physics') {
      // Toán / Lý (30 câu): Học sinh THPT đọc đề, nháp công thức, tính toán 15-28 giây mỗi câu
      stepDelay = Math.floor((15000 + Math.pow(Math.random(), 1.5) * 13000) * eloSpeedFactor);
    } else {
      // Sinh học: Đọc câu hỏi trắc nghiệm & phân tích quy luật 12-22 giây mỗi câu
      stepDelay = Math.floor((12000 + Math.random() * 10000) * eloSpeedFactor);
    }

    // Thỉnh thoảng gặp câu phân hóa khó: dừng thêm 8-14 giây để tính toán cẩn thận
    if (i > 0 && (i % 3 === 0 || i % 7 === 0)) {
      stepDelay += Math.floor((8000 + Math.random() * 6000) * eloSpeedFactor);
    }

    cumulativeTimeMs += stepDelay;

    let progress = 0;
    if (subject === 'chemistry') {
      progress = Math.min(100, (i + 1) * 20);
    } else {
      progress = Math.min(100, Math.floor(((i + 1) / totalSteps) * 100));
    }

    schedule.push({
      stepIndex: i,
      questionId: String(i),
      isCorrect,
      scoreDelta: isCorrect ? 1 : 0,
      progress,
      delayMs: stepDelay,
      cumulativeTimeMs
    });
  }

  // 4. Lưu kịch bản vào subcollection bảo mật (Chặn client trực tiếp đọc qua Firestore Rules)
  await roomRef.collection('bot_schedules').doc('script').set({
    botUid: chosenBot.uid,
    createdAt: new Date().toISOString(),
    schedule
  });

  // 5. Cập nhật phòng đấu thành trạng thái playing với đối thủ Bot
  const player1Profile = {
    uid: uid,
    name: playerData.displayName || playerData.name || 'Người chơi',
    elo: playerElo,
    level: playerData.stats?.level || 1,
    activeTitle: playerData.personalization?.activeTitle || 'apprentice',
    avatarFrame: playerData.personalization?.avatarFrame || 'default',
    avatarParts: playerData.personalization?.avatarParts || null
  };

  const botProfile = {
    uid: chosenBot.uid,
    name: chosenBot.displayName || chosenBot.name || 'Trợ Lý Tập Sự',
    elo: chosenBot.stats?.elo || playerElo,
    level: chosenBot.stats?.level || 1,
    activeTitle: chosenBot.personalization?.activeTitle || 'apprentice',
    avatarFrame: chosenBot.personalization?.avatarFrame || 'default',
    avatarParts: chosenBot.personalization?.avatarParts || null
  };

  const roomUpdateData = {
    id: roomId,
    subject: subject,
    status: 'equipment_selecting',
    equipmentPhase: {
      status: 'selecting',
      expiresAt: Date.now() + 30000,
      p1Ready: false,
      p2Ready: false
    },
    player1Equipment: [],
    player2Equipment: [],
    activeEffects: {
      p1: { frozenUntil: 0, fogUntil: 0, eloShielded: false, crystalMultiplier: 1, stolenCount: 0, reflectActive: false, lastStolenCard: null },
      p2: { frozenUntil: 0, fogUntil: 0, eloShielded: false, crystalMultiplier: 1, stolenCount: 0, reflectActive: false, lastStolenCard: null }
    },
    isBotMatch: true,
    botUid: chosenBot.uid,
    player1: player1Profile,
    player2: botProfile,
    player1Progress: 0,
    player2Progress: 0,
    player1Score: 0,
    player2Score: 0,
    player1Logs: ['Đấu thủ 1 đã sẵn sàng!'],
    player2Logs: ['Đối thủ đã sẵn sàng thi đấu!'],
    timeRemaining: existingRoomSnap.exists() && existingRoomSnap.data().timeRemaining ? existingRoomSnap.data().timeRemaining : 180,
    winnerId: null,
    createdAt: new Date().toISOString()
  };

  if (existingRoomSnap.exists()) {
    await roomRef.update(roomUpdateData);
  } else {
    await roomRef.set(roomUpdateData);
  }

  // Trả về mốc thời gian playback (CHỈ GỒM stepIndex và delayMs, KHÔNG CHỨA ĐÁP ÁN ĐÚNG/SAI)
  const playbackSchedule = schedule.map(s => ({
    stepIndex: s.stepIndex,
    delayMs: s.cumulativeTimeMs
  }));

  return {
    success: true,
    roomId,
    botUid: chosenBot.uid,
    playbackSchedule
  };
});

// === 2. FINALIZE MATCH FUNCTION (SERVER SIDE ELO & IDEMPOTENCY) ===
exports.finalizeMatch = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }
  const { matchId } = data;
  if (!matchId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing matchId.');
  }

  const matchRef = db.collection('match_rooms').doc(matchId);
  // Khai báo các ref trước để dùng transaction.get() bên trong — đảm bảo mọi read đều atomic
  const settingsRef = db.collection('config').doc('systemSettings');

  return db.runTransaction(async (transaction) => {
    const matchDoc = await transaction.get(matchRef);
    if (!matchDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Match room not found.');
    }
    const roomData = matchDoc.data();
    if (roomData.status === 'result') {
      return { success: true, alreadyFinalized: true };
    }

    const p1Prog = roomData.player1Progress || 0;
    const p2Prog = roomData.player2Progress || 0;
    const timeRemaining = roomData.timeRemaining !== undefined ? roomData.timeRemaining : 60;

    // Check if match is allowed to be finalized
    if (p1Prog < 100 && p2Prog < 100 && timeRemaining > 0) {
      throw new functions.https.HttpsError('failed-precondition', 'Trận đấu chưa kết thúc (thời gian chưa hết và chưa có ai đạt 100% tiến độ).');
    }

    let winnerId = 'draw';
    if (p1Prog > p2Prog) {
      winnerId = roomData.player1.uid;
    } else if (p2Prog > p1Prog) {
      winnerId = roomData.player2.uid;
    }

    const p1Ref = db.collection('users').doc(roomData.player1.uid);
    const p2Ref = db.collection('users').doc(roomData.player2.uid);

    // Đọc tất cả dữ liệu cần thiết TRONG transaction (atomic reads)
    const [p1Doc, p2Doc, settingsSnap] = await Promise.all([
      transaction.get(p1Ref),
      transaction.get(p2Ref),
      transaction.get(settingsRef)
    ]);

    if (!p1Doc.exists || !p2Doc.exists) {
      throw new functions.https.HttpsError('not-found', 'One of the players user doc not found.');
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

    // Tính toán ELO change
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

    const maxEloWin = pvpEloFactor;
    const minEloWin = Math.max(10, Math.round(pvpEloFactor * 0.5));

    if (winnerId === roomData.player1.uid) {
      eloChangeP1 = Math.max(minEloWin, Math.min(maxEloWin, eloChangeP1));
      eloChangeP2 = -Math.floor(eloChangeP1 * 0.6);
    } else if (winnerId === roomData.player2.uid) {
      eloChangeP2 = Math.max(minEloWin, Math.min(maxEloWin, eloChangeP2));
      eloChangeP1 = -Math.floor(eloChangeP2 * 0.6);
    } else {
      eloChangeP1 = Math.round(eloChangeP1);
      eloChangeP2 = Math.round(eloChangeP2);
    }

    let p1ExpChange = Math.floor((winnerId === roomData.player1.uid ? 250 : winnerId === 'draw' ? 100 : 50) * expMultiplier);
    let p2ExpChange = Math.floor((winnerId === roomData.player2.uid ? 250 : winnerId === 'draw' ? 100 : 50) * expMultiplier);

    let p1CrystalChange = winnerId === roomData.player1.uid ? pvpCrystalStake : 0;
    let p2CrystalChange = winnerId === roomData.player2.uid ? pvpCrystalStake : 0;

    // Cập nhật stats user 1 (bỏ qua nếu là tài khoản Bot)
    if (p1Data.isBotAccount) {
      transaction.update(p1Ref, { botStatus: 'available' });
    } else {
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
    }

    // Cập nhật stats user 2 (bỏ qua nếu là tài khoản Bot)
    if (p2Data.isBotAccount) {
      transaction.update(p2Ref, { botStatus: 'available' });
    } else {
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
    }

    // Cập nhật room
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
});

// === 3. PROCESS CRYSTAL TRANSACTION FUNCTION (SHOP, GACHA, CHECKIN, CLAIM QUEST) ===
const FALLBACK_SHOP_ITEMS = {
  'chocolate': { price: 150, name: 'Màu da Chocolate' },
  'neon_blue': { price: 250, name: 'Màu da Xanh Neon' },
  'cosmic_purple': { price: 350, name: 'Màu da Tím Vũ Trụ' },
  'emerald_alien': { price: 200, name: 'Màu da Alien Ngọc Lục' },
  'cyborg_silver': { price: 380, name: 'Màu da Cyborg Bạc' },
  'sunfire_gold': { price: 420, name: 'Màu da Thái Dương Vàng' },
  'cyberpunk_spiky': { price: 200, name: 'Tóc Gai Nhọn Cyber' },
  'long_nebula': { price: 350, name: 'Tóc Tinh Vân Nebula' },
  'curly': { price: 150, name: 'Tóc Curly Lãng Tử' },
  'ponytail': { price: 160, name: 'Tóc Đuôi Ngựa Nữ Tính' },
  'dreadlocks': { price: 240, name: 'Tóc Tết Dreadlocks' },
  'mohawk': { price: 220, name: 'Tóc Chỏm Mohawk Nam' },
  'side_part': { price: 130, name: 'Tóc Rẽ Ngôi Tài Phiệt' },
  'bob': { price: 140, name: 'Tóc Bob Ngắn' },
  'double_bun': { price: 180, name: 'Búi Đôi Lượng Tử' },
  'quantum_pixie': { price: 220, name: 'Tóc tém Pixie Tiên Nữ' },
  'crystal_waterfall': { price: 380, name: 'Tóc Thác Nước Tinh Thể' },
  'lab_coat': { price: 150, name: 'Áo Choàng Phòng Lab' },
  'astronaut_suit': { price: 250, name: 'Giáp Phi Hành Vũ Trụ' },
  'mech_armor': { price: 400, name: 'Giáp Cơ Giới Lượng Tử' },
  'cyber_hoodie': { price: 220, name: 'Hoodie Cyberpunk Tối' },
  'steampunk_vest': { price: 160, name: 'Áo Gile Steampunk' },
  'royal_cape': { price: 450, name: 'Choàng Hoàng Gia Đỏ' },
  'bio_hazard': { price: 180, name: 'Đồ Bảo Hộ Chống Độc' },
  'ninja_suit': { price: 260, name: 'Y Phục Ninja Bóng Đêm' },
  'quantum_dress': { price: 460, name: 'Đầm Dạ Hội Lượng Tử' },
  'space_shorts': { price: 120, name: 'Quần Đùi Vũ Trụ' },
  'robotic_legs': { price: 350, name: 'Chân Robot Cybernetic' },
  'cyber_skirt': { price: 200, name: 'Chân Váy Cyber Neon' },
  'steampunk_pants': { price: 140, name: 'Quần Steampunk Ông Côn' },
  'ninja_pants': { price: 210, name: 'Quần Ninja Quấn Băng' },
  'lightweight_joggers': { price: 130, name: 'Quần Jogger Thể Thao' },
  'tennis_skirt': { price: 150, name: 'Chân Váy Tennis Trắng' },
  'sci_glasses': { price: 100, name: 'Kính Trí Tuệ Giáo Sư' },
  'vr_goggles': { price: 250, name: 'Kính Thực Tế Ảo VR' },
  'headphones': { price: 200, name: 'Tai Nghe Lượng Tử Đỏ' },
  'gas_mask': { price: 180, name: 'Mặt Nạ Phòng Độc Lab' },
  'cyber_eyepatch': { price: 240, name: 'Bịt Mắt Laser Cyber' },
  'scientific_magnifier': { price: 220, name: 'Kính Vi Phẫu Nhãn Quang' },
  'crown': { price: 500, name: 'Vương Miện Đại Đế' },
  'butterfly_hairpin': { price: 230, name: 'Kẹp Tóc Bướm Hologram' }
};

const ALL_GACHA_TITLES = [
  { id: 'alchemist_expert', name: 'Bậc thầy Hóa học 🧪', rarity: 'Rare', type: 'title', price: 200 },
  { id: 'math_wizard', name: 'Chiến thần Toán học 📐', rarity: 'Rare', type: 'title', price: 200 },
  { id: 'physics_guru', name: 'Kỹ sư Cơ học ⚙️', rarity: 'Rare', type: 'title', price: 200 },
  { id: 'cosmic_explorer', name: 'Phi hành gia Vũ trụ 🌌', rarity: 'Epic', type: 'title', price: 300 },
  { id: 'nuclear_engineer', name: 'Chuyên gia Hạt nhân ⚛️', rarity: 'Epic', type: 'title', price: 300 },
  { id: 'quantum_master', name: 'Pháp sư Lượng tử 🔮', rarity: 'Legendary', type: 'title', price: 500 }
];

const ALL_COSMETICS_LIST = [
  { id: 'chocolate', name: 'Màu da Chocolate', rarity: 'Rare', type: 'cosmetic', price: 150 },
  { id: 'neon_blue', name: 'Màu da Xanh Neon', rarity: 'Epic', type: 'cosmetic', price: 250 },
  { id: 'cosmic_purple', name: 'Màu da Tím Vũ Trụ', rarity: 'Legendary', type: 'cosmetic', price: 350 },
  { id: 'emerald_alien', name: 'Màu da Alien Ngọc Lục', rarity: 'Epic', type: 'cosmetic', price: 200 },
  { id: 'cyborg_silver', name: 'Màu da Cyborg Bạc', rarity: 'Legendary', type: 'cosmetic', price: 380 },
  { id: 'sunfire_gold', name: 'Màu da Thái Dương Vàng', rarity: 'Legendary', type: 'cosmetic', price: 420 },
  { id: 'cyberpunk_spiky', name: 'Tóc Gai Nhọn Cyber', rarity: 'Epic', type: 'cosmetic', price: 200 },
  { id: 'long_nebula', name: 'Tóc Tinh Vân Nebula', rarity: 'Legendary', type: 'cosmetic', price: 350 },
  { id: 'curly', name: 'Tóc Curly Lãng Tử', rarity: 'Rare', type: 'cosmetic', price: 150 },
  { id: 'ponytail', name: 'Tóc Đuôi Ngựa Nữ Tính', rarity: 'Rare', type: 'cosmetic', price: 160 },
  { id: 'dreadlocks', name: 'Tóc Tết Dreadlocks', rarity: 'Epic', type: 'cosmetic', price: 240 },
  { id: 'mohawk', name: 'Tóc Chỏm Mohawk Nam', rarity: 'Epic', type: 'cosmetic', price: 220 },
  { id: 'side_part', name: 'Tóc Rẽ Ngôi Tài Phiệt', rarity: 'Rare', type: 'cosmetic', price: 130 },
  { id: 'bob', name: 'Tóc Bob Ngắn', rarity: 'Rare', type: 'cosmetic', price: 140 },
  { id: 'double_bun', name: 'Búi Đôi Lượng Tử', rarity: 'Rare', type: 'cosmetic', price: 180 },
  { id: 'quantum_pixie', name: 'Tóc tém Pixie Tiên Nữ', rarity: 'Epic', type: 'cosmetic', price: 220 },
  { id: 'crystal_waterfall', name: 'Tóc Thác Nước Tinh Thể', rarity: 'Legendary', type: 'cosmetic', price: 380 },
  { id: 'lab_coat', name: 'Áo Choàng Phòng Lab', rarity: 'Rare', type: 'cosmetic', price: 150 },
  { id: 'astronaut_suit', name: 'Giáp Phi Hành Vũ Trụ', rarity: 'Epic', type: 'cosmetic', price: 250 },
  { id: 'mech_armor', name: 'Giáp Cơ Giới Lượng Tử', rarity: 'Legendary', type: 'cosmetic', price: 400 },
  { id: 'cyber_hoodie', name: 'Hoodie Cyberpunk Tối', rarity: 'Epic', type: 'cosmetic', price: 220 },
  { id: 'steampunk_vest', name: 'Áo Gile Steampunk', rarity: 'Rare', type: 'cosmetic', price: 160 },
  { id: 'royal_cape', name: 'Choàng Hoàng Gia Đỏ', rarity: 'Legendary', type: 'cosmetic', price: 450 },
  { id: 'bio_hazard', name: 'Đồ Bảo Hộ Chống Độc', rarity: 'Rare', type: 'cosmetic', price: 180 },
  { id: 'ninja_suit', name: 'Y Phục Ninja Bóng Đêm', rarity: 'Epic', type: 'cosmetic', price: 260 },
  { id: 'quantum_dress', name: 'Đầm Dạ Hội Lượng Tử', rarity: 'Legendary', type: 'cosmetic', price: 460 },
  { id: 'space_shorts', name: 'Quần Đùi Vũ Trụ', rarity: 'Rare', type: 'cosmetic', price: 120 },
  { id: 'robotic_legs', name: 'Chân Robot Cybernetic', rarity: 'Legendary', type: 'cosmetic', price: 350 },
  { id: 'cyber_skirt', name: 'Chân Váy Cyber Neon', rarity: 'Epic', type: 'cosmetic', price: 200 },
  { id: 'steampunk_pants', name: 'Quần Steampunk Ông Côn', rarity: 'Rare', type: 'cosmetic', price: 140 },
  { id: 'ninja_pants', name: 'Quần Ninja Quấn Băng', rarity: 'Epic', type: 'cosmetic', price: 210 },
  { id: 'lightweight_joggers', name: 'Quần Jogger Thể Thao', rarity: 'Rare', type: 'cosmetic', price: 130 },
  { id: 'tennis_skirt', name: 'Chân Váy Tennis Trắng', rarity: 'Rare', type: 'cosmetic', price: 150 },
  { id: 'sci_glasses', name: 'Kính Trí Tuệ Giáo Sư', rarity: 'Rare', type: 'cosmetic', price: 100 },
  { id: 'vr_goggles', name: 'Kính Thực Tế Ảo VR', rarity: 'Epic', type: 'cosmetic', price: 250 },
  { id: 'headphones', name: 'Tai Nghe Lượng Tử Đỏ', rarity: 'Epic', type: 'cosmetic', price: 200 },
  { id: 'gas_mask', name: 'Mặt Nạ Phòng Độc Lab', rarity: 'Rare', type: 'cosmetic', price: 180 },
  { id: 'cyber_eyepatch', name: 'Bịt Mắt Laser Cyber', rarity: 'Epic', type: 'cosmetic', price: 240 },
  { id: 'scientific_magnifier', name: 'Kính Vi Phẫu Nhãn Quang', rarity: 'Epic', type: 'cosmetic', price: 220 },
  { id: 'crown', name: 'Vương Miện Đại Đế', rarity: 'Legendary', type: 'cosmetic', price: 500 },
  { id: 'butterfly_hairpin', name: 'Kẹp Tóc Bướm Hologram', rarity: 'Epic', type: 'cosmetic', price: 230 }
];

const ALL_GACHA_POOL = [...ALL_COSMETICS_LIST, ...ALL_GACHA_TITLES];

exports.processCrystalTransaction = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }
  const uid = context.auth.uid;
  const { actionType, payload } = data;

  if (!actionType) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing actionType.');
  }

  const userRef = db.collection('users').doc(uid);

  return db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User doc not found.');
    }

    const userData = userDoc.data();
    const pers = userData.personalization || {};
    const stats = userData.stats || {};
    const currentCrystals = pers.crystals !== undefined ? Number(pers.crystals) : 500;

    switch (actionType) {
      case 'SHOP_PURCHASE': {
        const { itemId } = payload || {};
        if (!itemId) {
          throw new functions.https.HttpsError('invalid-argument', 'Missing itemId.');
        }

        // Đọc giá thực từ Firestore shop_items/{itemId} hoặc fallback
        let itemPrice = 0;
        let itemName = '';
        const shopItemRef = db.collection('shop_items').doc(itemId);
        const shopItemSnap = await transaction.get(shopItemRef);
        
        if (shopItemSnap.exists) {
          const itemData = shopItemSnap.data();
          itemPrice = Number(itemData.price);
          itemName = itemData.name;
        } else if (FALLBACK_SHOP_ITEMS[itemId]) {
          itemPrice = FALLBACK_SHOP_ITEMS[itemId].price;
          itemName = FALLBACK_SHOP_ITEMS[itemId].name;
        } else {
          throw new functions.https.HttpsError('not-found', 'Vật phẩm không tồn tại.');
        }

        if (currentCrystals < itemPrice) {
          throw new functions.https.HttpsError('failed-precondition', 'Không đủ Pha Lê');
        }

        const unlockedParts = pers.unlockedParts || ['peach', 'hair_default', 'top_default', 'bottom_default'];
        if (unlockedParts.includes(itemId)) {
          throw new functions.https.HttpsError('already-exists', 'Bạn đã sở hữu vật phẩm này rồi.');
        }

        const newUnlockedParts = [...unlockedParts, itemId];
        const newCrystals = currentCrystals - itemPrice;

        transaction.update(userRef, {
          'personalization.crystals': newCrystals,
          'personalization.unlockedParts': newUnlockedParts
        });

        return { success: true, newCrystals, itemPurchased: itemId };
      }

      case 'PURCHASE_EQUIPMENT_CARD': {
        const { cardId, count = 1 } = payload || {};
        if (!cardId) {
          throw new functions.https.HttpsError('invalid-argument', 'Missing cardId.');
        }

        const qty = Math.max(1, Number(count) || 1);
        const EQUIPMENT_PRICES = {
          'card_elo_shield': 2400,
          'card_crystal_magnet': 1800,
          'card_subject_ban': 1400,
          'card_incognito': 1200,
          'card_wildcard_slot': 3500,
          'card_time_freeze': 2500,
          'card_smoke_fog': 2000,
          'card_progress_steal': 3000,
          'card_ai_assist': 1600,
          'card_dispel': 1500
        };

        const unitPrice = EQUIPMENT_PRICES[cardId];
        if (!unitPrice) {
          throw new functions.https.HttpsError('not-found', 'Thẻ bài không tồn tại.');
        }

        const totalPrice = unitPrice * qty;
        if (currentCrystals < totalPrice) {
          throw new functions.https.HttpsError('failed-precondition', `Không đủ Pha Lê (Cần ${totalPrice} Pha Lê).`);
        }

        const currentInventory = userData.inventory || [];
        const existingItemIndex = currentInventory.findIndex(item => item.cardId === cardId);

        let updatedInventory = [...currentInventory];
        if (existingItemIndex !== -1) {
          updatedInventory[existingItemIndex] = {
            ...updatedInventory[existingItemIndex],
            quantity: (updatedInventory[existingItemIndex].quantity || 0) + qty
          };
        } else {
          updatedInventory.push({ cardId, quantity: qty });
        }

        const newCrystals = currentCrystals - totalPrice;

        transaction.update(userRef, {
          'personalization.crystals': newCrystals,
          inventory: updatedInventory
        });

        return { success: true, newCrystals, inventory: updatedInventory, cardPurchased: cardId, count: qty };
      }

      case 'GACHA_ROLL': {
        const { pullCount } = payload || {}; // pullCount có thể là 1 hoặc 10
        const count = Number(pullCount) || 1;
        if (count !== 1 && count !== 10) {
          throw new functions.https.HttpsError('invalid-argument', 'Invalid pullCount.');
        }

        const cost = count === 10 ? 900 : 100;
        if (currentCrystals < cost) {
          throw new functions.https.HttpsError('failed-precondition', 'Không đủ Pha Lê');
        }

        const unlockedParts = pers.unlockedParts || ['peach', 'hair_default', 'top_default', 'bottom_default'];
        const unlockedTitles = pers.unlockedTitles || ['apprentice'];

        const newUnlockedParts = [...unlockedParts];
        const newUnlockedTitles = [...unlockedTitles];
        let results = [];
        let totalCompensation = 0;

        for (let i = 0; i < count; i++) {
          const rand = Math.random() * 100;
          let selectedRarity = 'Common';
          if (rand < 5) selectedRarity = 'Legendary';
          else if (rand < 25) selectedRarity = 'Epic';
          else if (rand < 70) selectedRarity = 'Rare';
          else selectedRarity = 'Common';

          let rarityPool = ALL_GACHA_POOL.filter(item => item.rarity === selectedRarity);
          if (rarityPool.length === 0) {
            rarityPool = ALL_GACHA_POOL;
          }
          const selectedItem = rarityPool[Math.floor(Math.random() * rarityPool.length)];

          let isDuplicate = false;
          let compensation = 0;

          if (selectedItem.type === 'cosmetic') {
            if (newUnlockedParts.includes(selectedItem.id)) {
              isDuplicate = true;
              compensation = Math.round(selectedItem.price * 0.5);
            } else {
              newUnlockedParts.push(selectedItem.id);
            }
          } else {
            if (newUnlockedTitles.includes(selectedItem.id)) {
              isDuplicate = true;
              compensation = Math.round(selectedItem.price * 0.5);
            } else {
              newUnlockedTitles.push(selectedItem.id);
            }
          }

          totalCompensation += compensation;
          results.push({
            item: selectedItem,
            isDuplicate,
            compensation
          });
        }
        
        // Cập nhật sau khi roll
        transaction.update(userRef, {
          'personalization.crystals': currentCrystals - cost + totalCompensation,
          'personalization.unlockedParts': newUnlockedParts,
          'personalization.unlockedTitles': newUnlockedTitles
        });
        
        return { success: true, results, totalCompensation };
      }

      case 'CHECKIN': {
        const todayStr = getVNTimeStr();
        const lastCheckIn = pers.lastCheckInDate;

        if (lastCheckIn === todayStr) {
          throw new functions.https.HttpsError('already-exists', 'Bạn đã hoàn thành đồng bộ năng lượng hôm nay rồi.');
        }

        const lastDayIndex = pers.checkInDayIndex || 0;
        let nextDayIndex = 1;
        if (lastDayIndex > 0 && lastDayIndex < 30) {
          nextDayIndex = lastDayIndex + 1;
        } else {
          nextDayIndex = 1;
        }

        let bonusCrystals = 50;
        if (nextDayIndex === 30) bonusCrystals = 300;
        else if (nextDayIndex >= 26) bonusCrystals = 150;
        else if (nextDayIndex >= 21) bonusCrystals = 120;
        else if (nextDayIndex >= 16) bonusCrystals = 100;
        else if (nextDayIndex >= 11) bonusCrystals = 80;
        else if (nextDayIndex >= 6) bonusCrystals = 60;
        else bonusCrystals = 50;

        const unlocked = pers.unlockedParts || ['peach', 'hair_default', 'top_default', 'bottom_default'];
        let newUnlocked = [...unlocked];
        let giftMsg = "";

        if (nextDayIndex === 30) {
          if (!newUnlocked.includes('crown')) {
            newUnlocked.push('crown');
            giftMsg = " và nhận được thêm Vương miện Đại Đế 👑!";
          } else {
            giftMsg = " (Bạn đã có Vương miện Đại Đế nên được tặng thêm 100 🔮 Pha lê đền bù)!";
            bonusCrystals += 100;
          }
        }

        const newCrystals = currentCrystals + bonusCrystals;

        transaction.update(userRef, {
          'personalization.crystals': newCrystals,
          'personalization.lastCheckInDate': todayStr,
          'personalization.checkInDayIndex': nextDayIndex,
          'personalization.unlockedParts': newUnlocked
        });

        return { success: true, newCrystals, bonusCrystals, nextDayIndex, giftMsg };
      }

      case 'SYNC_DAILY_QUESTS': {
        const todayStr = getVNTimeStr();
        const totalMatches = (stats.wins || 0) + (stats.losses || 0);
        
        let questsData = stats.dailyQuests || {};
        let needsUpdate = false;

        if (questsData.lastQuestDate !== todayStr) {
          questsData = {
            lastQuestDate: todayStr,
            totalMatches: totalMatches,
            quests: [
              { id: 'quest_checkin', label: 'Nạp năng lượng lượng tử (Điểm danh)', current: pers.lastCheckInDate === todayStr ? 1 : 0, target: 1, reward: 30, claimed: false },
              { id: 'quest_avatar', label: 'Thiết kế phong cách Chibi (Lưu Avatar)', current: pers.avatarUrl === 'custom-avatar' ? 1 : 0, target: 1, reward: 20, claimed: false },
              { id: 'quest_arena', label: 'Thách đấu ELO tại Đấu trường 1v1', current: 0, target: 1, reward: 50, claimed: false }
            ]
          };
          needsUpdate = true;
        } else {
          // Sync checkin quest
          const checkinQuest = questsData.quests?.find(q => q.id === 'quest_checkin');
          if (checkinQuest && !checkinQuest.claimed) {
            const isCheckinCompleted = pers.lastCheckInDate === todayStr;
            if (isCheckinCompleted && checkinQuest.current !== 1) {
              checkinQuest.current = 1;
              needsUpdate = true;
            }
          }
          
          // Sync avatar quest
          const avatarQuest = questsData.quests?.find(q => q.id === 'quest_avatar');
          if (avatarQuest && !avatarQuest.claimed) {
            const isAvatarCompleted = pers.avatarUrl === 'custom-avatar';
            if (isAvatarCompleted && avatarQuest.current !== 1) {
              avatarQuest.current = 1;
              needsUpdate = true;
            }
          }
          
          // Sync arena quest
          const arenaQuest = questsData.quests?.find(q => q.id === 'quest_arena' || q.id === 'quest_pvp');
          if (arenaQuest && !arenaQuest.claimed) {
            const arenaPlayed = totalMatches > (questsData.totalMatches || 0) ? 1 : 0;
            if (arenaPlayed > 0 && arenaQuest.current !== 1) {
              arenaQuest.current = 1;
              needsUpdate = true;
            }
          }
        }
        
        if (needsUpdate) {
          transaction.set(userRef, {
            stats: {
              ...(stats || {}),
              dailyQuests: questsData
            }
          }, { merge: true });
        }
        
        return { success: true, dailyQuests: questsData.quests || [] };
      }

      case 'CLAIM_QUEST': {
        const { questId } = payload || {};
        if (!questId) {
          throw new functions.https.HttpsError('invalid-argument', 'Missing questId.');
        }

        const questList = stats.dailyQuests?.quests || [];
        const questIndex = questList.findIndex(q => q.id === questId);
        if (questIndex === -1) {
          throw new functions.https.HttpsError('not-found', 'Nhiệm vụ không tồn tại.');
        }

        const quest = questList[questIndex];
        if (quest.claimed) {
          throw new functions.https.HttpsError('already-exists', 'Nhiệm vụ đã nhận thưởng trước đó.');
        }

        // Tự kiểm tra điều kiện hoàn thành quest phía server
        let isCompleted = false;
        if (questId === 'quest_checkin') {
          // Điểm danh hôm nay
          isCompleted = pers.lastCheckInDate === getVNTimeStr();
        } else if (questId === 'quest_avatar') {
          // Đã thiết kế avatar
          isCompleted = pers.avatarUrl === 'custom-avatar';
        } else if (questId === 'quest_pvp' || questId === 'quest_arena') {
          // Đấu trường 1v1
          const totalMatches = (stats.wins || 0) + (stats.losses || 0);
          const baselineMatches = stats.dailyQuests?.totalMatches || 0;
          isCompleted = totalMatches > baselineMatches;
        } else {
          // Cho phép các nhiệm vụ khác
          const current = quest.current !== undefined ? quest.current : (quest.currentCount !== undefined ? quest.currentCount : 0);
          const target = quest.target !== undefined ? quest.target : (quest.targetCount !== undefined ? quest.targetCount : 1);
          isCompleted = current >= target;
        }

        if (!isCompleted) {
          throw new functions.https.HttpsError('failed-precondition', 'Nhiệm vụ chưa hoàn thành.');
        }

        const newCrystals = currentCrystals + (quest.reward || 50);
        const newQuests = questList.map(q => {
          if (q.id === questId) {
            return { ...q, claimed: true };
          }
          return q;
        });

        const currentQuestsData = stats.dailyQuests || {};
        const updatedQuestsData = { ...currentQuestsData, quests: newQuests };

        transaction.set(userRef, {
          personalization: {
            ...(pers || {}),
            crystals: newCrystals
          },
          stats: {
            ...(stats || {}),
            dailyQuests: updatedQuestsData
          }
        }, { merge: true });

        return { success: true, newCrystals, questId, reward: quest.reward };
      }

      case 'CLAIM_LEVEL_MILESTONE': {
        const { milestoneLevel } = payload || {};
        const level = Number(milestoneLevel);
        if (isNaN(level)) {
          throw new functions.https.HttpsError('invalid-argument', 'Invalid milestoneLevel.');
        }

        const currentLevel = pers.level || stats.level || 1;
        if (currentLevel < level) {
          throw new functions.https.HttpsError('failed-precondition', `Trình độ chưa đạt Cấp ${level}.`);
        }

        const claimed = pers.claimedMilestones || [];
        if (claimed.includes(level)) {
          throw new functions.https.HttpsError('already-exists', 'Bạn đã nhận phần quà của mốc này rồi.');
        }

        const newCrystals = currentCrystals + 500;
        const newClaimed = [...claimed, level];

        let newUnlockedFrames = [...(pers.unlockedFrames || ['default'])];
        let newUnlockedTitles = [...(pers.unlockedTitles || ['apprentice'])];

        if (level === 10) {
          if (!newUnlockedFrames.includes('gold_vip')) newUnlockedFrames.push('gold_vip');
        } else if (level === 20) {
          if (!newUnlockedFrames.includes('neon_fire')) newUnlockedFrames.push('neon_fire');
        } else if (level === 30) {
          if (!newUnlockedTitles.includes('dimension_creator')) newUnlockedTitles.push('dimension_creator');
        }

        transaction.update(userRef, {
          'personalization.crystals': newCrystals,
          'personalization.claimedMilestones': newClaimed,
          'personalization.unlockedFrames': newUnlockedFrames,
          'personalization.unlockedTitles': newUnlockedTitles
        });

        return { success: true, newCrystals, levelClaimed: level };
      }

      case 'UPDATE_PERSONALIZATION': {
        const { bgImage, avatarUrl, avatarParts, activeTitle, avatarFrame, pinnedBadges } = payload || {};
        const updates = {};
        if (bgImage !== undefined) updates['personalization.bgImage'] = bgImage;
        if (avatarUrl !== undefined) updates['personalization.avatarUrl'] = avatarUrl;
        if (avatarParts !== undefined) updates['personalization.avatarParts'] = avatarParts;
        if (activeTitle !== undefined) updates['personalization.activeTitle'] = activeTitle;
        if (avatarFrame !== undefined) updates['personalization.avatarFrame'] = avatarFrame;
        if (pinnedBadges !== undefined) updates['personalization.pinnedBadges'] = pinnedBadges;

        if (Object.keys(updates).length > 0) {
          transaction.update(userRef, updates);
        }

        return { success: true };
      }

      case 'CLAIM_HOMEPAGE_QUEST': {
        const { questId, amount } = payload || {};
        if (!questId || !amount) {
          throw new functions.https.HttpsError('invalid-argument', 'Missing questId or amount.');
        }

        const newCrystals = currentCrystals + Number(amount);
        transaction.update(userRef, {
          'personalization.crystals': newCrystals
        });

        return { success: true, newCrystals };
      }

      default:
        throw new functions.https.HttpsError('invalid-argument', 'Action type không hợp lệ.');
    }
  });
});

// === 3.4. PROCESS FRIEND ACTIONS FUNCTION ===
exports.processFriendAction = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }
  const uid = context.auth.uid;
  const { actionType, payload } = data;
  if (!actionType || !payload || !payload.targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing actionType or targetUid.');
  }

  const targetUid = payload.targetUid;
  const myUserRef = db.collection('users').doc(uid);
  const targetUserRef = db.collection('users').doc(targetUid);

  return db.runTransaction(async (transaction) => {
    const myDoc = await transaction.get(myUserRef);
    const targetDoc = await transaction.get(targetUserRef);

    if (!myDoc.exists || !targetDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'One or both user docs not found.');
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
        throw new functions.https.HttpsError('invalid-argument', 'Friend action type không hợp lệ.');
    }
  });
});

// === 3.5. UPDATE PRESENCE (LAST ACTIVE) FUNCTION ===
exports.updateLastActive = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }
  const uid = context.auth.uid;
  await db.collection('users').doc(uid).update({
    lastActive: Date.now()
  });
  return { success: true };
});

// === 4. CHECK STALE MATCHES FUNCTION (CLEANUP HUNG MATCHES) ===
// Cả Scheduled Function v1 và một endpoint HTTP bổ sung để dễ dàng test/debug ở môi trường local
exports.checkStaleMatches = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
  await runStaleMatchesCleanup();
});

exports.checkStaleMatchesManual = functions.https.onRequest(async (req, res) => {
  try {
    const cleaned = await runStaleMatchesCleanup();
    res.status(200).send({ success: true, cleanedRooms: cleaned });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

async function runStaleMatchesCleanup() {
  const now = Date.now();
  const staleThresholdMs = 15000; // Quá 15 giây không có heartbeat

  const matchRoomsRef = db.collection('match_rooms');
  const querySnap = await matchRoomsRef.where('status', '==', 'playing').get();

  let cleaned = 0;
  const promises = [];

  querySnap.forEach(docSnap => {
    const room = docSnap.data();
    const lastHeartbeat = room.lastHeartbeat || 0;
    
    // Nếu lastHeartbeat quá cũ
    if (now - lastHeartbeat > staleThresholdMs) {
      cleaned += 1;
      // Chuyển sang abandoned hoặc tự động finalize dựa trên tiến độ hiện tại
      promises.push(docSnap.ref.update({
        status: 'abandoned',
        abandonedAt: now,
        notes: 'Room abandoned due to missing host heartbeat.'
      }));
    }
  });

  await Promise.all(promises);
  return cleaned;
}

// === 5. GET LEADERBOARD FUNCTION (SAFE ELO RANKING WITHOUT INSUBFFICIENT PERMISSIONS) ===
exports.getLeaderboard = functions.https.onCall(async (data, context) => {
  try {
    const usersSnap = await db.collection('users').get();
    const list = [];
    usersSnap.forEach((docSnap) => {
      const uData = docSnap.data();
      if (uData.role === 'admin' || uData.email?.toLowerCase() === 'admin123@gmail.com' || docSnap.id === 'admin') {
        return;
      }
      list.push({
        uid: docSnap.id,
        displayName: uData.displayName || uData.name || 'Học viên ẩn danh',
        elo: uData.stats?.elo !== undefined ? uData.stats.elo : 1000,
        level: uData.stats?.level || 1,
        wins: uData.stats?.wins || 0,
        losses: uData.stats?.losses || 0,
        activeTitle: uData.personalization?.activeTitle || 'apprentice',
        avatarFrame: uData.personalization?.avatarFrame || 'default',
        avatarParts: uData.personalization?.avatarParts || null
      });
    });
    // Sắp xếp ELO giảm dần
    list.sort((a, b) => b.elo - a.elo);
    // Trả về top 100
    return { leaderboard: list.slice(0, 100) };
  } catch (err) {
    functions.logger.error("Error fetching leaderboard:", err);
    throw new functions.https.HttpsError('internal', err.message || 'Error fetching leaderboard');
  }
});
