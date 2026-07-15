import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Line, Sphere, Html, Float } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import SpatialVector from './Math/SpatialVector';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = {
  red:   '#f43f5e',
  blue:  '#22d3ee',
  green: '#2dd4bf',
  black: '#475569',
  white: '#f1f5f9',
  gray:  '#64748b',
  labelLight: '#0f172a',
  labelDark:  '#f8fafc',
};

// =====================
// Cinematic Camera Controller
// =====================
function CameraController({ highlighted, data }) {
  const { controls, camera } = useThree();

  useFrame(() => {
    if (!controls) return;

    let targetPos = new THREE.Vector3(0, 0, 0); // Default origin

    if (highlighted) {
      if (highlighted.type === 'vertex') {
        const p = data.vertices[highlighted.key];
        if (p) targetPos.set(...p);
      } else if (highlighted.type === 'edge') {
        const [from, to] = highlighted.key.split('-'); // assuming edgeKeys are 'A-B'
        const p1 = data.vertices[from];
        const p2 = data.vertices[to];
        if (p1 && p2) {
          targetPos.set((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2);
        }
      }
    }

    // Smoothly pan camera target
    controls.target.lerp(targetPos, 0.06);

    // If highlighted, slowly dolly in (zoom). If not, slowly dolly out to fit.
    const currentDistance = camera.position.distanceTo(controls.target);
    const targetDistance = highlighted ? 6 : 12; // Adjust desired distances
    
    // Smooth distance adjustment
    const speed = 0.03;
    const diff = targetDistance - currentDistance;
    if (Math.abs(diff) > 0.1) {
      const dir = camera.position.clone().sub(controls.target).normalize();
      camera.position.add(dir.multiplyScalar(diff * speed));
    }
  });

  return null;
}

// =====================
// Animated Edge (fade in per step)
// =====================
function AnimatedEdge({ points, color, lineWidth, dashed, stepIndex, currentStep }) {
  const matRef = useRef();
  const visible = stepIndex == null || currentStep >= stepIndex;

  useFrame(() => {
    if (!matRef.current) return;
    const target = visible ? 0.9 : 0;
    matRef.current.opacity += (target - matRef.current.opacity) * 0.08;
  });

  if (!visible) return null;
  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth || 4}
      dashed={dashed}
      dashScale={1}
      dashSize={0.4}
      gapSize={0.25}
      transparent
      opacity={0.9}
    />
  );
}

// =====================
// Clickable Vertex
// =====================
function ClickableVertex({ name, position, theme, onClick, isHighlighted }) {
  const meshRef = useRef();

  useFrame(() => {
    if (!meshRef.current) return;
    const target = isHighlighted ? 1.5 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.1);
  });

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[0.08, 16, 16]}
        onClick={(e) => { e.stopPropagation(); onClick(name, position, 'vertex', e); }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        <meshStandardMaterial
          color={isHighlighted ? '#fbbf24' : (theme === 'dark' ? '#ffffff' : '#0f172a')}
          emissive={isHighlighted ? '#fbbf24' : (theme === 'dark' ? '#22d3ee' : '#0f172a')}
          emissiveIntensity={isHighlighted ? 3 : (theme === 'dark' ? 0.5 : 0)}
        />
      </Sphere>
      <Html distanceFactor={10}>
        <div
          className={`px-2 py-0.5 rounded border text-[10px] font-bold whitespace-nowrap select-none pointer-events-none transform -translate-x-1/2 -translate-y-full mb-1 shadow-lg transition-all duration-200 ${
            isHighlighted
              ? 'bg-yellow-500/90 border-yellow-300/80 text-black scale-110'
              : theme === 'dark'
                ? 'bg-slate-900/80 border-white/20 text-white backdrop-blur-sm'
                : 'bg-white/90 border-slate-200 text-slate-900 backdrop-blur-sm'
          }`}
        >
          {name}
        </div>
      </Html>
    </group>
  );
}

// =====================
// Clickable Edge (invisible mesh for hit detection)
// =====================
function ClickableEdge({ from, to, color, lineWidth, dashed, onClick, isHighlighted, edgeKey }) {
  const midPoint = useMemo(() => {
    return [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2,
      (from[2] + to[2]) / 2,
    ];
  }, [from, to]);

  const length = useMemo(() => {
    const dx = to[0]-from[0], dy = to[1]-from[1], dz = to[2]-from[2];
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }, [from, to]);

  const glowColor = isHighlighted ? '#fbbf24' : (COLORS[color] || COLORS.blue);
  const finalLineWidth = dashed ? 2.5 : (lineWidth || 4);
  const glowWidth = isHighlighted ? finalLineWidth + 3 : finalLineWidth;

  return (
    <group>
      <Line
        points={[from, to]}
        color={glowColor}
        lineWidth={glowWidth}
        dashed={dashed}
        dashScale={1}
        dashSize={0.4}
        gapSize={0.25}
        transparent
        opacity={isHighlighted ? 1 : (dashed ? 0.6 : 0.8)}
        depthTest={true}
      />
      {/* Invisible wider tube for click detection */}
      <mesh
        position={midPoint}
        onClick={(e) => { e.stopPropagation(); onClick(edgeKey, from, to, 'edge', e); }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        <sphereGeometry args={[0.15, 4, 4]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

// =====================
// Info Tooltip (HTML overlay)
// =====================
function InfoTooltip({ info, onClose }) {
  if (!info) return null;

  const labels = {
    vertex: '📍 Đỉnh',
    edge: '📏 Cạnh',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="fixed z-[150] pointer-events-auto"
      style={{ left: info.screenX + 16, top: info.screenY - 8 }}
    >
      <div
        className="px-4 py-3 rounded-2xl text-sm max-w-[220px]"
        style={{
          background: 'rgba(2,6,23,0.92)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(251,191,36,0.3)',
          boxShadow: '0 0 20px rgba(251,191,36,0.15)',
        }}
      >
        <div className="flex items-center justify-between gap-4 mb-1">
          <span className="text-yellow-400 font-black text-[10px] uppercase tracking-widest">
            {labels[info.type] || '🔷 Object'}
          </span>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xs">✕</button>
        </div>
        <p className="text-white font-bold text-sm">{info.name}</p>
        {info.coords && (
          <p className="text-slate-400 text-[10px] mt-1">
            ({info.coords.map(v => v.toFixed(2)).join(', ')})
          </p>
        )}
        {info.length != null && (
          <p className="text-cyan-400 text-[10px] mt-1">Độ dài ≈ {info.length.toFixed(3)}</p>
        )}
        <p className="text-slate-500 text-[9px] mt-2 italic">{info.hint}</p>
      </div>
    </motion.div>
  );
}

// =====================
// Main GeometryViewer
// =====================
const GeometryViewer = ({ data, currentStep = 0, theme = 'dark', showAxes = true }) => {
  const [highlighted, setHighlighted] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const { camera } = useThree();
  const [backVertex, setBackVertex] = useState(null);

  // Dynamic back-most vertex detection during camera rotation
  useFrame(() => {
    if (!data || !data.vertices) return;
    
    let maxDist = -1;
    let furthestKey = null;
    const camPos = camera.position;
    
    Object.entries(data.vertices).forEach(([key, coords]) => {
      if (!Array.isArray(coords)) return;
      const dx = coords[0] - camPos.x;
      const dy = coords[1] - camPos.y;
      const dz = coords[2] - camPos.z;
      const distSq = dx*dx + dy*dy + dz*dz;
      if (distSq > maxDist) {
        maxDist = distSq;
        furthestKey = key;
      }
    });
    
    if (furthestKey && furthestKey !== backVertex) {
      setBackVertex(furthestKey);
    }
  });

  if (!data || !data.vertices || typeof data.vertices !== 'object') {
    return (
      <Html center>
        <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/5">
          Chưa có dữ liệu không gian
        </div>
      </Html>
    );
  }

  const handleVertexClick = useCallback((name, position, type, event) => {
    // Get mouse coordinates from the three.js event
    const screenX = event.clientX;
    const screenY = event.clientY;
    
    setHighlighted({ key: name, type });
    setTooltip({
      name,
      type,
      coords: position,
      screenX, screenY,
      hint: 'Click vào cạnh hoặc đỉnh khác để so sánh',
    });
  }, []);

  const handleEdgeClick = useCallback((key, from, to, type, event) => {
    const dx = to[0]-from[0], dy = to[1]-from[1], dz = to[2]-from[2];
    const length = Math.sqrt(dx*dx + dy*dy + dz*dz);
    
    const screenX = event.clientX;
    const screenY = event.clientY;
 
    setHighlighted({ key, type });
    setTooltip({
      name: `Cạnh ${key}`,
      type,
      length,
      screenX, screenY,
      hint: 'Đây là cạnh của hình học. Nhấn lại để bỏ chọn.',
    });
  }, []);

  const handleClose = useCallback(() => {
    setHighlighted(null);
    setTooltip(null);
    document.body.style.cursor = 'auto';
  }, []);

  // Base edges with click support
  const baseEdges = useMemo(() => {
    if (!data.edges) return [];
    return data.edges.map((edge, idx) => {
      // edge could be ["A", "B", "color", "style"]
      const [fromKey, toKey, colorKey, styleKey] = Array.isArray(edge) ? edge : [edge[0], edge[1]];
      const p1 = data.vertices[fromKey];
      const p2 = data.vertices[toKey];
      if (!p1 || !p2 || !Array.isArray(p1) || !Array.isArray(p2)) return null;
      const edgeKey = `${fromKey}-${toKey}`;
      const isHighlighted = highlighted?.key === edgeKey;
      const color = colorKey || (theme === 'dark' ? 'black' : 'white');
      
      // Dynamic dashed status based on camera occlusion purely
      const isBackEdge = fromKey === backVertex || toKey === backVertex;
      const dashed = isBackEdge;
      
      return (
        <ClickableEdge
          key={`base-edge-${idx}`}
          edgeKey={edgeKey}
          from={p1} to={p2}
          color={color}
          lineWidth={4}
          dashed={dashed}
          isHighlighted={isHighlighted}
          onClick={handleEdgeClick}
        />
      );
    });
  }, [data, highlighted, handleEdgeClick, theme, backVertex]);

  // Step elements
  const stepElements = useMemo(() => {
    if (!data.steps) return [];
    const elements = [];
    data.steps.forEach((step) => {
      if (step.step_number <= currentStep) {
        step.draw_elements?.forEach((el, elIdx) => {
          const key = `step-${step.step_number}-el-${elIdx}`;
          if (el.type === 'line') {
            const p1 = data.vertices[el.from || el.from_point];
            const p2 = data.vertices[el.to || el.to_point];
            
            // Dynamic dashed status based on camera occlusion
            const isBackEdge = el.from === backVertex || el.to === backVertex || el.from_point === backVertex || el.to_point === backVertex;
            const isDashed = el.style === 'dashed' || isBackEdge;
            
            if (p1 && p2 && Array.isArray(p1) && Array.isArray(p2)) {
              elements.push(
                <Line
                  key={key}
                  points={[p1, p2]}
                  color={COLORS[el.color] || COLORS.red}
                  lineWidth={isDashed ? 2.5 : 4}
                  dashed={isDashed}
                  dashScale={1}
                  dashSize={0.4}
                  gapSize={0.25}
                  transparent
                  opacity={isDashed ? 0.6 : 0.9}
                  depthTest={true}
                />
              );
            }
          } else if (el.type === 'vector' || el.type === 'arrow') {
            const p1 = data.vertices[el.from || el.from_point] || [0, 0, 0];
            const p2 = data.vertices[el.to || el.to_point];
            if (p2) {
              elements.push(
                <SpatialVector key={key} start={p1} end={p2} color={COLORS[el.color] || COLORS.blue} />
              );
            }
          } else if (el.type === 'point') {
            const p = data.vertices[el.name];
            if (p) {
              elements.push(
                <Sphere key={key} position={p} args={[0.08, 16, 16]}>
                  <meshStandardMaterial
                    color={COLORS[el.color] || COLORS.blue}
                    emissive={COLORS[el.color] || COLORS.blue}
                    emissiveIntensity={2}
                  />
                </Sphere>
              );
            }
          }
        });
      }
    });
    return elements;
  }, [data, currentStep, backVertex]);

  // Vector arrows
  const vectorElements = useMemo(() => {
    if (!data.vectors) return [];
    return data.vectors.map((vec, idx) => {
      const origin = new THREE.Vector3(...vec.start);
      const dir = new THREE.Vector3(...vec.direction).normalize();
      const length = vec.length || 2;
      return (
        <primitive
          key={`vector-${idx}`}
          object={new THREE.ArrowHelper(dir, origin, length, 0x22d3ee, 0.2, 0.1)}
        />
      );
    });
  }, [data.vectors]);

  // Vertices with click
  const vertexElements = useMemo(() => {
    return Object.entries(data.vertices).map(([name, coords]) => (
      <ClickableVertex
        key={`vertex-${name}`}
        name={name}
        position={coords}
        theme={theme}
        onClick={handleVertexClick}
        isHighlighted={highlighted?.key === name && highlighted?.type === 'vertex'}
      />
    ));
  }, [data.vertices, theme, highlighted, handleVertexClick]);

  return (
    <>
      <CameraController highlighted={highlighted} data={data} />

      <group onClick={(e) => { if (e.object.isMesh && e.object.geometry.type === 'BoxGeometry') return; }}>
        {showAxes && <axesHelper args={[2]} />}
        <Float speed={1.5} rotationIntensity={0.08} floatIntensity={0.15}>
          {baseEdges}
          {stepElements}
          {vectorElements}
          {vertexElements}
        </Float>
      </group>

      {/* Click outside → deselect */}
      <mesh
        position={[0, 0, -20]}
        onClick={handleClose}
        visible={false}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial />
      </mesh>

      {/* Tooltip overlay via Html - Only render when active to avoid blocking DOM */}
      {tooltip && (
        <Html fullscreen style={{ pointerEvents: 'none' }}>
          <AnimatePresence>
            <InfoTooltip info={tooltip} onClose={handleClose} />
          </AnimatePresence>
        </Html>
      )}
    </>
  );
};

export default GeometryViewer;

