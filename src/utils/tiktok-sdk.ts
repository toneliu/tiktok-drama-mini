// TikTok Minis SDK 封装

const TTMinis = window.TTMinis;

export const tiktokSDK = {
  // 检查是否在TikTok Minis环境中
  isMiniApp: (): boolean => {
    return typeof TTMinis !== 'undefined';
  },

  // 登录
  login: (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!TTMinis) {
        // 开发环境模拟
        resolve('mock_code_' + Date.now());
        return;
      }
      TTMinis.login({
        success: (res) => resolve(res.code),
        fail: (err) => reject(err),
      });
    });
  },

  // 获取用户信息
  getUserInfo: () => {
    return new Promise<{
      openId: string;
      nickname: string;
      avatarUrl: string;
      gender: number;
      language: string;
    }>((resolve, reject) => {
      if (!TTMinis) {
        // 开发环境模拟
        resolve({
          openId: 'mock_open_id',
          nickname: 'Test User',
          avatarUrl: 'https://via.placeholder.com/100',
          gender: 0,
          language: 'en',
        });
        return;
      }
      TTMinis.getUserInfo({
        success: (res) => resolve(res.userInfo),
        fail: (err) => reject(err),
      });
    });
  },

  // 支付
  pay: (tradeOrderId: string) => {
    return new Promise<{ orderId: string }>((resolve, reject) => {
      if (!TTMinis) {
        // 开发环境模拟
        setTimeout(() => {
          resolve({ orderId: tradeOrderId });
        }, 1000);
        return;
      }
      TTMinis.pay({
        tradeOrderId,
        success: (res) => resolve(res),
        fail: (err) => reject(new Error(err.errMsg)),
      });
    });
  },

  // 分享到TikTok
  shareToFeed: (videoUrl: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!TTMinis) {
        resolve();
        return;
      }
      TTMinis.shareToFeed({
        videoUrl,
        success: () => resolve(),
        fail: (err) => reject(err),
      });
    });
  },

  // 创建激励视频广告
  createRewardedVideoAd: (adUnitId: string) => {
    if (!TTMinis) {
      return null;
    }
    return TTMinis.createRewardedVideoAd({ adUnitId });
  },

  // 设置导航栏标题
  setNavigationBarTitle: (title: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!TTMinis) {
        resolve();
        return;
      }
      TTMinis.setNavigationBarTitle({
        title,
        success: () => resolve(),
        fail: (err) => reject(err),
      });
    });
  },

  // 获取系统信息
  getSystemInfo: () => {
    return new Promise<{
      screenWidth: number;
      screenHeight: number;
      windowWidth: number;
      windowHeight: number;
      platform: string;
      language: string;
    }>((resolve, reject) => {
      if (!TTMinis) {
        resolve({
          screenWidth: 375,
          screenHeight: 812,
          windowWidth: 375,
          windowHeight: 812,
          platform: 'devtools',
          language: 'en',
        });
        return;
      }
      TTMinis.getSystemInfo({
        success: (res) => resolve(res),
        fail: (err) => reject(err),
      });
    });
  },

  // 本地存储
  storage: {
    set: (key: string, data: any) => {
      return new Promise<void>((resolve, reject) => {
        if (!TTMinis) {
          localStorage.setItem(key, JSON.stringify(data));
          resolve();
          return;
        }
        TTMinis.setStorage({
          key,
          data,
          success: () => resolve(),
          fail: (err) => reject(err),
        });
      });
    },

    get: <T = any>(key: string): Promise<T | null> => {
      return new Promise((resolve, reject) => {
        if (!TTMinis) {
          const data = localStorage.getItem(key);
          resolve(data ? JSON.parse(data) : null);
          return;
        }
        TTMinis.getStorage({
          key,
          success: (res) => resolve(res.data),
          fail: () => resolve(null),
        });
      });
    },

    remove: (key: string) => {
      return new Promise<void>((resolve, reject) => {
        if (!TTMinis) {
          localStorage.removeItem(key);
          resolve();
          return;
        }
        TTMinis.removeStorage({
          key,
          success: () => resolve(),
          fail: (err) => reject(err),
        });
      });
    },
  },
};

export default tiktokSDK;
