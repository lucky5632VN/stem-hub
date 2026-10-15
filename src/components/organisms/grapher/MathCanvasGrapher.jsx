'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  compileExpression, 
  numericalDerivative, 
  numericalIntegral, 
  findExtrema, 
  findRoots, 
  MATH_PRESETS 
} from '@/lib/grapher/mathGraphEvaluator';
import { 
  Play, RotateCcw, ZoomIn, ZoomOut, Maximize2, 
  Sparkles, Layers, Sliders, Info, Eye, Download 
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function MathCanvasGrapher({ onAskAI }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Cấu hình Viewport (hệ trục Oxy)
  const [viewState, setViewState] = useState({
    centerX: 0,
    centerY: 0,
    scale: 40, // 40 pixels = 1 đơn vị
  });

  const [selectedPresetId, setSelectedPresetId] = useState('parabola');
  const [params, setParams] = useState({ a: 1, b: -2, c: -3 });
  const [customExpr, setCustomExpr] = useState('x^3 - 3*x + 1');
  const [showTangent, setShowTangent] = useState(true);
  const [showIntegral, setShowIntegral] = useState(false);
  const [integralBounds, setIntegralBounds] = useState({ a: -1, b: 2 });
  const [showExtrema, setShowExtrema] = useState(true);
  const [showRoots, setShowRoots] = useState(true);
  const [hoverPos, setHoverPos] = useState(null); // { mathX, mathY, screenX, screenY }
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const activePreset = useMemo(() => {
    return MATH_PRESETS.find(p => p.id === selectedPresetId) || MATH_PRESETS[0];
  }, [selectedPresetId]);

  // Sinh biểu thức chuỗi hiện tại
  const currentExprString = useMemo(() => {
    if (selectedPresetId === 'custom') return customExpr;
    return activePreset.generateExpr(params);
  }, [selectedPresetId, activePreset, params, customExpr]);

  // Biên dịch hàm f(x)
  const mathFn = useMemo(() => {
    return compileExpression(currentExprString);
  }, [currentExprString]);

  // Tính toán nghiệm và cực trị
  const analysisData = useMemo(() => {
    try {
      const roots = findRoots(mathFn, -15, 15);
      const extrema = findExtrema(mathFn, -15, 15);
      const integralVal = showIntegral ? numericalIntegral(mathFn, integralBounds.a, integralBounds.b) : 0;
      return { roots, extrema, integralVal };
    } catch {
      return { roots: [], extrema: [], integralVal: 0 };
    }
  }, [mathFn, showIntegral, integralBounds]);

  // Chuyển đổi tọa độ Toán học <-> Pixel Canvas
  const mathToScreen = useCallback((x, y, width, height) => {
    const sx = width / 2 + (x - viewState.centerX) * viewState.scale;
    const sy = height / 2 - (y - viewState.centerY) * viewState.scale;
    return { sx, sy };
  }, [viewState]);

  const screenToMath = useCallback((sx, sy, width, height) => {
    const x = viewState.centerX + (sx - width / 2) / viewState.scale;
    const y = viewState.centerY - (sy - height / 2) / viewState.scale;
    return { x, y };
  }, [viewState]);

  // Vẽ Canvas 60 FPS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Nền không gian tối Sci-Fi
    const bgGradient = ctx.createRadialGradient(
      width / 2, height / 2, 50,
      width / 2, height / 2, Math.max(width, height)
    );
    bgGradient.addColorStop(0, '#100c1e');
    bgGradient.addColorStop(1, '#090611');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Lưới tọa độ Cartesian (Grid)
    const minMath = screenToMath(0, height, width, height);
    const maxMath = screenToMath(width, 0, width, height);

    // Chọn bước lưới theo tỷ lệ zoom
    let step = 1;
    if (viewState.scale > 80) step = 0.5;
    if (viewState.scale > 150) step = 0.25;
    if (viewState.scale < 25) step = 2;
    if (viewState.scale < 12) step = 5;

    // Lưới mờ (Subgrid)
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.08)'; // Neon purple mờ
    const startX = Math.floor(minMath.x / step) * step;
    const endX = Math.ceil(maxMath.x / step) * step;
    const startY = Math.floor(minMath.y / step) * step;
    const endY = Math.ceil(maxMath.y / step) * step;

    for (let x = startX; x <= endX; x += step) {
      const { sx } = mathToScreen(x, 0, width, height);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();
    }

    for (let y = startY; y <= endY; y += step) {
      const { sy } = mathToScreen(0, y, width, height);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();
    }

    // 3. Trục tọa độ Ox, Oy
    const origin = mathToScreen(0, 0, width, height);

    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)'; // Cyan trục chính
    ctx.lineWidth = 2;

    // Trục Ox
    if (origin.sy >= 0 && origin.sy <= height) {
      ctx.beginPath();
      ctx.moveTo(0, origin.sy);
      ctx.lineTo(width, origin.sy);
      ctx.stroke();

      // Mũi tên Ox
      ctx.beginPath();
      ctx.moveTo(width - 12, origin.sy - 5);
      ctx.lineTo(width, origin.sy);
      ctx.lineTo(width - 12, origin.sy + 5);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.fill();
    }

    // Trục Oy
    if (origin.sx >= 0 && origin.sx <= width) {
      ctx.beginPath();
      ctx.moveTo(origin.sx, 0);
      ctx.lineTo(origin.sx, height);
      ctx.stroke();

      // Mũi tên Oy
      ctx.beginPath();
      ctx.moveTo(origin.sx - 5, 12);
      ctx.lineTo(origin.sx, 0);
      ctx.lineTo(origin.sx + 5, 12);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.fill();
    }

    // Nhãn tọa độ các vạch số
    ctx.fillStyle = 'rgba(169, 155, 196, 0.6)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let x = startX; x <= endX; x += step) {
      if (Math.abs(x) < 1e-4) continue;
      const { sx, sy } = mathToScreen(x, 0, width, height);
      const labelY = Math.max(10, Math.min(height - 20, origin.sy + 6));
      ctx.fillText(Number(x.toFixed(2)), sx, labelY);
    }

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = startY; y <= endY; y += step) {
      if (Math.abs(y) < 1e-4) continue;
      const { sx, sy } = mathToScreen(0, y, width, height);
      const labelX = Math.max(25, Math.min(width - 10, origin.sx - 8));
      ctx.fillText(Number(y.toFixed(2)), labelX, sy);
    }

    // 4. Tô diện tích tích phân (nếu kích hoạt)
    if (showIntegral) {
      const a = Math.min(integralBounds.a, integralBounds.b);
      const b = Math.max(integralBounds.a, integralBounds.b);
      const intSteps = 150;
      const dx = (b - a) / intSteps;

      ctx.beginPath();
      const firstPt = mathToScreen(a, 0, width, height);
      ctx.moveTo(firstPt.sx, firstPt.sy);

      for (let i = 0; i <= intSteps; i++) {
        const curX = a + i * dx;
        const curY = mathFn(curX);
        if (curY !== null) {
          const pt = mathToScreen(curX, curY, width, height);
          ctx.lineTo(pt.sx, pt.sy);
        }
      }

      const lastPt = mathToScreen(b, 0, width, height);
      ctx.lineTo(lastPt.sx, lastPt.sy);
      ctx.closePath();

      ctx.fillStyle = 'rgba(240, 57, 140, 0.25)'; // Hồng neon bán trong suốt
      ctx.fill();
      ctx.strokeStyle = 'rgba(240, 57, 140, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 5. Vẽ đường cong hàm số chính f(x)
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#06B6D4'; // Cyan rực rỡ
    ctx.shadowColor = 'rgba(6, 182, 212, 0.8)';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    let isDrawing = false;
    const pixelStep = 2; // Vẽ từng 2 pixel ngang để đồ thị siêu mượt

    for (let px = 0; px <= width; px += pixelStep) {
      const { x } = screenToMath(px, 0, width, height);
      const y = mathFn(x);

      if (y !== null && isFinite(y)) {
        const { sx, sy } = mathToScreen(x, y, width, height);
        // Tránh giật khi nhảy tiệm cận đứng
        if (sy > -500 && sy < height + 500) {
          if (!isDrawing) {
            ctx.moveTo(sx, sy);
            isDrawing = true;
          } else {
            ctx.lineTo(sx, sy);
          }
        } else {
          isDrawing = false;
        }
      } else {
        isDrawing = false;
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0; // Tắt shadow

    // 6. Vẽ các đường tiệm cận đứng và ngang nếu là hàm phân thức
    if (selectedPresetId === 'rational' && params.c !== 0) {
      const vAsymptoteX = -params.d / params.c;
      const hAsymptoteY = params.a / params.c;

      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)'; // Vàng hổ phách

      // Tiệm cận đứng
      const ptVA = mathToScreen(vAsymptoteX, 0, width, height);
      ctx.beginPath();
      ctx.moveTo(ptVA.sx, 0);
      ctx.lineTo(ptVA.sx, height);
      ctx.stroke();

      // Tiệm cận ngang
      const ptHA = mathToScreen(0, hAsymptoteY, width, height);
      ctx.beginPath();
      ctx.moveTo(0, ptHA.sy);
      ctx.lineTo(width, ptHA.sy);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 7. Điểm cực trị (Max / Min)
    if (showExtrema && analysisData.extrema.length > 0) {
      analysisData.extrema.forEach((ext) => {
        const pt = mathToScreen(ext.x, ext.y, width, height);
        if (pt.sx >= 0 && pt.sx <= width && pt.sy >= 0 && pt.sy <= height) {
          ctx.beginPath();
          ctx.arc(pt.sx, pt.sy, 6, 0, Math.PI * 2);
          ctx.fillStyle = ext.type === 'max' ? '#F87171' : '#10B981'; // Đỏ hoặc Xanh lá
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Nhãn cực trị
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${ext.label} (${ext.x}; ${ext.y})`, pt.sx, pt.sy - 12);
        }
      });
    }

    // 8. Các nghiệm f(x) = 0
    if (showRoots && analysisData.roots.length > 0) {
      analysisData.roots.forEach((rootX) => {
        const pt = mathToScreen(rootX, 0, width, height);
        if (pt.sx >= 0 && pt.sx <= width && pt.sy >= 0 && pt.sy <= height) {
          ctx.beginPath();
          ctx.arc(pt.sx, pt.sy, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#F59E0B';
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#FDE68A';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`x=${rootX}`, pt.sx, pt.sy + 16);
        }
      });
    }

    // 9. Đường tiếp tuyến động tại vị trí chuột hover
    if (showTangent && hoverPos) {
      const hx = hoverPos.mathX;
      const hy = mathFn(hx);
      if (hy !== null) {
        const slope = numericalDerivative(mathFn, hx);
        if (slope !== null) {
          const ptH = mathToScreen(hx, hy, width, height);

          // Vẽ điểm tiếp xúc
          ctx.beginPath();
          ctx.arc(ptH.sx, ptH.sy, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#F0398C'; // Hồng neon
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Vẽ đoạn tiếp tuyến y = slope * (x - hx) + hy
          const tanDeltaX = 5;
          const xLeft = hx - tanDeltaX;
          const yLeft = slope * (xLeft - hx) + hy;
          const xRight = hx + tanDeltaX;
          const yRight = slope * (xRight - hx) + hy;

          const ptL = mathToScreen(xLeft, yLeft, width, height);
          const ptR = mathToScreen(xRight, yRight, width, height);

          ctx.strokeStyle = 'rgba(240, 57, 140, 0.8)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(ptL.sx, ptL.sy);
          ctx.lineTo(ptR.sx, ptR.sy);
          ctx.stroke();
          ctx.setLineDash([]);

          // Hiển thị hệ số góc tiếp tuyến k = f'(x)
          ctx.fillStyle = '#F472B6';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`Hệ số góc k = ${slope.toFixed(2)}`, ptH.sx + 10, ptH.sy - 10);
        }
      }
    }
  }, [
    viewState, mathFn, analysisData, showTangent, showIntegral, 
    integralBounds, showExtrema, showRoots, hoverPos, 
    selectedPresetId, params, mathToScreen, screenToMath
  ]);

  // Xử lý Resize Canvas theo kích thước thẻ bao quanh
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
        // Trigger render
        setViewState(prev => ({ ...prev }));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Xử lý Kéo chuột di chuyển Viewport
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const mathPt = screenToMath(sx, sy, canvas.width, canvas.height);
    setHoverPos({ mathX: mathPt.x, mathY: mathPt.y, screenX: sx, screenY: sy });

    if (isDragging) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      setViewState(prev => ({
        ...prev,
        centerX: prev.centerX - dx / prev.scale,
        centerY: prev.centerY + dy / prev.scale,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom bằng lăn chuột
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setViewState(prev => ({
      ...prev,
      scale: Math.max(5, Math.min(300, prev.scale * zoomFactor)),
    }));
  };

  // Reset về gốc tọa độ
  const handleResetView = () => {
    setViewState({ centerX: 0, centerY: 0, scale: 40 });
  };

  // Xuất ảnh đồ thị PNG
  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `do-thi-${selectedPresetId}-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // Render LaTeX an toàn
  const renderFormulaLatex = () => {
    try {
      return { __html: katex.renderToString(activePreset.latex, { throwOnError: false }) };
    } catch {
      return { __html: activePreset.formula };
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* 1. KHUNG ĐỒ THỊ CHÍNH (CANVAS 60 FPS) */}
      <div 
        ref={containerRef}
        className="flex-1 relative min-h-[460px] lg:min-h-[580px] rounded-3xl overflow-hidden border border-border-theme shadow-2xl bg-bg-secondary select-none"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { setIsDragging(false); setHoverPos(null); }}
          onWheel={handleWheel}
          className="w-full h-full cursor-crosshair block"
        />

        {/* Thanh công cụ nổi trên Canvas */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-bg-primary/80 backdrop-blur-md p-2 rounded-2xl border border-border-theme text-xs shadow-lg">
          <button
            onClick={() => setViewState(p => ({ ...p, scale: Math.min(300, p.scale * 1.25) }))}
            className="p-2 rounded-xl hover:bg-bg-tertiary text-text-primary transition-colors cursor-pointer"
            title="Phóng to"
          >
            <ZoomIn className="w-4 h-4 text-accent-cyan" />
          </button>
          <button
            onClick={() => setViewState(p => ({ ...p, scale: Math.max(5, p.scale * 0.8) }))}
            className="p-2 rounded-xl hover:bg-bg-tertiary text-text-primary transition-colors cursor-pointer"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-4 h-4 text-accent-cyan" />
          </button>
          <button
            onClick={handleResetView}
            className="p-2 rounded-xl hover:bg-bg-tertiary text-text-primary transition-colors cursor-pointer"
            title="Đưa về tâm O(0,0)"
          >
            <RotateCcw className="w-4 h-4 text-text-secondary" />
          </button>
          <div className="w-[1px] h-4 bg-border-theme mx-1" />
          <button
            onClick={handleExportPNG}
            className="p-2 rounded-xl hover:bg-bg-tertiary text-text-primary transition-colors cursor-pointer flex items-center gap-1.5"
            title="Tải ảnh đồ thị PNG độ nét cao"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-bold text-emerald-400 hidden sm:inline">Xuất PNG</span>
          </button>
        </div>

        {/* HUD Hiển thị Tọa độ chuột hover */}
        {hoverPos && (
          <div className="absolute bottom-4 left-4 bg-bg-primary/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-border-theme font-mono text-[11px] text-cyan-300 shadow-xl pointer-events-none">
            <span>x = {hoverPos.mathX.toFixed(2)}</span>
            <span className="mx-2 text-text-secondary">|</span>
            <span>y = {mathFn(hoverPos.mathX) !== null ? mathFn(hoverPos.mathX).toFixed(2) : 'Không XĐ'}</span>
          </div>
        )}

        {/* Nút Gọi AI Phân Tích */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => onAskAI?.({
              type: 'math',
              preset: activePreset.name,
              formula: currentExprString,
              analysis: analysisData,
            })}
            className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-accent-pink to-accent-purple text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-accent-pink/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Phân Tích Hàm Số</span>
          </button>
        </div>
      </div>

      {/* 2. BẢNG ĐIỀU KHIỂN THAM SỐ & KHẢO SÁT HÀM SỐ (SIDE PANEL) */}
      <div className="w-full lg:w-[380px] flex flex-col gap-4">
        {/* Chọn Mẫu Bài Toán */}
        <div className="p-5 rounded-3xl bg-bg-secondary border border-border-theme space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-cyan" />
              <span>Dạng Hàm Số Khảo Sát</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              THPT & THCS
            </span>
          </div>

          <select
            value={selectedPresetId}
            onChange={(e) => {
              const newId = e.target.value;
              setSelectedPresetId(newId);
              const found = MATH_PRESETS.find(p => p.id === newId);
              if (found?.defaultParams) setParams({ ...found.defaultParams });
            }}
            className="w-full bg-bg-tertiary text-text-primary text-xs font-semibold rounded-2xl px-4 py-3 border border-border-theme focus:outline-none focus:border-accent-cyan cursor-pointer"
          >
            {MATH_PRESETS.map(p => (
              <option key={p.id} value={p.id} className="bg-bg-primary text-text-primary">
                {p.name}
              </option>
            ))}
          </select>

          {/* Hiển thị Công thức LaTeX */}
          <div className="p-3.5 rounded-2xl bg-bg-tertiary border border-border-theme flex items-center justify-between overflow-x-auto">
            <span 
              className="text-accent-pink text-sm font-semibold"
              dangerouslySetInnerHTML={renderFormulaLatex()} 
            />
            <span className="text-[10px] text-text-secondary font-mono">KaTeX</span>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            {activePreset.desc}
          </p>

          {/* Nhập biểu thức tùy chỉnh (Nếu chọn chế độ custom) */}
          {selectedPresetId === 'custom' && (
            <div className="space-y-1.5 pt-2 border-t border-border-theme">
              <label className="text-[11px] font-bold text-text-secondary">Nhập f(x) tùy ý:</label>
              <input
                type="text"
                value={customExpr}
                onChange={(e) => setCustomExpr(e.target.value)}
                placeholder="Ví dụ: x^3 - 3*x + 1 hoặc sin(x)*exp(-0.1*x)"
                className="w-full bg-bg-tertiary text-text-primary text-xs font-mono rounded-xl px-3.5 py-2.5 border border-border-theme focus:outline-none focus:border-accent-cyan"
              />
            </div>
          )}
        </div>

        {/* Thanh Trượt Tham Số Tương Tác (Dynamic Sliders) */}
        {selectedPresetId !== 'custom' && Object.keys(params).length > 0 && (
          <div className="p-5 rounded-3xl bg-bg-secondary border border-border-theme space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                <Sliders className="w-4 h-4 text-accent-pink" />
                <span>Thanh Trượt Biến Thiên Tham Số</span>
              </span>
              <button
                onClick={() => setParams({ ...activePreset.defaultParams })}
                className="text-[10px] text-accent-cyan hover:underline cursor-pointer"
              >
                Mặc định
              </button>
            </div>

            <div className="space-y-3.5">
              {Object.entries(params).map(([key, val]) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-text-primary">{key.toUpperCase()}:</span>
                    <span className="text-accent-cyan font-bold">{val}</span>
                  </div>
                  <input
                    type="range"
                    min={key === 'w' || key === 'A' ? 0.1 : -5}
                    max={5}
                    step={0.1}
                    value={val}
                    onChange={(e) => setParams(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="w-full accent-accent-pink cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lớp Đồ Thị & Tính Năng Giải Tích (Calculus Toggles) */}
        <div className="p-5 rounded-3xl bg-bg-secondary border border-border-theme space-y-3 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-400" />
            <span>Lớp Hiển Thị Giải Tích</span>
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-xl bg-bg-tertiary cursor-pointer hover:bg-bg-tertiary/80 transition-colors">
              <input
                type="checkbox"
                checked={showTangent}
                onChange={(e) => setShowTangent(e.target.checked)}
                className="accent-accent-pink"
              />
              <span className="text-text-primary text-[11px] font-medium">Tiếp tuyến chuột</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-bg-tertiary cursor-pointer hover:bg-bg-tertiary/80 transition-colors">
              <input
                type="checkbox"
                checked={showExtrema}
                onChange={(e) => setShowExtrema(e.target.checked)}
                className="accent-accent-pink"
              />
              <span className="text-text-primary text-[11px] font-medium">Điểm cực trị</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-bg-tertiary cursor-pointer hover:bg-bg-tertiary/80 transition-colors">
              <input
                type="checkbox"
                checked={showRoots}
                onChange={(e) => setShowRoots(e.target.checked)}
                className="accent-accent-pink"
              />
              <span className="text-text-primary text-[11px] font-medium">Nghiệm f(x)=0</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-bg-tertiary cursor-pointer hover:bg-bg-tertiary/80 transition-colors">
              <input
                type="checkbox"
                checked={showIntegral}
                onChange={(e) => setShowIntegral(e.target.checked)}
                className="accent-accent-pink"
              />
              <span className="text-text-primary text-[11px] font-medium">Diện tích tích phân</span>
            </label>
          </div>

          {/* Tùy chỉnh cận tích phân */}
          {showIntegral && (
            <div className="pt-2 border-t border-border-theme space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-text-secondary">Cận tích phân [a; b]:</span>
                <span className="text-accent-pink font-bold">
                  S ≈ {analysisData.integralVal.toFixed(3)} (đvdt)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-text-secondary">Cận dưới a:</span>
                  <input
                    type="number"
                    value={integralBounds.a}
                    onChange={(e) => setIntegralBounds(p => ({ ...p, a: Number(e.target.value) }))}
                    className="w-full bg-bg-tertiary text-text-primary font-mono text-xs p-1.5 rounded-lg border border-border-theme"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-text-secondary">Cận trên b:</span>
                  <input
                    type="number"
                    value={integralBounds.b}
                    onChange={(e) => setIntegralBounds(p => ({ ...p, b: Number(e.target.value) }))}
                    className="w-full bg-bg-tertiary text-text-primary font-mono text-xs p-1.5 rounded-lg border border-border-theme"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
