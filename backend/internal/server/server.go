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
			user.GET("/profile", middleware.Auth(), userHandler.GetProfile)
			user.PUT("/profile", middleware.Auth(), userHandler.UpdateProfile)
			user.GET("/watch-history", middleware.Auth(), userHandler.GetWatchHistory)
		}

		// 剧集相关
		dramaHandler := &handlers.DramaHandler{}
		drama := v1.Group("/drama")
		{
			drama.GET("/recommend", dramaHandler.GetRecommend)
			drama.GET("/list", dramaHandler.GetList)
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

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
}
