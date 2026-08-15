import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Stethoscope, RotateCcw, Maximize2, Info } from 'lucide-react';

const DigestiveTractLab = () => {
  const navigate = useNavigate();
  const iframeRef = React.useRef(null);
  const [isLoading, setIsLoading] = React.useState(true);
  React.useEffect(() => {
    // Iframe đã ổn định, không cần bắt log nữa
  }, []);

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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#000000', color: '#f1f5f9', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{
        height: '56px', borderBottom: '1px solid #1e293b', backgroundColor: '#000000',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', zIndex: 50, flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '8px', background: '#111827', border: '1px solid #1f2937', borderRadius: '12px',
              color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s'
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Stethoscope size={20} style={{ color: 'white' }} />
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <h1 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f8fafc', margin: 0 }}>Giải phẫu học</h1>
              <p style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 600, margin: 0 }}>Hệ tiêu hóa (Digestive Tract)</p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end' }}>
          <button
            onClick={handleReset}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
              backgroundColor: 'transparent', border: '1px solid #1f2937', borderRadius: '10px',
              color: '#cbd5e1', fontSize: '12px', fontWeight: 500, cursor: 'pointer'
            }}
          >
            <RotateCcw size={14} />
            <span>Làm mới</span>
          </button>
          <button
            onClick={toggleFullScreen}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
              backgroundColor: '#f59e0b', border: 'none', borderRadius: '10px',
              color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            <Maximize2 size={14} />
            <span>Toàn màn hình</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, backgroundColor: '#000000', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {isLoading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', background: '#020617'
          }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(245, 158, 11, 0.2)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '16px', fontSize: '12px', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.05em' }}>KHỞI TẠO MÔ PHỎNG...</p>
          </div>
        )}

        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
          <iframe
            ref={iframeRef}
            src="./external/native/digestive-tract/index.html"
            onLoad={handleIframeLoad}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Digestive Tract Simulation"
          />

          {/* New Custom Controls Overlay */}
          <div style={{
            position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
            background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(16px)',
            borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 1000
          }}>
            <button
              onClick={() => {
                console.log("React: Nhấn Reset");
                iframeRef.current.contentWindow.labReset();
              }}
              style={{ padding: '8px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
              title="Làm mới"
            ><RotateCcw size={18} /></button>
            
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

            <button
              onClick={() => {
                console.log("React: Nhấn Step Backward");
                iframeRef.current.contentWindow.labStepBackward();
              }}
              style={{ padding: '8px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex' }}
            ><span style={{ transform: 'rotate(180deg)' }}><Maximize2 size={16} /></span></button>

            <button
              onClick={() => {
                console.log("React: Nhấn Play");
                iframeRef.current.contentWindow.labPlay();
              }}
              style={{ 
                width: '42px', height: '42px', borderRadius: '50%', background: '#f59e0b', 
                border: 'none', color: 'white', cursor: 'pointer', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)'
              }}
            ><div style={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '14px solid white', marginLeft: '4px' }} /></button>

            <button
              onClick={() => {
                console.log("React: Nhấn Pause");
                iframeRef.current.contentWindow.labPause();
              }}
              style={{ 
                width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', 
                border: 'none', color: 'white', cursor: 'pointer', display: 'flex', 
                alignItems: 'center', justifyContent: 'center'
              }}
            ><div style={{ display: 'flex', gap: '4px' }}><div style={{ width: '4px', height: '16px', background: 'white', borderRadius: '2px' }} /><div style={{ width: '4px', height: '16px', background: 'white', borderRadius: '2px' }} /></div></button>

            <button
              onClick={() => {
                console.log("React: Nhấn Step Forward");
                iframeRef.current.contentWindow.labStepForward();
              }}
              style={{ padding: '8px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex' }}
            ><Maximize2 size={16} /></button>
          </div>
        </div>

        {/* Decorative */}
        <div style={{ position: 'absolute', top: '20%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(217, 119, 6, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      </main>

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: '16px', left: '24px', display: 'flex', alignItems: 'center', gap: '12px',
        padding: '6px 14px', backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)',
        borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', pointerEvents: 'none', zIndex: 5
      }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b', boxShadow: '0 0 10px #f59e0b', animation: 'pulse 2s infinite' }} />
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

export default DigestiveTractLab;
