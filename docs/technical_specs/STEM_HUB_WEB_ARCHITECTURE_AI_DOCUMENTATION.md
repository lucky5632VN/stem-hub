# 🚀 STEM HUB - ARCHITECTURAL BLUEPRINT & COMPLETE SYSTEM DOCUMENTATION
> **Tài liệu Kỹ thuật Toàn diện & Source of Truth cho các Hệ thống AI Agent & Mô hình AI Tự Huấn Luyện (Self-Trained AI)**  
> *Hệ thống Target: Cổng học tập & Lab ảo STEM HUB (THPT Quỳnh Lưu 4)*  
> *Phạm vi tài liệu: Đầy đủ kiến trúc Web, 4 Phòng Lab ảo (Hóa, Lý, Toán, Sinh), Kiến trúc 6 Mô hình AI Tự Train (Self-Trained AI Registry), Multilingual TF-IDF RAG Service, Trợ lý Javit/NOVA HUD, Biometric Face 2FA, STEM Arena 1v1 Bot Heuristics, State Management & CSDL Firebase.*

---

## 📋 MỤC LỤC TỔNG QUAN
1. [Tổng quan Dự án & Công nghệ Cốt lõi](#1-tổng-quan-dự-án--công-nghệ-cốt-lõi)
2. [Sơ đồ Định tuyến & Đóng gói Trang Web](#2-sơ-đồ-định-tuyến--đóng-gói-trang-web)
3. [Kiến trúc Minh bạch 6 Mô hình AI Tự Huấn Luyện (Self-Trained AI Registry)](#3-kiến-trúc-minh-bạch-6-mô-hình-ai-tự-huấn-luyện-self-trained-ai-registry)
4. [Phân tích Chi tiết 4 Phòng Lab STEM & Engine AI/Mô phỏng](#4-phân-tích-chi-tiết-4-phòng-lab-stem--engine-aimô-phỏng)
   - [4.1 Lab Hóa Học & Kiến trúc Hybrid Chem Risk Classifier](#41-lab-hóa-học--kiến-trúc-hybrid-chem-risk-classifier)
   - [4.2 Lab Vật Lý & Multi-Label Diagnostic kNN + Vector Laser 2D/3D](#42-lab-vật-lý--multi-label-diagnostic-knn--vector-laser-2d3d)
   - [4.3 Lab Toán Học & 1PL Rasch IRT Adaptive Engine](#43-lab-toán-học--1pl-rasch-irt-adaptive-engine)
   - [4.4 Lab Sinh Học & Multi-Gene Bayesian Reasoner](#44-lab-sinh-học--multi-gene-bayesian-reasoner)
5. [Trợ lý AI Tổng Javit / NOVA HUD & Multilingual TF-IDF RAG Service](#5-trợ-lý-ai-tổng-javit--nova-hud--multilingual-tf-idf-rag-service)
6. [Đấu Trường 1v1 PvP & Cơ chế Bot Heuristics](#6-đấu-trường-1v1-pvp--cơ-chế-bot-heuristics)
7. [Hệ thống Biometric AI Face 2FA & Bảo mật](#7-hệ-thống-biometric-ai-face-2fa--bảo-mật)
8. [Quản lý Trạng thái (State Management) & Catalogs Dữ liệu](#8-quản-lý-trạng-thái-state-management--catalogs-dữ-liệu)
9. [Bảng Tra Cứu File, Component & Mã Nguồn Huấn Luyện AI](#9-bảng-tra-cứu-file-component--mã-nguồn-huấn-luyện-ai)
10. [Hướng dẫn & Quy tắc dành cho AI Agent khi Nâng cấp](#10-hướng-dẫn--quy-tắc-dành-cho-ai-agent-khi-nâng-cấp)

---

## 1. TỔNG QUAN DỰ ÁN & CÔNG NGHỆ CỐT LÕI

### 1.1 Mục tiêu Hệ thống
**STEM HUB** là cổng học tập STEM tương tác cao được xây dựng theo phong cách Sci-Fi dành cho học sinh THPT (đơn vị THPT Quỳnh Lưu 4). Hệ thống hợp nhất các phòng thí nghiệm ảo 3D/2D (Hóa học, Vật lý, Sinh học, Toán học), Đấu trường thách đấu PvP 1v1 theo thời gian thực, Phòng thi trắc nghiệm THPT QG chuẩn ma trận MoET, Mạng xã hội tri thức Story và Trợ lý AI Chỉ huy Agentic (Javit/NOVA HUD) có khả năng tự động thực thi lệnh UI, tổng hợp thoại giọng nói và suy luận học thuật dựa trên bộ dữ liệu AI tự huấn luyện cục bộ.

### 1.2 Stack Công nghệ Cốt lõi
- **Framework**: Next.js 16 (App Router, Cấu hình Static Export `output: 'export'`)
- **Core Library**: React 19
- **Styling**: Tailwind CSS v4 + Vanilla CSS Design System (Glassmorphism, Neon Sci-Fi Glows, Dark/Light Mode)
- **AI/ML Runtime (Client-Side & Node.js)**: TensorFlow.js, `@xenova/transformers`, `ml-knn`, `natural` (Naive Bayes), Multi-Layer Softmax Neural Nets.
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

## 3. KIẾN TRÚC MINH BẠCH 3 NHÓM AI (SELF-TRAINED REGISTRY & DISCLOSURE)

Hệ thống STEM HUB phân định minh bạch **3 nhóm AI riêng biệt** (khai báo công khai tại `AITransparencyModal.jsx` và `TRAINING_LOG.md`):

```
+---------------------------------------------------------------------------------------------------+
|                                 STEM HUB TRIPLE-AI ENGINE ARCHITECTURE                            |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [ NHÓM 1: AI TỰ TRAIN 100% CỤC BỘ ]   --->   [ NHÓM 2: LLM NỀN TẢNG (GEMINI API) ]               |
|  - 6 Modules (Chem, Phys, Intent, Math,        - Chỉ dùng làm "Language Synthesizer"              |
|    Genetics, RAG TF-IDF).                      - Diễn đạt lại ngữ cảnh RAG thành câu              |
|  - Chạy local 100%, tự ra quyết định.           trả lời Tiếng Việt tự nhiên.                       |
|                                                                                                   |
|  [ NHÓM 3: THƯ VIỆN AI PRETRAINED CÓ SẴN ]                                                       |
|  - @vladmandic/face-api (ResNet-34 Face 2FA, 68 Landmarks). Chú thích rõ: KHÔNG thuộc phạm vi      |
|    6 mô hình AI tự train của dự án.                                                               |
+---------------------------------------------------------------------------------------------------+
```

### Bảng Đăng ký 6 Mô hình AI Tự Train (Self-Trained Registry & Real Audit Metrics)
*Lưu ý: Tất cả các chỉ số dưới đây được sinh tự động 100% từ lệnh `node src/ai-training/scripts/run-all-audits.js` và được ghi trực tiếp vào `TRAINING_LOG.md`.*

| STT | Tên Mô hình Kỹ thuật | Thuật toán & Kiến trúc | Tập dữ liệu & Mã nguồn Huấn luyện | Chỉ số Kiểm thử Tái lập Thực tế | 95% Wilson Score CI |
|---|---|---|---|---|---|
| **1** | **ChemLab Risk Classifier** | Hybrid: Dense Softmax NN (1000 Epochs GD) + Circuit Breaker | `risk-dataset.json` (144 Train / 36 Test) + 20 Edge<br>`src/ai-training/scripts/chem-risk_train.js` | **100.00%** Test Acc<br>**95.00%** Edge Acc (0 False Negatives) | Test: [90.4%, 100.0%]<br>Edge: [76.4%, 99.1%] |
| **2** | **Physics Diagnostic Classifier** | Multi-Label kNN ($k=5$) + Z-Score StandardScaler | `attempts.json` (96 Train / 24 Test) + 15 Edge<br>`src/ai-training/scripts/physics-error_train.js` | **100.00%** Test Acc<br>**86.67%** Multi-Error Combo Acc | Test: [86.2%, 100.0%]<br>Edge: [62.1%, 96.3%] |
| **3** | **Javit Intent Classifier** | Multinomial Naive Bayes + Text Normalizer | `intent-samples.json` (300 Train + 30 Unseen Test)<br>`src/ai-training/scripts/intent_train.js` | **83.33%** Normalized Unseen Test Acc (60.0% Raw) | Test: [66.4%, 92.7%] ($n=30$) |
| **4** | **Math Adaptive IRT Engine** | 1PL Rasch Item Response Theory (ELO Parameterized) | `src/data/models/math-irt-model.json`<br>`src/lib/mathAdaptiveEngine.js` | Target Band Hits ($P(\text{correct}) \in [60\%, 75\%]$) | [16.8%, 68.7%] ($n=10$) |
| **5** | **Genetics Bayesian Reasoner** | Bayesian Conditional Probability Tables (CPT) | `src/lib/geneticsBayes.js`<br>`src/lib/test-bayes-genetics.js` | **100.00%** Mendel Verification (10/10 Cases) | [72.2%, 100.0%] ($n=10$) |
| **6** | **Multilingual TF-IDF RAG Service** | N-Gram TF-IDF Matrix ($TF \times IDF$) & Cosine Similarity | `stem-corpus.json` (100 chunks, 4862 tokens)<br>`src/ai-training/scripts/build-rag-embeddings.js` | **100.00%** Top-1 Match, **100.00%** Top-3 Hit | [75.7%, 100.0%] ($n=12$) |

---

## 4. PHÂN TÍCH CHI TIẾT 4 PHÒNG LAB STEM & ENGINE AI/MÔ PHỎNG

### 4.1 Lab Hóa Học & Kiến trúc Hybrid Chem Risk Classifier

Phòng Lab Hóa học chính (`QuantumLab v4.0`) được nhúng qua Iframe `/labs/lab-ktra15p/dist/index.html`. Trong file điều khiển [public/labs/lab-ktra15p/gemini_ai.js](public/labs/lab-ktra15p/gemini_ai.js), class `UnifiedChatbot` vận hành kiến trúc Hybrid An toàn:

- **Logic Phân loại Rủi ro (Hybrid Risk Engine)**:
  - **NhãnDiscrete cuối cùng (Safe / Warning / Danger)**: Quyết định 100% bởi Luật An toàn cứng (Hard Circuit Breaker) nhằm đảm bảo an toàn tuyệt đối, đạt **95.00%** Discrete Accuracy trên 20 ca biên và **0% False Negatives**.
  - **Thanh đo rủi ro UI (Continuous Gauge)**: Được điều khiển bởi Mạng nơ-ron Softmax ($P(\text{Danger}) \in [0.0, 1.0]$) huấn luyện qua **1000 Epochs Gradient Descent** (Loss $1.166 \rightarrow 0.234$). Điểm số nơ-ron chứng minh tính **Monotonic Correlation** tăng đơn điệu theo mức độ nguy hiểm thực tế ($22.51\% < 51.43\% < 71.57\%$).

---

### 4.2 Lab Vật Lý & Multi-Label Diagnostic kNN + Vector Laser 2D/3D

- **Mã nguồn chính**: `src/lib/physicsEngine.js`, `src/ai-training/scripts/physics-error_train.js`, Iframe `/labs/PhysicsLab/index.html`.
- **Mô hình AI Chẩn đoán Lỗi**:
  Thuật toán Multi-Label kNN ($k=5$) với bộ chuẩn hóa Z-Score `StandardScaler` trên 3 trục đặc trưng $(\Delta \theta, \Delta x, \Delta n)$, xuất xác suất % đồng thời cho 3 dạng sai sót:
  - `ERR_ANGLE`: Sai góc tới gương/thấu kính.
  - `ERR_POS`: Sai vị trí tiêu điểm.
  - `ERR_INDEX`: Sai chiết suất môi trường.
- **Engine Phản xạ Laser Vector 2D/3D**:
  Hàm `calculateLaserPath` tính toán đường đi tia laser dựa trên Định luật phản xạ ánh sáng thuần túy:
  $$\vec{d}' = \vec{d} - 2(\vec{d} \cdot \vec{n})\vec{n}$$

---

### 4.3 Lab Toán Học & 1PL Rasch IRT Adaptive Engine

- **Mã nguồn chính**: `src/lib/mathAdaptiveEngine.js`, `src/lib/mathFormatter.js`, `src/lib/questionAiGenerator.js`.
- **Mô hình Lý thuyết Ứng đáp Câu hỏi (1PL Rasch IRT Model)**:
  Hệ thống tính toán xác suất thành công của học sinh $P(\text{correct})$ từ thang điểm ELO ($\theta, b$):
  $$P(\text{correct}) = \frac{1}{1 + e^{-1.7(\theta - b)}}, \quad \theta = \frac{\text{ELO}_{student} - 1500}{400}, \quad b = \frac{\text{ELO}_{item} - 1500}{400}$$
  Mô hình tự động chọn câu hỏi thích ứng để giữ $P(\text{correct})$ trong vùng phát triển tối ưu ($60\% - 75\%$).
- **Biên dịch LaTeX / KaTeX**: `mathFormatter.js` (`formatMathText`) chuyển đổi các công thức thành HTML KaTeX.

---

### 4.4 Lab Sinh Học & Multi-Gene Bayesian Reasoner

- **Mã nguồn chính**: `src/lib/geneticsBayes.js`, Iframe `/labs/lab_sinh/dist/index.html`.
- **Suy luận Xác suất Bayes Di truyền (Bayesian CPT Reasoning)**:
  Xây dựng Bảng xác suất có điều kiện (Conditional Probability Table) cho các phép lai 2 gen trở lên theo đúng quy luật phân ly độc lập Mendel mở rộng:
  $$P(G_{offspring} \mid G_{parent1}, G_{parent2}) = \prod_{i=1}^{n} P(g_i \mid g_{p1,i}, g_{p2,i})$$
  Đạt **100% verification** trên 10 unit test cases di truyền.

---

## 5. TRỢ LÝ AI TỔNG JAVIT / NOVA HUD & MULTILINGUAL TF-IDF RAG SERVICE

### 5.1 Multilingual TF-IDF Vector Embedding RAG Service (`src/lib/ragService.js`)
- **Tập dữ liệu tri thức**: 100 đoạn bài giảng STEM chuẩn hóa (`stem-corpus.json`).
- **Trích xuất Ma trận TF-IDF ($TF \times IDF$)**:
  $$IDF(w) = \ln\left(\frac{N + 1}{DF(w) + 1}\right) + 1.0, \quad TFIDF(w) = TF(w) \times IDF(w)$$
  File `src/data/rag-vectors.json` lưu trữ 4,862 N-Gram tokens. Khi học sinh hỏi, hàm `retrieveTopK(query, k=3)` tính Cosine Similarity client-side **được cô lập hoàn toàn trong Web Worker (Background Thread) nhằm tránh đóng băng giao diện (UI Freezing)** để trích xuất ngữ cảnh chính xác.

### 5.2 Javit Intent Classifier & Normalizer (`src/lib/intentClassifier.js`)
- **Thuật toán**: Naive Bayes phân loại ý định tiếng Việt kết hợp `textNormalizer.js` (chuyển đổi teencode học sinh sang tiếng Việt chuẩn).
- **Cơ chế Fallback & Ngưỡng tin cậy**: Nếu confidence $< 0.65$, hệ thống chuyển sang RAG Service. Đạt **83.33%** normalized accuracy trên tập câu thử nghiệm chưa từng gặp.

### 5.3 Agentic Function Commands Parsing
Giao diện NOVA HUD bóc tách các lệnh hệ thống để tự động điều khiển web:
- `[[NAV:url]]`: Chuyển trang web / mở phòng lab.
- `[[TOGGLE_THEME]]`: Đổi chế độ Sáng / Tối.
- `[[AUDIO_PLAY_LOFI]]` / `[[AUDIO_PLAY_SCIFI]]` / `[[AUDIO_PAUSE]]`: Điều khiển nhạc nền.

---

## 6. ĐẤU TRƯỜNG 1V1 PVP & KIẾN TRÚC TỐI ƯU HẠNG NGẠCH 0 VNĐ

### 6.1 Ghép trận & Bot Heuristics (`src/lib/matchmaker.js`)
- **Ghép trận người dùng**: Firestore `onSnapshot` lắng nghe ghép 2 người chơi $\pm 100$ ELO.
- **Bot Heuristic 1v1**: Khi quá 10 giây không có người thật, Bot Heuristic tự động tham gia đấu. Bot hoạt động theo thuật toán luật quyết định (Deterministic Rules), không tiêu tốn API Key.

### 6.2 Kiến trúc State Batching trên RAM (`src/store/usePvPStore.js`)
- **Cô lập trên RAM trình duyệt**: Toàn bộ vòng đời trận đấu (thời gian đếm ngược `timeRemaining`, điểm số, mảng câu trả lời, hiệu ứng đóng băng 500ms, sương mù) được lưu trữ và tính toán trong Zustand RAM, đảm bảo 0ms UI latency.
- **Đồng bộ hóa Checkpoint (Cắt giảm 98,6% lượt ghi)**: Loại bỏ triệt để lệnh ghi Firestore mỗi giây. Hệ thống chỉ đẩy dữ liệu tiến độ ở 3 mốc cố định: 120s, 60s, 20s.
- **Giao dịch chốt hạ nguyên tử (Single Atomic Write)**: Kết thúc trận, `finalizeMatch()` sử dụng `runTransaction` gộp kết quả, ELO và crystal thành 1 lượt ghi duy nhất.
- **Bảo vệ toàn vẹn F5**: Tự động mã hóa sao lưu vào `sessionStorage` để khôi phục tức thời nếu học sinh vô tình reload trang.

### 6.3 Giao thức Xử thua tự động 4 Tầng (Zero-Cost 4-Tier Timeout Fallback)
1. **Tầng 1 (Graceful Exit Trap)**: Bắt hook `beforeunload` / `pagehide`, gửi cờ `playerAbandoned` khi học sinh đóng tab / tắt trình duyệt; đối thủ nhận cờ qua `onSnapshot` sau 100ms và được xử thắng tức thì.
2. **Tầng 2 (Opponent-Driven Watchdog Claim)**: Client của người chơi còn lại duy trì Watchdog giám sát. Nếu đối thủ im lặng $> 25$ giây, client còn lại chủ động kích hoạt `claimTimeoutVictory()` bằng `runTransaction` để xử thắng và trừ 20 ELO kẻ bỏ cuộc.
3. **Tầng 3 (Server Expiration Barrier)**: Phòng đấu được khóa bởi `matchStartTime` và trần thời gian `expiresAt = matchStartTime + 180s + 30s`. Mọi cập nhật sau mốc này đều bị Firestore Rules chặn đứng.
4. **Tầng 4 (Passive Lazy Garbage Collection)**: Khi người dùng mới tìm trận trong `matchmaker.js`, hệ thống tiện tay quét và dọn dẹp các phòng quá hạn mồ côi mà không phát sinh thêm bất kỳ chi phí nào.

---

## 7. HỆ THỐNG BIOMETRIC AI FACE 2FA & BẢO MẬT

- **ResNet-34 Deep FaceNet 128-D Embeddings**: Quét 68 điểm mốc sinh học khuôn mặt thời gian thực qua `@vladmandic/face-api`.
- **Chống giả mạo EAR (Eye Aspect Ratio)**:
  $$\text{EAR} = \frac{\|p_{37} - p_{41}\| + \|p_{38} - p_{40}\|}{2 \cdot \|p_{36} - p_{39}\|}$$
  Bắt buộc người dùng chớp mắt ($\text{EAR} < 0.28$) để xác nhận sự sống trước khi kích hoạt 2FA.

---

## 8. QUẢN LÝ TRẠNG THÁI (STATE MANAGEMENT) & CATALOGS DỮ LIỆU

- **`usePvPStore.js`**: Quản lý State Batching Đấu trường 1v1, đồng bộ Checkpoint 120s/60s/20s, Watchdog Timeout và rehydrate từ `sessionStorage`.
- **`useAppStore.js`**: Lưu giữ `user`, `personalization`, `chemGame` (10 bài sandbox), `subjectFrequency` (tần suất môn học) và `conciseMode` (chế độ trả lời súc tích).
- **`useAudioStore.js`**: Quản lý nhạc nền Lo-Fi / Sci-Fi / Brainwave và âm thanh hiệu ứng Web Audio API.

---

## 9. BẢNG TRA CỨU FILE, COMPONENT & MÃ NGUỒN HUẤN LUYỆN AI

| Module / Component | Đường dẫn File Mã nguồn | Chức năng Kỹ thuật Cốt lõi |
| :--- | :--- | :--- |
| **Chem Risk Train Script** | `src/ai-training/scripts/chem-risk_train.js` | Train Dense Softmax NN 1000 Epochs GD + Test Monotonic Trend |
| **Physics Error Train Script** | `src/ai-training/scripts/physics-error_train.js` | Train Multi-Label kNN Z-Score StandardScaler |
| **RAG Embeddings Generator** | `src/ai-training/scripts/build-rag-embeddings.js` | Build N-Gram TF-IDF Matrix (4,862 tokens) & IDF Weights |
| **Intent Classifier Script** | `src/ai-training/scripts/intent_train.js` | Train Multinomial Naive Bayes Intent Model |
| **RAG Query Service** | `src/lib/ragService.js` | Client-side TF-IDF Cosine Similarity Retriever |
| **Text Normalizer** | `src/lib/textNormalizer.js` | Bộ chuẩn hóa Teencode Tiếng Việt cho AI |
| **Math IRT Engine** | `src/lib/mathAdaptiveEngine.js` | 1PL Rasch IRT Probability & Difficulty Selector |
| **Genetics Bayes Reasoner** | `src/lib/geneticsBayes.js` | Multi-gene CPT Probabilistic Inheritance Engine |
| **Global AI HUD** | `src/components/organisms/GlobalAIAssistant.jsx` | Agentic HUD, Intent Call, Format Message, Audio Ducking |
| **AI Transparency Registry** | `src/components/organisms/AITransparencyModal.jsx` | Giao diện Công khai Minh bạch 6 Mô hình AI Tự Train |
| **Training Log File** | `TRAINING_LOG.md` | Báo cáo chi tiết accuracy, loss và số mẫu train/test |

---

## 10. HƯỚNG DẪN & QUY TẮC DÀNH CHO AI AGENT KHI NÂNG CẤP

1. **Bảo tồn tính Minh bạch**: Mọi mô hình AI tự train mới thêm vào PHẢI được cập nhật vào `TRAINING_LOG.md` và `AITransparencyModal.jsx`.
2. **Quy tắc Build Static Export**: `next.config.mjs` cài đặt `output: 'export'`. Mọi đường dẫn và tài nguyên AI (file `.json`, weights) phải nằm trong thư mục `src/data/` hoặc `public/` để build thành công.
3. **Tuyệt đối Không Sửa Công thức Khoa học Chính xác**: Giữ nguyên các công thức Vật lý Ray-tracing, Hóa học pH/IDCL và Sinh học Hardy-Weinberg.
