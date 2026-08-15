import React from 'react';
import { Activity, Thermometer, Wind } from 'lucide-react';
import './BottomBar.css';

const BottomBar = () => {
  return (
    <footer className="bottom-bar glass-panel">
      <div className="status-item">
        <Activity size={16} color="var(--accent-green)" />
        <span>Môi trường: Ổn định</span>
      </div>
      <div className="status-item">
        <Thermometer size={16} color="var(--accent-purple)" />
        <span>Nhiệt độ: 37°C</span>
      </div>
      <div className="status-item">
        <Wind size={16} color="var(--accent-cyan)" />
        <span>Oxy: 98%</span>
      </div>
      <div className="status-spacer"></div>
      <div className="copyright-tag">
        <span>&copy; 2026 BioSTEM AI Education</span>
      </div>
    </footer>
  );
};

export default BottomBar;
