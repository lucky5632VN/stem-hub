'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Brain, BookOpen, CheckCircle2, 
  Loader2, AlertCircle, RefreshCw 
} from 'lucide-react';

export default function AiPhysicsExplanationModal({ isOpen, onClose, queryData }) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && queryData) {
      fetchAIExplanation();
    }
  }, [isOpen, queryData]);

  const fetchAIExplanation = async () => {
    setLoading(true);
    setError('');
    setExplanation('');

    try {
      let prompt = '';
      if (queryData?.type === 'harmonic') {
        const { params, state } = queryData;
        prompt = `Đóng vai trò là Giáo sư Vật lý AI STEM HUB, hãy phân tích hiện tượng dao động điều hòa của con lắc lò xo với các thông số sau:
- Biên độ A = ${params.A} cm
- Tần số góc ω = ${params.omega} rad/s (Chu kỳ T = ${(2 * Math.PI / params.omega).toFixed(2)}s)
- Khối lượng quả nặng m = ${params.m} kg
- Độ cứng lò xo k = ${params.k} N/m
- Trạng thái tức thời: Li độ x = ${state?.x?.toFixed(2)} cm, Vận tốc v = ${state?.v?.toFixed(2)} cm/s, Cơ năng W = ${(state?.W * 1000)?.toFixed(2)} mJ.

Yêu cầu giải thích:
1. Bản chất sự chuyển hóa qua lại giữa Động năng (Wđ) và Thế năng (Wt).
2. Mối quan hệ vuông pha giữa li độ x và vận tốc v.
3. Ứng dụng thực tế của con lắc lò xo (hệ thống giảm xóc xe cộ, đồng hồ cơ, cảm biến gia tốc).
Hãy trình bày ngắn gọn, súc tích bằng Markdown, có công thức LaTeX rõ ràng.`;
      } else if (queryData?.type === 'wave') {
        const p = queryData.details;
        prompt = `Đóng vai trò là Chuyên gia Vật lý AI STEM HUB, hãy phân tích hiện tượng ${p.isStanding ? 'Sóng dừng (Standing Waves)' : 'Sóng chạy (Traveling Waves)'}:
- Bước sóng λ = ${p.lambda} px
- Tần số f = ${p.f} Hz
- Tốc độ truyền sóng v = ${p.lambda * p.f} px/s

Yêu cầu giải thích:
1. Cơ chế hình thành sóng dừng do sự giao thoa giữa sóng tới và sóng phản xạ.
2. Vị trí các nút sóng (u = 0) và bụng sóng (biên độ 2A).
3. Ứng dụng trong nhạc cụ (đàn Guitar, sáo trúc) và vĩ mô (cột ăng-ten, vi sóng).
Trình bày bằng Markdown có cấu trúc chuyên nghiệp.`;
      } else if (queryData?.type === 'projectile') {
        const p = queryData.details;
        prompt = `Đóng vai trò là Chuyên gia Cơ học & Thiên văn học AI STEM HUB, hãy phân tích bài toán Chuyển động ném xiên:
- Hành tinh: ${p.gravity?.name} (gia tốc trọng trường g = ${p.gravity?.g} m/s²)
- Vận tốc đầu v₀ = ${p.v0} m/s, Góc ném α = ${p.angleDeg}°
- Độ cao cực đại Hmax = ${p.result?.hMax?.toFixed(2)} m
- Tầm ném xa Lmax = ${p.result?.xMax?.toFixed(2)} m
- Thời gian bay T = ${p.result?.tFlight?.toFixed(2)} s

Yêu cầu giải thích:
1. Phân tích chuyển động thành 2 thành phần độc lập (trục Ox thẳng đều, trục Oy biến đổi đều).
2. Ảnh hưởng của trọng lực hành tinh ${p.gravity?.name} so với Trái Đất (tại sao bay cao hơn/xa hơn hoặc rơi nhanh hơn).
3. Ứng dụng trong phóng vệ tinh, thể thao (ném lao, bóng rổ) và kỹ thuật quân sự.`;
      } else {
        prompt = 'Hãy giải thích các quy luật vật lý và ứng dụng toán học của mô phỏng này.';
      }

      const res = await fetch('/api/lab-toan/chat-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          history: [],
          subject: 'physics_lab',
        }),
      });

      if (!res.ok) {
        throw new Error('Không thể kết nối tới dịch vụ AI phân tích.');
      }

      const data = await res.json();
      setExplanation(data?.reply || data?.response || 'Không nhận được câu trả lời từ AI.');
    } catch (err) {
      console.error('Error fetching AI explanation:', err);
      setError('Đã xảy ra lỗi khi tạo phản hồi phân tích vật lý. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-bg-secondary border border-border-theme rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between p-5 border-b border-border-theme bg-bg-tertiary/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-accent-pink to-accent-purple text-white shadow-lg">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <span>AI Phân Tích Vật Lý Chuyên Sâu</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  STEM HUB AI
                </span>
              </h3>
              <p className="text-xs text-text-secondary">
                Giải thích bản chất vật lý, cơ chế năng lượng & liên hệ thực tế
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung phản hồi */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm leading-relaxed text-text-primary">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-text-secondary">
              <Loader2 className="w-8 h-8 animate-spin text-accent-cyan" />
              <p className="text-xs font-mono">Đang tổng hợp dữ liệu vật lý và phân tích bằng AI...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="flex-1 text-xs">{error}</div>
              <button
                onClick={fetchAIExplanation}
                className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử lại</span>
              </button>
            </div>
          ) : (
            <div className="whitespace-pre-line space-y-3 font-sans">
              {explanation}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-theme bg-bg-tertiary/30 flex items-center justify-between text-xs text-text-secondary">
          <div className="flex items-center gap-1.5 text-text-tertiary">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Được mô phỏng bởi Physics Engine STEM HUB</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-bg-tertiary hover:bg-bg-primary text-text-primary font-bold border border-border-theme transition-all cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}
