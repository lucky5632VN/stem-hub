import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { KeyboardEvent } from 'react';
import { Send, User, Bot, Loader2, X, Trash2, History, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGeometryStore } from '../../store/useGeometryStore';
import { parseMarkdown, splitForStreaming } from '../../utils/markdown';
import type { ShapeType } from '../../types/geometry';
import { API_ENDPOINTS, CLOUDFLARE_EDGE_PROXY_URL, fetchWithTimeout } from '../../config/api';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface Session {
  id: string;
  title: string;
  date: string;
  messages: Message[];
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '0.6rem 0' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#58a6ff',
            animation: 'tutorPulse 1.4s infinite ease-in-out',
            animationDelay: `${i * 0.2}s`,
            opacity: 0.7,
          }}
        />
      ))}
    </div>
  );
}

// Direct Client-Side Gemini Tutor Fallback
async function callDirectGeminiTutor(userText: string, chatHistory: Message[], shapeContext: string): Promise<string> {
  const geminiKey = (
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (import.meta as any).env?.NEXT_PUBLIC_GEMINI_API_KEY ||
    ''
  ).trim();

  const historyContext = chatHistory.slice(-4).map(m => `${m.role === 'user' ? 'Học sinh' : 'Gia sư'}: ${m.content}`).join('\n');
  const systemInstruction = `Bạn là Gia sư AI Chuyên gia Toán học và Hình học Không gian THPT thuộc nền tảng STEM HUB.
Hãy giải đáp súc tích, chính xác theo phương pháp chuẩn sách giáo khoa Việt Nam. Dùng LaTeX $...$ cho công thức toán.
Ngữ cảnh hình học hiện tại: ${shapeContext}`;

  const prompt = `${historyContext ? `Lịch sử hội thoại gần đây:\n${historyContext}\n\n` : ''}Câu hỏi hiện tại của học sinh: ${userText}`;

  const models = ['gemini-flash-lite-latest', 'gemini-3.1-flash-lite-preview', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          system_instruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
        })
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e) {
      console.warn(`[DirectGeminiTutor] Model ${model} failed:`, e);
    }
  }
  throw new Error('Có lỗi kết nối hệ thống, vui lòng thử lại sau ít phút.');
}

// Gọi thông qua Edge Proxy với Client Fallback tự động
async function callGeminiDirectly(userText: string, chatHistory: Message[], shapeContext: string): Promise<string> {
  const endpointsToTry = Array.from(new Set([
    '/api/lab-toan/chat-tutor',
    API_ENDPOINTS.chatTutor,
    `${CLOUDFLARE_EDGE_PROXY_URL}/api/lab-toan/chat-tutor`,
    '/api/ai/chat'
  ])).filter(Boolean);

  let lastError: any = null;

  for (const endpoint of endpointsToTry) {
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userText, message: userText, prompt: userText, chatHistory, shapeContext })
      }, 15000);

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        continue;
      }

      if (response.ok) {
        const data = await response.json();
        const replyText = data.text || data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText) return replyText;
      }
      const errData = await response.json().catch(() => ({}));
      lastError = new Error(errData.error || `HTTP ${response.status}`);
    } catch (err: any) {
      lastError = err;
      console.warn(`[AITutorPanel] Endpoint ${endpoint} error:`, err?.message);
    }
  }

  // Fallback cuối cùng nếu cả proxy lẫn local đều không phản hồi
  console.warn('[AITutorPanel] Trying direct Gemini fallback as last resort...');
  try {
    return await callDirectGeminiTutor(userText, chatHistory, shapeContext);
  } catch (fallbackErr: any) {
    console.error('[AITutorPanel] Direct fallback failed:', fallbackErr?.message);
    throw new Error(lastError?.message || 'Có lỗi kết nối hệ thống, vui lòng thử lại sau ít phút.');
  }
}

function isMathAIError(text?: string | null, status?: number): boolean {
  if (status !== undefined && status !== null && (status < 200 || status >= 300)) return true;
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

const AITutorPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const saved = localStorage.getItem('math_ai_sessions');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(s => {
          if (!s || !Array.isArray(s.messages)) return false;
          const last = s.messages[s.messages.length - 1];
          return !(last && last.role === 'ai' && isMathAIError(last.content));
        });
      }
      return [];
    } catch {
      return [];
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => 'session_' + Date.now());

  const [messages, setMessages] = useState<Message[]>([{
    id: crypto.randomUUID(),
    role: 'ai',
    content: 'Chào em! 👋 Thầy là **Gia sư STEM AI**. Thầy đã **ghi nhớ tiến trình học tập** của em từ các phiên trước. Em có câu hỏi nào mới về hình học 3D không?',
    timestamp: new Date(),
  }]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { 
    selectedShape, shapeParams,
    setSelectedShape, updateParams, setPlane, setCrossSectionColor, setShapeData
  } = useGeometryStore();

  // ── Drag state for toggle button and chat window ────────────────────────────────
  const isDragMove = useRef(false);
  const [btnPos, setBtnPos] = useState<{x:number,y:number}|null>(() => {
    try { const s = localStorage.getItem('math_btn_pos'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [winPos, setWinPos] = useState<{x:number,y:number}|null>(() => {
    try { const s = localStorage.getItem('math_win_pos'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const btnDrag = useRef({ active: false, sx: 0, sy: 0, px: 0, py: 0 });
  const winDrag = useRef({ active: false, sx: 0, sy: 0, px: 0, py: 0 });
  const btnRef = useRef<HTMLDivElement>(null);
  const winRef = useRef<HTMLDivElement>(null);

  const startBtnDrag = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDragMove.current = false;
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    btnDrag.current = { active: true, sx: e.clientX, sy: e.clientY, px: rect.left, py: rect.top };
    e.preventDefault();
  }, []);

  const startWinDrag = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) return;
    const el = winRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    winDrag.current = { active: true, sx: e.clientX, sy: e.clientY, px: rect.left, py: rect.top };
    e.preventDefault();
  }, []);

  useEffect(() => {
    const onBtnMove = (e: MouseEvent) => {
      if (!btnDrag.current.active) return;
      const dx = e.clientX - btnDrag.current.sx;
      const dy = e.clientY - btnDrag.current.sy;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) isDragMove.current = true;
      setBtnPos({
        x: Math.max(0, Math.min(window.innerWidth - 70, btnDrag.current.px + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 70, btnDrag.current.py + dy)),
      });
    };
    const onBtnUp = () => {
      if (btnDrag.current.active) {
        btnDrag.current.active = false;
        setBtnPos(prev => {
          if (prev) localStorage.setItem('math_btn_pos', JSON.stringify(prev));
          return prev;
        });
      }
    };
    document.addEventListener('mousemove', onBtnMove);
    document.addEventListener('mouseup', onBtnUp);
    return () => { document.removeEventListener('mousemove', onBtnMove); document.removeEventListener('mouseup', onBtnUp); };
  }, []);

  useEffect(() => {
    const onWinMove = (e: MouseEvent) => {
      if (!winDrag.current.active) return;
      const dx = e.clientX - winDrag.current.sx;
      const dy = e.clientY - winDrag.current.sy;
      setWinPos({
        x: Math.max(0, Math.min(window.innerWidth - 410, winDrag.current.px + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 550, winDrag.current.py + dy)),
      });
    };
    const onWinUp = () => {
      if (winDrag.current.active) {
        winDrag.current.active = false;
        setWinPos(prev => {
          if (prev) localStorage.setItem('math_win_pos', JSON.stringify(prev));
          return prev;
        });
      }
    };
    document.addEventListener('mousemove', onWinMove);
    document.addEventListener('mouseup', onWinUp);
    return () => { document.removeEventListener('mousemove', onWinMove); document.removeEventListener('mouseup', onWinUp); };
  }, []);

  const startNewSession = useCallback(() => {
    const newId = 'session_' + Date.now();
    setCurrentSessionId(newId);
    setMessages([{
      id: crypto.randomUUID(),
      role: 'ai',
      content: 'Chào em! 👋 Thầy là **Gia sư STEM AI**. Thầy đã ghi nhớ lịch sử học tập của em. Em có câu hỏi mới nào không?',
      timestamp: new Date(),
    }]);
    setIsDrawerOpen(false);
  }, []);

  const saveCurrentSession = useCallback((newMsgs: Message[]) => {
    const userMsgs = newMsgs.filter(m => m.role === 'user');
    if (userMsgs.length === 0) return;

    // TUYỆT ĐỐI KHÔNG LƯU VÀO CACHE NẾU TIN NHẮN CUỐI CỦA AI CHỨA LỖI
    const lastMsg = newMsgs[newMsgs.length - 1];
    if (lastMsg && lastMsg.role === 'ai' && isMathAIError(lastMsg.content)) {
      console.warn('[Math AI] TUYỆT ĐỐI KHÔNG LƯU CACHE vì phản hồi là thông báo lỗi:', lastMsg.content.substring(0, 50));
      return;
    }

    const title = userMsgs[0].content.substring(0, 30) + (userMsgs[0].content.length > 30 ? '...' : '');
    const dateStr = new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

    setSessions(prev => {
      const existingIdx = prev.findIndex(s => s.id === currentSessionId);
      const sessionObj: Session = {
        id: currentSessionId,
        title,
        date: dateStr,
        messages: newMsgs,
      };
      let updated: Session[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = sessionObj;
      } else {
        updated = [sessionObj, ...prev];
      }
      try {
        localStorage.setItem('math_ai_sessions', JSON.stringify(updated.slice(0, 20)));
      } catch {}
      return updated.slice(0, 20);
    });
  }, [currentSessionId]);

  useEffect(() => {
    // Auto-scroll disabled per user preference
  }, [messages, isLoading]);

  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 112)}px`;
  }, [input]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    saveCurrentSession(newMsgs);

    setInput('');
    setIsLoading(true);
    setError(null);

    const pastTopics = sessions.flatMap(s => s.messages).filter(m => m.role === 'user').map(m => m.content.substring(0, 30)).slice(0, 6);
    const memoryContext = pastTopics.length > 0 ? `\n\n[BỘ NHỚ HỌC HỎI CỦA AI TỪ CÁC PHIÊN TRƯỚC: Học sinh đã làm quen với các chủ đề: ${pastTopics.join('; ')}]` : '';

    const shapeContext = selectedShape
      ? `\n\n[Dữ liệu hình ảnh nền: Học sinh đang tương tác với (${selectedShape}). Parameter: ${JSON.stringify(shapeParams)}]${memoryContext}`
      : memoryContext;

    const userPrompt = text.trim();
    let aiResponseText = '';
    let isCacheHit = false;
    let aiSucceeded = false;

    try {
      // 0. Kiểm tra kho tri thức đã học (RAG Cache / Learned Knowledge) tương tự NOVA
      if (typeof window !== 'undefined' && (window as any).StemLabAIBridge) {
        try {
          const cached = await (window as any).StemLabAIBridge.checkLabLearnedCache(userPrompt, 'toan', 0.68);
          if (cached && cached.answer) {
            aiResponseText = cached.answer;
            isCacheHit = true;
            aiSucceeded = true;
            (window as any).StemLabAIBridge.logLabReasoning({
              module: 'lab_toan_3d',
              action: 'rag_cache_hit',
              query: userPrompt,
              subject: 'TOAN',
              aiResponseText: cached.answer,
              isCacheHit: true,
              labTitle: 'Lab Toán 3D',
              score: cached.score || 0.9,
              status: 'success',
              notes: `Gia sư Toán học hỏi tri thức tích lũy từ NOVA: "${cached.topic || cached.question}" (độ tương đồng ${((cached.score || 0.9) * 100).toFixed(1)}%)`,
              costSaved: '100% (0 VND)'
            });
          }
        } catch (cacheErr) {
          console.warn('Lỗi kiểm tra cache tri thức Lab Toán:', cacheErr);
        }
      }

      if (!isCacheHit) {
        try {
          aiResponseText = await callGeminiDirectly(userPrompt, messages, shapeContext);
          aiSucceeded = true;
        } catch (directErr) {
          console.error("Lỗi Gia sư STEM AI Toán 3D:", directErr);
          aiResponseText = "Thầy gặp chút gián đoạn kết nối khi xử lý câu hỏi này. Em vui lòng hỏi lại nhé!";
        }

        // Tự động lưu tri thức mới vào bộ nhớ hệ thống giống như NOVA (CHỈ lưu khi AI gọi thành công và KHÔNG chứa từ khóa lỗi!)
        if (typeof window !== 'undefined' && (window as any).StemLabAIBridge && aiResponseText && aiSucceeded && !isMathAIError(aiResponseText, 200)) {
          (window as any).StemLabAIBridge.saveLabLearnedAnswer(userPrompt, aiResponseText, 'toan', 'Lab Toán 3D');
          (window as any).StemLabAIBridge.logLabReasoning({
            module: 'lab_toan_3d',
            action: 'gemini_math_tutor',
            query: userPrompt,
            status: 'success',
            notes: 'Gia sư STEM Toán 3D phân tích và đã lưu kiến thức mới vào learned_knowledge.'
          });
        }
      }

      // Extract Control Command
      const actionRegex = /```(?:json(?::Action)?)?\s*(\{[\s\S]*?"action"\s*:\s*[\s\S]*?\})\s*```/i;
      const match = actionRegex.exec(aiResponseText);
      
      if (match && match[1]) {
        try {
          const actionData = JSON.parse(match[1]);
          if (actionData.action === 'update_scene') {
            let targetShape = actionData.shape_type || actionData.parameters?.shape_type;
            const targetParams = actionData.params || actionData.parameters;
            if (targetShape) {
              if (targetShape.includes('prism')) targetShape = 'prism_regular';
              else if (targetShape.includes('triangle') && targetShape.includes('pyramid')) targetShape = 'pyramid_triangle';
              else if (targetShape.includes('square') && targetShape.includes('pyramid')) targetShape = 'pyramid_square';
              setSelectedShape(targetShape as ShapeType);
            }
            if (targetParams) updateParams(targetParams);
            if (actionData.plane) setPlane(actionData.plane);
            if (actionData.color) setCrossSectionColor(actionData.color);
          } else if (actionData.action === 'create_custom' && actionData.data) {
            const cd = actionData.data;
            if (!cd.edges) cd.edges = [];
            if (!cd.properties) cd.properties = {};
            cd.shape_type = 'custom';
            setSelectedShape('custom');
            setShapeData(cd);
          }
        } catch (e) {
          console.error("Failed to parse Action JSON from AI", e);
        }
        aiResponseText = aiResponseText.replace(match[0], '').trim();
      }
      // Guarantee that NO raw JSON or code action blocks ever leak to student UI
      aiResponseText = aiResponseText.replace(/```(?:json)?[\s\S]*?```/gi, '').trim();
      aiResponseText = aiResponseText.replace(/\{[\s\S]*?"action"\s*:\s*[\s\S]*?\}/gi, '').trim();
      
      // ⚡ HIỆU ỨNG GÕ CHỮ TỪ TỪ GIỐNG NOVA AI (Word-by-Word Streaming Effect ~16ms/từ, không tự động cuộn)
      const botMsgId = crypto.randomUUID();
      const initialBotMsg: Message = {
        id: botMsgId,
        role: 'ai',
        content: '',
        timestamp: new Date(),
      };
      setMessages([...newMsgs, initialBotMsg]);

      const tokens = splitForStreaming(aiResponseText);
      let currentStreamText = '';
      const delay = Math.max(12, Math.min(22, Math.floor(1600 / Math.max(1, tokens.length))));

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token === '\n') {
          currentStreamText += '\n';
        } else if (i === 0 || currentStreamText.endsWith('\n')) {
          currentStreamText += token;
        } else {
          currentStreamText += ' ' + token;
        }
        const updatedText = currentStreamText;
        setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: updatedText } : m));
        await new Promise(r => setTimeout(r, delay));
      }

      const finalMsgs: Message[] = [...newMsgs, {
        id: botMsgId,
        role: 'ai',
        content: aiResponseText,
        timestamp: new Date(),
      }];
      setMessages(finalMsgs);
      if (aiSucceeded && !isMathAIError(aiResponseText, 200)) {
        saveCurrentSession(finalMsgs);
      } else {
        console.warn('[Math AI] Chỉ hiển thị thông báo lỗi tạm thời trên UI, TUYỆT ĐỐI KHÔNG LƯU CACHE.');
      }
    } catch (err: any) {
      setError(`Lỗi kết nối AI: ${err.message || 'Không thể kết nối dịch vụ.'}`);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, selectedShape, shapeParams, setSelectedShape, updateParams, setPlane, setCrossSectionColor, setShapeData, sessions, saveCurrentSession]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    startNewSession();
  };

  // Compute positions
  const btnStyle = btnPos
    ? { position: 'fixed' as const, left: btnPos.x, top: btnPos.y, right: 'auto', bottom: 'auto' }
    : { position: 'fixed' as const, right: '2rem', bottom: '2rem' };
  const winStyle = winPos
    ? { position: 'fixed' as const, left: winPos.x, top: winPos.y, right: 'auto', bottom: 'auto' }
    : { position: 'fixed' as const, right: '2rem', bottom: '5.5rem' };

  return (
    <>
      <style>{`
        @keyframes tutorPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%           { transform: scale(1);   opacity: 1;   }
        }
      `}</style>

      {/* Draggable toggle button - hidden when window is open */}
      {!isOpen && (
        <div ref={btnRef} style={{ ...btnStyle, zIndex: 2000 }}>
          <motion.button
            onMouseDown={startBtnDrag}
            onClick={() => { if (!isDragMove.current) setIsOpen(!isOpen); }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            title="Gia sư AI Toán học – kéo để di chuyển"
            style={{
              width: 58, height: 58, borderRadius: '50%',
              background: 'linear-gradient(135deg, #58a6ff, #a371f7)',
              border: 'none', color: '#fff',
              boxShadow: '0 8px 28px rgba(88,166,255,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'grab', position: 'relative',
              fontSize: 26,
            }}
          >
            📐
            {!isOpen && messages.length > 1 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                width: 10, height: 10, borderRadius: '50%',
                background: '#f85149', border: '2px solid #0d1117',
              }} />
            )}
          </motion.button>
        </div>
      )}

      {/* Draggable chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={winRef}
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 16 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            style={{
              ...winStyle,
              zIndex: 1999,
              width: 400, height: 540,
              borderRadius: 18,
              display: 'flex', flexDirection: 'column',
              background: 'rgba(13,17,23,0.96)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(88,166,255,0.2)',
              boxShadow: '0 16px 56px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}
          >
              {/* History Drawer Overlay */}
              <AnimatePresence>
                {isDrawerOpen && (
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(13,17,23,0.98)',
                      zIndex: 10, padding: '1rem',
                      display: 'flex', flexDirection: 'column',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#58a6ff', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <History size={16} /> Lịch sử & Học hỏi
                      </div>
                      <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer' }}>
                        <X size={16} />
                      </button>
                    </div>

                    <button
                      onClick={startNewSession}
                      style={{
                        width: '100%', padding: '0.6rem', borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(88,166,255,0.2), rgba(163,113,247,0.2))',
                        border: '1px solid rgba(88,166,255,0.4)', color: '#58a6ff',
                        fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        marginBottom: '1rem',
                      }}
                    >
                      <Plus size={16} /> Tạo đoạn chat mới
                    </button>

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {sessions.length === 0 ? (
                        <div style={{ color: '#8b949e', fontSize: '0.8rem', textAlign: 'center', padding: '2rem 0' }}>Chưa có lịch sử hội thoại nào.</div>
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
                              background: s.id === currentSessionId ? 'rgba(88,166,255,0.15)' : 'rgba(22,27,34,0.7)',
                              border: `1px solid ${s.id === currentSessionId ? '#58a6ff' : 'rgba(255,255,255,0.07)'}`,
                              borderRadius: 10, padding: '0.6rem 0.8rem',
                              cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}
                          >
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ fontSize: '0.82rem', color: '#f0f6fc', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title || 'Hội thoại mới'}</div>
                              <div style={{ fontSize: '0.68rem', color: '#8b949e' }}>{s.date} • {s.messages.filter(m => m.role === 'user').length} câu hỏi</div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const filtered = sessions.filter(x => x.id !== s.id);
                                setSessions(filtered);
                                localStorage.setItem('math_ai_sessions', JSON.stringify(filtered));
                                if (currentSessionId === s.id) startNewSession();
                              }}
                              style={{ background: 'transparent', border: 'none', color: '#f85149', opacity: 0.6, cursor: 'pointer', padding: 4 }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Draggable header */}
              <div
                onMouseDown={startWinDrag}
                style={{
                  padding: '0.85rem 1rem',
                  background: 'linear-gradient(90deg, rgba(88,166,255,0.12), rgba(163,113,247,0.12))',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  flexShrink: 0,
                  cursor: 'grab',
                  userSelect: 'none',
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'linear-gradient(135deg,#58a6ff,#a371f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, boxShadow: '0 4px 12px rgba(88,166,255,0.3)',
                }}>
                  <Bot size={18} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f6fc' }}>Gia sư STEM AI</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={startNewSession} title="Tạo đoạn chat mới"
                    style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', padding: 4, borderRadius: 6 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#58a6ff')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}
                  >
                    <Plus size={15} />
                  </button>
                  <button onClick={() => setIsDrawerOpen(true)} title="Lịch sử & Học hỏi"
                    style={{ background: 'transparent', border: 'none', color: '#58a6ff', cursor: 'pointer', padding: 4, borderRadius: 6 }}
                  >
                    <History size={15} />
                  </button>
                  <button onClick={clearChat} title="Xoá hội thoại hiện tại"
                    style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', padding: 4, borderRadius: 6 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f85149')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}
                  >
                    <Trash2 size={15} />
                  </button>
                  <button onClick={() => setIsOpen(false)} title="Đóng"
                    style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', padding: 4, borderRadius: 6 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f0f6fc')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div
                ref={scrollRef}
                style={{
                  flex: 1, overflowY: 'auto', padding: '1rem',
                  display: 'flex', flexDirection: 'column', gap: '1rem',
                }}
              >
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                      gap: '0.65rem', alignItems: 'flex-start',
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg,#1f6feb,#388bfd)'
                        : 'linear-gradient(135deg,#58a6ff,#a371f7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: 2,
                    }}>
                      {msg.role === 'user'
                        ? <User size={13} color="#fff" />
                        : <Bot size={13} color="#fff" />
                      }
                    </div>

                    <div style={{
                      maxWidth: '82%',
                      minWidth: '50px',
                      padding: '0.7rem 0.9rem',
                      borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg,#1f6feb,#388bfd)'
                        : 'rgba(30,36,46,0.9)',
                      border: msg.role === 'ai' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                      fontSize: '0.84rem',
                      lineHeight: 1.6,
                      color: '#f0f6fc',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                    }}>
                      {msg.role === 'user' ? (
                        <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          {msg.content || (msg as any).text || ''}
                        </span>
                      ) : (
                        <div
                          className="chat-math-content"
                          dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content || (msg as any).text || '') }}
                          style={{
                            fontSize: '0.84rem',
                            lineHeight: 1.6,
                            maxWidth: '100%',
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'linear-gradient(135deg,#58a6ff,#a371f7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Bot size={13} color="#fff" />
                    </div>
                    <div style={{
                      padding: '0.7rem 0.9rem',
                      borderRadius: '14px 14px 14px 4px',
                      background: 'rgba(30,36,46,0.9)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <TypingDots />
                    </div>
                  </div>
                )}

                {error && (
                  <div style={{
                    padding: '0.6rem 0.9rem',
                    borderRadius: 10,
                    background: 'rgba(248,81,73,0.1)',
                    border: '1px solid rgba(248,81,73,0.3)',
                    color: '#f85149', fontSize: '0.8rem',
                    display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                  }}>
                    <span style={{ flexShrink: 0 }}>⚠️</span><span style={{ wordBreak: 'break-word' }}>{error}</span>
                  </div>
                )}
              </div>

              <div style={{
                padding: '0.75rem 1rem',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', gap: '0.5rem', alignItems: 'flex-end',
                flexShrink: 0,
              }}>
                <textarea
                  ref={inputRef}
                  placeholder="Hỏi gia sư... (Enter gửi, Shift+Enter xuống dòng)"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  rows={1}
                  style={{
                    flex: 1, resize: 'none', overflow: 'hidden',
                    padding: '0.55rem 0.85rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid #30363d',
                    borderRadius: 12, color: '#f0f6fc',
                    fontSize: '0.85rem', fontFamily: 'inherit',
                    outline: 'none', lineHeight: 1.5,
                    transition: 'border-color 0.2s',
                    minHeight: 38, maxHeight: 112,
                  }}
                  onFocus={e => (e.target.style.borderColor = '#58a6ff')}
                  onBlur={e => (e.target.style.borderColor = '#30363d')}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  style={{
                    width: 36, height: 36, borderRadius: 10, border: 'none',
                    background: (input.trim() && !isLoading)
                      ? 'linear-gradient(135deg,#58a6ff,#a371f7)'
                      : '#30363d',
                    color: '#fff', cursor: (input.trim() && !isLoading) ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.2s',
                    boxShadow: (input.trim() && !isLoading) ? '0 4px 12px rgba(88,166,255,0.25)' : 'none',
                  }}
                >
                  {isLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
                </button>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AITutorPanel;
