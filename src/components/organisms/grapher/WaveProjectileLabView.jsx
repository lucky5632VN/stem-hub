'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  getStandingWavePoint, 
  getTravelingWavePoint, 
  getNodesAndAntinodes, 
  getProjectileTrajectory 
} from '@/lib/grapher/waveSimulationEngine';
import { PLANET_GRAVITY } from '@/lib/grapher/harmonicPhysicsEngine';
import { 
  Play, Pause, RotateCcw, Sparkles, Sliders, 
  Activity, Target, Globe, Compass 
} from 'lucide-react';

export default function WaveProjectileLabView({ onAskAI }) {
  const [subMode, setSubMode] = useState('wave'); // 'wave' | 'projectile'
  const canvasRef = useRef(null);

  // Tham số sóng cơ
  const [waveParams, setWaveParams] = useState({
    A: 25, // Biên độ sóng (pixels)
    lambda: 200, // Bước sóng (pixels)
    f: 1.5, // Tần số (Hz)
    isStanding: true, // Sóng dừng hay sóng chạy
  });

  // Tham số ném xiên
  const [projParams, setProjParams] = useState({
    v0: 35, // Vận tốc đầu m/s
    angleDeg: 45, // Góc ném độ
    y0: 0, // Độ cao ban đầu m
    planetId: 'earth', // Trái Đất
  });

  const [isPlaying, setIsPlaying] = useState(true);
  const timeRef = useRef(0);
  const animFrameRef = useRef(null);

  // Trọng lực hành tinh được chọn
  const currentGravity = PLANET_GRAVITY.find(p => p.id === projParams.planetId) || PLANET_GRAVITY[0];

  // Tính quỹ đạo ném xiên
  const trajectoryData = React.useMemo(() => {
    return getProjectileTrajectory({
      v0: projParams.v0,
      angleDeg: projParams.angleDeg,
      y0: projParams.y0,
      g: currentGravity.g,
    });
  }, [projParams, currentGravity]);

  // Vòng lặp render Canvas
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (timestamp) => {
      const dt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      if (isPlaying) {
        timeRef.current += dt;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        if (subMode === 'wave') {
          drawWaveMode(ctx, w, h, timeRef.current);
        } else {
          drawProjectileMode(ctx, w, h, timeRef.current);
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [subMode, waveParams, projParams, currentGravity, trajectoryData, isPlaying]);

  // 1. Vẽ Mô phỏng Sóng cơ / Sóng dừng
  const drawWaveMode = (ctx, w, h, t) => {
    // Nền
    ctx.fillStyle = '#080512';
    ctx.fillRect(0, 0, w, h);

    const centerY = h / 2;
    const wireLength = w - 120;
    const startX = 60;
    const endX = startX + wireLength;

    // Trục dây cân bằng
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(startX, centerY);
    ctx.lineTo(endX, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Hai giá đỡ cố định ở 2 đầu
    ctx.fillStyle = '#6366F1';
    ctx.fillRect(startX - 10, centerY - 50, 10, 100);
    ctx.fillRect(endX, centerY - 50, 10, 100);

    // Tính các nút sóng và bụng sóng
    const { nodes, antinodes } = getNodesAndAntinodes(wireLength, waveParams.lambda);

    // Vẽ bao sóng biên độ cực đại (Envelope) nếu là sóng dừng
    if (waveParams.isStanding) {
      ctx.strokeStyle = 'rgba(240, 57, 140, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let px = 0; px <= wireLength; px += 4) {
        const k = (2 * Math.PI) / waveParams.lambda;
        const envY = 2 * waveParams.A * Math.abs(Math.sin(k * px));
        if (px === 0) ctx.moveTo(startX + px, centerY - envY);
        else ctx.lineTo(startX + px, centerY - envY);
      }
      ctx.stroke();

      ctx.beginPath();
      for (let px = 0; px <= wireLength; px += 4) {
        const k = (2 * Math.PI) / waveParams.lambda;
        const envY = 2 * waveParams.A * Math.abs(Math.sin(k * px));
        if (px === 0) ctx.moveTo(startX + px, centerY + envY);
        else ctx.lineTo(startX + px, centerY + envY);
      }
      ctx.stroke();
    }

    // Vẽ sợi dây sóng chuyển động thực tế
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = 'rgba(6, 182, 212, 0.9)';
    ctx.shadowBlur = 10;
    ctx.beginPath();

    for (let px = 0; px <= wireLength; px += 2) {
      let u = 0;
      if (waveParams.isStanding) {
        u = getStandingWavePoint({
          A: waveParams.A,
          lambda: waveParams.lambda,
          f: waveParams.f,
          x: px,
          t,
        });
      } else {
        u = getTravelingWavePoint({
          A: waveParams.A * 1.5,
          lambda: waveParams.lambda,
          f: waveParams.f,
          phi: 0,
          x: px,
          t,
        });
      }

      const screenX = startX + px;
      const screenY = centerY - u;
      if (px === 0) ctx.moveTo(screenX, screenY);
      else ctx.lineTo(screenX, screenY);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Đánh dấu Nút Sóng (Màu Đỏ) và Bụng Sóng (Màu Vàng)
    if (waveParams.isStanding) {
      nodes.forEach((nodeX) => {
        if (nodeX <= wireLength) {
          ctx.beginPath();
          ctx.arc(startX + nodeX, centerY, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#EF4444';
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      antinodes.forEach((antiX) => {
        if (antiX <= wireLength) {
          ctx.beginPath();
          ctx.arc(startX + antiX, centerY, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#F59E0B';
          ctx.fill();
        }
      });
    }

    // Chú thích
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`• Nút sóng (Đỏ): Li độ triệt tiêu u = 0`, 60, h - 35);
    ctx.fillText(`• Bụng sóng (Vàng): Biên độ dao động cực đại 2A`, 60, h - 18);
  };

  // 2. Vẽ Chuyển Động Ném Xiên
  const drawProjectileMode = (ctx, w, h, t) => {
    // Nền
    ctx.fillStyle = '#080512';
    ctx.fillRect(0, 0, w, h);

    const originX = 80;
    const originY = h - 70;

    // Mặt đất
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, originY);
    ctx.lineTo(w - 30, originY);
    ctx.stroke();

    // Tỉ lệ scale mét -> pixel
    const maxRange = Math.max(10, trajectoryData.xMax);
    const scale = (w - 180) / Math.max(80, maxRange);

    // Vẽ quỹ đạo Parabol (Đường đứt nét)
    ctx.strokeStyle = 'rgba(240, 57, 140, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    trajectoryData.points.forEach((pt, idx) => {
      const sx = originX + pt.x * scale;
      const sy = originY - pt.y * scale;
      if (idx === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Điểm cao nhất H_max
    const peakX = originX + (trajectoryData.vx * trajectoryData.tPeak) * scale;
    const peakY = originY - trajectoryData.hMax * scale;
    ctx.beginPath();
    ctx.arc(peakX, peakY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();
    ctx.fillStyle = '#FDE68A';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Hmax = ${trajectoryData.hMax.toFixed(1)}m`, peakX, peakY - 10);

    // Điểm chạm đất Tầm xa L_max
    const landX = originX + trajectoryData.xMax * scale;
    ctx.beginPath();
    ctx.arc(landX, originY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#10B981';
    ctx.fill();
    ctx.fillStyle = '#A7F3D0';
    ctx.fillText(`Lmax = ${trajectoryData.xMax.toFixed(1)}m`, landX, originY + 20);

    // Vị trí viên đạn bay theo thời gian thực (lặp chu kỳ tFlight)
    const curFlightT = t % (trajectoryData.tFlight + 0.8);
    if (curFlightT <= trajectoryData.tFlight) {
      const bX = trajectoryData.vx * curFlightT;
      const bY = projParams.y0 + trajectoryData.vy * curFlightT - 0.5 * currentGravity.g * Math.pow(curFlightT, 2);
      const sbX = originX + bX * scale;
      const sbY = originY - Math.max(0, bY) * scale;

      // Viên đạn phát sáng
      ctx.beginPath();
      ctx.arc(sbX, sbY, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#06B6D4';
      ctx.shadowColor = 'rgba(6, 182, 212, 1)';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Giá pháo nòng bắn tại gốc O
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(originX, originY, 14, 0, Math.PI * 2);
    ctx.fill();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* 1. KHUNG CANVAS MÔ PHỎNG */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Thanh chuyển chế độ Sóng cơ / Ném xiên */}
        <div className="flex items-center justify-between bg-bg-secondary p-2 rounded-2xl border border-border-theme">
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setSubMode('wave'); timeRef.current = 0; }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subMode === 'wave'
                  ? 'bg-accent-cyan text-black shadow-lg shadow-accent-cyan/20'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Mô Phỏng Sóng Cơ & Sóng Dừng
            </button>
            <button
              onClick={() => { setSubMode('projectile'); timeRef.current = 0; }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subMode === 'projectile'
                  ? 'bg-accent-pink text-white shadow-lg shadow-accent-pink/20'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Chuyển Động Ném Xiên Vật Lý
            </button>
          </div>

          <button
            onClick={() => onAskAI?.({
              type: subMode,
              details: subMode === 'wave' ? waveParams : { ...projParams, gravity: currentGravity, result: trajectoryData },
            })}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-accent-pink to-accent-purple text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Giải Thích Hiện Tượng</span>
          </button>
        </div>

        {/* Khung Canvas Trực Quan */}
        <div className="relative flex-1 min-h-[440px] rounded-3xl overflow-hidden border border-border-theme shadow-2xl bg-bg-secondary">
          <canvas
            ref={canvasRef}
            width={800}
            height={460}
            className="w-full h-full block"
          />

          {/* Điều khiển Play/Pause */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-bg-primary/90 backdrop-blur-md p-1.5 rounded-2xl border border-border-theme shadow-lg">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-xl bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan hover:text-black transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => { timeRef.current = 0; }}
              className="p-2 rounded-xl hover:bg-bg-tertiary text-text-secondary transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. BẢNG ĐIỀU KHIỂN THAM SỐ (SIDE PANEL) */}
      <div className="w-full lg:w-[360px] flex flex-col gap-4">
        {subMode === 'wave' ? (
          /* Tham Số Sóng Cơ */
          <div className="p-5 rounded-3xl bg-bg-secondary border border-border-theme space-y-4 shadow-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent-cyan" />
              <span>Tham Số Sóng Cơ Học</span>
            </span>

            {/* Kiểu sóng: Sóng dừng hay sóng chạy */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-bg-tertiary rounded-2xl border border-border-theme">
              <button
                onClick={() => setWaveParams(p => ({ ...p, isStanding: true }))}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  waveParams.isStanding ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-text-secondary'
                }`}
              >
                Sóng Dừng
              </button>
              <button
                onClick={() => setWaveParams(p => ({ ...p, isStanding: false }))}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !waveParams.isStanding ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-text-secondary'
                }`}
              >
                Sóng Chạy
              </button>
            </div>

            {/* Bước sóng lambda */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-text-primary">Bước sóng (λ):</span>
                <span className="text-cyan-400 font-bold">{waveParams.lambda} px</span>
              </div>
              <input
                type="range"
                min={100}
                max={400}
                step={20}
                value={waveParams.lambda}
                onChange={(e) => setWaveParams(p => ({ ...p, lambda: Number(e.target.value) }))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Tần số f */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-text-primary">Tần số (f):</span>
                <span className="text-pink-400 font-bold">{waveParams.f} Hz</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={4}
                step={0.1}
                value={waveParams.f}
                onChange={(e) => setWaveParams(p => ({ ...p, f: Number(e.target.value) }))}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>

            {/* Biên độ A */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-text-primary">Biên độ (A):</span>
                <span className="text-amber-400 font-bold">{waveParams.A} px</span>
              </div>
              <input
                type="range"
                min={10}
                max={45}
                step={5}
                value={waveParams.A}
                onChange={(e) => setWaveParams(p => ({ ...p, A: Number(e.target.value) }))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Tốc độ truyền sóng v = lambda * f */}
            <div className="p-3.5 rounded-2xl bg-bg-tertiary border border-border-theme flex items-center justify-between text-xs font-mono">
              <span className="text-text-secondary">Tốc độ sóng v = λ·f:</span>
              <span className="text-emerald-400 font-bold">{(waveParams.lambda * waveParams.f).toFixed(0)} px/s</span>
            </div>
          </div>
        ) : (
          /* Tham Số Ném Xiên */
          <div className="p-5 rounded-3xl bg-bg-secondary border border-border-theme space-y-4 shadow-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
              <Target className="w-4 h-4 text-accent-pink" />
              <span>Tham Số Ném Xiên</span>
            </span>

            {/* Trọng trường hành tinh */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-secondary flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Trọng Trường Hành Tinh</span>
              </label>
              <select
                value={projParams.planetId}
                onChange={(e) => setProjParams(p => ({ ...p, planetId: e.target.value }))}
                className="w-full bg-bg-tertiary text-text-primary text-xs font-semibold rounded-2xl px-4 py-2.5 border border-border-theme focus:outline-none focus:border-accent-pink cursor-pointer"
              >
                {PLANET_GRAVITY.map(pl => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name} ({pl.desc})
                  </option>
                ))}
              </select>
            </div>

            {/* Vận tốc đầu v0 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-text-primary">Vận tốc ban đầu (v₀):</span>
                <span className="text-cyan-400 font-bold">{projParams.v0} m/s</span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                step={2}
                value={projParams.v0}
                onChange={(e) => setProjParams(p => ({ ...p, v0: Number(e.target.value) }))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Góc ném alpha */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-text-primary">Góc ném (α):</span>
                <span className="text-pink-400 font-bold">{projParams.angleDeg}°</span>
              </div>
              <input
                type="range"
                min={15}
                max={85}
                step={5}
                value={projParams.angleDeg}
                onChange={(e) => setProjParams(p => ({ ...p, angleDeg: Number(e.target.value) }))}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>

            {/* Bảng kết quả giải tích ném xiên */}
            <div className="p-3.5 rounded-2xl bg-bg-tertiary border border-border-theme space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-text-secondary">Độ cao cực đại (Hmax):</span>
                <span className="text-amber-400 font-bold">{trajectoryData.hMax.toFixed(2)} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Tầm xa (Lmax):</span>
                <span className="text-emerald-400 font-bold">{trajectoryData.xMax.toFixed(2)} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Thời gian bay (T):</span>
                <span className="text-cyan-400 font-bold">{trajectoryData.tFlight.toFixed(2)} s</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
