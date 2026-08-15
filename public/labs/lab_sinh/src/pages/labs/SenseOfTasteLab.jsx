import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  RotateCcw, 
  Maximize2,
  Activity,
  Info
} from 'lucide-react';

const SenseOfTasteLab = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const resetSimulation = () => {
    const iframe = document.getElementById('taste-sim-iframe');
    if (iframe) {
      iframe.src = iframe.src;
      setIsLoading(true);
    }
  };

  const toggleFullScreen = () => {
    const iframe = document.getElementById('taste-sim-iframe');
    if (iframe.requestFullscreen) {
      iframe.requestFullscreen();
    } else if (iframe.webkitRequestFullscreen) {
      iframe.webkitRequestFullscreen();
    } else if (iframe.msRequestFullscreen) {
      iframe.msRequestFullscreen();
    }
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#020617', 
      display: 'flex', 
      flexDirection: 'column',
      color: '#f8fafc',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ 
        height: '64px', 
        borderBottom: '1px solid rgba(255,255,255,0.05)', 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 20px',
        backgroundColor: '#020617',
        zIndex: 10
      }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ 
            backgroundColor: 'rgba(30, 41, 59, 0.5)', border: 'none', color: '#94a3b8',
            width: '40px', height: '40px', borderRadius: '10px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px'
          }}
        >
          <ArrowLeft size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '12px', 
            background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
          }}>
            <Activity size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, letterSpacing: '-0.01em' }}>VỊ GIÁC</h1>
            <p style={{ fontSize: '11px', color: '#ec4899', margin: 0, fontWeight: 500 }}>Cơ quan vị giác</p>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={resetSimulation}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
              backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.05)',
              color: '#94a3b8', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer'
            }}
          >
            <RotateCcw size={16} />
            <span>Làm mới</span>
          </button>
          
          <button 
            onClick={toggleFullScreen}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
              backgroundColor: '#8b5cf6', border: 'none',
              color: 'white', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}
          >
            <Maximize2 size={16} />
            <span>Toàn màn hình</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {isLoading && (
          <div style={{ 
            position: 'absolute', inset: 0, backgroundColor: '#020617', zIndex: 5,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ 
              width: '40px', height: '40px', border: '3px solid rgba(139, 92, 246, 0.1)',
              borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite'
            }} />
            <p style={{ marginTop: '16px', color: '#94a3b8', fontSize: '14px' }}>Đang tải mô phỏng...</p>
            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
          </div>
        )}
        
        <iframe
          id="taste-sim-iframe"
          src="./external/native/sense-of-taste/index.html"
          style={{ width: '100%', height: '100%', border: 'none' }}
          onLoad={() => setIsLoading(false)}
          title="Sense of Taste Lab"
        />
      </div>

      {/* Footer / Status Bar */}
      <div style={{ 
        height: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', 
        display: 'flex', alignItems: 'center', padding: '0 20px', 
        backgroundColor: '#020617', color: '#64748b', fontSize: '11px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
          <span>HỆ THỐNG ỔN ĐỊNH • TRỰC QUAN SINH ĐỘNG</span>
        </div>
      </div>
    </div>
  );
};

export default SenseOfTasteLab;
