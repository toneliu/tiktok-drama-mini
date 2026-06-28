import axios from 'axios'

const request = axios.create({
  baseURL: '/api/admin',
  timeout: 15000,
})

// 请求拦截器：附加 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一处理错误
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        window.location.href = '/admin/login'
        return Promise.reject(new Error('登录已过期，请重新登录'))
      }
      const msg = (data && (data.message || data.error)) || `请求失败 (${status})`
      return Promise.reject(new Error(msg))
    }
    return Promise.reject(new Error('网络异常，请稍后重试'))
  }
)

export default request

// ===== 通用响应类型 =====
export interface PageResult<T = any> {
  rows?: T[]
  list?: T[]
  items?: T[]
  total?: number
  page?: number
  limit?: number
}

export interface PageParams {
  page?: number
  limit?: number
  keyword?: string
}

// ===== 认证 =====
export const authApi = {
  login: (data: { username: string; password: string }) =>
    request.post('/login', data),
  profile: () => request.get('/profile'),
  logout: () => request.post('/logout'),
}

// ===== 仪表盘 =====
export const dashboardApi = {
  stats: () => request.get('/dashboard/stats'),
}

// ===== 文件上传 =====
export const uploadApi = {
  // 上传图片，返回 {url, path, engine}
  image: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  // 上传视频，返回 {url, path, engine, size}
  // onUploadProgress 用于真实进度回调
  video: (file: File, onUploadProgress?: (percent: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 600000, // 10 分钟，视频上传较慢
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      onUploadProgress: onUploadProgress
        ? (e: any) => {
            if (e.total) {
              onUploadProgress(Math.round((e.loaded * 100) / e.total))
            }
          }
        : undefined,
    })
  },
}

// ===== 存储配置（OSS）=====
export const storageConfigApi = {
  get: () => request.get('/storage-config'),
  update: (data: any) => request.put('/storage-config', data),
}

// ===== 剧目 =====
export const dramaApi = {
  list: (params: PageParams) => request.get('/dramas', { params }),
  detail: (id: string) => request.get(`/dramas/${id}`),
  create: (data: any) => request.post('/dramas', data),
  update: (id: string, data: any) => request.put(`/dramas/${id}`, data),
  delete: (id: string) => request.delete(`/dramas/${id}`),
  all: () => request.get('/dramas/all'),
}

// ===== 剧集 =====
export const episodeApi = {
  list: (params: PageParams & { drama_id?: string }) =>
    request.get('/episodes', { params }),
  detail: (id: string) => request.get(`/episodes/${id}`),
  create: (data: any) => request.post('/episodes', data),
  update: (id: string, data: any) => request.put(`/episodes/${id}`, data),
  delete: (id: string) => request.delete(`/episodes/${id}`),
}

// ===== 用户 =====
export const userApi = {
  list: (params: PageParams) => request.get('/users', { params }),
  detail: (id: string) => request.get(`/users/${id}`),
  update: (id: string, data: any) => request.put(`/users/${id}`, data),
  setVip: (id: string, data: { is_vip: boolean; vip_expire_at?: string }) =>
    request.put(`/users/${id}/vip`, data),
}

// ===== 轮播图 =====
export const bannerApi = {
  list: (params: PageParams) => request.get('/banners', { params }),
  create: (data: any) => request.post('/banners', data),
  update: (id: string, data: any) => request.put(`/banners/${id}`, data),
  delete: (id: string) => request.delete(`/banners/${id}`),
}

// ===== 意见反馈 =====
export const feedbackApi = {
  list: (params: PageParams) => request.get('/feedback', { params }),
  delete: (id: string) => request.delete(`/feedback/${id}`),
}

// ===== 充值配置 =====
export const rechargePlanApi = {
  list: (params: PageParams) => request.get('/recharge-plans', { params }),
  create: (data: any) => request.post('/recharge-plans', data),
  update: (id: string, data: any) => request.put(`/recharge-plans/${id}`, data),
  delete: (id: string) => request.delete(`/recharge-plans/${id}`),
}

// ===== 充值记录 =====
export const rechargeRecordApi = {
  list: (params: PageParams) => request.get('/recharge-records', { params }),
}

// ===== 兑换码批次 =====
export const redeemBatchApi = {
  list: (params: PageParams) => request.get('/redeem-batches', { params }),
  create: (data: any) => request.post('/redeem-batches', data),
  delete: (id: string) => request.delete(`/redeem-batches/${id}`),
}

// ===== 兑换码 =====
export const redeemCodeApi = {
  list: (params: PageParams & { batch_id?: string; status?: string }) =>
    request.get('/redeem-codes', { params }),
  delete: (id: string) => request.delete(`/redeem-codes/${id}`),
}

// ===== 兑换记录 =====
export const redeemLogApi = {
  list: (params: PageParams) => request.get('/redeem-logs', { params }),
}

// ===== 任务配置 =====
export const taskConfigApi = {
  list: (params: PageParams) => request.get('/task-configs', { params }),
  create: (data: any) => request.post('/task-configs', data),
  update: (id: string, data: any) => request.put(`/task-configs/${id}`, data),
  delete: (id: string) => request.delete(`/task-configs/${id}`),
}

// ===== 签到配置 =====
export const checkinConfigApi = {
  list: (params: PageParams) => request.get('/checkin-configs', { params }),
  create: (data: any) => request.post('/checkin-configs', data),
  update: (id: string, data: any) => request.put(`/checkin-configs/${id}`, data),
  delete: (id: string) => request.delete(`/checkin-configs/${id}`),
}

// ===== 金币记录 =====
export const moneyLogApi = {
  list: (params: PageParams & { user_id?: string }) =>
    request.get('/money-logs', { params }),
}

// ===== 观看历史 =====
export const watchHistoryApi = {
  list: (params: PageParams & { user_id?: string }) =>
    request.get('/watch-history', { params }),
}

// ===== 订阅记录 =====
export const subscriptionApi = {
  list: (params: PageParams) => request.get('/subscriptions', { params }),
}

// ===== 订阅套餐 =====
export const subscriptionPlanApi = {
  list: (params: PageParams) => request.get('/subscription-plans', { params }),
  create: (data: any) => request.post('/subscription-plans', data),
  update: (id: string, data: any) => request.put(`/subscription-plans/${id}`, data),
  delete: (id: string) => request.delete(`/subscription-plans/${id}`),
}
