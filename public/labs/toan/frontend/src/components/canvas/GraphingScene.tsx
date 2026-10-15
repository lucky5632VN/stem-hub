import React, { useMemo, useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import * as math from 'mathjs';
import { 
  ZoomIn, ZoomOut, RotateCcw, Camera, 
  Grid, Sparkles 
} from 'lucide-react';
import { useGeometryStore } from '../../store/useGeometryStore';

// ─── Fast JIT Math Function Compiler (1000x faster than mathjs in loops) ─────
function compileFast(formula: string): ((x: number) => number | null) | null {
  try {
    let clean = formula.trim().toLowerCase()
      .replace(/\s+/g, '')
      .replace(/(\d)([a-z(])/g, '$1*$2')
      .replace(/(\))([a-z\d(])/g, '$1*$2')
      .replace(/\^/g, '**');

    // Safe Math scope
    const safeMath = `const { sin, cos, tan, asin, acos, atan, sinh, cosh, tanh, exp, log, ln = Math.log, sqrt, abs, PI, E } = Math;`;
    const fn = new Function('x', `${safeMath}; try { const y = (${clean}); return (typeof y === 'number' && isFinite(y) && !isNaN(y)) ? y : null; } catch { return null; }`);
    
    // Quick validation
    const testVal = fn(1);
    if (testVal === undefined) return null;
    return fn as any;
  } catch {
    return null;
  }
}

// ─── Multi-Curve Plotter ──────────────────────────────────────────────────
const PlotMulti: React.FC<{ zoom: number; showKeyPoints: boolean }> = ({ zoom, showKeyPoints }) => {
  const { expressions, x0 } = useGeometryStore();

  return (
    <group>
      {expressions.map((exp, idx) => {
        if (!exp.visible || !exp.formula) return null;

        return (
          <ExpressionLayer 
            key={exp.id || idx} 
            formula={exp.formula} 
            color={exp.color || '#58a6ff'} 
            x0={x0} 
            zoom={zoom}
            showKeyPoints={showKeyPoints && idx === 0}
          />
        );
      })}
    </group>
  );
};

// ─── Single Expression Layer with Neon Glow & Key Points ───────────────────
interface ExpressionLayerProps {
  formula: string;
  color: string;
  x0: number;
  zoom: number;
  showKeyPoints: boolean;
}

const ExpressionLayer: React.FC<ExpressionLayerProps> = ({ 
  formula, 
  color, 
  x0, 
  zoom,
  showKeyPoints 
}) => {
  const { size, camera } = useThree();
  
  // Debounce formula to prevent freeze while typing
  const [debouncedFormula, setDebouncedFormula] = useState(formula);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFormula(formula), 60);
    return () => clearTimeout(timer);
  }, [formula]);

  const isImplicit = useMemo(() => {
    return debouncedFormula.includes('=') || debouncedFormula.includes('y');
  }, [debouncedFormula]);

  // Fast evaluation function
  const fastFn = useMemo(() => {
    if (isImplicit) return null;
    return compileFast(debouncedFormula);
  }, [debouncedFormula, isImplicit]);

  // Fallback mathjs code
  const mathjsCompiled = useMemo(() => {
    if (fastFn || isImplicit) return null;
    try {
      const node = math.parse(debouncedFormula);
      return node.compile();
    } catch {
      return null;
    }
  }, [debouncedFormula, fastFn, isImplicit]);

  // Evaluate function at x
  const evalY = useCallback((x: number): number | null => {
    if (fastFn) return fastFn(x);
    if (mathjsCompiled) {
      try {
        const val = mathjsCompiled.evaluate({ x });
        return (typeof val === 'number' && isFinite(val) && !isNaN(val)) ? val : null;
      } catch {
        return null;
      }
    }
    return null;
  }, [fastFn, mathjsCompiled]);

  // 1. Implicit Curve marching squares
  const implicitSegments = useMemo(() => {
    if (!isImplicit) return null;
    const lines: [number, number, number][][] = [];
    try {
      let eq = debouncedFormula;
      if (debouncedFormula.includes('=')) {
        const parts = debouncedFormula.split('=');
        eq = `(${parts[0]}) - (${parts[1]})`;
      }
      const node = math.parse(eq);
      const code = node.compile();

      const centerX = camera.position.x;
      const centerY = camera.position.y;
      const halfW = (size.width / zoom);
      const halfH = (size.height / zoom);
      
      const range = Math.max(halfW, halfH) * 2.2;
      const baseRes = 260; // Smooth resolution
      const step = range / baseRes;
      
      const startX = centerX - range / 2;
      const startY = centerY - range / 2;

      const evalAt = (x: number, y: number) => {
        try {
          const val = code.evaluate({ x, y });
          return typeof val === 'number' ? val : NaN;
        } catch { return NaN; }
      };

      const lerp = (p1: [number, number], p2: [number, number], v1: number, v2: number): [number, number, number] => {
        const t = Math.abs(v1) / (Math.abs(v1) + Math.abs(v2) || 1e-15);
        return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1]), 0];
      };

      const processCell = (x0: number, y0: number, x1: number, y1: number, v1: number, v2: number, v3: number, v4: number, currentLines: [number, number, number][][]) => {
        if (isNaN(v1) || isNaN(v2) || isNaN(v3) || isNaN(v4)) return;
        
        let caseIndex = 0;
        if (v1 > 0) caseIndex |= 1;
        if (v2 > 0) caseIndex |= 2;
        if (v3 > 0) caseIndex |= 4;
        if (v4 > 0) caseIndex |= 8;

        if (caseIndex === 0 || caseIndex === 15) return;

        const p1: [number, number] = [x0, y0];
        const p2: [number, number] = [x1, y0];
        const p3: [number, number] = [x1, y1];
        const p4: [number, number] = [x0, y1];

        const bottom = lerp(p1, p2, v1, v2);
        const right = lerp(p2, p3, v2, v3);
        const top = lerp(p3, p4, v3, v4);
        const left = lerp(p4, p1, v4, v1);

        switch (caseIndex) {
          case 1: case 14: currentLines.push([left, bottom]); break;
          case 2: case 13: currentLines.push([bottom, right]); break;
          case 3: case 12: currentLines.push([left, right]); break;
          case 4: case 11: currentLines.push([top, right]); break;
          case 5: currentLines.push([left, top], [bottom, right]); break;
          case 6: case 9: currentLines.push([top, bottom]); break;
          case 7: case 8: currentLines.push([left, top]); break;
          case 10: currentLines.push([left, bottom], [top, right]); break;
        }
      };

      for (let j = 0; j < baseRes; j++) {
        const y0 = startY + j * step;
        const y1 = startY + (j + 1) * step;
        for (let i = 0; i < baseRes; i++) {
          const x0 = startX + i * step;
          const x1 = startX + (i + 1) * step;

          const v1 = evalAt(x0, y0);
          const v2 = evalAt(x1, y0);
          const v3 = evalAt(x1, y1);
          const v4 = evalAt(x0, y1);

          if (isNaN(v1) || isNaN(v2) || isNaN(v3) || isNaN(v4)) continue;

          let caseIndex = 0;
          if (v1 > 0) caseIndex |= 1;
          if (v2 > 0) caseIndex |= 2;
          if (v3 > 0) caseIndex |= 4;
          if (v4 > 0) caseIndex |= 8;

          if (caseIndex !== 0 && caseIndex !== 15) {
            const subRes = 6;
            const subStep = step / subRes;
            for (let sj = 0; sj < subRes; sj++) {
              for (let si = 0; si < subRes; si++) {
                const sx0 = x0 + si * subStep;
                const sx1 = x0 + (si + 1) * subStep;
                const sy0 = y0 + sj * subStep;
                const sy1 = y0 + (sj + 1) * subStep;
                
                processCell(sx0, sy0, sx1, sy1, evalAt(sx0, sy0), evalAt(sx1, sy0), evalAt(sx1, sy1), evalAt(sx0, sy1), lines);
              }
            }
          }
        }
      }
    } catch {}
    return lines;
  }, [debouncedFormula, isImplicit, size, zoom, camera.position.x, camera.position.y]);

  // 2. High-precision explicit curve points
  const explicitPoints = useMemo(() => {
    if (isImplicit) return [];
    const pts: [number, number, number][] = [];
    
    const centerX = camera.position.x;
    const viewWidth = size.width / zoom;
    const xMin = centerX - viewWidth * 1.5;
    const xMax = centerX + viewWidth * 1.5;
    
    // High-density sampling (2500 points)
    const steps = 2500;
    const step = (xMax - xMin) / steps;
    
    let prevY: number | null = null;

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step;
      const y = evalY(x);

      if (y !== null && Math.abs(y) < 10000) {
        // Detect sharp vertical discontinuity (asymptote like 1/x, tan(x))
        if (prevY !== null && Math.abs(y - prevY) > (size.height / zoom) * 1.8 && (y * prevY < 0)) {
          pts.push([NaN, NaN, NaN] as any);
        }
        pts.push([x, y, 0]);
        prevY = y;
      } else {
        if (pts.length > 0 && !isNaN(pts[pts.length - 1][0])) {
          pts.push([NaN, NaN, NaN] as any);
        }
        prevY = null;
      }
    }
    return pts;
  }, [isImplicit, evalY, camera.position.x, size.width, size.height, zoom]);

  // 3. Tangent Line & Tangent Point
  const tangentData = useMemo(() => {
    if (isImplicit) return null;
    const y0 = evalY(x0);
    if (y0 === null) return null;

    // Numerical derivative
    const h = 1e-5;
    const yPlus = evalY(x0 + h);
    const yMinus = evalY(x0 - h);
    if (yPlus === null || yMinus === null) return null;
    const k = (yPlus - yMinus) / (2 * h);

    const length = Math.max(5, (size.width / zoom) * 0.4);
    return {
      p1: [x0 - length, y0 - k * length, 0] as [number, number, number],
      p2: [x0 + length, y0 + k * length, 0] as [number, number, number],
      y0,
      k,
    };
  }, [isImplicit, evalY, x0, size.width, zoom]);

  // 4. Characteristic Key Points (Roots & Extrema)
  const keyPoints = useMemo(() => {
    if (!showKeyPoints || isImplicit) return [];
    const points: Array<{ x: number; y: number; type: 'root' | 'extrema'; label: string }> = [];

    const centerX = camera.position.x;
    const viewWidth = size.width / zoom;
    const minX = centerX - viewWidth;
    const maxX = centerX + viewWidth;
    const scanSteps = 200;
    const dx = (maxX - minX) / scanSteps;

    let prevY = evalY(minX);
    let prevSlope: number | null = null;

    for (let i = 0; i < scanSteps; i++) {
      const x1 = minX + i * dx;
      const x2 = x1 + dx;
      const y2 = evalY(x2);

      // Root detection (Sign change)
      if (prevY !== null && y2 !== null && prevY * y2 <= 0 && Math.abs(prevY - y2) < 20) {
        const rootX = (x1 + x2) / 2;
        if (!points.some(p => Math.abs(p.x - rootX) < 0.2)) {
          points.push({
            x: Number(rootX.toFixed(2)),
            y: 0,
            type: 'root',
            label: `(${rootX.toFixed(2)}, 0)`,
          });
        }
      }

      // Extrema detection (Derivative sign change)
      if (y2 !== null && prevY !== null) {
        const currentSlope = (y2 - prevY) / dx;
        if (prevSlope !== null && prevSlope * currentSlope < 0) {
          const extX = (x1 + x2) / 2;
          const extY = evalY(extX);
          if (extY !== null && !points.some(p => Math.abs(p.x - extX) < 0.2)) {
            points.push({
              x: Number(extX.toFixed(2)),
              y: Number(extY.toFixed(2)),
              type: 'extrema',
              label: `(${extX.toFixed(2)}, ${extY.toFixed(2)})`,
            });
          }
        }
        prevSlope = currentSlope;
      }

      prevY = y2;
    }
    return points;
  }, [showKeyPoints, isImplicit, evalY, camera.position.x, size.width, zoom]);

  // 5. Implicit geometry buffer
  const implicitGeometry = useMemo(() => {
    if (!isImplicit || !implicitSegments || implicitSegments.length === 0) return null;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(implicitSegments.length * 2 * 3);
    for (let i = 0; i < implicitSegments.length; i++) {
      const seg = implicitSegments[i];
      positions[i * 6 + 0] = seg[0][0];
      positions[i * 6 + 1] = seg[0][1];
      positions[i * 6 + 2] = seg[0][2];
      positions[i * 6 + 3] = seg[1][0];
      positions[i * 6 + 4] = seg[1][1];
      positions[i * 6 + 5] = seg[1][2];
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [isImplicit, implicitSegments]);

  return (
    <group>
      {/* Implicit Curve */}
      {isImplicit && implicitGeometry && (
        <group>
          {/* Subtle Outer Bloom */}
          <lineSegments geometry={implicitGeometry}>
            <lineBasicMaterial color={color} linewidth={6} transparent opacity={0.3} />
          </lineSegments>
          {/* Sharp Core */}
          <lineSegments geometry={implicitGeometry}>
            <lineBasicMaterial color={color} linewidth={2.5} transparent opacity={0.95} />
          </lineSegments>
        </group>
      )}

      {/* Explicit Curve with Multi-layer Neon Glow */}
      {!isImplicit && explicitPoints.length > 0 && (
        <group>
          {/* Layer 1: Wide Soft Neon Halo */}
          <Line 
            points={explicitPoints as any} 
            color={color} 
            lineWidth={7} 
            transparent 
            opacity={0.18} 
          />
          {/* Layer 2: Mid Bloom */}
          <Line 
            points={explicitPoints as any} 
            color={color} 
            lineWidth={4} 
            transparent 
            opacity={0.4} 
          />
          {/* Layer 3: Razor Sharp Core Line */}
          <Line 
            points={explicitPoints as any} 
            color={color} 
            lineWidth={2.2} 
            transparent 
            opacity={1.0} 
          />
        </group>
      )}
      
      {/* Tangent Line with High-tech Glow */}
      {tangentData && (
        <group>
          {/* Tangent Line Halo */}
          <Line 
            points={[tangentData.p1, tangentData.p2] as any} 
            color="#22d3ee" 
            lineWidth={3.5} 
            dashed 
            dashScale={0.8} 
            opacity={0.25} 
            transparent 
          />
          {/* Sharp Tangent Line */}
          <Line 
            points={[tangentData.p1, tangentData.p2] as any} 
            color="#06b6d4" 
            lineWidth={1.8} 
            dashed 
            dashScale={0.8} 
            opacity={0.85} 
            transparent 
          />

          {/* Glowing Tangent Point */}
          <mesh position={[x0, tangentData.y0, 0]}>
            <sphereGeometry args={[8 / zoom, 16, 16]} />
            <meshBasicMaterial color="#22d3ee" />
          </mesh>
          <mesh position={[x0, tangentData.y0, 0]}>
            <ringGeometry args={[9 / zoom, 13 / zoom, 24]} />
            <meshBasicMaterial color="#06b6d4" transparent opacity={0.5} />
          </mesh>

          {/* Tangent Point Tooltip */}
          <Html position={[x0, tangentData.y0, 0]} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(8, 12, 28, 0.88)',
              border: '1px solid rgba(6, 182, 212, 0.5)',
              borderRadius: '8px',
              padding: '2px 8px',
              color: '#22d3ee',
              fontSize: '10px',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              transform: 'translate(10px, -24px)',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)',
              backdropFilter: 'blur(8px)',
              fontWeight: 700,
            }}>
              k = {tangentData.k.toFixed(2)} • ({x0.toFixed(1)}, {tangentData.y0.toFixed(1)})
            </div>
          </Html>
        </group>
      )}

      {/* Characteristic Key Points (Roots & Extrema) */}
      {keyPoints.map((pt, i) => (
        <group key={`kp-${i}`} position={[pt.x, pt.y, 0]}>
          <mesh>
            <sphereGeometry args={[6 / zoom, 16, 16]} />
            <meshBasicMaterial color={pt.type === 'root' ? '#f59e0b' : '#a855f7'} />
          </mesh>
          <mesh>
            <ringGeometry args={[7 / zoom, 11 / zoom, 20]} />
            <meshBasicMaterial 
              color={pt.type === 'root' ? '#fbbf24' : '#c084fc'} 
              transparent 
              opacity={0.4} 
            />
          </mesh>
          <Html zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: pt.type === 'root' ? 'rgba(245, 158, 11, 0.9)' : 'rgba(168, 85, 247, 0.9)',
              color: '#000000',
              padding: '1px 5px',
              borderRadius: '4px',
              fontSize: '9px',
              fontFamily: 'monospace',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              transform: 'translate(6px, -18px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}>
              {pt.type === 'root' ? `Giao Ox ${pt.label}` : `Cực trị ${pt.label}`}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
};

// ─── Adaptive Coordinate Grid (Cyberpunk Neon Subdivisions) ────────────────
const calculateStep = (zoom: number, width: number) => {
  if (!zoom || !width || zoom <= 0 || width <= 0) return 1;
  const unitsVisible = width / zoom;
  const rawStep = unitsVisible / 10; 
  if (rawStep <= 0 || isNaN(rawStep)) return 1;

  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  
  let step = magnitude;
  if (normalized > 7) step = 10 * magnitude;
  else if (normalized > 3) step = 5 * magnitude;
  else if (normalized > 1.5) step = 2 * magnitude;
  
  return step || 1;
};

const GridManual: React.FC<{ zoom: number }> = ({ zoom }) => {
  const size = useThree((state) => state.size);
  const step = calculateStep(zoom, size.width);
  const subStep = step / 5;
  
  const majorLines: [number, number, number][][] = [];
  const minorLines: [number, number, number][][] = [];
  
  const unitsVisible = size.width / zoom;
  const rawStep = unitsVisible / 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  const alpha = Math.min(1, Math.max(0, (normalized - 1) * 2));

  const rangeX = (size.width / zoom) * 2;
  const rangeY = (size.height / zoom) * 2;
  const range = Math.max(rangeX, rangeY, 120);

  for (let x = -range; x <= range; x = Math.round((x + subStep) * 1000) / 1000) {
    if (Math.abs(x) < 0.0001) continue; 
    const isMajor = Math.abs(x % step) < 0.001 || Math.abs(Math.abs(x % step) - step) < 0.001;
    const pts: [[number, number, number], [number, number, number]] = [[x, -range, 0], [x, range, 0]];
    if (isMajor) majorLines.push(pts);
    else minorLines.push(pts);
  }

  for (let y = -range; y <= range; y = Math.round((y + subStep) * 1000) / 1000) {
    if (Math.abs(y) < 0.0001) continue; 
    const isMajor = Math.abs(y % step) < 0.001 || Math.abs(Math.abs(y % step) - step) < 0.001;
    const pts: [[number, number, number], [number, number, number]] = [[-range, y, 0], [range, y, 0]];
    if (isMajor) majorLines.push(pts);
    else minorLines.push(pts);
  }

  const majorGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(majorLines.length * 2 * 3);
    majorLines.forEach((l, i) => {
      pos[i*6+0]=l[0][0]; pos[i*6+1]=l[0][1]; pos[i*6+2]=l[0][2];
      pos[i*6+3]=l[1][0]; pos[i*6+4]=l[1][1]; pos[i*6+5]=l[1][2];
    });
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, [majorLines]);

  const minorGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(minorLines.length * 2 * 3);
    minorLines.forEach((l, i) => {
      pos[i*6+0]=l[0][0]; pos[i*6+1]=l[0][1]; pos[i*6+2]=l[0][2];
      pos[i*6+3]=l[1][0]; pos[i*6+4]=l[1][1]; pos[i*6+5]=l[1][2];
    });
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, [minorLines]);

  return (
    <group>
      {/* Minor Sub-grid with subtle violet tint */}
      <lineSegments geometry={minorGeometry}>
        <lineBasicMaterial color="#312e81" transparent opacity={0.22 * alpha} />
      </lineSegments>
      {/* Major Grid with sleek neon blue contrast */}
      <lineSegments geometry={majorGeometry}>
        <lineBasicMaterial color="#38bdf8" transparent opacity={0.16} />
      </lineSegments>
    </group>
  );
};

// ─── Sticky Axis Labels & Arrow Heads ──────────────────────────────────────
const AxisLabels: React.FC<{ zoom: number }> = React.memo(({ zoom }) => {
  const { size, camera } = useThree();
  const [, setTick] = useState(0);
  const lastPos = useRef(new THREE.Vector3());
  
  useFrame(() => {
    if (camera.position.distanceToSquared(lastPos.current) > 0.0001) {
      lastPos.current.copy(camera.position);
      setTick(t => t + 1);
    }
  });

  const step = calculateStep(zoom, size.width);
  const labels: React.ReactNode[] = [];
  
  const centerX = camera.position.x;
  const centerY = camera.position.y;
  const halfW = (size.width / zoom) / 2;
  const halfH = (size.height / zoom) / 2;
  
  const minX = centerX - halfW;
  const maxX = centerX + halfW;
  const minY = centerY - halfH;
  const maxY = centerY + halfH;
  
  const fontSize = Math.max(10, Math.min(12, 120 / zoom + 9));
  const labelColor = '#94a3b8';

  const stickyY = Math.max(minY + (20/zoom), Math.min(maxY - (40/zoom), 0));
  const stickyX = Math.max(minX + (40/zoom), Math.min(maxX - (20/zoom), 0));

  // X-axis number labels
  const startX = Math.ceil(minX / step) * step;
  for (let x = startX; x <= maxX; x += step) {
    const val = Math.round(x * 1000) / 1000;
    if (Math.abs(val) < step / 10) continue;
    labels.push(
      <Html key={`x-${val}`} position={[val, stickyY, 0]} center transform zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ 
          color: labelColor, fontSize: `${fontSize}px`, 
          transform: 'translateY(16px)', userSelect: 'none', fontWeight: 600,
          fontFamily: 'monospace'
        }}>{val}</div>
      </Html>
    );
  }
  
  // Y-axis number labels
  const startY = Math.ceil(minY / step) * step;
  for (let y = startY; y <= maxY; y += step) {
    const val = Math.round(y * 1000) / 1000;
    if (Math.abs(val) < step / 10) continue;
    labels.push(
      <Html key={`y-${val}`} position={[stickyX, val, 0]} center transform zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ 
          color: labelColor, fontSize: `${fontSize}px`, 
          transform: 'translateX(-22px)', userSelect: 'none', fontWeight: 600,
          fontFamily: 'monospace'
        }}>{val}</div>
      </Html>
    );
  }
  
  // Origin '0'
  labels.push(
    <Html key="origin" position={[stickyX, stickyY, 0]} center transform zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div style={{ 
        color: '#38bdf8', fontSize: `${fontSize + 1}px`, 
        transform: 'translate(-12px, 12px)', userSelect: 'none', fontWeight: 800,
        fontFamily: 'monospace'
      }}>0</div>
    </Html>
  );

  // Ox and Oy Axis End Names
  labels.push(
    <Html key="axis-x-name" position={[maxX - (15 / zoom), stickyY, 0]} center transform zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div style={{ color: '#06b6d4', fontSize: '13px', fontWeight: 800, transform: 'translate(10px, -12px)', userSelect: 'none' }}>
        +X
      </div>
    </Html>
  );
  labels.push(
    <Html key="axis-y-name" position={[stickyX, maxY - (15 / zoom), 0]} center transform zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div style={{ color: '#06b6d4', fontSize: '13px', fontWeight: 800, transform: 'translate(12px, -10px)', userSelect: 'none' }}>
        +Y
      </div>
    </Html>
  );

  return <>{labels}</>;
});

// ─── Camera Drag & Wheel Controls (Desmos Smooth Pan/Zoom) ──────────────────
interface GraphControlsProps {
  setZoom: (z: number) => void;
  resetSignal: number;
}

const GraphControls: React.FC<GraphControlsProps> = ({ setZoom, resetSignal }) => {
  const { camera, gl, size } = useThree();
  const isDragging = useRef(false);

  // Handle reset signal from external buttons
  useEffect(() => {
    if (resetSignal > 0) {
      camera.zoom = 60;
      camera.position.set(0, 0, 100);
      camera.updateProjectionMatrix();
      setZoom(60);
    }
  }, [resetSignal, camera, setZoom]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // World point under mouse before zoom
      const preZoomWorld = new THREE.Vector3(x, y, 0).unproject(camera);

      // Smooth zoom factor
      const zoomFactor = e.deltaY > 0 ? 0.88 : 1.13;
      const newZoom = Math.min(Math.max(camera.zoom * zoomFactor, 0.05), 50000);
      
      camera.zoom = newZoom;
      camera.updateProjectionMatrix();
      setZoom(newZoom);

      // World point under mouse after zoom
      const postZoomWorld = new THREE.Vector3(x, y, 0).unproject(camera);
      
      // Shift camera to keep world point fixed under mouse
      camera.position.x += preZoomWorld.x - postZoomWorld.x;
      camera.position.y += preZoomWorld.y - postZoomWorld.y;
    };

    const handleDown = (e: PointerEvent) => {
      if (e.button === 0 || e.button === 1 || e.button === 2) {
        isDragging.current = true;
        gl.domElement.setPointerCapture(e.pointerId);
        gl.domElement.style.cursor = 'grabbing';
      }
    };

    const handleUp = (e: PointerEvent) => {
      isDragging.current = false;
      gl.domElement.releasePointerCapture(e.pointerId);
      gl.domElement.style.cursor = 'grab';
    };

    const handleMove = (e: PointerEvent) => {
      if (!isDragging.current) return;

      const scaleX = (camera as any).right - (camera as any).left;
      const scaleY = (camera as any).top - (camera as any).bottom;
      
      camera.position.x -= (e.movementX / size.width) * (scaleX / camera.zoom);
      camera.position.y += (e.movementY / size.height) * (scaleY / camera.zoom);
    };

    gl.domElement.style.cursor = 'grab';
    gl.domElement.addEventListener('wheel', handleWheel, { passive: false });
    gl.domElement.addEventListener('pointerdown', handleDown);
    gl.domElement.addEventListener('pointermove', handleMove);
    gl.domElement.addEventListener('pointerup', handleUp);

    return () => {
      gl.domElement.removeEventListener('wheel', handleWheel);
      gl.domElement.removeEventListener('pointerdown', handleDown);
      gl.domElement.removeEventListener('pointermove', handleMove);
      gl.domElement.removeEventListener('pointerup', handleUp);
    };
  }, [camera, gl, size, setZoom]);

  return null;
};

// ─── Live Cursor Coordinate Tracker ─────────────────────────────────────────
const CoordinateTracker: React.FC = () => {
  const { camera, gl } = useThree();
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const world = new THREE.Vector3(x, y, 0).unproject(camera);
      setCoords({ x: world.x, y: world.y });
      setVisible(true);
    };

    const handleLeave = () => setVisible(false);

    gl.domElement.addEventListener('mousemove', handleMove);
    gl.domElement.addEventListener('mouseleave', handleLeave);
    return () => {
      gl.domElement.removeEventListener('mousemove', handleMove);
      gl.domElement.removeEventListener('mouseleave', handleLeave);
    };
  }, [camera, gl]);

  if (!visible) return null;

  return (
    <Html position={[coords.x, coords.y, 0]} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div style={{
        background: 'rgba(10, 14, 26, 0.88)',
        color: '#f8fafc',
        padding: '3px 9px',
        borderRadius: '8px',
        fontSize: '11px',
        whiteSpace: 'nowrap',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        transform: 'translate(14px, -28px)',
        fontFamily: 'JetBrains Mono, monospace',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8' }} />
        <span>({coords.x.toFixed(2)}, {coords.y.toFixed(2)})</span>
      </div>
    </Html>
  );
};

// ─── Main Graphing Scene Component with HUD Controls ────────────────────────
const GraphingScene: React.FC = () => {
  const [zoom, setZoom] = useState(60);
  const [resetSignal, setResetSignal] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [showKeyPoints, setShowKeyPoints] = useState(true);

  // Zoom handlers
  const handleZoomIn = () => {
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: -120 }));
  };
  const handleZoomOut = () => {
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: 120 }));
  };
  const handleReset = () => {
    setResetSignal(s => s + 1);
  };

  // Export high-res PNG snapshot
  const handleExportPNG = () => {
    const canvas = document.querySelector('.graph-canvas-inner canvas') as HTMLCanvasElement;
    if (!canvas) return;
    try {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `STEM_HUB_Do_Thi_${Date.now()}.png`;
      a.click();
    } catch (e) {
      console.warn('Cannot export canvas:', e);
    }
  };

  return (
    <div 
      className="canvas-container graph-canvas-inner" 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        overflow: 'hidden', 
        background: 'radial-gradient(ellipse at center, #110d24 0%, #070510 100%)' 
      }}
    >
      {/* 3D WebGL Canvas */}
      <Canvas 
        shadows 
        orthographic 
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        camera={{ zoom: 60, position: [0, 0, 100], near: 0.1, far: 2000 }} 
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <GraphControls setZoom={setZoom} resetSignal={resetSignal} />
          
          <ambientLight intensity={0.8} />
          
          {/* Coordinate Grid */}
          {showGrid && <GridManual zoom={zoom} />}

          {/* Glowing Principal Axes X and Y */}
          {/* Outer glow Ox */}
          <Line points={[[-5000, 0, 0], [5000, 0, 0]]} color="#06b6d4" lineWidth={5} opacity={0.2} transparent />
          {/* Core line Ox */}
          <Line points={[[-5000, 0, 0], [5000, 0, 0]]} color="#38bdf8" lineWidth={2} opacity={0.85} transparent />
          
          {/* Outer glow Oy */}
          <Line points={[[0, -5000, 0], [0, 5000, 0]]} color="#06b6d4" lineWidth={5} opacity={0.2} transparent />
          {/* Core line Oy */}
          <Line points={[[0, -5000, 0], [0, 5000, 0]]} color="#38bdf8" lineWidth={2} opacity={0.85} transparent />

          {/* Central Origin Glow Badge */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[4 / zoom, 16, 16]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>

          <AxisLabels zoom={zoom} />
          <CoordinateTracker />
          <PlotMulti zoom={zoom} showKeyPoints={showKeyPoints} />
        </Suspense>
      </Canvas>

      {/* Floating Modern HUD Toolbar */}
      <div 
        style={{
          position: 'absolute',
          top: '1.2rem',
          right: '1.2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 40,
        }}
      >
        <div 
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(88, 166, 255, 0.35)',
            borderRadius: '12px',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.55)',
            boxSizing: 'border-box'
          }}
        >
          <button
            className="graphing-toolbar-btn"
            onClick={handleZoomIn}
            title="Phóng to (+)"
            style={{
              width: 38, height: 38, minWidth: 38, minHeight: 38, padding: 0,
              borderRadius: 8, border: 'none', background: 'transparent',
              color: '#f0f6fc', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s', boxSizing: 'border-box'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(88, 166, 255, 0.25)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <ZoomIn size={18} strokeWidth={2.2} />
          </button>

          <button
            className="graphing-toolbar-btn"
            onClick={handleZoomOut}
            title="Thu nhỏ (-)"
            style={{
              width: 38, height: 38, minWidth: 38, minHeight: 38, padding: 0,
              borderRadius: 8, border: 'none', background: 'transparent',
              color: '#f0f6fc', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s', boxSizing: 'border-box'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(88, 166, 255, 0.25)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <ZoomOut size={18} strokeWidth={2.2} />
          </button>

          <button
            className="graphing-toolbar-btn"
            onClick={handleReset}
            title="Căn giữa gốc tọa độ (0, 0)"
            style={{
              width: 38, height: 38, minWidth: 38, minHeight: 38, padding: 0,
              borderRadius: 8, border: 'none', background: 'transparent',
              color: '#f0f6fc', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s', boxSizing: 'border-box'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(88, 166, 255, 0.25)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <RotateCcw size={17} strokeWidth={2.2} />
          </button>

          <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.12)', margin: '2px 0' }} />

          <button
            className="graphing-toolbar-btn"
            onClick={() => setShowGrid(!showGrid)}
            title={showGrid ? "Tắt lưới tọa độ" : "Bật lưới tọa độ"}
            style={{
              width: 38, height: 38, minWidth: 38, minHeight: 38, padding: 0,
              borderRadius: 8, border: 'none', 
              background: showGrid ? 'rgba(56, 189, 248, 0.22)' : 'transparent',
              color: showGrid ? '#38bdf8' : '#8b949e', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s', boxSizing: 'border-box'
            }}
          >
            <Grid size={18} strokeWidth={2.2} />
          </button>

          <button
            className="graphing-toolbar-btn"
            onClick={() => setShowKeyPoints(!showKeyPoints)}
            title={showKeyPoints ? "Tắt điểm cực trị & nghiệm" : "Bật điểm cực trị & nghiệm"}
            style={{
              width: 38, height: 38, minWidth: 38, minHeight: 38, padding: 0,
              borderRadius: 8, border: 'none', 
              background: showKeyPoints ? 'rgba(168, 85, 247, 0.28)' : 'transparent',
              color: showKeyPoints ? '#c084fc' : '#8b949e', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s', boxSizing: 'border-box'
            }}
          >
            <Sparkles size={18} strokeWidth={2.2} />
          </button>

          <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.12)', margin: '2px 0' }} />

          <button
            className="graphing-toolbar-btn"
            onClick={handleExportPNG}
            title="Xuất ảnh PNG đồ thị sắc nét"
            style={{
              width: 38, height: 38, minWidth: 38, minHeight: 38, padding: 0,
              borderRadius: 8, border: 'none', background: 'transparent',
              color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s', boxSizing: 'border-box'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(52, 211, 153, 0.25)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Camera size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* Zoom Factor Pill */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '2px 6px',
          color: '#94a3b8',
          fontSize: '10px',
          fontFamily: 'monospace',
          textAlign: 'center',
          userSelect: 'none',
        }}>
          {Math.round(zoom)} px/đv
        </div>
      </div>
    </div>
  );
};

export default GraphingScene;
