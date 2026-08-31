# 🚀 STEM HUB - ARCHITECTURAL BLUEPRINT & COMPLETE SYSTEM DOCUMENTATION
> **Tài liệu Kỹ thuật Toàn diện & Source of Truth cho các Hệ thống AI Agent & Nâng cấp AI Nâng cao**  
> *Hệ thống Target: Cổng học tập & Lab ảo STEM HUB (THPT Quỳnh Lưu 4)*  
> *Phạm vi tài liệu: Đầy đủ kiến trúc Web, 4 Phòng Lab ảo (Hóa, Lý, Toán, Sinh), 2 con AI trong Lab Hóa, Engine Trợ lý Javit/NOVA HUD, Biometric Face 2FA, STEM Arena 1v1 Bot Heuristic, State Management & CSDL Firebase (Trừ phần Admin)*

---

## 📋 MỤC LỤC TỔNG QUAN
1. [Tổng quan Dự án & Công nghệ Cốt lõi](#1-tổng-quan-dự-án--công-nghệ-cốt-lõi)
2. [Sơ đồ Định tuyến & Đóng gói Trang Web](#2-sơ-đồ-định-tuyến--đóng-gói-trang-web)
3. [Phân tích Chi tiết 4 Phòng Lab STEM & Engine AI/Mô phỏng](#3-phân-tích-chi-tiết-4-phòng-lab-stem--engine-aimô-phỏng)
   - [3.1 Lab Hóa Học & 2 Con AI Trong Cùng 1 Lab](#31-lab-hóa-học--2-con-ai-trong-cùng-1-lab)
   - [3.2 Lab Vật Lý & Engine Phản Xạ Laser Vector 2D/3D](#32-lab-vật-lý--engine-phản-xạ-laser-vector-2d3d)
   - [3.3 Lab Toán Học & Thuật Toán Sinh Đề/KaTeX Rendering](#33-lab-toán-học--thuật-toán-sinh-đềkatex-rendering)
   - [3.4 Lab Sinh Học & Ghép Cặp Gen/Di Truyền](#34-lab-sinh-học--ghép-cặp-gendi-truyền)
4. [Trợ lý AI Tổng Javit / NOVA HUD (Agentic Assistant Engine)](#4-trợ-lý-ai-tổng-javit--nova-hud-agentic-assistant-engine)
5. [Đấu Trường 1v1 PvP & Cơ chế Bot Heuristics](#5-đấu-trường-1v1-pvp--cơ-chế-bot-heuristics)
6. [Hệ thống Biometric AI Face 2FA & Bảo mật](#6-hệ-thống-biometric-ai-face-2fa--bảo-mật)
7. [Quản lý Trạng thái (State Management) & Catalogs Dữ liệu](#7-quản-lý-trạng-thái-state-management--catalogs-dữ-liệu)
8. [Tích hợp Firebase & API Routes](#8-tích-hợp-firebase--api-routes)
9. [Bảng Tra Cứu File, Component & Hàm Quan Trọng](#9-bảng-tra-cứu-file-component--hàm-quan-trọng)
10. [Hướng dẫn & Quy tắc dành cho AI Agent khi Nâng cấp](#10-hướng-dẫn--quy-tắc-dành-cho-ai-agent-khi-nâng-cấp)

---

## 1. TỔNG QUAN DỰ ÁN & CÔNG NGHỆ CỐT LÕI

### 1.1 Mục tiêu Hệ thống
**STEM HUB** là cổng học tập STEM tương tác cao được xây dựng theo phong cách Sci-Fi dành cho học sinh THPT (đơn vị THPT Quỳnh Lưu 4). Hệ thống hợp nhất các phòng thí nghiệm ảo 3D/2D (Hóa học, Vật lý, Sinh học, Toán học), Đấu trường thách đấu PvP 1v1 theo thời gian thực, Phòng thi trắc nghiệm THPT QG chuẩn ma trận MoET, Mạng xã hội tri thức Story và Trợ lý AI Chỉ huy Agentic (Javit/NOVA HUD) có khả năng tự động thực thi lệnh UI, tổng hợp thoại giọng nói và suy luận học thuật.

### 1.2 Stack Công nghệ Cốt lõi
- **Framework**: Next.js 16 (App Router, Cấu hình Static Export `output: 'export'`)
- **Core Library**: React 19
- **Styling**: Tailwind CSS v4 + Vanilla CSS Design System (Glassmorphism, Neon Sci-Fi Glows, Dark/Light Mode)
- **Quản lý Trạng thái**: Zustand v5 (`useAppStore`, `useAudioStore`)
- **Backend & Auth**: Firebase v12 (Authentication, Firestore Database, Cloud Functions fallback)
- **Biometric AI Engine**: TensorFlow.js + `@vladmandic/face-api` (ResNet-34 Deep FaceNet 128-D Embeddings, 68 Landmark Detection, EAR Liveness Detection)
- **Hiệu ứng & Đồ họa**: Framer Motion, Lucide React, HTML5 Canvas, Three.js / React Three Fiber
- **Render Công thức**: KaTeX + Custom LaTeX Formatter (`mathFormatter.js`)
- **Âm thanh**: Web Audio API Synthesizer (`sound.js`) + HTML5 Cyber Audio Player (`CyberMusicPlayer.jsx`)

---

## 2. SƠ ĐỒ ĐỊNH TUYẾN & ĐÓNG GÓI TRANG WEB

### 2.1 Bản đồ Routes (Không bao gồm Admin)
| Route Path | Component File | Tính năng Cốt lõi |
| :--- | :--- | :--- |
| `/` | `src/app/page.js` | **Trang chủ / Danh mục Lab**: Khởi chạy 4 phòng lab ảo (Hóa, Lý, Sinh, Toán), thẻ tiến trình khóa học, banner khởi tạo nhanh. |
| `/dau-truong` | `src/app/dau-truong/page.js` | **Đấu Trường 1v1 PvP**: Ghép trận realtime/bot, chọn bộ trang bị thẻ bài, đánh theo lượt, hiệu ứng Freeze/Fog/Shield, cộng trừ ELO. |
| `/xep-hang` | `src/app/xep-hang/page.js` | **Bảng Xếp Hạng ELO**: Xếp hạng cao thủ theo các Rank (Cao Thủ, Kim Cương, Bạch Kim, Vàng, Bạc, Đồng), lọc theo Trường/Môn. |
| `/story` | `src/app/story/page.js` | **Mạng xã hội Story**: Thẻ bài viết bài giảng STEM, lưu bookmark, đếm tiến trình đọc. |
| `/phong-thi` | `src/app/phong-thi/page.js` | **Phòng Thi THPT QG**: Làm đề trắc nghiệm tính giờ 5 môn STEM, lưới chuyển câu hỏi, AI giải thích chi tiết, xuất chứng chỉ canvas. |
| `/ho-so` | `src/app/ho-so/page.js` | **Hồ Sơ Học Sinh**: Thống kê ELO, lịch sử đấu, danh hiệu, đăng ký/quản lý Biometric Face 2FA, cài đặt AI memory. |
| `/lien-he` | `src/app/lien-he/page.js` | **Liên hệ & Hỗ trợ**: Form gửi thắc mắc kỹ thuật. |
| `/auth/action` | `src/app/auth/action/page.js` | **Xử lý Firebase Auth**: Trạm tiếp nhận 1-Click Magic Link Email 2FA. |

---

## 3. PHÂN TÍCH CHI TIẾT 4 PHÒNG LAB STEM & ENGINE AI/MÔ PHỎNG

### 3.1 Lab Hóa Học & 2 Con AI Trong Cùng 1 Lab

Phòng Lab Hóa học chính (`QuantumLab v4.0`) được nhúng qua Iframe `/labs/lab-ktra15p/dist/index.html`. Trong file điều khiển [public/labs/lab-ktra15p/gemini_ai.js](file:///e:/project/cuoc_thi_AI/public/labs/lab-ktra15p/gemini_ai.js), class `UnifiedChatbot` vận hành **2 con AI riêng biệt ngay trong cùng 1 giao diện phòng lab**:

```
+-----------------------------------------------------------------------------------+
|                        QUANTUMLAB v4.0 - GIAO DIỆN PHÒNG LAB HÓA                  |
+-----------------------------------------------------------------------------------+
|  +-------------------------------------+  +------------------------------------+  |
|  |     ⚡ CON AI THỨ 1: CHỈ HUY AI     |  |   🌐 CON AI THỨ 2: TRỢ LÝ CHUNG     |  |
|  |       (Context-Aware AI Bot)        |  |         (General Chatbot)          |  |
|  +------------------+------------------+  +-----------------+------------------+  |
|                     |                                       |                     |
|                     v                                       v                     |
|  +-------------------------------------+  +------------------------------------+  |
|  |  Đọc Realtime từ Bàn Thí Nghiệm:    |  |  Trả lời lý thuyết chung chung     |  |
|  |  - getLabContext() đọc Nhiệt độ     |  |  về Hóa học THPT (Danh pháp IUPAC, |  |
|  |  - Năng lượng IDCL %, Vi phạm       |  |  cân bằng phương trình, độc tính)  |  |
|  |  - Phản ứng vừa xảy ra (equation)   |  |  Không theo dõi workspace.         |  |
|  |  - Hóa chất có trên bàn (.beaker)   |  |                                    |  |
|  |  - Log nhật ký gần đây (.log-msg)   |  |                                    |  |
|  +------------------+------------------+  +-----------------+------------------+  |
|                     |                                       |                     |
|                     +-------------------+-------------------+                     |
|                                         |                                         |
|                                         v                                         |
|  +-----------------------------------------------------------------------------+  |
|  |           Google Gemini API Multi-Model & API Key Failover Matrix           |  |
|  | (gemini-2.5-flash -> gemini-2.5-pro -> gemini-2.0-flash-lite -> 1.5-pro)      |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

#### Bảng so sánh 2 Con AI trong Phòng Lab Hóa học:
| Tiêu chí | ⚡ Con AI thứ 1: **CHỈ HUY AI (Quantum Commander)** | 🌐 Con AI thứ 2: **TRỢ LÝ CHUNG (General AI)** |
| :--- | :--- | :--- |
| **Mã nguồn** | [public/labs/lab-ktra15p/gemini_ai.js](file:///e:/project/cuoc_thi_AI/public/labs/lab-ktra15p/gemini_ai.js) (`getLabContext()`, `mode = 'lab'`) | [public/labs/lab-ktra15p/gemini_ai.js](file:///e:/project/cuoc_thi_AI/public/labs/lab-ktra15p/gemini_ai.js) (`mode = 'gen'`) |
| **Giao diện Tab UI** | Tab **`⚡ CHỈ HUY`** (`id="tab-mode-lab"`, `activeBot = 'lab'`) | Tab **`🌐 TRỢ LÝ CHUNG`** (`id="tab-mode-gen"`, `activeBot = 'gen'`) |
| **Nhận biết Workspace** | **CÓ (Real-time Context-Aware AI)**: Tự động đọc dữ liệu bàn thí nghiệm qua hàm `getLabContext()`. | **KHÔNG (Pure Chatbot)**: Không theo dõi hay đọc trạng thái bàn thí nghiệm. |
| **Dữ liệu Context đọc vào** | 1. `state.currentTemp` (Nhiệt độ phòng/đèn cồn)<br>2. `state.currentEnergy` (Chỉ số an toàn IDCL %)<br>3. `state.safetyViolations` (Số lần vi phạm an toàn)<br>4. `lastReactionData.equation` (Phản ứng vừa xảy ra do event `notify('reaction')` gửi tới)<br>5. `deskChemicals` (Danh sách hóa chất đang đặt trên bàn lab)<br>6. `recentLogs` (3 nhật ký thao tác gần nhất từ `.log-msg`) | Chỉ nhận duy nhất văn bản do người dùng gõ vào khung chat. |
| **System Prompt** | Đóng vai *"Quantum Commander"*, đọc `Trạng thái Lab hiện tại: ${context}` và trả lời 3 phần:<br>• 🎯 *PHƯƠNG TRÌNH & HIỆN TƯỢNG*<br>• ⚠️ *ĐỘC HẠI & AN TOÀN*<br>• 💡 *ỨNG DỤNG THỰC TẾ* | Đóng vai *"Trợ lý AI Hóa học QuantumLab"*, trả lời ngắn gọn (100-120 từ) các câu hỏi lý thuyết Hóa THPT, bắt buộc dùng chuẩn danh pháp IUPAC tiếng Anh. |
| **Nội dung Lab bổ trợ** | • **Engine hóa học**: `chemistry_engine.js` (Tính pH, tích số tan $K_{sp}$, dãy hoạt động kim loại).<br>• **Đánh giá Hóa học Xanh**: `assessment_ai.js` (Tính điểm IDCL & Atom Economy %).<br>• **Le Chatelier Lab**: `optimization_lab.js` (Cân bằng Haber-Bosch, Este hóa, $Fe(SCN)_3$).<br>• **Sandbox 10 bài**: Iframe `/labs/lab-hoa-sandbox/dist/index.html` đồng bộ tiến trình với `useAppStore.chemGame`. |

---

### 3.2 Lab Vật Lý & Engine Phản Xạ Laser Vector 2D/3D

- **Mã nguồn chính**: [src/lib/physicsEngine.js](file:///e:/project/cuoc_thi_AI/src/lib/physicsEngine.js), [src/lib/clientFunctions.js](file:///e:/project/cuoc_thi_AI/src/lib/clientFunctions.js#L1105-L1125), Iframe `/labs/PhysicsLab/index.html`.
- **Thuật toán Phản xạ Laser Vector (Ray-Tracing Reflection Engine)**:
  Hàm `calculateLaserPath(mirrors, sourcePos, targetPos)` tính toán đường đi tia laser qua hệ thống gương phẳng dựa trên Định luật phản xạ ánh sáng:
  $$\vec{d}' = \vec{d} - 2(\vec{d} \cdot \vec{n})\vec{n}$$
  Trong đó $\vec{d}$ là vector hướng tới, $\vec{n}$ là pháp tuyến mặt gương, $\vec{d}'$ là vector phản xạ.
- **Bản chất AI / Lập trình**:
  **KHÔNG sử dụng mô hình AI dự đoán (Machine Learning)** trong engine tính toán vật lý. Hệ thống dùng **Công thức Vật lý thuần túy & Thuật toán Đại số Vector (Deterministic Physics Rules)** để đảm bảo tính chuẩn xác 100% về mặt khoa học khi phản xạ tia laser hoặc tính toán dòng điện RLC.

---

### 3.3 Lab Toán Học & Thuật Toán Sinh Đề/KaTeX Rendering

- **Mã nguồn chính**: [src/lib/mathFormatter.js](file:///e:/project/cuoc_thi_AI/src/lib/mathFormatter.js), [src/lib/questionAiGenerator.js](file:///e:/project/cuoc_thi_AI/src/lib/questionAiGenerator.js#L27-L280), [src/lib/arenaGenerator.js](file:///e:/project/cuoc_thi_AI/src/lib/arenaGenerator.js).
- **Cách giải & Sinh đề bài**:
  - **Procedural Symbolic Generator**: Hàm `generateMathQuestions()` tự động sinh ngẫu nhiên số liệu bài toán (cực trị hàm số bậc 3, số phức $z = z_1 + z_2$, logarit, phương trình mặt phẳng $Oxyz$) và tự tính nghiệm đúng `correctAns` cùng lời giải từng bước.
  - **Biên dịch LaTeX / KaTeX**: `mathFormatter.js` (`formatMathText`) chuyển đổi các công thức ($\dfrac{a}{b}, \sqrt{x}, \int, \lim$) thành HTML KaTeX.
  - **Hỏi đáp mở**: Gọi Gemini LLM API khi học sinh đặt câu hỏi mở với Trợ lý Javit NOVA.
- **Tự động chấm & Gợi ý độ khó**:
  - So sánh chuỗi đáp án client-side với `correctAns`.
  - Phân loại độ khó câu hỏi theo ELO người chơi qua hàm `fetchFirestoreQuestions`.

---

### 3.4 Lab Sinh Học & Ghép Cặp Gen/Di Truyền

- **Mã nguồn chính**: Iframe `/labs/lab_sinh/dist/index.html`, [src/lib/questionAiGenerator.js](file:///e:/project/cuoc_thi_AI/src/lib/questionAiGenerator.js#L890-L915), [src/components/organisms/GlobalAIAssistant.jsx](file:///e:/project/cuoc_thi_AI/src/components/organisms/GlobalAIAssistant.jsx#L1014-L1077).
- **Nội dung tương tác**:
  - Ghép cặp bazơ nitơ ADN (A-T, G-C), tính số liên kết hydro $H = 2A + 3G$, giải mã chuỗi mã di truyền.
  - Tính tần số alen quần thể Hardy-Weinberg $p^2 + 2pq + q^2 = 1$, đột biến gen.
- **Cơ chế AI/Mô phỏng**:
  - **Mô phỏng tĩnh & Thuật toán di truyền**: `generateBioQuestions()` tự động tính toán chỉ số ADN/NST.
  - **Tích hợp Gemini LLM API**: Khi học sinh yêu cầu giải thích chuyên sâu (cơ chế enzyme, mô hình khảm động màng tế bào, Okazaki, vaccine B/T cells), `GlobalAIAssistant.jsx` gọi Gemini API sinh bài giảng chi tiết.

---

## 4. TRỢ LÝ AI TỔNG JAVIT / NOVA HUD (AGENTIC ASSISTANT ENGINE)

### 4.1 Kiến trúc & Luồng Xử lý (`GlobalAIAssistant.jsx`)
Trợ lý AI Tổng (**NOVA / Javit HUD**) là một widget Sci-Fi nổi trên toàn bộ trang web ([src/components/organisms/GlobalAIAssistant.jsx](file:///e:/project/cuoc_thi_AI/src/components/organisms/GlobalAIAssistant.jsx)):

```
+-----------------------------------------------------------------------------------+
|                        NOVA / JAVIT AGENTIC AI HUD ENGINE                         |
+-----------------------------------------------------------------------------------+
| 1. Context Injection: Route hiện tại, Học sinh, ELO, Active Lab, Session History  |
| 2. Provider LLM: Google Gemini API (Failover 8 Keys x 5 Models x 2 API Versions)  |
| 3. Academic Fairness Guardrail: Tự đóng HUD khi đang PvP 1v1 hoặc Thi thực chiến  |
| 4. Agentic Function Commands Output Parsing:                                      |
|    - [[NAV:url]]             : Chuyển hướng trang web / Mở lab ảo               |
|    - [[TOGGLE_THEME]]        : Đổi chế độ Sáng / Tối                            |
|    - [[AUDIO_PLAY_LOFI]]     : Bật nhạc Lo-Fi học bài                             |
|    - [[AUDIO_PLAY_SCIFI]]    : Bật nhạc Cyber Ambient                             |
|    - [[AUDIO_PLAY_BRAINWAVE]]: Bật nhạc Sóng não Alpha 10Hz                      |
|    - [[AUDIO_PAUSE]]         : Tạm dừng phát nhạc                                 |
|    - [[AUDIO_NEXT]]          : Chuyển bài tiếp theo                               |
|    - [[LINK:Title:URL]]      : Tạo Nút Khám Phá Thư viện Tổng kiến thức           |
| 5. Client-Side Knowledge Tra Cứu: Regex/Includes sinh link Google Search tự động  |
| 6. Speech STT & TTS: Nhận diện giọng nói vi-VN + Phát âm thoại Web Speech API     |
+-----------------------------------------------------------------------------------+
```

### 4.2 Thấu hiểu về `search_knowledge` & Các biến Cấu hình
- **`search_knowledge(query)` trong thực tế mã nguồn**:
  **KHÔNG CÓ Vector Search / Embedding backend** và **KHÔNG CÓ function call backend riêng**. Hệ thống dùng **Client-side String Matching (Regex / string includes)** trong hàm `generateOfflineFallbackResponse` và `FormattedAIMessage`: Khi phát hiện từ khóa Hóa/Lý/Sinh/Toán, UI tự động bóc tách tên chủ đề và tạo URL tìm kiếm Google `https://www.google.com/search?q=...` trực tiếp cho học sinh tra cứu.
- **Biến `subjectFrequency` & `conciseMode`**:
  Trong mã nguồn chạy thực tế của `GlobalAIAssistant.jsx` và `useAppStore.js`, hai biến này **không tồn tại trong runtime code** (đã được tối ưu hóa trực tiếp bằng `systemInstructionText` cố định quy định độ dài súc tích 80-120 từ, tự động nhận diện vị trí `currentPage` và thông tin người dùng `userDisplayName`, `userLevel`, `userElo`).

---

## 5. ĐẤU TRƯỜNG 1V1 PVP & CƠ CHẾ BOT HEURISTICS

### 5.1 Kiến trúc Ghép Trận (`src/lib/matchmaker.js`)
- **Người đấu Người (Realtime PvP)**: Sử dụng Firestore `onSnapshot` lắng nghe collection `/matches` để ghép 2 người chơi có chỉ số ELO tương đồng ($\pm 100$ ELO).
- **Cơ chế Bot Heuristics (Không dùng LLM API)**:
  - Khi người chơi bấm tìm trận, nếu sau **10 giây** không tìm thấy đối thủ người thật, Firebase Cloud Function `assignBotOpponent` (hoặc `matchmaker.js`) sẽ tự động kích hoạt một **Bot Heuristic**.
  - **Bản chất Bot**: Bot là một thực thể lập trình theo thuật toán suy luận Heuristics (Deterministic Decision Rules), tự động chọn thẻ bài trong `EQUIPMENT_CATALOG` và đưa ra đáp án dựa trên tỉ lệ xác suất khớp với ELO người chơi. Bot phản hồi tức thì, không tiêu tốn API Key.

---

## 6. HỆ THỐNG BIOMETRIC AI FACE 2FA & BẢO MẬT

### 6.1 Luồng Nhận diện Khuôn mặt (`FaceAuthModal.jsx`)
- **Mô hình AI**: TensorFlow.js + `@vladmandic/face-api` (ResNet-34 Deep FaceNet 128-D Embeddings, 68 điểm mốc sinh học).
- **Phát hiện Chớp mắt Người thật (EAR Liveness Detection)**:
  $$\text{EAR} = \frac{\|p_{37} - p_{41}\| + \|p_{38} - p_{40}\|}{2 \cdot \|p_{36} - p_{39}\|}$$
  Khi $\text{EAR} < 0.28$, hệ thống xác nhận chớp mắt (`isLiveConfirmedRef.current = true`) để chống giả mạo bằng ảnh/video.
- **Đồng bộ Đa Tab (Cross-Tab Sync)**: Lắng nghe qua `BroadcastChannel('stemhub_2fa_channel')` và sự kiện `localStorage` `2FA_EMAIL_VERIFIED_SUCCESS`.

---

## 7. QUẢN LÝ TRẠNG THÁI (STATE MANAGEMENT) & CATALOGS DỮ LIỆU

### 7.1 Global App Store (`src/store/useAppStore.js`)
- `user`: Thông tin người dùng (`uid`, `displayName`, `email`, `elo`, `school`, `avatar`).
- `personalization`: Cấu hình Face 2FA, cài đặt danh hiệu.
- `chemGame`: Tiến trình 10 bài thí nghiệm sandbox Hóa học.
- `activeLab`: Trạng thái lab ảo đang mở.

### 7.2 Audio Store (`src/store/useAudioStore.js`)
- Quản lý danh sách nhạc Cyber, thể loại (Lo-Fi, Sci-Fi, Brainwave) và âm thanh SFX.

### 7.3 Danh mục Thẻ Trang bị (`src/data/equipmentCatalog.js`)
- Chứa toàn bộ các thẻ bài Đấu trường (`DAMAGE`, `HEAL`, `FREEZE`, `FOG`, `SHIELD`, `BUFF`).

---

## 8. TÍCH HỢP FIREBASE & API ROUTES

- **Firebase Config**: [src/lib/firebase.js](file:///e:/project/cuoc_thi_AI/src/lib/firebase.js) (Auth, Firestore, Cloud Functions).
- **Client Functions Fallback**: [src/lib/clientFunctions.js](file:///e:/project/cuoc_thi_AI/src/lib/clientFunctions.js) (Giả lập Cloud Functions khi offline).
- **API Send OTP**: [src/app/api/send-otp/route.js](file:///e:/project/cuoc_thi_AI/src/app/api/send-otp/route.js) (Nodemailer gửi Magic Link 2FA).

---

## 9. BẢNG TRA CỨU FILE, COMPONENT & HÀM QUAN TRỌNG

| Component / Module | Đường dẫn File | Hàm / Logic Trọng tâm |
| :--- | :--- | :--- |
| **Global AI Assistant** | [src/components/organisms/GlobalAIAssistant.jsx](file:///e:/project/cuoc_thi_AI/src/components/organisms/GlobalAIAssistant.jsx) | `handleSend`, `processAgentCommands`, `generateOfflineFallbackResponse`, `isMatchOrPracticeActive` |
| **Lab Hóa (2 AI Chatbots)** | [public/labs/lab-ktra15p/gemini_ai.js](file:///e:/project/cuoc_thi_AI/public/labs/lab-ktra15p/gemini_ai.js) | `UnifiedChatbot`, `getLabContext` (AI 1 Chỉ huy), `callGemini` (AI 2 Trợ lý chung) |
| **Engine Hóa Học** | [public/labs/lab-ktra15p/public/chemistry_engine.js](file:///e:/project/cuoc_thi_AI/public/labs/lab-ktra15p/public/chemistry_engine.js) | `calculatepH`, `checkPrecipitate`, `checkReaction` |
| **Engine Vật Lý Laser** | [src/lib/physicsEngine.js](file:///e:/project/cuoc_thi_AI/src/lib/physicsEngine.js) | `calculateLaserPath` (Ray-tracing phản xạ gương vector) |
| **Sinh Đề & Lời Giải Toán** | [src/lib/questionAiGenerator.js](file:///e:/project/cuoc_thi_AI/src/lib/questionAiGenerator.js) | `generateMathQuestions`, `generateBioQuestions` |
| **Format KaTeX Toán** | [src/lib/mathFormatter.js](file:///e:/project/cuoc_thi_AI/src/lib/mathFormatter.js) | `formatMathText`, `renderKaTeXSafe` |
| **Matchmaker & Bot 1v1** | [src/lib/matchmaker.js](file:///e:/project/cuoc_thi_AI/src/lib/matchmaker.js) | `findMatch`, `assignBotOpponent` (Cơ chế Bot Heuristic) |
| **Biometric Face 2FA** | [src/components/organisms/FaceAuthModal.jsx](file:///e:/project/cuoc_thi_AI/src/components/organisms/FaceAuthModal.jsx) | `detectEAR`, `extractFaceDescriptorFromCanvas`, `isLiveConfirmedRef` |

---

## 10. HƯỚNG DẪN & QUY TẮC DÀNH CHO AI AGENT KHI NÂNG CẤP

> **Lưu ý dành cho Claude / Gemini / GPT-4o khi thực hiện đợt cải tiến AI tiếp theo**:

1. **Khi nâng cấp Trợ lý Javit / NOVA HUD**:
   - Giữ nguyên cơ chế Agentic Command Parsing (`[[NAV:url]]`, `[[TOGGLE_THEME]]`, `[[AUDIO_...]]`).
   - Đảm bảo hàm `isMatchOrPracticeActive()` luôn chạy để khóa HUD khi người dùng đang thi đấu/luyện tập.
2. **Khi tích hợp RAG / Vector Search**:
   - Đặt các module vector store hoặc embedding search vào `src/lib/ragService.js` (mới).
   - Tối ưu hóa việc trả lời công thức Toán học qua `mathFormatter.js`.
3. **Khi làm việc với Lab Hóa Học**:
   - Lưu ý `public/labs/lab-ktra15p/gemini_ai.js` quản lý **2 con AI cùng lúc** (`lab` mode dùng `getLabContext` và `gen` mode dùng câu hỏi lý thuyết chung). Hãy giữ nguyên cấu trúc phân luồng này.
4. **Quy tắc Build & Export**:
   - `next.config.mjs` cài đặt `output: 'export'` để deploy Firebase Static Hosting. Mọi link chuyển trang client-side phải dùng Next.js Router hoặc `<Link prefetch={false}>`.
