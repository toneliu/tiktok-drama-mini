import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/utils/api';
import { tiktokSDK } from '@/utils/tiktok-sdk';
import { useUserStore, useSubscriptionStore } from '@/store';
import './Subscription.css';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  beans: number;
  duration: number;
  durationText: string;
  features: string[];
  isPopular?: boolean;
  discount?: string;
}

const Subscription: React.FC = () => {
  const navigate = useNavigate();
  const { isVip, vipExpireAt, setVip } = useUserStore();
  const { plans, setPlans } = useSubscriptionStore();
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.subscription.getPlans();
      setPlans(res.data || defaultPlans);
      if (res.data?.length > 0) {
        setSelectedPlan(res.data[0].id);
      } else {
        setSelectedPlan(defaultPlans[0].id);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
      setPlans(defaultPlans);
      setSelectedPlan(defaultPlans[0].id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    try {
      // 1. 创建订阅订单
      const orderRes: any = await api.subscription.createOrder(selectedPlan);
      const { orderId, tradeOrderId, priceAmount } = orderRes;
      
      // 2. 调用TikTok支付
      await tiktokSDK.pay(tradeOrderId);
      
      // 3. 验证支付结果
      const verifyRes: any = await api.subscription.verifyPayment(orderId);
      
      if (verifyRes.success) {
        // 4. 更新用户VIP状态
        setVip(true, verifyRes.expireAt);
        setShowSuccess(true);
        
        // 5. 3秒后跳转首页
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (error: any) {
      console.error('Subscription failed:', error);
      alert(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="subscription-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="success-container">
        <div className="success-content">
          <div className="success-icon">🎉</div>
          <h2>Welcome to VIP!</h2>
          <p>You now have unlimited access to all dramas</p>
          <button className="success-btn" onClick={() => navigate('/')}>
            Start Watching
          </button>
        </div>
      </div>
    );
  }

  const currentPlans = plans.length > 0 ? plans : defaultPlans;

  return (
    <div className="subscription-container">
      {/* 头部 */}
      <header className="sub-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ←
        </button>
        <h1>Subscribe</h1>
        <div style={{ width: 40 }}></div>
      </header>

      {/* VIP状态 */}
      {isVip && vipExpireAt && (
        <div className="vip-status">
          <span className="vip-badge">👑 VIP Member</span>
          <p>Your membership expires on {formatDate(vipExpireAt)}</p>
        </div>
      )}

      {/* 会员权益 */}
      <div className="benefits-section">
        <h2>VIP Benefits</h2>
        <div className="benefits-list">
          <div className="benefit-item">
            <span className="benefit-icon">📺</span>
            <div className="benefit-text">
              <strong>Unlimited Viewing</strong>
              <p>Watch all dramas without restrictions</p>
            </div>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🚫</span>
            <div className="benefit-text">
              <strong>Ad-Free Experience</strong>
              <p>No interruptions while watching</p>
            </div>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">⬇️</span>
            <div className="benefit-text">
              <strong>Download Offline</strong>
              <p>Watch anytime, anywhere</p>
            </div>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🎬</span>
            <div className="benefit-text">
              <strong>Early Access</strong>
              <p>Watch new releases first</p>
            </div>
          </div>
        </div>
      </div>

      {/* 套餐选择 */}
      <div className="plans-section">
        <h2>Choose Your Plan</h2>
        <div className="plans-list">
          {currentPlans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.isPopular && <span className="popular-badge">Most Popular</span>}
              <div className="plan-header">
                <h3>{plan.name}</h3>
                {plan.discount && <span className="discount-badge">{plan.discount}</span>}
              </div>
              <div className="plan-price">
                <span className="beans">{plan.beans}</span>
                <span className="beans-label">Beans</span>
              </div>
              <div className="plan-duration">{plan.durationText}</div>
              <ul className="plan-features">
                {plan.features.map((feature, index) => (
                  <li key={index}>✓ {feature}</li>
                ))}
              </ul>
              <div className="plan-radio">
                <div className={`radio-circle ${selectedPlan === plan.id ? 'checked' : ''}`}>
                  {selectedPlan === plan.id && <span className="radio-dot"></span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 订阅按钮 */}
      <div className="subscribe-footer">
        <button
          className="subscribe-btn"
          onClick={handleSubscribe}
          disabled={!selectedPlan || isProcessing}
        >
          {isProcessing ? (
            <span className="processing">
              <span className="loading-spinner small"></span>
              Processing...
            </span>
          ) : (
            `Subscribe Now`
          )}
        </button>
        <p className="terms">
          By subscribing, you agree to our{' '}
          <a href="/terms">Terms of Service</a> and{' '}
          <a href="/privacy">Privacy Policy</a>
        </p>
        <p className="cancel-note">
          Cancel anytime. Subscription auto-renews monthly.
        </p>
      </div>
    </div>
  );
};

// 默认套餐
const defaultPlans: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 9.99,
    beans: 500,
    duration: 30,
    durationText: '1 Month',
    features: [
      'Unlimited viewing',
      'Ad-free experience',
      'HD quality',
    ],
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    price: 24.99,
    beans: 1300,
    duration: 90,
    durationText: '3 Months',
    discount: 'Save 13%',
    isPopular: true,
    features: [
      'Unlimited viewing',
      'Ad-free experience',
      'HD quality',
      'Priority support',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 79.99,
    beans: 4000,
    duration: 365,
    durationText: '12 Months',
    discount: 'Save 33%',
    features: [
      'Unlimited viewing',
      'Ad-free experience',
      '4K quality',
      'Priority support',
      'Early access',
    ],
  },
];

export default Subscription;
