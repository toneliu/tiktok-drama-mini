package main

import (
	"log"
	"github.com/dramamax/backend/internal/config"
	"github.com/dramamax/backend/internal/server"
)

func main() {
	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 启动服务器
	srv := server.New(cfg)
	if err := srv.Run(); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
