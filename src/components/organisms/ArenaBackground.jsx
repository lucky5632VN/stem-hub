'use client';

import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTheme } from 'next-themes';
import * as THREE from 'three';

/* ============================================================================
 * 1. MODULE TOÁN HỌC (MATH - DESCARTES VECTOR VOID)
 * Technology: @react-three/fiber (Three.js 3D Endless Grid)
 * ============================================================================ */
function MathGridScene({ isDark }) {
  return null;
}

function MathBackground({ isDark }) {
  return (
    <div className="absolute inset-0 w-full h-full bg-bg-primary" />
  );
}

/* ============================================================================
 * 2. MÔN VẬT LÝ (PHYSICS - LASER REFRACTION & WAVE MECHANICS)
 * Technology: HTML5 Canvas 2D
 * ============================================================================ */
function PhysicsBackground({ isDark }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Cấu hình 6 tia Laser với góc khúc xạ ngẫu nhiên
    const lasers = Array.from({ length: 6 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      bendAngle: (Math.random() - 0.5) * 0.4,
      length: 200 + Math.random() * 300
    }));

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      const mainColor = isDark ? 'rgba(16, 185, 129, ' : 'rgba(94, 234, 212, ';
      const waveColor = isDark ? 'rgba(6, 182, 212, 0.25)' : 'rgba(13, 148, 136, 0.15)';

      // 1. Vẽ các sóng hình sin (Sine Waves)
      ctx.beginPath();
      ctx.lineWidth = isDark ? 1.5 : 1;
      ctx.strokeStyle = waveColor;
      for (let x = 0; x < width; x += 5) {
        const y1 = height * 0.4 + Math.sin(x * 0.008 + time) * 35;
        const y2 = height * 0.6 + Math.sin(x * 0.012 - time * 0.8) * 45;
        if (x === 0) {
          ctx.moveTo(x, y1);
        } else {
          ctx.lineTo(x, y1);
          ctx.lineTo(x, y2);
        }
      }
      ctx.stroke();

      // 2. Vẽ các tia Laser bị khúc xạ
      lasers.forEach((laser) => {
        laser.x += laser.vx;
        laser.y += laser.vy;

        if (laser.x < 0 || laser.x > width) laser.vx *= -1;
        if (laser.y < 0 || laser.y > height) laser.vy *= -1;

        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = isDark ? 2 : 1.2;
        ctx.strokeStyle = `${mainColor}${isDark ? 0.7 : 0.4})`;

        if (isDark) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#10b981';
        }

        // Đoạn laser chính
        ctx.moveTo(laser.x, laser.y);
        const midX = laser.x + Math.cos(time) * laser.length * 0.5;
        const midY = laser.y + Math.sin(time) * laser.length * 0.5;
        ctx.lineTo(midX, midY);

        // Khúc xạ gãy góc
        const endX = midX + Math.cos(time + laser.bendAngle) * (laser.length * 0.5);
        const endY = midY + Math.sin(time + laser.bendAngle) * (laser.length * 0.5);
        ctx.lineTo(endX, endY);

        ctx.stroke();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

/* ============================================================================
 * 3. MÔN HÓA HỌC (CHEMISTRY - QUANTUM REACTOR BUBBLES)
 * Technology: HTML5 Canvas 2D
 * ============================================================================ */
function ChemistryBackground({ isDark }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Khởi tạo 120 bọt khí phản ứng hóa học
    const bubbles = Array.from({ length: 110 }, () => ({
      x: Math.random() * width,
      y: height + Math.random() * 200,
      radius: Math.random() * 12 + 4,
      speed: Math.random() * 1.2 + 0.5,
      wobbleSpeed: Math.random() * 0.03 + 0.01,
      wobbleAmp: Math.random() * 25 + 5,
      opacity: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.5 ? 'cyan' : 'orange'
    }));

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      bubbles.forEach((b) => {
        b.y -= b.speed;
        b.x += Math.sin(time * b.wobbleSpeed + b.radius) * 0.6;

        if (b.y < -30) {
          b.y = height + 30;
          b.x = Math.random() * width;
        }

        ctx.save();
        ctx.beginPath();
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);

        if (isDark) {
          ctx.shadowBlur = 10;
          if (b.color === 'cyan') {
            grad.addColorStop(0, 'rgba(6, 182, 212, 0.8)');
            grad.addColorStop(1, 'rgba(6, 182, 212, 0.05)');
            ctx.shadowColor = '#06b6d4';
          } else {
            grad.addColorStop(0, 'rgba(249, 115, 22, 0.8)');
            grad.addColorStop(1, 'rgba(249, 115, 22, 0.05)');
            ctx.shadowColor = '#f97316';
          }
        } else {
          if (b.color === 'cyan') {
            grad.addColorStop(0, 'rgba(207, 250, 254, 0.35)');
            grad.addColorStop(1, 'rgba(165, 243, 252, 0.05)');
          } else {
            grad.addColorStop(0, 'rgba(255, 237, 213, 0.35)');
            grad.addColorStop(1, 'rgba(254, 215, 170, 0.05)');
          }
        }

        ctx.fillStyle = grad;
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

/* ============================================================================
 * 4. MÔN SINH HỌC (BIOLOGY - ROTATING DNA HELIX 3D)
 * Technology: @react-three/fiber (Three.js 3D DNA Helix)
 * ============================================================================ */
function DnaHelixScene({ isDark }) {
  const helixRef = useRef();

  // Tạo chuỗi DNA 24 cặp nấc thang
  const count = 24;
  const radius = 1.4;
  const heightStep = 0.35;

  const spheresData = useMemo(() => {
    const nodes = [];
    for (let i = 0; i < count; i++) {
      const angle = i * 0.35;
      const y = (i - count / 2) * heightStep;
      
      const x1 = Math.cos(angle) * radius;
      const z1 = Math.sin(angle) * radius;

      const x2 = Math.cos(angle + Math.PI) * radius;
      const z2 = Math.sin(angle + Math.PI) * radius;

      nodes.push({ id: i, p1: [x1, y, z1], p2: [x2, y, z2] });
    }
    return nodes;
  }, [count, radius, heightStep]);

  useFrame((state, delta) => {
    if (helixRef.current) {
      helixRef.current.rotation.y += delta * 0.4;
    }
  });

  const nodeColor = isDark ? '#f59e0b' : '#fbbf24';
  const strandColor = isDark ? '#ec4899' : '#f472b6';

  return (
    <group ref={helixRef} position={[3.2, 0, 0]} rotation={[0.2, 0, 0.15]}>
      {spheresData.map((node) => (
        <group key={node.id}>
          {/* Hạt đầu 1 */}
          <mesh position={node.p1}>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshStandardMaterial
              color={nodeColor}
              emissive={isDark ? nodeColor : '#000000'}
              emissiveIntensity={isDark ? 0.6 : 0}
              roughness={0.2}
            />
          </mesh>

          {/* Hạt đầu 2 */}
          <mesh position={node.p2}>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshStandardMaterial
              color={strandColor}
              emissive={isDark ? strandColor : '#000000'}
              emissiveIntensity={isDark ? 0.6 : 0}
              roughness={0.2}
            />
          </mesh>

          {/* Ống nối nấc thang DNA */}
          <line>
            <bufferGeometry
              attach="geometry"
              onUpdate={(geo) =>
                geo.setFromPoints([
                  new THREE.Vector3(...node.p1),
                  new THREE.Vector3(...node.p2)
                ])
              }
            />
            <lineBasicMaterial
              attach="material"
              color={isDark ? '#fbbf24' : '#cbd5e1'}
              transparent
              opacity={isDark ? 0.5 : 0.3}
              linewidth={1.5}
            />
          </line>
        </group>
      ))}
    </group>
  );
}

function BiologyBackground({ isDark }) {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 9], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={isDark ? 0.8 : 1.2} />
        <pointLight position={[10, 10, 10]} intensity={isDark ? 1.5 : 0.8} />
        <DnaHelixScene isDark={isDark} />
      </Canvas>
    </div>
  );
}

/* ============================================================================
 * MAIN COMPONENT: ArenaBackground
 * Props:
 *  - subject: 'math' | 'physics' | 'chemistry' | 'biology'
 *  - theme: 'dark' | 'light'
 * ============================================================================ */
export default function ArenaBackground({ subject = 'math', theme }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = theme || (mounted ? resolvedTheme : 'light');
  const isDark = activeTheme === 'dark';

  const renderSubjectBackground = () => {
    switch (subject) {
      case 'math':
        return <MathBackground isDark={isDark} />;
      case 'physics':
        return <PhysicsBackground isDark={isDark} />;
      case 'chemistry':
        return <ChemistryBackground isDark={isDark} />;
      case 'biology':
        return <BiologyBackground isDark={isDark} />;
      default:
        return <MathBackground isDark={isDark} />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none transition-colors duration-500 bg-bg-primary"
    >
      {renderSubjectBackground()}
    </div>
  );
}
