import React, { useState, useEffect, useRef } from 'react';
import { 
  Scissors, Play, Pause, RotateCcw, 
  Layers, Sliders, BookOpen, Compass
} from 'lucide-react';
import { useGeometryStore } from '../../store/useGeometryStore';
import { useGeometryAPI } from '../../hooks/useGeometryAPI';

const CrossSectionPanel: React.FC = () => {
  const { 
    plane, 
    setPlane, 
    crossSection, 
    shapeParams, 
    shapeData,
    crossSectionColor,
    setCrossSectionColor
  } = useGeometryStore();
  const { computeSection } = useGeometryAPI();

  const [mode, setMode] = useState<'slider' | 'presets' | 'manual'>('slider');
  const [isScanning, setIsScanning] = useState(false);
  const scanDirectionRef = useRef(1);

  // Lấy chiều cao hiện tại của khối hình
  const heightMax = (shapeParams as any)?.height || (shapeParams as any)?.chieuCao || 6;
  const currentZ = plane.point[2];

  // Tự động tính thiết diện khi plane hoặc shape thay đổi
  useEffect(() => {
    if (shapeData?.vertices?.length) {
      computeSection();
    }
  }, [plane, shapeData]);

  // Xử lý kéo thanh trượt cao độ Z
  const handleSliderZChange = (newZ: number) => {
    setPlane({
      point: [plane.point[0], plane.point[1], newZ]
    });
  };

  // Xử lý kéo góc nghiêng quanh trục X
  const handleTiltChange = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    // Vector pháp tuyến xoay nghiêng
    const nx = 0;
    const ny = -Math.sin(rad);
    const nz = Math.cos(rad);
    setPlane({
      normal: [nx, ny, nz]
    });
  };

  // Chế độ Quét Thiết Diện tự động (Scan Animation)
  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(() => {
      const curPlane = useGeometryStore.getState().plane;
      let nextZ = curPlane.point[2] + 0.08 * scanDirectionRef.current;
      if (nextZ >= heightMax - 0.2) {
        nextZ = heightMax - 0.2;
        scanDirectionRef.current = -1;
      } else if (nextZ <= 0.2) {
        nextZ = 0.2;
        scanDirectionRef.current = 1;
      }
      setPlane({
        point: [curPlane.point[0], curPlane.point[1], Number(nextZ.toFixed(2))]
      });
    }, 40);

    return () => clearInterval(interval);
  }, [isScanning, heightMax, setPlane]);

  // Các bài toán thiết diện mẫu theo SGK Hình học 11
  const applyPreset = (presetType: string) => {
    setIsScanning(false);
    switch (presetType) {
      case 'parallel_base': // Song song đáy qua trung điểm chiều cao
        setPlane({
          normal: [0, 0, 1],
          point: [0, 0, heightMax / 2]
        });
        break;
      case 'midpoint_side': // Qua trung điểm cạnh bên nghiêng 30 độ
        setPlane({
          normal: [0, 0.5, 0.866],
          point: [0, 0, heightMax * 0.4]
        });
        break;
      case 'diagonal_cut': // Cắt chéo vát 45 độ
        setPlane({
          normal: [0.707, 0, 0.707],
          point: [0, 0, heightMax * 0.5]
        });
        break;
      case 'steep_cut': // Cắt dốc đứng qua trục
        setPlane({
          normal: [0.866, 0.5, 0],
          point: [0.5, 0, heightMax * 0.5]
        });
        break;
      default:
        break;
    }
  };

  return (
    <div className="sidebar sidebar-right glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: '#f59e0b' }}>
          <Scissors size={18} />
          <span>Thiết Diện Mặt Cắt 3D</span>
        </div>
        <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', fontWeight: 600 }}>
          SGK Lớp 11
        </span>
      </div>

      {/* Tabs Chế Độ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem', background: 'rgba(0,0,0,0.25)', padding: '0.25rem', borderRadius: '8px' }}>
        <button
          onClick={() => setMode('slider')}
          style={{
            padding: '0.4rem 0.2rem', fontSize: '0.72rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
            background: mode === 'slider' ? '#f59e0b' : 'transparent',
            color: mode === 'slider' ? '#000' : '#94a3b8',
            fontWeight: mode === 'slider' ? 700 : 500,
            transition: 'all 0.2s'
          }}
        >
          <Sliders size={12} style={{ display: 'inline', marginRight: '3px' }} /> Kéo Cắt
        </button>
        <button
          onClick={() => setMode('presets')}
          style={{
            padding: '0.4rem 0.2rem', fontSize: '0.72rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
            background: mode === 'presets' ? '#f59e0b' : 'transparent',
            color: mode === 'presets' ? '#000' : '#94a3b8',
            fontWeight: mode === 'presets' ? 700 : 500,
            transition: 'all 0.2s'
          }}
        >
          <BookOpen size={12} style={{ display: 'inline', marginRight: '3px' }} /> SGK 11
        </button>
        <button
          onClick={() => setMode('manual')}
          style={{
            padding: '0.4rem 0.2rem', fontSize: '0.72rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
            background: mode === 'manual' ? '#f59e0b' : 'transparent',
            color: mode === 'manual' ? '#000' : '#94a3b8',
            fontWeight: mode === 'manual' ? 700 : 500,
            transition: 'all 0.2s'
          }}
        >
          <Compass size={12} style={{ display: 'inline', marginRight: '3px' }} /> Tọa Độ
        </button>
      </div>

      {/* ── Mode 1: Slider Kéo Cắt Trực Quan ── */}
      {mode === 'slider' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <span style={{ color: '#cbd5e1' }}>Cao độ mặt cắt (Z):</span>
              <span style={{ color: '#f59e0b', fontWeight: 700 }}>{currentZ.toFixed(2)} / {heightMax}</span>
            </div>
            <input 
              type="range"
              min={0.1}
              max={Math.max(1, heightMax - 0.1)}
              step={0.05}
              value={currentZ}
              onChange={(e) => handleSliderZChange(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <span style={{ color: '#cbd5e1' }}>Độ nghiêng mặt cắt (Tilt):</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                {Math.round((Math.asin(-plane.normal[1]) * 180) / Math.PI)}°
              </span>
            </div>
            <input 
              type="range"
              min={-60}
              max={60}
              step={1}
              value={Math.round((Math.asin(-plane.normal[1]) * 180) / Math.PI)}
              onChange={(e) => handleTiltChange(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
            />
          </div>

          {/* Nút Scan tự động & Reset */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
            <button
              onClick={() => setIsScanning(!isScanning)}
              style={{
                flex: 1, padding: '0.45rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: isScanning ? '#ef4444' : 'rgba(245,158,11,0.2)',
                color: isScanning ? '#fff' : '#fbbf24',
                fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                borderWidth: '1px', borderStyle: 'solid', borderColor: isScanning ? '#ef4444' : 'rgba(245,158,11,0.4)'
              }}
            >
              {isScanning ? <Pause size={14} /> : <Play size={14} />}
              {isScanning ? 'Dừng quét' : 'Quét tự động'}
            </button>
            <button
              onClick={() => {
                setIsScanning(false);
                setPlane({ normal: [0, 0, 1], point: [0, 0, heightMax / 2] });
              }}
              style={{
                padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer'
              }}
              title="Đặt lại mặt cắt về chính giữa"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Mode 2: Presets Bài Toán SGK 11 ── */}
      {mode === 'presets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={() => applyPreset('parallel_base')}
            style={{
              textAlign: 'left', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <div style={{ fontWeight: 600, color: '#fcd34d' }}>1. Song song với đáy (z = h/2)</div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Mặt cắt đồng dạng hoặc bằng đáy hình khối</div>
          </button>

          <button
            onClick={() => applyPreset('midpoint_side')}
            style={{
              textAlign: 'left', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <div style={{ fontWeight: 600, color: '#fcd34d' }}>2. Qua trung điểm cạnh bên nghiêng</div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Tạo thiết diện hình thang / tam giác</div>
          </button>

          <button
            onClick={() => applyPreset('diagonal_cut')}
            style={{
              textAlign: 'left', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <div style={{ fontWeight: 600, color: '#fcd34d' }}>3. Mặt phẳng vát chéo 45°</div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Khảo sát biến thiên số cạnh thiết diện</div>
          </button>

          <button
            onClick={() => applyPreset('steep_cut')}
            style={{
              textAlign: 'left', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <div style={{ fontWeight: 600, color: '#fcd34d' }}>4. Mặt phẳng thẳng đứng qua trục</div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Thiết diện qua trục khối tròn xoay / chóp</div>
          </button>
        </div>
      )}

      {/* ── Mode 3: Nhập Tọa Độ Tự Do ── */}
      {mode === 'manual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div>
            <label style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Pháp tuyến n⃗(a, b, c):</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem', marginTop: '0.2rem' }}>
              <input 
                type="number" step="0.1" value={plane.normal[0]} 
                onChange={(e) => setPlane({ normal: [parseFloat(e.target.value) || 0, plane.normal[1], plane.normal[2]] })}
                style={{ padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              />
              <input 
                type="number" step="0.1" value={plane.normal[1]} 
                onChange={(e) => setPlane({ normal: [plane.normal[0], parseFloat(e.target.value) || 0, plane.normal[2]] })}
                style={{ padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              />
              <input 
                type="number" step="0.1" value={plane.normal[2]} 
                onChange={(e) => setPlane({ normal: [plane.normal[0], plane.normal[1], parseFloat(e.target.value) || 0] })}
                style={{ padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Điểm M(x₀, y₀, z₀) thuộc (P):</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem', marginTop: '0.2rem' }}>
              <input 
                type="number" step="0.5" value={plane.point[0]} 
                onChange={(e) => setPlane({ point: [parseFloat(e.target.value) || 0, plane.point[1], plane.point[2]] })}
                style={{ padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              />
              <input 
                type="number" step="0.5" value={plane.point[1]} 
                onChange={(e) => setPlane({ point: [plane.point[0], parseFloat(e.target.value) || 0, plane.point[2]] })}
                style={{ padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              />
              <input 
                type="number" step="0.5" value={plane.point[2]} 
                onChange={(e) => setPlane({ point: [plane.point[0], plane.point[1], parseFloat(e.target.value) || 0] })}
                style={{ padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Màu sắc thiết diện */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8' }}>
        <span>Màu đa giác thiết diện:</span>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {['#f59e0b', '#ec4899', '#06b6d4', '#10b981', '#8b5cf6'].map((c) => (
            <button
              key={c}
              onClick={() => setCrossSectionColor(c)}
              style={{
                width: '16px', height: '16px', borderRadius: '50%', background: c,
                border: crossSectionColor === c ? '2px solid #fff' : 'none', cursor: 'pointer'
              }}
            />
          ))}
        </div>
      </div>

      {/* Bảng Kết Quả Thiết Diện Thời Gian Thực */}
      {crossSection && !crossSection.error && crossSection.polygon_vertices.length >= 3 && (
        <div style={{
          padding: '0.75rem', borderRadius: '10px',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          display: 'flex', flexDirection: 'column', gap: '0.4rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fde047', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Layers size={14} /> {crossSection.shape_name}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
              {crossSection.num_vertices} đỉnh
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.2rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Diện tích (S):</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>{crossSection.area}</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Chu vi (P):</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4ade80' }}>{crossSection.perimeter}</div>
            </div>
          </div>

          {/* Tọa độ các đỉnh giao điểm */}
          <div style={{ marginTop: '0.3rem' }}>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Giao điểm trên các cạnh:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxHeight: '70px', overflowY: 'auto' }}>
              {crossSection.polygon_vertices.map((pt, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '0.65rem', fontFamily: 'monospace', padding: '0.15rem 0.35rem',
                    background: 'rgba(255,255,255,0.06)', borderRadius: '4px', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  P{i + 1}({pt[0].toFixed(1)}, {pt[1].toFixed(1)}, {pt[2].toFixed(1)})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {crossSection?.error && (
        <div style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: '0.72rem' }}>
          {crossSection.error}
        </div>
      )}
    </div>
  );
};

export default CrossSectionPanel;
