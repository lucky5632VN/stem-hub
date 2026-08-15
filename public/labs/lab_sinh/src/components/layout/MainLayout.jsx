import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomBar from './BottomBar';
import './Layout.css';

const MainLayout = () => {
  return (
    <div className="layout-container">
      <Sidebar />
      <div className="layout-content">
        <main className="layout-main">
          <Outlet />
        </main>
        <BottomBar />
      </div>
    </div>
  );
};

export default MainLayout;
