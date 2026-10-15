'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  getOscillatorState, 
  generateSpringPoints 
} from '@/lib/grapher/harmonicPhysicsEngine';
import { 
  Play, Pause, RotateCcw, Sparkles, Activity, 
  Sliders, Gauge, Shield, Zap, Download 
} from 'lucide-react';

export default function HarmonicOscillatorView({ onAskAI }) {
  const springCanvasRef = useRef(null);
  const osciCanvasRef = useRef(null);

  // Tham số vật lý
  const [params, setParams] = useState({
    A: 6, // Biên độ 6 cm
    omega: 2, // Tần số góc 2 rad/s
    phi: 0, // Pha ban đầu
    m: 0.2, // Khối lượng 0.2 kg (200g)
    k: 0.8, // k = m * omega^2 = 0.2 * 4 = 0.8 N/m
  });

  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 0.5x, 1x, 2x
  const [activeChannels, setActiveChannels] = useState({ x: true, v: true, a: false });

  // Lưu lịch sử dữ liệu sóng cuộn (Scope History)
  const historyRef = useRef([]);
  const timeRef = useRef(0);
  const animFrameRef = useRef(null);
  const [currentState, setCurrentState] = useState(null);

  // Cập nhật k khi thay đổi m hoặc omega
  const autoK = useMemo(() => {
    return Number((params.m * Math.pow(params.omega, 2)).toFixed(2));
  }, [params.m, params.omega]);

  // Vòng lặp Animation 60 FPS
  useEffect(() => {
    let lastTimestamp = performance.now();

    const loop = (timestamp) => {
      const dt = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (isPlaying) {
        timeRef.current += dt * playbackSpeed;
      }

      const t = timeRef.current;
      const state = getOscillatorState({
        A: params.A,
        omega: params.omega,
        phi: params.phi,
        m: params.m,
        k: autoK,
        t,
      });

      setCurrentState(state);

      // Lưu 250 điểm lịch sử gần nhất cho máy hiện sóng
      historyRef.current.push(state);
      if (historyRef.current.length > 250) {
        historyRef.current.shift();
      }

      // Vẽ lò xo vật lý
      drawSpringCanvas(state);
      // Vẽ máy hiện sóng đa kênh
      drawOscilloscopeCanvas();

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, playbackSpeed, params, autoK, activeChannels]);

  // 1. Vẽ mô phỏng Lò xo thực tế
  const drawSpringCanvas = (state) => {
    const canvas = springCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Nền
    ctx.fillStyle = '#0c0818';
    ctx.fillRect(0, 0, w, h);

    // Vách cố định bên trái
    ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
    ctx.fillRect(20, 20, 16, h - 40);
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 16, h - 40);

    // Gạch chéo tường cố định
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
    ctx.lineWidth = 1;
    for (let y = 30; y < h - 40; y += 15) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(36, y - 10);
      ctx.stroke();
    }

    // Trục chuyển động nằm ngang
    const centerY = h / 2;
    const equilibriumX = w * 0.5; // Vị trí cân bằng O (x = 0)
    const scalePx = 14; // 1 cm = 14 pixels

    // Đường ray trượt
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(36, centerY + 28);
    ctx.lineTo(w - 20, centerY + 28);
    ctx.stroke();

    // Vị trí cân bằng O
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
    ctx.beginPath();
    ctx.moveTo(equilibriumX, 30);
    ctx.lineTo(equilibriumX, h - 30);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VTCB (O)', equilibriumX, h - 14);

    // Vị trí quả nặng: x_px = equilibriumX + state.x * scalePx
    const massX = equilibriumX + state.x * scalePx;
    const massSize = 44;

    // Sinh các điểm lò xo co giãn
    const springPoints = generateSpringPoints(36, centerY, massX - massSize / 2, centerY, 14, 28);

    ctx.beginPath();
    ctx.moveTo(springPoints[0].x, springPoints[0].y);
    for (let i = 1; i < springPoints.length; i++) {
      ctx.lineTo(springPoints[i].x, springPoints[i].y);
    }
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Quả nặng m
    const massY = centerY - massSize / 2;
    const massGradient = ctx.createLinearGradient(massX - massSize / 2, massY, massX + massSize / 2, massY + massSize);
    massGradient.addColorStop(0, '#F43F5E');
    massGradient.addColorStop(1, '#BE123C');

    ctx.fillStyle = massGradient;
    ctx.beginPath();
    ctx.roundRect(massX - massSize / 2, massY, massSize, massSize, 8);
    ctx.fill();
    ctx.strokeStyle = '#FECDD3';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Nhãn khối lượng m trên quả nặng
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${(params.m * 1000).toFixed(0)}g`, massX, centerY + 4);

    // Vector Vận Tốc v (Mũi tên hồng)
    if (Math.abs(state.v) > 0.5) {
      const vLength = state.v * 1.5;
      const vY = centerY - massSize / 2 - 12;
      ctx.strokeStyle = '#F0398C';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(massX, vY);
      ctx.lineTo(massX + vLength, vY);
      ctx.stroke();

      // Mũi tên v
      const arrowDir = Math.sign(vLength);
      ctx.beginPath();
      ctx.moveTo(massX + vLength, vY);
      ctx.lineTo(massX + vLength - arrowDir * 6, vY - 4);
      ctx.lineTo(massX + vLength - arrowDir * 6, vY + 4);
      ctx.fillStyle = '#F0398C';
      ctx.fill();

      ctx.fillStyle = '#F472B6';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`v`, massX + vLength / 2, vY - 6);
    }

    // Hiển thị tọa độ li độ thực tế
    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Li độ x: ${state.x.toFixed(2)} cm`, 45, 45);
    ctx.fillText(`Vận tốc v: ${state.v.toFixed(2)} cm/s`, 45, 65);
  };

  // 2. Vẽ Máy hiện sóng dao động cuộn theo thời gian (Oscilloscope)
  const drawOscilloscopeCanvas = () => {
    const canvas = osciCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Nền Oscilloscope
    ctx.fillStyle = '#07050e';
    ctx.fillRect(0, 0, w, h);

    // Lưới oscilloscope xanh neon mờ
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Trục thời gian ngang ở giữa
    const midY = h / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    const history = historyRef.current;
    if (history.length < 2) return;

    const dx = w / 250;

    // Kênh 1: Li độ x(t) - Màu Cyan neon
    if (activeChannels.x) {
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(6, 182, 212, 0.8)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const px = i * dx;
        const py = midY - history[i].x * 5; // Scale li độ
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Kênh 2: Vận tốc v(t) - Màu Hồng neon
    if (activeChannels.v) {
      ctx.strokeStyle = '#F0398C';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const px = i * dx;
        const py = midY - (history[i].v / params.omega) * 5; // Chuẩn hóa cùng biên độ
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Kênh 3: Gia tốc a(t) - Màu Vàng neon
    if (activeChannels.a) {
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const px = i * dx;
        const py = midY - (history[i].a / Math.pow(params.omega, 2)) * 5;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  };

  const handleReset = () => {
    timeRef.current = 0;
    historyRef.current = [];
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* 1. MÀN HÌNH MÔ PHỎNG & MÁY HIỆN SÓNG */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Khung Mô Phỏng Con Lắc Lò Xo */}
        <div className="relative h-[250px] rounded-3xl overflow-hidden border border-border-theme shadow-2xl bg-bg-secondary">
          <canvas
            ref={springCanvasRef}
            width={750}
            height={250}
            className="w-full h-full block"
          />
          <div className="absolute top-3 left-4 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Mô Phỏng Vật Lý Con Lắc Lò Xo
            </span>
          </div>

          <div className="absolute top-3 right-4 flex items-center gap-2">
            <button
              onClick={() => onAskAI?.({
                type: 'harmonic',
                params: { ...params, k: autoK },
                state: currentState,
              })}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-accent-pink to-accent-purple text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Giải Thích Dao Động</span>
            </button>
          </div>
        </div>

        {/* Khung Máy Hiện Sóng (Oscilloscope 3 Kênh) */}
        <div className="relative flex-1 min-h-[260px] rounded-3xl overflow-hidden border border-border-theme shadow-2xl bg-bg-secondary">
          <canvas
            ref={osciCanvasRef}
            width={750}
            height={280}
            className="w-full h-full block"
          />

          {/* Điều Khiển Kênh Sóng */}
          <div className="absolute top-3 left-4 flex items-center gap-2 bg-bg-primary/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border-theme text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-cyan-400 font-bold">
              <input
                type="checkbox"
                checked={activeChannels.x}
                onChange={(e) => setActiveChannels(p => ({ ...p, x: e.target.checked }))}
                className="accent-cyan-400"
              />
              <span>x(t) Li độ</span>
            </label>
            <span className="text-text-secondary">|</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-accent-pink font-bold">
              <input
                type="checkbox"
                checked={activeChannels.v}
                onChange={(e) => setActiveChannels(p => ({ ...p, v: e.target.checked }))}
                className="accent-pink-500"
              />
              <span>v(t) Vận tốc</span>
            </label>
            <span className="text-text-secondary">|</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-amber-400 font-bold">
              <input
                type="checkbox"
                checked={activeChannels.a}
                onChange={(e) => setActiveChannels(p => ({ ...p, a: e.target.checked }))}
                className="accent-amber-400"
              />
              <span>a(t) Gia tốc</span>
            </label>
          </div>

          {/* Thanh Nút Phát / Tạm dừng / Tốc độ */}
          <div className="absolute bottom-3 right-4 flex items-center gap-2 bg-bg-primary/90 backdrop-blur-md p-1.5 rounded-2xl border border-border-theme shadow-lg">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-xl bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan hover:text-black transition-all cursor-pointer"
              title={isPlaying ? 'Tạm dừng' : 'Chạy tiếp'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-xl hover:bg-bg-tertiary text-text-secondary transition-colors cursor-pointer"
              title="Đưa về thời điểm t = 0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 text-[11px] font-mono px-2">
              {[0.5, 1, 2].map(speed => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2 py-0.5 rounded-lg cursor-pointer ${
                    playbackSpeed === speed 
                      ? 'bg-accent-pink text-white font-bold' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. BẢNG ĐIỀU KHIỂN VẬT LÝ & BIỂU ĐỒ BẢO TOÀN NĂNG LƯỢNG */}
      <div className="w-full lg:w-[360px] flex flex-col gap-4">
        {/* Biểu đồ Năng Lượng Bảo Toàn (Động Năng & Thế Năng) */}
        {currentState && (
          <div className="p-5 rounded-3xl bg-bg-secondary border border-border-theme space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <span>Bảo Toàn Cơ Năng</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                W = Wđ + Wt
              </span>
            </div>

            {/* Thanh đo Động Năng Wd */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-pink-400 font-bold">Động năng (Wđ):</span>
                <span className="text-pink-300">{(currentState.Wd * 1000).toFixed(2)} mJ</span>
              </div>
              <div className="h-2.5 w-full bg-bg-tertiary rounded-full overflow-hidden border border-border-theme">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, (currentState.Wd / currentState.W) * 100)}%` }}
                />
              </div>
            </div>

            {/* Thanh đo Thế Năng Wt */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-cyan-400 font-bold">Thế năng đàn hồi (Wt):</span>
                <span className="text-cyan-300">{(currentState.Wt * 1000).toFixed(2)} mJ</span>
              </div>
              <div className="h-2.5 w-full bg-bg-tertiary rounded-full overflow-hidden border border-border-theme">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, (currentState.Wt / currentState.W) * 100)}%` }}
                />
              </div>
            </div>

            {/* Tổng Cơ Năng Toàn Phần W */}
            <div className="p-3 rounded-2xl bg-bg-tertiary border border-border-theme flex items-center justify-between text-xs font-mono">
              <span className="text-text-secondary">Cơ năng bảo toàn (W):</span>
              <span className="text-emerald-400 font-bold">{(currentState.W * 1000).toFixed(2)} mJ</span>
            </div>
          </div>
        )}

        {/* Thanh Trượt Tham Số Dao Động */}
        <div className="p-5 rounded-3xl bg-bg-secondary border border-border-theme space-y-4 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent-cyan" />
            <span>Tham Số Con Lắc Lò Xo</span>
          </span>

          <div className="space-y-3.5">
            {/* Biên độ A */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-text-primary">Biên độ (A):</span>
                <span className="text-cyan-400 font-bold">{params.A} cm</span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                step={0.5}
                value={params.A}
                onChange={(e) => setParams(p => ({ ...p, A: Number(e.target.value) }))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Tần số góc omega */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-text-primary">Tần số góc (ω):</span>
                <span className="text-pink-400 font-bold">{params.omega} rad/s</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={5}
                step={0.1}
                value={params.omega}
                onChange={(e) => setParams(p => ({ ...p, omega: Number(e.target.value) }))}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>

            {/* Khối lượng vật nặng m */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-text-primary">Khối lượng (m):</span>
                <span className="text-purple-400 font-bold">{(params.m * 1000).toFixed(0)} g</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.5}
                step={0.05}
                value={params.m}
                onChange={(e) => setParams(p => ({ ...p, m: Number(e.target.value) }))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* Độ cứng lò xo k (Tự động tính) */}
            <div className="p-3 rounded-2xl bg-bg-tertiary border border-border-theme flex items-center justify-between text-xs font-mono">
              <span className="text-text-secondary">Độ cứng k = m·ω²:</span>
              <span className="text-amber-400 font-bold">{autoK} N/m</span>
            </div>

            {/* Chu kỳ T và tần số f */}
            {currentState && (
              <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-bg-tertiary border border-border-theme">
                  <span className="text-[10px] text-text-secondary block">Chu kỳ T</span>
                  <span className="text-text-primary font-bold">{currentState.period.toFixed(2)} s</span>
                </div>
                <div className="p-2.5 rounded-xl bg-bg-tertiary border border-border-theme">
                  <span className="text-[10px] text-text-secondary block">Tần số f</span>
                  <span className="text-text-primary font-bold">{currentState.frequency.toFixed(2)} Hz</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
