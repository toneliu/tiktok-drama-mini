import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/utils/api';
import './Category.css';

interface CategoryItem {
  name: string;
  count: number;
}

interface Drama {
  id: string;
  title: string;
  cover: string;
  total_episodes: number;
  rating: number;
  category: string;
  view_count: number;
}

const PLACEHOLDER_COVER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="#1a1a1a"/><text x="50%" y="50%" fill="#555" font-family="sans-serif" font-size="14" text-anchor="middle" dominant-baseline="middle">暂无封面</text></svg>`
  );

const Category: React.FC = () => {
  const navigate = useNavigate();
  const { category } = useParams<{ category?: string }>();
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [dramas, setDramas] = React.useState<Drama[]>([]);
  const [activeCat, setActiveCat] = React.useState<string>(category || 'hot');
  const [loading, setLoading] = React.useState(true);
  const [dramasLoading, setDramasLoading] = React.useState(false);

  React.useEffect(() => {
    loadCategories();
  }, []);

  React.useEffect(() => {
    if (categories.length > 0) {
      loadDramas(activeCat);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCat]);

  const loadCategories = async () => {
    try {
      const res: any = await api.drama.getCategories();
      const list = res?.data || [];
      const withPreset = [
        { name: 'hot', count: 0, label: '热门' },
        { name: 'new', count: 0, label: '最新' },
      ].map((item) => {
        const found = list.find((c: CategoryItem) => c.name === item.name);
        return { name: item.name, count: found?.count || 0, label: item.label };
      });
      const custom = list
        .filter((c: CategoryItem) => c.name !== 'hot' && c.name !== 'new')
        .map((c: CategoryItem) => ({ ...c, label: c.name }));
      setCategories([...withPreset, ...custom]);
    } catch (e) {
      console.error('加载分类失败', e);
      setCategories([
        { name: 'hot', count: 0, label: '热门' } as any,
        { name: 'new', count: 0, label: '最新' } as any,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadDramas = async (cat: string) => {
    setDramasLoading(true);
    try {
      const res: any = await api.drama.getList({ category: cat, page: 1, limit: 30 });
      setDramas(res?.data || []);
    } catch (e) {
      console.error('加载剧集失败', e);
      setDramas([]);
    } finally {
      setDramasLoading(false);
    }
  };

  const formatViews = (count: number) => {
    if (!count) return '0';
    if (count >= 10000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  const getCatLabel = (name: string) => {
    const found = categories.find((c: any) => c.name === name);
    return (found as any)?.label || name;
  };

  if (loading) {
    return (
      <div className="category-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="category-page">
      <header className="category-header">
        <h1 className="category-title">分类</h1>
      </header>

      {/* 分类横向滚动标签 */}
      <div className="category-tabs">
        <div className="tabs-scroll">
          {categories.map((cat) => {
            const name = cat.name;
            const isActive = name === activeCat;
            return (
              <button
                key={name}
                className={`tab-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveCat(name)}
              >
                {(cat as any).label || cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 剧集网格 */}
      <div className="category-content">
        <div className="section-header">
          <h2>{getCatLabel(activeCat)}</h2>
          <span className="count">{dramas.length} 部短剧</span>
        </div>

        {dramasLoading ? (
          <div className="category-loading-inline">
            <div className="loading-spinner"></div>
          </div>
        ) : dramas.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>暂无相关短剧</p>
          </div>
        ) : (
          <div className="drama-grid">
            {dramas.map((drama) => (
              <div
                key={drama.id}
                className="drama-card"
                onClick={() => navigate(`/drama/${drama.id}`)}
              >
                <div className="card-cover">
                  <img
                    src={drama.cover || PLACEHOLDER_COVER}
                    alt={drama.title}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_COVER;
                    }}
                  />
                  <span className="view-count">{formatViews(drama.view_count || 0)}</span>
                </div>
                <h3 className="card-title">{drama.title}</h3>
                <p className="card-meta">
                  {drama.total_episodes} 集 · {drama.rating} 分
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Category;
