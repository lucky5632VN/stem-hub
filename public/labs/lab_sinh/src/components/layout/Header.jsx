import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import './Header.css';

const Header = () => {
  return (
    <header className="header glass-panel">
      <div className="header-search">
        <Search size={18} color="var(--text-secondary)" />
        <input type="text" placeholder="Tìm kiếm mô phỏng, tế bào, ADN..." />
      </div>
      
      <div className="header-actions">
        <button className="action-btn" style={{ position: 'relative' }}>
          <Bell size={20} />
          <span className="badge" style={{ animation: 'pulse-glow 2s infinite', boxShadow: '0 0 10px var(--accent-purple)' }}>3</span>
        </button>
        <div className="user-profile">
          <div className="avatar" style={{ border: '2px solid rgba(0, 240, 255, 0.5)', boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)' }}>
            <User size={20} />
          </div>
          <div className="user-info">
            <span className="user-name">Học viên VIP</span>
            <span className="user-level" style={{ color: 'var(--accent-cyan)' }}>Lvl 12 - Lab Master</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
