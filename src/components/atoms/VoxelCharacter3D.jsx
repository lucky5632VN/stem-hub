'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  MODEL_TYPES,
  PRESET_SKINS,
  createVoxelBoxGeometry,
  generatePresetSkin,
  generateCapeTexture,
  createSkinTexture,
  loadSkin,
  generateIsometricHeadAvatar
} from '@/lib/voxelSkinEngine';

/* ============================================================================
 * 1. HELD ITEMS 3D VOXEL MODELS
 * ============================================================================ */

/**
 * 3D Test Tube with glowing bubbling fluid and cork stopper.
 */
function TestTubeItem({ fluidColor = '#00f2fe' }) {
  const bubbleRef = useRef();

  useFrame(({ clock }) => {
    if (bubbleRef.current) {
      const t = clock.getElapsedTime();
      bubbleRef.current.position.y = -0.5 + Math.sin(t * 5) * 0.4;
      bubbleRef.current.scale.setScalar(0.8 + Math.sin(t * 8) * 0.2);
    }
  });

  return (
    <group position={[0, -2, 2.2]} rotation={[0.4, 0, -0.2]}>
      {/* Outer Glass Tube */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 4.5, 12]} />
        <meshPhysicalMaterial
          color="#e0f2fe"
          transparent
          opacity={0.5}
          roughness={0.05}
          transmission={0.8}
          thickness={0.5}
          ior={1.45}
        />
      </mesh>

      {/* Glowing Fluid Inside */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.58, 0.58, 3.0, 12]} />
        <meshStandardMaterial
          color={fluidColor}
          emissive={fluidColor}
          emissiveIntensity={1.8}
          roughness={0.2}
        />
      </mesh>

      {/* Point Light from Glowing Liquid */}
      <pointLight color={fluidColor} intensity={1.5} distance={5} decay={2} />

      {/* Bubbling particle inside */}
      <mesh ref={bubbleRef} position={[0, -0.5, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Wooden Cork Stopper */}
      <mesh position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.65, 0.55, 0.8, 12]} />
        <meshStandardMaterial color="#92400e" roughness={0.9} />
      </mesh>
    </group>
  );
}

/**
 * 3D Diamond Pickaxe in authentic Minecraft voxel style.
 */
function DiamondPickaxeItem() {
  return (
    <group position={[0, -3.5, 2.5]} rotation={[0.8, 0.2, -0.6]} scale={[0.65, 0.65, 0.65]}>
      {/* Wooden Shaft */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[1.0, 11.0, 1.0]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>

      {/* Pickaxe Head Top Crossbar (Diamond Cyan) */}
      <mesh position={[3.2, 3.2, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[7.5, 1.8, 1.2]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#0891b2"
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* Diamond Tip Highlights */}
      <mesh position={[5.8, 4.2, 0]}>
        <boxGeometry args={[1.2, 1.2, 1.25]} />
        <meshStandardMaterial color="#67e8f9" emissive="#a5f3fc" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[2.2, 0.6, 0]}>
        <boxGeometry args={[1.2, 1.2, 1.25]} />
        <meshStandardMaterial color="#67e8f9" emissive="#a5f3fc" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

/**
 * 3D Futuristic STEM Holographic Tablet.
 */
function STEMTabletItem() {
  const holoRef = useRef();

  useFrame(({ clock }) => {
    if (holoRef.current) {
      const t = clock.getElapsedTime();
      holoRef.current.position.y = 1.2 + Math.sin(t * 3) * 0.15;
      holoRef.current.material.opacity = 0.6 + Math.sin(t * 4) * 0.2;
    }
  });

  return (
    <group position={[0, -2.5, 2.5]} rotation={[0.6, 0.2, -0.2]}>
      {/* Titanium Slate Bezel */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[5.0, 6.5, 0.5]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Glowing Screen Display */}
      <mesh position={[0, 0, 0.28]}>
        <boxGeometry args={[4.4, 5.8, 0.08]} />
        <meshStandardMaterial
          color="#0284c7"
          emissive="#00f2fe"
          emissiveIntensity={1.2}
          roughness={0.1}
        />
      </mesh>

      {/* Holographic Projection Hovering Plane */}
      <mesh ref={holoRef} position={[0, 1.2, 0.8]} rotation={[-0.2, 0, 0]}>
        <planeGeometry args={[4.2, 2.8]} />
        <meshBasicMaterial
          color="#67e8f9"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/**
 * Held Item Switcher.
 */
function HeldItemMesh({ itemType = 'test_tube' }) {
  if (!itemType || itemType === 'none') return null;
  if (itemType === 'pickaxe' || itemType === 'diamond_pickaxe') {
    return <DiamondPickaxeItem />;
  }
  if (itemType === 'stem_tablet' || itemType === 'tablet') {
    return <STEMTabletItem />;
  }
  // Default to glowing test tube
  return <TestTubeItem fluidColor="#00f2fe" />;
}

/* ============================================================================
 * 2. CHARACTER HIERARCHICAL RIGGED VOXEL MESHES
 * ============================================================================ */

function CharacterRig({
  skinTexture,
  capeTexture,
  isSlim = false,
  showOverlay = true,
  showCape = true,
  heldItem = 'test_tube',
  animation = 'idle'
}) {
  const rootRef = useRef();
  const headRef = useRef();
  const bodyRef = useRef();
  const rightArmRef = useRef();
  const leftArmRef = useRef();
  const rightLegRef = useRef();
  const leftLegRef = useRef();
  const capeRef = useRef();

  // Arm width: Steve is 4, Alex is 3
  const armW = isSlim ? 3 : 4;
  const armOverlayW = isSlim ? 3.5 : 4.5;
  const armPivotX = isSlim ? 5.5 : 6.0;

  // Pre-generate box geometries with Minecraft UVs
  const geometries = useMemo(() => {
    return {
      head: createVoxelBoxGeometry(8, 8, 8, 'head', isSlim),
      headOverlay: createVoxelBoxGeometry(9, 9, 9, 'headOverlay', isSlim),
      body: createVoxelBoxGeometry(8, 12, 4, 'body', isSlim),
      bodyOverlay: createVoxelBoxGeometry(8.6, 12.6, 4.6, 'bodyOverlay', isSlim),
      rightArm: createVoxelBoxGeometry(armW, 12, 4, 'rightArm', isSlim),
      rightArmOverlay: createVoxelBoxGeometry(armOverlayW, 12.6, 4.6, 'rightArmOverlay', isSlim),
      leftArm: createVoxelBoxGeometry(armW, 12, 4, 'leftArm', isSlim),
      leftArmOverlay: createVoxelBoxGeometry(armOverlayW, 12.6, 4.6, 'leftArmOverlay', isSlim),
      rightLeg: createVoxelBoxGeometry(4, 12, 4, 'rightLeg', isSlim),
      rightLegOverlay: createVoxelBoxGeometry(4.6, 12.6, 4.6, 'rightLegOverlay', isSlim),
      leftLeg: createVoxelBoxGeometry(4, 12, 4, 'leftLeg', isSlim),
      leftLegOverlay: createVoxelBoxGeometry(4.6, 12.6, 4.6, 'leftLegOverlay', isSlim),
      cape: createVoxelBoxGeometry(10, 16, 0.8, 'cape', isSlim, 64, 32)
    };
  }, [isSlim, armW, armOverlayW]);

  // Base and Overlay materials
  const baseMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: skinTexture,
      roughness: 0.85,
      metalness: 0.05
    });
  }, [skinTexture]);

  const overlayMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: skinTexture,
      transparent: true,
      alphaTest: 0.25,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
  }, [skinTexture]);

  const capeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: capeTexture,
      roughness: 0.9,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
  }, [capeTexture]);

  // Animation Loop
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    if (animation === 'walk') {
      // Walking animation
      const walkSpeed = 7.0;
      const legSwing = Math.sin(time * walkSpeed) * 0.65;
      const armSwing = Math.cos(time * walkSpeed) * 0.65;

      if (rightLegRef.current) rightLegRef.current.rotation.x = legSwing;
      if (leftLegRef.current) leftLegRef.current.rotation.x = -legSwing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -armSwing - 0.2;
      if (leftArmRef.current) leftArmRef.current.rotation.x = armSwing;

      // Bobbing body
      if (bodyRef.current) bodyRef.current.position.y = 6 + Math.abs(Math.sin(time * walkSpeed)) * 0.4;
      // Head slight sway
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(time * (walkSpeed / 2)) * 0.08;
        headRef.current.rotation.x = 0;
      }
      // Cape flutter back while walking
      if (capeRef.current) {
        capeRef.current.rotation.x = -0.5 - Math.sin(time * (walkSpeed * 1.5)) * 0.25;
      }
    } else if (animation === 'celebrate') {
      // Victory / Celebrate pose
      const jump = Math.abs(Math.sin(time * 4)) * 1.5;
      if (rootRef.current) rootRef.current.position.y = jump;
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -2.6 + Math.sin(time * 8) * 0.3;
        rightArmRef.current.rotation.z = -0.3;
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -2.6 - Math.sin(time * 8) * 0.3;
        leftArmRef.current.rotation.z = 0.3;
      }
      if (headRef.current) headRef.current.rotation.y = Math.sin(time * 4) * 0.2;
      if (capeRef.current) capeRef.current.rotation.x = -0.6 - Math.sin(time * 8) * 0.3;
    } else {
      // Default: Idle Breathing Animation
      const breathTime = time * 2.0;

      // Torso breathing rise & fall
      if (bodyRef.current) {
        bodyRef.current.position.y = 6 + Math.sin(breathTime) * 0.12;
      }

      // Head gentle tilt and nodding
      if (headRef.current) {
        headRef.current.rotation.x = Math.sin(breathTime) * 0.035;
        headRef.current.rotation.y = Math.cos(time * 0.8) * 0.05;
      }

      // Arms subtle idle sway
      if (rightArmRef.current) {
        // Holding item: slightly raised forward
        const baseHold = heldItem && heldItem !== 'none' ? -0.35 : 0;
        rightArmRef.current.rotation.x = baseHold + Math.sin(breathTime) * 0.04;
        rightArmRef.current.rotation.z = -0.05;
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -Math.sin(breathTime) * 0.04;
        leftArmRef.current.rotation.z = 0.05;
      }

      // Legs steady
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;

      // Cape subtle floating wave
      if (capeRef.current) {
        capeRef.current.rotation.x = -0.15 - Math.sin(time * 2.5) * 0.12;
        capeRef.current.rotation.y = Math.cos(time * 1.5) * 0.03;
      }
    }
  });

  return (
    <group ref={rootRef} position={[0, -6, 0]}>
      {/* 1. TORSO (Body) */}
      <group ref={bodyRef} position={[0, 6, 0]}>
        {/* Base Body Mesh (8x12x4) */}
        <mesh geometry={geometries.body} material={baseMaterial} castShadow receiveShadow />

        {/* Outer Body Overlay Mesh (8.6x12.6x4.6) */}
        {showOverlay && (
          <mesh geometry={geometries.bodyOverlay} material={overlayMaterial} castShadow />
        )}

        {/* 2. HEAD & NECK PIVOT */}
        <group ref={headRef} position={[0, 6, 0]}>
          {/* Base Head (8x8x8 centered at y=4) */}
          <mesh position={[0, 4, 0]} geometry={geometries.head} material={baseMaterial} castShadow />

          {/* Outer Head Overlay (9x9x9 layer: hair, goggles, visor) */}
          {showOverlay && (
            <mesh position={[0, 4, 0]} geometry={geometries.headOverlay} material={overlayMaterial} castShadow />
          )}
        </group>

        {/* 3. CAPE PIVOT (Attached to upper back) */}
        {showCape && (
          <group ref={capeRef} position={[0, 5.5, -2.1]}>
            <mesh position={[0, -8, -0.4]} geometry={geometries.cape} material={capeMaterial} castShadow />
          </group>
        )}
      </group>

      {/* 4. RIGHT ARM PIVOT (Shoulder at [-armPivotX, 11, 0]) */}
      <group ref={rightArmRef} position={[-armPivotX, 11, 0]}>
        <mesh position={[0, -5, 0]} geometry={geometries.rightArm} material={baseMaterial} castShadow />
        {showOverlay && (
          <mesh position={[0, -5, 0]} geometry={geometries.rightArmOverlay} material={overlayMaterial} castShadow />
        )}

        {/* Held Item in Right Hand */}
        <HeldItemMesh itemType={heldItem} />
      </group>

      {/* 5. LEFT ARM PIVOT (Shoulder at [+armPivotX, 11, 0]) */}
      <group ref={leftArmRef} position={[armPivotX, 11, 0]}>
        <mesh position={[0, -5, 0]} geometry={geometries.leftArm} material={baseMaterial} castShadow />
        {showOverlay && (
          <mesh position={[0, -5, 0]} geometry={geometries.leftArmOverlay} material={overlayMaterial} castShadow />
        )}
      </group>

      {/* 6. RIGHT LEG PIVOT (Hip at [-2, 0, 0]) */}
      <group ref={rightLegRef} position={[-2, 0, 0]}>
        <mesh position={[0, -6, 0]} geometry={geometries.rightLeg} material={baseMaterial} castShadow receiveShadow />
        {showOverlay && (
          <mesh position={[0, -6, 0]} geometry={geometries.rightLegOverlay} material={overlayMaterial} castShadow />
        )}
      </group>

      {/* 7. LEFT LEG PIVOT (Hip at [+2, 0, 0]) */}
      <group ref={leftLegRef} position={[2, 0, 0]}>
        <mesh position={[0, -6, 0]} geometry={geometries.leftLeg} material={baseMaterial} castShadow receiveShadow />
        {showOverlay && (
          <mesh position={[0, -6, 0]} geometry={geometries.leftLegOverlay} material={overlayMaterial} castShadow />
        )}
      </group>

      {/* Subtle Ground Pedestal / Contact Shadow */}
      <mesh position={[0, -12.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[9, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

/* ============================================================================
 * 3. MAIN COMPONENT: VOXEL CHARACTER 3D
 * ============================================================================ */

export default function VoxelCharacter3D({
  skin = PRESET_SKINS.STEM_STEVE,
  modelType = MODEL_TYPES.STEVE,
  cape = 'stem',
  heldItem = 'test_tube',
  animation = 'idle',
  showOverlay = true,
  showCape = true,
  autoRotate = false,
  autoRotateSpeed = 1.2,
  enableZoom = true,
  enableRotate = true,
  cameraPosition = [0, 4, 38],
  className = '',
  height = '420px',
  width = '100%',
  onSnapshotReady = null,
  showControls = false
}) {
  const [mounted, setMounted] = useState(false);
  const [skinData, setSkinData] = useState(null);
  const [currentSkin, setCurrentSkin] = useState(skin);
  const [currentHeldItem, setCurrentHeldItem] = useState(heldItem);
  const [currentAnimation, setCurrentAnimation] = useState(animation);
  const [isRotating, setIsRotating] = useState(autoRotate);

  // SSR Safe mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update internal states if props change
  useEffect(() => {
    setCurrentSkin(skin);
  }, [skin]);

  useEffect(() => {
    setCurrentHeldItem(heldItem);
  }, [heldItem]);

  useEffect(() => {
    setCurrentAnimation(animation);
  }, [animation]);

  // Load and synthesize skin texture
  useEffect(() => {
    let active = true;
    async function initSkin() {
      try {
        const loaded = await loadSkin(currentSkin);
        if (!active) return;
        setSkinData(loaded);

        if (onSnapshotReady) {
          const snapshot = generateIsometricHeadAvatar(loaded.canvas, { size: 128 });
          onSnapshotReady(snapshot);
        }
      } catch (err) {
        console.warn('VoxelCharacter3D: Error loading skin, using STEM Steve fallback', err);
        const fallback = generatePresetSkin('stem_steve');
        if (active) {
          setSkinData({
            canvas: fallback,
            isSlim: false,
            modelType: MODEL_TYPES.STEVE
          });
        }
      }
    }
    initSkin();
    return () => { active = false; };
  }, [currentSkin, onSnapshotReady]);

  // Three.js Textures
  const skinTexture = useMemo(() => {
    if (!skinData?.canvas) return null;
    return createSkinTexture(skinData.canvas, THREE);
  }, [skinData]);

  const capeTexture = useMemo(() => {
    if (!cape || cape === 'none') return null;
    const capeCanvas = generateCapeTexture(cape);
    const tex = new THREE.CanvasTexture(capeCanvas.domCanvas || capeCanvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    return tex;
  }, [cape]);

  const isSlim = skinData?.isSlim ?? (modelType === MODEL_TYPES.ALEX);

  // Fallback placeholder during SSR / hydration
  if (!mounted) {
    return (
      <div
        className={`relative flex items-center justify-center bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden ${className}`}
        style={{ width, height }}
      >
        <div className="flex flex-col items-center gap-3 text-cyan-400">
          <div className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Loading Voxel 3D Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-2xl border border-slate-800/80 bg-radial from-slate-900/90 to-slate-950/95 shadow-2xl overflow-hidden select-none ${className}`}
      style={{ width, height }}
    >
      {/* 3D Canvas */}
      {skinTexture && (
        <Canvas
          shadows
          camera={{ position: cameraPosition, fov: 42 }}
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          {/* Lighting */}
          <ambientLight intensity={1.2} />
          <directionalLight
            position={[12, 20, 15]}
            intensity={1.8}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          {/* Subtle Cyber Rim Light */}
          <directionalLight position={[-15, 10, -15]} intensity={0.8} color="#00f2fe" />
          <directionalLight position={[0, -10, 10]} intensity={0.4} color="#a855f7" />

          {/* Character 3D Mesh Rig */}
          <CharacterRig
            skinTexture={skinTexture}
            capeTexture={capeTexture}
            isSlim={isSlim}
            showOverlay={showOverlay}
            showCape={showCape && cape !== 'none'}
            heldItem={currentHeldItem}
            animation={currentAnimation}
          />

          {/* Interactive 360 Orbit Controls */}
          <OrbitControls
            enablePan={false}
            enableZoom={enableZoom}
            enableRotate={enableRotate}
            minDistance={18}
            maxDistance={65}
            target={[0, 0, 0]}
            autoRotate={isRotating}
            autoRotateSpeed={autoRotateSpeed}
          />
        </Canvas>
      )}

      {/* Optional Interactive Controls Overlay */}
      {showControls && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 p-2 bg-slate-900/85 backdrop-blur-md rounded-xl border border-slate-700/60 text-xs">
          {/* Presets */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-mono text-[10px] uppercase mr-1">Skin:</span>
            {[
              { id: 'stem_steve', label: 'Steve' },
              { id: 'cyber_alex', label: 'Alex' },
              { id: 'biohazard_hazmat', label: 'Hazmat' },
              { id: 'quantum_physicist', label: 'Quantum' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setCurrentSkin(p.id)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                  currentSkin === p.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Held Items & Action */}
          <div className="flex items-center gap-1.5">
            <select
              value={currentHeldItem}
              onChange={(e) => setCurrentHeldItem(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded-md px-2 py-1 text-[11px] outline-none"
            >
              <option value="test_tube">🧪 Test Tube</option>
              <option value="pickaxe">⛏️ Diamond Pick</option>
              <option value="stem_tablet">📱 STEM Tablet</option>
              <option value="none">Empty</option>
            </select>

            <button
              onClick={() => setCurrentAnimation((prev) => (prev === 'idle' ? 'walk' : prev === 'walk' ? 'celebrate' : 'idle'))}
              className="px-2 py-1 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 text-[11px] font-mono border border-slate-700"
              title="Toggle Animation"
            >
              🏃 {currentAnimation}
            </button>

            <button
              onClick={() => setIsRotating((r) => !r)}
              className={`p-1.5 rounded-md border text-[11px] ${
                isRotating
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Toggle 360 Rotation"
            >
              🔄
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
