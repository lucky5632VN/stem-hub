import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Library, BookOpen, Microscope, Target } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="sidebar glass-panel-heavy">
      <div className="sidebar-brand">
        <div className="brand-icon" style={{ boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)' }}>
          <Microscope size={24} color="var(--accent-cyan)" />
        </div>
        <h1 className="brand-title text-glow">BioSTEM <span className="text-gradient">LAB</span></h1>
      </div>
      
      <a href="/" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        margin: '0 16px 16px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        color: '#94a3b8',
        fontSize: '13px',
        fontWeight: '600',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
        e.currentTarget.style.color = '#fff';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
        e.currentTarget.style.color = '#94a3b8';
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Về Hub STT2026
      </a>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Home size={20} />
          <span>Trang Chủ</span>
        </NavLink>
        <NavLink to="/theory" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <BookOpen size={20} />
          <span>Lý thuyết</span>
        </NavLink>
        <NavLink to="/exercises" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Target size={20} />
          <span>Bài tập</span>
        </NavLink>
        <NavLink to="/virtual-lab" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Library size={20} />
          <span>Thí nghiệm</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
