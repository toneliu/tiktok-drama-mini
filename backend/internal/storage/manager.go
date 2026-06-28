package storage

import (
	"github.com/dramamax/backend/internal/database"
	"github.com/dramamax/backend/internal/models"
)

// GetStorage 根据当前存储配置返回对应存储后端
// subDir: "images" 或 "videos"
// 按配置的 storage_type 选择 OSS/TOS/七牛，配置不完整或未启用时本地兜底
func GetStorage(subDir string) Storage {
	if database.DB != nil && !database.IsDemo {
		var cfg models.StorageConfig
		if err := database.DB.First(&cfg).Error; err == nil {
			if cfg.OSSStatus == "normal" {
				switch cfg.StorageType {
				case "oss":
					if cfg.OSSAccessKey != "" && cfg.OSSSecretKey != "" && cfg.OSSBucket != "" && cfg.OSSEndpoint != "" {
						return &OSSStorage{
							Endpoint:  cfg.OSSEndpoint,
							AccessKey: cfg.OSSAccessKey,
							SecretKey: cfg.OSSSecretKey,
							Bucket:    cfg.OSSBucket,
							Domain:    cfg.OSSDomain,
							SubDir:    subDir,
						}
					}
				case "tos":
					if cfg.OSSAccessKey != "" && cfg.OSSSecretKey != "" && cfg.OSSBucket != "" && cfg.OSSEndpoint != "" {
						return &TOSStorage{
							Endpoint:  cfg.OSSEndpoint,
							AccessKey: cfg.OSSAccessKey,
							SecretKey: cfg.OSSSecretKey,
							Bucket:    cfg.OSSBucket,
							Domain:    cfg.OSSDomain,
							SubDir:    subDir,
						}
					}
				case "qiniu":
					if cfg.OSSAccessKey != "" && cfg.OSSSecretKey != "" && cfg.OSSBucket != "" && cfg.OSSDomain != "" {
						return &QiniuStorage{
							Endpoint:  cfg.OSSEndpoint,
							AccessKey: cfg.OSSAccessKey,
							SecretKey: cfg.OSSSecretKey,
							Bucket:    cfg.OSSBucket,
							Domain:    cfg.OSSDomain,
							SubDir:    subDir,
						}
					}
				}
			}
		}
	}
	// 本地兜底
	return &LocalStorage{
		BaseDir: "./data/uploads",
		BaseURL: "/uploads",
		SubDir:  subDir,
	}
}
