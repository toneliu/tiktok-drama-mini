import React from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/utils/api';
import { useUserStore } from '@/store';
import './Home.css';

interface Drama {
  id: string;
  title: string;
  cover: string;
  total_episodes: number;
  rating: number;
  category: string;
  view_count: number;
  isNew?: boolean;
  isHot?: boolean;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isVip } = useUserStore();
  const [featured, setFeatured] = React.useState<Drama[]>([]);
  const [premiumList, setPremiumList] = React.useState<Drama[]>([]);
  const [currentBanner, setCurrentBanner] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    loadData();
  }, []);

  // Auto-rotate banner
  React.useEffect(() => {
    if (featured.length === 0) return;
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % featured.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [featured]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [recommendRes, hotRes] = await Promise.all([
        api.drama.getRecommend(1, 6),
        api.drama.getList({ category: 'hot', limit: 9 }),
      ]);
      
      const recData = (recommendRes as any).data || [];
      const hotData = (hotRes as any).data || [];
      
      setFeatured(recData.slice(0, 6));
      setPremiumList(hotData.length > 0 ? hotData : recData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setFeatured(mockFeatured);
      setPremiumList(mockPremium);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDramaClick = (drama: Drama) => {
    navigate(`/drama/${drama.id}`);
  };

  const formatViews = (count: number) => {
    if (count >= 10000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  if (isLoading) {
    return (
      <div className="home-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <h1 className="app-title">Reelix</h1>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => navigate('/search')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
          <button className="icon-btn" onClick={() => navigate('/profile')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="search-bar" onClick={() => navigate('/search')}>
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span className="search-placeholder">搜索更多短剧</span>
      </div>

      {/* Featured Banner Carousel */}
      {featured.length > 0 && (
        <div className="banner-section">
          <div 
            className="banner-track"
            style={{ transform: `translateX(-${currentBanner * 100}%)` }}
          >
            {featured.map((drama, index) => (
              <div 
                key={drama.id} 
                className="banner-slide"
                onClick={() => handleDramaClick(drama)}
              >
                <img src={drama.cover} alt={drama.title} className="banner-image" />
                <div className="banner-overlay">
                  <button className="play-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>Play</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Banner Dots */}
          <div className="banner-dots">
            {featured.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentBanner ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentBanner(index);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Premium Section */}
      <section className="premium-section">
        <h2 className="section-title">精品剧</h2>
        <div className="drama-grid">
          {premiumList.map((drama) => (
            <div 
              key={drama.id} 
              className="drama-card"
              onClick={() => handleDramaClick(drama)}
            >
              <div className="card-cover">
                <img src={drama.cover} alt={drama.title} loading="lazy" />
                <span className="view-count">
                  {formatViews(drama.view_count || 0)}
                </span>
              </div>
              <h3 className="card-title">{drama.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* VIP Banner (if not VIP) */}
      {!isVip && (
        <div className="vip-float-banner" onClick={() => navigate('/subscription')}>
          <div className="vip-content">
            <span className="vip-crown">👑</span>
            <span>解锁全部剧集，享受VIP特权</span>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      )}
    </div>
  );
};

// Mock data for fallback
const mockFeatured: Drama[] = [
  { id: '1', title: '白皇', cover: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop', total_episodes: 80, rating: 4.8, category: 'fantasy', view_count: 52800, isHot: true },
  { id: '2', title: '李酒之潜龙出海', cover: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=400&h=600&fit=crop', total_episodes: 60, rating: 4.7, category: 'action', view_count: 30290, isHot: true },
  { id: '3', title: '前夫求复婚', cover: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=600&fit=crop', total_episodes: 50, rating: 4.6, category: 'romance', view_count: 23160, isNew: true },
  { id: '4', title: '偏执温少的大佬夫人', cover: 'https://images.unsplash.com/photo-1594909122849-11daa4e4d2f2?w=400&h=600&fit=crop', total_episodes: 70, rating: 4.9, category: 'romance', view_count: 17830, isHot: true },
  { id: '5', title: '都市战神', cover: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop', total_episodes: 90, rating: 4.5, category: 'action', view_count: 42100, isNew: true },
  { id: '6', title: '重生之嫡女归来', cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop', total_episodes: 45, rating: 4.8, category: 'drama', view_count: 35600, isHot: true },
];

const mockPremium: Drama[] = [
  ...mockFeatured,
  { id: '7', title: '霸道总裁爱上我', cover: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop', total_episodes: 55, rating: 4.4, category: 'romance', view_count: 28900 },
  { id: '8', title: '神医下山', cover: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop', total_episodes: 65, rating: 4.7, category: 'fantasy', view_count: 19800 },
  { id: '9', title: '豪门恩怨', cover: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop', total_episodes: 40, rating: 4.3, category: 'drama', view_count: 15600 },
];

export default Home;
