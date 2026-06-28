import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store';
import { tiktokSDK } from '@/utils/tiktok-sdk';
import { api } from '@/utils/api';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setUserInfo, setToken, setVip } = useUserStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingMode, setLoadingMode] = React.useState<'tiktok' | 'guest' | null>(null);
  const isMiniApp = tiktokSDK.isMiniApp();

  // 获取或生成游客唯一标识，保证刷新后复用同一游客账号
  const getGuestId = (): string => {
    let id = localStorage.getItem('guest_id');
    if (!id) {
      id = 'g_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('guest_id', id);
    }
    return id;
  };

  // TikTok 登录（Minis 环境）
  const handleTiktokLogin = async () => {
    setLoadingMode('tiktok');
    setIsLoading(true);
    try {
      const code = await tiktokSDK.login();
      const res: any = await api.user.login(code);
      setToken(res.token);
      setUserInfo(res.user);
      if (res.subscription) {
        setVip(res.subscription.isActive, res.subscription.expireAt);
      }
      navigate('/');
    } catch (error) {
      console.error('TikTok login failed:', error);
      alert('登录失败，请重试');
    } finally {
      setIsLoading(false);
      setLoadingMode(null);
    }
  };

  // 游客登录（Web 端快速体验）
  const handleGuestLogin = async () => {
    setLoadingMode('guest');
    setIsLoading(true);
    try {
      const guestId = getGuestId();
      const res: any = await api.user.guestLogin(guestId);
      setToken(res.token);
      setUserInfo(res.user);
      navigate('/');
    } catch (error) {
      console.error('Guest login failed:', error);
      alert('登录失败，请重试');
    } finally {
      setIsLoading(false);
      setLoadingMode(null);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-logo">
          <span className="logo-icon">🎬</span>
          <h1 className="logo-text">Reelix</h1>
        </div>
        
        <p className="login-tagline">
          Watch unlimited short dramas<br />
          anytime, anywhere
        </p>
        
        <div className="login-features">
          <div className="feature-item">
            <span className="feature-icon">📺</span>
            <span>1000+ Short Dramas</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🌟</span>
            <span>HD Quality</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💎</span>
            <span>VIP Benefits</span>
          </div>
        </div>

        {/* Web 环境：主推游客登录 */}
        {!isMiniApp && (
          <>
            <button 
              className="login-button"
              onClick={handleGuestLogin}
              disabled={isLoading}
            >
              {loadingMode === 'guest' ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <span className="guest-icon">⚡</span>
                  快速体验
                </>
              )}
            </button>

            <div className="login-divider">
              <span>或</span>
            </div>

            <button 
              className="login-button login-button-secondary"
              onClick={handleTiktokLogin}
              disabled={isLoading}
            >
              {loadingMode === 'tiktok' ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <span className="tiktok-icon">🎵</span>
                  Continue with TikTok
                </>
              )}
            </button>
          </>
        )}

        {/* TikTok Minis 环境：TikTok 登录为主 */}
        {isMiniApp && (
          <button 
            className="login-button"
            onClick={handleTiktokLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner"></span>
            ) : (
              <>
                <span className="tiktok-icon">🎵</span>
                Continue with TikTok
              </>
            )}
          </button>
        )}

        <p className="login-terms">
          By continuing, you agree to our<br />
          <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
