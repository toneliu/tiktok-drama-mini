# TikTok Minis 短剧小程序

基于React + TypeScript开发的TikTok Minis短剧小程序，支持月度会员订阅。

## 功能特性

- 🎬 短剧浏览和播放
- 👤 TikTok一键登录
- 👑 月度会员订阅
- 💳 TikTok Beans支付
- 📺 观看历史记录
- 🎨 深色主题UI

## 技术栈

- React 18 + TypeScript
- Vite 构建工具
- React Router v6
- Zustand 状态管理
- Axios HTTP客户端

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.development` 文件并修改配置：

```bash
cp .env.development .env.local
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000`

### 4. 构建生产版本

```bash
npm run build
```

## TikTok Minis 开发

### 安装TikTok Minis CLI

```bash
npm install -g tiktok-minis-cli
```

### 本地调试

1. 启动开发服务器：
```bash
npm run dev
```

2. 在另一个终端运行Minis调试：
```bash
npm run minis:dev
```

3. 使用TikTok客户端扫描二维码进行调试

### 构建Minis包

```bash
npm run minis:build
```

## 项目结构

```
tiktok-drama-mini/
├── src/
│   ├── pages/           # 页面组件
│   │   ├── Login.tsx    # 登录页
│   │   ├── Home.tsx     # 首页
│   │   ├── DramaDetail.tsx  # 剧集详情
│   │   ├── Player.tsx   # 播放器
│   │   ├── Subscription.tsx # 订阅页
│   │   └── Profile.tsx  # 个人中心
│   ├── store/           # 状态管理
│   ├── utils/           # 工具函数
│   │   ├── api.ts       # API封装
│   │   └── tiktok-sdk.ts # TikTok SDK封装
│   ├── types/           # 类型定义
│   ├── App.tsx          # 应用入口
│   └── main.tsx         # 渲染入口
├── index.html
├── vite.config.ts
└── package.json
```

## TikTok SDK 接口

### 登录

```typescript
import { tiktokSDK } from '@/utils/tiktok-sdk';

// 获取登录code
const code = await tiktokSDK.login();

// 获取用户信息
const userInfo = await tiktokSDK.getUserInfo();
```

### 支付

```typescript
// 发起支付
await tiktokSDK.pay(tradeOrderId);
```

### 存储

```typescript
// 保存数据
await tiktokSDK.storage.set('key', data);

// 读取数据
const data = await tiktokSDK.storage.get('key');
```

## 订阅流程

1. 用户选择订阅套餐
2. 后端创建订单并返回 `tradeOrderId`
3. 前端调用 `TTMinis.pay(tradeOrderId)`
4. 用户在TikTok内完成支付
5. TikTok回调后端通知支付结果
6. 后端验证并更新用户VIP状态

## 注意事项

1. **支付安全**：所有订单必须由后端创建，前端只负责调用支付接口
2. **签名验证**：支付回调必须验证TikTok签名
3. **会员状态**：建议使用Redis缓存会员状态，减少数据库查询
4. **调试环境**：开发环境下SDK会返回模拟数据

## 相关文档

- [TikTok Minis 开发文档](https://developers.tiktok.com/)
- [TikTok Beans 支付集成](https://developers.tiktok.com/doc/minis-payment)

## License

MIT
