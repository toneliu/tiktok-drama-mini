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

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // 1. 调用TikTok登录获取code
      const code = await tiktokSDK.login();
      
      // 2. 发送code到后端换取token
      const res: any = await api.user.login(code);
      
      // 3. 保存用户信息
      setToken(res.token);
      setUserInfo(res.user);
      
      // 4. 获取订阅状态
      if (res.subscription) {
        setVip(res.subscription.isActive, res.subscription.expireAt);
      }
      
      // 5. 跳转首页
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed, please try again');
    } finally {
      setIsLoading(false);
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

        <button 
          className="login-button"
          onClick={handleLogin}
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

        <p className="login-terms">
          By continuing, you agree to our<br />
          <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
        </p>

        <a href="/" className="skip-link">Continue as Guest →</a>
      </div>
    </div>
  );
};

export default Login;
