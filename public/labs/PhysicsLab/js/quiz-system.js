/**
 * PHYSICS LAB - HỆ THỐNG LUYỆN TẬP TỰ ĐỘNG - CHUẨN THI CỬ (EXAM ENGINE)
 * Sinh ngẫu nhiên 24 câu hỏi và đánh giá toàn diện, kết hợp hiệu ứng.
 */

(function initQuizSystem() {
    if (document.getElementById('quiz-fab')) return; // Tránh trùng lặp

    console.log('[Exam System] Initializing Full Exam Engine...');

    const topicMap = {
        'dao-dong-dieu-hoa.html': 'dao-dong-dieu-hoa',
        'con-lac-don-lo-xo.html': 'con-lac-don-lo-xo',
        'dao-dong-tat-dan.html': 'dao-dong-tat-dan',
        'giao-thoa-song-co.html': 'giao-thoa-song-co',
        'thi-nghiem-song-dung.html': 'thi-nghiem-song-dung',
        'song-doc-song-ngang.html': 'song-doc-song-ngang',
        'song-dung-1-tu-do.html': 'song-dung-1-tu-do',
        'song-dung-2-co-dinh.html': 'song-dung-2-co-dinh',
        'do-tan-so-song-am.html': 'do-tan-so-song-am',
        'giao-thoa-anh-sang.html': 'giao-thoa-anh-sang',
        'mach-dien-dc.html': 'mach-dien-dc',
        'nguon-dien-mach-kin.html': 'nguon-dien-mach-kin',
        'dien-tro-nhiet.html': 'dien-tro-nhiet',
        'dong-dien-kim-loai.html': 'dong-dien-kim-loai',
        'do-suat-dien-dong.html': 'do-suat-dien-dong',
        'su-chuyen-the.html': 'su-chuyen-the'
    };

    const currentPath = window.location.pathname;
    let currentFile = currentPath.split('/').pop().split('?')[0].toLowerCase();
    if (currentFile && !currentFile.includes('.')) {
        currentFile += '.html';
    }
    
    let currentTopic = topicMap[currentFile];
    if (!currentTopic && window.PhysicsQuizDB) {
        if (currentFile.endsWith('.html')) {
            currentTopic = currentFile.replace('.html', '');
        } else {
            currentTopic = 'dao-dong-dieu-hoa';
        }
    }

    if (!currentTopic || !window.PhysicsQuizDB) {
        console.warn('[Exam System] No topic paired or Database missing.');
        return;
    }

    // --- CSS STYLES ---
    const quizStyle = document.createElement('style');
    quizStyle.innerHTML = `
        #quiz-fab {
            position: fixed; bottom: 24px; right: 24px; z-index: 999998;
            background: linear-gradient(135deg, #0f172a, #1e293b);
            border: 1px solid rgba(16, 185, 129, 0.4);
            box-shadow: 0 4px 20px rgba(16, 185, 129, 0.15), inset 0 0 10px rgba(16, 185, 129, 0.1);
            color: #10b981; border-radius: 9999px; padding: 12px 24px;
            font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px;
            display: flex; align-items: center; gap: 10px; cursor: pointer;
            backdrop-filter: blur(8px); transition: all 0.3s;
        }
        #quiz-fab:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 8px 30px rgba(16, 185, 129, 0.3), inset 0 0 15px rgba(16, 185, 129, 0.2);
        }
        .light #quiz-fab { background: #ffffff; border-color: #10b981; color: #059669; }

        #quiz-modal-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(10px);
            z-index: 1000000; display: flex; align-items: center; justify-content: center;
            opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
        }
        #quiz-modal-overlay.active { opacity: 1; pointer-events: auto; }

        #quiz-modal-content {
            background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(20px);
            border: 1px solid rgba(16, 185, 129, 0.3); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7);
            border-radius: 16px; width: 95%; max-width: 900px; height: 95vh;
            display: flex; flex-direction: column; transform: translateY(30px) scale(0.95);
            transition: all 0.4s; overflow: hidden; position: relative;
        }
        .light #quiz-modal-content { background: rgba(255, 255, 255, 1); border-color: #cbd5e1; color: #0f172a;}
        #quiz-modal-overlay.active #quiz-modal-content { transform: translateY(0) scale(1); }

        .quiz-header {
            padding: 16px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
            background: rgba(0,0,0,0.2);
        }
        .light .quiz-header { border-bottom-color: rgba(0,0,0,0.1); background: rgba(0,0,0,0.02); }

        .quiz-body {
            padding: 24px; overflow-y: auto; flex: 1; scroll-behavior: smooth;
        }
        .quiz-body::-webkit-scrollbar { width: 8px; }
        .quiz-body::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.3); border-radius: 4px; }
        
        /* Exam Elements */
        .part-title {
            font-size: 1.25rem; font-weight: 800; color: #10b981; margin: 30px 0 15px 0; border-bottom: 2px dashed rgba(16,185,129,0.3); padding-bottom: 8px;
        }
        .q-card {
            background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
            border-radius: 12px; padding: 20px; margin-bottom: 24px; transition: 0.3s;
        }
        .light .q-card { background: #f8fafc; border-color: #e2e8f0; }

        .q-title { font-weight: 600; margin-bottom: 16px; color: #f8fafc; font-size: 15px; line-height: 1.6;}
        .light .q-title { color: #1e293b; }

        .mcq-btn {
            display: block; width: 100%; text-align: left; padding: 10px 16px; margin-bottom: 8px;
            border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: inherit; cursor: pointer; transition: 0.2s;
        }
        .mcq-btn:hover { background: rgba(255,255,255,0.1); }
        .light .mcq-btn { background: #ffffff; border-color: #cbd5e1; }
        .light .mcq-btn:hover { background: #f1f5f9; }
        .mcq-btn.selected { border-color: #3b82f6; background: rgba(59, 130, 246, 0.2); }
        .mcq-btn.correct { border-color: #10b981; background: rgba(16, 185, 129, 0.2); }
        .mcq-btn.wrong { border-color: #ef4444; background: rgba(239, 68, 68, 0.2); }

        .tf-row {
            display: flex; justify-content: space-between; align-items: flex-start;
            padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); gap: 16px;
        }
        .light .tf-row { border-bottom-color: rgba(0,0,0,0.05); }
        .tf-controls { display: flex; gap: 8px; flex-shrink: 0; }
        .tf-btn {
            padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer;
            border: 1px solid rgba(255,255,255,0.2); background: transparent; color: inherit; transition: 0.2s;
        }
        .tf-btn.selected-true { background: #10b981; color: white; border-color: #10b981; }
        .tf-btn.selected-false { background: #ef4444; color: white; border-color: #ef4444; }

        .sa-input {
            width: 100%; max-width: 200px; padding: 12px; border-radius: 8px; font-size: 16px; text-align: center;
            background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.2); color: inherit;
            font-family: monospace; outline: none; transition: 0.2s;
        }
        .light .sa-input { background: white; border-color: #cbd5e1; }
        .sa-input:focus { border-color: #10b981; }

        .quiz-footer {
            padding: 16px 24px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex; justify-content: flex-end; align-items: center; gap: 16px; flex-shrink: 0; position: relative; z-index: 10;
        }
        .light .quiz-footer { background: rgba(0,0,0,0.05); border-top-color: rgba(0,0,0,0.1); }
        
        .action-btn {
            padding: 12px 32px; border-radius: 8px; font-weight: bold; cursor: pointer;
            transition: 0.2s; border: none; background: #10b981; color: white; display: flex; align-items: center; gap: 8px;
            font-size: 15px; text-transform: uppercase; letter-spacing: 1px;
        }
        .action-btn:hover { background: #059669; transform: translateY(-2px); box-shadow: 0 4px 15px rgba(16,185,129,0.3); }

        .explanation-box {
            margin-top: 16px; padding: 16px; border-radius: 8px;
            background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3);
            display: none; font-size: 13px; line-height: 1.6; color: #cbd5e1;
        }
        .light .explanation-box { background: #f0fdf4; border-color: #86efac; color: #1e293b; }
        .explanation-box.show { display: block; animation: fadeIn 0.4s ease; }

        /* Score Overlay */
        #score-overlay {
            position: absolute; top:0; left:0; right:0; bottom:0; background: rgba(15,23,42,0.98);
            z-index: 50; display: flex; flex-direction: column; align-items: center; justify-content: center;
            opacity: 0; pointer-events: none; transition: 0.5s; backdrop-filter: blur(10px);
        }
        .light #score-overlay { background: rgba(255,255,255,0.98); }
        #score-overlay.active { opacity: 1; pointer-events: auto; }
        
        .score-circle {
            width: 150px; height: 150px; border-radius: 50%; border: 8px solid #334155;
            display: flex; align-items: center; justify-content: center; font-size: 48px; font-weight: bold;
            font-family: 'Inter', sans-serif; margin-bottom: 20px; transition: border-color 0.5s, box-shadow 0.5s;
        }
        .score-status { font-size: 24px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; letter-spacing:2px; }
        .score-status.bad { color: #ef4444; }
        .score-status.good { color: #3b82f6; }
        .score-status.excellent { color: #fbbf24; text-shadow: 0 0 20px rgba(251, 191, 36, 0.5); }
        
        .review-btn { margin-top: 30px; background: transparent; border: 1px solid #10b981; color: #10b981; padding: 10px 20px; border-radius: 8px; cursor:pointer;}
        .review-btn:hover { background: rgba(16,185,129,0.1); }

        #fireworks-canvas {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 40; pointer-events: none; opacity: 0; transition: 0.5s;
        }

        #quiz-close-btn {
            background: rgba(255,255,255,0.05); border: none; color: #94a3b8; border-radius: 50%;
            width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.2s;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(quizStyle);

    // --- DOM FAB ---
    const fabButton = document.createElement('button');
    fabButton.id = 'quiz-fab';
    fabButton.innerHTML = `<i data-lucide="target"></i> Luyện Tập`;

    const bodyCheck = setInterval(() => {
        if (document.body) {
            clearInterval(bodyCheck);
            document.body.appendChild(fabButton);
            initializeExamUI();
        }
    }, 100);

    let modalOverlay = null;
    let examData = []; // Array of 24 generated questions

    function initializeExamUI() {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'quiz-modal-overlay';
        
        modalOverlay.innerHTML = `
            <div id="quiz-modal-content">
                <canvas id="fireworks-canvas"></canvas>
                <div id="score-overlay" class="text-white light:text-slate-900">
                    <div class="score-status" id="score-status-text">ĐANG CHẤM...</div>
                    <div class="score-circle" id="score-circle-val">0.0</div>
                    <div class="text-slate-400 mb-8" id="score-message">Đang nạp thuật toán...</div>
                    <button class="review-btn" id="review-btn">Xem lại bài giải chi tiết</button>
                    <button class="review-btn" id="retry-btn" style="margin-left:10px; border-color:#3b82f6; color:#3b82f6;">Làm Đề Mới</button>
                </div>

                <div class="quiz-header">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                            <i data-lucide="book-open-check" class="text-emerald-400 w-5 h-5"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold font-tech tracking-wide text-white light:text-slate-900" id="quiz-title">BÀI THI QUY CHUẨN (24 CÂU)</h3>
                            <p class="text-[10px] font-mono text-emerald-400 tracking-wider">Hệ thống đo lường tham số hóa</p>
                        </div>
                    </div>
                    <button id="quiz-close-btn" title="Đóng">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                
                <div class="quiz-body text-white light:text-slate-900" id="quiz-main-body">
                    <!-- Dynamic Exam Content -->
                </div>

                <div class="quiz-footer">
                    <button class="action-btn" id="quiz-regenerate-btn" style="background:transparent; border: 1px solid #3b82f6; color: #3b82f6;"><i data-lucide="refresh-cw"></i> Tạo Đề Mới</button>
                    <button class="action-btn" id="quiz-submit-btn"><i data-lucide="send"></i> Nộp Bài & Chấm Điểm</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);

        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('quiz-close-btn').addEventListener('click', closeQuiz);
        document.getElementById('quiz-submit-btn').addEventListener('click', calculateScore);
        document.getElementById('quiz-regenerate-btn').addEventListener('click', () => {
            // Confirm explicitly to prevent accidental reset, unless it's just practicing
            generateExam();
        });
        document.getElementById('review-btn').addEventListener('click', hideScoreOverlay);
        document.getElementById('retry-btn').addEventListener('click', () => { hideScoreOverlay(); generateExam(); });
        fabButton.addEventListener('click', openQuiz);

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeQuiz();
        });
    }

    const openQuiz = () => {
        modalOverlay.classList.add('active');
        if (examData.length === 0) {
            generateExam();
        }
    };

    const closeQuiz = () => modalOverlay.classList.remove('active');
    const hideScoreOverlay = () => document.getElementById('score-overlay').classList.remove('active');

    const generateExam = () => {
        const types = window.PhysicsQuizDB.getSeeds(currentTopic);
        if(!types || (!types.mcq && !types.tf && !types.sa)) {
             document.getElementById('quiz-main-body').innerHTML = '<p class="text-center text-slate-400 mt-10">Database rỗng. Hãy kiểm tra console.</p>';
             return;
        }

        document.getElementById('quiz-submit-btn').style.display = 'flex';
        document.getElementById('score-overlay').classList.remove('active');
        stopFireworks();

        examData = [];
        
        // Cấu trúc: 16 MCQ, 4 TF, 4 SA
        for(let i=0; i<16; i++) {
            if(types.mcq && types.mcq.length > 0) examData.push(window.PhysicsQuizDB.generateQuestion(currentTopic, 'mcq'));
        }
        for(let i=0; i<4; i++) {
             if(types.tf && types.tf.length > 0) examData.push(window.PhysicsQuizDB.generateQuestion(currentTopic, 'tf'));
        }
        for(let i=0; i<4; i++) {
             if(types.sa && types.sa.length > 0) examData.push(window.PhysicsQuizDB.generateQuestion(currentTopic, 'sa'));
        }

        renderExam();
    };

    const renderExam = () => {
        const container = document.getElementById('quiz-main-body');
        let html = '';
        
        let qIndex = 0;

        // PHẦN 1
        html += '<div class="part-title">PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (16 câu, 4.0 điểm)</div>';
        for(let i=0; i<16 && qIndex < examData.length; i++) {
            const q = examData[qIndex];
            if(q.type !== 'mcq') continue;
            
            html += `<div class="q-card" id="qcard-${qIndex}">`;
            html += `<div class="q-title">Câu ${qIndex + 1}: ${q.question}</div>`;
            html += `<div class="space-y-2">`;
            q.options.forEach((opt, oIdx) => {
                html += `<button class="mcq-btn" data-qidx="${qIndex}" data-oidx="${oIdx}">
                            <span class="font-bold mr-2">${String.fromCharCode(65+oIdx)}.</span> ${opt}
                         </button>`;
            });
            html += `</div>`;
            html += `<div class="explanation-box" id="expl-${qIndex}"><strong class="text-emerald-400">Lời giải:</strong><br/>${q.explanation}</div>`;
            html += `</div>`;
            qIndex++;
        }

        // PHẦN 2
        html += '<div class="part-title">PHẦN II. Câu trắc nghiệm đúng sai (4 câu, 4.0 điểm)</div>';
        for(let i=0; i<4 && qIndex < examData.length; i++) {
            const q = examData[qIndex];
            if(q.type !== 'tf_cluster') continue;
            
            html += `<div class="q-card" id="qcard-${qIndex}">`;
            html += `<div class="q-title text-amber-500">Câu ${qIndex + 1} (Ngữ cảnh): ${q.context}</div>`;
            q.statements.forEach((stmt, sIdx) => {
                html += `
                    <div class="tf-row" data-qidx="${qIndex}" data-sidx="${sIdx}">
                        <div class="flex-1 text-sm font-medium pr-4 mt-2">${String.fromCharCode(97+sIdx)}. ${stmt.text}</div>
                        <div class="tf-controls">
                            <button class="tf-btn tf-btn-true" data-qidx="${qIndex}" data-sidx="${sIdx}">ĐÚNG</button>
                            <button class="tf-btn tf-btn-false" data-qidx="${qIndex}" data-sidx="${sIdx}">SAI</button>
                        </div>
                    </div>
                `;
            });
            html += `<div class="explanation-box" id="expl-${qIndex}"></div>`;
            html += `</div>`;
            qIndex++;
        }

        // PHẦN 3
        html += '<div class="part-title">PHẦN III. Câu trắc nghiệm trả lời ngắn (4 câu, 2.0 điểm)</div>';
        for(let i=0; i<4 && qIndex < examData.length; i++) {
             const q = examData[qIndex];
             if(q.type !== 'sa') continue;

             html += `<div class="q-card" id="qcard-${qIndex}">`;
             html += `<div class="q-title">Câu ${qIndex + 1}: ${q.question}</div>`;
             html += `<div class="flex items-center gap-3">
                         <input type="text" class="sa-input" id="sa-input-${qIndex}" placeholder="Đáp án...">
                         <span class="font-bold">${q.suffix || ''}</span>
                      </div>`;
             html += `<div class="explanation-box" id="expl-${qIndex}"><strong class="text-emerald-400">Lời giải:</strong><br/>${q.explanation}</div>`;
             html += `</div>`;
             qIndex++;
        }

        container.innerHTML = html;

        // Bind interactive events
        const mcqBtns = container.querySelectorAll('.mcq-btn');
        mcqBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const qidx = btn.getAttribute('data-qidx');
                const siblings = container.querySelectorAll(`.mcq-btn[data-qidx="${qidx}"]`);
                siblings.forEach(s => s.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });

        const tfBtns = container.querySelectorAll('.tf-btn');
        tfBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const qidx = btn.getAttribute('data-qidx');
                const sidx = btn.getAttribute('data-sidx');
                const isTrueBtn = btn.classList.contains('tf-btn-true');
                const row = btn.closest('.tf-row');
                if (isTrueBtn) {
                    btn.classList.add('selected-true');
                    row.querySelector('.tf-btn-false').classList.remove('selected-false');
                } else {
                    btn.classList.add('selected-false');
                    row.querySelector('.tf-btn-true').classList.remove('selected-true');
                }
            });
        });

        if (window.MathJax) {
            try { window.MathJax.typesetPromise([container]).catch(e => console.log(e)); } catch(e){}
        }
        
        container.scrollTop = 0;
    };

    // --- GRADING ALGORITHM ---
    const calculateScore = () => {
        let totalScore = 0;

        examData.forEach((q, qIndex) => {
            if (q.type === 'mcq') {
                const selected = document.querySelector(`.mcq-btn[data-qidx="${qIndex}"].selected`);
                let isCorrect = false;
                if(selected) {
                    const oIdx = parseInt(selected.getAttribute('data-oidx'));
                    if(oIdx === q.correctAnswer) { isCorrect = true; totalScore += 0.25; }
                }

                // Show correct/wrong colors
                document.querySelectorAll(`.mcq-btn[data-qidx="${qIndex}"]`).forEach(btn => {
                     btn.style.pointerEvents = 'none'; // lock
                     const oIdx = parseInt(btn.getAttribute('data-oidx'));
                     if(oIdx === q.correctAnswer) btn.classList.add('correct');
                     else if(btn.classList.contains('selected')) btn.classList.add('wrong');
                });
                if(!isCorrect) document.getElementById(`expl-${qIndex}`).classList.add('show');
            } 
            else if (q.type === 'tf_cluster') {
                let errCount = 0;
                let explHtml = '<strong class="text-emerald-400 mb-2 block">Phân tích chi tiết:</strong><ul class="space-y-3 list-disc pl-5">';
                const rows = document.querySelectorAll(`.tf-row[data-qidx="${qIndex}"]`);

                rows.forEach((row, sIdx) => {
                    const trueBtn = row.querySelector('.tf-btn-true');
                    const falseBtn = row.querySelector('.tf-btn-false');
                    const stmt = q.statements[sIdx];

                    let ans = null;
                    if(trueBtn.classList.contains('selected-true')) ans = true;
                    if(falseBtn.classList.contains('selected-false')) ans = false;

                    if(ans !== stmt.isTrue) errCount++;

                    // Color row
                    if(ans === stmt.isTrue) row.style.background = 'rgba(16, 185, 129, 0.1)';
                    else row.style.background = 'rgba(239, 68, 68, 0.1)';

                    if(stmt.isTrue) { trueBtn.style.color = '#10b981'; trueBtn.style.borderColor = '#10b981'; }
                    else { falseBtn.style.color = '#10b981'; falseBtn.style.borderColor = '#10b981'; }

                    trueBtn.style.pointerEvents = 'none'; falseBtn.style.pointerEvents = 'none';

                    explHtml += `<li><strong>Mệnh đề ${String.fromCharCode(97+sIdx)} (${stmt.isTrue?"ĐÚNG":"SAI"}):</strong> ${stmt.explanation}</li>`;
                });
                
                explHtml += '</ul>';
                document.getElementById(`expl-${qIndex}`).innerHTML = explHtml;

                // TF complex scoring
                let clusterScore = 0;
                if(errCount === 0) clusterScore = 1.0;
                else if(errCount === 1) clusterScore = 0.5;
                else if(errCount === 2) clusterScore = 0.25;
                else if(errCount === 3) clusterScore = 0.1;
                else clusterScore = 0.0;
                
                totalScore += clusterScore;
                
                if(errCount > 0) document.getElementById(`expl-${qIndex}`).classList.add('show');
            }
            else if (q.type === 'sa') {
                const input = document.getElementById(`sa-input-${qIndex}`);
                const val = parseFloat(input.value.replace(',', '.'));
                let isCorrect = false;
                if(!isNaN(val) && Math.abs(val - q.correctAnswer) < 0.05) {
                    isCorrect = true;
                    totalScore += 0.5;
                }
                
                input.disabled = true;
                if(isCorrect) input.style.borderColor = '#10b981';
                else {
                    input.style.borderColor = '#ef4444';
                    document.getElementById(`expl-${qIndex}`).classList.add('show');
                }
            }
        });

        document.getElementById('quiz-submit-btn').style.display = 'none';
        showScore(totalScore);
    };

    // --- MULTIMEDIA EFFECTS ---
    let audioCtx = null;
    const initAudio = () => {
        if(!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if(AudioContext) audioCtx = new AudioContext();
        }
    };

    const playWarningSound = () => {
        try {
            initAudio(); if(!audioCtx) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + 0.5);
        } catch(e){}
    };

    const playApplause = () => {
        try {
            initAudio(); if(!audioCtx) return;
            // Create white noise buffer
            const bufferSize = audioCtx.sampleRate * 2.0; // 2 seconds
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
            
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;
            // Bandpass to simulate hands clapping spectrum
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass'; filter.frequency.value = 1000; filter.Q.value = 0.5;
            
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
            // Swell up and down
            gain.gain.exponentialRampToValueAtTime(0.5, audioCtx.currentTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.0);
            
            noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
            noise.start();
        } catch(e){}
    };

    let fwInterval;
    const startFireworks = () => {
        const cvs = document.getElementById('fireworks-canvas');
        cvs.style.opacity = '1';
        cvs.width = cvs.offsetWidth; cvs.height = cvs.offsetHeight;
        const ctx = cvs.getContext('2d');
        let particles = [];
        const colors = ['#fde047', '#38bdf8', '#fb7185', '#34d399', '#c084fc'];
        
        fwInterval = setInterval(() => {
            // Add firework explosion
            const x = Math.random() * cvs.width;
            const y = Math.random() * (cvs.height/2);
            for(let i=0; i<30; i++){
                particles.push({
                    x, y, 
                    vx: (Math.random() - 0.5)*(Math.random()*10),
                    vy: (Math.random() - 0.5)*(Math.random()*10),
                    life: 1.0, color: colors[Math.floor(Math.random()*colors.length)]
                });
            }
        }, 300);

        const loop = () => {
            if(!fwInterval) return; // stopped
            ctx.clearRect(0,0,cvs.width, cvs.height);
            particles.forEach((p, i) => {
                p.x += p.vx; p.y += p.vy; p.vy += 0.1; // gravity
                p.life -= 0.02;
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
                if(p.life <= 0) particles.splice(i, 1);
            });
            requestAnimationFrame(loop);
        };
        loop();
    };
    const stopFireworks = () => {
        if(fwInterval) clearInterval(fwInterval);
        fwInterval = null;
        document.getElementById('fireworks-canvas').style.opacity = '0';
    };

    const showScore = (score) => {
        const overlay = document.getElementById('score-overlay');
        const circle = document.getElementById('score-circle-val');
        const stsText = document.getElementById('score-status-text');
        const msg = document.getElementById('score-message');
        
        let rounded = score.toFixed(2);
        circle.textContent = rounded;

        overlay.classList.add('active');

        if (score < 7.0) {
            circle.style.borderColor = '#ef4444'; circle.style.color = '#ef4444';
            stsText.textContent = 'CHƯA ĐẠT CHUẨN'; stsText.className = 'score-status bad';
            msg.textContent = 'Hãy cố gắng ôn kỹ lý thuyết hơn! Vui lòng xem giải thích các câu sai.';
            playWarningSound();
        } else if (score >= 7.0 && score < 9.0) {
            circle.style.borderColor = '#3b82f6'; circle.style.color = '#3b82f6';
            stsText.textContent = 'CHÚC MỪNG MỨC KHÁ'; stsText.className = 'score-status good';
            msg.textContent = 'Bạn làm khá tốt, hãy xem lại các câu sai để rút kinh nghiệm nhé.';
        } else {
            circle.style.borderColor = '#fbbf24'; circle.style.color = '#fbbf24';
            stsText.textContent = 'XUẤT SẮC!!'; stsText.className = 'score-status excellent';
            msg.textContent = 'Điểm số tuyệt vời! Năng lực vật lý của bạn ở tầng bách khoa.';
            playApplause();
            startFireworks();
        }
    };

})();
