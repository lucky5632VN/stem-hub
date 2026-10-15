---
name: STEM HUB
description: The Cyber Academy Command Center - Trung tâm Chỉ huy Học viện Không gian
colors:
  primary: "#F0398C"
  primary-purple: "#8B5CF6"
  accent-cyan: "#06B6D4"
  dark-bg-primary: "#0F0B1A"
  dark-bg-secondary: "#1A1428"
  dark-bg-tertiary: "#241C38"
  dark-border: "#33284A"
  dark-text-primary: "#F2EDFA"
  dark-text-secondary: "#A99BC4"
  light-bg-primary: "#F8F6FC"
  light-bg-secondary: "#FFFFFF"
  light-bg-tertiary: "#F0EBFA"
  light-border: "#E2D9F3"
  light-text-primary: "#1E152A"
  light-text-secondary: "#6B5E85"
  success: "#10B981"
  warning: "#F59E0B"
  danger: "#F87171"
  lab-math: "#06B6D4"
  lab-physics: "#A855F7"
  lab-chemistry: "#F59E0B"
  lab-biology: "#10B981"
typography:
  display:
    fontFamily: "Be Vietnam Pro, Inter, Plus Jakarta Sans, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Be Vietnam Pro, Inter, Plus Jakarta Sans, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Be Vietnam Pro, Inter, Plus Jakarta Sans, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Be Vietnam Pro, Inter, Plus Jakarta Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Be Vietnam Pro, Inter, Plus Jakarta Sans, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  card-panel:
    backgroundColor: "{colors.dark-bg-secondary}"
    textColor: "{colors.dark-text-primary}"
    rounded: "{rounded.lg}"
    padding: "24px"
  logo-brand:
    gradient: "linear-gradient(to right, {colors.primary}, {colors.primary-purple}, {colors.accent-cyan})"
    fontFamily: "{typography.display.fontFamily}"
    fontWeight: 900
---

# Design System

<!-- impeccable:design-schema 1 -->

## Overview

**Creative North Star: The Cyber Academy Command Center (Trung tâm Chỉ huy Học viện Không gian)**

Hệ thống thiết kế của **STEM HUB (STEM Arena)** tái hiện không gian điều khiển của một trạm nghiên cứu khoa học tương lai kết hợp đấu trường học thuật điện tử (Academic eSports). Giao diện mang đậm tinh thần khám phá công nghệ cao, biến việc học các bộ môn khoa học tự nhiên thành những chuyến hải trình tri thức vũ trụ đầy đam mê.

Hệ thống dung hòa hai trải nghiệm thị giác đối lập nhưng nhất quán:
- **Dark Mode (Chủ đạo)**: Deep Space Neon Cyberpunk — nền tím thẫm vũ trụ (`#0F0B1A`), lớp bề mặt kính mờ nhiều tầng, ánh sáng dạ quang viền (Neon Edge Glows) từ bộ ba màu Cyan, Pink, Purple.
- **Light Mode (Ban ngày / Học đường)**: Clean Futuristic Airy — lấy cảm hứng từ ngôn ngữ tối giản cao cấp của Apple nhưng giữ lại các điểm nhấn gradient màu tím/hồng hoa cà mềm mại trên nền giấy ngọc trai `#F8F6FC`.

---

## Colors

Hệ màu được xây dựng trên bảng phối tương phản cao, phục vụ nhận diện trực quan cho từng bộ môn và trạng thái mô phỏng.

### 1. Nền & Cấu trúc phân tầng (Neutral Surfaces)
* **Dark Mode**:
  * Nền chính (`--bg-primary`): `#0F0B1A` (Tím không gian cực sâu)
  * Nền thẻ (`--bg-secondary`): `#1A1428` (Kính mờ bề mặt cấp 1)
  * Nền phụ trợ / Hover (`--bg-tertiary`): `#241C38` (Kính mờ bề mặt cấp 2)
  * Đường viền cấu trúc (`--border`): `#33284A`
  * Chữ chính (`--text-primary`): `#F2EDFA` (Trắng ánh tím pha lê)
  * Chữ phụ (`--text-secondary`): `#A99BC4` (Tím khói giảm chói)
* **Light Mode**:
  * Nền chính (`--bg-primary`): `#F8F6FC`
  * Nền thẻ (`--bg-secondary`): `#FFFFFF`
  * Nền phụ trợ (`--bg-tertiary`): `#F0EBFA`
  * Đường viền (`--border`): `#E2D9F3`
  * Chữ chính (`--text-primary`): `#1E152A`
  * Chữ phụ (`--text-secondary`): `#6B5E85`

### 2. Điểm nhấn & Nhận diện Môn học (Subject Chromas)
Mỗi phòng Lab STEM sở hữu một tông màu quang phổ độc bản:
* **Toán học (Math-3D)**: Cyan / Sky / Blue (`#06B6D4` - `#0284C7`) — Biểu trưng cho logic không gian và sự sắc bén của giải tích.
* **Vật lý (Phys-V3)**: Purple / Fuchsia / Indigo (`#A855F7` - `#8B5CF6`) — Biểu trưng cho quang học laser, trường điện từ và sóng dao động.
* **Hóa học (Chem-V4)**: Amber / Orange / Emerald (`#F59E0B` - `#10B981`) — Biểu trưng cho nhiệt động học, chuyển dịch cân bằng và phản ứng axit-bazơ.
* **Sinh học (Bio-Gene)**: Emerald / Teal / Cyan (`#10B981` - `#06B6D4`) — Biểu trưng cho cấu trúc xoắn kép DNA, di truyền Mendel và sự sống.

### 3. Trạng thái chức năng (Functional States)
* **Primary Brand**: `#F0398C` (Cyber Pink) & `#7C3AED` / `#8B5CF6` (Neon Purple)
* **Success**: `#10B981` (Xanh ngọc lục bảo)
* **Warning**: `#F59E0B` (Hổ phách cảnh báo)
* **Danger**: `#DC2626` / `#F87171` (Đỏ cảnh báo nguy cơ phòng lab)

---

## Typography

Ngôn ngữ kiểu chữ tối ưu hóa cho hiển thị tiếng Việt chuẩn mực, hỗ trợ hoàn hảo công thức toán học KaTeX và các chỉ số dữ liệu khoa học.

### Font Stacks
* **Giao diện & Tiêu đề**: `'Be Vietnam Pro', 'Inter', 'Plus Jakarta Sans', system-ui, sans-serif`
* **Công thức Toán / Hóa học**: `KaTeX_Main, KaTeX_Math, 'Times New Roman', serif`
* **Chỉ số Telemetry & Code**: `'Geist Mono', 'Fira Code', monospace`

### Phân cấp Tỷ lệ (Scale & Hierarchy)
* **Display (Hero Titles)**: `clamp(2rem, 5vw, 3.5rem)`, weight `800`, line-height `1.15`, letter-spacing `-0.02em`.
* **Headline (Section Titles)**: `1.75rem` (28px), weight `700`, line-height `1.25`, text gradient ánh neon.
* **Title (Card & Modal Headers)**: `1.25rem` (20px), weight `600`, line-height `1.35`.
* **Body (Văn bản nội dung)**: `1rem` (16px), weight `400` / `500`, line-height `1.5`, letter-spacing `-0.01em`.
* **Label / Meta (Chỉ số ELO, Tags, Badge)**: `0.875rem` (14px) / `0.75rem` (12px), weight `500` / `600`, uppercase với `letter-spacing: 0.05em`.

---

## Layout

* **Lưới Không gian (Spatial Grid)**: Layout phản ứng 12 cột với container tối đa `1400px` căn giữa.
* **Trục Điều hướng (Navigation Axis)**:
  * Header chính cố định dạng Glassmorphism (`backdrop-blur-md`, độ cao `72px`).
  * Tích hợp thanh trạng thái người dùng (Level, ELO, Crystal Currency, Avatar Khung Viền).
  * Lối tắt trực tiếp tới 4 phòng Lab ảo, Đấu Trường 1v1, Xếp Hạng và Trợ lý Javit HUD.
* **Khoảng cách nhịp nhàng (Rhythm)**:
  * Khoảng cách thành phần: `16px` (Mobile), `24px` (Tablet), `32px` - `48px` (Desktop).
  * Padding thẻ bài: `20px` - `28px` bảo đảm thông thoáng và tính bao bọc.

---

## Elevation & Depth

Hiệu ứng chiều sâu không dùng đổ bóng xám đục thông thường mà ứng dụng **Tonal Layering kết hợp Ánh phát quang (Photonic Glow)**:

1. **Mặt phẳng Kính mờ (Glassmorphic Slabs)**:
   * Thuộc tính: `background: rgba(26, 20, 40, 0.75)`, `backdrop-filter: blur(16px)`, `border: 1px solid rgba(255, 255, 255, 0.08)`.
2. **Hào quang Neon (Ambient Neon Glow)**:
   * Ánh sáng hồng/tím toát ra từ các nút tương tác: `box-shadow: 0 0 25px rgba(240, 57, 140, 0.35)`.
   * Ánh sáng xanh cyan toát ra từ các thẻ Toán/Vật lý: `box-shadow: 0 12px 40px rgba(6, 182, 212, 0.25)`.
3. **Phông nền Không gian Động (Dynamic Canvas Layering)**:
   * Lớp nền hạt sao phân tử Three.js (Particle Field) cuộn vô tận tạo chiều sâu 3D phía sau nội dung trang web (`ArenaBackground.jsx`).

---

## Shapes

* **Hệ thống Bo góc (Corner Radii)**:
  * `sm` (`6px`): Nút công cụ nhỏ, dropdown item, pill tags.
  * `md` (`10px`): Nút bấm chính, input form, ô trả lời trắc nghiệm.
  * `lg` (`16px`): Thẻ bài phòng lab, khung hiển thị câu hỏi, panel phụ trợ.
  * `xl` (`24px`): Modal trung tâm, bảng xếp hạng tổng quan.
  * `full` (`9999px`): Huy hiệu Rank ELO, thanh đo tiến độ, switch toggle.
* **Điểm nhấn Cybernetic (Cyber Accents)**:
  * Góc cắt vát công nghệ (`cyber-border`): Sử dụng đường kẻ phát sáng L-shape tại 4 góc panel để tạo cảm giác màn hình hiển thị HUD chiến thuật.

---

## Components

### 1. Thẻ Phòng Thí Nghiệm (Lab Portal Cards)
* Cấu trúc ảnh bìa 16:9 với gradient phủ tối dần về phía chân thẻ.
* Tiêu đề môn học kết hợp Badge mã số nghiên cứu (`MATH-3D`, `PHYS-V3`, `CHEM-V4`, `BIO-GENE`).
* Hiệu ứng hover: Phóng to nhẹ (`scale-[1.02]`), đường viền chuyển sang màu phát quang của môn học, tỏa bóng hào quang `[0_12px_40px_rgba(...)]`.

### 2. Nút Bấm Tác Vụ (Action Buttons)
* **Primary Action**: Gradient rực rỡ (`from-pink-500 via-rose-500 to-purple-600`), text trắng, bóng đổ cùng tông.
* **Cyber Secondary**: Nền kính trong suốt `bg-white/5`, viền `border-white/10`, hover phát sáng viền và tăng độ sáng chữ.
* **Lab-Specific CTA**: Mỗi nút vào phòng lab mang màu gradient riêng biệt của môn học đó.

### 3. Trung tâm Chỉ huy HUD & Modal Minh bạch AI
* Khung viền mỏng công nghệ cao, tiêu đề có icon neon nhấp nháy chỉ báo trạng thái máy học.
* Tabs chuyển đổi linh hoạt giữa 6 mô hình AI tự huấn luyện (Confusion Matrix, Loss curves, Metrics).

---

## Do's and Don'ts

### Do's ✅
- **Luôn bảo toàn tính tương phản**: Khi ở Dark Mode, chữ phải đạt chuẩn AAA trên nền tím tối; khi ở Light Mode, chữ chính dùng `#1E152A` đậm rõ ràng, không dùng xám nhạt khó đọc.
- **Tôn trọng mã màu từng môn học**: Giữ chuẩn Cyan cho Toán, Tím cho Lý, Cam/Vàng cho Hóa, và Xanh ngọc cho Sinh học để học sinh nhận diện trực giác tức thì.
- **Hiển thị công thức sắc nét**: Luôn bao bọc biểu thức toán học và phương trình hóa học trong KaTeX block, không dùng ảnh chụp mờ nhạt.
- **Chuyển động có chủ đích**: Dùng easing mượt `cubic-bezier(0.16, 1, 0.3, 1)` cho hover và mở modal; không dùng animation giật cục hay quá nhanh gây mỏi mắt.

### Don'ts ❌
- **Không dùng màu xám xỉn không pha sắc (Dead Grays)**: Nền tối luôn phải pha ánh tím xanh (`#0F0B1A`, `#1A1428`), nền sáng luôn có sắc tím pastel (`#F8F6FC`).
- **Không lạm dụng thẻ lồng trong thẻ (Card nesting hell)**: Tối đa 2 cấp bề mặt trên một khung nhìn.
- **Không đặt chữ xám mờ trên nền có màu gradient**: Luôn sử dụng text trắng tinh khiết (`#FFFFFF`) trên các nút bấm gradient để đảm bảo khả năng tiếp cận.
- **Không ẩn các cảnh báo an toàn phòng lab**: Cảnh báo rủi ro hóa chất/vật lý phải dùng tông đỏ nguy cấp (`#DC2626` / `#F87171`) với biểu tượng rõ ràng.
