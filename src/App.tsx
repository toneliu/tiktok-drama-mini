import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

// Pages
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import Category from '@/pages/Category';
import DramaDetail from '@/pages/DramaDetail';
import Player from '@/pages/Player';
import Subscription from '@/pages/Subscription';
import Profile from '@/pages/Profile';
import MyList from '@/pages/MyList';
import { useUserStore } from '@/store';

// Bottom Navigation Component
const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const navItems = [
    { path: '/', label: '首页', icon: HomeIcon },
    { path: '/category', label: '分类', icon: GridIcon },
    { path: '/mylist', label: '我的列表', icon: BookmarkIcon },
    { path: '/profile', label: '我的', icon: UserIcon },
  ];

  // Hide nav on player page
  if (currentPath.startsWith('/play/')) return null;

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        let isActive = currentPath === item.path;
        // 分类页：前缀匹配也算激活
        if (item.path === '/category') {
          isActive = currentPath === '/category' || currentPath.startsWith('/category/');
        }
        return (
          <a
            key={item.path}
            href={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(item.path);
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

function GridIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
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
  // 启动时校验登录态：若 store 残留登录态但无真实 token，则清空
  // （兼容旧版本持久化的 mock 登录态，避免 401 死循环）
  React.useEffect(() => {
    const { isLoggedIn, token, logout } = useUserStore.getState();
    if (isLoggedIn && !localStorage.getItem('token')) {
      logout();
    } else if (token && !localStorage.getItem('token')) {
      logout();
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category" element={<Category />} />
          <Route path="/category/:category" element={<Category />} />
          <Route path="/login" element={<Login />} />
          <Route path="/drama/:id" element={<DramaDetail />} />
          <Route path="/play/:episodeId" element={<Player />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/mylist" element={<MyList />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
};

export default App;
