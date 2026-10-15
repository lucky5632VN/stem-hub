/**
 * Physics Lab AI Assistant (Gia sư AI Vật Lý)
 * Tích hợp Gemini 2.5 Flash API trực tiếp vào tất cả các module thí nghiệm Vật lý.
 */

(function () {
  const PHYSICS_API_KEYS = []; // Managed by Cloudflare Gateway
  let physicsKeyIdx = 0;
  const MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite-preview",
  "gemini-2.5-flash-lite",
  "gemma-4-26b-a4b-it",
  "gemma-4-31b-it",
  "gemini-flash-latest"
];

  const SYSTEM_INSTRUCTION = `Bạn là Trợ lý AI Chuyên gia Vật lý THPT (Physics Specialist) của hệ thống STEM HUB.

NHIỆM VỤ ĐỘC TÔN:
Chỉ tập trung CHUYÊN SÂU 100% VÀO BỘ MÔN VẬT LÝ THPT.
Phạm vi chuyên môn: Cơ học, dao động điều hòa (con lắc lò xo, con lắc đơn), sóng cơ và sóng âm, giao thoa sóng, quang học và sóng ánh sáng, dòng điện xoay chiều, từ trường, cảm ứng điện từ, mạch điện DC/AC, thuyết lượng tử ánh sáng và vật lý hạt nhân.

QUY TẮC BIÊN GIỚI MÔN HỌC (TUYỆT ĐỐI BẮT BUỘC):
- Nếu người dùng hỏi các câu hỏi thuộc môn khác (Hóa học, Sinh học, Toán học, Lịch sử, đời sống ngoài lề...), BẮT BUỘC TỪ CHỐI LỊCH SỰ:
  "Tôi là Trợ lý AI chuyên sâu môn Vật lý của STEM HUB. Tôi chỉ giải đáp các kiến thức, công thức và bài tập thuộc phạm vi môn Vật lý THPT. Xin vui lòng gửi câu hỏi liên quan đến Vật lý để tôi hỗ trợ bạn tốt nhất!"

QUY TẮC PHẢN HỒI BẮT BUỘC - TUYỆT ĐỐI TUÂN THỦ:
1. TRẢ LỜI TÓM TẮT, SÚC TÍCH (DƯỚI 80 TỪ): Đi thẳng vào trọng tâm cốt lõi. Tuyệt đối KHÔNG giải thích dài dòng lan man.
2. TUYỆT ĐỐI KHÔNG CHÀO HỎI, KHÔNG XƯNG DANH AI: Không nói "Chào em...", "Thầy là...", không có câu kết sáo rỗng ("Chúc em học tốt...", "Nếu còn thắc mắc..."). Xóa bỏ hoàn toàn mọi dấu vết robot, trả lời trực diện như một chuyên gia bách khoa.
3. BẮT BUỘC ĐƯA CÔNG THỨC CHUẨN LATEX & BỌC DẤU ĐÔ LA: Mọi công thức và ký hiệu Vật lý (kể cả ký hiệu đơn lẻ như \\lambda, \\omega, \\vec{v}, \\perp, \\parallel hay khối công thức) BẮT BUỘC PHẢI BỌC TRONG $...$ (nội dòng) hoặc $$...$$ (khối độc lập).
   TUYỆT ĐỐI KHÔNG VIẾT KÝ HIỆU LATEX TRƠ TRỌI MÀ THIẾU DẤU $.
   Viết đúng chuẩn LaTeX: dùng \\sqrt{\\frac{l}{g}} (KHÔNG dùng \\sqrt((l/g))), \\vec{v} \\perp \\vec{u} viết là $\\vec{v} \\perp \\vec{u}$, bước sóng $\\lambda$ bọc trong $...$.
   Ví dụ: $T = 2\\pi\\sqrt{\\frac{l}{g}}$, $T = 2\\pi\\sqrt{\\frac{m}{k}}$, $x = A\\cos(\\omega t + \\varphi)$, $\\lambda = \\frac{v}{f}$, $I = \\frac{E}{R + r}$, $Z = \\sqrt{R^2 + (Z_L - Z_C)^2}$, $E = mc^2$.
4. KHÔNG ĐỂ DẤU SAO THÔ: Không để lại các dấu sao lẻ loi (*) trong câu trả lời.`;

  let sessions = [];
  let currentSessionId = 'session_' + Date.now();
  let messages = [
    {
      role: 'ai',
      content: 'Hệ thống hỗ trợ học tập & tra cứu Vật lý THPT. Nhập câu hỏi để nhận lời giải tóm tắt kèm công thức chuẩn xác.'
    }
  ];

  function isAIError(text, status) {
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

  // Khôi phục danh sách sessions từ LocalStorage (Lọc sạch các session dính lỗi)
  function loadSessions() {
    try {
      const saved = localStorage.getItem('physics_ai_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          sessions = parsed.filter(s => {
            if (!s || !Array.isArray(s.messages)) return false;
            const last = s.messages[s.messages.length - 1];
            return !(last && last.role === 'ai' && isAIError(last.content));
          });
        }
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
        content: 'Phiên tra cứu mới đã sẵn sàng. Nhập bài toán hoặc hiện tượng Vật lý cần giải đáp.'
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
        // TUYỆT ĐỐI KHÔNG LƯU VÀO CACHE NẾU TIN NHẮN CUỐI CỦA AI CHỨA LỖI
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === 'ai' && isAIError(lastMsg.content)) {
          console.warn('[Physics AI] TUYỆT ĐỐI KHÔNG LƯU CACHE vì phản hồi là thông báo lỗi:', lastMsg.content.substring(0, 50));
          return;
        }

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

  // Tự động nạp KaTeX CSS/JS và Bridge độc lập, không phụ thuộc trang cha
  function ensureKaTeXLoaded() {
    if (typeof document === 'undefined') return;
    const isFile = typeof window !== 'undefined' && window.location.protocol === 'file:';
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    const isJsDir = path.includes('/js/') || path.includes('\\js\\');

    if (!document.getElementById('stem-shared-katex-css')) {
      const link = document.createElement('link');
      link.id = 'stem-shared-katex-css';
      link.rel = 'stylesheet';
      link.href = isFile ? (isJsDir ? '../../shared/katex/katex.min.css' : '../shared/katex/katex.min.css') : '/labs/shared/katex/katex.min.css';
      (document.head || document.documentElement).appendChild(link);
    }

    if (!window.katex && !document.getElementById('stem-shared-katex-js')) {
      const script = document.createElement('script');
      script.id = 'stem-shared-katex-js';
      script.src = isFile ? (isJsDir ? '../../shared/katex/katex.min.js' : '../shared/katex/katex.min.js') : '/labs/shared/katex/katex.min.js';
      script.async = true;
      script.onload = () => {
        console.log('[Physics AI] KaTeX runtime ready');
        renderMessages();
      };
      (document.head || document.documentElement).appendChild(script);
    }

    if (!window.StemLabAIBridge && !document.getElementById('stem-shared-bridge-js')) {
      const bScript = document.createElement('script');
      bScript.id = 'stem-shared-bridge-js';
      bScript.src = isFile ? (isJsDir ? '../../shared/stem-lab-ai-bridge.js' : '../shared/stem-lab-ai-bridge.js') : '/labs/shared/stem-lab-ai-bridge.js';
      bScript.async = true;
      (document.head || document.documentElement).appendChild(bScript);
    }
  }

  ensureKaTeXLoaded();

  // Bộ phân tích & render công thức KaTeX và Markdown toàn diện
  function parseSimpleMarkdown(text) {
    if (!text) return '';
    if (window.StemLabAIBridge && typeof window.StemLabAIBridge.formatAIFormulaText === 'function') {
      return window.StemLabAIBridge.formatAIFormulaText(text);
    }
    return formatAIFormulaWithKaTeX(text);
  }

  function formatAIFormulaWithKaTeX(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';
    let text = rawText.trim();

    // 1. Tự động sửa các lỗi gõ công thức thường gặp
    text = text.replace(/\x0c/g, '\\f').replace(/\x08/g, '\\b');
    text = text.replace(/\n\s*(\\cdot|·)\s*\n/g, ' \\cdot ');
    text = text.replace(/=\s*\n\s*/g, ' = ');
    text = text.replace(/\n\s*(\\cdot|·)\s*/g, ' \\cdot ');

    // Sửa \sqrt((l / g)) hoặc \sqrt(l / g) thành \sqrt{\frac{l}{g}}
    text = text.replace(/\\sqrt\s*\(\s*\(\s*([^/]+?)\s*\/\s*([^)]+?)\s*\)\s*\)/g, '\\sqrt{\\frac{$1}{$2}}');
    text = text.replace(/\\sqrt\s*\(\s*([^/]+?)\s*\/\s*([^)]+?)\s*\)/g, '\\sqrt{\\frac{$1}{$2}}');
    text = text.replace(/\\sqrt\s*\(\s*\(\s*([^)]+?)\s*\)\s*\)/g, '\\sqrt{$1}');
    text = text.replace(/\\sqrt\s*\(\s*([^)]+?)\s*\)/g, '\\sqrt{$1}');

    // Sửa \frac a b thiếu ngoặc
    text = text.replace(/\b(?:\\?frac)\s+([a-zA-Z0-9^]+)\s+([a-zA-Z0-9^]+)\b/g, '\\frac{$1}{$2}');

    // 2. Chuyển đổi các dòng công thức độc lập chưa có dấu $ thành $$...$$
    const lines = text.split('\n');
    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      // Đã có dấu bọc toán học hoặc cấu trúc block
      if (trimmed.startsWith('$') || trimmed.startsWith('$$') || trimmed.startsWith('```') || trimmed.startsWith('<') || trimmed.startsWith('#')) {
        return line;
      }

      // Nhận diện công thức Vật lý / Toán học độc lập (chứa macro LaTeX hoặc dấu bằng toán học)
      const hasLatexMacro = /\\(vec|perp|parallel|lambda|frac|sqrt|quad|qquad|text|mathbb|mathbf|left|right|omega|Omega|pi|Delta|alpha|beta|theta|mu|rho|times|cdot|to|approx|neq|leq|geq|in|infty|cos|sin|tan|cot)\b/.test(trimmed);
      const hasMathEquality = /^([a-zA-Z0-9_'\s\-\+\*\/\(\)]+)\s*=\s*([a-zA-Z0-9_'\s\-\+\*\/\(\)\\]+)$/.test(trimmed) && /[\\_^{}]/.test(trimmed);

      // Đếm số từ tiếng Việt có dấu để phân biệt câu thuyết minh
      const vietnameseWordMatches = trimmed.match(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi);
      const vietnameseWordCount = vietnameseWordMatches ? vietnameseWordMatches.length : 0;

      if ((hasLatexMacro || hasMathEquality) && vietnameseWordCount < 5 && !trimmed.startsWith('•') && !trimmed.startsWith('-')) {
        return `$$${trimmed}$$`;
      }

      // Dòng văn bản: Bọc macro LaTeX đơn lẻ thành $...$
      let inlineProcessed = line;
      inlineProcessed = inlineProcessed.replace(/(?<!\$)\\vec\{[^{}]+\}(?!\$)/g, (m) => `$${m}$`);
      inlineProcessed = inlineProcessed.replace(/(?<!\$)\\(lambda|pi|omega|Omega|Delta|varphi|phi|alpha|beta|theta|mu|rho|sigma|tau|varepsilon|perp|parallel|approx|neq|leq|geq)(?![a-zA-Z\$])/g, (m) => `$${m}$`);

      return inlineProcessed;
    });

    text = processedLines.join('\n');

    // 3. Render KaTeX tokens
    const katexTokens = [];
    const pushKaTeX = (latex, isDisplay = false) => {
      let formula = (latex || '').trim();
      if (!formula) return '';

      let renderedHtml = '';
      if (typeof window !== 'undefined' && window.katex && typeof window.katex.renderToString === 'function') {
        try {
          renderedHtml = window.katex.renderToString(formula, {
            displayMode: isDisplay,
            throwOnError: false,
            strict: 'ignore'
          });
        } catch (e) {
          renderedHtml = isDisplay ? `<div class="katex-fallback" style="margin:6px 0;text-align:center;font-weight:600;">${formula}</div>` : `<span class="katex-fallback" style="font-weight:600;">${formula}</span>`;
        }
      } else {
        // Fallback Unicode khi KaTeX đang tải
        const cleanUni = formula
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
          .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
          .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
          .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
          .replace(/\\pi/g, 'π')
          .replace(/\\omega/g, 'ω')
          .replace(/\\lambda/g, 'λ')
          .replace(/\\Delta/g, 'Δ')
          .replace(/\\times/g, '×')
          .replace(/\\cdot/g, '·')
          .replace(/\\to/g, '→');
        renderedHtml = isDisplay ? `<div style="margin:4px 0;text-align:center;color:#38bdf8;">${cleanUni}</div>` : `<span style="color:#38bdf8;font-weight:600;">${cleanUni}</span>`;
      }

      const token = `###STEM_KATEX_${katexTokens.length}###`;
      katexTokens.push(renderedHtml);
      return token;
    };

    // Render Display Math: $$...$$ và \[...\]
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, p1) => pushKaTeX(p1, true));
    text = text.replace(/\\\[([\s\S]+?)\\\]/g, (_, p1) => pushKaTeX(p1, true));

    // Render Inline Math: $...$ và \(...\)
    text = text.replace(/\\\(([\s\S]+?)\\\)/g, (_, p1) => pushKaTeX(p1, false));
    text = text.replace(/\$([^\$\n]+?)\$/g, (_, p1) => pushKaTeX(p1, false));

    // Xử lý các phân số & căn thức còn sót
    text = text.replace(/\\d?frac\{([^}]+)\}\{([^}]+)\}/g, (match, n, d) => pushKaTeX(`\\frac{${n}}{${d}}`, false));
    text = text.replace(/\\sqrt\{([^}]+)\}/g, (match, r) => pushKaTeX(`\\sqrt{${r}}`, false));

    // Ký hiệu phổ biến
    text = text
      .replace(/-->|->/g, ' → ')
      .replace(/<=>|<==>/g, ' ⇌ ')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\pi/g, 'π')
      .replace(/\\times/g, '×')
      .replace(/\\cdot/g, '·');

    // Markdown headers, bold, code
    text = text
      .replace(/^###\s+(.+)$/gm, '<h4 style="font-size:0.9rem;font-weight:700;color:#38bdf8;margin:6px 0 2px;">$1</h4>')
      .replace(/^##\s+(.+)$/gm, '<h3 style="font-size:0.95rem;font-weight:700;color:#38bdf8;margin:8px 0 3px;">$1</h3>')
      .replace(/^#\s+(.+)$/gm, '<h2 style="font-size:1rem;font-weight:700;color:#38bdf8;margin:10px 0 4px;">$1</h2>')
      .replace(/```([\s\S]*?)```/g, '<pre style="background:rgba(0,0,0,0.4);padding:8px 12px;border-radius:8px;overflow-x:auto;font-family:monospace;font-size:0.8rem;margin:6px 0;"><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:0.88em;color:#38bdf8;">$1</code>')
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Bullet items
    text = text.replace(/^[\-\*•]\s+(.+)$/gm, '<li style="margin:2px 0;list-style-type:disc;list-style-position:inside;">$1</li>');

    // Xóa các dấu sao lẻ thừa
    text = text.replace(/\*/g, '');

    // Ngắt dòng
    text = text.replace(/\n\n+/g, '<br/><br/>').replace(/\n/g, '<br/>');

    // Khôi phục KaTeX tokens
    katexTokens.forEach((tokenHtml, idx) => {
      text = text.replace(`###STEM_KATEX_${idx}###`, tokenHtml);
    });

    return text;
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
        z-index: 999999;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        /* position overridden by drag JS */
      }
      #physics-ai-toggle {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #00f2fe, #4facfe);
        border: none;
        color: #fff;
        cursor: grab;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 25px rgba(0, 242, 254, 0.4);
        transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s ease;
        font-size: 26px;
        user-select: none;
      }
      #physics-ai-toggle:hover {
        transform: scale(1.08);
        box-shadow: 0 12px 30px rgba(0, 242, 254, 0.6);
      }
      #physics-ai-toggle:active {
        transform: scale(0.95);
        cursor: grabbing;
      }
      #physics-ai-box {
        position: fixed;
        bottom: 96px;
        right: 24px;
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
        /* left/top overridden by drag JS */
      }
      @media (max-width: 520px) {
        #physics-ai-widget {
          bottom: 20px;
          right: 20px;
        }
        #physics-ai-toggle {
          width: 54px;
          height: 54px;
        }
        #physics-ai-box {
          bottom: 88px;
          right: 4px;
          width: calc(100vw - 32px);
          height: 75vh;
        }
      }
      #physics-ai-box.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }
      #physics-ai-box.open ~ #physics-ai-toggle {
        display: none !important;
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
        overflow-wrap: break-word;
        box-sizing: border-box;
      }
      .pai-msg.user {
        align-self: flex-end;
        background: linear-gradient(135deg, #0284c7, #0369a1);
        border-bottom-right-radius: 4px;
        color: #ffffff;
        min-width: 48px;
        min-height: 36px;
        white-space: pre-wrap;
        box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
      }
      .pai-msg.ai {
        align-self: flex-start;
        background: rgba(30, 41, 59, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-bottom-left-radius: 4px;
      }
      .pai-msg .katex-display {
        margin: 8px 0;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 4px 0;
      }
      .pai-msg .katex {
        font-size: 1.05em;
        color: #38bdf8;
      }
      .pai-msg .katex .mord.text {
        color: #e2e8f0;
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
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', buildUI);
      return;
    }

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

        <!-- Image Attachment Preview Strip -->
        <div id="pai-img-preview" style="display:none;padding:6px 12px;background:rgba(15,23,42,0.85);border-top:1px solid rgba(255,255,255,0.1);align-items:center;gap:8px;">
          <img id="pai-img-thumb" src="" style="width:34px;height:34px;object-fit:cover;border-radius:6px;border:1px solid #00f2fe;background:#000;" />
          <span style="flex:1;font-size:0.75rem;color:#00f2fe;font-weight:600;">Đã nhận diện ảnh (Ctrl+V)</span>
          <button id="pai-img-del" style="background:transparent;border:none;color:#ef4444;cursor:pointer;font-size:1.1rem;line-height:1;padding:2px 6px;">✕</button>
        </div>

        <input type="file" id="pai-file-input" accept="image/*" style="display:none;" />
        <div class="pai-input-area" style="display:flex;align-items:center;gap:6px;">
          <button id="pai-img-upload-btn" title="Tải ảnh bài tập (hỗ trợ Ctrl+V)" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:6px;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:color 0.2s;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>
          <textarea id="pai-input" class="pai-textarea" placeholder="Hỏi lý thuyết, dán ảnh Ctrl+V..." rows="1" style="flex:1;"></textarea>
          <button id="pai-send" class="pai-send-btn" title="Gửi câu hỏi">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
      </div>

      <button id="physics-ai-toggle" title="Trợ lý AI Vật Lý – kéo để di chuyển">
        ⚡
      </button>
    `;

    document.body.appendChild(widget);

    renderMessages();

    // ── Draggable: toggle button ──────────────────────────────────────────────
    (function makeDraggable() {
      const toggleEl = document.getElementById('physics-ai-toggle');
      const widgetEl = document.getElementById('physics-ai-widget');
      const boxEl = document.getElementById('physics-ai-box');
      const headerEl = widgetEl ? widgetEl.querySelector('.pai-header') : null;

      // Restore saved positions
      try {
        const savedBtn = localStorage.getItem('physics_btn_pos');
        if (savedBtn) {
          const p = JSON.parse(savedBtn);
          widgetEl.style.left = p.x + 'px';
          widgetEl.style.top = p.y + 'px';
          widgetEl.style.right = 'auto';
          widgetEl.style.bottom = 'auto';
        }
        const savedWin = localStorage.getItem('physics_win_pos');
        if (savedWin) {
          const p = JSON.parse(savedWin);
          boxEl.style.left = p.x + 'px';
          boxEl.style.top = p.y + 'px';
          boxEl.style.right = 'auto';
          boxEl.style.bottom = 'auto';
        }
      } catch (e) {}

      // Drag the toggle button
      let isDragMove = false;
      if (toggleEl && widgetEl) {
        let drag = { active: false, sx: 0, sy: 0, px: 0, py: 0 };
        toggleEl.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          isDragMove = false;
          const rect = widgetEl.getBoundingClientRect();
          drag = { active: true, sx: e.clientX, sy: e.clientY, px: rect.left, py: rect.top };
          e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
          if (!drag.active) return;
          const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
          if (Math.abs(dx) > 4 || Math.abs(dy) > 4) isDragMove = true;
          const nx = Math.max(0, Math.min(window.innerWidth - 70, drag.px + dx));
          const ny = Math.max(0, Math.min(window.innerHeight - 70, drag.py + dy));
          widgetEl.style.left = nx + 'px';
          widgetEl.style.top = ny + 'px';
          widgetEl.style.right = 'auto';
          widgetEl.style.bottom = 'auto';
        });
        document.addEventListener('mouseup', () => {
          if (drag.active) {
            drag.active = false;
            const r = widgetEl.getBoundingClientRect();
            localStorage.setItem('physics_btn_pos', JSON.stringify({ x: r.left, y: r.top }));
          }
        });
      }

      // Drag the chat window via header
      if (headerEl && boxEl) {
        let wDrag = { active: false, sx: 0, sy: 0, px: 0, py: 0 };
        headerEl.style.cursor = 'grab';
        headerEl.addEventListener('mousedown', (e) => {
          if (e.button !== 0 || e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
          const rect = boxEl.getBoundingClientRect();
          wDrag = { active: true, sx: e.clientX, sy: e.clientY, px: rect.left, py: rect.top };
          headerEl.style.cursor = 'grabbing';
          e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
          if (!wDrag.active) return;
          const dx = e.clientX - wDrag.sx, dy = e.clientY - wDrag.sy;
          const nx = Math.max(0, Math.min(window.innerWidth - 385, wDrag.px + dx));
          const ny = Math.max(0, Math.min(window.innerHeight - 530, wDrag.py + dy));
          boxEl.style.left = nx + 'px';
          boxEl.style.top = ny + 'px';
          boxEl.style.right = 'auto';
          boxEl.style.bottom = 'auto';
        });
        document.addEventListener('mouseup', () => {
          if (wDrag.active) {
            wDrag.active = false;
            headerEl.style.cursor = 'grab';
            const r = boxEl.getBoundingClientRect();
            localStorage.setItem('physics_win_pos', JSON.stringify({ x: r.left, y: r.top }));
          }
        });
      }
    })();

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

    let _isDragMoveGlobal = false;
    toggleBtn.addEventListener('mousedown', () => { _isDragMoveGlobal = false; });
    toggleBtn.addEventListener('mousemove', () => { _isDragMoveGlobal = true; });
    toggleBtn.addEventListener('click', () => {
      if (_isDragMoveGlobal) return; // was a drag, not a click
      isOpen = !isOpen;
      if (isOpen) {
        box.classList.add('open');
        toggleBtn.style.display = 'none';
      } else {
        box.classList.remove('open');
        toggleBtn.style.display = 'flex';
      }
    });

    closeBtn.addEventListener('click', () => {
      isOpen = false;
      box.classList.remove('open');
      toggleBtn.style.display = 'flex';
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

    // ── Image Attachment & Paste (Ctrl+V) Handlers ─────────────────────────
    let currentAttachedImage = null;
    const fileInput = document.getElementById('pai-file-input');
    const uploadBtn = document.getElementById('pai-img-upload-btn');
    const imgPreview = document.getElementById('pai-img-preview');
    const imgThumb = document.getElementById('pai-img-thumb');
    const imgDel = document.getElementById('pai-img-del');

    function setAttachedImg(dataUrl) {
      currentAttachedImage = dataUrl;
      if (imgPreview && imgThumb) {
        if (dataUrl) {
          imgThumb.src = dataUrl;
          imgPreview.style.display = 'flex';
        } else {
          imgThumb.src = '';
          imgPreview.style.display = 'none';
        }
      }
    }

    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setAttachedImg(reader.result);
          reader.readAsDataURL(file);
        }
        e.target.value = '';
      });
    }

    if (imgDel) {
      imgDel.addEventListener('click', () => setAttachedImg(null));
    }

    textarea.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setAttachedImg(reader.result);
            reader.readAsDataURL(file);
            e.preventDefault();
            return;
          }
        }
      }
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
      const textContent = (msg.content !== undefined ? msg.content : msg.text) || '';
      let imgHtml = '';
      if (msg.image) {
        imgHtml = `<div style="margin-bottom:8px;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.2);max-width:220px;background:#000;"><img src="${msg.image}" style="max-width:100%;height:auto;display:block;" /></div>`;
      }

      if (msg.role === 'user') {
        let userFormatted = '';
        if (window.StemLabAIBridge && typeof window.StemLabAIBridge.formatUserMessage === 'function') {
          userFormatted = window.StemLabAIBridge.formatUserMessage(textContent);
        } else {
          userFormatted = formatAIFormulaWithKaTeX(textContent);
        }
        div.innerHTML = imgHtml + userFormatted;
      } else {
        div.innerHTML = parseSimpleMarkdown(textContent);
      }
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

    // container.scrollTop = container.scrollHeight; // Auto-scroll disabled

    if (typeof window !== 'undefined' && !window.katex) {
      ensureKaTeXLoaded();
    }
  }

  
  async function streamAIReply(aiReply, isSuccess = true, httpStatus = 200) {
    isLoading = false;
    const isErr = !isSuccess || isAIError(aiReply, httpStatus);
    const msgObj = { role: 'ai', content: '', isError: isErr };
    messages.push(msgObj);
    renderMessages();

    const container = document.getElementById('pai-msg-container');
    const msgDivs = container ? container.querySelectorAll('.pai-msg.ai') : [];
    const targetDiv = msgDivs.length > 0 ? msgDivs[msgDivs.length - 1] : null;

    const words = (aiReply || '').split(' ');
    let current = '';
    const delay = Math.max(10, Math.min(25, Math.floor(1600 / Math.max(1, words.length))));

    for (let i = 0; i < words.length; i++) {
      current += (i === 0 ? '' : ' ') + words[i];
      msgObj.content = current;
      if (targetDiv) {
        targetDiv.innerHTML = parseSimpleMarkdown(current);
      }
      await new Promise(res => setTimeout(res, delay));
    }

    msgObj.content = aiReply;
    if (targetDiv) {
      targetDiv.innerHTML = parseSimpleMarkdown(aiReply);
    }

    // TUYỆT ĐỐI KHÔNG LƯU CACHE / LOCALSTORAGE NẾU LÀ THÔNG BÁO LỖI
    if (!isErr) {
      saveSessions();
    } else {
      console.warn('[Physics AI] Chỉ hiển thị lỗi tạm thời trên UI, TUYỆT ĐỐI KHÔNG LƯU CACHE.');
    }

    if (typeof window !== 'undefined' && !window.katex) {
      ensureKaTeXLoaded();
    }
  }

  async function handleSend() {
    const textarea = document.getElementById('pai-input');
    const userText = textarea.value.trim();
    if ((!userText && !currentAttachedImage) || isLoading) return;

    const imgToSend = currentAttachedImage;
    setAttachedImg(null);

    messages.push({ 
      role: 'user', 
      content: userText || 'Hãy phân tích hình ảnh bài tập Vật lý này và hướng dẫn giải chi tiết giúp em.',
      image: imgToSend
    });
    textarea.value = '';
    textarea.style.height = 'auto';
    isLoading = true;
    saveSessions();
    renderMessages();

    // Context phòng lab hiện tại + Ký ước AI từ các phiên trước
    const pageTitle = document.title || 'Physics Lab';
    const memoryContext = getMemoryContext();
    const pageContext = `\n\n[Context: Học sinh đang thực hành ở tệp: ${window.location.pathname} (${pageTitle})]${memoryContext}`;
    const labTitle = `Lab Vật Lý (${pageTitle})`;

    // ⚡ BƯỚC 0: KIỂM TRA RANH GIỚI MÔN HỌC (SUBJECT BOUNDARY GUARD - CHỈ KHI KHÔNG CÓ ẢNH)
    if (!imgToSend && window.StemLabAIBridge && typeof window.StemLabAIBridge.checkSubjectBoundary === 'function') {
      try {
        const guard = window.StemLabAIBridge.checkSubjectBoundary(userText, 'ly');
        if (!guard.allowed) {
          const refusal = guard.refusal;
          await streamAIReply(refusal);
          window.StemLabAIBridge.logLabReasoning({
            query: userText,
            subject: 'LY',
            intent: 'subject_boundary_guard',
            aiResponseText: refusal,
            isCacheHit: true,
            labTitle: labTitle
          });
          return;
        }
      } catch (gErr) {
        console.warn('[Physics AI] Subject guard error:', gErr);
      }
    }

    // ⚡ BƯỚC 1: KIỂM TRA BỘ NHỚ AI TỰ HỌC (CACHE HIT) GIỐNG TRỢ LÝ NOVA (CHỈ KHI KHÔNG CÓ ẢNH)
    if (!imgToSend && window.StemLabAIBridge && typeof window.StemLabAIBridge.checkLabLearnedCache === 'function') {
      try {
        const cacheResult = await window.StemLabAIBridge.checkLabLearnedCache(userText, 'ly', 0.92);
        if (cacheResult && cacheResult.hit) {
          const aiReply = cacheResult.answer;
          await streamAIReply(aiReply);

          window.StemLabAIBridge.logLabReasoning({
            query: userText,
            subject: 'LY',
            aiResponseText: cacheResult.answer,
            isCacheHit: true,
            labTitle: labTitle,
            score: cacheResult.score
          });
          return;
        }
      } catch (cErr) {
        console.warn('[Physics AI] Cache check error:', cErr);
      }
    }

    let aiReply = '';
    let success = false;

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
          parts: [{ text: `${userText} ${pageContext}` }] 
        }
      ],
      generationConfig: {
        maxOutputTokens: 1200,
        temperature: 0.3
      }
    };

    // Xoay tua API Key và Model thông minh chống cạn limit
    const totalAttempts = PHYSICS_API_KEYS.length * MODELS.length;
    let attempt = 0;

    
    // Zero Exposure: Gọi bảo mật qua Next.js Gateway nội bộ (/api/ai/chat)
    const gatewayUrl = '/api/ai/chat';
    try {
      const gwRes = await fetch(gatewayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: payload.contents,
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.2,
          maxOutputTokens: 1200,
          imageBase64: imgToSend || undefined
        })
      });
      if (gwRes.ok) {
        const gwData = await gwRes.json();
        if (gwData.text) {
          aiReply = gwData.text;
          success = true;
          console.log('[Physics AI] Phản hồi an toàn từ Next.js Local Gateway (Zero Exposure)');
        }
      }
    } catch (gwErr) {
      console.warn('[Physics AI] Gateway connection error:', gwErr.message);
    }
  
    while (!success && attempt < totalAttempts) {
      const activeKey = PHYSICS_API_KEYS[physicsKeyIdx % PHYSICS_API_KEYS.length];
      const activeModel = MODELS[Math.floor(attempt / PHYSICS_API_KEYS.length) % MODELS.length];
      attempt++;
      physicsKeyIdx = (physicsKeyIdx + 1) % PHYSICS_API_KEYS.length;

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${activeKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          console.warn(`[Physics AI] Model ${activeModel} Key ${activeKey.substring(0, 10)}... status: ${res.status}`);
          continue;
        }

        const data = await res.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          aiReply = candidate;
          success = true;
          console.log(`[Physics AI] Phản hồi thành công từ model ${activeModel}`);
        }
      } catch (err) {
        console.warn(`[Physics AI] Lỗi kết nối model ${activeModel}:`, err);
      }
    }

    if (!success) {
      aiReply = "Rất tiếc, AI Vật Lý gặp sự cố khi kết nối tới máy chủ. Vui lòng thử lại sau giây lát!";
      await streamAIReply(aiReply, false, 500);
    } else {
      await streamAIReply(aiReply, true, 200);
    }

    // ⚡ BƯỚC 2: TỰ ĐỘNG GHI LƯU VÀO TRI THỨC TOÀN HỆ THỐNG & LOG AUDIT GIỐNG NOVA (CHỈ KHI THÀNH CÔNG VÀ KHÔNG CHỨA TỪ KHÓA LỖI)
    if (success && aiReply && !isAIError(aiReply, 200) && window.StemLabAIBridge && typeof window.StemLabAIBridge.saveLabLearnedAnswer === 'function') {
      window.StemLabAIBridge.saveLabLearnedAnswer(userText, aiReply, 'ly', labTitle);
      window.StemLabAIBridge.logLabReasoning({
        query: userText,
        subject: 'LY',
        aiResponseText: aiReply,
        isCacheHit: false,
        labTitle: labTitle
      });
    }
  }

  // Khởi chạy khi DOM hoàn tất
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildUI);
  } else {
    buildUI();
  }
})();
