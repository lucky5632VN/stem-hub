import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, X, RefreshCw, Play, ChevronDown, ChevronUp, Calculator } from 'lucide-react';

// =====================
// Preset shapes for Explorer Mode
// =====================
const SHAPE_PRESETS = [
  {
    id: 'pyramid',
    label: 'Hình chóp đều S.ABCD',
    emoji: '🔺',
    params: { a: 2, h: 3 },
    paramDefs: [
      { key: 'a', label: 'Cạnh đáy a', min: 0.5, max: 5, step: 0.1, unit: '' },
      { key: 'h', label: 'Chiều cao h', min: 0.5, max: 6, step: 0.1, unit: '' },
    ],
    formulas: (p) => [
      { label: 'Thể tích V', value: `${((p.a * p.a * p.h) / 3).toFixed(3)}`, unit: ' đvtt', latex: `V = \\frac{a^2 h}{3} = \\frac{${p.a}^2 \\cdot ${p.h}}{3}` },
      { label: 'Diện tích đáy S₀', value: `${(p.a * p.a).toFixed(3)}`, unit: ' đvdt', latex: `S_0 = a^2 = ${p.a}^2` },
      { label: 'Đường trung bình', value: `${(p.a / 2 * Math.SQRT2).toFixed(3)}`, unit: '', latex: `r = \\frac{a\\sqrt{2}}{2}` },
      { label: 'Cạnh bên l', value: `${Math.sqrt(p.h * p.h + (p.a / 2) * (p.a / 2) * 2).toFixed(3)}`, unit: '', latex: `l = \\sqrt{h^2 + \\frac{a^2}{2}}` },
    ],
    buildPrompt: (p) => `Hình chóp đều S.ABCD có cạnh đáy a = ${p.a} và chiều cao h = ${p.h}. Dựng hình và tính thể tích, diện tích toàn phần.`,
  },
  {
    id: 'cube',
    label: 'Hình lập phương',
    emoji: '⬛',
    params: { a: 2 },
    paramDefs: [
      { key: 'a', label: 'Cạnh a', min: 0.5, max: 5, step: 0.1, unit: '' },
    ],
    formulas: (p) => [
      { label: 'Thể tích V', value: `${(p.a ** 3).toFixed(3)}`, unit: ' đvtt', latex: `V = a^3 = ${p.a}^3` },
      { label: 'Diện tích toàn phần', value: `${(6 * p.a * p.a).toFixed(3)}`, unit: ' đvdt', latex: `S = 6a^2 = 6 \\cdot ${p.a}^2` },
      { label: 'Đường chéo không gian', value: `${(p.a * Math.sqrt(3)).toFixed(3)}`, unit: '', latex: `d = a\\sqrt{3} = ${p.a}\\sqrt{3}` },
      { label: 'Đường chéo mặt', value: `${(p.a * Math.SQRT2).toFixed(3)}`, unit: '', latex: `d_m = a\\sqrt{2}` },
    ],
    buildPrompt: (p) => `Hình lập phương ABCD.A'B'C'D' cạnh a = ${p.a}. Dựng hình và tính thể tích, đường chéo không gian.`,
  },
  {
    id: 'prism',
    label: 'Lăng trụ tam giác đều',
    emoji: '🔷',
    params: { a: 2, h: 4 },
    paramDefs: [
      { key: 'a', label: 'Cạnh đáy a', min: 0.5, max: 5, step: 0.1, unit: '' },
      { key: 'h', label: 'Chiều cao h', min: 0.5, max: 8, step: 0.1, unit: '' },
    ],
    formulas: (p) => [
      { label: 'Thể tích V', value: `${((Math.sqrt(3) / 4) * p.a * p.a * p.h).toFixed(3)}`, unit: ' đvtt', latex: `V = \\frac{\\sqrt{3}}{4}a^2 h` },
      { label: 'Diện tích đáy', value: `${((Math.sqrt(3) / 4) * p.a * p.a).toFixed(3)}`, unit: ' đvdt', latex: `S_0 = \\frac{\\sqrt{3}}{4}a^2` },
      { label: 'Diện tích xung quanh', value: `${(3 * p.a * p.h).toFixed(3)}`, unit: ' đvdt', latex: `S_{xq} = 3ah` },
    ],
    buildPrompt: (p) => `Lăng trụ tam giác đều ABC.A'B'C' cạnh đáy a = ${p.a} và chiều cao h = ${p.h}. Dựng hình và tính thể tích.`,
  },
  {
    id: 'cone',
    label: 'Hình nón',
    emoji: '🍦',
    params: { r: 2, h: 4 },
    paramDefs: [
      { key: 'r', label: 'Bán kính r', min: 0.5, max: 5, step: 0.1, unit: '' },
      { key: 'h', label: 'Chiều cao h', min: 0.5, max: 8, step: 0.1, unit: '' },
    ],
    formulas: (p) => [
      { label: 'Thể tích V', value: `${((Math.PI * p.r * p.r * p.h) / 3).toFixed(3)}`, unit: ' đvtt', latex: `V = \\frac{1}{3}\\pi r^2 h` },
      { label: 'Đường sinh l', value: `${Math.sqrt(p.r * p.r + p.h * p.h).toFixed(3)}`, unit: '', latex: `l = \\sqrt{r^2 + h^2}` },
      { label: 'Diện tích xung quanh', value: `${(Math.PI * p.r * Math.sqrt(p.r * p.r + p.h * p.h)).toFixed(3)}`, unit: ' đvdt', latex: `S_{xq} = \\pi r l` },
      { label: 'Diện tích toàn phần', value: `${(Math.PI * p.r * (Math.sqrt(p.r * p.r + p.h * p.h) + p.r)).toFixed(3)}`, unit: ' đvdt', latex: `S = \\pi r(l + r)` },
    ],
    buildPrompt: (p) => `Hình nón có bán kính r = ${p.r} và chiều cao h = ${p.h}. Dựng hình và tính thể tích, diện tích toàn phần.`,
  },
];

// =====================
// Single Slider
// =====================
function ParamSlider({ def, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{def.label}</label>
        <span
          className="text-sm font-black tabular-nums px-2 py-0.5 rounded-lg"
          style={{ background: 'rgba(34,211,238,0.08)', color: '#22d3ee' }}
        >
          {value.toFixed(1)}{def.unit}
        </span>
      </div>
      <div className="relative flex items-center gap-2">
        <span className="text-[9px] text-slate-600 w-5 text-right">{def.min}</span>
        <div className="flex-1 relative h-6 flex items-center">
          <div
            className="absolute left-0 h-1 rounded-full"
            style={{
              width: `${((value - def.min) / (def.max - def.min)) * 100}%`,
              background: 'linear-gradient(90deg, #0891b2, #22d3ee)',
            }}
          />
          <div className="absolute w-full h-1 rounded-full bg-white/5" />
          <input
            type="range"
            min={def.min}
            max={def.max}
            step={def.step}
            value={value}
            onChange={e => onChange(def.key, parseFloat(e.target.value))}
            className="absolute w-full h-full opacity-0 cursor-pointer z-10"
          />
          {/* Thumb */}
          <div
            className="absolute w-3.5 h-3.5 rounded-full border-2 pointer-events-none"
            style={{
              left: `calc(${((value - def.min) / (def.max - def.min)) * 100}% - 7px)`,
              background: '#22d3ee',
              borderColor: '#0e7490',
              boxShadow: '0 0 8px rgba(34,211,238,0.6)',
            }}
          />
        </div>
        <span className="text-[9px] text-slate-600 w-5">{def.max}</span>
      </div>
    </div>
  );
}

// =====================
// Formula Card
// =====================
function FormulaCard({ formula }) {
  return (
    <motion.div
      layout
      className="flex items-center justify-between px-3 py-2.5 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <span className="text-[10px] text-slate-500 font-bold">{formula.label}</span>
      <span className="text-sm font-black text-cyan-400 tabular-nums">
        {formula.value}
        <span className="text-[10px] text-slate-500 font-normal">{formula.unit}</span>
      </span>
    </motion.div>
  );
}

// =====================
// Explorer Mode Panel (floating bottom panel)
// =====================
export default function ExplorerMode({ isOpen, onClose, onSendToAI }) {
  const [selectedShape, setSelectedShape] = useState(SHAPE_PRESETS[0]);
  const [params, setParams] = useState({ ...SHAPE_PRESETS[0].params });
  const [isExpanded, setIsExpanded] = useState(true);
  const [formulas, setFormulas] = useState([]);

  // Recalculate formulas on param change
  useEffect(() => {
    setFormulas(selectedShape.formulas(params));
  }, [params, selectedShape]);

  // Reset params when shape changes
  const handleShapeChange = (preset) => {
    setSelectedShape(preset);
    setParams({ ...preset.params });
  };

  const handleParamChange = useCallback((key, val) => {
    setParams(prev => ({ ...prev, [key]: val }));
  }, []);

  const handleSend = () => {
    const prompt = selectedShape.buildPrompt(params);
    onSendToAI && onSendToAI(prompt);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="fixed bottom-6 left-1/2 z-[90] w-full max-w-xl"
          style={{ transform: 'translateX(-50%) translateX(190px)' }}
        >
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(2,6,23,0.92)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(34,211,238,0.15)',
              boxShadow: '0 -8px 40px rgba(34,211,238,0.06), 0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Top cyan glow line */}
            <div className="h-0.5 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Sliders size={14} className="text-cyan-400" />
                </div>
                <div>
                  <span className="text-white font-black text-sm">Explorer Mode</span>
                  <span className="text-cyan-500/50 text-[9px] font-bold uppercase tracking-widest ml-2">Tự khám phá</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(e => !e)}
                  className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-all"
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Body */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-4">
                    {/* Shape selector */}
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {SHAPE_PRESETS.map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => handleShapeChange(preset)}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all whitespace-nowrap"
                          style={{
                            background: selectedShape.id === preset.id ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.04)',
                            border: selectedShape.id === preset.id ? '1px solid rgba(34,211,238,0.3)' : '1px solid rgba(255,255,255,0.06)',
                            color: selectedShape.id === preset.id ? '#22d3ee' : '#64748b',
                          }}
                        >
                          {preset.emoji} {preset.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Param sliders */}
                      <div className="space-y-4">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          <Sliders size={9} /> Tham số
                        </p>
                        {selectedShape.paramDefs.map(def => (
                          <ParamSlider
                            key={def.key}
                            def={def}
                            value={params[def.key] ?? def.min}
                            onChange={handleParamChange}
                          />
                        ))}
                      </div>

                      {/* Formula results */}
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          <Calculator size={9} /> Kết quả ngay lập tức
                        </p>
                        {formulas.map((f, i) => (
                          <FormulaCard key={i} formula={f} />
                        ))}
                      </div>
                    </div>

                    {/* Send to AI button */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSend}
                      className="w-full py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-white flex items-center justify-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                        boxShadow: '0 4px 20px rgba(6,182,212,0.25)',
                      }}
                    >
                      <Play size={14} />
                      Dựng hình với tham số này
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
