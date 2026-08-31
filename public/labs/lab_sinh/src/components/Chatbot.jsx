import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Chatbot.css';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

function formatBioText(text) {
    if (!text) return '';
    return text
        .replace(/\$\$(.+?)\$\$/gs, '$1')
        .replace(/\$(.+?)\$/g, '$1')
        .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
        .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
        .replace(/\^2/g, '²')
        .replace(/\^3/g, '³')
        .replace(/\\times/g, '×')
        .replace(/\\cdot/g, '·')
        .replace(/\\pi/g, 'π')
        .replace(/\$/g, '')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^[\-\*•]\s+(.+)$/gm, '<li style="margin:2px 0;">$1</li>')
        .replace(/\n\n/g, '<br/><br/>')
        .replace(/\n/g, '<br/>');
}

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(() => {
        return localStorage.getItem('chatbot_isOpen') === 'true';
    });
    
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const [sessions, setSessions] = useState(() => {
        try {
            const saved = localStorage.getItem('bio_ai_sessions');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [currentSessionId, setCurrentSessionId] = useState(() => 'session_' + Date.now());

    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Xin chào! Tôi là Trợ lý AI Sinh học. Tôi đã ghi nhớ tiến trình học tập của bạn ở các phiên trước. Hôm nay bạn cần khám phá kiến thức nào?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const startNewSession = useCallback(() => {
        const newId = 'session_' + Date.now();
        setCurrentSessionId(newId);
        setMessages([
            { sender: 'bot', text: 'Xin chào! Tôi là Trợ lý AI Sinh học. Tôi đã ghi nhớ lịch sử học tập của bạn. Hãy bắt đầu câu hỏi mới nhé!' }
        ]);
        setIsDrawerOpen(false);
    }, []);

    const saveCurrentSession = useCallback((newMsgs) => {
        const userMsgs = newMsgs.filter(m => m.sender === 'user');
        if (userMsgs.length === 0) return;

        const title = userMsgs[0].text.substring(0, 30) + (userMsgs[0].text.length > 30 ? '...' : '');
        const dateStr = new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

        setSessions(prev => {
            const existingIdx = prev.findIndex(s => s.id === currentSessionId);
            const sessionObj = {
                id: currentSessionId,
                title,
                date: dateStr,
                messages: newMsgs,
            };
            let updated;
            if (existingIdx >= 0) {
                updated = [...prev];
                updated[existingIdx] = sessionObj;
            } else {
                updated = [sessionObj, ...prev];
            }
            try {
                localStorage.setItem('bio_ai_sessions', JSON.stringify(updated.slice(0, 20)));
            } catch {}
            return updated.slice(0, 20);
        });
    }, [currentSessionId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        localStorage.setItem('chatbot_isOpen', isOpen);
        if (isOpen) {
            setTimeout(scrollToBottom, 100);
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = input.trim();
        const updatedMsgs = [...messages, { sender: 'user', text: userMessage }];
        setInput('');
        setMessages(updatedMsgs);
        saveCurrentSession(updatedMsgs);
        setIsLoading(true);

        const pastTopics = sessions.flatMap(s => s.messages).filter(m => m.sender === 'user').map(m => m.text.substring(0, 30)).slice(0, 6);
        const memoryContext = pastTopics.length > 0 ? `\n\n[BỘ NHỚ HỌC HỎI CỦA AI TỪ CÁC PHIÊN TRƯỚC: Học sinh đã hỏi các câu hỏi về: ${pastTopics.join('; ')}. Hãy ghi nhớ để hướng dẫn tiếp nối.]` : '';

        let success = false;
        let errorMsg = 'Không thể kết nối đến máy chủ AI.';

        for (const model of MODELS) {
            if (success) break;
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
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
                                parts: [{ text: `Bạn là Chuyên gia AI Sinh Học THPT.
QUY TẮC BẮT BUỘC:
1. TRẢ LỜI CỰC KỲ NGẮN GỌN & SÚC TÍCH: Chỉ từ 2 - 4 dòng (tối đa 60 từ). Đi thẳng vào đáp số, công thức hoặc khái niệm cốt lõi. Tuyệt đối KHÔNG trả lời dài dòng lan man.
2. CHUẨN KÝ HIỆU SINH HỌC THPT VIỆT NAM:
   - Sử dụng kí hiệu Nuclêôtit: A, T, G, X (dùng X thay cho C theo chuẩn SGK Việt Nam).
   - Nguyên tắc bổ sung: A = T, G ≡ X (hoặc G = X).
   - Kí hiệu gen, alen, ADN, mARN, tARN, rARN, 2n, n, P, F1, F2 chuẩn xác.
3. Trình bày công thức sạch đẹp, rõ ràng.${memoryContext}` }]
                            },
                            generationConfig: {
                                maxOutputTokens: 250,
                                temperature: 0.2
                            }
                        })
                    }
                );

                const data = await response.json();
                if (data && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                    let botReply = data.candidates[0].content.parts[0].text.trim();
                    const finalMsgs = [...updatedMsgs, { sender: 'bot', text: botReply }];
                    setMessages(finalMsgs);
                    saveCurrentSession(finalMsgs);
                    success = true;
                } else if (data.error) {
                    errorMsg = `Lỗi (${model}): ${data.error.message}`;
                }
            } catch (error) {
                errorMsg = `Lỗi kết nối (${model}): ${error.message}`;
            }
        }

        if (!success) {
            const errMsgs = [...updatedMsgs, { sender: 'bot', text: `Rất tiếc, tôi gặp lỗi khi xử lý yêu cầu của bạn: ${errorMsg}` }];
            setMessages(errMsgs);
            saveCurrentSession(errMsgs);
        }

        setIsLoading(false);
    };

    return (
        <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
            {!isOpen && (
                <button className="chatbot-toggle-btn" onClick={() => setIsOpen(true)}>
                    <span className="chatbot-icon">💬</span>
                    <span className="chatbot-badge">AI</span>
                </button>
            )}

            {isOpen && (
                <div className="chatbot-window" style={{ position: 'relative' }}>
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

                    <div className="chatbot-header">
                        <div className="chatbot-title">
                            <span className="chatbot-avatar">🧬</span>
                            <div>
                                <h4>Trợ lý Sinh Học</h4>
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
                                <div className="message-bubble" dangerouslySetInnerHTML={{ __html: formatBioText(msg.text) }} />
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

                    <div className="chatbot-input-area">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Hỏi đáp về sinh học..."
                            disabled={isLoading}
                        />
                        <button onClick={handleSend} disabled={isLoading || !input.trim()}>
                            Gửi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
