import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MyList.css';

interface Drama {
  id: string;
  title: string;
  cover: string;
  progress: number;
  totalEpisodes: number;
}

const MyList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<'history' | 'favorites'>('history');

  const historyList: Drama[] = [
    { id: '1', title: '白皇', cover: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop', progress: 12, totalEpisodes: 80 },
    { id: '2', title: '李酒之潜龙出海', cover: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=400&h=600&fit=crop', progress: 45, totalEpisodes: 60 },
    { id: '3', title: '前夫求复婚', cover: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=600&fit=crop', progress: 8, totalEpisodes: 50 },
  ];

  const favoriteList: Drama[] = [
    { id: '4', title: '偏执温少的大佬夫人', cover: 'https://images.unsplash.com/photo-1594909122849-11daa4e4d2f2?w=400&h=600&fit=crop', progress: 0, totalEpisodes: 70 },
    { id: '5', title: '都市战神', cover: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop', progress: 0, totalEpisodes: 90 },
  ];

  const currentList = activeTab === 'history' ? historyList : favoriteList;

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
        {currentList.map((drama) => (
          <div
            key={drama.id}
            className="list-item"
            onClick={() => navigate(`/drama/${drama.id}`)}
          >
            <div className="item-cover">
              <img src={drama.cover} alt={drama.title} />
              {activeTab === 'history' && drama.progress > 0 && (
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(drama.progress / drama.totalEpisodes) * 100}%` }}
                  />
                </div>
              )}
            </div>
            <div className="item-info">
              <h3>{drama.title}</h3>
              {activeTab === 'history' && (
                <p>看到第 {drama.progress} 集 / 共 {drama.totalEpisodes} 集</p>
              )}
            </div>
            <button className="item-more">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </button>
          </div>
        ))}

        {currentList.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">📺</span>
            <p>暂无内容</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyList;
