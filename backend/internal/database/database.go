package database

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/dramamax/backend/internal/config"
	"github.com/dramamax/backend/internal/models"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var (
	DB       *gorm.DB
	IsDemo   bool
	mockInit sync.Once
)

func Init(cfg *config.Config) error {
	// 优先尝试 SQLite（无需额外服务）
	if cfg.Database.Type == "sqlite" || cfg.Database.Host == "" {
		if err := initSQLite(cfg); err == nil {
			return nil
		}
	}

	// 尝试连接MySQL
	if cfg.Database.Type == "mysql" || cfg.Database.Host != "" {
		if err := initMySQL(cfg); err == nil {
			return nil
		}
	}

	// 都失败则回退到内存 DEMO 模式
	log.Println("[WARN] All database connections failed, switching to DEMO mode (in-memory mock data)")
	IsDemo = true
	return nil
}

func initMySQL(cfg *config.Config) error {
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
		log.Printf("[WARN] MySQL connection failed: %v", err)
		return err
	}

	if err := autoMigrate(); err != nil {
		log.Printf("[WARN] MySQL migration failed: %v", err)
		return err
	}

	log.Println("[OK] MySQL database initialized successfully")
	return nil
}

func initSQLite(cfg *config.Config) error {
	dbPath := cfg.Database.DBName
	if dbPath == "" || dbPath == "dramamax" {
		// 默认 SQLite 文件路径
		dbPath = filepath.Join(".", "data", "dramamax.db")
	}

	// 确保目录存在
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		log.Printf("[WARN] Failed to create SQLite directory: %v", err)
		return err
	}

	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Printf("[WARN] SQLite connection failed: %v", err)
		return err
	}

	if err := autoMigrate(); err != nil {
		log.Printf("[WARN] SQLite migration failed: %v", err)
		return err
	}

	log.Printf("[OK] SQLite database initialized: %s", dbPath)
	return nil
}

func autoMigrate() error {
	if err := DB.AutoMigrate(
		&models.User{}, &models.Drama{}, &models.Episode{},
		&models.SubscriptionPlan{}, &models.Subscription{},
		&models.PaymentOrder{}, &models.WatchHistory{}, &models.Favorite{},
		&models.Admin{}, &models.Banner{}, &models.Feedback{},
		&models.RechargePlan{}, &models.RechargeRecord{},
		&models.RedeemBatch{}, &models.RedeemCode{}, &models.RedeemLog{},
		&models.TaskConfig{}, &models.CheckinConfig{}, &models.MoneyLog{},
		&models.StorageConfig{},
	); err != nil {
		return err
	}
	return seed()
}

// seed 在表为空时写入默认数据（管理员、轮播图、签到配置等）
func seed() error {
	// 默认管理员
	var adminCount int64
	if err := DB.Model(&models.Admin{}).Count(&adminCount).Error; err != nil {
		log.Printf("[WARN] seed admin count failed: %v", err)
	} else if adminCount == 0 {
		hashed, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("[WARN] seed bcrypt failed: %v", err)
		} else {
			admin := models.Admin{
				Username: "admin",
				Password: string(hashed),
				Nickname: "Super Admin",
				Role:     "superadmin",
				Status:   "normal",
			}
			if err := DB.Create(&admin).Error; err != nil {
				log.Printf("[WARN] seed admin create failed: %v", err)
			} else {
				log.Println("[OK] Default admin created (username: admin, password: admin123)")
			}
		}
	}

	// 默认轮播图
	var bannerCount int64
	if err := DB.Model(&models.Banner{}).Count(&bannerCount).Error; err == nil && bannerCount == 0 {
		banners := []models.Banner{
			{Title: "Welcome Banner", Img: "https://via.placeholder.com/750x300/ff6b6b/ffffff?text=Welcome", Path: "/pages/index/index", Type: "drama", Area: "home", Status: "normal", Weigh: 100},
			{Title: "Hot Dramas", Img: "https://via.placeholder.com/750x300/4ecdc4/ffffff?text=Hot+Dramas", Path: "/pages/index/index", Type: "drama", Area: "home", Status: "normal", Weigh: 90},
		}
		DB.Create(&banners)
	}

	// 默认充值配置
	var rechargePlanCount int64
	if err := DB.Model(&models.RechargePlan{}).Count(&rechargePlanCount).Error; err == nil && rechargePlanCount == 0 {
		plans := []models.RechargePlan{
			{RechargeType: "coins", OriginalPrice: 0.99, CurrentPrice: 0.99, Amount: 60, BonusGold: 0, Status: "normal", IOSID: "coins_60", GoogleID: "coins_60"},
			{RechargeType: "coins", OriginalPrice: 4.99, CurrentPrice: 4.99, Amount: 300, BonusGold: 30, Status: "normal", IOSID: "coins_300", GoogleID: "coins_300"},
			{RechargeType: "vip", OriginalPrice: 9.99, CurrentPrice: 9.99, Amount: 30, BonusGold: 0, Status: "normal", IOSID: "vip_month", GoogleID: "vip_month"},
		}
		DB.Create(&plans)
	}

	// 默认签到配置
	var checkinCount int64
	if err := DB.Model(&models.CheckinConfig{}).Count(&checkinCount).Error; err == nil && checkinCount == 0 {
		checkins := make([]models.CheckinConfig, 7)
		for i := 0; i < 7; i++ {
			checkins[i] = models.CheckinConfig{
				Day:          i + 1,
				RewardAmount: 10 + i*5,
				RewardType:   "coins",
				RewardDesc:   fmt.Sprintf("Day %d reward", i+1),
				IsEnabled:    true,
				Weigh:        i + 1,
			}
		}
		DB.Create(&checkins)
	}

	// 默认任务配置
	var taskCount int64
	if err := DB.Model(&models.TaskConfig{}).Count(&taskCount).Error; err == nil && taskCount == 0 {
		tasks := []models.TaskConfig{
			{Title: "Daily Check-in", Type: "daily", TaskKey: "daily_checkin", RewardType: "coins", RewardAmount: 10, MaxTimes: 1, Status: "normal", OpLink: "/pages/checkin/checkin", Weigh: 100},
			{Title: "Watch Episode", Type: "daily", TaskKey: "watch_episode", RewardType: "coins", RewardAmount: 5, MaxTimes: 3, Status: "normal", OpLink: "/pages/index/index", Weigh: 90},
			{Title: "Share Drama", Type: "daily", TaskKey: "share_drama", RewardType: "coins", RewardAmount: 20, MaxTimes: 1, Status: "normal", OpLink: "/pages/index/index", Weigh: 80},
		}
		DB.Create(&tasks)
	}

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
