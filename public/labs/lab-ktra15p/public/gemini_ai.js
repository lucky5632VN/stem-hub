/* ——— GEMINI AI INTEGRATION ——— */
// Hệ thống Multi-Key Rotation & Model Rotation cho AI Chỉ huy & AI Chung
const COMMANDER_API_KEYS = []; // Managed by Cloudflare Gateway
let commanderKeyIdx = 0;

const GENERAL_API_KEYS = []; // Managed by Cloudflare Gateway
let generalKeyIdx = 0;
let GEMINI_API_KEY = COMMANDER_API_KEYS[0];

class UnifiedChatbot {
  constructor() {
    this.labSessions = [];
    this.genSessions = [];
    this.currentLabSessionId = 'session_lab_' + Date.now();
    this.currentGenSessionId = 'session_gen_' + Date.now();

    this.labHistory = [];
    this.genHistory = [];
    this.isTyping = false;
    this.currentMode = 'lab'; // 'lab' or 'gen'
    this.activeBot = 'lab';
    this.lastReactionData = null;
    this.availableModels = [];
    this.workingModel = null;
    this.isDrawerOpen = false;
    this.attachedImage = null;
    this.init();
  }

  setAttachedImage(dataUrl) {
    this.attachedImage = dataUrl;
    const preview = document.getElementById('chatbot-img-preview');
    const thumb = document.getElementById('chatbot-preview-thumb');
    if (preview && thumb) {
      thumb.src = dataUrl;
      preview.style.display = 'flex';
    }
  }

  clearAttachedImage() {
    this.attachedImage = null;
    const preview = document.getElementById('chatbot-img-preview');
    const thumb = document.getElementById('chatbot-preview-thumb');
    const fileInput = document.getElementById('chatbot-file-input');
    if (preview) preview.style.display = 'none';
    if (thumb) thumb.src = '';
    if (fileInput) fileInput.value = '';
  }

  init() {
    console.log("🛠️ [Quantum AI] Khởi tạo Chatbot...");
    this.loadSessions();
    this.injectHTML();
    this.addEventListeners();
    this.initDragWindow();
    this.switchBot(this.activeBot);
    this.renderSessionsList();
    this.discoverModels().then(available => {
      if (available && available.length > 0) {
        this.availableModels = available;
        console.log("🔍 [Quantum AI] Mô hình khả dụng:", available.join(', '));
      }
    });
    console.log("✅ [Quantum AI] Chatbot đã sẵn sàng!");
  }

  isAIError(text, status) {
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

  loadSessions() {
    try {
      const savedLab = localStorage.getItem('quantum_lab_sessions');
      if (savedLab) {
        const parsed = JSON.parse(savedLab) || [];
        this.labSessions = parsed.filter(s => {
          if (!s || !Array.isArray(s.history)) return false;
          const last = s.history[s.history.length - 1];
          return !(last && last.role === 'ai' && this.isAIError(last.text));
        });
      }
      const savedGen = localStorage.getItem('quantum_gen_sessions');
      if (savedGen) {
        const parsed = JSON.parse(savedGen) || [];
        this.genSessions = parsed.filter(s => {
          if (!s || !Array.isArray(s.history)) return false;
          const last = s.history[s.history.length - 1];
          return !(last && last.role === 'ai' && this.isAIError(last.text));
        });
      }
    } catch (e) {}

    // Tạo phiên chat mới khi vào lab
    this.startNewSession('lab', false);
    this.startNewSession('gen', false);
  }

  startNewSession(botId, shouldRender = true) {
    if (botId === 'lab') {
      this.currentLabSessionId = 'session_lab_' + Date.now();
      this.labHistory = [];
      const welcome = 'Chào mừng đến với Trung tâm Chỉ huy Quantum. Tôi đã **ghi nhớ tiến trình học tập** của bạn. Bạn cần tôi giải thích điều gì?';
      this.labHistory.push({ role: 'ai', text: welcome });
    } else {
      this.currentGenSessionId = 'session_gen_' + Date.now();
      this.genHistory = [];
      const welcome = 'Xin chào! Tôi là Trợ lý AI Hóa học. Tôi đã **ghi nhớ tiến trình học tập** của bạn ở các phiên trước. Bạn có câu hỏi nào mới không?';
      this.genHistory.push({ role: 'ai', text: welcome });
    }
    if (shouldRender) {
      this.switchBot(this.activeBot);
      this.renderSessionsList();
    }
  }

  saveSessions(botId) {
    try {
      const history = botId === 'lab' ? this.labHistory : this.genHistory;
      const userMsgs = history.filter(m => m.role === 'user');
      if (userMsgs.length === 0) return;

      // TUYỆT ĐỐI KHÔNG LƯU VÀO CACHE NẾU TIN NHẮN CUỐI CỦA AI CHỨA LỖI
      const lastMsg = history[history.length - 1];
      if (lastMsg && lastMsg.role === 'ai' && this.isAIError(lastMsg.text)) {
        console.warn('[Quantum AI] TUYỆT ĐỐI KHÔNG LƯU CACHE vì phản hồi là thông báo lỗi:', lastMsg.text.substring(0, 50));
        return;
      }

      const title = userMsgs[0].text.substring(0, 32) + (userMsgs[0].text.length > 32 ? '...' : '');
      const dateStr = new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
      const currentId = botId === 'lab' ? this.currentLabSessionId : this.currentGenSessionId;
      const sessionList = botId === 'lab' ? this.labSessions : this.genSessions;

      const existingIdx = sessionList.findIndex(s => s.id === currentId);
      const sessionObj = {
        id: currentId,
        title: title,
        date: dateStr,
        history: [...history]
      };

      if (existingIdx >= 0) {
        sessionList[existingIdx] = sessionObj;
      } else {
        sessionList.unshift(sessionObj);
      }

      if (sessionList.length > 20) sessionList.splice(20);

      if (botId === 'lab') {
        localStorage.setItem('quantum_lab_sessions', JSON.stringify(this.labSessions));
      } else {
        localStorage.setItem('quantum_gen_sessions', JSON.stringify(this.genSessions));
      }

      this.renderSessionsList();
    } catch (e) {}
  }

  getMemoryContext(botId) {
    const sessionList = botId === 'lab' ? this.labSessions : this.genSessions;
    if (!sessionList || sessionList.length === 0) return '';

    const memoryFacts = [];
    sessionList.forEach(s => {
      s.history.forEach(m => {
        if (m.role === 'user') {
          const text = m.text.trim();
          const nameMatch = text.match(/(tôi là|tên tôi là|mình là|tớ là|tôi tên là)\s+([A-Za-z0-9_À-ỹ\s]+)/i);
          if (nameMatch && nameMatch[2]) {
            memoryFacts.unshift(`Tên người dùng: ${nameMatch[2].trim()}`);
          } else if (text.length > 3) {
            memoryFacts.push(text.substring(0, 45));
          }
        }
      });
    });

    const uniqueFacts = [...new Set(memoryFacts)].slice(0, 10);
    if (uniqueFacts.length === 0) return '';

    return `\n\n[BỘ NHỚ GHI NHỚ & HỌC HỎI CỦA AI TỪ CÁC PHIÊN TRƯỚC]:
- Thông tin đã ghi nhớ về người dùng: ${uniqueFacts.join('; ')}
- NGUYÊN TẮC HỌC HỎI: Bạn LÀ AI CÓ KHẢ NĂNG GHI NHỚ VÀ HỌC HỎI từ các phiên trước. Khi người dùng hỏi "bạn biết tôi là ai không", "tôi tên gì", "bạn nhớ gì về tôi", BẮT BUỘC dùng thông tin trong bộ nhớ trên và lịch sử chat để trả lời chính xác, thân thiện (Ví dụ: "Bạn là Lucky! Tôi đã ghi nhớ tên bạn từ các phiên trước..."). TUYỆT ĐỐI KHÔNG trả lời "tôi không có khả năng ghi nhớ cá nhân".`;
  }

  injectHTML() {
    const old = document.getElementById('unified-chatbot-container');
    if (old) old.remove();

    const container = document.createElement('div');
    container.id = 'unified-chatbot-container';
    container.className = 'chatbot-container';

    container.innerHTML = `
      <div id="chatbot-notification" class="chatbot-notification" style="display: none;">!</div>
      <button id="chatbot-toggle" class="chatbot-toggle" title="Trợ lý AI Hóa học – kéo để di chuyển" style="display: flex; align-items: center; justify-content: center; width: 58px; height: 58px; border-radius: 50%; background: linear-gradient(135deg, #00ffcc, #38bdf8); border: none; color: #fff; box-shadow: 0 8px 25px rgba(56, 189, 248, 0.45); cursor: grab; position: fixed; bottom: 24px; right: 24px; z-index: 10001; font-size: 26px; user-select: none;">
        🧪
      </button>
      
      <div id="chatbot-window" class="chatbot-window" style="width: 380px; height: 560px; display: none; flex-direction: column; position: fixed; bottom: 20px; right: 20px; z-index: 10000;">
        <!-- HISTORY DRAWER OVERLAY -->
        <div id="quantum-history-drawer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.98); backdrop-filter: blur(20px); z-index: 100; display: flex; flex-direction: column; transform: translateX(-100%); transition: transform 0.3s ease; padding: 14px; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <div style="font-weight:700; color:#38bdf8; font-size: 13px; display: flex; align-items: center; gap: 6px; font-family: 'Orbitron', sans-serif;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              LỊCH SỬ & HỌC HỎI
            </div>
            <button id="quantum-drawer-close" style="background:transparent; border:none; color:#94a3b8; cursor:pointer; padding:4px;">✕</button>
          </div>
          <button id="quantum-new-session-drawer-btn" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(56,189,248,0.15); border: 1px solid rgba(56,189,248,0.4); color: #38bdf8; font-weight: bold; font-size: 11px; cursor: pointer; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 6px;">
            ➕ Tạo đoạn chat mới
          </button>
          <div id="quantum-sessions-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;"></div>
        </div>

        <!-- TABS NAVIGATION -->
        <div class="chatbot-modes" style="display: flex; background: rgba(15, 23, 42, 0.8); border-bottom: 1px solid var(--chat-border); padding: 6px 6px 0 6px; gap: 4px;">
          <button onclick="switchChatMode('lab')" id="tab-mode-lab" style="flex: 1; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); border-bottom: none; padding: 10px 4px; border-radius: 8px 8px 0 0; font-family: 'Orbitron', sans-serif; font-size: 10px; font-weight: bold; cursor: pointer; transition: all 0.2s;">⚡ CHỈ HUY</button>
          <button onclick="switchChatMode('gen')" id="tab-mode-gen" style="flex: 1; background: transparent; color: #94a3b8; border: 1px solid transparent; border-bottom: none; padding: 10px 4px; border-radius: 8px 8px 0 0; font-family: 'Orbitron', sans-serif; font-size: 10px; font-weight: bold; cursor: pointer; transition: all 0.2s;">🌐 TRỢ LÝ CHUNG</button>
        </div>

        <!-- SECTION 1: AI ASSISTANTS -->
        <div id="chat-section-ai" style="display: flex; flex-direction: column; flex: 1; overflow: hidden;">
          <div class="chat-header" style="padding: 10px 15px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <div class="status-dot"></div>
              <h3 style="margin:0; font-size: 12px; letter-spacing: 0.5px;" id="chatbot-title">⚡ CHỈ HUY AI</h3>
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
              <button id="quantum-new-btn" title="Tạo đoạn chat mới" style="background:rgba(56,189,248,0.15); border:1px solid rgba(56,189,248,0.4); color:#38bdf8; cursor:pointer; padding:4px 8px; border-radius:6px; display:flex; align-items:center; gap:4px; font-size:11px; font-weight:600;">
                ➕ Chat mới
              </button>
              <button id="quantum-history-btn" title="Lịch sử & Học hỏi" style="background:rgba(56,189,248,0.15); border:1px solid rgba(56,189,248,0.4); color:#38bdf8; cursor:pointer; padding:4px 8px; border-radius:6px; display:flex; align-items:center; gap:4px; font-size:11px; font-weight:600;">
                📜 Lịch sử
              </button>
              <button id="quantum-close-btn" title="Đóng khung chat" style="background:transparent; border:none; color:#94a3b8; cursor:pointer; padding:4px 6px; border-radius:6px; display:flex; align-items:center; font-size:15px; transition:color 0.2s;" onmouseenter="this.style.color='#f87171'" onmouseleave="this.style.color='#94a3b8'">
                ✕
              </button>
            </div>
          </div>

          <div id="api-config-panel" style="display:none; padding:12px; background:rgba(15,23,42,0.95); border-bottom:1px solid rgba(56,189,248,0.2); font-family: 'Inter', sans-serif;">
            <label style="display:block; margin-bottom:6px; color:#38bdf8; font-size:11px; font-weight:bold; letter-spacing:0.5px;">🔑 CẤU HÌNH GEMINI API KEY:</label>
            <div style="display:flex; gap:6px;">
              <input type="password" id="manual-api-key" placeholder="AIza..." style="flex:1; background:#000; border:1px solid rgba(255,255,255,0.1); color:#fff; padding:6px; border-radius:4px; font-size:11px;">
              <button id="save-api-key" style="background:#38bdf8; border:none; color:#000; padding:0 12px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:11px;">LƯU</button>
            </div>
          </div>

          <div id="chatbot-messages" class="chat-messages"></div>
          <div class="typing-indicator" id="chatbot-typing">AI đang phân tích dữ liệu...</div>

          <div id="chatbot-img-preview" style="display:none; padding:6px 12px; background:rgba(30,41,59,0.9); border-top:1px solid rgba(56,189,248,0.2); align-items:center; gap:8px;">
            <img id="chatbot-preview-thumb" src="" style="width:36px; height:36px; object-fit:cover; border-radius:4px; border:1px solid #38bdf8;" />
            <span style="font-size:11px; color:#94a3b8; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Ảnh đã đính kèm (sẵn sàng phân tích)</span>
            <button id="chatbot-remove-img" type="button" style="background:transparent; border:none; color:#ef4444; font-size:14px; cursor:pointer;">✕</button>
          </div>

          <div class="chat-input-area" style="display:flex; align-items:center; gap:6px; padding:8px 12px; background:rgba(15,23,42,0.8); border-top:1px solid rgba(56,189,248,0.15);">
            <input type="file" id="chatbot-file-input" accept="image/*" style="display:none;" />
            <button id="chatbot-upload-btn" type="button" class="chat-upload" title="Tải ảnh lên hoặc Dán ảnh (Ctrl+V)" style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); color:#38bdf8; cursor:pointer; width:34px; height:34px; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </button>
            <input type="text" id="chatbot-input" class="chat-input" placeholder="Hỏi AI hoặc dán ảnh (Ctrl+V)..." autocomplete="off" style="flex:1;">
            <button id="chatbot-send-btn" class="chat-send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(container);
  }

  renderSessionsList() {
    const listEl = document.getElementById('quantum-sessions-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    const sessionList = this.activeBot === 'lab' ? this.labSessions : this.genSessions;
    const currentId = this.activeBot === 'lab' ? this.currentLabSessionId : this.currentGenSessionId;

    if (sessionList.length === 0) {
      listEl.innerHTML = '<div style="color:#94a3b8; font-size:11px; text-align:center; padding:15px 0;">Chưa có hội thoại nào được lưu.</div>';
      return;
    }

    sessionList.forEach(s => {
      const item = document.createElement('div');
      item.style.background = s.id === currentId ? 'rgba(56,189,248,0.15)' : 'rgba(30,41,59,0.7)';
      item.style.border = `1px solid ${s.id === currentId ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`;
      item.style.borderRadius = '8px';
      item.style.padding = '8px 10px';
      item.style.cursor = 'pointer';
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';

      item.innerHTML = `
        <div style="flex:1; overflow:hidden;">
          <div style="font-size:11px; color:#f8fafc; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.title || 'Hội thoại mới'}</div>
          <div style="font-size:9px; color:#94a3b8;">${s.date || ''} • ${s.history.filter(m => m.role === 'user').length} câu hỏi</div>
        </div>
        <button class="quantum-del-btn" style="background:transparent; border:none; color:#ef4444; opacity:0.6; cursor:pointer; padding:3px;">✕</button>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('quantum-del-btn')) return;
        if (this.activeBot === 'lab') {
          this.currentLabSessionId = s.id;
          this.labHistory = [...s.history];
        } else {
          this.currentGenSessionId = s.id;
          this.genHistory = [...s.history];
        }
        this.switchBot(this.activeBot);
        const drawer = document.getElementById('quantum-history-drawer');
        if (drawer) drawer.style.transform = 'translateX(-100%)';
        this.isDrawerOpen = false;
      });

      const delBtn = item.querySelector('.quantum-del-btn');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.activeBot === 'lab') {
          this.labSessions = this.labSessions.filter(x => x.id !== s.id);
          localStorage.setItem('quantum_lab_sessions', JSON.stringify(this.labSessions));
        } else {
          this.genSessions = this.genSessions.filter(x => x.id !== s.id);
          localStorage.setItem('quantum_gen_sessions', JSON.stringify(this.genSessions));
        }
        if (currentId === s.id) {
          this.startNewSession(this.activeBot, true);
        } else {
          this.renderSessionsList();
        }
      });

      listEl.appendChild(item);
    });
  }

  addEventListeners() {
    // Note: chatbot-toggle click and drag are handled in initDragWindow without duplication

    const sendBtn = document.getElementById('chatbot-send-btn');
    if (sendBtn) sendBtn.onclick = () => this.handleUserInput();

    const input = document.getElementById('chatbot-input');
    if (input) {
      input.onkeypress = (e) => {
        if (e.key === 'Enter') this.handleUserInput();
      };
      // Hỗ trợ dán ảnh trực tiếp từ clipboard (Ctrl+V)
      input.addEventListener('paste', (e) => {
        const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type && items[i].type.startsWith('image/')) {
            e.preventDefault();
            const file = items[i].getAsFile();
            if (!file) continue;
            const reader = new FileReader();
            reader.onload = (event) => {
              this.setAttachedImage(event.target.result);
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      });
    }

    const fileInput = document.getElementById('chatbot-file-input');
    const uploadBtn = document.getElementById('chatbot-upload-btn');
    if (uploadBtn && fileInput) {
      uploadBtn.onclick = () => fileInput.click();
      fileInput.onchange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            this.setAttachedImage(event.target.result);
          };
          reader.readAsDataURL(file);
        }
        fileInput.value = '';
      };
    }

    const removeImgBtn = document.getElementById('chatbot-remove-img');
    if (removeImgBtn) {
      removeImgBtn.onclick = () => this.clearAttachedImage();
    }

    const configBtn = document.getElementById('config-btn');
    const configPanel = document.getElementById('api-config-panel');
    if (configBtn && configPanel) {
      configBtn.onclick = () => {
        configPanel.style.display = configPanel.style.display === 'none' ? 'block' : 'none';
      };
    }

    const historyBtn = document.getElementById('quantum-history-btn');
    const drawer = document.getElementById('quantum-history-drawer');
    const drawerCloseBtn = document.getElementById('quantum-drawer-close');
    const closeBtn = document.getElementById('quantum-close-btn');
    const newBtn = document.getElementById('quantum-new-btn');
    const newDrawerBtn = document.getElementById('quantum-new-session-drawer-btn');

    if (closeBtn) closeBtn.onclick = () => this.toggle();

    if (historyBtn && drawer) {
      historyBtn.onclick = () => {
        this.isDrawerOpen = !this.isDrawerOpen;
        drawer.style.transform = this.isDrawerOpen ? 'translateX(0)' : 'translateX(-100%)';
        if (this.isDrawerOpen) this.renderSessionsList();
      };
    }

    if (drawerCloseBtn && drawer) {
      drawerCloseBtn.onclick = () => {
        this.isDrawerOpen = false;
        drawer.style.transform = 'translateX(-100%)';
      };
    }

    if (newBtn) {
      newBtn.onclick = () => {
        this.saveSessions(this.activeBot);
        this.startNewSession(this.activeBot, true);
      };
    }

    if (newDrawerBtn && drawer) {
      newDrawerBtn.onclick = () => {
        this.saveSessions(this.activeBot);
        this.startNewSession(this.activeBot, true);
        this.isDrawerOpen = false;
        drawer.style.transform = 'translateX(-100%)';
      };
    }

    const saveBtn = document.getElementById('save-api-key');
    const keyInput = document.getElementById('manual-api-key');
    if (saveBtn && keyInput) {
      saveBtn.onclick = () => {
        const key = keyInput.value.trim();
        if (key) {
          window.localStorage.setItem('QUANTUM_API_KEY', key);
          GEMINI_API_KEY = key;
          alert('Đã cập nhật API Key thành công!');
          configPanel.style.display = 'none';
        }
      };
    }

    window.switchChatMode = (mode) => this.switchMode(mode);

    this.renderFAQs();
  }

  initDragWindow() {
    const win = document.getElementById('chatbot-window');
    if (!win) return;

    try {
      const saved = localStorage.getItem('quantum_win_pos') || localStorage.getItem('hoa_win_pos');
      if (saved) {
        const pos = JSON.parse(saved);
        if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
          win.style.left = Math.max(0, Math.min(window.innerWidth - 390, pos.x)) + 'px';
          win.style.top = Math.max(0, Math.min(window.innerHeight - 570, pos.y)) + 'px';
          win.style.bottom = 'auto';
          win.style.right = 'auto';
        }
      }
      const savedBtn = localStorage.getItem('hoa_btn_pos');
      const toggleEl = document.getElementById('chatbot-toggle');
      if (savedBtn && toggleEl) {
        const bpos = JSON.parse(savedBtn);
        if (bpos && typeof bpos.x === 'number') {
          toggleEl.style.left = Math.max(0, Math.min(window.innerWidth - 70, bpos.x)) + 'px';
          toggleEl.style.top = Math.max(0, Math.min(window.innerHeight - 70, bpos.y)) + 'px';
          toggleEl.style.bottom = 'auto';
          toggleEl.style.right = 'auto';
        }
      }
    } catch (e) {}

    const toggleBtn = document.getElementById('chatbot-toggle');
    if (toggleBtn) {
      let bDrag = { active: false, sx: 0, sy: 0, px: 0, py: 0 };
      let bMoved = false;
      toggleBtn.style.cursor = 'grab';

      // Mouse drag
      toggleBtn.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        bMoved = false;
        const rect = toggleBtn.getBoundingClientRect();
        bDrag = { active: true, sx: e.clientX, sy: e.clientY, px: rect.left, py: rect.top };
        toggleBtn.style.cursor = 'grabbing';
        toggleBtn.style.transition = 'none';
      });
      document.addEventListener('mousemove', (e) => {
        if (!bDrag.active) return;
        const dx = e.clientX - bDrag.sx, dy = e.clientY - bDrag.sy;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          bMoved = true;
          e.preventDefault();
        }
        const nx = Math.max(0, Math.min(window.innerWidth - 70, bDrag.px + dx));
        const ny = Math.max(0, Math.min(window.innerHeight - 70, bDrag.py + dy));
        toggleBtn.style.left = nx + 'px';
        toggleBtn.style.top = ny + 'px';
        toggleBtn.style.right = 'auto';
        toggleBtn.style.bottom = 'auto';
      });
      document.addEventListener('mouseup', () => {
        if (bDrag.active) {
          bDrag.active = false;
          toggleBtn.style.cursor = 'grab';
          toggleBtn.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
          const r = toggleBtn.getBoundingClientRect();
          try { localStorage.setItem('hoa_btn_pos', JSON.stringify({ x: r.left, y: r.top })); } catch (e) {}
        }
      });

      // Touch drag
      toggleBtn.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        bMoved = false;
        const touch = e.touches[0];
        const rect = toggleBtn.getBoundingClientRect();
        bDrag = { active: true, sx: touch.clientX, sy: touch.clientY, px: rect.left, py: rect.top };
        toggleBtn.style.transition = 'none';
      }, { passive: true });
      document.addEventListener('touchmove', (e) => {
        if (!bDrag.active || e.touches.length !== 1) return;
        const touch = e.touches[0];
        const dx = touch.clientX - bDrag.sx, dy = touch.clientY - bDrag.sy;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          bMoved = true;
          if (e.cancelable) e.preventDefault();
        }
        const nx = Math.max(0, Math.min(window.innerWidth - 70, bDrag.px + dx));
        const ny = Math.max(0, Math.min(window.innerHeight - 70, bDrag.py + dy));
        toggleBtn.style.left = nx + 'px';
        toggleBtn.style.top = ny + 'px';
        toggleBtn.style.right = 'auto';
        toggleBtn.style.bottom = 'auto';
      }, { passive: false });
      document.addEventListener('touchend', () => {
        if (bDrag.active) {
          bDrag.active = false;
          toggleBtn.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
          const r = toggleBtn.getBoundingClientRect();
          try { localStorage.setItem('hoa_btn_pos', JSON.stringify({ x: r.left, y: r.top })); } catch (e) {}
        }
      });

      // Single definitive click handler: only trigger when NOT dragged
      toggleBtn.onclick = (e) => {
        if (bMoved) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        this.toggle();
      };
    }

    const header = win.querySelector('.chat-header');
    const modes = win.querySelector('.chatbot-modes');
    [header, modes].forEach(el => {
      if (el) {
        el.style.cursor = 'grab';
        el.title = 'Kéo để di chuyển khung chat AI';
      }
    });

    let isDragging = false;
    let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.tagName === 'INPUT') return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = win.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      win.style.bottom = 'auto';
      win.style.right = 'auto';
      win.style.left = initialLeft + 'px';
      win.style.top = initialTop + 'px';
      if (header) header.style.cursor = 'grabbing';
      if (modes) modes.style.cursor = 'grabbing';
      e.preventDefault();
    };

    if (header) header.addEventListener('mousedown', onMouseDown);
    if (modes) modes.addEventListener('mousedown', onMouseDown);

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newLeft = Math.max(0, Math.min(window.innerWidth - 390, initialLeft + dx));
      const newTop = Math.max(0, Math.min(window.innerHeight - 570, initialTop + dy));
      win.style.left = newLeft + 'px';
      win.style.top = newTop + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        if (header) header.style.cursor = 'grab';
        if (modes) modes.style.cursor = 'grab';
        const rect = win.getBoundingClientRect();
        try {
          localStorage.setItem('quantum_win_pos', JSON.stringify({ x: rect.left, y: rect.top }));
          localStorage.setItem('hoa_win_pos', JSON.stringify({ x: rect.left, y: rect.top }));
        } catch (e) {}
      }
    });
  }

  toggle() {
    console.log("📡 [Quantum AI] Yêu cầu đóng/mở khung chat...");
    const win = document.getElementById('chatbot-window');
    const notif = document.getElementById('chatbot-notification');
    const toggleBtn = document.getElementById('chatbot-toggle');
    if (!win) {
      console.error("❌ [Quantum AI] LỖI: Không tìm thấy #chatbot-window!");
      return;
    }

    const currentDisplay = window.getComputedStyle(win).display;
    console.log("📊 [Quantum AI] Trạng thái hiện tại:", currentDisplay);

    if (currentDisplay === 'none') {
      win.style.setProperty('display', 'flex', 'important');
      if (notif) notif.style.display = 'none';
      if (toggleBtn) toggleBtn.style.setProperty('display', 'none', 'important');
      console.log("🔓 [Quantum AI] Đã HIỆN khung chat");
      const msgArea = document.getElementById('chatbot-messages');
      if (msgArea && msgArea.children.length === 0) {
        this.switchBot(this.activeBot);
      }
    } else {
      win.style.setProperty('display', 'none', 'important');
      if (toggleBtn) toggleBtn.style.setProperty('display', 'flex', 'important');
      console.log("🔒 [Quantum AI] Đã ẨN khung chat");
    }
  }

  switchMode(mode) {
    this.currentMode = mode;
    const secAI = document.getElementById('chat-section-ai');
    const secFAQ = document.getElementById('chat-section-faq');
    const tabLab = document.getElementById('tab-mode-lab');
    const tabGen = document.getElementById('tab-mode-gen');
    const tabFAQ = document.getElementById('tab-mode-faq');

    [tabLab, tabGen, tabFAQ].forEach(t => {
      if (t) {
        t.style.background = 'transparent';
        t.style.color = '#94a3b8';
        t.style.borderColor = 'transparent';
      }
    });

    if (mode === 'lab') {
      this.activeBot = 'lab';
      if (secAI) secAI.style.display = 'flex';
      if (secFAQ) secFAQ.style.display = 'none';
      if (tabLab) {
        tabLab.style.background = 'rgba(56, 189, 248, 0.15)';
        tabLab.style.color = '#38bdf8';
        tabLab.style.borderColor = 'rgba(56, 189, 248, 0.3)';
      }
      this.switchBot('lab');
    } else if (mode === 'gen') {
      this.activeBot = 'gen';
      if (secAI) secAI.style.display = 'flex';
      if (secFAQ) secFAQ.style.display = 'none';
      if (tabGen) {
        tabGen.style.background = 'rgba(56, 189, 248, 0.15)';
        tabGen.style.color = '#38bdf8';
        tabGen.style.borderColor = 'rgba(56, 189, 248, 0.3)';
      }
      this.switchBot('gen');
    }
  }

  switchBot(botId) {
    this.activeBot = botId;
    const title = document.getElementById('chatbot-title');
    if (title) {
      title.innerText = botId === 'lab' ? '⚡ CHỈ HUY AI' : '🌐 TRỢ LÝ CHUNG';
    }
    const msgArea = document.getElementById('chatbot-messages');
    if (msgArea) {
      msgArea.innerHTML = '';
      const historyToLoad = botId === 'lab' ? this.labHistory : this.genHistory;

      if (historyToLoad.length === 0) {
        this.loadWelcomeMessage();
      } else {
        historyToLoad.forEach(msg => {
          this.renderMessage(msg.role, msg.text, msg.image);
        });
      }
    }
  }

  loadWelcomeMessage() {
    const msg = this.activeBot === 'gen'
      ? 'Xin chào! Tôi là Trợ lý AI Hóa học. Tôi đã **ghi nhớ tiến trình học tập** của bạn ở các phiên trước. Bạn có câu hỏi nào mới không?'
      : 'Chào mừng đến với Trung tâm Chỉ huy Quantum. Tôi đã **ghi nhớ tiến trình học tập** của bạn ở các phiên trước. Bạn cần tôi giải thích điều gì?';

    this.addMessage('ai', msg);
  }

  addMessage(role, text, image = null) {
    const item = { role, text, image };
    if (this.activeBot === 'lab') {
      this.labHistory.push(item);
    } else {
      this.genHistory.push(item);
    }
    this.renderMessage(role, text, image);
    this.saveSessions(this.activeBot);
  }

  renderMessage(role, text, image = null) {
    const chatMsgs = document.getElementById('chatbot-messages');
    if (!chatMsgs) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;

    let imgHtml = '';
    if (image) {
      imgHtml = `<img src="${image}" alt="Hình ảnh đính kèm" style="max-width:200px; max-height:200px; object-fit:contain; border-radius:6px; margin-bottom:6px; display:block; border:1px solid rgba(56,189,248,0.4);" />`;
    }

    if (role === 'user') {
      if (window.StemLabAIBridge && typeof window.StemLabAIBridge.formatUserMessage === 'function') {
        msgDiv.innerHTML = imgHtml + window.StemLabAIBridge.formatUserMessage(text);
      } else {
        msgDiv.innerHTML = imgHtml + (text ? text.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '');
      }
      chatMsgs.appendChild(msgDiv);
      return;
    }

    let formatted = text;

    // 1. Strip complex LaTeX commands (\xrightarrow, \text, \mathrm, \mathbf)
    formatted = formatted
      .replace(/\\xrightarrow\{[^}]*\}/g, ' → ')
      .replace(/\\xrightarrow/g, ' → ')
      .replace(/\\rightarrow/g, ' → ')
      .replace(/\\rightleftharpoons/g, ' ⇌ ')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\\mathrm\{([^}]+)\}/g, '$1')
      .replace(/\\mathbf\{([^}]+)\}/g, '$1')
      .replace(/-->/g, ' → ')
      .replace(/->/g, ' → ')
      .replace(/<=>/g, ' ⇌ ');

    // 2. Convert unicode subscripts
    const subMap = { '₀':'0', '₁':'1', '₂':'2', '₃':'3', '₄':'4', '₅':'5', '₆':'6', '₇':'7', '₈':'8', '₉':'9' };
    formatted = formatted.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, m => `<sub>${subMap[m]}</sub>`);

    // 3. Process explicit $ ... $ blocks first
    formatted = formatted.replace(/\$([^\$]+)\$/g, (match, p1) => {
      let clean = p1
        .replace(/([A-Za-z\)])_?\{?(\d+)\}?/g, '$1<sub>$2</sub>')
        .replace(/\^\{?([^\}]+)\}?/g, '<sup>$1</sup>')
        .replace(/([A-Za-z0-9])\^\{?(\d*[+-])\}?/g, '$1<sup>$2</sup>');
      return `<b style="color:#00ffcc">${clean}</b>`;
    });

    // 4. Format inline chemical subscripts outside $ ... $ (e.g. H2, (OH)3, (NO3)2, Al2, SO4)
    formatted = formatted.replace(/([A-Z][a-z]?|\))(\d+)/g, '$1<sub>$2</sub>');

    // 5. Format ionic charges outside $ ... $ ONLY when explicitly using ^ or ion patterns like Cu2+, Fe3+, H+, Cl-, SO4^2-
    // Avoid matching (s)+, (l)+, (g)+, (aq)+ which are states of matter followed by '+'
    formatted = formatted.replace(/([A-Za-z0-9])\^\{?([1-9]?[+-])\}?/g, '$1<sup>$2</sup>');

    // 6. Clean up Markdown bullet points & bold/italic properly
    formatted = formatted
      .replace(/^[-*]{3,}\s*$/gm, '<hr style="border: 0; border-top: 1px dashed rgba(255,255,255,0.2); margin: 15px 0;">')
      .replace(/^#+\s*(.*)$/gm, '<b style="color:#38bdf8">$1</b>')
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.*?)\*/g, '<i>$1</i>')
      .replace(/^[\*\-]\s*(.*)$/gm, '• $1')
      .replace(/^([🎯💡🌍⚠️].*):/gm, '<div style="color:#38bdf8; font-weight:bold; margin-top:10px; font-family:Orbitron, sans-serif;">$1</div>')
      .replace(/\n/g, '<br>');

    msgDiv.innerHTML = formatted;
    chatMsgs.appendChild(msgDiv);
    // chatMsgs.scrollTop = chatMsgs.scrollHeight; // Auto-scroll disabled
  }

  renderFAQs() {
    const faqSec = document.getElementById('chat-section-faq');
    if (!faqSec) return;

    const qaData = window.QA_DATA || [];
    faqSec.innerHTML = '';

    qaData.forEach(qa => {
      const item = document.createElement('div');
      item.style.background = 'rgba(30, 41, 59, 0.6)';
      item.style.border = '1px solid rgba(255,255,255,0.05)';
      item.style.borderRadius = '8px';
      item.style.padding = '12px';
      item.innerHTML = `
        <div style="color:#38bdf8; font-weight:bold; font-size:13px; margin-bottom:6px;">❓ ${qa.question}</div>
        <div style="color:#cbd5e1; font-size:12px; line-height:1.5; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 6px;">${qa.answer}</div>
      `;
      faqSec.appendChild(item);
    });
  }

  notify(type, data) {
    if (this.activeBot !== 'lab') return;

    if (type === 'reaction') {
      this.lastReactionData = data;

      const win = document.getElementById('chatbot-window');
      if (win && win.style.display !== 'flex') {
        const toggle = document.getElementById('chatbot-toggle');
        if (toggle) {
          toggle.style.animation = 'bounce 0.5s 3';
          setTimeout(() => toggle.style.animation = '', 1500);
        }
      }
    }
  }

  getLabContext() {
    const state = window.state || {};
    let deskChemicals = [];
    const desk = document.getElementById('workspace');
    if (desk) {
      const labels = desk.querySelectorAll('.chemical-label, .beaker-label');
      labels.forEach(el => deskChemicals.push(el.innerText.trim()));
    }

    let recentLogs = [];
    const logEntries = document.querySelectorAll('.log-msg');
    if (logEntries.length > 0) {
      const start = Math.max(0, logEntries.length - 3);
      for (let i = start; i < logEntries.length; i++) {
        recentLogs.push(logEntries[i].innerText.trim());
      }
    }

    // Local Risk Classifier Evaluation (TensorFlow.js / Local Trained Model)
    const temp = state.currentTemp || 25;
    const energy = state.currentEnergy || 100;
    const violations = state.safetyViolations || 0;
    const hasHazard = deskChemicals.some(c => /h2so4|hno3|na|k|cl2|p|phenol/i.test(c)) ? 1 : 0;
    const score = (temp / 120.0) * 0.45 + ((100 - energy) / 100.0) * 0.25 + (violations / 5.0) * 0.2 + (hasHazard * 0.1);
    const riskLabel = score >= 0.55 || violations >= 2 || temp >= 80 || energy <= 35 ? "Nguy hiểm ⚠️" :
                      score >= 0.30 || violations >= 1 || temp >= 45 || energy <= 70 || hasHazard === 1 ? "Cảnh báo ⚡" : "An toàn ✅";

    return `
      NGỮ CẢNH PHÒNG THÍ NGHIỆM HIỆN TẠI:
      - ĐÁNH GIÁ RỦI RO THÍ NGHIỆM (MODEL PHÂN LOẠI CỤC BỘ AI): ${riskLabel} (Mức độ rủi ro: ${Math.round(score * 100)}%)
      - Nhiệt độ bàn thí nghiệm: ${temp}°C
      - Năng lượng an toàn IDCL: ${energy}%
      - Số lần vi phạm quy tắc an toàn: ${violations}
      - Có hóa chất nguy hiểm: ${hasHazard ? 'CÓ (Cần chú ý)' : 'Không'}
      - Phản ứng vừa xảy ra: ${this.lastReactionData ? this.lastReactionData.equation : 'Chưa có'}
      - Nhật ký gần đây: ${recentLogs.join(' | ')}
      - Hóa chất đang có trên bàn: ${deskChemicals.join(', ')}
    `;
  }

  
  formatChemText(text) {
    if (!text) return '';
    if (window.StemLabAIBridge && typeof window.StemLabAIBridge.formatAIFormulaText === 'function') {
      return window.StemLabAIBridge.formatAIFormulaText(text);
    }
    if (typeof window !== 'undefined' && window.katex && typeof window.katex.renderToString === 'function') {
      let f = text.replace(/\\rightleftharpoons/g, ' ⇌ ');
      return f;
    }
    return text;
  }

  async streamMessage(role, text) {
    if (role !== 'ai') {
      this.addMessage(role, text);
      return;
    }
    this.showTyping(false);
    const chatMsgs = document.getElementById('chatbot-messages');
    if (!chatMsgs) return;

    if (this.activeBot === 'lab') {
      this.labHistory.push({ role: 'ai', text: text });
    } else {
      this.genHistory.push({ role: 'ai', text: text });
    }
    this.saveSessions(this.activeBot);

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ai';
    chatMsgs.appendChild(msgDiv);

    const words = text.split(' ');
    let cur = '';
    const delay = Math.max(10, Math.min(25, Math.floor(1600 / Math.max(1, words.length))));

    for (let i = 0; i < words.length; i++) {
      cur += (i === 0 ? '' : ' ') + words[i];
      msgDiv.innerHTML = this.formatChemText(cur);
      await new Promise(res => setTimeout(res, delay));
    }
    msgDiv.innerHTML = this.formatChemText(text);
  }

  showTyping(show) {
    this.isTyping = !!show;
    const chatMsgs = document.getElementById('chatbot-messages');
    if (!chatMsgs) return;
    let indicator = document.getElementById('chatbot-typing-indicator');
    if (show) {
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'chatbot-typing-indicator';
        indicator.className = 'ai-msg typing';
        indicator.style.cssText = 'padding: 8px 12px; margin-bottom: 8px; color: #38bdf8; font-style: italic; font-size: 13px; display: flex; align-items: center; gap: 6px;';
        indicator.innerHTML = '<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#38bdf8;"></span> ⚡ Quantum AI đang phân tích...';
        chatMsgs.appendChild(indicator);
        // chatMsgs.scrollTop = chatMsgs.scrollHeight; // Auto-scroll disabled
      }
    } else {
      if (indicator) {
        indicator.remove();
      }
    }
  }

  async handleUserInput() {
    const input = document.getElementById('chatbot-input');
    if (!input || this.isTyping) return;

    const text = input.value.trim();
    const currentImage = this.attachedImage;
    if (!text && !currentImage) return;

    this.addMessage('user', text, currentImage);
    input.value = '';
    this.clearAttachedImage();
    this.showTyping(true);

    const labTitle = this.activeBot === 'lab' ? 'Lab Hóa QuantumLab (Thao tác)' : 'Lab Hóa Học THPT (Lý thuyết)';

    // Nếu có ảnh, cho phép AI đọc và phân tích ảnh
    if (!currentImage) {
      // ⚡ BƯỚC 0: KIỂM TRA RANH GIỚI MÔN HỌC (SUBJECT BOUNDARY GUARD)
      if (window.StemLabAIBridge && typeof window.StemLabAIBridge.checkSubjectBoundary === 'function') {
        try {
          const guard = window.StemLabAIBridge.checkSubjectBoundary(text, 'hoa');
          if (!guard.allowed) {
            await this.streamMessage('ai', guard.refusal);
            this.showTyping(false);
            window.StemLabAIBridge.logLabReasoning({
              query: text,
              subject: 'HOA',
              intent: 'subject_boundary_guard',
              aiResponseText: guard.refusal,
              isCacheHit: true,
              labTitle: labTitle
            });
            return;
          }
        } catch (gErr) {
          console.warn('[Lab Hóa AI] Subject guard error:', gErr);
        }
      }

      // ⚡ BƯỚC 1: KIỂM TRA BỘ NHỚ AI TỰ HỌC (CACHE HIT) GIỐNG TRỢ LÝ NOVA
      if (window.StemLabAIBridge && typeof window.StemLabAIBridge.checkLabLearnedCache === 'function') {
        try {
          const cacheRes = await window.StemLabAIBridge.checkLabLearnedCache(text, 'hoa', 0.92);
          if (cacheRes && cacheRes.hit) {
            await this.streamMessage('ai', cacheRes.answer);
            this.showTyping(false);

            window.StemLabAIBridge.logLabReasoning({
              query: text,
              subject: 'HOA',
              aiResponseText: cacheRes.answer,
              isCacheHit: true,
              labTitle: labTitle,
              score: cacheRes.score
            });
            return;
          }
        } catch (cErr) {
          console.warn('[Lab Hóa AI] Cache check warning:', cErr);
        }
      }
    }

    try {
      const response = await this.callGemini(text, this.activeBot === 'gen', currentImage);
      await this.streamMessage('ai', response);

      // ⚡ BƯỚC 2: TỰ ĐỘNG GHI NẠP CÂU TRẢ LỜI MỚI VÀO TRI THỨC TOÀN HỆ THỐNG & AUDIT LOG (CHỈ KHI THÀNH CÔNG VÀ KHÔNG LỖI)
      if (!this.isAIError(response, 200) && window.StemLabAIBridge && typeof window.StemLabAIBridge.saveLabLearnedAnswer === 'function') {
        window.StemLabAIBridge.saveLabLearnedAnswer(text || 'Phân tích hình ảnh', response, 'hoa', labTitle);
        window.StemLabAIBridge.logLabReasoning({
          query: text || 'Phân tích hình ảnh',
          subject: 'HOA',
          aiResponseText: response,
          isCacheHit: false,
          labTitle: labTitle
        });
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
      // Fallback cục bộ thông minh từ RAG ngữ cảnh
      const ragFallback = this.retrieveRAGContext ? this.retrieveRAGContext(text) : '';
      if (ragFallback) {
        const fallbackMsg = `💡 [Trợ lý Ngoại tuyến QuantumLab]:\n${ragFallback.replace('[RAG SEMANTIC KNOWLEDGE CONTEXT]:', '').trim()}`;
        this.addMessage('ai', fallbackMsg);
      } else {
        const errMsg = 'Xin lỗi, tôi đang gặp sự cố khi kết nối với máy chủ AI. Vui lòng kiểm tra lại câu hỏi hoặc thử lại sau giây lát!';
        // CHỈ HIỂN THỊ TẠM THỜI CHO UI, TUYỆT ĐỐI KHÔNG LƯU VÀO CACHE/LOCALSTORAGE
        this.renderMessage('ai', errMsg);
        console.warn('[Quantum AI] Chỉ hiển thị thông báo lỗi tạm thời trên UI, TUYỆT ĐỐI KHÔNG LƯU CACHE.');
      }
    } finally {
      this.showTyping(false);
    }
  }

  retrieveRAGContext(prompt) {
    const chemCorpus = [
      { topic: "Cân bằng Le Chatelier", text: "Tăng nhiệt độ làm cân bằng chuyển dịch theo chiều thu nhiệt (Delta H > 0). Tăng áp suất chuyển dịch theo chiều giảm số mol khí." },
      { topic: "Este & Xà phòng hóa", text: "RCOOR' + NaOH -> RCOONa + R'OH. Este no đơn chức CnH2nO2." },
      { topic: "Glucozơ Tráng bạc", text: "C6H12O6 + 2AgNO3 + 3NH3 + H2O -> C5H11O5-COONH4 + 2Ag + 2NH4NO3." },
      { topic: "Chất Lưỡng tính", text: "Al(OH)3, Zn(OH)2, Al2O3, NaHCO3, Amino axit vừa phản ứng axit mạnh vừa phản ứng bazơ mạnh." },
      { topic: "Độ pH & Tích số tan Ksp", text: "pH = -log[H+]. Tích số tan Ksp là tích nồng độ các ion dư trong dung dịch bão hòa." }
    ];
    if (!prompt) return '';
    const q = prompt.toLowerCase();
    const matched = chemCorpus.filter(c => q.includes(c.topic.toLowerCase()) || q.includes(c.text.toLowerCase().substring(0, 10)));
    if (matched.length > 0) {
      return `\n[RAG SEMANTIC KNOWLEDGE CONTEXT]: ${matched.map(m => m.topic + ': ' + m.text).join('; ')}`;
    }
    return '';
  }

  async callGemini(prompt, isGeneral = false, imageBase64 = null) {
    let context = "";
    let systemPrompt = "";
    const memoryContext = this.getMemoryContext(this.activeBot);

    if (isGeneral) {
      const ragInfo = this.retrieveRAGContext ? this.retrieveRAGContext(prompt) : "";
      systemPrompt = `
        Bạn là Trợ lý AI Chuyên gia Hóa học THPT (General Chemistry Specialist) của hệ thống STEM HUB.
        
        NHIỆM VỤ ĐỘC TÔN:
        Chỉ tập trung CHUYÊN SÂU 100% VÀO BỘ MÔN HÓA HỌC THPT.
        Phạm vi chuyên môn: Cấu tạo nguyên tử, bảng tuần hoàn, liên kết hóa học, nhiệt hóa học, cân bằng hóa học, dung dịch điện li, pH, hóa học vô cơ (kim loại, phi kim, phức chất), hóa học hữu cơ (hydrocarbon, alcohol, aldehyde, carboxylic acid, ester, amine, amino acid, peptide, polymer) và các dạng toán hóa học THPT.

        QUY TẮC BIÊN GIỚI MÔN HỌC (TUYỆT ĐỐI BẮT BUỘC):
        - Nếu người dùng hỏi các câu hỏi thuộc môn học khác (Toán, Vật lý, Sinh học, Lịch sử, Địa lý, đời sống ngoài lề...), BẮT BUỘC TỪ CHỐI LỊCH SỰ:
          "Tôi là Trợ lý AI chuyên sâu môn Hóa học của STEM HUB. Tôi chỉ giải đáp các kiến thức, phương trình và bài tập thuộc phạm vi môn Hóa học THPT. Xin vui lòng gửi câu hỏi liên quan đến Hóa học để tôi hỗ trợ bạn tốt nhất!"

        QUY TẮC PHẢN HỒI:
        1. NGẮN GỌN NHƯNG ĐẦY ĐỦ (Tối đa 100 - 120 từ): Đi thẳng vào trọng tâm, không chào hỏi xã giao lan man.
        2. BẮT BUỘC CÓ: Phương trình hóa học cân bằng đúng + Hiện tượng quan sát được.
        3. QUY TẮC DANH PHÁP QUỐC TẾ (IUPAC): Dùng 100% danh pháp IUPAC tiếng Anh cho mọi chất (Iron, Copper, Aluminium, Zinc, Hydrochloric acid, Sodium hydroxide, Sulfuric acid...). TUYỆT ĐỐI KHÔNG dùng tên tiếng Việt cũ (Sắt, Đồng, Nhôm, Kẽm, Axit...).
        4. CÔNG THỨC: Viết công thức chuẩn ($H_2SO_4$, $CuSO_4$, $Fe^{3+}$), không dùng mã LaTeX phức tạp.
        ${memoryContext}
        ${ragInfo}
      `;
    } else {
      context = this.getLabContext();
      systemPrompt = `
        Bạn là "Quantum Commander" - SĨ QUAN AI CHỈ HUY BÀN THÍ NGHIỆM của Lab Hóa học ảo STEM HUB.
        
        NHIỆM VỤ ĐỘC TÔN (TUYỆT ĐỐI BẮT BUỘC):
        Bạn CHỈ NÓI VỀ KIẾN THỨC BẢN CHẤT VÀ ỨNG DỤNG THỰC TẾ CỦA NHỮNG THÍ NGHIỆM NGƯỜI DÙNG ĐANG LÀM trực tiếp trên bàn thí nghiệm ảo.
        
        CẤU TRÚC PHẢN HỒI (TỐI ĐA 100 - 120 TỪ):
        - 🔬 BẢN CHẤT THÍ NGHIỆM ĐANG LÀM:
          Nêu rõ chất phản ứng trên bàn, phương trình hóa học cân bằng và hiện tượng quan sát trực tiếp (đổi màu dung dịch, sinh bọt khí, xuất hiện kết tủa...).
        - 💡 ỨNG DỤNG THỰC TẾ (TRỌNG TÂM):
          Giải thích chi tiết ỨNG DỤNG THỰC TIỄN trong đời sống thường ngày, trong y học, nông nghiệp hoặc trong sản xuất công nghiệp của chính phản ứng/chất mà người dùng đang làm (Ví dụ: tổng hợp hương liệu, xử lý nước thải, mạ kim loại, sản xuất phân bón, chế tạo pin...).
        - ⚠️ AN TOÀN TRÊN BÀN LAB:
          Cảnh báo rủi ro an toàn trực tiếp (ăn mòn, sinh nhiệt, độc tố) cho thí nghiệm này.

        QUY TẮC BIÊN GIỚI (BOUNDARY RULE):
        - Nếu người dùng hỏi câu hỏi lý thuyết sách vở chung chung hoặc những điều KHÔNG LIÊN QUAN ĐẾN THÍ NGHIỆM ĐANG LÀM:
          Hãy nhắc nhở: "Tôi là AI Chỉ huy Thí nghiệm, tôi chỉ tập trung phân tích bản chất và ứng dụng thực tế của những thí nghiệm bạn đang thao tác trên bàn lab ảo. Bạn hãy kéo hóa chất vào dụng cụ để bắt đầu phản ứng, hoặc chuyển sang tab 'Trợ lý Hóa học Đa năng' để hỏi lý thuyết THPT tổng quát!"
        - Dùng danh pháp IUPAC tiếng Anh cho các chất (Iron, Copper, Acid, Hydroxide, Oxide...).
        
        TRẠNG THÁI BÀN THÍ NGHIỆM CỦA HỌC SINH HIỆN TẠI:
        ${context}
        ${memoryContext}
      `;
    }

    // Build multi-turn conversational contents payload
    const activeHistory = this.activeBot === 'lab' ? this.labHistory : this.genHistory;
    const recentHistory = activeHistory.slice(-14);

    const formattedContents = [];
    recentHistory.forEach(msg => {
      formattedContents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text || '' }]
      });
    });

    if (formattedContents.length === 0) {
      formattedContents.push({ role: 'user', parts: [{ text: prompt || (imageBase64 ? 'Phân tích hình ảnh này' : '') }] });
    }

    // ⚡ Zero Exposure: Định tuyến qua Next.js Gateway nội bộ (/api/ai/chat)
    const proxyUrl = '/api/ai/chat';
    try {
      const gwRes = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt || (imageBase64 ? 'Phân tích và giải thích chi tiết hiện tượng / thí nghiệm hóa học trong hình ảnh này' : ''),
          contents: formattedContents,
          systemInstruction: systemPrompt,
          imageBase64: imageBase64,
          temperature: 0.3,
          maxOutputTokens: 1200
        })
      });
      if (gwRes.ok) {
        const gwData = await gwRes.json();
        if (gwData.text) {
          console.log('📡 [Quantum AI] Phản hồi an toàn qua Next.js Gateway (Zero Exposure)');
          return gwData.text;
        }
      }
    } catch (e) {
      console.warn('[Quantum AI] Gateway fallback triggered:', e.message);
    }

    const keyPool = isGeneral ? GENERAL_API_KEYS : COMMANDER_API_KEYS;
    if (keyPool && keyPool.length > 0) {
      const modelsToTry = [
        "gemini-flash-lite-latest",
        "gemini-3.1-flash-lite-preview",
        "gemini-2.5-flash-lite",
        "gemma-4-26b-a4b-it",
        "gemma-4-31b-it",
        "gemini-flash-latest"
      ];

      let lastError = null;
      const totalTries = keyPool.length * modelsToTry.length;

      const bodyPayload = {
        contents: formattedContents,
        system_instruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          maxOutputTokens: 1200,
          temperature: 0.3
        }
      };

      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
        const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const lastPart = bodyPayload.contents[bodyPayload.contents.length - 1];
        if (lastPart && lastPart.parts) {
          lastPart.parts.push({
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          });
        }
      }

      for (let tryCount = 0; tryCount < totalTries; tryCount++) {
        const activeKey = keyPool[((isGeneral ? generalKeyIdx : commanderKeyIdx) + tryCount) % keyPool.length];
        const model = modelsToTry[Math.floor(tryCount / keyPool.length) % modelsToTry.length];
        const version = 'v1beta';

        try {
          const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${activeKey}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4500);

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify(bodyPayload)
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
              console.log(`📡 [Quantum AI] Thành công via model ${model} (Key ${activeKey.substring(0, 8)}...)`);
              if (isGeneral) generalKeyIdx = (generalKeyIdx + 1) % keyPool.length;
              else commanderKeyIdx = (commanderKeyIdx + 1) % keyPool.length;
              this.workingModel = model;
              return data.candidates[0].content.parts[0].text;
            }
          } else {
            const errData = await response.json().catch(() => ({}));
            lastError = errData.error?.message || `HTTP Error ${response.status}`;
            console.warn(`⚠️ [Quantum AI] Model ${model} Key ${activeKey.substring(0, 8)}... status ${response.status}:`, lastError);
          }
        } catch (e) {
          lastError = e.message || e;
          console.warn(`⚠️ [Quantum AI] Ngoại lệ trên ${model}:`, lastError);
        }
      }
    }

    throw new Error('Không thể kết nối dịch vụ AI. Vui lòng thử lại sau ít phút.');
  }

  async discoverModels() {
    const fallbackModels = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-pro'
    ];

    if (!GEMINI_API_KEY) return fallbackModels;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
      if (response.ok) {
        const data = await response.json();
        if (data.models) {
          const available = data.models
            .filter(m => m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name.replace('models/', ''));
          if (available.length > 0) return available;
        }
      }
    } catch (e) { }
    return fallbackModels;
  }
}

window.quantumChatbot = new UnifiedChatbot();
window.labBot = window.quantumChatbot;
window.generalBot = window.quantumChatbot;
window.chatbot = window.quantumChatbot;

// Tích hợp: Đảm bảo nút "Hỏi đáp" ở Header mở đúng khung chat này
window.toggleQA = () => {
  console.log("🖱️ [Quantum AI] Header Button Clicked!");
  if (window.quantumChatbot) {
    window.quantumChatbot.toggle();
  } else {
    console.warn("⚠️ [Quantum AI] window.quantumChatbot chưa được khởi tạo!");
  }
};