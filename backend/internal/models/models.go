package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User 用户模型
type User struct {
	ID          uuid.UUID      `json:"id" gorm:"type:char(36);primaryKey"`
	OpenID      string         `json:"open_id" gorm:"uniqueIndex;size:128"`
	Nickname    string         `json:"nickname" gorm:"size:128"`
	AvatarURL   string         `json:"avatar_url" gorm:"size:512"`
	Gender      int            `json:"gender" gorm:"default:0"`
	Language    string         `json:"language" gorm:"size:16"`
	Country     string         `json:"country" gorm:"size:64"`
	Province    string         `json:"province" gorm:"size:64"`
	City        string         `json:"city" gorm:"size:64"`
	IsVIP       bool           `json:"is_vip" gorm:"default:false"`
	VIPExpireAt *time.Time     `json:"vip_expire_at"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// Drama 剧集模型
type Drama struct {
	ID            uuid.UUID      `json:"id" gorm:"type:char(36);primaryKey"`
	Title         string         `json:"title" gorm:"size:256;not null"`
	Cover         string         `json:"cover" gorm:"size:512"`
	Description   string         `json:"description" gorm:"type:text"`
	Rating        float64        `json:"rating" gorm:"default:0"`
	TotalEpisodes int            `json:"total_episodes" gorm:"default:0"`
	Category      string         `json:"category" gorm:"size:64"`
	Tags          string         `json:"tags" gorm:"type:json"` // JSON array
	Cast          string         `json:"cast" gorm:"type:json"` // JSON array
	Director      string         `json:"director" gorm:"size:128"`
	ReleaseDate   string         `json:"release_date" gorm:"size:32"`
	IsHot         bool           `json:"is_hot" gorm:"default:false"`
	IsNew         bool           `json:"is_new" gorm:"default:false"`
	ViewCount     int64          `json:"view_count" gorm:"default:0"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`
	Episodes      []Episode      `json:"episodes,omitempty" gorm:"foreignKey:DramaID"`
}

func (d *Drama) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}

// Episode 剧集集数模型
type Episode struct {
	ID            uuid.UUID      `json:"id" gorm:"type:char(36);primaryKey"`
	DramaID       uuid.UUID      `json:"drama_id" gorm:"type:char(36);index"`
	EpisodeNumber int            `json:"episode_number" gorm:"not null"`
	Title         string         `json:"title" gorm:"size:256"`
	Thumbnail     string         `json:"thumbnail" gorm:"size:512"`
	Duration      int            `json:"duration"` // 秒
	// 播放源配置
	PlayURL       string         `json:"play_url" gorm:"size:512"`      // 自有CDN/服务器URL
	TikTokVideoID string         `json:"tiktok_video_id" gorm:"size:128"` // TikTok视频ID
	PlaySource    string         `json:"play_source" gorm:"size:32"`    // "cdn" | "tiktok"
	IsFree        bool           `json:"is_free" gorm:"default:false"`
	ViewCount     int64          `json:"view_count" gorm:"default:0"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`
}

func (e *Episode) BeforeCreate(tx *gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}

// SubscriptionPlan 订阅套餐模型
type SubscriptionPlan struct {
	ID          uuid.UUID      `json:"id" gorm:"type:char(36);primaryKey"`
	Name        string         `json:"name" gorm:"size:128;not null"`
	Price       float64        `json:"price" gorm:"not null"`
	Beans       int            `json:"beans" gorm:"not null"`
	Duration    int            `json:"duration"` // 天数
	Features    string         `json:"features" gorm:"type:json"` // JSON array
	IsPopular   bool           `json:"is_popular" gorm:"default:false"`
	Discount    string         `json:"discount" gorm:"size:32"`
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

func (s *SubscriptionPlan) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// Subscription 用户订阅记录
type Subscription struct {
	ID          uuid.UUID      `json:"id" gorm:"type:char(36);primaryKey"`
	UserID      uuid.UUID      `json:"user_id" gorm:"type:char(36);index"`
	PlanID      uuid.UUID      `json:"plan_id" gorm:"type:char(36)"`
	OrderID     string         `json:"order_id" gorm:"size:128;uniqueIndex"`
	Status      string         `json:"status" gorm:"size:32"` // active, expired, cancelled
	StartedAt   time.Time      `json:"started_at"`
	ExpiredAt   time.Time      `json:"expired_at"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

func (s *Subscription) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// PaymentOrder 支付订单
type PaymentOrder struct {
	ID            uuid.UUID      `json:"id" gorm:"type:char(36);primaryKey"`
	UserID        uuid.UUID      `json:"user_id" gorm:"type:char(36);index"`
	OrderID       string         `json:"order_id" gorm:"size:128;uniqueIndex"`
	TradeOrderID  string         `json:"trade_order_id" gorm:"size:128;uniqueIndex"`
	PlanID        uuid.UUID      `json:"plan_id" gorm:"type:char(36)"`
	Amount        int            `json:"amount"` // Beans
	Status        string         `json:"status" gorm:"size:32"` // pending, paid, failed, refunded
	PaymentMethod string         `json:"payment_method" gorm:"size:32"`
	PaidAt        *time.Time     `json:"paid_at"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`
}

func (p *PaymentOrder) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// WatchHistory 观看历史
type WatchHistory struct {
	ID           uuid.UUID      `json:"id" gorm:"type:char(36);primaryKey"`
	UserID       uuid.UUID      `json:"user_id" gorm:"type:char(36);index"`
	DramaID      uuid.UUID      `json:"drama_id" gorm:"type:char(36);index"`
	EpisodeID    uuid.UUID      `json:"episode_id" gorm:"type:char(36)"`
	Progress     int            `json:"progress"` // 秒
	Duration     int            `json:"duration"` // 秒
	IsCompleted  bool           `json:"is_completed" gorm:"default:false"`
	WatchedAt    time.Time      `json:"watched_at"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

func (w *WatchHistory) BeforeCreate(tx *gorm.DB) error {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	return nil
}
