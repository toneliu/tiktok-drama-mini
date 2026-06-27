// TikTok Minis SDK Type Definitions

declare global {
  interface Window {
    TTMinis: TTMinisSDK;
  }
}

interface TTMinisSDK {
  // 登录
  login(options: {
    success?: (res: { code: string }) => void;
    fail?: (err: Error) => void;
  }): void;

  // 获取用户信息
  getUserInfo(options: {
    success?: (res: {
      userInfo: {
        openId: string;
        nickname: string;
        avatarUrl: string;
        gender: number;
        language: string;
        city: string;
        province: string;
        country: string;
      };
    }) => void;
    fail?: (err: Error) => void;
  }): void;

  // 支付
  pay(options: {
    tradeOrderId: string;
    success?: (res: { orderId: string }) => void;
    fail?: (err: { errMsg: string }) => void;
  }): void;

  // 分享到TikTok
  shareToFeed(options: {
    videoPath?: string;
    videoUrl?: string;
    success?: () => void;
    fail?: (err: Error) => void;
  }): void;

  // 创建激励视频广告
  createRewardedVideoAd(options: {
    adUnitId: string;
    success?: () => void;
    fail?: (err: Error) => void;
  }): RewardedVideoAd;

  // 设置导航栏标题
  setNavigationBarTitle(options: {
    title: string;
    success?: () => void;
    fail?: (err: Error) => void;
  }): void;

  // 获取系统信息
  getSystemInfo(options: {
    success?: (res: {
      brand: string;
      model: string;
      pixelRatio: number;
      screenWidth: number;
      screenHeight: number;
      windowWidth: number;
      windowHeight: number;
      language: string;
      version: string;
      platform: string;
    }) => void;
    fail?: (err: Error) => void;
  }): void;

  // 存储
  setStorage(options: {
    key: string;
    data: any;
    success?: () => void;
    fail?: (err: Error) => void;
  }): void;

  getStorage(options: {
    key: string;
    success?: (res: { data: any }) => void;
    fail?: (err: Error) => void;
  }): void;

  removeStorage(options: {
    key: string;
    success?: () => void;
    fail?: (err: Error) => void;
  }): void;

  // 网络请求
  request(options: {
    url: string;
    data?: any;
    header?: Record<string, string>;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    dataType?: string;
    success?: (res: { data: any; statusCode: number }) => void;
    fail?: (err: Error) => void;
    complete?: () => void;
  }): void;
}

interface RewardedVideoAd {
  show(): void;
  onLoad(callback: () => void): void;
  onError(callback: (err: Error) => void): void;
  onClose(callback: (res: { isEnded: boolean }) => void): void;
}

export {};
