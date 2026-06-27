import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/utils/api';
import { useUserStore, usePlayStore } from '@/store';
import './Player.css';

interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  duration: number;
  playUrl: string;
  tiktokVideoId?: string;
  playSource?: 'cdn' | 'tiktok';
}

const Player: React.FC = () => {
  const { episodeId } = useParams<{ episodeId: string }>();
  const navigate = useNavigate();
  const { isVip } = useUserStore();
  const { currentDrama, currentEpisode, setCurrentEpisode, setProgress } = usePlayStore();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [episodeList, setEpisodeList] = useState<Episode[]>([]);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [isTikTokVideo, setIsTikTokVideo] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadEpisodeData();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [episodeId]);

  const loadEpisodeData = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.drama.getPlayUrl(episodeId!);
      
      if (!isVip && !res.isFree) {
        navigate('/subscription');
        return;
      }
      
      // 判断播放源类型
      const episode = res.episode;
      const isTTVideo = episode.playSource === 'tiktok' && episode.tiktokVideoId;
      setIsTikTokVideo(isTTVideo);
      
      setCurrentEpisode(episode);
      setEpisodeList(res.episodes || mockEpisodes);
    } catch (error) {
      console.error('Failed to load episode:', error);
      // 使用模拟数据
      const mockEpisode = mockEpisodes.find(ep => ep.id === episodeId) || mockEpisodes[0];
      setCurrentEpisode(mockEpisode);
      setEpisodeList(mockEpisodes);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    setProgress(videoRef.current.currentTime, videoRef.current.duration);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVideoClick = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handlePrevious = () => {
    const currentIndex = episodeList.findIndex(ep => ep.id === episodeId);
    if (currentIndex > 0) {
      navigate(`/play/${episodeList[currentIndex - 1].id}`);
    }
  };

  const handleNext = () => {
    const currentIndex = episodeList.findIndex(ep => ep.id === episodeId);
    if (currentIndex < episodeList.length - 1) {
      navigate(`/play/${episodeList[currentIndex + 1].id}`);
    }
  };

  const handleEpisodeSelect = (episode: Episode) => {
    setShowEpisodeList(false);
    navigate(`/play/${episode.id}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (isLoading) {
    return (
      <div className="player-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="player-container">
      {/* 视频播放器 */}
      <div className="video-wrapper" onClick={() => !isTikTokVideo && handleVideoClick()}>
        {/* TikTok视频嵌入播放 - VIP专属 */}
        {isTikTokVideo && currentEpisode?.tiktokVideoId ? (
          isVip ? (
            // VIP用户 - 直接播放TikTok视频
            <div className="tiktok-embed-wrapper">
              <iframe
                src={`https://www.tiktok.com/embed/v2/${currentEpisode.tiktokVideoId}?autoplay=1`}
                className="tiktok-embed-iframe"
                allowFullScreen
                allow="autoplay"
                title="TikTok Video"
              />
            </div>
          ) : (
            // 非VIP用户 - 显示模糊封面 + 订阅提示
            <div className="tiktok-locked-wrapper">
              <div 
                className="tiktok-blur-thumbnail"
                style={{ backgroundImage: `url(${currentDrama?.cover})` }}
              />
              <div className="lock-overlay" onClick={() => navigate('/subscription')}>
                <div className="lock-icon">🔒</div>
                <h3>VIP Content</h3>
                <p>Subscribe to unlock this episode</p>
                <button className="subscribe-btn">Subscribe Now</button>
              </div>
            </div>
          )
        ) : (
          /* 标准CDN视频播放 */
          <video
            ref={videoRef}
            className="video-player"
            src={currentEpisode?.playUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'}
            poster={currentDrama?.cover}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={handleNext}
            playsInline
            autoPlay
          />
        )}
        
        {/* 控制层 - 仅非TikTok视频显示 */}
        {!isTikTokVideo && showControls && (
          <div className="controls-overlay">
            {/* 顶部控制栏 */}
            <div className="top-controls">
              <button className="back-btn" onClick={() => navigate(-1)}>
                ←
              </button>
              <div className="title-info">
                <h3>{currentDrama?.title}</h3>
                <p>EP {currentEpisode?.episodeNumber} - {currentEpisode?.title}</p>
              </div>
            </div>
            
            {/* 中央控制按钮 */}
            <div className="center-controls">
              <button className="control-btn" onClick={handlePrevious}>
                ⏮
              </button>
              <button className="play-btn-large" onClick={handlePlayPause}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button className="control-btn" onClick={handleNext}>
                ⏭
              </button>
            </div>
            
            {/* 底部控制栏 */}
            <div className="bottom-controls">
              <span className="time">{formatTime(currentTime)}</span>
              <div className="progress-bar">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="progress-slider"
                  style={{
                    background: `linear-gradient(to right, #fe2c55 ${progressPercent}%, rgba(255,255,255,0.3) ${progressPercent}%)`
                  }}
                />
              </div>
              <span className="time">{formatTime(duration)}</span>
              <button 
                className="episode-list-btn"
                onClick={() => setShowEpisodeList(true)}
              >
                📋
              </button>
            </div>
          </div>
        )}
        
        {/* TikTok视频的顶部返回按钮 */}
        {isTikTokVideo && (
          <div className="controls-overlay tiktok-overlay">
            <div className="top-controls">
              <button className="back-btn" onClick={() => navigate(-1)}>
                ←
              </button>
              <div className="title-info">
                <h3>{currentDrama?.title}</h3>
                <p>EP {currentEpisode?.episodeNumber} - {currentEpisode?.title}</p>
              </div>
              <button 
                className="episode-list-btn"
                onClick={() => setShowEpisodeList(true)}
              >
                📋
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 剧集列表弹窗 */}
      {showEpisodeList && (
        <div className="episode-list-modal">
          <div className="modal-header">
            <h3>Episodes</h3>
            <button onClick={() => setShowEpisodeList(false)}>✕</button>
          </div>
          <div className="modal-content">
            {episodeList.map((episode) => (
              <div 
                key={episode.id}
                className={`episode-item ${episode.id === episodeId ? 'active' : ''}`}
                onClick={() => handleEpisodeSelect(episode)}
              >
                <div className="episode-num">EP {episode.episodeNumber}</div>
                <div className="episode-info">
                  <h4>{episode.title}</h4>
                  <span>{formatTime(episode.duration)}</span>
                </div>
                {episode.id === episodeId && (
                  <span className="playing-indicator">▶ Playing</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 模拟数据 - 支持CDN和TikTok两种播放源
const mockEpisodes: Episode[] = [
  // TikTok视频
  {
    id: 'ep-1',
    episodeNumber: 1,
    title: 'Episode 1 - The Beginning',
    duration: 180,
    playUrl: '',
    tiktokVideoId: '7376549368795877409', // 示例TikTok视频ID
    playSource: 'tiktok',
  },
  // CDN视频
  {
    id: 'ep-2',
    episodeNumber: 2,
    title: 'Episode 2',
    duration: 150,
    playUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    playSource: 'cdn',
  },
  // 默认CDN视频
  ...Array.from({ length: 18 }, (_, i) => ({
    id: `ep-${i + 3}`,
    episodeNumber: i + 3,
    title: `Episode ${i + 3}`,
    duration: 120 + Math.floor(Math.random() * 60),
    playUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    playSource: 'cdn' as const,
  })),
];

export default Player;
