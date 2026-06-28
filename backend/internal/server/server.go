package server

import (
	"fmt"
	"log"
	"github.com/dramamax/backend/internal/config"
	"github.com/dramamax/backend/internal/database"
	"github.com/dramamax/backend/internal/handlers"
	"github.com/dramamax/backend/internal/middleware"
	"github.com/gin-gonic/gin"
)

type Server struct {
	config *config.Config
	router *gin.Engine
}

func New(cfg *config.Config) *Server {
	// 设置配置
	config.SetConfig(cfg)
	
	// 初始化数据库
	if err := database.Init(cfg); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// 设置Gin模式
	gin.SetMode(cfg.Server.Mode)

	router := gin.New()
	router.Use(middleware.Logger())
	router.Use(middleware.CORS())
	router.Use(gin.Recovery())

	// 注册路由
	registerRoutes(router)

	return &Server{
		config: cfg,
		router: router,
	}
}

func (s *Server) Run() error {
	addr := fmt.Sprintf(":%d", s.config.Server.Port)
	log.Printf("Server starting on %s", addr)
	return s.router.Run(addr)
}

func registerRoutes(r *gin.Engine) {
	// API版本组
	v1 := r.Group("/api/v1")
	{
		// 用户相关
		userHandler := &handlers.UserHandler{}
		user := v1.Group("/user")
		{
			user.POST("/login", userHandler.Login)
			user.POST("/guest-login", userHandler.GuestLogin)
			user.GET("/profile", middleware.Auth(), userHandler.GetProfile)
			user.PUT("/profile", middleware.Auth(), userHandler.UpdateProfile)
			user.GET("/watch-history", middleware.Auth(), userHandler.GetWatchHistory)
			user.GET("/favorites", middleware.Auth(), userHandler.GetFavorites)
			user.POST("/favorites", middleware.Auth(), userHandler.AddFavorite)
			user.DELETE("/favorites/:dramaId", middleware.Auth(), userHandler.RemoveFavorite)
			user.GET("/favorites/:dramaId/check", middleware.Auth(), userHandler.CheckFavorite)
		}

		// 客户端公开配置
		v1.GET("/app-config", userHandler.GetAppConfig)

		// 剧集相关
		dramaHandler := &handlers.DramaHandler{}
		drama := v1.Group("/drama")
		{
			drama.GET("/recommend", dramaHandler.GetRecommend)
			drama.GET("/list", dramaHandler.GetList)
			drama.GET("/categories", dramaHandler.GetCategories)
			drama.GET("/:id", dramaHandler.GetDetail)
			drama.GET("/:id/episodes", dramaHandler.GetEpisodes)
		}

		// 剧集播放
		episode := v1.Group("/episode")
		{
			episode.GET("/:episodeId/play", middleware.Auth(), dramaHandler.GetPlayURL)
			episode.POST("/:episodeId/progress", middleware.Auth(), userHandler.RecordProgress)
		}

		// 订阅相关
		subHandler := &handlers.SubscriptionHandler{}
		subscription := v1.Group("/subscription")
		{
			subscription.GET("/plans", subHandler.GetPlans)
			subscription.GET("/status", middleware.Auth(), subHandler.GetStatus)
			subscription.POST("/order", middleware.Auth(), subHandler.CreateOrder)
			subscription.GET("/order/:orderId/verify", middleware.Auth(), subHandler.VerifyPayment)
			subscription.POST("/cancel", middleware.Auth(), subHandler.Cancel)
		}

		// 支付回调
		payment := v1.Group("/payment")
		{
			payment.POST("/callback", subHandler.PaymentCallback)
		}
	}

	// 管理后台路由
	registerAdminRoutes(r)

	// 静态文件：上传的图片
	r.Static("/uploads", "./data/uploads")

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
}

// registerAdminRoutes 注册管理后台 API 路由
func registerAdminRoutes(r *gin.Engine) {
	adminHandler := &handlers.AdminHandler{}
	admin := r.Group("/api/admin")
	{
		admin.POST("/login", adminHandler.Login)
		admin.Use(middleware.AdminAuth()) // JWT auth middleware for admin
		admin.GET("/profile", adminHandler.GetProfile)
		admin.POST("/logout", adminHandler.Logout)
		admin.POST("/upload", adminHandler.UploadImage)
		admin.POST("/upload/video", adminHandler.UploadVideo)
		admin.GET("/storage-config", adminHandler.GetStorageConfig)
		admin.PUT("/storage-config", adminHandler.UpdateStorageConfig)
		admin.GET("/app-config", adminHandler.GetAppConfig)
		admin.PUT("/app-config", adminHandler.UpdateAppConfig)
		admin.GET("/dashboard/stats", adminHandler.GetStats)

		// Dramas
		admin.GET("/dramas", adminHandler.ListDramas)
		admin.GET("/dramas/all", adminHandler.ListAllDramas)
		admin.POST("/dramas", adminHandler.CreateDrama)
		admin.PUT("/dramas/:id", adminHandler.UpdateDrama)
		admin.DELETE("/dramas/:id", adminHandler.DeleteDrama)

		// Episodes
		admin.GET("/episodes", adminHandler.ListEpisodes)
		admin.POST("/episodes", adminHandler.CreateEpisode)
		admin.PUT("/episodes/:id", adminHandler.UpdateEpisode)
		admin.DELETE("/episodes/:id", adminHandler.DeleteEpisode)

		// Users
		admin.GET("/users", adminHandler.ListUsers)
		admin.PUT("/users/:id", adminHandler.UpdateUser)
		admin.PUT("/users/:id/vip", adminHandler.SetUserVIP)

		// Banners
		admin.GET("/banners", adminHandler.ListBanners)
		admin.POST("/banners", adminHandler.CreateBanner)
		admin.PUT("/banners/:id", adminHandler.UpdateBanner)
		admin.DELETE("/banners/:id", adminHandler.DeleteBanner)

		// Feedback
		admin.GET("/feedback", adminHandler.ListFeedback)
		admin.DELETE("/feedback/:id", adminHandler.DeleteFeedback)

		// Recharge Plans
		admin.GET("/recharge-plans", adminHandler.ListRechargePlans)
		admin.POST("/recharge-plans", adminHandler.CreateRechargePlan)
		admin.PUT("/recharge-plans/:id", adminHandler.UpdateRechargePlan)
		admin.DELETE("/recharge-plans/:id", adminHandler.DeleteRechargePlan)

		// Recharge Records
		admin.GET("/recharge-records", adminHandler.ListRechargeRecords)

		// Redeem Batches
		admin.GET("/redeem-batches", adminHandler.ListRedeemBatches)
		admin.POST("/redeem-batches", adminHandler.CreateRedeemBatch)
		admin.PUT("/redeem-batches/:id", adminHandler.UpdateRedeemBatch)
		admin.DELETE("/redeem-batches/:id", adminHandler.DeleteRedeemBatch)

		// Redeem Codes
		admin.GET("/redeem-codes", adminHandler.ListRedeemCodes)
		admin.DELETE("/redeem-codes/:id", adminHandler.DeleteRedeemCode)

		// Redeem Logs
		admin.GET("/redeem-logs", adminHandler.ListRedeemLogs)

		// Task Configs
		admin.GET("/task-configs", adminHandler.ListTaskConfigs)
		admin.POST("/task-configs", adminHandler.CreateTaskConfig)
		admin.PUT("/task-configs/:id", adminHandler.UpdateTaskConfig)
		admin.DELETE("/task-configs/:id", adminHandler.DeleteTaskConfig)

		// Checkin Configs
		admin.GET("/checkin-configs", adminHandler.ListCheckinConfigs)
		admin.POST("/checkin-configs", adminHandler.CreateCheckinConfig)
		admin.PUT("/checkin-configs/:id", adminHandler.UpdateCheckinConfig)
		admin.DELETE("/checkin-configs/:id", adminHandler.DeleteCheckinConfig)

		// Money Logs
		admin.GET("/money-logs", adminHandler.ListMoneyLogs)

		// Watch History
		admin.GET("/watch-history", adminHandler.ListWatchHistory)

		// Subscriptions
		admin.GET("/subscriptions", adminHandler.ListSubscriptions)
		admin.GET("/subscription-plans", adminHandler.ListSubscriptionPlans)
		admin.PUT("/subscription-plans/:id", adminHandler.UpdateSubscriptionPlan)
	}
}
