import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(() => {
        return localStorage.getItem('chatbot_isOpen') === 'true';
    });
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('chatbot_messages');
        return saved ? JSON.parse(saved) : [
            { sender: 'bot', text: 'Xin chào! Tôi là trợ lý AI sinh học. Tôi có thể giúp gì cho bạn hôm nay?' }
        ];
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        localStorage.setItem('chatbot_messages', JSON.stringify(messages));
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
        setInput('');
        setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
        setIsLoading(true);

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
                                parts: [{ text: "Bạn là một chuyên gia Sinh học. Hãy trả lời bằng tiếng Việt thật ngắn gọn, đi thẳng vào trọng tâm câu hỏi. Tuyệt đối KHÔNG sử dụng các kí hiệu markdown đặc biệt như **, *, _, #, `, v.v. Chỉ dùng chữ và số thuần túy." }]
                            }
                        })
                    }
                );

                const data = await response.json();
                if (data && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                    let botReply = data.candidates[0].content.parts[0].text;
                    // Loại bỏ các ký tự markdown
                    botReply = botReply.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#/g, '').replace(/`/g, '');
                    setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
                    success = true;
                } else if (data.error) {
                    errorMsg = `Lỗi (${model}): ${data.error.message}`;
                }
            } catch (error) {
                errorMsg = `Lỗi kết nối (${model}): ${error.message}`;
            }
        }

        if (!success) {
            setMessages(prev => [...prev, { sender: 'bot', text: `Rất tiếc, tôi gặp lỗi khi xử lý yêu cầu của bạn: ${errorMsg}` }]);
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
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <div className="chatbot-title">
                            <span className="chatbot-avatar">🧬</span>
                            <div>
                                <h4>Trợ lý Sinh Học</h4>
                                <p>Gemini AI Online</p>
                            </div>
                        </div>
                        <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>✖</button>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`chatbot-message ${msg.sender}`}>
                                <div className="message-bubble">{msg.text}</div>
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
