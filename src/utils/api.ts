import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// API配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，清除token并跳转登录
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          console.error('没有权限访问');
          break;
        case 404:
          console.error('资源不存在');
          break;
        case 500:
          console.error('服务器错误');
          break;
        default:
          console.error('请求失败:', error.message);
      }
    }
    return Promise.reject(error);
  }
);

// API接口定义
export const api = {
  // 用户相关
  user: {
    // TikTok登录
    login: (code: string) => apiClient.post('/user/login', { code }),
    // 获取用户信息
    getProfile: () => apiClient.get('/user/profile'),
    // 更新用户信息
    updateProfile: (data: any) => apiClient.put('/user/profile', data),
  },

  // 剧集相关
  drama: {
    // 获取首页推荐
    getRecommend: (page = 1, limit = 10) =>
      apiClient.get('/drama/recommend', { params: { page, limit } }),
    // 获取剧集列表
    getList: (params: { category?: string; page?: number; limit?: number }) =>
      apiClient.get('/drama/list', { params }),
    // 获取剧集详情
    getDetail: (dramaId: string) => apiClient.get(`/drama/${dramaId}`),
    // 获取剧集集数
    getEpisodes: (dramaId: string) => apiClient.get(`/drama/${dramaId}/episodes`),
    // 获取播放地址
    getPlayUrl: (episodeId: string) => apiClient.get(`/episode/${episodeId}/play`),
    // 记录观看进度
    recordProgress: (episodeId: string, progress: number) =>
      apiClient.post(`/episode/${episodeId}/progress`, { progress }),
    // 获取观看历史
    getHistory: (page = 1, limit = 20) =>
      apiClient.get('/user/watch-history', { params: { page, limit } }),
  },

  // 订阅相关
  subscription: {
    // 获取订阅套餐
    getPlans: () => apiClient.get('/subscription/plans'),
    // 获取当前订阅状态
    getStatus: () => apiClient.get('/subscription/status'),
    // 创建订阅订单
    createOrder: (planId: string) => apiClient.post('/subscription/order', { planId }),
    // 验证支付回调
    verifyPayment: (orderId: string) => apiClient.get(`/subscription/order/${orderId}/verify`),
    // 取消订阅
    cancel: () => apiClient.post('/subscription/cancel'),
  },

  // 支付相关
  payment: {
    // 创建支付订单
    createTradeOrder: (data: {
      planId: string;
      priceAmount: number;
      orderDetail: any;
    }) => apiClient.post('/payment/trade-order/create', data),
    // 查询订单状态
    getOrderStatus: (orderId: string) => apiClient.get(`/payment/order/${orderId}`),
  },
};

export default api;
