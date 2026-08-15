import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Beaker, RotateCcw, Maximize2 } from 'lucide-react';

const SpinalCordLab = () => {
  const navigate = useNavigate();
  const iframeRef = React.useRef(null);

  const [magnification, setMagnification] = React.useState('x20');

  const handleReset = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
      setMagnification('x20');
    }
  };

  const changeMagnification = (level) => {
    setMagnification(level);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'SET_MAGNIFICATION', level }, '*');
    }
  };

  const toggleFullScreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      } else if (iframeRef.current.webkitRequestFullscreen) {
        iframeRef.current.webkitRequestFullscreen();
      } else if (iframeRef.current.msRequestFullscreen) {
        iframeRef.current.msRequestFullscreen();
      }
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#020617', color: '#f1f5f9', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      {/* Header - Compact */}
      <header style={{ 
        height: '56px', borderBottom: '1px solid rgba(30, 41, 59, 0.5)', backgroundColor: 'rgba(15, 23, 42, 0.8)', 
        backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'between', 
        padding: '0 24px', zIndex: 50, flexShrink: 0 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <button 
            onClick={() => navigate(-1)}
            className="hover-bg-slate"
            style={{ 
              padding: '6px', background: 'transparent', border: 'none', borderRadius: '9999px', 
              color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' 
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '8px', 
              background: 'linear-gradient(to bottom right, #06b6d4, #2563eb)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <Beaker size={16} style={{ color: 'white' }} />
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <h1 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#e2e8f0', margin: 0 }}>Phòng Thí Nghiệm Ảo</h1>
              <p style={{ fontSize: '10px', color: '#22d3ee', fontWeight: 500, margin: 0 }}>Tủy sống (Spinal Cord)</p>
            </div>
          </div>
        </div>

        {/* Custom Magnification Controls */}
        <div style={{ 
          display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', 
          padding: '3px', borderRadius: '8px', border: '1px solid #334155', marginRight: '16px' 
        }}>
          {['x20', 'x100', 'x800'].map((level) => (
            <button
              key={level}
              onClick={() => changeMagnification(level)}
              style={{
                padding: '4px 12px', borderRadius: '6px', border: 'none', fontSize: '11px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                backgroundColor: magnification === level ? '#0891b2' : 'transparent',
                color: magnification === level ? 'white' : '#94a3b8',
                boxShadow: magnification === level ? '0 4px 12px rgba(8, 145, 178, 0.3)' : 'none'
              }}
            >
              {level}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={handleReset}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
              backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', 
              color: '#cbd5e1', fontSize: '11px', fontWeight: 500, cursor: 'pointer' 
            }}
          >
            <RotateCcw size={14} />
            <span>Làm mới</span>
          </button>
          <button 
            onClick={toggleFullScreen}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
              backgroundColor: '#0891b2', border: 'none', borderRadius: '6px', 
              color: 'white', fontSize: '11px', fontWeight: 500, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(8, 145, 178, 0.2)'
            }}
          >
            <Maximize2 size={14} />
            <span>Toàn màn hình</span>
          </button>
        </div>
      </header>

      {/* Lab Content - Theater Mode */}
      <main style={{ flex: 1, backgroundColor: '#020617', position: 'relative', overflow: 'hidden' }}>
        <iframe 
          ref={iframeRef}
          src="./external/native/spinal-cord/index.html" 
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Spinal Cord Simulation"
        />
        
        {/* Subtle decorative border focus */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderTop: '1px solid rgba(34, 211, 238, 0.1)' }} />
      </main>

      {/* Mini Status Overlay (Floating) */}
      <div style={{ 
        position: 'absolute', bottom: '8px', left: '8px', display: 'flex', alignItems: 'center', gap: '8px', 
        padding: '4px 10px', backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)', 
        borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.05)', pointerEvents: 'none', zIndex: 100
      }}>
        <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#22d3ee', boxShadow: '0 0 6px #22d3ee' }} />
        <span style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Hệ thống ổn định • Chế độ tập trung
        </span>
      </div>
    </div>
  );
};

export default SpinalCordLab;
