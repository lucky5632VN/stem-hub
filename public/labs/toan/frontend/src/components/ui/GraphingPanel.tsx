import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, X, Eye, EyeOff, Calculator, Info, Sliders, 
  Sparkles, RotateCcw, LineChart, Layers 
} from 'lucide-react';
import katex from 'katex';
import { useGeometryStore } from '../../store/useGeometryStore';

interface PresetDefinition {
  id: string;
  name: string;
  badge: string;
  params: { [key: string]: { label: string; min: number; max: number; step: number; default: number } };
  formatLatex: (p: { [key: string]: number }) => string;
  generateFormula: (p: { [key: string]: number }) => string;
  analyze: (p: { [key: string]: number }) => {
    vertexOrExtrema?: string;
    roots?: string;
    asymptotesOrSym?: string;
    notes?: string;
  };
}

const MATH_PRESETS: PresetDefinition[] = [
  {
    id: 'parabola',
    name: 'Hàm số bậc 2 (Parabol)',
    badge: 'THPT & THCS',
    params: {
      a: { label: 'A (Hệ số x²)', min: -5, max: 5, step: 0.2, default: 1 },
      b: { label: 'B (Hệ số x)', min: -8, max: 8, step: 0.5, default: -2 },
      c: { label: 'C (Hệ số tự do)', min: -8, max: 8, step: 0.5, default: -3 },
    },
    formatLatex: (p) => {
      const a = p.a !== undefined ? p.a : 1;
      const b = p.b !== undefined ? p.b : -2;
      const c = p.c !== undefined ? p.c : -3;
      let expr = `y = ${a === 1 ? '' : a === -1 ? '-' : a}x^2`;
      if (b !== 0) expr += ` ${b > 0 ? '+' : '-'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`;
      if (c !== 0) expr += ` ${c > 0 ? '+' : '-'} ${Math.abs(c)}`;
      return expr;
    },
    generateFormula: (p) => {
      const a = p.a !== 0 ? p.a : 0.001;
      return `(${a}) * x^2 + (${p.b}) * x + (${p.c})`;
    },
    analyze: (p) => {
      const a = p.a !== 0 ? p.a : 0.001;
      const b = p.b;
      const c = p.c;
      const delta = b * b - 4 * a * c;
      const xI = -b / (2 * a);
      const yI = -delta / (4 * a);
      const vertexType = a > 0 ? 'Cực tiểu' : 'Cực đại';
      
      let rootsStr = 'Vô nghiệm thực (Δ < 0)';
      if (delta > 0) {
        const x1 = (-b - Math.sqrt(delta)) / (2 * a);
        const x2 = (-b + Math.sqrt(delta)) / (2 * a);
        rootsStr = `x₁ = ${x1.toFixed(2)}, x₂ = ${x2.toFixed(2)}`;
      } else if (Math.abs(delta) < 1e-4) {
        rootsStr = `Nghiệm kép x₀ = ${xI.toFixed(2)}`;
      }

      return {
        vertexOrExtrema: `Đỉnh I(${xI.toFixed(2)}, ${yI.toFixed(2)}) [${vertexType}]`,
        roots: rootsStr,
        asymptotesOrSym: `Trục đối xứng x = ${xI.toFixed(2)}`,
        notes: a > 0 ? 'Bề lõm quay lên trên (a > 0)' : 'Bề lõm quay xuống dưới (a < 0)'
      };
    }
  },
  {
    id: 'cubic',
    name: 'Hàm số bậc 3',
    badge: '12 THPT',
    params: {
      a: { label: 'A (Hệ số x³)', min: -3, max: 3, step: 0.2, default: 1 },
      b: { label: 'B (Hệ số x²)', min: -5, max: 5, step: 0.5, default: 0 },
      c: { label: 'C (Hệ số x)', min: -8, max: 8, step: 0.5, default: -3 },
      d: { label: 'D (Hệ số tự do)', min: -5, max: 5, step: 0.5, default: 2 },
    },
    formatLatex: (p) => {
      return `y = ${p.a}x^3 ${p.b >= 0 ? '+' : ''}${p.b}x^2 ${p.c >= 0 ? '+' : ''}${p.c}x ${p.d >= 0 ? '+' : ''}${p.d}`;
    },
    generateFormula: (p) => {
      const a = p.a !== 0 ? p.a : 0.001;
      return `(${a}) * x^3 + (${p.b}) * x^2 + (${p.c}) * x + (${p.d})`;
    },
    analyze: (p) => {
      const a = p.a !== 0 ? p.a : 0.001;
      const b = p.b;
      const c = p.c;
      const d = p.d;
      const xUon = -b / (3 * a);
      const yUon = a * Math.pow(xUon, 3) + b * Math.pow(xUon, 2) + c * xUon + d;
      
      const deltaPrime = b * b - 3 * a * c;
      let extremaStr = 'Không có cực trị (Δ\' ≤ 0)';
      if (deltaPrime > 0) {
        const x1 = (-b - Math.sqrt(deltaPrime)) / (3 * a);
        const x2 = (-b + Math.sqrt(deltaPrime)) / (3 * a);
        const y1 = a * Math.pow(x1, 3) + b * Math.pow(x1, 2) + c * x1 + d;
        const y2 = a * Math.pow(x2, 3) + b * Math.pow(x2, 2) + c * x2 + d;
        extremaStr = `2 Cực trị: (${x1.toFixed(2)}, ${y1.toFixed(2)}) & (${x2.toFixed(2)}, ${y2.toFixed(2)})`;
      }

      return {
        vertexOrExtrema: extremaStr,
        asymptotesOrSym: `Tâm đối xứng / Điểm uốn U(${xUon.toFixed(2)}, ${yUon.toFixed(2)})`,
        notes: deltaPrime > 0 ? 'Đồ thị có 2 điểm cực trị lồi lõm' : 'Hàm số đơn điệu trên ℝ'
      };
    }
  },
  {
    id: 'rational',
    name: 'Phân thức hữu tỉ (ax+b)/(cx+d)',
    badge: '12 THPT',
    params: {
      a: { label: 'A (Tử bậc 1)', min: -5, max: 5, step: 0.5, default: 2 },
      b: { label: 'B (Tử tự do)', min: -5, max: 5, step: 0.5, default: -1 },
      c: { label: 'C (Mẫu bậc 1)', min: -4, max: 4, step: 0.5, default: 1 },
      d: { label: 'D (Mẫu tự do)', min: -5, max: 5, step: 0.5, default: 1 },
    },
    formatLatex: (p) => {
      return `y = \\frac{${p.a}x ${p.b >= 0 ? '+' : ''}${p.b}}{${p.c}x ${p.d >= 0 ? '+' : ''}${p.d}}`;
    },
    generateFormula: (p) => {
      const c = p.c !== 0 ? p.c : 0.001;
      return `((${p.a}) * x + (${p.b})) / ((${c}) * x + (${p.d}))`;
    },
    analyze: (p) => {
      const a = p.a;
      const b = p.b;
      const c = p.c !== 0 ? p.c : 0.001;
      const d = p.d;
      const tcDung = -d / c;
      const tcNgang = a / c;
      const ad_bc = a * d - b * c;
      const monotonicity = ad_bc > 0 ? 'Đồng biến trên từng khoảng xác định' : 'Nghịch biến trên từng khoảng xác định';

      return {
        vertexOrExtrema: `Tâm đối xứng I(${tcDung.toFixed(2)}, ${tcNgang.toFixed(2)})`,
        asymptotesOrSym: `TCĐ: x = ${tcDung.toFixed(2)} | TCN: y = ${tcNgang.toFixed(2)}`,
        notes: `Đạo hàm y' = ${ad_bc.toFixed(2)} / (${c}x + ${d})² (${monotonicity})`
      };
    }
  },
  {
    id: 'quartic',
    name: 'Hàm bậc 4 trùng phương',
    badge: '12 THPT',
    params: {
      a: { label: 'A (Hệ số x⁴)', min: -3, max: 3, step: 0.2, default: 1 },
      b: { label: 'B (Hệ số x²)', min: -6, max: 6, step: 0.5, default: -4 },
      c: { label: 'C (Hệ số tự do)', min: -6, max: 6, step: 0.5, default: 3 },
    },
    formatLatex: (p) => {
      return `y = ${p.a}x^4 ${p.b >= 0 ? '+' : ''}${p.b}x^2 ${p.c >= 0 ? '+' : ''}${p.c}`;
    },
    generateFormula: (p) => {
      const a = p.a !== 0 ? p.a : 0.001;
      return `(${a}) * x^4 + (${p.b}) * x^2 + (${p.c})`;
    },
    analyze: (p) => {
      const a = p.a !== 0 ? p.a : 0.001;
      const b = p.b;
      const c = p.c;
      const hasThreeExtrema = a * b < 0;

      let extremaStr = `1 Cực trị: (0, ${c.toFixed(2)})`;
      if (hasThreeExtrema) {
        const x1 = Math.sqrt(-b / (2 * a));
        const y1 = a * Math.pow(x1, 4) + b * Math.pow(x1, 2) + c;
        extremaStr = `3 Cực trị: (0, ${c.toFixed(2)}), (±${x1.toFixed(2)}, ${y1.toFixed(2)})`;
      }

      return {
        vertexOrExtrema: extremaStr,
        asymptotesOrSym: 'Trục đối xứng: Trục tung Oy (x = 0)',
        notes: hasThreeExtrema ? 'Đồ thị hình chữ W hoặc M (a.b < 0)' : 'Đồ thị dạng Parabol uốn (a.b ≥ 0)'
      };
    }
  },
  {
    id: 'trig_sin',
    name: 'Hàm số lượng giác Sin',
    badge: '11 THPT',
    params: {
      A: { label: 'Biên độ A', min: -5, max: 5, step: 0.5, default: 2 },
      w: { label: 'Tần số góc ω', min: 0.2, max: 4, step: 0.2, default: 1 },
      phi: { label: 'Pha ban đầu φ', min: -3.14, max: 3.14, step: 0.314, default: 0 },
      k: { label: 'Độ nâng k', min: -4, max: 4, step: 0.5, default: 0 },
    },
    formatLatex: (p) => {
      return `y = ${p.A}\\sin(${p.w}x ${p.phi >= 0 ? '+' : ''}${p.phi.toFixed(2)}) ${p.k >= 0 ? '+' : ''}${p.k}`;
    },
    generateFormula: (p) => {
      return `(${p.A}) * sin((${p.w}) * x + (${p.phi})) + (${p.k})`;
    },
    analyze: (p) => {
      const A = p.A;
      const w = p.w !== 0 ? Math.abs(p.w) : 1;
      const T = (2 * Math.PI) / w;
      const minVal = -Math.abs(A) + p.k;
      const maxVal = Math.abs(A) + p.k;

      return {
        vertexOrExtrema: `Tập giá trị T = [${minVal.toFixed(2)}, ${maxVal.toFixed(2)}]`,
        asymptotesOrSym: `Chu kỳ tuần hoàn T = 2π/ω = ${T.toFixed(2)}`,
        notes: 'Sóng hình sin điều hòa chu kỳ'
      };
    }
  },
  {
    id: 'exponential',
    name: 'Hàm số Mũ & Tự nhiên',
    badge: '12 THPT',
    params: {
      a: { label: 'Hệ số a', min: -4, max: 4, step: 0.5, default: 1 },
      b: { label: 'Cơ số / Tỷ lệ b', min: -2, max: 2, step: 0.1, default: 0.5 },
    },
    formatLatex: (p) => {
      return `y = ${p.a} \\cdot e^{${p.b}x}`;
    },
    generateFormula: (p) => {
      return `(${p.a}) * exp((${p.b}) * x)`;
    },
    analyze: (p) => {
      return {
        vertexOrExtrema: `Giao điểm trục Oy: (0, ${p.a})`,
        asymptotesOrSym: 'Tiệm cận ngang: Trục hoành Ox (y = 0)',
        notes: p.b > 0 ? 'Hàm số tăng trưởng mũ (Đồng biến)' : 'Hàm số suy giảm mũ (Nghịch biến)'
      };
    }
  }
];

const GraphingPanel: React.FC = () => {
  const { 
    expressions, 
    addExpression, 
    removeExpression, 
    updateExpression,
    setExpressions,
    x0,
    setX0
  } = useGeometryStore();

  const [graphMode, setGraphMode] = useState<'survey' | 'custom'>('survey');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('parabola');
  
  const currentPreset = useMemo(() => {
    return MATH_PRESETS.find(p => p.id === selectedPresetId) || MATH_PRESETS[0];
  }, [selectedPresetId]);

  // Parameters state for survey mode
  const [paramValues, setParamValues] = useState<{ [key: string]: number }>(() => {
    const init: { [key: string]: number } = {};
    Object.entries(currentPreset.params).forEach(([k, v]) => {
      init[k] = v.default;
    });
    return init;
  });

  // Reset params when preset changes
  useEffect(() => {
    const newParams: { [key: string]: number } = {};
    Object.entries(currentPreset.params).forEach(([k, v]) => {
      newParams[k] = v.default;
    });
    setParamValues(newParams);
  }, [selectedPresetId]);

  // Update formula in geometry store when params change
  useEffect(() => {
    if (graphMode !== 'survey') return;
    const formula = currentPreset.generateFormula(paramValues);
    
    // Ensure at least one expression exists and belongs to survey
    if (expressions.length === 0) {
      setExpressions([{ id: 'survey-main', formula, color: '#58a6ff', visible: true }]);
    } else {
      updateExpression(expressions[0].id, { formula, visible: true });
    }
  }, [paramValues, currentPreset, graphMode]);

  // Handle Ask AI about current surveyed function
  const handleAskAI = () => {
    const latex = currentPreset.formatLatex(paramValues);
    const analysis = currentPreset.analyze(paramValues);
    const prompt = `Em đang khảo sát đồ thị toán học hàm số: $${latex}$.
Các thông số đã xác định:
- Đỉnh / Cực trị: ${analysis.vertexOrExtrema || 'N/A'}
- Nghiệm / Giao điểm: ${analysis.roots || 'N/A'}
- Tiệm cận / Đối xứng: ${analysis.asymptotesOrSym || 'N/A'}
- Điểm tiếp tuyến x₀ = ${x0}.

Thầy hãy hướng dẫn em các bước khảo sát hàm số này theo chuẩn SGK:
1. Tập xác định và đạo hàm y'
2. Bảng biến thiên (chiều biến thiên, cực trị)
3. Tiệm cận (nếu có) và vẽ đồ thị
4. Phương trình tiếp tuyến tại x₀ = ${x0}`;

    window.dispatchEvent(new CustomEvent('open-math-ai-tutor', {
      detail: { prompt }
    }));
  };

  const currentAnalysis = useMemo(() => {
    return currentPreset.analyze(paramValues);
  }, [currentPreset, paramValues]);

  const latexHtml = useMemo(() => {
    try {
      return katex.renderToString(currentPreset.formatLatex(paramValues), { throwOnError: false });
    } catch {
      return currentPreset.formatLatex(paramValues);
    }
  }, [currentPreset, paramValues]);

  return (
    <>
      <div className="sidebar sidebar-left glass" style={{ width: '380px', padding: 0, display: 'flex', flexDirection: 'column', height: '100%', zIndex: 50 }}>
        
        {/* Header with Mode Switcher */}
        <div style={{ padding: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(13,17,23,0.7)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#58a6ff' }}>
              <Calculator size={20} />
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Đồ Thị & Giải Tích Oxy</h2>
            </div>
            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(88,166,255,0.15)', color: '#58a6ff', border: '1px solid rgba(88,166,255,0.3)', fontWeight: 700 }}>
              MATH LAB
            </span>
          </div>

          {/* Sub-tab Pill Switcher */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => setGraphMode('survey')}
              style={{
                padding: '0.45rem',
                borderRadius: '8px',
                border: 'none',
                background: graphMode === 'survey' ? '#1f6feb' : 'transparent',
                color: graphMode === 'survey' ? '#ffffff' : '#8b949e',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.2s',
              }}
            >
              <LineChart size={14} /> Khảo Sát Hàm Số
            </button>
            <button
              onClick={() => setGraphMode('custom')}
              style={{
                padding: '0.45rem',
                borderRadius: '8px',
                border: 'none',
                background: graphMode === 'custom' ? '#1f6feb' : 'transparent',
                color: graphMode === 'custom' ? '#ffffff' : '#8b949e',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.2s',
              }}
            >
              <Layers size={14} /> Biểu Thức Tự Do
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {graphMode === 'survey' ? (
            /* ── CHẾ ĐỘ KHẢO SÁT HÀM SỐ ── */
            <>
              {/* Dropdown chọn dạng hàm */}
              <div>
                <label style={{ fontSize: '0.75rem', color: '#8b949e', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  DẠNG HÀM SỐ KHẢO SÁT
                </label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => setSelectedPresetId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'rgba(22, 27, 34, 0.9)',
                    border: '1px solid rgba(88,166,255,0.3)',
                    borderRadius: '8px',
                    color: '#f0f6fc',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {MATH_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.badge}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Box hiển thị công thức LaTeX */}
              <div 
                style={{
                  padding: '0.9rem',
                  borderRadius: '12px',
                  background: 'rgba(31, 111, 235, 0.08)',
                  border: '1px solid rgba(88, 166, 255, 0.25)',
                  textAlign: 'center',
                  minHeight: '52px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 0 20px rgba(88, 166, 255, 0.05)',
                }}
              >
                <div 
                  dangerouslySetInnerHTML={{ __html: latexHtml }}
                  style={{ fontSize: '1.15rem', color: '#58a6ff' }}
                />
              </div>

              {/* Thanh trượt tham số biến thiên */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.9rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c9d1d9', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Sliders size={14} color="#58a6ff" /> THAM SỐ BIẾN THIÊN
                  </div>
                  <button
                    onClick={() => {
                      const resetParams: { [key: string]: number } = {};
                      Object.entries(currentPreset.params).forEach(([k, v]) => {
                        resetParams[k] = v.default;
                      });
                      setParamValues(resetParams);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#8b949e',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                    title="Đặt lại tham số mặc định"
                  >
                    <RotateCcw size={12} /> Mặc định
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                  {Object.entries(currentPreset.params).map(([paramKey, cfg]) => {
                    const val = paramValues[paramKey] ?? cfg.default;
                    return (
                      <div key={paramKey}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                          <span style={{ color: '#8b949e' }}>{cfg.label}</span>
                          <span style={{ color: '#58a6ff', fontFamily: 'monospace', fontWeight: 700 }}>{val}</span>
                        </div>
                        <input
                          type="range"
                          min={cfg.min}
                          max={cfg.max}
                          step={cfg.step}
                          value={val}
                          onChange={(e) => {
                            const num = parseFloat(e.target.value);
                            setParamValues(prev => ({ ...prev, [paramKey]: num }));
                          }}
                          style={{ width: '100%', margin: 0, accentColor: '#1f6feb', cursor: 'pointer' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Khảo sát giải tích tự động */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.9rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c9d1d9', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  📊 KẾT QUẢ KHẢO SÁT GIẢI TÍCH
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
                  {currentAnalysis.vertexOrExtrema && (
                    <div style={{ padding: '0.45rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                      <span style={{ color: '#8b949e' }}>Cực trị / Đỉnh: </span>
                      <span style={{ color: '#7ee787', fontWeight: 600 }}>{currentAnalysis.vertexOrExtrema}</span>
                    </div>
                  )}
                  {currentAnalysis.roots && (
                    <div style={{ padding: '0.45rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                      <span style={{ color: '#8b949e' }}>Giao trục Ox: </span>
                      <span style={{ color: '#ffa657', fontWeight: 600 }}>{currentAnalysis.roots}</span>
                    </div>
                  )}
                  {currentAnalysis.asymptotesOrSym && (
                    <div style={{ padding: '0.45rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                      <span style={{ color: '#8b949e' }}>Tiệm cận / Đối xứng: </span>
                      <span style={{ color: '#d2a8ff', fontWeight: 600 }}>{currentAnalysis.asymptotesOrSym}</span>
                    </div>
                  )}
                  {currentAnalysis.notes && (
                    <div style={{ fontSize: '0.7rem', color: '#8b949e', fontStyle: 'italic', marginTop: '2px' }}>
                      💡 {currentAnalysis.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Khám phá Tiếp tuyến x0 */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.9rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8b949e', fontWeight: 600 }}>Tiếp tuyến tại điểm x₀</span>
                  <span style={{ color: '#58a6ff', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700 }}>x₀ = {x0.toFixed(1)}</span>
                </div>
                <input 
                  type="range" min="-10" max="10" step="0.1" 
                  value={x0} 
                  onChange={(e) => setX0(parseFloat(e.target.value))} 
                  style={{ width: '100%', margin: 0, accentColor: '#58a6ff', cursor: 'pointer' }}
                />
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.68rem', color: '#8b949e' }}>
                  Đường tiếp tuyến nét đứt tự động hiển thị cùng tiếp điểm tròn trên đồ thị.
                </p>
              </div>

              {/* Nút gọi AI phân tích toàn diện */}
              <button
                onClick={handleAskAI}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #a371f7, #1f6feb)',
                  border: 'none',
                  color: 'white',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 16px rgba(163, 113, 247, 0.35)',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.92'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                <Sparkles size={16} /> AI Phân Tích & Giải Thích Chi Tiết
              </button>
            </>
          ) : (
            /* ── CHẾ ĐỘ BIỂU THỨC TỰ DO ── */
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {expressions.map((exp, index) => (
                  <div 
                    key={exp.id} 
                    className="glass" 
                    style={{ 
                      padding: '0.8rem', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: '0.6rem',
                      border: `1px solid ${exp.visible ? 'rgba(88,166,255,0.2)' : 'rgba(255,255,255,0.05)'}`,
                      background: exp.visible ? 'rgba(88,166,255,0.03)' : 'rgba(0,0,0,0.2)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <div 
                        onClick={() => updateExpression(exp.id, { visible: !exp.visible })}
                        style={{ 
                          width: '24px', height: '24px', borderRadius: '50%', 
                          background: exp.visible ? exp.color : 'transparent',
                          border: `2px solid ${exp.color}`,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        {exp.visible ? <Eye size={12} color="black" /> : <EyeOff size={12} color={exp.color} />}
                      </div>
                      
                      <div style={{ flex: 1, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '-1.5rem', top: '50%', transform: 'translateY(-50%)', color: '#484f58', fontSize: '0.8rem' }}>
                          {index + 1}
                        </span>
                        <input 
                          type="text" 
                          value={exp.formula} 
                          onChange={(e) => updateExpression(exp.id, { formula: e.target.value })}
                          placeholder="y = ..."
                          style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            padding: '0.4rem 0', 
                            fontSize: '1rem',
                            fontFamily: 'monospace',
                            color: exp.visible ? '#f0f6fc' : '#484f58',
                            width: '100%',
                            outline: 'none',
                          }}
                        />
                      </div>

                      <button 
                        onClick={() => removeExpression(exp.id)}
                        style={{ background: 'transparent', border: 'none', padding: '0.4rem', borderRadius: '4px', color: '#f85149', cursor: 'pointer' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => addExpression()}
                style={{ 
                  width: '100%', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px dashed rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.75rem', borderRadius: '12px', color: '#8b949e', cursor: 'pointer'
                }}
              >
                <Plus size={18} /> Thêm biểu thức mới
              </button>

              {/* Khám phá ví dụ nghệ thuật toán học */}
              <div style={{ padding: '0.9rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.75rem', color: '#8b949e', marginBottom: '0.6rem', fontWeight: 600 }}>
                  ✨ Khám phá hình ví dụ
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { label: 'Trái tim', formulas: ['(x^2 + y^2 - 1)^3 - x^2 * y^3 = 0'], icon: '❤️' },
                    { 
                      label: 'Mặt cười', 
                      formulas: [
                        'x^2 + y^2 - 25 = 0', 
                        '(x+2.5)^2 + (y-2)^2 - 0.5 = 0', 
                        '(x-2.5)^2 + (y-2)^2 - 0.5 = 0',
                        'y + 0.1*x^2 + 2 = 0'
                      ], 
                      icon: '😊' 
                    },
                    { label: 'Vô cực', formulas: ['(x^2 + y^2)^2 - 16 * (x^2 - y^2) = 0'], icon: '♾️' },
                    { label: 'Hoa 4 cánh', formulas: ['(x^2 + y^2)^3 - 16*x^2*y^2 = 0'], icon: '🌸' },
                    { label: 'Cánh bướm', formulas: ['x^6 + y^6 - x^2 = 0'], icon: '🦋' },
                    { 
                      label: 'Sóng lượng tử', 
                      formulas: [
                        'sin(x) * exp(-0.1 * abs(x))',
                        '-sin(x) * exp(-0.1 * abs(x))',
                        'exp(-0.1 * abs(x))',
                        '-exp(-0.1 * abs(x))'
                      ], 
                      icon: '🌊' 
                    },
                    {
                      label: 'Quả cầu 3D',
                      formulas: [
                        'x^2 + y^2 - 25 = 0',
                        'x^2 + y^2/0.1 - 25 = 0',
                        'x^2 + y^2/0.3 - 25 = 0',
                        'x^2 + y^2/0.6 - 25 = 0',
                        'x^2/0.1 + y^2 - 25 = 0',
                        'x^2/0.3 + y^2 - 25 = 0',
                        'x^2/0.6 + y^2 - 25 = 0'
                      ],
                      icon: '🌐'
                    },
                    {
                      label: 'Hoa Mandala',
                      formulas: [
                        'x^2 + y^2 - 16 = 0',
                        '(x-4)^2 + y^2 - 16 = 0',
                        '(x+4)^2 + y^2 - 16 = 0',
                        'x^2 + (y-4)^2 - 16 = 0',
                        'x^2 + (y+4)^2 - 16 = 0',
                        '(x-2.83)^2 + (y-2.83)^2 - 16 = 0',
                        '(x+2.83)^2 + (y-2.83)^2 - 16 = 0',
                        '(x-2.83)^2 + (y+2.83)^2 - 16 = 0',
                        '(x+2.83)^2 + (y+2.83)^2 - 16 = 0'
                      ],
                      icon: '🏵️'
                    }
                  ].map((ex) => (
                    <button
                      key={ex.label}
                      onClick={() => {
                        const colors = ['#58a6ff', '#ff7b72', '#7ee787', '#d2a8ff', '#ffa657'];
                        const newExps = ex.formulas.map((f, i) => ({
                          id: Math.random().toString(36).substr(2, 9),
                          formula: f,
                          color: colors[i % colors.length],
                          visible: true
                        }));
                        setExpressions(newExps);
                      }}
                      style={{
                        padding: '0.45rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)', color: '#f0f6fc', fontSize: '0.72rem',
                        cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.4rem',
                      }}
                    >
                      <span>{ex.icon}</span> {ex.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiếp tuyến x0 trong chế độ tự do */}
              <div style={{ padding: '0.9rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8b949e', fontWeight: 600 }}>Khám phá tiếp tuyến x₀</span>
                  <span style={{ color: '#58a6ff', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700 }}>x₀ = {x0.toFixed(1)}</span>
                </div>
                <input 
                  type="range" min="-10" max="10" step="0.1" 
                  value={x0} 
                  onChange={(e) => setX0(parseFloat(e.target.value))} 
                  style={{ width: '100%', margin: 0, accentColor: '#58a6ff', cursor: 'pointer' }}
                />
              </div>
            </>
          )}

        </div>

      </div>

      {/* Floating Instructions - chỉ hiển thị ở chế độ tự do */}
      {graphMode === 'custom' && (
        <div style={{
          position: 'absolute',
          top: '5.5rem',
          right: '1.5rem',
          background: 'rgba(13, 17, 23, 0.75)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(88,166,255,0.2)',
          borderRadius: '12px',
          padding: '1.1rem',
          color: '#c9d1d9',
          fontSize: '0.78rem',
          width: '320px',
          zIndex: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          pointerEvents: 'none'
        }}>
          <div style={{ fontWeight: 600, color: '#58a6ff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={16} /> Hướng dẫn cú pháp nhập liệu
          </div>
          <ul style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <li><b>Hàm tường minh:</b> <code>x^2</code>, <code>sin(x)</code>, <code>sqrt(x)</code>, <code>log(x)</code></li>
            <li><b>Hàm ẩn:</b> <code>x^2 + y^2 = 25</code></li>
            <li><b>Toán tử:</b> Nhân <code>*</code>, Chia <code>/</code>, Mũ <code>^</code></li>
            <li><i>(Đạo hàm và tiếp tuyến xuất hiện tự động tại x₀)</i></li>
          </ul>
        </div>
      )}
    </>
  );
};

export default GraphingPanel;
