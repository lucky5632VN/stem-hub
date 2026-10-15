import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Chatbot.css';

// ─── Draggable Hook ──────────────────────────────────────────────────────────
function useDraggable(defaultPos) {
    const [pos, setPos] = useState(defaultPos);
    const dragging = useRef(false);
    const startMouse = useRef({ x: 0, y: 0 });
    const startPos = useRef({ x: 0, y: 0 });

    const onMouseDown = useCallback((e) => {
        if (e.button !== 0) return;
        dragging.current = true;
        startMouse.current = { x: e.clientX, y: e.clientY };
        startPos.current = { x: pos.x, y: pos.y };
        e.preventDefault();
    }, [pos]);

    useEffect(() => {
        const onMove = (e) => {
            if (!dragging.current) return;
            const dx = e.clientX - startMouse.current.x;
            const dy = e.clientY - startMouse.current.y;
            setPos({
                x: Math.max(0, Math.min(window.innerWidth - 70, startPos.current.x + dx)),
                y: Math.max(0, Math.min(window.innerHeight - 70, startPos.current.y + dy)),
            });
        };
        const onUp = () => { dragging.current = false; };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        return () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
    }, []);

    return { pos, onMouseDown };
}

const BIOLOGY_API_KEYS = [
    "AQ.Ab8RN6J11YpEGf4L9cmBzNkXmFSeKG1c97JlM8ympwksIjmJSQ",
    "AQ.Ab8RN6KGyO7LdzYEgcDARmK334qSXG689ngaloM9-Mbl3g5VUg",
    "AQ.Ab8RN6L5ny1C1LsZNy8FdxzzqK0LYub9mSFVvfnprdwduJx8pQ",
    "AQ.Ab8RN6LgzhQhuXeK0P69gw9u_kyxv8jlWTsII--OlfbGDGMddg"
];
const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest', 'gemini-2.0-flash'];

function formatBioText(text) {
    if (!text) return '';
    if (window.StemLabAIBridge && typeof window.StemLabAIBridge.formatAIFormulaText === 'function') {
        return window.StemLabAIBridge.formatAIFormulaText(text);
    }
    return text
        .replace(/\$\$(.+?)\$\$/gs, '<div style="margin:4px 0;text-align:center;font-weight:bold;color:#38bdf8;">$1</div>')
        .replace(/\$(.+?)\$/g, '<span style="font-weight:bold;color:#38bdf8;">$1</span>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*/g, '')
        .replace(/^[\-\*•]\s+(.+)$/gm, '<li style="margin:2px 0;">$1</li>')
        .replace(/\n\n/g, '<br/><br/>')
        .replace(/\n/g, '<br/>');
}

function isBioAIError(text, status) {
    if (status !== undefined && status !== null && (Number(status) < 200 || Number(status) >= 300)) return true;
    if (!text || typeof text !== 'string') return true;
    const t = text.toLowerCase().trim();
    if (t.length < 5) return true;
    const errorKeywords = [
        'sự cố', 'rất tiếc', 'error', 'gián đoạn', 'kết nối', 'không thể kết nối',
        'vui lòng thử lại', 'vui lòng hỏi lại', 'lỗi khi xử lý', 'gemini api error',
        'thiếu api key', 'failed to fetch', 'máy chủ ai', 'tất cả mô hình gemini đều bận',
        'user location is not supported', 'trợ lý ngoại tuyến', '400 bad request',
        '500 internal', 'http 500', 'http 400', 'http 429', 'http 503',
        'edge_tutor_html_error', 'quota', 'resourceexhausted', 'rate limit'
    ];
    return errorKeywords.some(kw => t.includes(kw));
}

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(() => {
        return localStorage.getItem('chatbot_isOpen') === 'true';
    });
    
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const [sessions, setSessions] = useState(() => {
        try {
            const saved = localStorage.getItem('bio_ai_sessions');
            if (!saved) return [];
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                return parsed.filter(s => {
                    if (!s || !Array.isArray(s.messages)) return false;
                    const last = s.messages[s.messages.length - 1];
                    return !(last && last.sender === 'bot' && isBioAIError(last.text));
                });
            }
            return [];
        } catch {
            return [];
        }
    });

    const [currentSessionId, setCurrentSessionId] = useState(() => {
        const savedCurrent = localStorage.getItem('bio_ai_current_session_id');
        return savedCurrent || 'bio_session_' + Date.now();
    });

    const [messages, setMessages] = useState(() => {
        try {
            const saved = localStorage.getItem('bio_ai_sessions');
            if (saved) {
                const parsed = JSON.parse(saved);
                const curr = parsed.find(s => s.id === (localStorage.getItem('bio_ai_current_session_id') || ''));
                if (curr && curr.messages && curr.messages.length > 0) {
                    const last = curr.messages[curr.messages.length - 1];
                    if (!(last && last.sender === 'bot' && isBioAIError(last.text))) {
                        return curr.messages;
                    }
                }
            }
        } catch (_) {}
        return [
            {
                sender: 'bot',
                text: 'Hệ thống hỗ trợ học tập & tra cứu chuyên sâu Sinh Học THPT. Đặt câu hỏi để nhận lời giải súc tích kèm công thức chuẩn xác.'
            }
        ];
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [attachedImage, setAttachedImage] = useState(null);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const isDragMove = useRef(false);

    // Xử lý dán ảnh từ Clipboard (Ctrl+V) vào Trợ lý Sinh Học
    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                const file = items[i].getAsFile();
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setAttachedImage(reader.result);
                    reader.readAsDataURL(file);
                    e.preventDefault();
                    return;
                }
            }
        }
    };

    // Draggable positions – stored in viewport coords (from top-left)
    const [btnPos, setBtnPos] = useState(() => {
        try { const s = localStorage.getItem('bio_btn_pos'); return s ? JSON.parse(s) : null; } catch { return null; }
    });
    const [winPos, setWinPos] = useState(() => {
        try { const s = localStorage.getItem('bio_win_pos'); return s ? JSON.parse(s) : null; } catch { return null; }
    });
    const btnDrag = useRef({ active: false, sx: 0, sy: 0, px: 0, py: 0 });
    const winDrag = useRef({ active: false, sx: 0, sy: 0, px: 0, py: 0 });

    const defaultBtnRight = 30, defaultBtnBottom = 30;

    const scrollToBottom = () => {};

    const handleNewChat = () => {
        const newId = 'bio_session_' + Date.now();
        setCurrentSessionId(newId);
        const initMsgs = [
            {
                sender: 'bot',
                text: 'Phiên tra cứu mới đã sẵn sàng. Nhập câu hỏi hoặc bài tập Sinh học để nhận lời giải tóm tắt.'
            }
        ];
        setMessages(initMsgs);
        saveCurrentSession(initMsgs);
        setIsDrawerOpen(false);
    };

    const startNewSession = handleNewChat;

    const saveCurrentSession = useCallback((newMsgs) => {
        if (!newMsgs || !Array.isArray(newMsgs)) return;
        const lastMsg = newMsgs[newMsgs.length - 1];
        if (lastMsg && lastMsg.sender === 'bot' && isBioAIError(lastMsg.text)) {
            console.warn('[Bio AI] TUYỆT ĐỐI KHÔNG LƯU CACHE vì phản hồi là thông báo lỗi:', (lastMsg.text || '').substring(0, 50));
            return;
        }

        setSessions(prev => {
            const idx = prev.findIndex(s => s.id === currentSessionId);
            let updated;
            const firstUserMsg = newMsgs.find(m => m.sender === 'user');
            const title = firstUserMsg ? firstUserMsg.text.substring(0, 30) + '...' : 'Hội thoại Sinh học';
            const now = new Date().toLocaleDateString('vi-VN');

            if (idx >= 0) {
                updated = [...prev];
                updated[idx] = { ...updated[idx], messages: newMsgs, date: now };
            } else {
                updated = [{ id: currentSessionId, title, date: now, messages: newMsgs }, ...prev];
            }
            try {
                localStorage.setItem('bio_ai_sessions', JSON.stringify(updated.slice(0, 20)));
                localStorage.setItem('bio_ai_current_session_id', currentSessionId);
            } catch (_) {}
            return updated.slice(0, 20);
        });
    }, [currentSessionId]);

    // Auto-scroll disabled per user preference
    // useEffect(() => { scrollToBottom(); }, [messages]);

    useEffect(() => {
        localStorage.setItem('chatbot_isOpen', isOpen);
    }, [isOpen]);

    // ── Drag logic for the toggle button ──────────────────────────────────────
    const startBtnDrag = useCallback((e) => {
        if (e.button !== 0) return;
        isDragMove.current = false;
        const el = e.currentTarget.parentElement;
        const rect = el.getBoundingClientRect();
        btnDrag.current = { active: true, sx: e.clientX, sy: e.clientY, px: rect.left, py: rect.top };
        e.preventDefault();
    }, []);

    useEffect(() => {
        const onMove = (e) => {
            if (!btnDrag.current.active) return;
            const dx = e.clientX - btnDrag.current.sx;
            const dy = e.clientY - btnDrag.current.sy;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) isDragMove.current = true;
            const nx = Math.max(0, Math.min(window.innerWidth - 70, btnDrag.current.px + dx));
            const ny = Math.max(0, Math.min(window.innerHeight - 70, btnDrag.current.py + dy));
            setBtnPos({ x: nx, y: ny });
        };
        const onUp = () => {
            if (btnDrag.current.active) {
                btnDrag.current.active = false;
                if (btnPos) localStorage.setItem('bio_btn_pos', JSON.stringify(btnPos));
            }
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        return () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
    }, [btnPos]);

    // ── Drag logic for the chat window ────────────────────────────────────────
    const startWinDrag = useCallback((e) => {
        if (e.button !== 0) return;
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
        const el = e.currentTarget.closest('.chatbot-window');
        if (!el) return;
        const rect = el.getBoundingClientRect();
        winDrag.current = { active: true, sx: e.clientX, sy: e.clientY, px: rect.left, py: rect.top };
        e.preventDefault();
    }, []);

    useEffect(() => {
        const onMove = (e) => {
            if (!winDrag.current.active) return;
            const dx = e.clientX - winDrag.current.sx;
            const dy = e.clientY - winDrag.current.sy;
            const nx = Math.max(0, Math.min(window.innerWidth - 385, winDrag.current.px + dx));
            const ny = Math.max(0, Math.min(window.innerHeight - 610, winDrag.current.py + dy));
            setWinPos({ x: nx, y: ny });
        };
        const onUp = () => {
            if (winDrag.current.active) {
                winDrag.current.active = false;
                if (winPos) localStorage.setItem('bio_win_pos', JSON.stringify(winPos));
            }
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        return () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
    }, [winPos]);

    // ⚡ HIỆU ỨNG GÕ CHỮ TỪ TỪ GIỐNG NOVA AI (Word-by-Word Streaming Effect ~16ms/từ, không tự động cuộn)
    const streamBotReply = async (baseMsgs, fullText, isSuccess = true) => {
        setIsLoading(false);
        const botMsgId = 'bot_' + Date.now();
        const initialBotMsg = {
            sender: 'bot',
            text: '',
            id: botMsgId
        };
        setMessages([...baseMsgs, initialBotMsg]);

        const words = (fullText || '').split(' ');
        let currentStreamText = '';
        const delay = Math.max(12, Math.min(22, Math.floor(1600 / Math.max(1, words.length))));

        for (let i = 0; i < words.length; i++) {
            currentStreamText += (i === 0 ? '' : ' ') + words[i];
            const updatedText = currentStreamText;
            setMessages(prev => {
                const next = [...prev];
                if (next.length > 0) {
                    next[next.length - 1] = { ...next[next.length - 1], text: updatedText };
                }
                return next;
            });
            await new Promise(r => setTimeout(r, delay));
        }

        const finalMsgs = [...baseMsgs, { sender: 'bot', text: currentStreamText }];
        if (isSuccess && !isBioAIError(currentStreamText, 200)) {
            saveCurrentSession(finalMsgs);
        }
        return currentStreamText;
    };

    const handleSend = async () => {
        if ((!input.trim() && !attachedImage) || isLoading) return;

        const currentImg = attachedImage;
        setAttachedImage(null);
        const userMessage = input.trim() || 'Hãy phân tích hình ảnh này và giải đáp chi tiết kiến thức Sinh học giúp em.';
        const updatedMsgs = [...messages, { sender: 'user', text: userMessage, image: currentImg }];
        setInput('');
        setMessages(updatedMsgs);
        saveCurrentSession(updatedMsgs);
        setIsLoading(true);

        const pastTopics = sessions.flatMap(s => s.messages).filter(m => m.sender === 'user').map(m => m.text.substring(0, 30)).slice(0, 6);
        const memoryContext = pastTopics.length > 0 ? `\n\n[BỘ NHỚ HỌC HỎI CỦA AI TỪ CÁC PHIÊN TRƯỚC: Học sinh đã hỏi các câu hỏi về: ${pastTopics.join('; ')}. Hãy ghi nhớ để hướng dẫn tiếp nối.]` : '';

        // ⚡ BƯỚC 0: KIỂM TRA RANH GIỚI MÔN HỌC (SUBJECT BOUNDARY GUARD - CHỈ KHI KHÔNG CÓ ẢNH)
        if (!currentImg && window.StemLabAIBridge && typeof window.StemLabAIBridge.checkSubjectBoundary === 'function') {
            const guard = window.StemLabAIBridge.checkSubjectBoundary(userMessage, 'sinh');
            if (!guard.allowed) {
                const botReply = guard.refusal;
                await streamBotReply(updatedMsgs, botReply, true);
                window.StemLabAIBridge.logLabReasoning({
                    query: userMessage,
                    subject: 'SINH',
                    intent: 'subject_boundary_guard',
                    aiResponseText: botReply,
                    isCacheHit: true,
                    labTitle: 'Lab Sinh Học THPT'
                });
                return;
            }
        }

        // ⚡ BƯỚC 1: KIỂM TRA BỘ NHỚ AI TỰ HỌC (CACHE HIT) GIỐNG TRỢ LÝ NOVA (CHỈ KHI KHÔNG CÓ ẢNH)
        if (!currentImg && window.StemLabAIBridge && typeof window.StemLabAIBridge.checkLabLearnedCache === 'function') {
            try {
                const cacheRes = await window.StemLabAIBridge.checkLabLearnedCache(userMessage, 'sinh', 0.92);
                if (cacheRes && cacheRes.hit) {
                    const botReply = cacheRes.answer;
                    await streamBotReply(updatedMsgs, botReply, true);

                    window.StemLabAIBridge.logLabReasoning({
                        query: userMessage,
                        subject: 'SINH',
                        aiResponseText: cacheRes.answer,
                        isCacheHit: true,
                        labTitle: 'Lab Sinh Học THPT',
                        score: cacheRes.score
                    });
                    return;
                }
            } catch (cErr) {
                console.warn('[Lab Sinh AI] Cache check error:', cErr);
            }
        }

        let success = false;
        let errorMsg = 'Không thể kết nối đến máy chủ AI.';
        let generatedReply = '';

        // Zero Exposure: Ưu tiên định tuyến qua Next.js Gateway nội bộ (/api/ai/chat)
        try {
            const gwRes = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    systemInstruction: `Bạn là Chuyên gia Sinh Học THPT của hệ thống STEM HUB.\n\nNHIỆM VỤ: Chuyên sâu vào môn SINH HỌC THPT. Trả lời tóm tắt, súc tích dưới 80 từ, công thức chuẩn LaTeX $...$ hoặc $$...$$.`,
                    temperature: 0.3,
                    maxOutputTokens: 1200,
                    imageBase64: currentImg || undefined
                })
            });
            if (gwRes.ok) {
                const gwData = await gwRes.json();
                if (gwData.text) {
                    generatedReply = gwData.text.trim();
                    await streamBotReply(updatedMsgs, generatedReply, true);
                    success = true;
                }
            }
        } catch (gwErr) {
            console.warn('[Lab Sinh AI] Local gateway fallback:', gwErr.message);
        }

        const totalTries = BIOLOGY_API_KEYS.length * MODELS.length;
        for (let tryCount = 0; tryCount < totalTries; tryCount++) {
            if (success) break;
            const activeKey = BIOLOGY_API_KEYS[(bioKeyIdx + tryCount) % BIOLOGY_API_KEYS.length];
            const model = MODELS[Math.floor(tryCount / BIOLOGY_API_KEYS.length) % MODELS.length];
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            contents: [{
                                role: 'user',
                                parts: [{ text: userMessage }]
                            }],
                            systemInstruction: {
                                parts: [{ text: `Bạn là Chuyên gia Sinh Học THPT của hệ thống STEM HUB.

NHIỆM VỤ:
Chuyên sâu vào môn SINH HỌC THPT: Di truyền học phân tử (ADN, ARN, nhân đôi, phiên mã, dịch mã), quy luật di truyền Menđen, liên kết và hoán vị gen, di truyền liên kết giới tính, di truyền quần thể, đột biến gen và NST, công nghệ tế bào, công nghệ gene, tiến hóa, sinh thái học, sinh lý thực vật và động vật.

QUY TẮC BIÊN GIỚI MÔN HỌC:
- Nếu hỏi môn khác (Hóa, Lý, Toán...), từ chối ngắn gọn: "Vui lòng chuyển sang phòng thí nghiệm chuyên ngành để tra cứu kiến thức môn học tương ứng!"

QUY TẮC PHẢN HỒI BẮT BUỘC - TUYỆT ĐỐI TUÂN THỦ:
1. TRẢ LỜI TÓM TẮT, SÚC TÍCH (DƯỚI 80 TỪ): Đi thẳng vào trọng tâm cốt lõi. Tuyệt đối KHÔNG giải thích dài dòng lan man.
2. TUYỆT ĐỐI KHÔNG CHÀO HỎI, KHÔNG XƯNG DANH AI: Không nói "Chào bạn...", "Tôi là...", không có lời kết sáo rỗng ("Chúc bạn học tốt...", "Nếu còn thắc mắc..."). Xóa bỏ hoàn toàn mọi dấu vết robot, trả lời trực diện như một chuyên gia bách khoa.
3. BẮT BUỘC ĐƯA CÔNG THỨC CHUẨN LATEX: Nếu câu hỏi có liên quan đến công thức hay tỉ lệ (ADN, ARN, liên kết hidro, chu kỳ xoắn, số nu, sơ đồ lai, di truyền quần thể), BẮT BUỘC PHẢI ĐƯA CÔNG THỨC VÀO và viết CHUẨN LATEX bằng $...$ hoặc $$...$$.
   Ví dụ: $L = \\frac{N}{2} \\times 3{,}4\\text{ \\AA}$, $N = 2A + 2G$, $H = 2A + 3G$, $C = \\frac{N}{20}$, $M = N \\times 300\\text{ đvC}$, $\\text{P}: \\text{Aa} \\times \\text{Aa} \\rightarrow \\text{F}_1: 1\\text{AA} : 2\\text{Aa} : 1\\text{aa}$, $p^2 + 2pq + q^2 = 1$.
4. CHUẨN KÝ HIỆU SINH HỌC THPT VIỆT NAM:
   - Sử dụng kí hiệu Nuclêôtit: A, T, G, X (dùng X thay cho C theo SGK Việt Nam).
   - Nguyên tắc bổ sung: A = T, G ≡ X.
5. KHÔNG ĐỂ DẤU SAO THÔ: Không để lại các dấu sao lẻ loi (*) trong câu trả lời.${memoryContext}` }]
                            },
                            generationConfig: {
                                maxOutputTokens: 1200,
                                temperature: 0.3
                            }
                        })
                    }
                );

                const data = await response.json();
                if (data && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                    let botReply = data.candidates[0].content.parts[0].text.trim();
                    generatedReply = botReply;
                    await streamBotReply(updatedMsgs, botReply, true);
                    bioKeyIdx = (bioKeyIdx + 1) % BIOLOGY_API_KEYS.length;
                    success = true;
                } else if (data.error) {
                    errorMsg = `Lỗi (${model}): ${data.error.message}`;
                    console.warn(`[Bio AI] Model ${model} Key ${activeKey.substring(0, 8)}... status ${response.status}:`, data.error.message);
                }
            } catch (error) {
                errorMsg = `Lỗi kết nối (${model}): ${error.message}`;
                console.warn(`[Bio AI] Ngoại lệ trên model ${model}:`, error.message);
            }
        }

        if (!success) {
            await streamBotReply(updatedMsgs, `Rất tiếc, tôi gặp lỗi khi xử lý yêu cầu của bạn: ${errorMsg}`, false);
            console.warn('[Bio AI] Chỉ hiển thị thông báo lỗi tạm thời trên UI, TUYỆT ĐỐI KHÔNG LƯU CACHE.');
        }

        // ⚡ BƯỚC 2: TỰ ĐỘNG GHI LƯU VÀO TRI THỨC TOÀN HỆ THỐNG & LOG AUDIT GIỐNG NOVA (CHỈ KHI THÀNH CÔNG VÀ KHÔNG CHỨA TỪ KHÓA LỖI)
        if (success && generatedReply && !isBioAIError(generatedReply, 200) && window.StemLabAIBridge && typeof window.StemLabAIBridge.saveLabLearnedAnswer === 'function') {
            window.StemLabAIBridge.saveLabLearnedAnswer(userMessage, generatedReply, 'sinh', 'Lab Sinh Học THPT');
            window.StemLabAIBridge.logLabReasoning({
                query: userMessage,
                subject: 'SINH',
                aiResponseText: generatedReply,
                isCacheHit: false,
                labTitle: 'Lab Sinh Học THPT'
            });
        }

        setIsLoading(false);
    };

    // Compute inline styles for btn and window positions
    const btnStyle = btnPos
        ? { position: 'fixed', left: btnPos.x, top: btnPos.y, right: 'auto', bottom: 'auto' }
        : { position: 'fixed', right: defaultBtnRight, bottom: defaultBtnBottom };
    const winStyle = winPos
        ? { position: 'fixed', left: winPos.x, top: winPos.y, right: 'auto', bottom: 'auto' }
        : { position: 'fixed', right: 30, bottom: 110 };

    return (
        <div className={`chatbot-container ${isOpen ? 'open' : ''}`} style={{ position: 'static' }}>
            {!isOpen && (
                <div style={{ ...btnStyle, zIndex: 9999 }}>
                    <button
                        className="chatbot-toggle-btn"
                        onMouseDown={startBtnDrag}
                        onClick={() => { if (!isDragMove.current) setIsOpen(true); }}
                        title="Trợ lý AI Sinh học – kéo để di chuyển"
                    >
                        <span className="chatbot-icon">🧬</span>
                        <span className="chatbot-badge">AI</span>
                    </button>
                </div>
            )}

            {isOpen && (
                <div className="chatbot-window" style={{ ...winStyle, zIndex: 9999, position: 'fixed' }}>
                    {/* Drawer Overlay for History */}
                    {isDrawerOpen && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            background: 'rgba(15, 23, 42, 0.98)', backdropFilter: 'blur(20px)',
                            zIndex: 100, display: 'flex', flexDirection: 'column', padding: '16px',
                            boxSizing: 'border-box', color: '#fff'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ fontWeight: 'bold', color: '#818cf8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    📜 LỊCH SỬ & HỌC HỎI
                                </div>
                                <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px' }}>✖</button>
                            </div>
                            <button
                                onClick={startNewSession}
                                style={{
                                    width: '100%', padding: '8px', borderRadius: '8px',
                                    background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)',
                                    color: '#818cf8', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', marginBottom: '12px'
                                }}
                            >
                                ➕ Tạo đoạn chat mới
                            </button>
                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {sessions.length === 0 ? (
                                    <div style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>Chưa có hội thoại nào được lưu.</div>
                                ) : (
                                    sessions.map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => {
                                                setCurrentSessionId(s.id);
                                                setMessages(s.messages);
                                                setIsDrawerOpen(false);
                                            }}
                                            style={{
                                                background: s.id === currentSessionId ? 'rgba(99, 102, 241, 0.25)' : 'rgba(30, 41, 59, 0.7)',
                                                border: `1px solid ${s.id === currentSessionId ? '#818cf8' : 'rgba(255,255,255,0.1)'}`,
                                                borderRadius: '8px', padding: '8px 12px', cursor: 'pointer',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}
                                        >
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <div style={{ fontSize: '12px', color: '#f8fafc', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title || 'Hội thoại mới'}</div>
                                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>{s.date} • {s.messages.filter(m => m.sender === 'user').length} câu hỏi</div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const filtered = sessions.filter(x => x.id !== s.id);
                                                    setSessions(filtered);
                                                    localStorage.setItem('bio_ai_sessions', JSON.stringify(filtered));
                                                    if (currentSessionId === s.id) startNewSession();
                                                }}
                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', opacity: 0.7, cursor: 'pointer', padding: '4px' }}
                                            >
                                                ✖
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    <div className="chatbot-header" onMouseDown={startWinDrag} style={{ cursor: 'grab' }}>
                        <div className="chatbot-title">
                            <span className="chatbot-avatar">🧬</span>
                            <div>
                                <h4>Trợ lý Sinh Học</h4>
                                <p style={{ margin: 0, fontSize: 10, opacity: 0.7 }}>🔬 Sinh học THPT · Kéo để di chuyển</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button
                                title="Tạo đoạn chat mới"
                                onClick={startNewSession}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    border: '1px solid rgba(255, 255, 255, 0.25)',
                                    color: '#fff',
                                    borderRadius: '6px',
                                    width: '28px',
                                    height: '28px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                            </button>
                            <button
                                title="Lịch sử & Học hỏi"
                                onClick={() => setIsDrawerOpen(true)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    border: '1px solid rgba(255, 255, 255, 0.25)',
                                    color: '#fff',
                                    borderRadius: '6px',
                                    width: '28px',
                                    height: '28px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                            <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>✖</button>
                        </div>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`chatbot-message ${msg.sender}`}>
                                <div className="message-bubble">
                                    {msg.image && (
                                        <div style={{ marginBottom: 6, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)', maxWidth: 200, background: '#000' }}>
                                            <img src={msg.image} alt="Ảnh đính kèm" style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />
                                        </div>
                                    )}
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: msg.sender === 'user'
                                                ? (window.StemLabAIBridge && typeof window.StemLabAIBridge.formatUserMessage === 'function'
                                                    ? window.StemLabAIBridge.formatUserMessage(msg.text || msg.content || '')
                                                    : (msg.text || msg.content || ''))
                                                : formatBioText(msg.text || msg.content || '')
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="chatbot-message bot">
                                <div className="message-bubble typing-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Preview ảnh đính kèm (Paste qua Ctrl+V hoặc Tải lên) */}
                    {attachedImage && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(15,23,42,0.9)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <img src={attachedImage} alt="Preview" style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 6, border: '1px solid #818cf8', background: '#000' }} />
                            <span style={{ flex: 1, fontSize: 11, color: '#818cf8', fontWeight: 600 }}>Đã nhận diện ảnh (Ctrl+V)</span>
                            <button type="button" onClick={() => setAttachedImage(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}>✕</button>
                        </div>
                    )}

                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setAttachedImage(reader.result);
                                reader.readAsDataURL(file);
                            }
                            e.target.value = '';
                        }} 
                    />

                    <div className="chatbot-input-area" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()} 
                            title="Tải ảnh lên (Ctrl+V)" 
                            style={{ 
                                background: attachedImage ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)', 
                                border: `1px solid ${attachedImage ? '#818cf8' : 'rgba(255,255,255,0.15)'}`, 
                                borderRadius: 8, padding: '6px 10px', color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center' 
                            }}
                        >
                            📷
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            onPaste={handlePaste}
                            placeholder={attachedImage ? "Thêm câu hỏi hoặc Enter gửi ảnh..." : "Hỏi đáp về sinh học, dán ảnh Ctrl+V..."}
                            disabled={isLoading}
                            style={{ flex: 1 }}
                        />
                        <button onClick={handleSend} disabled={isLoading || (!input.trim() && !attachedImage)}>
                            Gửi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
