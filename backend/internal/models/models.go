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
	IsVIP       bool           `json:"is_vip" gorm:"column:is_vip;default:false"`
	VIPExpireAt *time.Time     `json:"vip_expire_at" gorm:"column:vip_expire_at"`
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
	TikTokVideoID string         `json:"tiktok_video_id" gorm:"column:tiktok_video_id;size:128"` // TikTok视频ID
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

// Admin 管理员
type Admin struct {
	ID        uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	Username  string         `json:"username" gorm:"size:64;uniqueIndex;not null"`
	Password  string         `json:"-" gorm:"size:256;not null"`
	Nickname  string         `json:"nickname" gorm:"size:64"`
	Avatar    string         `json:"avatar" gorm:"size:512"`
	Role      string         `json:"role" gorm:"size:32;default:admin"`           // superadmin, admin
	Status    string         `json:"status" gorm:"size:16;default:normal"`        // normal, hidden
	Logintime *time.Time     `json:"logintime"`
	Loginip   string         `json:"loginip" gorm:"size:64"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// Banner 轮播图
type Banner struct {
	ID        uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	Title     string         `json:"title" gorm:"size:256"`
	Img       string         `json:"img" gorm:"size:512"`
	Path      string         `json:"path" gorm:"size:512"`                        // link URL
	Type      string         `json:"type" gorm:"size:32"`                         // drama, external, etc
	Area      string         `json:"area" gorm:"size:32"`                         // home, detail, etc
	Status    string         `json:"status" gorm:"size:16;default:normal"`        // normal, hidden
	PageType  string         `json:"page_type" gorm:"size:32"`
	Weigh     int            `json:"weigh" gorm:"default:0"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// Feedback 意见反馈
type Feedback struct {
	ID          uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID      uuid.UUID      `json:"user_id" gorm:"type:char(36);index"`
	ContactInfo string         `json:"contact_info" gorm:"size:256"`
	Content     string         `json:"content" gorm:"type:text"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// RechargePlan 充值配置
type RechargePlan struct {
	ID            uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	RechargeType  string         `json:"recharge_type" gorm:"size:32"`            // vip, coins
	OriginalPrice float64        `json:"original_price"`
	CurrentPrice  float64        `json:"current_price"`
	Amount        int            `json:"amount"`                                  // coins or vip days
	BonusGold     int            `json:"bonus_gold" gorm:"default:0"`
	Status        string         `json:"status" gorm:"size:16;default:normal"`     // normal, hidden
	GoogleID      string         `json:"google_id" gorm:"size:128"`
	IOSID         string         `json:"ios_id" gorm:"size:128"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`
}

// RechargeRecord 用户充值记录
type RechargeRecord struct {
	ID              uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	OutTradeNo      string         `json:"out_trade_no" gorm:"size:128;uniqueIndex"`
	UserID          uuid.UUID      `json:"user_id" gorm:"type:char(36);index"`
	RechargePlanID  uint           `json:"recharge_plan_id"`
	Status          string         `json:"status" gorm:"size:32"`                   // pending, paid, failed, refunded
	RechargeType    string         `json:"recharge_type" gorm:"size:32"`
	OriginalPrice   float64        `json:"original_price"`
	CurrentPrice    float64        `json:"current_price"`
	Amount          int            `json:"amount"`
	BonusGold       int            `json:"bonus_gold"`
	PaymentMethod   string         `json:"payment_method" gorm:"size:32"`
	TransactionID   string         `json:"transaction_id" gorm:"size:256"`
	PayTime         *time.Time     `json:"pay_time"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`
}

// RedeemBatch 兑换码批次
type RedeemBatch struct {
	ID              uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	BatchName       string         `json:"batch_name" gorm:"size:128"`
	BatchNo         string         `json:"batch_no" gorm:"size:64;uniqueIndex"`
	Type            string         `json:"type" gorm:"size:32"`                     // coins, vip
	Value           int            `json:"value"`                                  // coins amount or vip days
	TotalCount      int            `json:"total_count"`
	UsedCount       int            `json:"used_count" gorm:"default:0"`
	ValidStartTime  time.Time      `json:"valid_start_time"`
	ValidEndTime    time.Time      `json:"valid_end_time"`
	Status          string         `json:"status" gorm:"size:16;default:normal"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`
}

// RedeemCode 兑换码
type RedeemCode struct {
	ID              uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	Code            string         `json:"code" gorm:"size:64;uniqueIndex"`
	BatchID         uint           `json:"batch_id" gorm:"index"`
	Type            string         `json:"type" gorm:"size:32"`                     // coins, vip
	Value           int            `json:"value"`
	Status          string         `json:"status" gorm:"size:16;default:unused"`   // unused, used, expired
	UserID          *uuid.UUID     `json:"user_id" gorm:"type:char(36)"`
	UsedTime        *time.Time     `json:"used_time"`
	UsedCount       int            `json:"used_count" gorm:"default:0"`
	UseLimit        int            `json:"use_limit" gorm:"default:1"`
	ValidStartTime  time.Time      `json:"valid_start_time"`
	ValidEndTime    time.Time      `json:"valid_end_time"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`
}

// RedeemLog 兑换记录
type RedeemLog struct {
	ID            uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	Code          string         `json:"code" gorm:"size:64"`
	BatchID       uint           `json:"batch_id"`
	UserID        uuid.UUID      `json:"user_id" gorm:"type:char(36);index"`
	Type          string         `json:"type" gorm:"size:32"`
	Value         int            `json:"value"`
	Coins         int            `json:"coins"`
	VipDays       int            `json:"vip_days"`
	BeforeBalance int            `json:"before_balance"`
	AfterBalance  int            `json:"after_balance"`
	IP            string         `json:"ip" gorm:"size:64"`
	DeviceType    string         `json:"device_type" gorm:"size:32"`
	CreatedAt     time.Time      `json:"created_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`
}

// TaskConfig 任务配置
type TaskConfig struct {
	ID           uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	Image        string         `json:"image" gorm:"size:512"`
	Title        string         `json:"title" gorm:"size:128"`
	Type         string         `json:"type" gorm:"size:32"`                      // daily, one_time
	TaskKey      string         `json:"task_key" gorm:"size:64"`
	RewardType   string         `json:"reward_type" gorm:"size:32"`               // coins, vip
	RewardAmount int            `json:"reward_amount"`
	MaxTimes     int            `json:"max_times" gorm:"default:1"`
	Status       string         `json:"status" gorm:"size:16;default:normal"`
	OpLink       string         `json:"op_link" gorm:"size:512"`
	Weigh        int            `json:"weigh" gorm:"default:0"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

// CheckinConfig 签到配置
type CheckinConfig struct {
	ID           uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	Day          int            `json:"day"`                                     // 1-7
	RewardAmount int            `json:"reward_amount"`
	RewardType   string         `json:"reward_type" gorm:"size:32"`               // coins, vip
	RewardDesc   string         `json:"reward_desc" gorm:"size:256"`
	IsEnabled    bool           `json:"is_enabled" gorm:"default:true"`
	Weigh        int            `json:"weigh" gorm:"default:0"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

// MoneyLog 金币变动记录
type MoneyLog struct {
	ID        uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    uuid.UUID      `json:"user_id" gorm:"type:char(36);index"`
	Type      string         `json:"type" gorm:"size:32"`                       // recharge, spend, reward, redeem
	Amount    int            `json:"amount"`                                   // positive=add, negative=subtract
	Before    int            `json:"before"`
	After     int            `json:"after"`
	Remark    string         `json:"remark" gorm:"size:256"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}
