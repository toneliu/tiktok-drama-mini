import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Pages
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import DramaDetail from '@/pages/DramaDetail';
import Player from '@/pages/Player';
import Subscription from '@/pages/Subscription';
import Profile from '@/pages/Profile';
import MyList from '@/pages/MyList';

// Bottom Navigation Component
const BottomNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { path: '/', label: '首页', icon: HomeIcon },
    { path: '/mylist', label: '我的列表', icon: BookmarkIcon },
    { path: '/profile', label: '我的', icon: UserIcon },
  ];

  // Hide nav on player page
  if (currentPath.startsWith('/play/')) return null;

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = currentPath === item.path;
        return (
          <a
            key={item.path}
            href={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              window.location.href = item.path;
            }}
          >
            <item.icon active={isActive} />
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
};

// SVG Icons
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function BookmarkIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// App Component
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/drama/:id" element={<DramaDetail />} />
          <Route path="/play/:episodeId" element={<Player />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/mylist" element={<MyList />} />
          <Route path="/category/:category" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
};

export default App;
