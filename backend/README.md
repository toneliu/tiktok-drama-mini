# TikTok Minis 短剧小程序后端服务

基于Go + Gin框架开发的TikTok Minis短剧小程序后端服务。

## 功能特性

- 用户认证（TikTok登录）
- 剧集管理
- 订阅系统
- TikTok Beans支付集成
- 观看历史记录

## 技术栈

- Go 1.21+
- Gin Web Framework
- GORM (MySQL)
- Redis
- JWT认证

## 快速开始

### 1. 安装依赖

```bash
go mod download
```

### 2. 配置数据库

创建MySQL数据库：
```sql
CREATE DATABASE dramamax CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 修改配置

编辑 `config/config.yaml` 文件，配置数据库连接、Redis、TikTok开发者密钥等。

### 4. 运行服务

```bash
go run cmd/main.go
```

服务将在 `http://localhost:8080` 启动。

## API接口

### 用户接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/v1/user/login | TikTok登录 |
| GET | /api/v1/user/profile | 获取用户信息 |
| PUT | /api/v1/user/profile | 更新用户信息 |
| GET | /api/v1/user/watch-history | 观看历史 |

### 剧集接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/v1/drama/recommend | 推荐剧集 |
| GET | /api/v1/drama/list | 剧集列表 |
| GET | /api/v1/drama/:id | 剧集详情 |
| GET | /api/v1/drama/:id/episodes | 剧集集数 |
| GET | /api/v1/episode/:id/play | 获取播放地址 |

### 订阅接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/v1/subscription/plans | 订阅套餐列表 |
| GET | /api/v1/subscription/status | 订阅状态 |
| POST | /api/v1/subscription/order | 创建订阅订单 |
| GET | /api/v1/subscription/order/:id/verify | 验证支付 |
| POST | /api/v1/subscription/cancel | 取消订阅 |

## TikTok支付集成

### 支付流程

1. 前端调用 `tt.login` 获取code
2. 后端使用code换取用户openId
3. 创建订单时调用TikTok `trade_order/create` API
4. 前端调用 `TTMinis.pay` 发起支付
5. 支付完成后TikTok回调通知
6. 后端验证签名并更新订单状态

### 环境变量

```
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
```

## 目录结构

```
backend/
├── cmd/
│   └── main.go           # 入口文件
├── config/
│   └── config.yaml       # 配置文件
├── internal/
│   ├── config/           # 配置加载
│   ├── database/         # 数据库连接
│   ├── handlers/         # API处理器
│   ├── middleware/       # 中间件
│   ├── models/           # 数据模型
│   ├── server/           # 服务器配置
│   └── utils/            # 工具函数
├── go.mod
└── go.sum
```

## License

MIT
