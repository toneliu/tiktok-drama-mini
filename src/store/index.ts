import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 用户状态
interface UserState {
  isLoggedIn: boolean;
  userInfo: {
    openId: string;
    nickname: string;
    avatarUrl: string;
  } | null;
  token: string | null;
  isVip: boolean;
  vipExpireAt: string | null;
  
  setUserInfo: (info: any) => void;
  setToken: (token: string) => void;
  setVip: (isVip: boolean, expireAt?: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isLoggedIn: true,
      userInfo: {
        openId: 'mock_demo_user',
        nickname: 'Demo User',
        avatarUrl: 'https://via.placeholder.com/80/4ecdc4/ffffff?text=DU',
      },
      token: 'mock_token_for_demo',
      isVip: false,
      vipExpireAt: null,
      
      setUserInfo: (info) => set({ 
        userInfo: info, 
        isLoggedIn: true 
      }),
      setToken: (token) => set({ token }),
      setVip: (isVip, expireAt) => set({ 
        isVip, 
        vipExpireAt: expireAt || null 
      }),
      logout: () => set({ 
        isLoggedIn: true, 
        userInfo: {
          openId: 'mock_demo_user',
          nickname: 'Demo User',
          avatarUrl: 'https://via.placeholder.com/80/4ecdc4/ffffff?text=DU',
        },
        token: 'mock_token_for_demo',
        isVip: false,
        vipExpireAt: null,
      }),
    }),
    {
      name: 'user-storage',
    }
  )
);

// 订阅套餐类型
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  beans: number;
  duration: number; // 天数
  features: string[];
  isPopular?: boolean;
}

// 订阅状态
interface SubscriptionState {
  plans: SubscriptionPlan[];
  currentPlan: SubscriptionPlan | null;
  isLoading: boolean;
  
  setPlans: (plans: SubscriptionPlan[]) => void;
  setCurrentPlan: (plan: SubscriptionPlan | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()((set) => ({
  plans: [],
  currentPlan: null,
  isLoading: false,
  
  setPlans: (plans) => set({ plans }),
  setCurrentPlan: (plan) => set({ currentPlan: plan }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

// 播放状态
interface PlayState {
  currentDrama: any | null;
  currentEpisode: any | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  
  setCurrentDrama: (drama: any) => void;
  setCurrentEpisode: (episode: any) => void;
  setPlaying: (playing: boolean) => void;
  setProgress: (progress: number, duration: number) => void;
  reset: () => void;
}

export const usePlayStore = create<PlayState>()((set) => ({
  currentDrama: null,
  currentEpisode: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  
  setCurrentDrama: (drama) => set({ currentDrama: drama }),
  setCurrentEpisode: (episode) => set({ currentEpisode: episode }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setProgress: (progress, duration) => set({ progress, duration }),
  reset: () => set({
    currentDrama: null,
    currentEpisode: null,
    isPlaying: false,
    progress: 0,
    duration: 0,
  }),
}));
