import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Beaker, RotateCcw, Maximize2 } from 'lucide-react';

const CranialCTScanLab = () => {
  const navigate = useNavigate();
  const iframeRef = React.useRef(null);

  const handleReset = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
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
        height: '56px', borderBottom: '1px solid rgba(30, 41, 59, 1)', backgroundColor: 'rgba(15, 23, 42, 1)', 
        display: 'flex', alignItems: 'center', justifyContent: 'between', 
        padding: '0 24px', zIndex: 50, flexShrink: 0 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ 
              padding: '6px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', 
              color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' 
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '8px', 
              background: 'linear-gradient(to bottom right, #0891b2, #0e7490)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <Beaker size={16} style={{ color: 'white' }} />
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <h1 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#e2e8f0', margin: 0 }}>Phòng Thí Nghiệm Ảo</h1>
              <p style={{ fontSize: '10px', color: '#22d3ee', fontWeight: 500, margin: 0 }}>Chụp Cắt Lớp Vi Tính Hộp Sọ</p>
            </div>
          </div>
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
          src="./external/ct-scan/index.html" 
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Cranial CT Scan Simulation"
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

export default CranialCTScanLab;
