import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/utils/api';
import { useUserStore, usePlayStore } from '@/store';
import './DramaDetail.css';

interface Episode {
  id: string;
  episode_number: number;
  title: string;
  duration: number;
  thumbnail: string;
  is_free: boolean;
  isWatched?: boolean;
}

interface DramaDetail {
  id: string;
  title: string;
  cover: string;
  description: string;
  rating: number;
  total_episodes: number;
  category: string;
  tags: string[];
  cast: string[];
  director: string;
  release_date: string;
  episodes: Episode[];
}

const DramaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isVip } = useUserStore();
  const { setCurrentDrama, setCurrentEpisode } = usePlayStore();

  const [drama, setDrama] = React.useState<DramaDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedTab, setSelectedTab] = React.useState<'episodes' | 'info'>('episodes');

  React.useEffect(() => {
    loadDramaDetail();
  }, [id]);

  const loadDramaDetail = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.drama.getDetail(id!);
      const episodesRes: any = await api.drama.getEpisodes(id!);

      setDrama({
        ...res.data,
        episodes: episodesRes.data || mockEpisodes,
      });
    } catch (error) {
      console.error('Failed to load drama:', error);
      setDrama(mockDramaDetail);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayEpisode = (episode: Episode) => {
    if (!isVip && !episode.is_free) {
      navigate('/subscription');
      return;
    }

    setCurrentDrama(drama);
    setCurrentEpisode(episode);
    navigate(`/play/${episode.id}`);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}分钟`;
  };

  if (isLoading) {
    return (
      <div className="detail-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!drama) {
    return (
      <div className="detail-error">
        <p>剧集未找到</p>
        <button onClick={() => navigate(-1)}>返回</button>
      </div>
    );
  }

  return (
    <div className="detail-container">
      {/* Header */}
      <div className="detail-hero">
        <button className="detail-back-btn" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <img src={drama.cover} alt={drama.title} className="detail-hero-image" />
        <div className="detail-hero-overlay"></div>
      </div>

      {/* Info */}
      <div className="detail-info">
        <h1 className="detail-title">{drama.title}</h1>
        <div className="detail-meta">
          <span className="detail-rating">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {drama.rating}
          </span>
          <span className="detail-dot">·</span>
          <span>{drama.total_episodes}集</span>
          <span className="detail-dot">·</span>
          <span>{drama.category}</span>
        </div>

        <div className="detail-actions">
          <button className="detail-play-btn" onClick={() => handlePlayEpisode(drama.episodes[0])}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            立即播放
          </button>
          {!isVip && (
            <button className="detail-sub-btn" onClick={() => navigate('/subscription')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
              </svg>
              订阅
            </button>
          )}
        </div>
      </div>

      {/* VIP Notice */}
      {!isVip && (
        <div className="detail-vip-notice" onClick={() => navigate('/subscription')}>
          <span className="detail-vip-icon">👑</span>
          <span>开通VIP解锁全部{drama.total_episodes}集</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      )}

      {/* Tabs */}
      <div className="detail-tabs">
        <button
          className={`detail-tab ${selectedTab === 'episodes' ? 'active' : ''}`}
          onClick={() => setSelectedTab('episodes')}
        >
          剧集
        </button>
        <button
          className={`detail-tab ${selectedTab === 'info' ? 'active' : ''}`}
          onClick={() => setSelectedTab('info')}
        >
          详情
        </button>
      </div>

      {/* Episodes */}
      {selectedTab === 'episodes' && (
        <div className="episodes-list">
          {drama.episodes.map((episode) => (
            <div
              key={episode.id}
              className={`episode-row ${!isVip && !episode.is_free ? 'locked' : ''}`}
              onClick={() => handlePlayEpisode(episode)}
            >
              <div className="episode-thumb">
                <img src={episode.thumbnail} alt={episode.title} />
                {!isVip && !episode.is_free && (
                  <div className="episode-lock">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="episode-row-info">
                <h3>第{episode.episode_number}集</h3>
                <p>{episode.title}</p>
                <span>{formatDuration(episode.duration)}</span>
              </div>
              {!isVip && !episode.is_free && (
                <span className="episode-lock-tag">VIP</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      {selectedTab === 'info' && (
        <div className="info-content">
          <div className="info-block">
            <h3>简介</h3>
            <p>{drama.description}</p>
          </div>
          <div className="info-block">
            <h3>标签</h3>
            <div className="info-tags">
              {drama.tags.map((tag, index) => (
                <span key={index} className="info-tag">{tag}</span>
              ))}
            </div>
          </div>
          <div className="info-block">
            <h3>演员</h3>
            <p>{drama.cast.join('、')}</p>
          </div>
          <div className="info-block">
            <h3>导演</h3>
            <p>{drama.director}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const mockEpisodes: Episode[] = Array.from({ length: 20 }, (_, i) => ({
  id: `ep-${i + 1}`,
  episode_number: i + 1,
  title: `第${i + 1}集 - 命运的相遇`,
  duration: 120 + Math.floor(Math.random() * 60),
  thumbnail: `https://via.placeholder.com/160x90/1a1a2e/ffffff?text=EP${i + 1}`,
  is_free: i < 3,
  isWatched: i < 2,
}));

const mockDramaDetail: DramaDetail = {
  id: '1',
  title: '白皇',
  cover: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop',
  description: '一个关于权力、爱情与背叛的史诗故事。在古老的帝国中，年轻的皇子必须在阴谋与战争中生存下来，最终登上皇位。',
  rating: 4.8,
  total_episodes: 80,
  category: '古装',
  tags: ['古装', '权谋', '爱情', '复仇'],
  cast: ['张一凡', '李雨桐', '王浩然'],
  director: '陈大明',
  release_date: '2026-01-15',
  episodes: mockEpisodes,
};

export default DramaDetailPage;
