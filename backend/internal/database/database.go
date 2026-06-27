package database

import (
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/dramamax/backend/internal/config"
	"github.com/dramamax/backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var (
	DB       *gorm.DB
	IsDemo   bool
	mockInit sync.Once
)

func Init(cfg *config.Config) error {
	// 尝试连接MySQL
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.DBName,
	)

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Printf("[WARN] MySQL connection failed (%v), switching to DEMO mode (in-memory mock data)", err)
		IsDemo = true
		return nil
	}

	// 自动迁移
	if err := DB.AutoMigrate(
		&models.User{}, &models.Drama{}, &models.Episode{},
		&models.SubscriptionPlan{}, &models.Subscription{},
		&models.PaymentOrder{}, &models.WatchHistory{},
	); err != nil {
		log.Printf("[WARN] Migration failed (%v), switching to DEMO mode", err)
		IsDemo = true
		return nil
	}

	log.Println("[OK] Database initialized successfully")
	return nil
}

// MockDramas 返回演示用剧集
func MockDramas() []models.Drama {
	return []models.Drama{
		{ID: uuid.New(), Title: "Love in the City", Cover: "https://via.placeholder.com/300x450/ff6b6b/ffffff?text=Love+in+the+City", Description: "A romantic story about two strangers who meet in the bustling city and fall in love.", Rating: 4.8, TotalEpisodes: 20, Category: "Romance", IsHot: true, ViewCount: 15234, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New(), Title: "The Billionaire's Secret", Cover: "https://via.placeholder.com/300x450/4ecdc4/ffffff?text=The+Billionaire", Description: "Mystery and romance intertwine in this gripping tale.", Rating: 4.7, TotalEpisodes: 20, Category: "Romance", IsHot: true, ViewCount: 12450, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New(), Title: "Revenge Queen", Cover: "https://via.placeholder.com/300x450/45b7d1/ffffff?text=Revenge+Queen", Description: "A story of justice, betrayal and redemption.", Rating: 4.9, TotalEpisodes: 25, Category: "Drama", IsHot: true, ViewCount: 18900, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New(), Title: "CEO's Hidden Wife", Cover: "https://via.placeholder.com/300x450/f9ca24/ffffff?text=CEO+Wife", Description: "A marriage of convenience turns into a passionate love story.", Rating: 4.6, TotalEpisodes: 18, Category: "Romance", IsNew: true, ViewCount: 5200, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New(), Title: "The Alpha King", Cover: "https://via.placeholder.com/300x450/6c5ce7/ffffff?text=Alpha+King", Description: "Fantasy romance set in a world of werewolves.", Rating: 4.8, TotalEpisodes: 22, Category: "Fantasy", IsHot: true, ViewCount: 14200, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New(), Title: "My Boss is a Vampire", Cover: "https://via.placeholder.com/300x450/e17055/ffffff?text=Vampire+Boss", Description: "A supernatural office romance.", Rating: 4.5, TotalEpisodes: 16, Category: "Fantasy", IsNew: true, ViewCount: 4800, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New(), Title: "Campus Love Story", Cover: "https://via.placeholder.com/300x450/00b894/ffffff?text=Campus+Love", Description: "Sweet romance on the college campus.", Rating: 4.4, TotalEpisodes: 12, Category: "Romance", IsNew: true, ViewCount: 3500, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New(), Title: "The Detective's Case", Cover: "https://via.placeholder.com/300x450/fdcb6e/ffffff?text=Detective", Description: "Mystery detective series with suspense and intrigue.", Rating: 4.7, TotalEpisodes: 15, Category: "Mystery", IsNew: true, ViewCount: 4100, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New(), Title: "Royal Romance", Cover: "https://via.placeholder.com/300x450/a29bfe/ffffff?text=Royal", Description: "A princess and a commoner find love.", Rating: 4.6, TotalEpisodes: 18, Category: "Romance", ViewCount: 6200, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New(), Title: "Martial Arts Master", Cover: "https://via.placeholder.com/300x450/74b9ff/ffffff?text=Martial+Arts", Description: "Action-packed martial arts adventure.", Rating: 4.8, TotalEpisodes: 30, Category: "Action", ViewCount: 7800, CreatedAt: time.Now(), UpdatedAt: time.Now()},
	}
}

// MockEpisodes 返回某剧的所有集
func MockEpisodes(dramaID uuid.UUID) []models.Episode {
	count := 20
	episodes := make([]models.Episode, count)
	playSources := []string{"cdn", "tiktok"}
	for i := 0; i < count; i++ {
		episodes[i] = models.Episode{
			ID:            uuid.New(),
			DramaID:       dramaID,
			EpisodeNumber: i + 1,
			Title:         fmt.Sprintf("Episode %d - The Beginning of Love", i+1),
			Thumbnail:     fmt.Sprintf("https://via.placeholder.com/320x180/1a1a2e/ffffff?text=EP%d", i+1),
			Duration:      120 + i*5,
			PlayURL:       fmt.Sprintf("https://cdn.dramamax.com/episodes/%s/ep%d.mp4", dramaID.String()[:8], i+1),
			PlaySource:    playSources[i%2],
			TikTokVideoID: fmt.Sprintf("video_%d_%s", i+1, dramaID.String()[:8]),
			IsFree:        i < 3, // 前3集免费
			ViewCount:     int64(1000 - i*30),
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}
	}
	return episodes
}

// MockPlans 返回订阅套餐
func MockPlans() []models.SubscriptionPlan {
	return []models.SubscriptionPlan{
		{ID: uuid.New(), Name: "Monthly", Price: 9.99, Beans: 500, Duration: 30, IsActive: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New(), Name: "Quarterly", Price: 24.99, Beans: 1300, Duration: 90, IsPopular: true, IsActive: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.New(), Name: "Yearly", Price: 79.99, Beans: 4000, Duration: 365, IsActive: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
	}
}

// MockUser 返回演示用户
func MockUser() *models.User {
	return &models.User{
		ID:        uuid.MustParse("00000000-0000-0000-0000-000000000001"),
		OpenID:    "mock_demo_user",
		Nickname:  "Demo User",
		AvatarURL: "https://via.placeholder.com/80/4ecdc4/ffffff?text=DU",
		IsVIP:     false,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}
