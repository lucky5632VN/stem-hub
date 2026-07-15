# 🕵️ Spatial Mind — Codebase Audit Report

**Date:** 2026-05-04  
**Scope:** Frontend (React/Vite) & Backend (FastAPI/SQLite)  
**Priority:** 🔴 Critical | 🟡 Warning | 🟢 Info

---

## 🔴 1. Bugs & Runtime Errors

### 1.1 Leaderboard Mocking (Fixed)
- **Status:** ✅ Đã sửa (Antigravity 2026-05-04)
- **Fix:** Đã chuyển sang dùng SQLite backend và API polling định kỳ 10 giây.

### 1.2 Evaluation Logic (Fixed)
- **Status:** ✅ Đã sửa (Antigravity 2026-05-04)
- **Fix:** Đã tích hợp API `/api/evaluate-problem` sử dụng Gemini AI và SymPy để chấm điểm logic thật sự.

---

## 🔴 2. Security Vulnerabilities

### 2.1 Hardcoded Mock Data
- **File:** `src/api/problemsApi.js`
- **Issue:** Đề bài và metadata nằm trực tiếp trong JS bundle.
- **Impact:** Dễ bị leak đề bài qua source code.
- **Fix:** Chuyển toàn bộ `MOCK_PROBLEMS` vào SQLite backend.

---

## 🟡 3. Performance Bottlenecks

### 3.1 3D Canvas Re-renders
- **File:** `src/App.jsx`
- **Issue:** Khi state XP hoặc Streak thay đổi, toàn bộ component 3D Canvas có thể bị re-mount.
- **Fix:** Tách `GeometryViewer` ra một component độc lập và dùng `React.memo`.

---

## 🟡 4. Code Smells & Anti-patterns

### 4.1 Monolithic Structure
- **Issue:** `App.jsx` quá lớn (gần 1400 dòng).
- **Fix:** Tiếp tục tách logic Math, UI, và State vào các Custom Hooks (Đã thực hiện 50%).

---

## 🟢 5. Missing Features (So với Requirements)

1. **AI Socratic Hint**: Cần kết nối với endpoint `/api/socratic-hint`.
2. **Real-time Leaderboard**: Cần Backend endpoint thực thụ.
3. **Mobile Layout**: Sidebar hiện tại bị tràn trên mobile.
