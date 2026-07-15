# Đấu Trường STEM 1v1 — Full Code Review Package

## Mục tiêu yêu cầu review
- Phát hiện lỗi logic, race condition, security holes còn sót
- Đánh giá tính nhất quán giữa client và server
- Đề xuất cải tiến

---

## FILE 1: `functions/physicsEngine.js` (Server-side physics)

```js
function calculateLaserPath(mirrors, sourcePos = { x: 45, y: 140 }, targetPos = { x: 295, y: 140 }) {
  let currentPos = { ...sourcePos };
  let currentDir = { x: 0, y: -1 }; // hướng ban đầu: đi lên
  const path = [{ ...currentPos }];
  const maxReflections = 10;
  let isHit = false;

  for (let step = 0; step < maxReflections; step++) {
    let nextObstacle = null;
    let minDistance = Infinity;
    let isTarget = false;

    // Kiểm tra target trên đường đi
    if (currentDir.x !== 0) {
      if (Math.abs(targetPos.y - currentPos.y) < 5) {
        const dx = targetPos.x - currentPos.x;
        if (dx * currentDir.x > 0) {
          minDistance = Math.abs(dx);
          nextObstacle = targetPos;
          isTarget = true;
        }
      }
    } else {
      if (Math.abs(targetPos.x - currentPos.x) < 5) {
        const dy = targetPos.y - currentPos.y;
        if (dy * currentDir.y > 0) {
          minDistance = Math.abs(dy);
          nextObstacle = targetPos;
          isTarget = true;
        }
      }
    }

    // Kiểm tra gương trên đường đi
    for (const mirror of mirrors) {
      if (Math.abs(mirror.x - currentPos.x) < 5 && Math.abs(mirror.y - currentPos.y) < 5) continue;
      if (currentDir.x !== 0) {
        if (Math.abs(mirror.y - currentPos.y) < 5) {
          const dx = mirror.x - currentPos.x;
          if (dx * currentDir.x > 0) {
            const dist = Math.abs(dx);
            if (dist < minDistance) { minDistance = dist; nextObstacle = mirror; isTarget = false; }
          }
        }
      } else {
        if (Math.abs(mirror.x - currentPos.x) < 5) {
          const dy = mirror.y - currentPos.y;
          if (dy * currentDir.y > 0) {
            const dist = Math.abs(dy);
            if (dist < minDistance) { minDistance = dist; nextObstacle = mirror; isTarget = false; }
          }
        }
      }
    }

    if (!nextObstacle) {
      path.push({ x: currentPos.x + currentDir.x * 500, y: currentPos.y + currentDir.y * 500 });
      break;
    }

    currentPos = { x: nextObstacle.x, y: nextObstacle.y };
    path.push({ ...currentPos });

    if (isTarget) { isHit = true; break; }

    // Ánh xạ góc vật lý theo vị trí gương (HARDCODED)
    const theta = nextObstacle.angle;
    let theta_physical = 0;
    if (Math.abs(nextObstacle.x - 45) < 5 && Math.abs(nextObstacle.y - 50) < 5) {
      theta_physical = theta + 90; // Gương A
    } else if (Math.abs(nextObstacle.x - 175) < 5 && Math.abs(nextObstacle.y - 50) < 5) {
      theta_physical = theta - 45; // Gương B
    } else if (Math.abs(nextObstacle.x - 175) < 5 && Math.abs(nextObstacle.y - 140) < 5) {
      theta_physical = theta - 90; // Gương C
    } else {
      theta_physical = theta;
    }

    const rad = (theta_physical * Math.PI) / 180;
    const n = { x: -Math.sin(rad), y: Math.cos(rad) };
    const dot = currentDir.x * n.x + currentDir.y * n.y;
    let nextDirX = Math.round(currentDir.x - 2 * dot * n.x);
    let nextDirY = Math.round(currentDir.y - 2 * dot * n.y);

    if (nextDirX === 0 && nextDirY === 0) break;
    currentDir = { x: nextDirX, y: nextDirY };
  }

  return { isHit, path };
}
module.exports = { calculateLaserPath };
```

> ⚠️ **Phát hiện**: Với layout hiện tại chỉ có DUY NHẤT 1 combination `[45, 90, 135]` là `isHit=true` trong tổng 27 tổ hợp. Tất cả combination khác đều `isHit=false`. Nguyên nhân: các offset hardcoded `+90`, `-45`, `-90` không cho phép đa dạng đường phản xạ.

---

## FILE 2: `functions/index.js` — `submitAnswer` (Physics case)

```js
exports.submitAnswer = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', '...');
  const uid = context.auth.uid;
  const { matchId, questionId, selectedAnswer } = data;

  const matchRef = db.collection('match_rooms').doc(matchId);
  const matchDoc = await matchRef.get();
  const roomData = matchDoc.data();

  if (roomData.status !== 'playing')
    throw new functions.https.HttpsError('failed-precondition', '...');

  const isPlayer1 = roomData.player1.uid === uid;
  const isPlayer2 = roomData.player2.uid === uid;
  if (!isPlayer1 && !isPlayer2)
    throw new functions.https.HttpsError('permission-denied', '...');

  const subject = roomData.subject;
  const matchData = roomData.matchData || {};

  // === PHYSICS CASE ===
  if (subject === 'physics') {
    try {
      const { physMirrors } = selectedAnswer || {};
      if (!physMirrors || !Array.isArray(physMirrors) || physMirrors.length < 3)
        throw new Error('physMirrors is missing, not an array, or has fewer than 3 elements.');

      // Đọc target từ matchData (do host tạo phòng lưu vào)
      const physTarget = (matchData.physTarget && Array.isArray(matchData.physTarget) && matchData.physTarget.length === 3)
        ? matchData.physTarget : [45, 90, 135]; // fallback

      const isMatchTarget = Number(physMirrors[0]) === physTarget[0] &&
                            Number(physMirrors[1]) === physTarget[1] &&
                            Number(physMirrors[2]) === physTarget[2];

      // Double-check bằng mô phỏng vật lý
      const mirrors = physMirrors.map((angle, idx) => ({
        x: idx === 0 ? 45 : 175,
        y: idx === 2 ? 140 : 50,
        angle: Number(angle) || 0
      }));
      const result = calculateLaserPath(mirrors, { x: 45, y: 140 }, { x: 295, y: 140 });

      // Đúng khi: khớp đề bài VÀ laser thực sự trúng
      correct = !!(isMatchTarget && result.isHit);
      currentProgress = correct ? 100 : 0;

      await matchRef.update({ [isPlayer1 ? 'player1Progress' : 'player2Progress']: currentProgress });
    } catch (err) {
      functions.logger.error("Error in physics submitAnswer:", err);
      throw new functions.https.HttpsError('internal', `Physics calculation failed: ${err.message}`);
    }
  }

  // Ghi log
  const logMsg = correct ? `✅ [Server] trả lời đúng (${currentProgress}%)` : `❌ [Server] trả lời sai (${currentProgress}%)`;
  await matchRef.update({ [logsKey]: updatedLogs });
  return { correct, currentProgress, explanation };
});
```

---

## FILE 3: `functions/index.js` — `finalizeMatch`

```js
exports.finalizeMatch = functions.https.onCall(async (data, context) => {
  const { matchId } = data;
  const matchRef = db.collection('match_rooms').doc(matchId);

  return db.runTransaction(async (transaction) => {
    const roomData = matchDoc.data();
    if (roomData.status === 'result') return { success: true, alreadyFinalized: true };

    const p1Prog = roomData.player1Progress || 0;
    const p2Prog = roomData.player2Progress || 0;
    const timeRemaining = roomData.timeRemaining !== undefined ? roomData.timeRemaining : 60;

    // BUG TIỀM ẨN: Client gọi finalizeMatch ngay khi timeRemaining=0, nhưng
    // server đọc timeRemaining từ Firestore — có thể đọc được giá trị > 0 nếu chưa sync
    if (p1Prog < 100 && p2Prog < 100 && timeRemaining > 0)
      throw new functions.https.HttpsError('failed-precondition', 'Trận chưa kết thúc');

    let winnerId = 'draw';
    if (p1Prog > p2Prog) winnerId = roomData.player1.uid;
    else if (p2Prog > p1Prog) winnerId = roomData.player2.uid;

    // ELO Calculation (Elo formula)
    const p1Elo = p1Data.stats?.elo ?? 1000;
    const p2Elo = p2Data.stats?.elo ?? 1000;
    const expectedP1 = 1 / (1 + Math.pow(10, (p2Elo - p1Elo) / 400));
    let eloChangeP1 = Math.round(pvpEloFactor * (scoreP1 - expectedP1));

    // Cập nhật stats và room
    transaction.update(p1Ref, { 'stats.elo': newEloP1, 'stats.exp': newExpP1, ... });
    transaction.update(matchRef, { status: 'result', winnerId, ... });
    return { success: true, winnerId, player1: {...}, player2: {...} };
  });
});
```

---

## FILE 4: `src/lib/arenaGenerator.js` — Physics target pool

```js
// HIỆN TẠI: chỉ còn 1 target hợp lệ
export const getPhysicsTargetPool = () => {
  return [[45, 90, 135]]; // DUY NHẤT combination isHit=true
};

// Math pool: 60 câu hỏi sinh tĩnh từ seed
export const getMathQuestionPool = () => {
  const pool = [];
  const operators = ['+', '-', '*', 'combo'];
  for (let i = 0; i < 60; i++) {
    const seed = i;
    const op = operators[seed % operators.length];
    const x1 = ((seed * 3) % 7) - 3;
    const y1 = ((seed * 5) % 7) - 3;
    // ... sinh công thức
    pool.push({ eq, ans, coord: ans });
  }
  return pool;
};
```

---

## FILE 5: `firestore.rules` — Security Rules

```
match /match_rooms/{roomId} {
  allow read, create: if isAuthenticated();
  allow delete: if isAdmin();

  // Whitelist update — chỉ các field sau được phép:
  allow update: if isAuthenticated() && (
    request.resource.data.diff(resource.data).affectedKeys().hasOnly([
      'lastHeartbeat', 'hostBackupActive', 'timeRemaining',
      'player1Chat', 'player2Chat', 'player1Logs', 'player2Logs',
      'player1TabSwitches', 'player2TabSwitches', 'player2', 'player2Seen', 'status'
    ]) &&
    isValidTabSwitchUpdate() &&
    isValidStatusUpdate() &&    // status chỉ được đổi waiting → playing
    isValidPlayer2Update()      // player2 chỉ được ghi khi null (chống cướp slot)
  );
}

match /users/{userId} {
  allow update: if isAdmin() || (
    isAuthenticated() && request.auth.uid == userId &&
    request.resource.data.diff(resource.data).affectedKeys().hasOnly([
      'displayName', 'bio', 'personalization', 'friends', 'incomingRequests', 'outgoingRequests'
    ]) && (
      !request.resource.data.diff(resource.data).affectedKeys().hasAny(['personalization']) ||
      request.resource.data.personalization.crystals == resource.data.personalization.crystals
    )
  );
}
```

> ⚠️ **Vấn đề**: `player1Progress`, `player2Progress`, `winnerId` KHÔNG nằm trong whitelist → Client không thể tự ghi, buộc phải qua Cloud Function. **Đây là thiết kế đúng.** Tuy nhiên `timeRemaining` nằm trong whitelist → cả 2 client đều có thể ghi `timeRemaining`, tiềm ẩn race condition giữa player1 và player2 khi cả hai đều là host.

---

## FILE 6: `src/app/dau-truong/page.js` — Client-side game logic (các đoạn cốt lõi)

### 6a. Physics UI — Gọi submitAnswer khi gương thay đổi

```js
// useEffect chạy mỗi khi physMirrors hoặc physPower thay đổi
useEffect(() => {
  if (arenaState.status === 'playing' && arenaState.subject === 'physics') {
    const updatePhysics = async () => {
      const isHit = physPower &&
                    physMirrors[0] === physTarget[0] &&
                    physMirrors[1] === physTarget[1] &&
                    physMirrors[2] === physTarget[2];
      const nextProgress = isHit ? 100 : 0;

      if (activeRoomId === 'local_sandbox') {
        updatePlayerProgress(nextProgress);
        return;
      }

      // Gọi server chỉ khi tiến độ thay đổi
      if (nextProgress !== arenaState.playerProgress) {
        try {
          const res = await httpsCallable(functions, 'submitAnswer')({
            matchId: activeRoomId,
            questionId: 'physics_laser',
            selectedAnswer: { physMirrors, power: physPower }
          });
          updatePlayerProgress(res.data.currentProgress);
        } catch (err) {
          console.error("Lỗi submitAnswer physics:", err);
        }
      }
    };
    const timer = setTimeout(updatePhysics, 0);
    return () => clearTimeout(timer);
  }
}, [physPower, physMirrors, arenaState.status, arenaState.subject, arenaState.playerProgress, activeRoomId]);
```

> ⚠️ **Vấn đề**: Khi `physTarget` được lấy từ `selectPhysicsTargetFromRoomId(roomId)` trên client (dùng pool 27 tổ hợp cũ), nhưng server đọc từ `matchData.physTarget` (chỉ `[45,90,135]`), nếu phòng cũ không có `matchData.physTarget` thì server fallback về `[45,90,135]` còn client có thể hiển thị target khác.

### 6b. Heartbeat / Host Failover

```js
// Game loop mỗi 1 giây
gameLoopTimerRef.current = setInterval(async () => {
  const isPlayer1 = roomData.player1.uid === user.uid;
  const isHostOffline = (Date.now() - roomData.lastHeartbeat) > 10000;
  const amIHost = isPlayer1 || (isPlayer2 && isHostOffline);

  if (amIHost) {
    tickArenaTime();
    await updateDoc(roomDocRef, {
      lastHeartbeat: Date.now(),
      timeRemaining: Math.max(0, arenaState.timeRemaining - 1)
    });
  }
}, 1000);
```

> ⚠️ **Race condition**: Khi host offline và player2 tiếp quản, cả hai có thể cùng ghi `timeRemaining` một lúc nếu host phục hồi kết nối. Không có lock/transaction.

### 6c. finalizeMatch — Gọi từ client 2 nơi

```js
// Nơi 1: Hết giờ
if (arenaState.timeRemaining <= 0) {
  await httpsCallable(functions, 'finalizeMatch')({ matchId: activeRoomId });
}

// Nơi 2: Đạt 100%
if (arenaState.playerProgress >= 100) {
  await httpsCallable(functions, 'finalizeMatch')({ matchId: activeRoomId });
}
```

> ⚠️ **Vấn đề**: Cả 2 player đều có thể gọi `finalizeMatch` đồng thời. Server có idempotency check (`if status === 'result' return`) nhưng nếu 2 transaction chạy song song trước khi cái đầu commit xong, có thể xử lý ELO 2 lần.

### 6d. Lịch sử trận đấu — query sai status

```js
const q = query(roomsCollection, where('status', '==', 'finished'));
// BUG: Cloud Function finalizeMatch set status = 'result', không phải 'finished'
// → lịch sử luôn trống
```

### 6e. handleMatchFoundReal — physTarget đồng bộ từ matchData

```js
if (matchData.physTarget) {
  finalTarget = matchData.physTarget;  // Lấy từ Firestore (đúng)
} else if (matchData.questionPool && ...) {
  // Parse từ pool string "45-90-135"
  finalTarget = chosen.split('-').map(Number);
} else {
  finalTarget = selectPhysicsTargetFromRoomId(roomId); // Fallback: có thể khác server
}
setPhysTarget(finalTarget);
```

---

## FILE 7: `src/components/layout/Header.jsx` — Tạo phòng (matchData)

```js
} else if (subject === 'physics') {
  const seenPhys = getSessionHistory('seen_phys_targets');
  const physPool = generatePhysicsPool(seenPhys, 1);
  matchData.physTarget = physPool[0] || [45, 90, 135];
  // ✅ SAU KHI FIX: physPool luôn trả về [[45,90,135]]
}
```

---

## Tổng hợp các lỗi/vấn đề cần Claude đánh giá

| # | File | Vấn đề | Mức độ |
|---|------|---------|--------|
| 1 | physicsEngine.js | Chỉ 1/27 combination hợp lệ vật lý — game thiếu đa dạng | 🔴 Critical |
| 2 | page.js L733 | `where('status', '==', 'finished')` nhưng server set `'result'` → lịch sử trống | 🔴 Critical |
| 3 | finalizeMatch | Không có distributed lock → có thể double ELO nếu 2 client gọi đồng thời | 🟠 High |
| 4 | page.js | timeRemaining được ghi bởi cả 2 client khi host failover → race condition | 🟠 High |
| 5 | page.js | `selectPhysicsTargetFromRoomId` dùng pool 27 tổ hợp (cũ) trong fallback — không khớp server | 🟡 Medium |
| 6 | firestore.rules | `timeRemaining` trong whitelist → player2 ghi đè được timer | 🟡 Medium |
| 7 | physicsEngine | Không validate laser đi theo hướng diagonal (chỉ hỗ trợ 4 hướng trục) | 🟡 Medium |
| 8 | submitAnswer | Gọi Cloud Function mỗi khi mirror xoay — không có debounce, spam requests | 🟡 Medium |
| 9 | finalizeMatch | `timeRemaining` đọc từ Firestore có thể chưa sync khi client vừa reset | 🟡 Medium |
| 10 | page.js | Chemistry event từ iframe không qua Cloud Function → không có server-side validation | 🟠 High |
