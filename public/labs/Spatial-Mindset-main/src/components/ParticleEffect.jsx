import React, { useEffect, useRef } from 'react';

// =====================
// Simple canvas confetti / particle effect
// =====================
export default function ParticleEffect({ trigger, x, y }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Resize to window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Origin: center or passed coordinates
    const ox = x ?? window.innerWidth / 2;
    const oy = y ?? window.innerHeight / 2;

    // Create particles
    const COLORS = [
      '#22d3ee', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#fb923c', '#ffffff'
    ];
    const particles = Array.from({ length: 80 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      return {
        x: ox, y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        alpha: 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 3 + Math.random() * 5,
        decay: 0.012 + Math.random() * 0.01,
        gravity: 0.18 + Math.random() * 0.1,
        spin: (Math.random() - 0.5) * 0.3,
        rotation: Math.random() * Math.PI * 2,
        isSquare: Math.random() > 0.5,
      };
    });

    let alive = true;

    const draw = () => {
      if (!alive) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let anyAlive = false;
      particles.forEach(p => {
        if (p.alpha <= 0) return;
        anyAlive = true;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.alpha -= p.decay;
        p.rotation += p.spin;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.isSquare) {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      if (anyAlive) {
        animRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      alive = false;
      cancelAnimationFrame(animRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [trigger, x, y]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[300]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
