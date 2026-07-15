const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/dau-truong/page.js');
let content = fs.readFileSync(filePath, 'utf8');

const chemistryCode = `  // ----------------------------------------------------
  // LOGIC MINI-GAME 1: HÓA HỌC (Stochiometric pH Titration)
  // ----------------------------------------------------
  const handleChemistryRealtimeTick = async () => {
    if (document.getElementById('chemistry-lab-iframe')) {
      return;
    }
    if (chemBurner) {
      setChemTemp((prev) => {
        const nextTemp = Math.min(150, prev + 15);
        if (nextTemp > 120) {
          playSound.click();
          addArenaLog('💥 QUÁ NHIỆT! Áp suất trong Beaker quá cao gây nổ lò! Làm lại từ đầu!');
          setChemHCl(0);
          setChemNaOH(0);
          setChemBurner(false);
          setChemEvap(0);
          
          if (activeRoomId === 'local_sandbox') {
            updatePlayerProgress(0);
          } else {
            // Online: Gọi submitAnswer cho safety violation
            const submitAnswerFn = httpsCallable(functions, 'submitAnswer');
            submitAnswerFn({
              matchId: activeRoomId,
              questionId: 'chemistry_safety',
              selectedAnswer: { type: 'chemistry_safety_violation' }
            }).then(res => {
              updatePlayerProgress(res.data.currentProgress);
            }).catch(err => console.error(err));
          }
          return 25;
        }
        return nextTemp;
      });
    } else {
      setChemTemp((prev) => Math.max(25, prev - 8));
    }

    const isBalanced = chemHCl === chemTarget && chemNaOH === chemTarget;
    const isAtEvapTemp = chemTemp >= 95 && chemTemp <= 105;

    if (isBalanced && isAtEvapTemp) {
      setChemEvap((prev) => {
        const nextEvap = Math.min(100, prev + 10);
        
        if (activeRoomId === 'local_sandbox') {
          updatePlayerProgress(nextEvap);
        }

        if (nextEvap === 10) {
          addArenaLog('💧 Dung dịch trung hòa bắt đầu sôi! Hơi nước H₂O bốc lên cuồn cuộn!');
        } else if (nextEvap === 100) {
          addArenaLog('✨ Kết tinh thành công tinh thể NaCl muối ăn lập phương hoàn hảo!');
          if (activeRoomId !== 'local_sandbox') {
            // Online: Gọi submitAnswer chemistry_reaction_complete khi hoàn thành 100%
            const submitAnswerFn = httpsCallable(functions, 'submitAnswer');
            submitAnswerFn({
              matchId: activeRoomId,
              questionId: 'chemistry_neutralization',
              selectedAnswer: { 
                type: 'chemistry_reaction_complete',
                equation: 'HCl + NaOH -> NaCl + H2O',
                reactants: ['HCl', 'NaOH']
              }
            }).then(res => {
              updatePlayerProgress(res.data.currentProgress);
              if (res.data.correct) {
                addArenaLog('[Server] ✨ Xác thực phản ứng hóa học kết tinh NaCl thành công!');
              }
            }).catch(err => console.error(err));
          }
        }
        return nextEvap;
      });
    } else if (!isBalanced && chemTemp >= 95) {
      setChemEvap(0);
      if (activeRoomId === 'local_sandbox') {
        updatePlayerProgress(0);
      }
    }
  };

  const getChemPH = () => {
    if (chemHCl === 0 && chemNaOH === 0) return 7.0;
    if (chemHCl === chemNaOH) return 7.0;
    if (chemHCl > chemNaOH) {
      return Math.max(1.0, (7.0 - ((chemHCl - chemNaOH) / 10) * 1.8)).toFixed(1);
    } else {
      return Math.min(14.0, (7.0 + ((chemNaOH - chemHCl) / 10) * 1.8)).toFixed(1);
    }
  };

  const getChemFluidColor = (ph) => {
    const phVal = parseFloat(ph);
    if (phVal === 7.0) return 'from-emerald-500/60 to-emerald-400/40 border-emerald-400';
    if (phVal < 7.0) return 'from-rose-500/60 to-rose-400/40 border-rose-400';
    return 'from-blue-500/60 to-blue-400/40 border-blue-400';
  };

  const handleChemAddHCl = () => {
    playSound.click();
    setChemHCl((prev) => {
      const next = Math.min(50, prev + 10);
      setChemAddCount((c) => c + 1);
      addArenaLog(\`Thêm 10ml HCl → Tổng: \${next}ml (cần: \${chemTarget}ml)\`);
      return next;
    });
  };`;

if (content.includes('const handleChemAddNaOH = () => {')) {
  content = content.replace('const handleChemAddNaOH = () => {', chemistryCode + '\n\n  const handleChemAddNaOH = () => {');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("✅ Successfully restored Chemistry mini-game functions!");
} else {
  console.error("❌ Target hook 'handleChemAddNaOH' not found!");
}
