
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wind, RotateCcw, Maximize2, Info, Search } from 'lucide-react';

const RespiratorySystemLab = () => {
  const navigate = useNavigate();
  const iframeRef = React.useRef(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentLabel, setCurrentLabel] = React.useState("");

  React.useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'stateChange') {
        console.log('Simulation state changed:', event.data.label);
        setCurrentLabel(event.data.label);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const isZoomed = currentLabel === "legend7" || currentLabel === "legend8";

  const handleControl = (command) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'control', command }, '*');
    }
  };

  const handleReset = () => {
    handleControl('reset');
    setIsLoading(true);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const toggleFullScreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      } else if (iframeRef.current.webkitRequestFullscreen) {
        iframeRef.current.webkitRequestFullscreen();
      }
    }
  };

  // Theme: sky-blue / cyan for respiratory system
  const accentColor   = '#06b6d4'; // cyan-500
  const accentDark    = '#0e7490'; // cyan-700
  const accentGlow    = 'rgba(6, 182, 212, 0.4)';
  const accentSubtle  = 'rgba(6, 182, 212, 0.08)';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#020617', color: '#f1f5f9', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{
        height: '64px', borderBottom: '1px solid rgba(30, 41, 59, 0.5)', backgroundColor: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', zIndex: 50, flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '10px', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px',
              color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.3s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)'; e.currentTarget.style.color = '#f8fafc'; }}
            onMouseOut={(e)  => { e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.5)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: `linear-gradient(135deg, ${accentColor}, ${accentDark})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 8px 16px ${accentGlow}`
            }}>
              <Wind size={22} style={{ color: 'white' }} />
            </div>
            <div style={{ lineHeight: 1.3 }}>
              <h1 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', margin: 0 }}>Giải phẫu & Sinh lý học</h1>
              <p style={{ fontSize: '15px', color: '#f8fafc', fontWeight: 600, margin: 0 }}>Hệ Hô Hấp</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => handleControl('zoom')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
              color: '#cbd5e1', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
            onMouseOut={(e)  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <Search size={16} style={{ color: accentColor }} />
            <span>{isZoomed ? "Thu nhỏ" : "Phóng to / Thu nhỏ"}</span>
          </button>
          <button
            onClick={handleReset}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
              color: '#cbd5e1', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
            onMouseOut={(e)  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <RotateCcw size={16} />
            <span>Làm mới</span>
          </button>
          <button
            onClick={toggleFullScreen}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              backgroundColor: accentColor, border: 'none', borderRadius: '12px',
              color: '#042f2e', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              boxShadow: `0 4px 20px ${accentGlow}`, transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 28px ${accentGlow}`; }}
            onMouseOut={(e)  => { e.currentTarget.style.transform = 'translateY(0)';   e.currentTarget.style.boxShadow = `0 4px 20px ${accentGlow}`; }}
          >
            <Maximize2 size={16} />
            <span>Toàn màn hình</span>
          </button>
        </div>
      </header>

      {/* Info Bar */}
      <div style={{
        padding: '10px 24px', backgroundColor: accentSubtle,
        borderBottom: `1px solid rgba(6, 182, 212, 0.2)`,
        display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0
      }}>
        <Info size={16} style={{ color: accentColor }} />
        <span style={{ fontSize: '12px', color: '#67e8f9', fontWeight: 500 }}>
          Nhấn ► để bắt đầu chu kỳ hô hấp. Nhấn "Phóng to" để quan sát trao đổi khí ở phế nang.
        </span>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, backgroundColor: '#020617', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        {isLoading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', background: '#000000'
          }}>
            <div style={{
              width: '48px', height: '48px', border: `4px solid rgba(255, 255, 255, 0.1)`,
              borderTopColor: accentColor, borderRadius: '50%', animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite'
            }} />
            <p style={{ marginTop: '20px', fontSize: '13px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.1em' }}>ĐANG TẢI MÔ PHỎNG...</p>
          </div>
        )}

        <div style={{
          width: '100%', height: '100%', maxWidth: '1200px', maxHeight: '900px',
          position: 'relative', borderRadius: '24px', overflow: 'hidden',
          boxShadow: `0 30px 60px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(6, 182, 212, 0.08)`,
          background: '#000000', border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <iframe
            ref={iframeRef}
            src="./external/native/respiratory-system/index.html"
            onLoad={handleIframeLoad}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Respiratory System Simulation"
          />
        </div>

        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '10%', left: '-5%', width: '400px', height: '400px', background: `radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '-5%', width: '500px', height: '500px', background: `radial-gradient(circle, rgba(14,116,144,0.05) 0%, transparent 70%)`, pointerEvents: 'none' }} />
      </main>

      {/* Status Indicator */}
      <div style={{
        position: 'absolute', bottom: '24px', left: '24px', display: 'flex', alignItems: 'center', gap: '14px',
        padding: '8px 16px', backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(16px)',
        borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', pointerEvents: 'none', zIndex: 100,
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
      }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: accentColor, boxShadow: `0 0 12px ${accentColor}`, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
        <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Mô phỏng ổn định • Hệ Hô Hấp
        </span>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
};

export default RespiratorySystemLab;
