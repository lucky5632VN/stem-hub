/**
 * Physics Lab AI Assistant (Gia sư AI Vật Lý)
 * Tích hợp Gemini 2.5 Flash API trực tiếp vào tất cả các module thí nghiệm Vật lý.
 */

(function () {
  const GEMINI_API_KEY = "AQ.Ab8RN6IDogiOEW1CygJr0X7wyzuErXX9l1eyrFNim_OlD7awng";
  const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  const SYSTEM_INSTRUCTION = `Bạn là Trợ lý AI Vật lý THPT chuyên nghiệp trong Physics Lab.

QUY TẮC BẮT BUỘC KHÔNG ĐƯỢC VI PHẠM:
1. TRẢ LỜI CỰC KỲ NGẮN GỌN & CÔ ĐỌNG (chỉ từ 2 đến 4 dòng, tối đa 60 từ). Tuyệt đối KHÔNG viết dài dòng lan man hay giải thích rườm rà.
2. ĐƯA RA CÔNG THỨC VÀ ĐÁP ÁN TRỰC TIẾP NGAY LẬP TỨC.
3. KÝ HIỆU & ĐƠN VỊ VẬT LÝ CHUẨN XÁC SGK THPT 2025:
   - Dùng ký hiệu rõ ràng, sạch đẹp: T = 2π√(l/g), x = A·cos(ωt + φ), I = U/R, λ = v/f, E = m·c², F = m·a, P = U·I.
   - Đơn vị đo chuẩn xác: Ω, π, λ, ω, Δ, φ, V, A, W, J, Hz, N, m/s, rad/s, kg.
   - Viết rõ ràng, tuyệt đối không bị lỗi font hoặc sai ký hiệu đại lượng.`;

  let sessions = [];
  let currentSessionId = 'session_' + Date.now();
  let messages = [
    {
      role: 'ai',
      content: 'Chào em! 👋 Thầy là **Trợ lý AI Vật Lý**. Thầy đã **ghi nhớ tiến trình học tập** của em từ các phiên trước. Em có bài tập hay công thức nào mới cần giải đáp không?'
    }
  ];

  // Khôi phục danh sách sessions từ LocalStorage
  function loadSessions() {
    try {
      const saved = localStorage.getItem('physics_ai_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) sessions = parsed;
      }
    } catch (e) {}

    // Bắt đầu một đoạn chat mới mỗi khi vào phòng lab
    startNewSession(false);
  }

  function startNewSession(shouldRender = true) {
    currentSessionId = 'session_' + Date.now();
    messages = [
      {
        role: 'ai',
        content: 'Chào em! 👋 Thầy là **Trợ lý AI Vật Lý**. Thầy đã **ghi nhớ tiến trình học tập** của em từ các phiên trước. Em có bài tập hay công thức nào mới cần giải đáp không?'
      }
    ];
    if (shouldRender) {
      renderMessages();
      renderSessionsList();
    }
  }

  function saveSessions() {
    try {
      const userMsgs = messages.filter(m => m.role === 'user');
      if (userMsgs.length > 0) {
        const title = userMsgs[0].content.substring(0, 32) + (userMsgs[0].content.length > 32 ? '...' : '');
        const dateStr = new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
        const existingIdx = sessions.findIndex(s => s.id === currentSessionId);
        const sessionObj = {
          id: currentSessionId,
          title: title,
          date: dateStr,
          messages: messages
        };

        if (existingIdx >= 0) {
          sessions[existingIdx] = sessionObj;
        } else {
          sessions.unshift(sessionObj);
        }

        // Lưu tối đa 20 session gần nhất
        if (sessions.length > 20) sessions = sessions.slice(0, 20);
        localStorage.setItem('physics_ai_sessions', JSON.stringify(sessions));
        renderSessionsList();
      }
    } catch (e) {}
  }

  function getMemoryContext() {
    if (sessions.length === 0) return '';
    const pastTopics = sessions
      .flatMap(s => s.messages)
      .filter(m => m.role === 'user')
      .map(m => m.content.substring(0, 35))
      .slice(0, 8);

    if (pastTopics.length === 0) return '';
    return `\n\n[BỘ NHỚ HỌC HỎI CỦA AI TỪ CÁC PHIÊN TRƯỚC: Học sinh đã hỏi về: ${pastTopics.join('; ')}. AI hãy ghi nhớ tiến trình học tập này để cá nhân hóa câu trả lời tốt nhất.]`;
  }

  loadSessions();

  let isOpen = false;
  let isLoading = false;
  let isDrawerOpen = false;

  // Format các ký hiệu toán/lý sang Unicode & HTML sạch đẹp
  function formatMathSymbols(str) {
    if (!str) return '';
    return str
      .replace(/\$\$(.+?)\$\$/gs, '$1')
      .replace(/\$(.+?)\$/g, '$1')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
      .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
      .replace(/\^2/g, '²')
      .replace(/\^3/g, '³')
      .replace(/\^n/g, 'ⁿ')
      .replace(/\\pi/g, 'π')
      .replace(/\\omega/g, 'ω')
      .replace(/\\Omega/g, 'Ω')
      .replace(/\\lambda/g, 'λ')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\varphi/g, 'φ')
      .replace(/\\alpha/g, 'α')
      .replace(/\\beta/g, 'β')
      .replace(/\\theta/g, 'θ')
      .replace(/\\mu/g, 'μ')
      .replace(/\\rho/g, 'ρ')
      .replace(/\\infty/g, '∞')
      .replace(/\\approx/g, '≈')
      .replace(/\\times/g, '×')
      .replace(/\\cdot/g, '·')
      .replace(/\\pm/g, '±')
      .replace(/\\leq/g, '≤')
      .replace(/\\geq/g, '≥')
      .replace(/\\neq/g, '≠');
  }

  // Đơn giản hóa markdown parser cho văn bản và công thức
  function parseSimpleMarkdown(text) {
    if (!text) return '';
    let formatted = formatMathSymbols(text);
    let html = formatted
      .replace(/```([\s\S]*?)```/g, '<pre style="background:rgba(0,0,0,0.4);padding:8px 12px;border-radius:8px;overflow-x:auto;font-family:monospace;font-size:0.8rem;margin:6px 0;"><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.85em;">$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^[\-\*•]\s+(.+)$/gm, '<li style="margin:2px 0;">$1</li>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
    return html;
  }

  function injectStyles() {
    if (document.getElementById('physics-ai-style')) return;
    const style = document.createElement('style');
    style.id = 'physics-ai-style';
    style.innerHTML = `
      #physics-ai-widget {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 99999;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
      }
      #physics-ai-toggle {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #00f2fe, #4facfe);
        border: none;
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 25px rgba(0, 242, 254, 0.4);
        transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s ease;
      }
      #physics-ai-toggle:hover {
        transform: scale(1.08);
        box-shadow: 0 12px 30px rgba(0, 242, 254, 0.6);
      }
      #physics-ai-toggle:active {
        transform: scale(0.95);
      }
      #physics-ai-box {
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 380px;
        height: 520px;
        max-width: calc(100vw - 32px);
        max-height: calc(100vh - 100px);
        background: rgba(15, 23, 42, 0.96);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(0, 242, 254, 0.3);
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 242, 254, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 0;
        transform: translateY(20px) scale(0.95);
        pointer-events: none;
        transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      #physics-ai-box.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }
      .pai-header {
        padding: 14px 18px;
        background: linear-gradient(90deg, rgba(0, 242, 254, 0.15), rgba(79, 172, 254, 0.15));
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .pai-title-group {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .pai-avatar {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: linear-gradient(135deg, #00f2fe, #4facfe);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0, 242, 254, 0.3);
      }
      .pai-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .pai-msg {
        max-width: 85%;
        padding: 10px 14px;
        border-radius: 14px;
        font-size: 0.85rem;
        line-height: 1.55;
        color: #e2e8f0;
        word-break: break-word;
      }
      .pai-msg.user {
        align-self: flex-end;
        background: linear-gradient(135deg, #0284c7, #0369a1);
        border-bottom-right-radius: 4px;
        color: #ffffff;
      }
      .pai-msg.ai {
        align-self: flex-start;
        background: rgba(30, 41, 59, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-bottom-left-radius: 4px;
      }
      .pai-input-area {
        padding: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        gap: 8px;
        align-items: center;
        background: rgba(15, 23, 42, 0.95);
      }
      #pai-input {
        flex: 1;
        background: rgba(30, 41, 59, 0.9) !important;
        border: 1px solid rgba(0, 242, 254, 0.3) !important;
        border-radius: 12px !important;
        padding: 10px 14px !important;
        color: #f8fafc !important;
        font-size: 0.85rem !important;
        font-family: inherit !important;
        resize: none !important;
        outline: none !important;
        max-height: 100px !important;
        min-height: 40px !important;
        line-height: 1.4 !important;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3) !important;
      }
      #pai-input::placeholder {
        color: #94a3b8 !important;
        opacity: 0.8;
      }
      #pai-input:focus {
        border-color: #00f2fe !important;
        box-shadow: 0 0 12px rgba(0, 242, 254, 0.3) !important;
      }
      .pai-send-btn {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: linear-gradient(135deg, #00f2fe, #4facfe);
        border: none;
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
        flex-shrink: 0;
        box-shadow: 0 4px 14px rgba(0, 242, 254, 0.3);
      }
      .pai-send-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 18px rgba(0, 242, 254, 0.5);
      }
      .pai-loading-dots {
        display: flex;
        gap: 4px;
        padding: 6px 0;
      }
      .pai-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #00f2fe;
        animation: paiPulse 1.4s infinite ease-in-out;
      }
      .pai-dot:nth-child(2) { animation-delay: 0.2s; }
      .pai-dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes paiPulse {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
        40% { transform: scale(1); opacity: 1; }
      }

      /* Session History Drawer */
      .pai-drawer {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(15, 23, 42, 0.98);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        z-index: 100;
        display: flex;
        flex-direction: column;
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        padding: 16px;
        box-sizing: border-box;
      }
      .pai-drawer.open {
        transform: translateX(0);
      }
      .pai-drawer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .pai-new-session-btn {
        width: 100%;
        padding: 10px;
        border-radius: 12px;
        background: linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(79, 172, 254, 0.2));
        border: 1px solid rgba(0, 242, 254, 0.4);
        color: #00f2fe;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: background 0.2s, transform 0.2s;
      }
      .pai-new-session-btn:hover {
        background: linear-gradient(135deg, rgba(0, 242, 254, 0.35), rgba(79, 172, 254, 0.35));
        transform: translateY(-1px);
      }
      .pai-sessions-list {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .pai-session-item {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 10px 14px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background 0.2s, border-color 0.2s;
      }
      .pai-session-item:hover {
        background: rgba(0, 242, 254, 0.12);
        border-color: rgba(0, 242, 254, 0.4);
      }
      .pai-session-item.active {
        border-color: #00f2fe;
        background: rgba(0, 242, 254, 0.15);
      }
      .pai-session-title {
        font-size: 0.82rem;
        color: #f8fafc;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 220px;
      }
      .pai-session-date {
        font-size: 0.68rem;
        color: #94a3b8;
      }
      .pai-session-del {
        background: transparent;
        border: none;
        color: #ef4444;
        opacity: 0.6;
        cursor: pointer;
        padding: 4px;
      }
      .pai-session-del:hover {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }

  function renderSessionsList() {
    const listEl = document.getElementById('pai-sessions-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (sessions.length === 0) {
      listEl.innerHTML = '<div style="color:#94a3b8;font-size:0.8rem;text-align:center;padding:20px 0;">Chưa có hội thoại nào được lưu.</div>';
      return;
    }

    sessions.forEach(s => {
      const item = document.createElement('div');
      item.className = `pai-session-item ${s.id === currentSessionId ? 'active' : ''}`;
      item.innerHTML = `
        <div style="flex:1;overflow:hidden;">
          <div class="pai-session-title">${s.title || 'Hội thoại mới'}</div>
          <div class="pai-session-date">${s.date || ''} • ${s.messages.filter(m => m.role === 'user').length} câu hỏi</div>
        </div>
        <button class="pai-session-del" title="Xóa đoạn chat này">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </button>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.pai-session-del')) return;
        currentSessionId = s.id;
        messages = [...s.messages];
        renderMessages();
        const drawer = document.getElementById('pai-history-drawer');
        if (drawer) drawer.classList.remove('open');
        isDrawerOpen = false;
        renderSessionsList();
      });

      const delBtn = item.querySelector('.pai-session-del');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sessions = sessions.filter(x => x.id !== s.id);
        localStorage.setItem('physics_ai_sessions', JSON.stringify(sessions));
        if (currentSessionId === s.id) {
          startNewSession(true);
        } else {
          renderSessionsList();
        }
      });

      listEl.appendChild(item);
    });
  }

  function buildUI() {
    injectStyles();

    if (document.getElementById('physics-ai-widget')) return;

    const widget = document.createElement('div');
    widget.id = 'physics-ai-widget';
    widget.innerHTML = `
      <div id="physics-ai-box">
        <!-- History Drawer -->
        <div id="pai-history-drawer" class="pai-drawer">
          <div class="pai-drawer-header">
            <div style="font-weight:700;color:#00f2fe;font-size:0.88rem;display:flex;align-items:center;gap:6px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Lịch sử Hội thoại & Học hỏi
            </div>
            <button id="pai-drawer-close" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:4px;" title="Đóng lịch sử">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <button id="pai-new-chat-drawer-btn" class="pai-new-session-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Tạo đoạn chat mới
          </button>
          <div id="pai-sessions-list" class="pai-sessions-list"></div>
        </div>

        <div class="pai-header">
          <div class="pai-title-group">
            <div class="pai-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20M5 5l14 14M5 19L19 5"/></svg>
            </div>
            <div>
              <div style="font-weight:700;font-size:0.9rem;color:#f8fafc;">AI Vật Lý</div>
            </div>
          </div>
          <div style="display:flex;gap:4px;">
            <button id="pai-new-btn" title="Tạo đoạn chat mới" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:4px;border-radius:6px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            </button>
            <button id="pai-history-btn" title="Lịch sử & Học hỏi" style="background:transparent;border:none;color:#00f2fe;cursor:pointer;padding:4px;border-radius:6px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </button>
            <button id="pai-clear-btn" title="Xóa đoạn chat hiện tại" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:4px;border-radius:6px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
            <button id="pai-close-btn" title="Đóng" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:4px;border-radius:6px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div class="pai-messages" id="pai-msg-container"></div>

        <div class="pai-input-area">
          <textarea id="pai-input" class="pai-textarea" placeholder="Hỏi AI về lý thuyết, bài tập Vật lý..." rows="1"></textarea>
          <button id="pai-send" class="pai-send-btn" title="Gửi câu hỏi">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
      </div>

      <button id="physics-ai-toggle" title="Trợ lý AI Vật Lý">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20M5 5l14 14M5 19L19 5"/></svg>
      </button>
    `;

    document.body.appendChild(widget);

    renderMessages();

    // Event Listeners
    const toggleBtn = document.getElementById('physics-ai-toggle');
    const box = document.getElementById('physics-ai-box');
    const closeBtn = document.getElementById('pai-close-btn');
    const clearBtn = document.getElementById('pai-clear-btn');
    const historyBtn = document.getElementById('pai-history-btn');
    const newBtn = document.getElementById('pai-new-btn');
    const drawerCloseBtn = document.getElementById('pai-drawer-close');
    const newChatDrawerBtn = document.getElementById('pai-new-chat-drawer-btn');
    const drawer = document.getElementById('pai-history-drawer');
    const sendBtn = document.getElementById('pai-send');
    const textarea = document.getElementById('pai-input');

    toggleBtn.addEventListener('click', () => {
      isOpen = !isOpen;
      if (isOpen) box.classList.add('open');
      else box.classList.remove('open');
    });

    closeBtn.addEventListener('click', () => {
      isOpen = false;
      box.classList.remove('open');
    });

    historyBtn.addEventListener('click', () => {
      isDrawerOpen = !isDrawerOpen;
      if (isDrawerOpen) {
        drawer.classList.add('open');
        renderSessionsList();
      } else {
        drawer.classList.remove('open');
      }
    });

    drawerCloseBtn.addEventListener('click', () => {
      isDrawerOpen = false;
      drawer.classList.remove('open');
    });

    newBtn.addEventListener('click', () => {
      saveSessions();
      startNewSession(true);
    });

    newChatDrawerBtn.addEventListener('click', () => {
      saveSessions();
      startNewSession(true);
      isDrawerOpen = false;
      drawer.classList.remove('open');
    });

    clearBtn.addEventListener('click', () => {
      messages = [{
        role: 'ai',
        content: 'Chào em! 👋 Thầy là **Trợ lý AI Vật Lý**. Thầy đã ghi nhớ lịch sử học tập của em. Em có câu hỏi mới nào không?'
      }];
      saveSessions();
      renderMessages();
    });

    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    });

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    sendBtn.addEventListener('click', handleSend);
  }

  function renderMessages() {
    const container = document.getElementById('pai-msg-container');
    if (!container) return;

    container.innerHTML = '';
    messages.forEach(msg => {
      const div = document.createElement('div');
      div.className = `pai-msg ${msg.role}`;
      div.innerHTML = parseSimpleMarkdown(msg.content);
      container.appendChild(div);
    });

    if (isLoading) {
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'pai-msg ai';
      loadingDiv.innerHTML = `
        <div class="pai-loading-dots">
          <div class="pai-dot"></div>
          <div class="pai-dot"></div>
          <div class="pai-dot"></div>
        </div>
      `;
      container.appendChild(loadingDiv);
    }

    container.scrollTop = container.scrollHeight;

    if (window.MathJax && window.MathJax.typesetPromise) {
      try {
        window.MathJax.typesetPromise([container]).catch(function(e) { console.warn(e); });
      } catch (e) {}
    }
  }

  async function handleSend() {
    const textarea = document.getElementById('pai-input');
    const userText = textarea.value.trim();
    if (!userText || isLoading) return;

    messages.push({ role: 'user', content: userText });
    textarea.value = '';
    textarea.style.height = 'auto';
    isLoading = true;
    saveSessions();
    renderMessages();

    // Context phòng lab hiện tại + Ký ước AI từ các phiên trước
    const pageTitle = document.title || 'Physics Lab';
    const memoryContext = getMemoryContext();
    const pageContext = `\n\n[Context: Học sinh đang thực hành ở tệp: ${window.location.pathname} (${pageTitle})]${memoryContext}`;

    let aiReply = '';
    let success = false;

    for (const model of MODELS) {
      if (success) break;
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        
        // Cấu hình payload chuẩn Gemini REST API
        const payload = {
          system_instruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
          },
          contents: [
            ...messages.slice(-6).map(m => ({
              role: m.role === 'ai' ? 'model' : 'user',
              parts: [{ text: m.content }]
            })),
            { 
              role: 'user', 
              parts: [{ text: `(Yêu cầu: Trả lời cực kỳ ngắn gọn 2-4 dòng, cô đọng, đúng ký hiệu công thức và đơn vị)\n${userText} ${pageContext}` }] 
            }
          ],
          generationConfig: {
            maxOutputTokens: 250,
            temperature: 0.2
          }
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) continue;

        const data = await res.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          aiReply = candidate;
          success = true;
        }
      } catch (err) {
        console.warn(`[Physics AI] Fallback model ${model} error:`, err);
      }
    }

    if (!success) {
      aiReply = "Rất tiếc, AI Vật Lý gặp sự cố khi kết nối tới máy chủ. Vui lòng thử lại sau giây lát!";
    }

    messages.push({ role: 'ai', content: aiReply });
    isLoading = false;
    saveSessions();
    renderMessages();
  }

  // Khởi chạy khi DOM hoàn tất
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildUI);
  } else {
    buildUI();
  }
})();
