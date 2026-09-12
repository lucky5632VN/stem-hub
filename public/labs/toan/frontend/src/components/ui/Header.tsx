import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import QuizModal from './QuizModal';
import { useGeometryStore } from '../../store/useGeometryStore';

const Header: React.FC = () => {
  const { currentTab, setTab } = useGeometryStore();
  const [showQuiz, setShowQuiz] = useState(false);

  const tabs = [
    { id: 'geometry', label: 'Hình Học 3D' },
    { id: 'graphing', label: 'Vẽ Đồ Thị' },
    { id: 'theory', label: 'Lý Thuyết' },
    { id: 'quiz', label: 'Bài Tập' },
  ];

  return (
    <>
      <header className="glass" style={{ padding: '0.8rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <a href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.5rem 0.9rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#8b949e',
            fontSize: '0.8rem',
            fontWeight: 600,
            textDecoration: 'none',
            marginRight: '0.5rem',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = '#f0f6fc';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = '#8b949e';
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Về Hub
          </a>
          <div style={{ background: '#58a6ff', color: 'black', padding: '0.4rem', borderRadius: '8px' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#f0f6fc' }}>
              SPATIAL MIND 3D
            </h1>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hệ sinh thái toán học 3D - Gia sư AI
            </p>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.3rem', borderRadius: '12px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id as any)}
              style={{
                background: currentTab === tab.id ? 'rgba(88,166,255,0.15)' : 'transparent',
                color: currentTab === tab.id ? '#58a6ff' : '#8b949e',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#388bfd', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#238636' }} />
            AI Trực Tuyến
          </div>
        </div>
      </header>
      
      {showQuiz && <QuizModal onClose={() => setShowQuiz(false)} />}
    </>
  );
};

export default Header;
