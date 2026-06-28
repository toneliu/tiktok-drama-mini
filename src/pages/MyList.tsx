import React from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import './MyList.css';

// 后端返回的观看历史项
interface HistoryItem {
  id: string;
  drama_id: string;
  episode_id: string;
  title: string;
  cover: string;
  total_episodes: number;
  progress: number;   // 已看到第几集
  position: number;   // 当前集播放秒数
  duration: number;
  watched_at: string;
}

// 后端返回的收藏项
interface FavoriteItem {
  id: string;
  drama_id: string;
  title: string;
  cover: string;
  total_episodes: number;
  rating: number;
  is_hot: boolean;
  created_at: string;
}

const PLACEHOLDER_COVER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="#1a1a1a"/><text x="50%" y="50%" fill="#555" font-family="sans-serif" font-size="14" text-anchor="middle" dominant-baseline="middle">暂无封面</text></svg>`
  );

const formatTime = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时前`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day} 天前`;
  return d.toLocaleDateString();
};

const MyList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<'history' | 'favorites'>('history');

  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = React.useState<FavoriteItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const loadHistory = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await api.drama.getHistory();
      setHistory(res?.data ?? []);
    } catch (e: any) {
      setError(e?.message || '加载观看历史失败');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFavorites = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await api.favorite.getList();
      setFavorites(res?.data ?? []);
    } catch (e: any) {
      setError(e?.message || '加载收藏失败');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    } else {
      loadFavorites();
    }
  }, [activeTab, loadHistory, loadFavorites]);

  const handleRemoveFavorite = async (e: React.MouseEvent, dramaId: string) => {
    e.stopPropagation();
    try {
      await api.favorite.remove(dramaId);
      setFavorites((prev) => prev.filter((f) => f.drama_id !== dramaId));
    } catch (err) {
      console.error('取消收藏失败', err);
    }
  };

  return (
    <div className="mylist-container">
      <header className="mylist-header">
        <h1>我的列表</h1>
      </header>

      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          观看历史
        </button>
        <button
          className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          我的收藏
        </button>
      </div>

      <div className="list-content">
        {loading && <div className="loading-state">加载中…</div>}

        {!loading && error && <div className="error-state">{error}</div>}

        {!loading && !error && activeTab === 'history' && (
          <>
            {history.map((item) => (
              <div
                key={item.id}
                className="list-item"
                onClick={() => navigate(`/drama/${item.drama_id}`)}
              >
                <div className="item-cover">
                  <img
                    src={item.cover || PLACEHOLDER_COVER}
                    alt={item.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_COVER;
                    }}
                  />
                  {item.progress > 0 && item.total_episodes > 0 && (
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${(item.progress / item.total_episodes) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="item-info">
                  <h3>{item.title || '未命名剧目'}</h3>
                  <p>
                    看到第 {item.progress} 集 / 共 {item.total_episodes} 集
                  </p>
                  <span className="item-meta">{formatTime(item.watched_at)}</span>
                </div>
                <button className="item-more" aria-label="更多">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                  </svg>
                </button>
              </div>
            ))}
            {history.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon">📺</span>
                <p>暂无观看记录</p>
              </div>
            )}
          </>
        )}

        {!loading && !error && activeTab === 'favorites' && (
          <>
            {favorites.map((item) => (
              <div
                key={item.id}
                className="list-item"
                onClick={() => navigate(`/drama/${item.drama_id}`)}
              >
                <div className="item-cover">
                  <img
                    src={item.cover || PLACEHOLDER_COVER}
                    alt={item.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_COVER;
                    }}
                  />
                </div>
                <div className="item-info">
                  <h3>{item.title || '未命名剧目'}</h3>
                  <p>共 {item.total_episodes} 集</p>
                  <span className="item-meta">收藏于 {formatTime(item.created_at)}</span>
                </div>
                <button
                  className="item-more"
                  aria-label="取消收藏"
                  onClick={(e) => handleRemoveFavorite(e, item.drama_id)}
                  title="取消收藏"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>
            ))}
            {favorites.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon">❤️</span>
                <p>暂无收藏</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyList;
