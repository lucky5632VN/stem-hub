import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, RotateCcw, Maximize2 } from 'lucide-react';

const MaleReproductiveLab = () => {
  const navigate = useNavigate();
  const iframeRef = React.useRef(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const handleReset = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = iframeRef.current.src;
    }
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
      } else if (iframeRef.current.msRequestFullscreen) {
        iframeRef.current.msRequestFullscreen();
      }
    }
  };

  const accentColor = '#0ea5e9'; // sky-500

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#020617', color: '#f1f5f9', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{
        height: '56px', borderBottom: '1px solid rgba(30, 41, 59, 0.5)', backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', zIndex: 50, flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '8px', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
              color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.5)'}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
            }}>
              <User size={20} style={{ color: 'white' }} />
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <h1 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f8fafc', margin: 0 }}>Giải phẫu học</h1>
              <p style={{ fontSize: '10px', color: '#06b6d4', fontWeight: 600, margin: 0 }}>Hệ sinh sản nam (Male Reproductive System)</p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end' }}>
          <button
            onClick={handleReset}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
              backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
              color: '#cbd5e1', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          >
            <RotateCcw size={14} />
            <span>Làm mới</span>
          </button>
          <button
            onClick={toggleFullScreen}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
              backgroundColor: '#0ea5e9', border: 'none', borderRadius: '10px',
              color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Maximize2 size={14} />
            <span>Toàn màn hình</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, backgroundColor: '#020617', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        {isLoading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', background: '#020617'
          }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(14, 165, 233, 0.2)', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '16px', fontSize: '12px', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.05em' }}>KHỞI TẠO MÔ PHỎNG...</p>
          </div>
        )}

        <div style={{ width: '100%', height: '100%', maxWidth: '1200px', maxHeight: '800px', position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
          <iframe
            ref={iframeRef}
            src="./external/native/male-reproductive-system/index.html"
            onLoad={handleIframeLoad}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Male Reproductive System Simulation"
          />
        </div>
      </main>

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: '16px', left: '24px', display: 'flex', alignItems: 'center', gap: '12px',
        padding: '6px 14px', backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)',
        borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', pointerEvents: 'none', zIndex: 100
      }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0ea5e9', boxShadow: '0 0 10px #0ea5e9', animation: 'pulse 2s infinite' }} />
        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Hệ thống ổn định • Chế độ giải phẫu
        </span>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default MaleReproductiveLab;
