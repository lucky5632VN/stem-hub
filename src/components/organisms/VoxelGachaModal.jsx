'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  Flame, 
  X, 
  RotateCcw, 
  Check, 
  Shield, 
  Crown, 
  Layers, 
  ArrowRight, 
  Volume2, 
  VolumeX,
  Palette,
  Eye,
  Award,
  ChevronRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import CrystalIcon from '@/components/atoms/CrystalIcon';
import { useRouter } from 'next/navigation';

import { 
  VOXEL_GACHA_POOL, 
  voxelAudio, 
  rollVoxelGacha, 
  GACHA_CONSTANTS 
} from '@/lib/voxelGachaEngine';

export { VOXEL_GACHA_POOL, voxelAudio, rollVoxelGacha, GACHA_CONSTANTS };

// =========================================================================
// 3. CANVAS TEXTURE SYNTHESIZER CHO VOXEL LUCKY BLOCK
// =========================================================================
function createLuckyBlockFaceCanvas(crackAmount = 0) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. Nền vàng khối Lucky Block Minecraft (Gold Voxel)
  ctx.fillStyle = '#ffb300';
  ctx.fillRect(0, 0, 64, 64);

  // Hiệu ứng pixel checkerboard nhẹ
  ctx.fillStyle = '#ffc107';
  for (let x = 0; x < 64; x += 8) {
    for (let y = 0; y < 64; y += 8) {
      if ((x + y) % 16 === 0) {
        ctx.fillRect(x, y, 8, 8);
      }
    }
  }

  // Viền khung kim loại vàng sẫm
  ctx.fillStyle = '#b27b00';
  ctx.fillRect(0, 0, 64, 4);
  ctx.fillRect(0, 60, 64, 4);
  ctx.fillRect(0, 0, 4, 64);
  ctx.fillRect(60, 0, 4, 64);

  // Viền vát bóng sáng bên trong
  ctx.fillStyle = '#ffe082';
  ctx.fillRect(4, 4, 56, 2);
  ctx.fillRect(4, 4, 2, 56);
  ctx.fillStyle = '#d39e00';
  ctx.fillRect(4, 58, 56, 2);
  ctx.fillRect(58, 4, 2, 56);

  // 4 Ốc vít / Tán đinh góc
  const rivets = [[6, 6], [50, 6], [6, 50], [50, 50]];
  rivets.forEach(([rx, ry]) => {
    ctx.fillStyle = '#ffe57f';
    ctx.fillRect(rx, ry, 6, 6);
    ctx.fillStyle = '#6d4c00';
    ctx.fillRect(rx + 2, ry + 2, 2, 2);
  });

  // 2. Dấu hỏi "?" Pixel Minecraft đặc trưng
  // Đổ bóng nâu sẫm
  ctx.fillStyle = '#5d4037';
  drawPixelQuestionMark(ctx, 23, 15);
  // Mặt trắng tinh khôi
  ctx.fillStyle = '#ffffff';
  drawPixelQuestionMark(ctx, 21, 13);

  // 3. Vết nứt lượng tử khi tích tụ năng lượng (Cracks visual effects)
  if (crackAmount > 0) {
    ctx.save();
    ctx.strokeStyle = crackAmount > 0.6 ? '#00f0ff' : '#ffeb3b';
    ctx.lineWidth = crackAmount > 0.6 ? 2.5 : 1.5;
    ctx.shadowColor = crackAmount > 0.6 ? '#00f0ff' : '#ff9800';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    // Nứt từ tâm lan ra 4 góc
    ctx.moveTo(32, 32);
    ctx.lineTo(24, 22);
    ctx.lineTo(12, 16);

    ctx.moveTo(32, 32);
    ctx.lineTo(40, 26);
    ctx.lineTo(54, 18);

    ctx.moveTo(32, 32);
    ctx.lineTo(26, 44);
    ctx.lineTo(14, 52);

    ctx.moveTo(32, 32);
    ctx.lineTo(42, 42);
    ctx.lineTo(52, 50);

    if (crackAmount > 0.5) {
      ctx.moveTo(32, 32);
      ctx.lineTo(32, 8);
      ctx.moveTo(32, 32);
      ctx.lineTo(32, 56);
      ctx.moveTo(32, 32);
      ctx.lineTo(8, 32);
      ctx.moveTo(32, 32);
      ctx.lineTo(56, 32);
    }
    ctx.stroke();
    ctx.restore();
  }

  return canvas;
}

function drawPixelQuestionMark(ctx, ox, oy) {
  // Thanh ngang trên
  ctx.fillRect(ox + 4, oy, 14, 4);
  // Cạnh phải cong
  ctx.fillRect(ox + 14, oy + 4, 4, 6);
  // Thanh gập giữa
  ctx.fillRect(ox + 8, oy + 10, 8, 4);
  // Cột đứng
  ctx.fillRect(ox + 8, oy + 14, 4, 6);
  // Dấu chấm vuông dưới
  ctx.fillRect(ox + 8, oy + 24, 4, 4);
}

// =========================================================================
// 4. LUCKY BLOCK 3D CANVAS COMPONENT (THREE.JS ENGINE)
// =========================================================================
function LuckyBlock3DScene({
  stage,
  frequency,
  onBlockTap,
  isCharging,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const blockMeshRef = useRef(null);
  const sparkParticlesRef = useRef(null);
  const arcLinesRef = useRef(null);
  const innerCoreLightRef = useRef(null);
  const shatterGroupRef = useRef(null);
  const lightRaysRef = useRef(null);
  const animFrameRef = useRef(null);

  // Khởi tạo Scene Three.js
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 360;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.8);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xfff5e6, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(4, 6, 5);
    scene.add(dirLight);

    const goldPointLight = new THREE.PointLight(0xffc107, 3.5, 12);
    goldPointLight.position.set(0, 2, 3);
    scene.add(goldPointLight);

    // Đèn phát quang từ lõi bên trong khối
    const innerLight = new THREE.PointLight(0x00f0ff, 1.0, 10);
    innerLight.position.set(0, 0, 0);
    scene.add(innerLight);
    innerCoreLightRef.current = innerLight;

    // 4. Tạo Texture & Khối Lucky Block
    const initialCanvas = createLuckyBlockFaceCanvas(0);
    const texture = initialCanvas ? new THREE.CanvasTexture(initialCanvas) : new THREE.Texture();
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    const boxGeo = new THREE.BoxGeometry(1.9, 1.9, 1.9);
    const boxMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.28,
      metalness: 0.65,
      emissive: new THREE.Color(0x332200),
      emissiveIntensity: 0.4
    });

    const blockMesh = new THREE.Mesh(boxGeo, boxMat);
    scene.add(blockMesh);
    blockMeshRef.current = blockMesh;

    // 5. Hệ thống tia lửa điện quay quanh (Sparks particles)
    const sparkCount = 45;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocities = [];

    for (let i = 0; i < sparkCount; i++) {
      const radius = 1.4 + Math.random() * 1.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      sparkPositions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      sparkPositions[i * 3 + 1] = radius * Math.sin(phi);
      sparkPositions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      sparkVelocities.push({
        radius,
        theta,
        phi,
        speedTheta: (Math.random() - 0.5) * 0.04,
        speedPhi: (Math.random() - 0.5) * 0.03
      });
    }

    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.09,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    sparks.userData = { velocities: sparkVelocities };
    scene.add(sparks);
    sparkParticlesRef.current = sparks;

    // 6. Tia sét hồ quang điện (Electric Arc Lines)
    const arcGeo = new THREE.BufferGeometry();
    const arcPositions = new Float32Array(18 * 3);
    arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPositions, 3));
    const arcMat = new THREE.LineBasicMaterial({
      color: 0x70ffff,
      linewidth: 2,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const arcLines = new THREE.LineSegments(arcGeo, arcMat);
    scene.add(arcLines);
    arcLinesRef.current = arcLines;

    // 7. Nhóm khối Voxel vỡ vụn (Shatter Voxel Cubes Group) - 64 mảnh (4x4x4)
    const shatterGroup = new THREE.Group();
    shatterGroup.visible = false;
    scene.add(shatterGroup);
    shatterGroupRef.current = shatterGroup;

    const miniGeo = new THREE.BoxGeometry(0.38, 0.38, 0.38);
    const miniMatGold = new THREE.MeshStandardMaterial({
      color: 0xffb300,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0xffa000,
      emissiveIntensity: 0.5
    });
    const miniMatCyan = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x00b4d8,
      emissiveIntensity: 0.8
    });

    for (let x = -1.5; x <= 1.5; x++) {
      for (let y = -1.5; y <= 1.5; y++) {
        for (let z = -1.5; z <= 1.5; z++) {
          const isCore = Math.abs(x) < 1 && Math.abs(y) < 1 && Math.abs(z) < 1;
          const miniMesh = new THREE.Mesh(miniGeo, isCore ? miniMatCyan : miniMatGold);
          miniMesh.position.set(x * 0.42, y * 0.42, z * 0.42);

          // Vector vận tốc nổ theo hướng xuyên tâm
          const dir = new THREE.Vector3(x, y, z).normalize();
          if (dir.length() === 0) dir.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
          const speed = 0.08 + Math.random() * 0.14;

          miniMesh.userData = {
            initPos: miniMesh.position.clone(),
            vel: dir.multiplyScalar(speed),
            rotSpeed: new THREE.Vector3(
              (Math.random() - 0.5) * 0.3,
              (Math.random() - 0.5) * 0.3,
              (Math.random() - 0.5) * 0.3
            )
          };
          shatterGroup.add(miniMesh);
        }
      }
    }

    // 8. Chùm tia sáng xuyên phá (Volumetric Light Rays)
    const rayGroup = new THREE.Group();
    rayGroup.visible = false;
    scene.add(rayGroup);
    lightRaysRef.current = rayGroup;

    for (let r = 0; r < 16; r++) {
      const rayGeo = new THREE.CylinderGeometry(0.01, 0.4, 6.5, 6, 1, true);
      const rayMat = new THREE.MeshBasicMaterial({
        color: r % 2 === 0 ? 0xffea00 : 0x00f0ff,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
      const ray = new THREE.Mesh(rayGeo, rayMat);
      ray.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      rayGroup.add(ray);
    }

    // 9. Vòng lặp Render (Animation Loop)
    let lastTime = performance.now();
    const startTime = performance.now();

    const animate = (now = performance.now()) => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const time = (now - startTime) / 1000;

      // Cập nhật tia lửa điện quay quanh
      if (sparkParticlesRef.current) {
        const pSparks = sparkParticlesRef.current;
        const posAttr = pSparks.geometry.attributes.position;
        const velocities = pSparks.userData.velocities;

        for (let i = 0; i < sparkCount; i++) {
          const v = velocities[i];
          v.theta += v.speedTheta * 1.5;
          v.phi += v.speedPhi * 1.5;

          posAttr.array[i * 3] = v.radius * Math.cos(v.theta) * Math.cos(v.phi);
          posAttr.array[i * 3 + 1] = v.radius * Math.sin(v.phi);
          posAttr.array[i * 3 + 2] = v.radius * Math.sin(v.theta) * Math.cos(v.phi);
        }
        posAttr.needsUpdate = true;
      }

      // Hồ quang điện giật ngẫu nhiên
      if (arcLinesRef.current && Math.random() < 0.25) {
        const arcPosAttr = arcLinesRef.current.geometry.attributes.position;
        for (let j = 0; j < 18; j++) {
          arcPosAttr.array[j * 3] = (Math.random() - 0.5) * 2.4;
          arcPosAttr.array[j * 3 + 1] = (Math.random() - 0.5) * 2.4;
          arcPosAttr.array[j * 3 + 2] = (Math.random() - 0.5) * 2.4;
        }
        arcPosAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Xử lý Resize
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (renderer) renderer.dispose();
      boxGeo.dispose();
      boxMat.dispose();
      miniGeo.dispose();
      miniMatGold.dispose();
      miniMatCyan.dispose();
      sparkGeo.dispose();
      sparkMat.dispose();
      arcGeo.dispose();
      arcMat.dispose();
    };
  }, []);

  // Cập nhật hoạt ảnh theo State (Floating -> Charging -> Shatter)
  useEffect(() => {
    let animId;
    let shatterTime = 0;

    const updateStageAnimation = () => {
      animId = requestAnimationFrame(updateStageAnimation);
      const mesh = blockMeshRef.current;
      const innerLight = innerCoreLightRef.current;
      const shatterGroup = shatterGroupRef.current;
      const lightRays = lightRaysRef.current;
      const sparks = sparkParticlesRef.current;

      if (!mesh) return;

      if (stage === 'floating') {
        // Giai đoạn 1: Khối bay lơ lửng bồng bềnh
        mesh.visible = true;
        if (shatterGroup) shatterGroup.visible = false;
        if (lightRays) lightRays.visible = false;

        const time = performance.now() * 0.001;
        mesh.position.y = Math.sin(time * 2.2) * 0.14;
        mesh.position.x = 0;
        mesh.rotation.y += 0.012;
        mesh.rotation.x = Math.sin(time * 1.5) * 0.05;

        if (innerLight) innerLight.intensity = 1.0;
        if (sparks) sparks.material.color.setHex(0x00f0ff);
      } else if (stage === 'charging') {
        // Giai đoạn 2: Tăng tốc quay & rung lắc cộng hưởng theo THz
        mesh.visible = true;
        if (shatterGroup) shatterGroup.visible = false;
        if (lightRays) lightRays.visible = false;

        const freqRatio = Math.min(frequency / 8.0, 1.0);
        const rotSpeed = 0.02 + freqRatio * 0.16;
        mesh.rotation.y += rotSpeed;
        mesh.rotation.x += rotSpeed * 0.4;

        // Rung giật cơ học
        const jitter = freqRatio * 0.15;
        mesh.position.x = (Math.random() - 0.5) * jitter;
        mesh.position.y = (Math.random() - 0.5) * jitter;
        mesh.position.z = (Math.random() - 0.5) * jitter;

        // Cập nhật độ nứt của Canvas Texture
        const crackCanvas = createLuckyBlockFaceCanvas(freqRatio);
        if (crackCanvas && mesh.material.map) {
          mesh.material.map.image = crackCanvas;
          mesh.material.map.needsUpdate = true;
        }

        // Tăng sáng cực đại từ lõi
        if (innerLight) {
          innerLight.intensity = 2.0 + freqRatio * 18.0;
          innerLight.color.setHex(freqRatio > 0.6 ? 0xffffff : 0x00f0ff);
        }

        if (sparks) {
          sparks.material.size = 0.09 + freqRatio * 0.08;
        }
      } else if (stage === 'shattering') {
        // Giai đoạn 3: Khối nổ tung thành các mảnh Voxel bay tỏa ra
        mesh.visible = false;
        if (shatterGroup) {
          shatterGroup.visible = true;
          shatterGroup.children.forEach(cube => {
            cube.position.add(cube.userData.vel);
            cube.rotation.x += cube.userData.rotSpeed.x;
            cube.rotation.y += cube.userData.rotSpeed.y;
            cube.rotation.z += cube.userData.rotSpeed.z;
            cube.scale.multiplyScalar(0.96);
          });
        }

        if (lightRays) {
          lightRays.visible = true;
          lightRays.rotation.y += 0.05;
          lightRays.rotation.x += 0.02;
          lightRays.scale.multiplyScalar(1.04);
        }

        if (innerLight) {
          innerLight.intensity = Math.max(0, innerLight.intensity - 0.5);
        }
      }
    };

    updateStageAnimation();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [stage, frequency]);

  return (
    <div 
      className="relative w-full h-[320px] sm:h-[380px] flex items-center justify-center cursor-pointer select-none"
      onClick={onBlockTap}
    >
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
}

// =========================================================================
// 5. THẺ BÀI HOLOGRAM VOXEL TRONG GRID 10 (COMPACT 5x2 NO-SCROLL)
// =========================================================================
function HologramVoxelCard({
  item,
  isFlipped,
  isDuplicate,
  compensation,
  onFlip,
  index
}) {
  const isLegendary = item.rarity === 'Legendary';
  const isEpic = item.rarity === 'Epic';
  const isRare = item.rarity === 'Rare';
  const isCommon = item.rarity === 'Common';

  // Màu viền và hiệu ứng hào quang
  const rarityTheme = useMemo(() => {
    if (isLegendary) {
      return {
        badge: 'SSR',
        badgeBg: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-[0_0_12px_#f59e0b]',
        border: 'border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.55)]',
        bg: 'bg-gradient-to-b from-[#2a1b02] via-[#1a1002] to-[#0a0701]',
        textGradient: 'from-amber-200 via-yellow-300 to-amber-400',
        starColor: 'text-amber-400',
        particleFlame: true
      };
    }
    if (isEpic) {
      return {
        badge: 'SR',
        badgeBg: 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-[0_0_10px_#a855f7]',
        border: 'border-purple-400 shadow-[0_0_14px_rgba(168,85,247,0.45)]',
        bg: 'bg-gradient-to-b from-[#1e0f30] via-[#120820] to-[#080310]',
        textGradient: 'from-purple-200 via-pink-300 to-purple-400',
        starColor: 'text-purple-400',
        particleFlame: false
      };
    }
    if (isRare) {
      return {
        badge: 'R',
        badgeBg: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-[0_0_8px_#06b6d4]',
        border: 'border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)]',
        bg: 'bg-gradient-to-b from-[#0d1f30] via-[#081320] to-[#030910]',
        textGradient: 'from-cyan-200 via-sky-300 to-cyan-400',
        starColor: 'text-cyan-400',
        particleFlame: false
      };
    }
    return {
      badge: 'C',
      badgeBg: 'bg-zinc-700 text-zinc-300 border border-zinc-500',
      border: 'border-zinc-600/70 shadow-[0_0_6px_rgba(113,113,122,0.25)]',
      bg: 'bg-gradient-to-b from-[#18181b] to-[#09090b]',
      textGradient: 'from-zinc-200 to-zinc-400',
      starColor: 'text-zinc-400',
      particleFlame: false
    };
  }, [isLegendary, isEpic, isRare]);

  return (
    <div
      className="relative w-full h-[140px] sm:h-[160px] md:h-[175px] cursor-pointer select-none group"
      style={{ perspective: '1000px' }}
      onClick={() => {
        if (!isFlipped) onFlip(index);
      }}
    >
      <div
        className="w-full h-full relative transition-transform duration-500 ease-out"
        style={{
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* ================= MẶT ÚP (CARD BACK - VOXEL MYSTERY) ================= */}
        <div
          className={`absolute inset-0 rounded-2xl border-2 flex flex-col items-center justify-between p-2 sm:p-2.5 transition-all duration-300 ${
            isLegendary
              ? 'border-amber-400/80 bg-gradient-to-b from-[#251804] to-[#0d0701] shadow-[0_0_15px_rgba(245,158,11,0.4)] group-hover:border-amber-300'
              : isEpic
              ? 'border-purple-400/80 bg-gradient-to-b from-[#1c0c2e] to-[#090412] shadow-[0_0_12px_rgba(168,85,247,0.35)] group-hover:border-purple-300'
              : 'border-cyan-500/50 bg-gradient-to-b from-[#0c1926] to-[#040810] group-hover:border-cyan-400'
          }`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Lưới tọa độ HUD */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:10px_10px] rounded-2xl pointer-events-none" />

          {/* Badge mã định danh */}
          <div className="w-full flex justify-between items-center z-10">
            <span className="text-[8px] sm:text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
              #{String(index + 1).padStart(2, '0')}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>

          {/* Biểu tượng Khối Voxel Huyền Bí ở giữa */}
          <div className="relative z-10 flex flex-col items-center my-auto">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 ${
              isLegendary
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_#f59e0b]'
                : isEpic
                ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_12px_#a855f7]'
                : 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-[0_0_10px_#06b6d4]'
            }`}>
              <span className="text-xl sm:text-2xl font-black drop-shadow font-mono">?</span>
            </div>
            <span className="text-[8.5px] sm:text-[9.5px] text-zinc-400 font-mono mt-1 font-semibold group-hover:text-white transition-colors">
              CHẠM ĐỂ MỞ
            </span>
          </div>

          {/* Chân thẻ */}
          <div className="w-full text-center z-10">
            <span className="text-[7.5px] sm:text-[8px] font-mono text-zinc-500 tracking-widest uppercase">
              STEM VOXEL CARD
            </span>
          </div>
        </div>

        {/* ================= MẶT NGỬA (CARD FRONT - REVEALED) ================= */}
        <div
          className={`absolute inset-0 rounded-2xl border-2 flex flex-col justify-between p-2 sm:p-2.5 transition-all overflow-hidden ${rarityTheme.border} ${rarityTheme.bg}`}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          {/* Hiệu ứng ngọn lửa hạt ánh kim cho Legendary */}
          {rarityTheme.particleFlame && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-amber-500/15 via-transparent to-amber-500/10 animate-pulse" />
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />
            </div>
          )}

          {/* Ma trận Scanline cho Epic */}
          {isEpic && (
            <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.06)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
          )}

          {/* Header thẻ: Rarity Badge & Tình trạng MỚI / QUY ĐỔI */}
          <div className="relative z-10 flex items-center justify-between w-full">
            <div className="flex items-center gap-1">
              <span className={`px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black font-mono leading-none tracking-wider ${rarityTheme.badgeBg}`}>
                {rarityTheme.badge}
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-tight">
                {item.categoryName}
              </span>
            </div>

            {/* Trạng thái: Mới vs Trùng lặp quy đổi */}
            {isDuplicate ? (
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[7.5px] sm:text-[8px] font-mono font-bold">
                <span>+{compensation}</span>
                <span className="text-[8px]">🔮</span>
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/25 border border-emerald-400 text-emerald-300 text-[8px] sm:text-[8.5px] font-black tracking-widest animate-pulse">
                MỚI
              </span>
            )}
          </div>

          {/* Phần giữa: Icon / Trưng bày Voxel lớn */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center">
            <div className="text-2xl sm:text-3xl md:text-4xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transform transition-transform group-hover:scale-115">
              {item.icon || '🎁'}
            </div>
            {/* Sao đánh giá Rarity */}
            <div className="flex items-center gap-0.5 mt-0.5">
              {Array.from({ length: item.stars || 3 }).map((_, sIdx) => (
                <span key={sIdx} className={`text-[7px] sm:text-[8px] ${rarityTheme.starColor}`}>★</span>
              ))}
            </div>
          </div>

          {/* Footer thẻ: Tên vật phẩm & Thông số */}
          <div className="relative z-10 text-center w-full">
            <h4 className={`text-[9.5px] sm:text-[10.5px] md:text-[11px] font-black leading-tight truncate text-transparent bg-clip-text bg-gradient-to-r ${rarityTheme.textGradient}`}>
              {item.name}
            </h4>
            {isDuplicate ? (
              <p className="text-[7.5px] sm:text-[8px] font-mono text-amber-300/80 truncate">
                Đã có ➔ Quy đổi Pha Lê
              </p>
            ) : (
              <p className="text-[7.5px] sm:text-[8px] font-mono text-emerald-300/80 truncate">
                Đã thêm vào tủ đồ!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 6. MAIN ORGANISM COMPONENT: VOXEL GACHA MODAL
// =========================================================================
export default function VoxelGachaModal({
  isOpen = false,
  onClose,
  initialPullCount = 10,
  onNavigateStudio
}) {
  const router = useRouter();
  const { personalization, setPersonalization, user } = useAppStore();

  // State các giai đoạn
  // 'idle' | 'floating' (Stage 1) | 'charging' (Stage 2) | 'shattering' (Stage 3) | 'revealed'
  const [stage, setStage] = useState('floating');
  const [pullCount, setPullCount] = useState(initialPullCount);
  const [frequency, setFrequency] = useState(1.2); // Tần số cộng hưởng (THz)
  const [isCharging, setIsCharging] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Kết quả vòng quay Gacha
  const [results, setResults] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [totalRefundCrystals, setTotalRefundCrystals] = useState(0);

  // Bảo hiểm Pity (Tải từ localStorage)
  const [pityCounter, setPityCounter] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stem_gacha_pity');
      return saved ? Number(saved) : 0;
    }
    return 0;
  });

  const crystals = personalization?.crystals !== undefined ? Number(personalization.crystals) : 500;
  const currentUnlocked = useMemo(() => personalization?.unlockedParts || ['peach', 'hair_default', 'top_default', 'bottom_default'], [personalization?.unlockedParts]);
  const currentTitles = useMemo(() => personalization?.unlockedTitles || ['apprentice'], [personalization?.unlockedTitles]);

  // Kích hoạt chuỗi nổ vỡ khối Lucky Block
  const triggerShatterSequence = useCallback(() => {
    setStage('shattering');
    voxelAudio.playShatter();

    setTimeout(() => {
      setStage('revealed');
      // Tự động phát âm thanh hoành tráng nếu có đồ Legendary
      setResults(currentResults => {
        if (currentResults.some(r => r.item.rarity === 'Legendary')) {
          voxelAudio.playLegendaryStinger();
        }
        return currentResults;
      });
    }, 850);
  }, []);

  // =========================================================================
  // LOGIC QUAY GACHA VÀ TÍNH TOÁN BẢO HIỂM (PITY SYSTEM)
  // =========================================================================
  const startGachaRoll = useCallback((count = 10) => {
    const cost = count === 10 ? GACHA_CONSTANTS.PULL_COST_MULTI : GACHA_CONSTANTS.PULL_COST_SINGLE;

    // Kiểm tra số dư pha lê
    if (crystals < cost) {
      setErrorMsg(`Bạn không đủ Pha Lê Lượng Tử (Cần ${cost} 🔮, hiện có ${crystals} 🔮). Hãy làm thêm bài lab để thu thập!`);
      setStage('revealed');
      return;
    }

    setErrorMsg('');
    setIsRolling(true);
    setFlippedCards([]);
    setFrequency(1.2);
    setStage('floating');

    // Chạy thuật toán Roll với Pity từ voxelGachaEngine
    const {
      results: rollResults,
      newPity,
      totalCompensation,
      updatedUnlocked,
      updatedTitles
    } = rollVoxelGacha(count, currentUnlocked, currentTitles, pityCounter);

    // Cập nhật Pity & Lưu LocalStorage
    setPityCounter(newPity);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stem_gacha_pity', String(newPity));
    }

    // Cập nhật Pha Lê & Kho đồ vào Zustand Store (0ms Optimistic UI)
    const newBalance = crystals - cost + totalCompensation;
    setPersonalization({
      crystals: newBalance,
      unlockedParts: updatedUnlocked,
      unlockedTitles: updatedTitles
    });

    // Đồng bộ vào Firestore nếu người dùng đã đăng nhập (bọc an toàn tránh throw)
    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, {
          'personalization.crystals': newBalance,
          'personalization.unlockedParts': updatedUnlocked,
          'personalization.unlockedTitles': updatedTitles
        }).catch(err => {
          console.warn('Lỗi đồng bộ gacha vào Firestore (đã lưu local):', err?.message);
        });
      } catch (e) {
        console.warn('Lỗi gọi Firestore updateDoc:', e?.message);
      }
    }

    setResults(rollResults);
    setTotalRefundCrystals(totalCompensation);
    setIsRolling(false);
  }, [crystals, pityCounter, currentUnlocked, currentTitles, setPersonalization, user]);

  // Đồng bộ pullCount từ props khi modal mở
  const prevIsOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setPullCount(initialPullCount);
      setErrorMsg('');
      startGachaRoll(initialPullCount);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialPullCount, startGachaRoll]);

  // =========================================================================
  // XỬ LÝ CLICK / GIỮ ĐỂ TÍCH TỤ NĂNG LƯỢNG (STAGE 2 -> 3)
  // =========================================================================
  const handleBlockTap = useCallback(() => {
    if (stage === 'revealed' || stage === 'shattering') return;

    voxelAudio.playSpark();

    if (stage === 'floating') {
      setStage('charging');
    }

    setFrequency(prev => {
      const next = +(prev + 1.25).toFixed(2);
      voxelAudio.playCharge(Math.min(next / 8.0, 1.0));

      // Đạt ngưỡng cộng hưởng cực hạn (Critical Resonance 7.5 THz)
      if (next >= 7.5) {
        triggerShatterSequence();
      }
      return next;
    });
  }, [stage, triggerShatterSequence]);

  // Bỏ qua hiệu ứng (Mở nhanh)
  const handleSkipAnimation = () => {
    voxelAudio.playCardFlip();
    setStage('revealed');
  };

  // Lật từng thẻ đơn lẻ
  const handleFlipCard = (index) => {
    if (flippedCards.includes(index)) return;

    voxelAudio.playCardFlip();
    const item = results[index]?.item;
    if (item?.rarity === 'Legendary') {
      voxelAudio.playLegendaryStinger();
    } else if (item?.rarity === 'Epic') {
      voxelAudio.playEpicStinger();
    }

    setFlippedCards(prev => [...prev, index]);
  };

  // "Mở tất cả" (Flip All) với hiệu ứng lật so le liên hoàn
  const handleFlipAll = () => {
    voxelAudio.playCardFlip();
    results.forEach((_, idx) => {
      setTimeout(() => {
        setFlippedCards(prev => prev.includes(idx) ? prev : [...prev, idx]);
        voxelAudio.playSpark();
      }, idx * 65);
    });

    if (results.some(r => r.item.rarity === 'Legendary')) {
      setTimeout(() => voxelAudio.playLegendaryStinger(), results.length * 65);
    }
  };

  // Chuyển hướng vào Studio Mặc Đồ
  const handleGoToStudio = () => {
    voxelAudio.playCardFlip();
    if (onNavigateStudio) {
      onNavigateStudio();
    } else {
      router.push('/ho-so?subtab=studio');
    }
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-[#02040a]/95 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 select-none">
      {/* Vùng chứa chính cố định chiều cao để không bị cuộn trang */}
      <div className="relative w-full max-w-5xl h-full max-h-[96vh] bg-gradient-to-b from-[#130f29] via-[#0b0818] to-[#04020a] border border-purple-500/30 rounded-3xl p-3 sm:p-5 shadow-[0_0_80px_rgba(168,85,247,0.3)] text-center overflow-hidden flex flex-col justify-between ring-1 ring-purple-500/20">
        
        {/* Nền lưới tọa độ Laser Cyberpunk */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* ================================================================= */}
        {/* 1. HEADER RÚT GỌN (THÔNG TIN TÀI KHOẢN, PITY & NÚT ĐÓNG) */}
        {/* ================================================================= */}
        <div className="relative z-10 shrink-0 flex items-center justify-between pb-1 border-b border-purple-500/20">
          {/* Nhãn tiêu đề & Logo */}
          <div className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 flex items-center justify-center shadow-[0_0_15px_#f59e0b]">
              <span className="text-base">📦</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30">
                  STEM VOXEL LUCKY BLOCK
                </span>
                <span className="text-[9px] font-mono text-zinc-400 hidden sm:inline">
                  TẦN SỐ: {frequency.toFixed(1)} THz
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-300 to-purple-300 uppercase tracking-wider">
                KHỐI LƯỢNG TỬ VẬN MAY
              </h2>
            </div>
          </div>

          {/* Chỉ số Pha Lê & Thanh Pity */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Bộ đếm Pha Lê */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-950/60 border border-purple-400/40 shadow-sm">
              <CrystalIcon className="w-4 h-4" />
              <span className="text-xs sm:text-sm font-black text-amber-300 font-mono">
                {crystals} 🔮
              </span>
            </div>

            {/* Thanh tiến trình Bảo hiểm Pity (SSR Guarantee) */}
            <div className="hidden md:flex flex-col items-end px-2.5 py-1 rounded-xl bg-zinc-900/70 border border-zinc-700/60">
              <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-300 font-bold">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>BẢO HIỂM SSR:</span>
                <span className="text-amber-400">{pityCounter}/50</span>
              </div>
              <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${Math.min((pityCounter / 50) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Nút đóng (X) */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-600/50"
              title="Đóng Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thông báo lỗi nếu thiếu Pha Lê */}
        {errorMsg && (
          <div className="relative z-20 my-2 p-2 rounded-xl bg-rose-500/20 border border-rose-400/50 text-rose-300 text-xs font-bold flex items-center justify-between">
            <span>{errorMsg}</span>
            <button 
              onClick={() => {
                if (onClose) onClose();
                router.push('/thi-nghiem');
              }}
              className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider"
            >
              Vào Phòng Lab Kiếm Thêm
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* 2. KHU VỰC CHÍNH: HIỆU ỨNG MỞ KHỐI 3D HOẶC GRID 10 THẺ BÀI */}
        {/* ================================================================= */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-0 py-1">
          <AnimatePresence mode="wait">
            {stage !== 'revealed' ? (
              /* GIAI ĐOẠN 1, 2, 3: KHỐI LUCKY BLOCK 3D TÍCH TỤ NĂNG LƯỢNG & PHÁ VỠ */
              <motion.div
                key="stage_block"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.15 }}
                className="w-full flex flex-col items-center justify-center my-auto"
              >
                {/* Scene Three.js */}
                <LuckyBlock3DScene
                  stage={stage}
                  frequency={frequency}
                  onBlockTap={handleBlockTap}
                  isCharging={isCharging}
                />

                {/* Đồng hồ hiển thị Tần Số Cộng Hưởng (Frequency Meters 5.7 THz) */}
                <div className="flex flex-col items-center mt-1 z-20">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-amber-400/50 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                    <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="font-mono text-sm sm:text-base font-black text-amber-300 tracking-wider">
                      TẦN SỐ LƯỢNG TỬ: {frequency.toFixed(1)} THz
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/40">
                      {frequency >= 5.7 ? 'CRITICAL RESONANCE' : 'SYNCHRONIZING'}
                    </span>
                  </div>

                  {/* Thanh tiến trình tần số chạm mốc 7.5 THz */}
                  <div className="w-56 sm:w-64 h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/10 mt-2">
                    <div 
                      className={`h-full transition-all duration-200 ${
                        frequency >= 5.7 
                          ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-cyan-400 animate-pulse' 
                          : 'bg-gradient-to-r from-purple-500 to-amber-400'
                      }`}
                      style={{ width: `${Math.min((frequency / 7.5) * 100, 100)}%` }}
                    />
                  </div>

                  {/* Hướng dẫn thao tác người dùng */}
                  <p className="text-zinc-300 text-xs sm:text-sm font-semibold mt-2 animate-bounce flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>Chạm liên tục vào khối để gia tốc tần số và kích nổ!</span>
                    <span>⚡</span>
                  </p>

                  {/* Các nút bấm điều khiển nhanh */}
                  <div className="flex items-center gap-2 sm:gap-3 mt-3">
                    <button
                      onClick={handleBlockTap}
                      className="px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_15px_#f59e0b] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Kích Tốc (+1.3 THz)</span>
                    </button>

                    <button
                      onClick={handleSkipAnimation}
                      className="px-3.5 py-1.5 sm:py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase tracking-wider border border-zinc-600/50 active:scale-95 transition-all cursor-pointer"
                    >
                      Mở Nhanh (Bỏ Qua)
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* GIAI ĐOẠN 4: LƯỚI 10 THẺ BÀI HOLOGRAM (COMPACT 5x2 NO-SCROLL) */
              <motion.div
                key="stage_cards"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full flex flex-col justify-between overflow-hidden"
              >
                {/* Banner Thông báo Rarity & Hoàn trả Pha Lê */}
                <div className="shrink-0 flex items-center justify-between px-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    {results.some((r, idx) => flippedCards.includes(idx) && r.item.rarity === 'Legendary') ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/80 text-amber-300 text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>HUYỀN THOẠI [SSR] ĐÃ XUẤT HIỆN!</span>
                      </div>
                    ) : results.some((r, idx) => flippedCards.includes(idx) && r.item.rarity === 'Epic') ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/80 text-purple-300 text-xs font-black uppercase tracking-wider shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>ĐỘT PHÁ [SR] SIÊU CẤP!</span>
                      </div>
                    ) : (
                      <span className="text-zinc-400 text-xs font-mono">
                        Chạm vào từng thẻ hoặc bấm &quot;Mở tất cả&quot; để giải mã.
                      </span>
                    )}
                  </div>

                  {/* Tổng pha lê hoàn trả từ vật phẩm trùng lặp */}
                  {totalRefundCrystals > 0 && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-bold">
                      <span>Đã hoàn trả:</span>
                      <strong className="text-amber-200">+{totalRefundCrystals} 🔮</strong>
                      <span>(vật phẩm trùng)</span>
                    </div>
                  )}
                </div>

                {/* ================================================================= */}
                {/* LƯỚI THẺ BÀI: 5 CỘT x 2 HÀNG KHÔNG CUỘN DỌC TRÊN MỌI THIẾT BỊ */}
                {/* ================================================================= */}
                <div className="flex-1 w-full grid grid-cols-5 grid-rows-2 gap-1.5 sm:gap-2.5 md:gap-3 items-center justify-center overflow-hidden py-1">
                  {results.slice(0, 10).map((res, idx) => (
                    <HologramVoxelCard
                      key={`${res.item.id}-${idx}`}
                      item={res.item}
                      isFlipped={flippedCards.includes(idx)}
                      isDuplicate={res.isDuplicate}
                      compensation={res.compensation}
                      onFlip={handleFlipCard}
                      index={idx}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ================================================================= */}
        {/* 3. FOOTER ĐIỀU KHIỂN & CÁC NÚT TÁC VỤ (ACTION BUTTONS) */}
        {/* ================================================================= */}
        <div className="relative z-10 shrink-0 pt-2 border-t border-purple-500/20 flex flex-wrap items-center justify-between gap-2">
          {/* Cụm trái: Mở tất cả (Flip All) */}
          <div className="flex items-center gap-2">
            {stage === 'revealed' && (
              <button
                disabled={flippedCards.length === results.length}
                onClick={handleFlipAll}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                  flippedCards.length === results.length
                    ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-black" />
                <span>Mở tất cả ({results.length - flippedCards.length})</span>
              </button>
            )}
          </div>

          {/* Cụm phải: Quay tiếp x1, Quay tiếp x10 & Vào Studio Mặc Đồ */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Nút Quay Tiếp x1 */}
            <button
              disabled={isRolling}
              onClick={() => {
                setPullCount(1);
                startGachaRoll(1);
              }}
              className="px-3 py-1.5 sm:py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-md shadow-purple-900/40 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Quay tiếp x1 (100 🔮)</span>
            </button>

            {/* Nút Quay Tiếp x10 */}
            <button
              disabled={isRolling}
              onClick={() => {
                setPullCount(10);
                startGachaRoll(10);
              }}
              className="px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-md shadow-pink-900/40 flex items-center gap-1.5 cursor-pointer border border-pink-400/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Quay tiếp x10 (900 🔮)</span>
            </button>

            {/* Nút Vào Studio Mặc Đồ */}
            <button
              onClick={handleGoToStudio}
              className="px-3.5 py-1.5 sm:py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shadow-md shadow-emerald-900/40 cursor-pointer border border-emerald-400/40"
            >
              <Palette className="w-3.5 h-3.5 text-emerald-200" />
              <span>Vào Studio Mặc Đồ</span>
            </button>

            {/* Nút Đóng */}
            <button
              onClick={onClose}
              className="px-3 py-1.5 sm:py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer border border-zinc-700/60"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
