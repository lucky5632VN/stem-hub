'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

export default function CustomCursor() {
  const cursorType = useAppStore((state) => state.cursorType);
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -100, y: -100 });
  const cursorRef = useRef({ x: -100, y: -100 });
  const particlesRef = useRef([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    // Ẩn con trỏ chuột mặc định nếu dùng con trỏ tùy biến
    if (cursorType !== 'default') {
      document.documentElement.style.cursor = 'none';
      const styles = document.createElement('style');
      styles.id = 'custom-cursor-none';
      styles.innerHTML = `* { cursor: none !important; }`;
      document.head.appendChild(styles);
    } else {
      document.documentElement.style.cursor = 'auto';
      const styles = document.getElementById('custom-cursor-none');
      if (styles) styles.remove();
    }

    return () => {
      document.documentElement.style.cursor = 'auto';
      const styles = document.getElementById('custom-cursor-none');
      if (styles) styles.remove();
    };
  }, [cursorType, mounted]);

  useEffect(() => {
    if (!mounted || cursorType === 'default') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track mouse coordinates
    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

      // Spawn movement particles
      if (Math.random() < 0.3) {
        createParticle(e.clientX, e.clientY, false);
      }
    };

    const handleMouseDown = (e) => {
      // Spawn burst of particles on click
      for (let i = 0; i < 15; i++) {
        createParticle(e.clientX, e.clientY, true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);

    // Particle factory
    const createParticle = (x, y, isBurst) => {
      const colors = {
        neon: ['#ec4899', '#f43f5e', '#a855f7', '#3b82f6'],
        target: ['#10b981', '#34d399', '#06b6d4', '#60a5fa']
      };

      const themeColors = colors[cursorType] || colors['neon'];
      const color = themeColors[Math.floor(Math.random() * themeColors.length)];

      const angle = Math.random() * Math.PI * 2;
      const speed = isBurst ? Math.random() * 3 + 1 : Math.random() * 0.8 + 0.2;

      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isBurst ? 0.5 : 0.2), // Trôi ngược lên trên nhẹ
        size: isBurst ? Math.random() * 4 + 2 : Math.random() * 2 + 1,
        color,
        alpha: 1,
        life: 0,
        maxLife: isBurst ? Math.random() * 30 + 20 : Math.random() * 20 + 10
      });
    };

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mouse = mouseRef.current;
      const cursor = cursorRef.current;

      // Smooth interpolation for the trailing ring
      cursor.x += (mouse.x - cursor.x) * 0.15;
      cursor.y += (mouse.y - cursor.y) * 0.15;

      // 1. Draw particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = 1 - (p.life / p.maxLife);

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        // Disabled shadowBlur/shadowColor to prevent severe canvas performance degradation
        // ctx.shadowBlur = 8;
        // ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. Draw Ring Cursor
      if (mouse.x > -10 && mouse.y > -10) {
        ctx.save();
        const primaryColor = cursorType === 'neon' ? '#ec4899' : '#10b981';

        // Outer Glow Circle - Disabled shadowBlur/shadowColor for high performance
        // ctx.shadowBlur = 15;
        // ctx.shadowColor = primaryColor;
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2;

        if (cursorType === 'neon') {
          // Circular pointer
          ctx.beginPath();
          ctx.arc(cursor.x, cursor.y, 8, 0, Math.PI * 2);
          ctx.stroke();

          // Outer lagging ring
          ctx.beginPath();
          ctx.arc(cursor.x, cursor.y, 16, 0, Math.PI * 2);
          ctx.strokeStyle = `${primaryColor}40`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Central Dot
          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (cursorType === 'target') {
          // Crosshair / Target pointer
          ctx.beginPath();
          ctx.arc(cursor.x, cursor.y, 10, 0, Math.PI * 2);
          ctx.stroke();

          // Draw crosshairs
          ctx.beginPath();
          ctx.moveTo(cursor.x - 14, cursor.y);
          ctx.lineTo(cursor.x - 6, cursor.y);
          ctx.moveTo(cursor.x + 6, cursor.y);
          ctx.lineTo(cursor.x + 14, cursor.y);
          ctx.moveTo(cursor.x, cursor.y - 14);
          ctx.lineTo(cursor.x, cursor.y - 6);
          ctx.moveTo(cursor.x, cursor.y + 6);
          ctx.lineTo(cursor.x, cursor.y + 14);
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Central Dot
          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [cursorType, mounted]);

  if (!mounted || cursorType === 'default') return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[99999]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
