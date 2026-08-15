# Đấu Trường STEM: Tài liệu Phân tích Logic & Mã nguồn Môn Toán Học và So sánh 4 Môn

Tài liệu này được biên soạn đầy đủ để phục vụ việc phân tích, tư vấn nâng cấp và thiết kế lại hệ thống câu hỏi, cơ chế gameplay và tính toán tiến độ của các môn học trong Đấu trường STEM (đặc biệt là môn Toán học).

---

## 1. Logic sinh câu hỏi/thử thách cho môn Toán trong 1 trận đấu

### Toàn bộ hàm `getMathQuestionPool()` trong `arenaGenerator.js`
Hàm này sinh ra một danh sách cố định gồm 60 câu hỏi tọa độ dựa trên thuật toán hạt giống (seed) xoay vòng 4 toán tử `+`, `-`, `*`, `combo` (phối hợp):

```javascript
// Đường dẫn file: src/lib/arenaGenerator.js (Dòng 235-266)
export const getMathQuestionPool = () => {
  const pool = [];
  const operators = ['+', '-', '*', 'combo'];
  for (let i = 0; i < 60; i++) {
    const seed = i;
    const op = operators[seed % operators.length];
    let eq = '';
    let ans = { x: 0, y: 0 };
    
    const x1 = ((seed * 3) % 7) - 3;
    const y1 = ((seed * 5) % 7) - 3;
    const x2 = ((seed * 7) % 7) - 3;
    const y2 = ((seed * 11) % 7) - 3;
    
    if (op === '+') {
      eq = `A(${x1}, ${y1}) + B(${x2}, ${y2}) = P(x, y)`;
      ans = { x: x1 + x2, y: y1 + y2 };
    } else if (op === '-') {
      eq = `u(${x1}, ${y1}) - v(${x2}, ${y2}) = P(x, y)`;
      ans = { x: x1 - x2, y: y1 - y2 };
    } else if (op === '*') {
      const k = (seed % 2) + 2;
      eq = `${k} * w(${x1}, ${y1}) = P(x, y)`;
      ans = { x: k * x1, y: k * y1 };
    } else {
      eq = `2*A(${x1}, ${y1}) + B(${x2}, ${y2}) = P(x, y)`;
      ans = { x: 2 * x1 + x2, y: 2 * y1 + y2 };
    }
    pool.push({ eq, ans, coord: ans });
  }
  return pool;
};
```

### Đoạn code xác định số lượng câu hỏi Toán cho mỗi trận đấu
Số lượng câu hỏi môn Toán cho mỗi trận đấu hiện tại đang bị **hardcode cứng là 3 câu**. Dưới đây là các vị trí quy định số lượng này:

1. **Khi sinh ngẫu nhiên ngoại tuyến (Sandbox / Chơi đơn) trong `page.js`:**
   ```javascript
   // Đường dẫn file: src/app/dau-truong/page.js (Dòng 492-500)
   const generateRandomMathAsteroids = () => {
     const pool = getMathQuestionPool();
     return pool.slice(0, 3).map((q, idx) => ({
       eq: q.eq,
       ans: q.ans,
       status: idx === 0 ? 'active' : 'pending',
       coord: q.coord
     }));
   };
   ```

2. **Khi chọn câu hỏi từ ID phòng đấu (Online Match) trong `page.js`:**
   ```javascript
   // Đường dẫn file: src/app/dau-truong/page.js (Dòng 450-482)
   const selectMathAsteroidsFromRoomId = (roomId) => {
     const pool = getMathQuestionPool();
     if (!roomId || pool.length === 0) {
       const fallbackPool = generateMathPool([], 3);
       return fallbackPool.map((q, i) => ({
         eq: q.eq,
         ans: q.ans,
         status: i === 0 ? 'active' : 'pending',
         coord: q.coord
       }));
     }
     
     let hash = 0;
     for (let i = 0; i < roomId.length; i++) {
       hash = roomId.charCodeAt(i) + ((hash << 5) - hash);
     }
     
     const shuffledPool = [...pool];
     for (let i = shuffledPool.length - 1; i > 0; i--) {
       const j = Math.abs((hash + i) % (i + 1));
       const temp = shuffledPool[i];
       shuffledPool[i] = shuffledPool[j];
       shuffledPool[j] = temp;
     }
     
     const selected = shuffledPool.slice(0, 3); // Lấy chính xác 3 phần tử
     return selected.map((q, i) => ({
       eq: q.eq,
       ans: q.ans,
       status: i === 0 ? 'active' : 'pending',
       coord: q.coord
     }));
   };
   ```

### Cách tính tiến độ (progress) môn Toán
Tiến độ của môn Toán được tính tỷ lệ thuận theo số lượng câu hỏi đã trả lời đúng trên tổng số câu hỏi (ở đây là 3 câu):

* **Tại Local Sandbox (Offline):**
  * Đúng câu 1 (`nextIndex = 1`): `Math.floor((1 / 3) * 100) = 33%`
  * Đúng câu 2 (`nextIndex = 2`): `Math.floor((2 / 3) * 100) = 66%`
  * Đúng câu 3 (`nextIndex = 3`): Gọi hàm `updatePlayerProgress(100)` đặt tiến độ bằng `100%`.
  * *Mã nguồn:*
    ```javascript
    const nextIndex = mathTargetIndex + 1;
    if (nextIndex < mathAsteroids.length) {
      nextAsteroids[nextIndex].status = 'active';
      setMathTargetIndex(nextIndex);
      setMathAsteroids(nextAsteroids);
      updatePlayerProgress(Math.floor((nextIndex / mathAsteroids.length) * 100));
    } else {
      setMathAsteroids(nextAsteroids);
      updatePlayerProgress(100);
      ...
    }
    ```
* **Tại Trực tuyến (Online thông qua Cloud Function):**
  * Server tính tiến độ dựa trên mảng câu hỏi được truyền qua room data (`questionPool.length`):
    ```javascript
    const nextIndex = astIndex + 1;
    if (nextIndex >= questionPool.length) {
      currentProgress = 100;
    } else {
      currentProgress = Math.floor((nextIndex / questionPool.length) * 100);
    }
    ```

---

## 2. Toàn bộ UI/logic component xử lý môn Toán trong `page.js`

### Đoạn code render giao diện "Vector Target Lock"
Giao diện hiển thị bảng radar tọa độ thiên thạch Descartes và form nhập tọa độ x, y để bắn thiên thạch:

```javascript
// Đường dẫn file: src/app/dau-truong/page.js (Dòng 2835-2938)
{/* Radar coordinate display */}
<div className="flex-1 min-h-[300px] bg-[#14151f]/50 rounded-3xl border border-white/5 p-4 flex items-center justify-center relative overflow-hidden">
  {/* Radar Grid Backdrop */}
  <div className="w-[256px] h-[256px] rounded-full border border-pink-500/20 relative flex items-center justify-center">
    {/* Grid lines */}
    <div className="absolute inset-0 border-t border-b border-white/5 top-1/2 -translate-y-px z-0" />
    <div className="absolute inset-0 border-l border-r border-white/5 left-1/2 -translate-x-px z-0" />
    
    {/* Dynamic Laser Beam Path */}
    {mathLaserPath && (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
        <line 
          x1="128" 
          y1="128" 
          x2={128 + (mathLaserPath.x * 11)} 
          y2={128 - (mathLaserPath.y * 11)} 
          stroke="#ec4899" 
          strokeWidth="3" 
          strokeLinecap="round"
          className="animate-pulse"
        />
      </svg>
    )}

    {/* Center Core */}
    <div className="w-4 h-4 bg-pink-500/20 border border-pink-500/50 rounded-full flex items-center justify-center relative z-20">
      <div className="w-1.5 h-1.5 bg-pink-500 rounded-full" />
    </div>

    {/* Asteroids coordinates mapping */}
    {mathAsteroids.map((ast, i) => {
      // Map math coordinates to 256x256 pixel grid centered at 128,128
      // Scale factor = 11px per coordinate unit
      const posX = 128 + (ast.coord.x * 11);
      const posY = 128 - (ast.coord.y * 11);

      return (
        <div 
          key={i}
          className="absolute w-4 h-4 -translate-x-2 -translate-y-2 z-20 flex items-center justify-center"
          style={{ left: `${posX}px`, top: `${posY}px` }}
        >
          {ast.status === 'active' && (
            <>
              <div className="absolute inset-0 bg-amber-500/30 rounded-full animate-ping" />
              <Flame className="w-4 h-4 text-amber-500 relative z-10 animate-bounce" />
            </>
          )}
          {ast.status === 'destroyed' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shadow-md animate-pulse" />
          )}
          {ast.status === 'pending' && (
            <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
          )}
        </div>
      );
    })}

    <span className="absolute bottom-2 right-2 text-[8px] font-mono text-zinc-600">RANGE: 10ly</span>
  </div>

  {/* Navigation HUD stats */}
  <div className="absolute left-4 top-4 bg-[#1e202b]/95 p-3 rounded-xl border border-white/5 font-mono text-[8px] text-zinc-500 flex flex-col gap-1 select-none">
    <span>SECTOR: DELTA-DES-9</span>
    <span>BEARING: {mathAsteroids[mathTargetIndex] ? `${120 + (mathTargetIndex * 45)}°` : '0°'}</span>
    <span>TGT DISTANCE: {mathAsteroids[mathTargetIndex] ? `${240 - (mathTargetIndex * 60)}k km` : 'N/A'}</span>
  </div>
</div>

{/* Input pad */}
<form onSubmit={handleMathInputSubmit} className="w-full md:w-80 shrink-0 bg-[#14151f] p-6 rounded-3xl border border-white/5 flex flex-col gap-5 font-mono justify-between h-full overflow-y-auto">
  <div>
    <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-4">
      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">VECTOR TARGET LOCK</span>
      <span className="text-[10px] font-bold text-pink-400">{mathTargetIndex + 1} / 3</span>
    </div>

    <div className="bg-[#1e202b] p-3.5 rounded-2xl border border-white/5 text-center mb-4">
      <span className="text-[9px] text-zinc-500 block uppercase mb-2">PHƯƠNG TRÌNH QUỸ ĐẠO</span>
      <code className="text-sm font-bold text-white tracking-widest">{mathAsteroids[mathTargetIndex]?.eq}</code>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label className="text-[9.5px] text-zinc-500 block uppercase mb-1.5 font-bold">Hoành độ x</label>
        <input 
          type="number" 
          required
          value={mathInputs.x}
          onChange={(e) => setMathInputs({ ...mathInputs, x: e.target.value })}
          placeholder="x = ?"
          className="w-full bg-[#1e202b] border border-white/5 focus:border-pink-500 focus:outline-none rounded-2xl text-center py-2.5 text-white font-mono font-bold"
        />
      </div>
      <div>
        <label className="text-[9.5px] text-zinc-500 block uppercase mb-1.5 font-bold">Tung độ y</label>
        <input 
          type="number" 
          required
          value={mathInputs.y}
          onChange={(e) => setMathInputs({ ...mathInputs, y: e.target.value })}
          placeholder="y = ?"
          className="w-full bg-[#1e202b] border border-white/5 focus:border-pink-500 focus:outline-none rounded-2xl text-center py-2.5 text-white font-mono font-bold"
        />
      </div>
    </div>
  </div>

  <button 
    type="submit"
    onMouseEnter={playSound.hover}
    className="w-full py-3.5 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-pink-500/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
  >
    <Zap className="w-3.5 h-3.5 fill-white shrink-0 animate-bounce" /> KÍCH PHÁO PLASMA
  </button>
</form>
```

### Hàm xử lý khi học sinh nhập đáp án và bấm nút (`handleMathInputSubmit`)
Hàm này chặn hành vi submit mặc định của form, thu thập dữ liệu tọa độ nhập từ học sinh, rồi gửi lên Cloud Function `submitAnswer` thông qua callable functions SDK:

```javascript
// Đường dẫn file: src/app/dau-truong/page.js (Dòng 2028-2119)
const handleMathInputSubmit = async (e) => {
  e.preventDefault();
  const target = mathAsteroids[mathTargetIndex];
  if (!target) return;

  const userX = parseInt(mathInputs.x);
  const userY = parseInt(mathInputs.y);

  if (activeRoomId === 'local_sandbox') {
    if (userX === target.ans.x && userY === target.ans.y) {
      playSound.success();
      const newCombo = mathCombo + 1;
      setMathCombo(newCombo);
      
      setMathLaserPath(target.coord);
      setTimeout(() => setMathLaserPath(null), 800);

      const comboBonus = newCombo >= 3 ? ` 🔥 COMBO x${newCombo}!` : '';
      addArenaLog(`💥 Tiêu diệt (${userX}, ${userY})!${comboBonus}`);

      const nextAsteroids = [...mathAsteroids];
      nextAsteroids[mathTargetIndex].status = 'destroyed';
      
      const nextIndex = mathTargetIndex + 1;
      if (nextIndex < mathAsteroids.length) {
        nextAsteroids[nextIndex].status = 'active';
        setMathTargetIndex(nextIndex);
        setMathAsteroids(nextAsteroids);
        updatePlayerProgress(Math.floor((nextIndex / mathAsteroids.length) * 100));
      } else {
        setMathAsteroids(nextAsteroids);
        updatePlayerProgress(100);
        const wrongMsg = mathWrongCount > 0 ? ` (${mathWrongCount} sai)` : ' - PERFECT!';
        addArenaLog(`🛡️ Xóa sạch thiên thạch!${wrongMsg}`);
      }
      setMathInputs({ x: '', y: '' });
    } else {
      playSound.click();
      setMathCombo(0);
      setMathWrongCount((prev) => prev + 1);
      addArenaLog(`❌ Sai! Tọa độ (${userX}, ${userY}) không trùng mục tiêu! (Sai lần ${mathWrongCount + 1})`);
    }
    return;
  }

  try {
    const submitAnswerFn = httpsCallable(functions, 'submitAnswer');
    const res = await submitAnswerFn({
      matchId: activeRoomId,
      questionId: String(mathTargetIndex),
      selectedAnswer: { x: userX, y: userY }
    });

    const { correct, currentProgress } = res.data;
    updatePlayerProgress(currentProgress);

    if (correct) {
      playSound.success();
      const newCombo = mathCombo + 1;
      setMathCombo(newCombo);
      
      setMathLaserPath(target.coord);
      setTimeout(() => setMathLaserPath(null), 800);

      const comboBonus = newCombo >= 3 ? ` 🔥 COMBO x${newCombo}!` : '';
      addArenaLog(`💥 Tiêu diệt (${userX}, ${userY})!${comboBonus}`);

      const nextAsteroids = [...mathAsteroids];
      nextAsteroids[mathTargetIndex].status = 'destroyed';
      
      const nextIndex = mathTargetIndex + 1;
      if (nextIndex < mathAsteroids.length) {
        nextAsteroids[nextIndex].status = 'active';
        setMathTargetIndex(nextIndex);
        setMathAsteroids(nextAsteroids);
      } else {
        setMathAsteroids(nextAsteroids);
        const wrongMsg = mathWrongCount > 0 ? ` (${mathWrongCount} sai)` : ' - PERFECT!';
        addArenaLog(`🛡️ Xóa sạch thiên thạch!${wrongMsg}`);
      }
      setMathInputs({ x: '', y: '' });
    } else {
      playSound.click();
      setMathCombo(0);
      setMathWrongCount((prev) => prev + 1);
      addArenaLog(`❌ Sai! Tọa độ (${userX}, ${userY}) không trùng mục tiêu! (Sai lần ${mathWrongCount + 1})`);
    }
  } catch (err) {
    console.error("Lỗi submitAnswer math:", err);
    addArenaLog(`🚨 Lỗi kết nối server khi bắn thiên thạch!`);
  }
};
```

### Case `math` trong Cloud Function `submitAnswer`
Đây là logic Server-side chịu trách nhiệm xác thực tọa độ bắn phá thiên thạch của học sinh có khớp với tọa độ mục tiêu ẩn của hệ thống hay không:

```javascript
// Đường dẫn file: functions/index.js (Dòng 136-161)
  } else if (subject === 'math') {
    const astIndex = Number(questionId);
    if (isNaN(astIndex) || astIndex < 0 || astIndex >= questionPool.length) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid asteroidIndex.');
    }
    const target = questionPool[astIndex];
    const userX = selectedAnswer.x;
    const userY = selectedAnswer.y;
    
    // So sánh toạ độ người chơi gửi lên với toạ độ đáp án được lưu trong database
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
  }
```

---

## 3. Cấu trúc thử thách của cả 3 môn còn lại để so sánh

### Vật Lý: Mô phỏng Lab Quang Học (Laser Refraction)
* **Số lượng thử thách/Trận đấu:** Chỉ có đúng **1 thử thách (1 bước)** cho mỗi trận.
* **Cấu trúc:** Người chơi phải điều chỉnh xoay 3 chiếc gương định vị góc tại các tọa độ cố định để hướng tia laser bắn trúng hồng tâm đích.
* **Logic tính tiến độ:** Tiến độ chỉ nhận 2 giá trị là `0%` hoặc `100%`. Khi người chơi xoay đúng toàn bộ 3 góc gương theo cấu hình hệ thống VÀ hệ thống kiểm tra vật lý tính toán tia laser thực sự va chạm với hồng tâm (`result.isHit`), tiến độ của người chơi sẽ nhảy vọt lên `100%`.
* **Mã nguồn xác thực:**
  ```javascript
  // Đường dẫn file: functions/index.js (Dòng 162-206)
  } else if (subject === 'physics') {
    try {
      const { physMirrors } = selectedAnswer || {};
      if (!physMirrors || !Array.isArray(physMirrors) || physMirrors.length < 3) {
        throw new Error('physMirrors is missing, not an array, or has fewer than 3 elements.');
      }

      const physTarget = (matchData.physTarget && Array.isArray(matchData.physTarget) && matchData.physTarget.length === 3)
        ? matchData.physTarget
        : [45, 90, 135]; // Đáp án góc gương hợp lệ mặc định

      // Kiểm tra góc xoay gương khớp đề bài
      const isMatchTarget = Number(physMirrors[0]) === physTarget[0] &&
                            Number(physMirrors[1]) === physTarget[1] &&
                            Number(physMirrors[2]) === physTarget[2];

      // Double-check bằng thuật toán mô phỏng vật lý tia laser
      const mirrors = physMirrors.map((angle, idx) => ({
        x: idx === 0 ? 45 : 175,
        y: idx === 2 ? 140 : 50,
        angle: Number(angle) || 0
      }));
      const result = calculateLaserPath(mirrors, { x: 45, y: 140 }, { x: 295, y: 140 });

      // Kết quả đúng khi: góc khớp đề bài VÀ tia laser thực sự trúng đích
      correct = !!(isMatchTarget && result.isHit);
      currentProgress = correct ? 100 : 0;

      const updateData = {
        [isPlayer1 ? 'player1Progress' : 'player2Progress']: currentProgress
      };
      await matchRef.update(updateData);
    } catch (err) { ... }
  }
  ```

### Hóa Học: Thí nghiệm thực hành trong iframe (QuantumLab Simulation)
* **Số lượng thử thách/Trận đấu:** **1 thử thách lớn** (Ví dụ: "Điều chế Clo", "Este hóa", "Phản ứng nhiệt nhôm",...).
* **Cấu trúc:** Học sinh tương tác trực tiếp với các dụng cụ, hóa chất, thiết bị bảo hộ, nguồn nhiệt trên iframe QuantumLab giả lập. Khi phản ứng chính xảy ra, iframe bắn sự kiện `chemistry_reaction_complete` hoặc `chemistry_safety_violation` lên client/server.
* **Logic tính tiến độ:**
  * **Nếu hoàn thành phản ứng chính** và vượt qua toàn bộ lớp xác thực bảo vệ vật lý của server (kiểm tra nhiệt độ thích hợp, tỷ lệ nồng độ axit-kiềm, mức độ bay hơi, và điểm kiểm tra gian lận năng lượng IDCL): Tiến độ sẽ nhảy lên thẳng `100%`.
  * **Nếu hoàn thành phản ứng phụ** (ngoài mục tiêu chính của đề bài): Học sinh được cộng dồn `+15%` tiến độ mỗi lần, nhưng bị chặn trần ở `90%` tiến độ tối đa (đảm bảo không thể chiến thắng nếu không làm đúng mục tiêu chính).
  * **Nếu vi phạm an toàn phòng lab** (ví dụ: không bật tủ hút khi có khí độc, không đeo kính bảo hộ): Học sinh bị trừ `-10%` tiến độ mỗi lần vi phạm.
* **Mã nguồn xác thực:**
  ```javascript
  // Đường dẫn file: functions/index.js (Dòng 207-284)
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
          validationNote = `Nhiệt độ không đủ (${temp}°C < 85°C)`;
        }
      }
      // ... (Validate tỷ lệ HCl, NaOH và bốc hơi chemEvap) ...

      // Chống injection cheat bằng cách check IDCL Energy (nếu energy == 100 nghĩa là chưa thao tác gì đã trigger hoàn thành)
      const idclEnergy = selectedAnswer.idclEnergy !== undefined ? Number(selectedAnswer.idclEnergy) : undefined;
      if (idclEnergy !== undefined && idclEnergy >= 100) {
        isPhysicallyValid = false;
      }

      if (isMatch && isPhysicallyValid) {
        correct = true;
        currentProgress = 100;
      } else {
        currentProgress = Math.min(90, currentProg + 15); // Phản ứng phụ: cộng 15%, trần 90%
      }
    } else if (type === 'chemistry_safety_violation') {
      currentProgress = Math.max(0, currentProg - 10); // Phạt vi phạm an toàn: trừ 10%
    }

    const updateData = {
      [isPlayer1 ? 'player1Progress' : 'player2Progress']: currentProgress
    };
    await matchRef.update(updateData);
  }
  ```

### Sinh học: Trắc nghiệm kiến thức (Genome Staircase MCQ)
* **Số lượng thử thách/Trận đấu:** **30 câu hỏi trắc nghiệm liên tiếp**.
* **Cấu trúc:** Giao diện hiển thị lần lượt các câu hỏi 4 đáp án lựa chọn lấy từ ngân hàng câu hỏi `questions` của Firestore hoặc fallback từ bộ sinh câu hỏi Sinh học nội bộ.
* **Logic tính tiến độ:**
  * Tiến độ tăng dần đều theo tỷ lệ số câu đã làm trên tổng số câu hỏi: `Math.round((nextQ / questionPool.length) * 100)`. Mỗi câu tương đương khoảng `3.3%` tiến độ.
  * **Cơ chế thưởng hoàn thành cuối trận:** Khi trả lời hết câu hỏi thứ 30: Nếu tỷ lệ đúng đạt từ 60% trở lên, học sinh được cộng thêm 10% tiến độ khuyến khích (`Math.min(100, pct + 10)`); nếu không đạt 60% đúng, giữ nguyên tiến độ thực tế (ví dụ đúng 15 câu thì chỉ có 50% tiến độ và không thể chạm 100% để kích hoạt chiến thắng).
* **Mã nguồn xác thực:**
  ```javascript
  // Đường dẫn file: functions/index.js (Dòng 110-135)
  } else if (subject === 'biology') {
    const qIndex = Number(questionId);
    ...
    const q = questionPool[qIndex];
    correct = q.correct === selectedAnswer;
    explanation = q.note || '';

    const scoreKey = isPlayer1 ? 'player1Score' : 'player2Score';
    const currentScore = roomData[scoreKey] || 0;
    const newScore = correct ? currentScore + 1 : currentScore;

    const nextQ = qIndex + 1;
    if (nextQ >= questionPool.length) {
      const pct = Math.round((newScore / questionPool.length) * 100);
      currentProgress = pct >= 60 ? Math.min(100, pct + 10) : pct; // Cơ chế thưởng +10% nếu đúng >= 60%
    } else {
      currentProgress = Math.round((nextQ / questionPool.length) * 100);
    }
    ...
  }
  ```

---

## 4. Cấu trúc dữ liệu chung

### Lưu thông tin "Loại thử thách" của từng môn học trong Firestore
Dưới đây là sơ đồ cấu trúc của document trong collection `match_rooms` trên Cloud Firestore:

* **Field `subject`:**
  * Kiểu dữ liệu: `String`
  * Giá trị: `'math' | 'physics' | 'chemistry' | 'biology'`
  * Đây là field duy nhất hiện tại quy định loại mini-game/thử thách sẽ chơi.

* **Field `matchData`:**
  * Kiểu dữ liệu: `Map` (Object)
  * Lưu trữ cấu trúc câu hỏi động được tạo cho mỗi trận đấu:
    * `matchData.questionPool`: Mảng danh sách các câu hỏi.
      * Môn Toán: Lưu mảng 3 object chứa `{ eq, ans, coord }`.
      * Môn Sinh học: Lưu mảng 30 object chứa `{ text, choices, correct, note }`.
    * `matchData.physTarget`:
      * Môn Vật lý: Mảng chứa 3 góc gương đích `[angleA, angleB, angleC]`.
    * Môn Hóa học: ID nhiệm vụ hóa học chính được lưu trực tiếp ở field `questionId` của room hoặc map cấu hình, không lưu mảng câu hỏi trong `matchData`.

### Phân tích thiết kế hệ thống câu hỏi hiện tại
> [!IMPORTANT]
> **Nhận xét quan trọng:**
> Hệ thống hiện tại **chưa hề có trường cấu trúc loại thử thách (trắc nghiệm vs thực hành) tường minh** (ví dụ: một trường dạng `challengeType: 'mcq' | 'practical'`). 
> Thay vào đó, hệ thống đang coi tất cả các trận đấu trong cùng một môn đều có cùng một loại gameplay cố định:
> * Môn **Toán**: Bắt buộc là thực hành nhập tọa độ (Descartes radar).
> * Môn **Vật lý**: Bắt buộc là thực hành xoay gương (Laser path).
> * Môn **Hóa học**: Bắt buộc là thực hành thí nghiệm ảo (QuantumLab).
> * Môn **Sinh học**: Bắt buộc là trắc nghiệm lý thuyết (MCQ).
>
> Muốn cải tiến để cho phép 1 môn học có cả hai loại thử thách (Ví dụ: Toán vừa có trắc nghiệm vừa có giải đố tọa độ), hệ thống cần bổ sung một trường phân loại thử thách rõ ràng trong schema cấu trúc phòng đấu (ví dụ: `matchData.type = 'mcq'` hoặc `matchData.type = 'sandbox'`).
