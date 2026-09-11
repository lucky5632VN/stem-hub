# 🔬 Phân tích Codebase — QuantumLab v4.0

> **Dự án:** `e:\project\STT2026\lab-ktra15p` | **Ngày:** 2026-05-18

---

## 📁 Cấu trúc thư mục

```
lab-ktra15p/
├── index.html                      # HTML chính — Entry point
├── style.css                       # CSS giao diện chính
├── library.css                     # CSS Thư viện hóa chất
├── chatbot.css                     # CSS Chatbot UI
├── guided_lab.css                  # CSS Lab có hướng dẫn
├── gemini_ai.js                    # Module AI (ES Module)
├── .env                            # VITE_GEMINI_API_KEY
└── public/
    ├── data.js                     # DATABASE: TOOLS, CHEMICALS, REACTIONS, EXPERIMENTS
    ├── chemicals_extended.js       # Mở rộng DB hóa chất (Vô cơ / Hữu cơ)
    ├── chemicals_idcl.js           # Hóa chất đặc biệt IDCL
    ├── chemicals_bigdata.js        # Bigdata hóa chất
    ├── chemicals_conc_reactions.js # Phản ứng nồng độ đặc
    ├── chemicals_academic_pro.js   # Hóa chất học thuật nâng cao
    ├── phenomena_db.js             # DB Hiện tượng: kết tủa, màu sắc, hòa tan
    ├── particles.js                # Hệ thống hiệu ứng hạt (canvas)
    ├── chemistry_engine.js         # ENGINE tính toán pH, màu, kết tủa, an toàn
    ├── lab.js                      # CORE: Logic phòng lab (~3787 dòng)
    ├── library_data.js             # Dữ liệu Thư viện Hóa học
    ├── library_ui.js               # UI Thư viện Hóa học
    ├── qa_system.js                # Hệ thống Hỏi đáp + Điều chế
    ├── assessment_ai.js            # IDCL Green Chemistry Observer
    └── optimization_lab.js         # Module Tối ưu hóa Le Chatelier
```

---

## ⚙️ Thứ tự load script

```
data.js → chemicals_extended.js → chemicals_idcl.js → chemicals_bigdata.js
→ chemicals_conc_reactions.js → chemicals_academic_pro.js
→ phenomena_db.js → particles.js → chemistry_engine.js → lab.js
→ library_data.js → library_ui.js → qa_system.js
→ assessment_ai.js → optimization_lab.js
→ gemini_ai.js  ← ES Module (type="module", load sau cùng)
```

---

## 🔗 Bảng phụ thuộc module

| Module | Phụ thuộc vào | Expose ra `window` |
|--------|---------------|--------------------|
| `data.js` | — | `TOOLS`, `CHEMICALS`, `REACTIONS`, `HEAT_REACTIONS`, `EXPLICIT_REACTIONS`, `EXPERIMENTS`, `DANGEROUS_COMBOS` |
| `phenomena_db.js` | — | `window.PHENOMENA_DB` |
| `chemistry_engine.js` | `CHEMICALS`, `ALL_ITEMS`, `PHENOMENA_DB` | `window.ChemistryEngine` |
| `particles.js` | `#effectsCanvas` | `particles[]`, `triggerReactionEffect()`, `triggerFlash()` |
| `lab.js` | Tất cả DB + Engine | `state`, `addLog()`, `AudioSystem`, `MusicSystem` |
| `assessment_ai.js` | `CHEMICALS`, `ALL_ITEMS`, `ChemistryEngine`, `MISSION_TARGETS` | `window.IDCL_State`, `window.generateGreenReport()` |
| `optimization_lab.js` | `HEAT_REACTIONS`, `addLog()` | `window.OptimizationLab` |
| `qa_system.js` | bot objects | `window.SAFETY_QUIZZES`, `window.MISSION_TARGETS`, `window.QA_DATA` |
| `gemini_ai.js` | `.env`, `QA_DATA` | `window.quantumChatbot`, `window.toggleQA()` |

---

## 🎯 Luồng hoạt động chính

```
startExperience() → confirmLabRules() → enterLab() → initLab()
  ├── renderTools()       ← TOOLS[]
  ├── renderChemicals()   ← CHEMICALS[] + ALL_ITEMS[]
  └── setupWorkspaceDrop()

[Drag & Drop hóa chất]
  └── placeItemOnWorkspace()
        └── showChemicalConfig() → confirmChemicalPlacement()
              └── addChemicalToContainer()
                    ├── dispatchEvent('chemistry:pour')            → assessment_ai.js
                    ├── ChemistryEngine.calculatePH()
                    ├── ChemistryEngine.calculateSolutionColor()
                    ├── checkReaction()
                    │     ├── ChemistryEngine.checkPrecipitation()
                    │     ├── EXPLICIT_REACTIONS lookup
                    │     ├── ChemistryEngine.checkSynthesisReactions()
                    │     ├── ChemistryEngine.checkGunpowder()
                    │     └── getNeutralization / getGasEvolution / getRedoxDisplacement / getPrecipitation
                    └── executeReaction()
                          ├── triggerReactionEffect()              ← particles.js
                          ├── AudioSystem.play*()
                          ├── window.chatbot.notify()              → gemini_ai.js
                          └── dispatchEvent('chemistry:reaction-complete') → assessment_ai.js
```

---

## 📦 Chi tiết file quan trọng

### `lab.js` — Core Engine (~3787 dòng)

**State chính:**
```javascript
let state = {
  currentExperiment: 'free',
  workspaceItems: [],        // Tất cả items trên workspace
  safetyEquipped: new Set(), // Bộ bảo hộ đang đeo
  flameIntervals: {},        // Timers đèn cồn
  selectedItem: null,
  nextId: 1,                 // Counter tạo uid
  pendingPlacement: null,    // Hóa chất đang chờ config
};
```

**SVG_RENDERERS{}** — Hàm vẽ SVG cho: `testTube`, `beaker`, `flask`, `bunsenBurner`, `litmusPaper`, `dropper`, `stirrer`, `funnel`, `pipette`, `goggles`, `gloves`, `fumeHood`, `electrolysisCell`, `electronicScale`, `electrode`, `powerSupply`, `labcoat`

**Hàm quan trọng:**

| Hàm | Chức năng |
|-----|-----------|
| `initLab()` | Khởi tạo toàn bộ lab |
| `renderTools()` / `renderChemicals()` | Render sidebar |
| `filterChemicals()` | Filter debounced 250ms |
| `placeItemOnWorkspace()` | Đặt item, redirect sang config modal |
| `addChemicalToContainer()` | Thêm hóa chất, kích hoạt check reaction |
| `checkReaction()` | Kiểm tra toàn bộ phản ứng có thể |
| `executeReaction()` | Thực thi phản ứng (màu, hiệu ứng, log, event) |
| `renderWorkspaceItem()` | Render DOM item |
| `makeDraggable()` | Drag trong workspace + scroll zoom |
| `handleDropInteractions()` | Tương tác khi thả item |
| `handleToolInteraction()` | Logic tool ↔ tool |
| `toggleBunsen()` | Bật/tắt đèn cồn, trigger `heatNearbyContainers()` |
| `checkElectrolysis()` | Kiểm tra điện phân |
| `triggerSystemFreeze()` | Quiz an toàn IDCL |
| `addLog()` | Thêm log HUD |
| `resetLab()` | Reset workspace |

### `chemistry_engine.js` — Tính toán hóa học

| Method | Chức năng |
|--------|-----------|
| `SafetyWatcher.checkViolation()` | Kiểm tra vi phạm an toàn IDCL |
| `calculatePH()` | Tính pH (strong/weak acid/base) |
| `calculateSolutionColor()` | Màu dung dịch (indicator, ion chuyển tiếp, pH-dependent) |
| `checkPrecipitation()` | Kết tủa theo Ksp + xét lưỡng tính (pH>12.5) |
| `checkMetalDisplacement()` | Phản ứng thế kim loại (Reactivity Series) |
| `checkGunpowder()` | Thuốc súng đen (KNO₃ + S + C) |
| `checkSynthesisReactions()` | Tổng hợp + gợi ý điều kiện còn thiếu |
| `calculateAtomEconomy()` | Hiệu quả nguyên tử (%) |

### `assessment_ai.js` — IDCL Green Chemistry

- `chemistry:pour` → tính lượng dư, trừ điểm `IDCL_State.currentEnergy`
- `chemistry:reaction-complete` → tính Atom Economy
- `window.generateGreenReport()` → modal báo cáo + export JSON/TXT

### `optimization_lab.js` — Le Chatelier

- 4 phản ứng: **Haber-Bosch**, **Este hóa**, **Fe(SCN)₃**, **NO₂⇌N₂O₄**
- 3 slider điều khiển điều kiện, yield/cost real-time
- Tự động hiện khi phát hiện hóa chất thuận nghịch qua `chemistry:pour`
- Inject thêm entries vào `window.HEAT_REACTIONS` khi `init()`

### `gemini_ai.js` — AI Chatbot

- Class `UnifiedChatbot`: 2 bot (Lab Commander + General AI)
- Auto-discover Gemini models, fallback qua nhiều model/version
- API Key: `.env (VITE_GEMINI_API_KEY)` → fallback `localStorage`

---

## ⚠️ Điểm quan trọng khi chỉnh sửa

> [!IMPORTANT]
> **`state.workspaceItems[]`** là nguồn dữ liệu duy nhất. Mọi thao tác phải qua đây, không thao tác DOM trực tiếp.

> [!IMPORTANT]
> **`window.ALL_ITEMS`** merge từ nhiều file `chemicals_*.js` — thêm hóa chất phải kiểm tra `id` không trùng.

> [!WARNING]
> **Custom Events** `chemistry:pour` và `chemistry:reaction-complete` là cầu nối `lab.js` ↔ `assessment_ai.js` / `optimization_lab.js`. Không được xóa.

> [!WARNING]
> **`optimization_lab.js`** inject vào `window.HEAT_REACTIONS` khi `init()` — phải load sau `data.js`.

> [!NOTE]
> **`refreshWorkspaceItem()`** = xóa DOM cũ + render lại. Phải cập nhật state TRƯỚC khi gọi hàm này.

> [!NOTE]
> **`toggleQA()`** bị override bởi `gemini_ai.js` — version cuối cùng (chatbot) là active.

---

## 🎨 UI Flow

```
#introOverlay → #labRulesModal → #welcomeSetupModal (3 bảo hộ) → [Main Lab]
  ├── .lab-header    — Music, Sound, Reset, Hỏi đáp, Báo cáo Xanh, Tối ưu hóa
  ├── .side-dock     — Tab Dụng cụ | Tab Hóa chất (search + filter)
  ├── .workspace     — Canvas hiệu ứng + workspace items + Eco-bar
  └── #guidePanel    — Panel Hỏi đáp/Điều chế

Overlays: #dangerOverlay, #toxicOverlay, #safety-overlay (quiz),
          #modalOverlay, #eco-report-overlay, #opt-lab-overlay
Chatbot:  #unified-chatbot-container (inject bởi gemini_ai.js)
```

---

## 🔊 Hệ thống âm thanh

| | File | Chức năng |
|--|------|-----------|
| `AudioSystem` | `music/alert.mp3` | Cảnh báo |
| `AudioSystem` | `music/shatter.mp3` | Vỡ cốc |
| `AudioSystem` | `music/explosion.mp3` | Nổ |
| `MusicSystem` | `music/*.mp3` (5 bài + 1 drone) | Nhạc nền |

---

## 🧪 Thứ tự ưu tiên phát hiện phản ứng

1. `ChemistryEngine.checkPrecipitation()` — Ksp
2. `EXPLICIT_REACTIONS` — Tường minh (ưu tiên cao nhất)
3. `checkDissolution()` — Hòa tan kết tủa
4. 3-component check từ `REACTIONS`
5. `ChemistryEngine.checkCombustion()` — Cháy
6. `ChemistryEngine.checkSynthesisReactions()` — Tổng hợp
7. `ChemistryEngine.checkGunpowder()` — Thuốc súng
8. `getNeutralization / getGasEvolution / getRedoxDisplacement / getPrecipitation`
9. Indicator check — Quỳ tím, phenolphthalein

---

*Antigravity AI — 2026-05-18*
