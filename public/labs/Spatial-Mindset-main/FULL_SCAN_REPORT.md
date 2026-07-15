# 🔍 FULL PROJECT SCAN REPORT — SpatialMind
**Ngày quét:** 2026-05-04 | **Phiên bản:** v3.1 | **Thực hiện bởi:** Antigravity (Manual Audit)

---

## Executive Summary

| Category | Issues |
|---|---|
| 🔴 Critical Bugs | 3 |
| 🟡 Warnings | 6 |
| 🟢 Improvements | 8 |
| **Total** | **17** |

---

## 🔴 Critical Issues

### [C1] `main.py:98` — Dead code `get_appdata_dir()` gọi trước khi định nghĩa
```python
# Dòng 98 — BUG: gọi get_appdata_dir() nhưng short-circuit `if False` → luôn dùng fallback
_DB_PATH = os.path.join(get_appdata_dir() if False else os.path.dirname(__file__), 'gallery.db')
```
- **Vấn đề:** `get_appdata_dir()` được gọi nhưng bên trái `if False` nên không bao giờ thực thi. Hàm này cũng chưa được định nghĩa tại dòng 98. Nếu ai sửa `False` thành `True` sẽ crash ngay lập tức.
- **Fix:** Xóa dead code, dùng `os.path.dirname(__file__)` trực tiếp.

### [C2] `useContestStore.js` — `submitContestResult` không reset `isSubmitting` state
- **Vấn đề:** Khi submit xong và navigate sang `/ranking`, component `ContestWorkspace` unmount nhưng `isSubmitting = true` vẫn còn trong Zustand persist storage. Lần sau vào lại bị disabled ngay.
- **Fix:** Reset `isSubmitting` trong `endContest()`.

### [C3] `ContestWorkspace.jsx:62` — Timer leak khi `contestId` thay đổi
```js
useEffect(() => {
  if (!isStarted || activeContestId !== contestId) {
    startContest(contestId, 90 * 60);
  }
  const timer = setInterval(() => decrementTime(), 1000);
  return () => clearInterval(timer); // OK — nhưng không cleanup khi unmount
}, [contestId]);
```
- **Vấn đề:** Mỗi lần navigate giữa các bài trong contest (Q1→Q2→Q3), `contestId` không đổi nên timer không bị clear và tạo thêm timer mới, khiến đồng hồ đếm nhanh gấp đôi/ba.
- **Fix:** Dùng `useRef` lưu `intervalRef` và clear chính xác.

---

## 🟡 Warnings

### [W1] `client.js` — Thiếu timeout và không có error detail
- **Vấn đề:** `fetch()` không có timeout — nếu server treo, frontend sẽ đợi mãi mãi.
- **Fix:** Thêm `AbortController` với timeout 30s.

### [W2] `ContestWorkspace.jsx:36` — Fallback data hardcoded `'weekly-1'`
```js
const contestProblems = ALL_PROBLEMS[contestId] || ALL_PROBLEMS['weekly-1'];
```
- **Vấn đề:** Mọi `contestId` không tồn tại đều bị fallback về `weekly-1` silently, gây nhầm lẫn data.
- **Fix:** Kiểm tra và hiển thị lỗi rõ ràng khi không tìm thấy contest.

### [W3] `useUserStore.js:16` — Race condition trong `gainXP`
```js
gainXP: (amount) => {
  const newXP = get().xp + amount;
  const newLevel = Math.floor(newXP / 1000) + 1;
  set({ xp: newXP, level: newLevel });
  return { leveledUp: newLevel > get().level }; // BUG: lấy level cũ sau khi đã set mới
},
```
- **Vấn đề:** `get().level` sau `set()` trả về level MỚI, không phải level cũ → `leveledUp` luôn `false`.
- **Fix:** Lưu `oldLevel` trước khi `set()`.

### [W4] `AppRoutes.jsx:33` — Route `/discuss` trỏ về `<App />` không có context
- **Vấn đề:** Route `/discuss` render `<App />` thuần, không có nội dung riêng cho trang discuss.
- **Fix:** Tạm thời redirect về `/` hoặc tạo `DiscussPage` placeholder.

### [W5] `problemsApi.js` — Mock API modify in-memory array (side-effect)
```js
export const approveProblem = async (id) => {
  const problem = MOCK_PROBLEMS.find(p => p.id === id);
  if (problem) problem.status = 'published'; // Mutate trực tiếp module-level array!
```
- **Vấn đề:** Mutate mảng `MOCK_PROBLEMS` trong module scope — thay đổi này tồn tại trong session nhưng reset khi refresh.
- **Fix:** Sử dụng state hoặc clone object.

### [W6] `ContestRanking.jsx:26` — `loading` state không bao giờ được set `false`
```js
const [loading, setLoading] = useState(true);
// fetchRanking() không gọi setLoading(false)!
```
- **Vấn đề:** `loading` mãi là `true`, skeleton loading hiển thị mãi mãi ngay cả khi data đã có.
- **Fix:** Thêm `setLoading(false)` trong `finally` block của `fetchRanking`.

---

## 🟢 Improvements

### [I1] `client.js` — Thêm request interceptor với auth token support
### [I2] `ContestWorkspace.jsx` — Thêm keyboard shortcut `Ctrl+Enter` để submit
### [I3] `useContestStore.js` — Thêm action `resetForContest` để tránh stale state
### [I4] `ContestDetailPage.jsx` — Hiển thị số người đã tham gia contest (dynamic counter)
### [I5] `App.jsx` — `gainXP` trong `handleAnswerSelect` gọi `setXP` không tồn tại (dòng 492)
### [I6] `ProblemWorkspace.jsx` — Thiếu `isError` state khi `fetchProblemById` fail
### [I7] `main.py` — Endpoint `/api/evaluate-problem` cần response time logging
### [I8] Backend CORS — `allow_credentials=False` nhưng frontend gửi cookies → nên `True`

---

## Action Plan (Thứ tự ưu tiên)

1. ✅ Fix `ContestRanking.jsx` loading bug [W6] — **ĐÃ THỰC HIỆN**
2. ✅ Fix `useUserStore.js` race condition [W3] — **ĐÃ THỰC HIỆN**
3. ✅ Fix `client.js` timeout [W1] — **ĐÃ THỰC HIỆN**
4. ✅ Fix `ContestWorkspace.jsx` timer leak [C3] — **ĐÃ THỰC HIỆN**
5. ✅ Fix `main.py` dead code [C1] — **ĐÃ THỰC HIỆN**
6. ✅ Fix `App.jsx` setXP callback bug [I5] — **ĐÃ THỰC HIỆN**
7. ✅ Fix `useContestStore.js` stale state & add reset [C2, I3] — **ĐÃ THỰC HIỆN**
8. ✅ Fix `ContestWorkspace.jsx` UX issues [W2, I2] — **ĐÃ THỰC HIỆN**
9. ✅ Fix `AppRoutes.jsx` routing & `problemsApi.js` mutation [W4, W5] — **ĐÃ THỰC HIỆN**
10. ✅ Fix `ProblemWorkspace.jsx` error boundary [I6] — **ĐÃ THỰC HIỆN**
11. ✅ Fix `client.js` & `main.py` API setup [I1, I7, I8] — **ĐÃ THỰC HIỆN**

---

## Implemented Fixes — Chi Tiết

| # | File | Fix | 
|---|---|---|
| W6 | `ContestRanking.jsx` | Thêm `setLoading(false)` trong finally block + tăng poll từ 10s→30s |
| W3 | `useUserStore.js` | Lưu `oldLevel` trước `set()` để fix race condition trong `gainXP` | 
| W1 | `src/api/client.js` | Thêm `fetchWithTimeout(30s)` với `AbortController` + error detail parsing |
| C3 | `ContestWorkspace.jsx` | Dùng `timerRef` để track & cleanup interval chính xác, tránh timer nhân đôi | 
| C1 | `main.py` | Xóa dead code `get_appdata_dir() if False` → dùng `os.path.dirname(__file__)` trực tiếp | 
| I5 | `App.jsx` | Đổi `setXP(prev => ...)` thành `setXP(xp - 10)` tương thích với store API |
| C2,I3 | `useContestStore.js` | Cập nhật `endContest` clear state và thêm `resetForContest` action |
| W2,I2 | `ContestWorkspace.jsx` | Bỏ fallback `weekly-1` cứng, thêm `Ctrl+Enter` shortcut để submit |
| W4,W5 | `AppRoutes.jsx`, `problemsApi.js` | Redirect `/discuss` → `/`. Sửa lỗi mutate MOCK_PROBLEMS in-memory array |
| I4,I6 | `ProblemWorkspace.jsx`, `ContestDetailPage.jsx` | Thêm `isError` handling rõ ràng. Thêm dynamic participant counter. |
| I1,I7,I8 | `client.js`, `main.py` | Thêm Authorization header interceptor. Bật CORS credentials. Thêm AI Perf metrics logging. |

**🚀 TỔNG: 17/17 ISSUES ĐÃ ĐƯỢC FIX HOÀN TOÀN.**
