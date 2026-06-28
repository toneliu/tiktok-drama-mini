import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/utils/api';
import { useUserStore, usePlayStore } from '@/store';
import './Player.css';

interface Episode {
  id: string;
  episode_number: number;
  title: string;
  duration: number;
  play_url: string;
  tiktok_video_id?: string;
  play_source?: string; // local | oss | tos | qiniu | tiktok | external | cdn
  is_free?: boolean;
}

const Player: React.FC = () => {
  const { episodeId } = useParams<{ episodeId: string }>();
  const navigate = useNavigate();
  const { isVip } = useUserStore();
  const { currentDrama, setCurrentDrama, setCurrentEpisode, setProgress } = usePlayStore();

  const feedRef = useRef<HTMLDivElement>(null);
  const lastRecordRef = useRef<number>(0); // 上次记录时间（毫秒）
  const prevIndexRef = useRef<number>(-1); // 上一次 activeIndex（换集时用）
  const [isLoading, setIsLoading] = useState(true);
  const [episodeList, setEpisodeList] = useState<Episode[]>([]);
  const [drama, setDrama] = useState<any>(currentDrama);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // 加载剧集数据
  useEffect(() => {
    loadEpisodeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEpisodeData = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.drama.getPlayUrl(episodeId!);
      const episodes: Episode[] = res.episodes || mockEpisodes;
      const ep: Episode = res.episode || episodes[0];
      setEpisodeList(episodes);
      if (res.drama) {
        setDrama(res.drama);
        setCurrentDrama(res.drama);
      }
      setCurrentEpisode(ep);

      // 初始定位到当前集
      const idx = episodes.findIndex((e) => e.id === episodeId);
      setActiveIndex(idx >= 0 ? idx : 0);

      // 检查收藏（drama 级）
      if (res.drama?.id) {
        try {
          const favRes: any = await api.favorite.check(res.drama.id);
          setIsFavorite(!!favRes?.is_favorite);
        } catch {
          /* ignore */
        }
      }
    } catch (error) {
      console.error('Failed to load episode:', error);
      const mock = mockEpisodes;
      setEpisodeList(mock);
      const idx = mock.findIndex((e) => e.id === episodeId);
      setActiveIndex(idx >= 0 ? idx : 0);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始滚动到当前集（列表渲染后）
  useEffect(() => {
    if (!isLoading && episodeList.length && feedRef.current) {
      const slide = feedRef.current.children[activeIndex] as HTMLElement;
      slide?.scrollIntoView({ behavior: 'auto' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, episodeList]);

  // IntersectionObserver：检测最可见的 slide，自动切换
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed || episodeList.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) {
            const idx = Number((e.target as HTMLElement).dataset.index);
            setActiveIndex((prev) => (prev !== idx ? idx : prev));
          }
        });
      },
      { root: feed, threshold: [0.6] }
    );

    const slides = feed.querySelectorAll('.video-slide');
    slides.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [episodeList]);

  // activeIndex 变化时：更新 URL（replace）+ 记录上一集的最终进度
  useEffect(() => {
    if (!episodeList.length) return;
    const ep = episodeList[activeIndex];
    if (!ep) return;
    setCurrentEpisode(ep);
    if (ep.id !== episodeId) {
      navigate(`/play/${ep.id}`, { replace: true });
    }
    // 换集时：记录前一集的最终进度
    if (prevIndexRef.current >= 0 && prevIndexRef.current < episodeList.length) {
      const prevEp = episodeList[prevIndexRef.current];
      const saved = (window as any).__episodeProgress?.[prevEp.id];
      if (saved) {
        api.drama.recordProgress(prevEp.id, Math.floor(saved.currentTime), Math.floor(saved.duration)).catch(() => {});
      }
    }
    prevIndexRef.current = activeIndex;
  }, [activeIndex, episodeList]);

  // 进度记录回调（由 VideoSlide 调用，节流 10 秒）
  const handleProgress = useCallback(
    (episodeId: string, currentTime: number, duration: number) => {
      setProgress(currentTime, duration);
      // 节流：每 10 秒才真正写后端
      const now = Date.now();
      if (now - lastRecordRef.current >= 10000) {
        lastRecordRef.current = now;
        api.drama.recordProgress(episodeId, Math.floor(currentTime), Math.floor(duration)).catch(() => {});
      }
      // 同时暂存到 window（供换集时读取）
      if (!(window as any).__episodeProgress) {
        (window as any).__episodeProgress = {};
      }
      (window as any).__episodeProgress[episodeId] = { currentTime, duration };
    },
    [setProgress]
  );

  const scrollToIndex = useCallback((idx: number) => {
    const feed = feedRef.current;
    if (!feed) return;
    if (idx < 0 || idx >= episodeList.length) return;
    const target = feed.children[idx] as HTMLElement;
    target?.scrollIntoView({ behavior: 'smooth' });
  }, [episodeList.length]);

  const handlePrev = () => scrollToIndex(activeIndex - 1);
  const handleNext = () => scrollToIndex(activeIndex + 1);

  const handleEpisodeSelect = (ep: Episode) => {
    setShowEpisodeList(false);
    const idx = episodeList.findIndex((e) => e.id === ep.id);
    if (idx >= 0) scrollToIndex(idx);
  };

  const toggleFavorite = async () => {
    const dramaId = drama?.id;
    if (!dramaId) return;
    try {
      if (isFavorite) {
        await api.favorite.remove(dramaId);
        setIsFavorite(false);
      } else {
        await api.favorite.add(dramaId);
        setIsFavorite(true);
      }
    } catch (e) {
      console.error('toggle favorite failed', e);
    }
  };

  if (isLoading) {
    return (
      <div className="player-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="player-container">
      <div className="player-feed" ref={feedRef}>
        {episodeList.map((episode, index) => (
          <VideoSlide
            key={episode.id}
            episode={episode}
            drama={drama}
            isVip={isVip}
            isActive={index === activeIndex}
            index={index}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
            onPrev={handlePrev}
            onNext={handleNext}
            onBack={() => navigate(-1)}
            onShowList={() => setShowEpisodeList(true)}
            onSubscribe={() => navigate('/subscription')}
            onProgress={handleProgress}
            hasPrev={index > 0}
            hasNext={index < episodeList.length - 1}
          />
        ))}
      </div>

      {/* 剧集列表弹窗 */}
      {showEpisodeList && (
        <div className="episode-list-modal" onClick={() => setShowEpisodeList(false)}>
          <div className="modal-inner" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>选集 ({episodeList.length}集)</h3>
              <button onClick={() => setShowEpisodeList(false)}>✕</button>
            </div>
            <div className="modal-content">
              {episodeList.map((episode) => {
                const idx = episodeList.findIndex((e) => e.id === episode.id);
                const locked = !isVip && !episode.is_free;
                return (
                  <div
                    key={episode.id}
                    className={`episode-item ${idx === activeIndex ? 'active' : ''}`}
                    onClick={() => handleEpisodeSelect(episode)}
                  >
                    <div className="episode-num">{episode.episode_number}</div>
                    <div className="episode-info">
                      <h4>{episode.title || `第${episode.episode_number}集`}</h4>
                      <span>{locked ? '🔒 VIP可看' : '免费'}</span>
                    </div>
                    {idx === activeIndex && <span className="playing-indicator">▶ 播放中</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================== 单个视频卡片 =====================
interface VideoSlideProps {
  episode: Episode;
  drama: any;
  isVip: boolean;
  isActive: boolean;
  index: number;
  isFavorite: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  onToggleFavorite: () => void;
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
  onShowList: () => void;
  onSubscribe: () => void;
  onProgress: (t: number, d: number) => void;
}

const VideoSlide: React.FC<VideoSlideProps> = ({
  episode,
  drama,
  isVip,
  isActive,
  index,
  isFavorite,
  hasPrev,
  hasNext,
  onToggleFavorite,
  onPrev,
  onNext,
  onBack,
  onShowList,
  onSubscribe,
  onProgress,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isTikTokVideo = episode.play_source === 'tiktok' && !!episode.tiktok_video_id;
  const isLocked = !isVip && !episode.is_free;

  // 激活时播放，否则暂停
  useEffect(() => {
    const v = videoRef.current;
    if (!v || isTikTokVideo || isLocked) return;
    if (isActive) {
      v.play().catch(() => {
        /* 浏览器阻止自动播放，用户可点击播放 */
      });
    } else {
      v.pause();
    }
  }, [isActive, isTikTokVideo, isLocked]);

  const handlePlayPause = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    onProgress(v.currentTime, v.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const t = parseFloat(e.target.value);
    v.currentTime = t;
    setCurrentTime(t);
  };

  const toggleControls = () => {
    setShowControls((s) => {
      const next = !s;
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
      if (next) {
        controlsTimer.current = setTimeout(() => setShowControls(false), 3500);
      }
      return next;
    });
  };

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="video-slide" data-index={index}>
      <div className="slide-video-area" onClick={isLocked ? undefined : toggleControls}>
        {/* 锁定状态 */}
        {isLocked ? (
          <div className="slide-locked">
            <div
              className="slide-blur-bg"
              style={{ backgroundImage: `url(${drama?.cover})` }}
            />
            <div className="lock-overlay" onClick={onSubscribe}>
              <div className="lock-icon">🔒</div>
              <h3>VIP 专享内容</h3>
              <p>开通会员解锁全部剧集</p>
              <button className="subscribe-btn">立即开通</button>
            </div>
          </div>
        ) : isTikTokVideo ? (
          /* TikTok 嵌入 */
          <div className="tiktok-embed-wrapper">
            <iframe
              src={`https://www.tiktok.com/embed/v2/${episode.tiktok_video_id}${isActive ? '?autoplay=1' : ''}`}
              className="tiktok-embed-iframe"
              allowFullScreen
              allow="autoplay"
              title="TikTok Video"
            />
          </div>
        ) : (
          /* 标准视频 */
          <video
            ref={videoRef}
            className="video-player"
            src={episode.play_url || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'}
            poster={drama?.cover}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={onNext}
            playsInline
            loop={false}
          />
        )}

        {/* 中央播放/暂停指示（仅普通视频，控件显示时） */}
        {!isLocked && !isTikTokVideo && showControls && (
          <div className="slide-center-btn" onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}>
            {isPlaying ? '⏸' : '▶'}
          </div>
        )}
      </div>

      {/* 顶部栏 */}
      <div className="slide-top-bar">
        <button className="icon-btn" onClick={onBack}>←</button>
        <div className="slide-top-title">
          <h3>{drama?.title || '短剧'}</h3>
          <p>第 {episode.episode_number} 集 {episode.title ? `· ${episode.title}` : ''}</p>
        </div>
      </div>

      {/* 右侧操作栏（抖音风格） */}
      <div className="slide-side-actions">
        <button className="side-action" onClick={onToggleFavorite} title="收藏">
          <span className="side-icon">{isFavorite ? '❤️' : '🤍'}</span>
          <span className="side-label">{isFavorite ? '已收藏' : '收藏'}</span>
        </button>
        {hasPrev && (
          <button className="side-action" onClick={onPrev} title="上一集">
            <span className="side-icon">⬆️</span>
            <span className="side-label">上一集</span>
          </button>
        )}
        {hasNext && (
          <button className="side-action" onClick={onNext} title="下一集">
            <span className="side-icon">⬇️</span>
            <span className="side-label">下一集</span>
          </button>
        )}
        <button className="side-action" onClick={onShowList} title="选集">
          <span className="side-icon">📋</span>
          <span className="side-label">选集</span>
        </button>
      </div>

      {/* 底部信息 + 进度条（仅普通视频） */}
      {!isLocked && !isTikTokVideo && (
        <div className="slide-bottom-bar">
          <div className="slide-bottom-title">
            <h3>{drama?.title || '短剧'}</h3>
            <p>第 {episode.episode_number} 集 · {formatTime(duration)}</p>
          </div>
          <div className="slide-progress">
            <span className="time">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="progress-slider"
              style={{
                background: `linear-gradient(to right, #fe2c55 ${progressPercent}%, rgba(255,255,255,0.3) ${progressPercent}%)`,
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="time">{formatTime(duration)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// 模拟数据 - 支持CDN和TikTok两种播放源
const mockEpisodes: Episode[] = [
  {
    id: 'ep-1',
    episode_number: 1,
    title: 'Episode 1 - The Beginning',
    duration: 180,
    play_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    play_source: 'cdn',
    is_free: true,
  },
  {
    id: 'ep-2',
    episode_number: 2,
    title: 'Episode 2',
    duration: 150,
    play_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    play_source: 'cdn',
    is_free: true,
  },
  ...Array.from({ length: 18 }, (_, i) => ({
    id: `ep-${i + 3}`,
    episode_number: i + 3,
    title: `Episode ${i + 3}`,
    duration: 120 + Math.floor(Math.random() * 60),
    play_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    play_source: 'cdn' as const,
    is_free: i < 1,
  })),
];

export default Player;
