import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store';
import './Profile.css';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { userInfo, isVip, vipExpireAt, logout } = useUserStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: ClockIcon, label: '观看历史', path: '/mylist' },
    { icon: HeartIcon, label: '我的收藏', path: '/mylist' },
    { icon: DownloadIcon, label: '我的下载', path: '#' },
    { icon: CrownIcon, label: '会员中心', path: '/subscription' },
  ];

  const settingItems = [
    { icon: BellIcon, label: '消息通知', value: '' },
    { icon: GlobeIcon, label: '语言', value: '简体中文' },
    { icon: MoonIcon, label: '深色模式', value: '已开启' },
    { icon: HelpIcon, label: '帮助与反馈', value: '' },
  ];

  return (
    <div className="profile-container">
      {/* Header */}
      <header className="profile-header">
        <h1>我的</h1>
        <button className="settings-icon-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </header>

      {/* User Info */}
      <div className="profile-user">
        <div className="user-avatar-large">
          <img src={userInfo?.avatarUrl || 'https://via.placeholder.com/80/333/fff?text=U'} alt="Avatar" />
        </div>
        <div className="user-details">
          <h2 className="user-name">{userInfo?.nickname || '用户'}</h2>
          {isVip ? (
            <span className="vip-tag">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              VIP会员
            </span>
          ) : (
            <span className="user-level">普通用户</span>
          )}
        </div>
      </div>

      {/* VIP Banner */}
      {!isVip && (
        <div className="profile-vip-banner" onClick={() => navigate('/subscription')}>
          <div className="vip-banner-content">
            <span className="vip-banner-icon">👑</span>
            <div>
              <p className="vip-banner-title">开通VIP会员</p>
              <p className="vip-banner-desc">解锁全部剧集，享受无广告观看</p>
            </div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      )}

      {/* Menu Section */}
      <div className="profile-menu">
        {menuItems.map((item) => (
          <div key={item.label} className="profile-menu-item" onClick={() => navigate(item.path)}>
            <div className="menu-item-left">
              <item.icon />
              <span>{item.label}</span>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" className="menu-chevron">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
        ))}
      </div>

      {/* Settings Section */}
      <div className="profile-menu">
        {settingItems.map((item) => (
          <div key={item.label} className="profile-menu-item">
            <div className="menu-item-left">
              <item.icon />
              <span>{item.label}</span>
            </div>
            <div className="menu-item-right">
              {item.value && <span className="menu-value">{item.value}</span>}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" className="menu-chevron">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button className="logout-btn" onClick={handleLogout}>
        退出登录
      </button>

      <p className="version-text">Reelix v1.0.0</p>
    </div>
  );
};

// Icons
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export default Profile;
