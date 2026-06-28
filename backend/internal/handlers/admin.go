package handlers

import (
	"crypto/rand"
	"math/big"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/dramamax/backend/internal/database"
	"github.com/dramamax/backend/internal/models"
	"github.com/dramamax/backend/internal/storage"
	"github.com/dramamax/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// AdminHandler 管理后台接口处理器
type AdminHandler struct{}

// ===================== 通用辅助函数 =====================

// paginationInfo 解析分页参数
type paginationInfo struct {
	Page   int
	Limit  int
	Offset int
}

func getPagination(c *gin.Context) paginationInfo {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit < 1 || limit > 500 {
		limit = 10
	}
	return paginationInfo{Page: page, Limit: limit, Offset: (page - 1) * limit}
}

func getKeyword(c *gin.Context) string {
	return strings.TrimSpace(c.Query("keyword"))
}

// responseList 统一返回列表格式 {total, rows}
func responseList(c *gin.Context, total int64, rows interface{}) {
	c.JSON(http.StatusOK, gin.H{"total": total, "rows": rows})
}

// parseUintID 解析 uint 主键
func parseUintID(c *gin.Context) (uint64, error) {
	return strconv.ParseUint(c.Param("id"), 10, 64)
}

// applyKeyword 在多个字段上做 LIKE 搜索
func applyKeyword(query *gorm.DB, keyword string, fields ...string) *gorm.DB {
	if keyword == "" {
		return query
	}
	like := "%" + keyword + "%"
	cond := ""
	args := make([]interface{}, 0, len(fields))
	for i, f := range fields {
		if i > 0 {
			cond += " OR "
		}
		cond += f + " LIKE ?"
		args = append(args, like)
	}
	return query.Where("("+cond+")", args...)
}

// randomCode 生成指定长度的随机字母数字兑换码
func randomCode(length int) string {
	const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	b := make([]byte, length)
	for i := range b {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(letters))))
		b[i] = letters[n.Int64()]
	}
	return string(b)
}

// ===================== Admin Auth =====================

type adminLoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Login 管理员登录
func (h *AdminHandler) Login(c *gin.Context) {
	var req adminLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if database.IsDemo {
		token, _ := utils.GenerateAdminToken(1, req.Username)
		c.JSON(http.StatusOK, gin.H{
			"token": token,
			"admin": gin.H{
				"id":       1,
				"username": req.Username,
				"nickname": "Super Admin",
				"role":     "superadmin",
			},
		})
		return
	}

	var admin models.Admin
	if err := database.DB.Where("username = ?", req.Username).First(&admin).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	if admin.Status == "hidden" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account is disabled"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	now := time.Now()
	ip := c.ClientIP()
	database.DB.Model(&admin).Updates(map[string]interface{}{
		"logintime": now,
		"loginip":   ip,
	})

	token, err := utils.GenerateAdminToken(admin.ID, admin.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"admin": gin.H{
			"id":       admin.ID,
			"username": admin.Username,
			"nickname": admin.Nickname,
			"avatar":   admin.Avatar,
			"role":     admin.Role,
		},
	})
}

// GetProfile 获取当前登录管理员信息
func (h *AdminHandler) GetProfile(c *gin.Context) {
	if database.IsDemo {
		c.JSON(http.StatusOK, gin.H{
			"id":       1,
			"username": "admin",
			"nickname": "Super Admin",
			"role":     "superadmin",
			"status":   "normal",
		})
		return
	}

	adminID, _ := c.Get("adminID")
	var admin models.Admin
	if err := database.DB.First(&admin, adminID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Admin not found"})
		return
	}
	c.JSON(http.StatusOK, admin)
}

// Logout 管理员登出（无状态 JWT，直接返回成功）
func (h *AdminHandler) Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ===================== Upload =====================

// UploadImage 管理后台上传图片，OSS 优先本地兜底
func (h *AdminHandler) UploadImage(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "未接收到上传文件"})
		return
	}

	// 限制 10MB
	if file.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "文件大小不能超过 10MB"})
		return
	}

	// 校验扩展名
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true}
	if !allowed[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "仅支持 jpg/jpeg/png/gif/webp 格式"})
		return
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "打开文件失败"})
		return
	}
	defer src.Close()

	store := storage.GetStorage("images")
	url, _, err := store.Upload(src, ext, file.Header.Get("Content-Type"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "上传失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url":    url,
		"path":   url,
		"engine": store.Name(),
	})
}

// UploadVideo 管理后台上传视频，OSS 优先本地兜底
func (h *AdminHandler) UploadVideo(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "未接收到上传文件"})
		return
	}

	// 限制 500MB
	if file.Size > 500*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "视频大小不能超过 500MB"})
		return
	}

	// 校验扩展名
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{".mp4": true, ".m3u8": true, ".ts": true, ".mov": true, ".m4v": true}
	if !allowed[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "仅支持 mp4/m3u8/ts/mov/m4v 格式"})
		return
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "打开文件失败"})
		return
	}
	defer src.Close()

	store := storage.GetStorage("videos")
	contentType := file.Header.Get("Content-Type")
	if contentType == "" || contentType == "application/octet-stream" {
		contentType = "video/mp4"
	}
	url, _, err := store.Upload(src, ext, contentType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "上传失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url":    url,
		"path":   url,
		"engine": store.Name(),
		"size":   file.Size,
	})
}

// ===================== Storage Config =====================

// GetStorageConfig 获取存储配置
func (h *AdminHandler) GetStorageConfig(c *gin.Context) {
	if database.IsDemo {
		c.JSON(http.StatusOK, gin.H{
			"storage_type":  "local",
			"oss_provider":  "",
			"oss_endpoint":  "",
			"oss_access_key": "",
			"oss_secret_key": "",
			"oss_bucket":    "",
			"oss_domain":    "",
			"oss_status":    "hidden",
		})
		return
	}
	var cfg models.StorageConfig
	if err := database.DB.First(&cfg).Error; err != nil {
		// 不存在则返回默认本地配置
		c.JSON(http.StatusOK, gin.H{
			"storage_type":  "local",
			"oss_provider":  "aliyun",
			"oss_endpoint":  "",
			"oss_access_key": "",
			"oss_secret_key": "",
			"oss_bucket":    "",
			"oss_domain":    "",
			"oss_status":    "hidden",
		})
		return
	}
	// 脱敏：不返回 secret_key 明文，只返回是否已设置
	hasSecret := cfg.OSSSecretKey != ""
	resp := gin.H{
		"storage_type":   cfg.StorageType,
		"oss_provider":   cfg.OSSProvider,
		"oss_endpoint":   cfg.OSSEndpoint,
		"oss_access_key": cfg.OSSAccessKey,
		"oss_secret_key": "",
		"oss_secret_set": hasSecret,
		"oss_bucket":     cfg.OSSBucket,
		"oss_domain":     cfg.OSSDomain,
		"oss_status":     cfg.OSSStatus,
	}
	c.JSON(http.StatusOK, resp)
}

// UpdateStorageConfig 更新存储配置
func (h *AdminHandler) UpdateStorageConfig(c *gin.Context) {
	var req struct {
		StorageType  string `json:"storage_type"`
		OSSProvider  string `json:"oss_provider"`
		OSSEndpoint  string `json:"oss_endpoint"`
		OSSAccessKey string `json:"oss_access_key"`
		OSSSecretKey string `json:"oss_secret_key"`
		OSSBucket    string `json:"oss_bucket"`
		OSSDomain    string `json:"oss_domain"`
		OSSStatus    string `json:"oss_status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if database.IsDemo {
		c.JSON(http.StatusOK, gin.H{"message": "ok"})
		return
	}

	var cfg models.StorageConfig
	err := database.DB.First(&cfg).Error
	if err != nil {
		// 不存在则创建
		cfg = models.StorageConfig{
			StorageType:  "local",
			OSSProvider:  "aliyun",
		}
	}

	cfg.StorageType = req.StorageType
	if cfg.StorageType == "" {
		cfg.StorageType = "local"
	}
	cfg.OSSProvider = req.OSSProvider
	if cfg.OSSProvider == "" {
		cfg.OSSProvider = "aliyun"
	}
	cfg.OSSEndpoint = strings.TrimSpace(req.OSSEndpoint)
	cfg.OSSAccessKey = strings.TrimSpace(req.OSSAccessKey)
	// secret_key 留空表示不修改
	if strings.TrimSpace(req.OSSSecretKey) != "" {
		cfg.OSSSecretKey = strings.TrimSpace(req.OSSSecretKey)
	}
	cfg.OSSBucket = strings.TrimSpace(req.OSSBucket)
	cfg.OSSDomain = strings.TrimSpace(req.OSSDomain)
	cfg.OSSStatus = req.OSSStatus
	if cfg.OSSStatus == "" {
		cfg.OSSStatus = "hidden"
	}

	if err := database.DB.Save(&cfg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

// ===================== Dashboard =====================

// GetStats 返回仪表盘统计数据
func (h *AdminHandler) GetStats(c *gin.Context) {
	if database.IsDemo {
		c.JSON(http.StatusOK, gin.H{
			"total_users":      1024,
			"total_dramas":     56,
			"total_episodes":   820,
			"new_users_today":  28,
			"new_orders_today": 12,
			"total_revenue":    9980.50,
			"today_revenue":    288.00,
			"active_subscriptions": 320,
		})
		return
	}

	var totalUsers, totalDramas, totalEpisodes, newUsersToday, activeSubs int64
	var todayRevenue, totalRevenue float64

	database.DB.Model(&models.User{}).Count(&totalUsers)
	database.DB.Model(&models.Drama{}).Count(&totalDramas)
	database.DB.Model(&models.Episode{}).Count(&totalEpisodes)
	database.DB.Model(&models.Subscription{}).Where("status = ?", "active").Count(&activeSubs)

	startToday := time.Now().Truncate(24 * time.Hour)
	database.DB.Model(&models.User{}).Where("created_at >= ?", startToday).Count(&newUsersToday)

	// 今日充值收入
	database.DB.Model(&models.RechargeRecord{}).
		Where("status = ? AND pay_time >= ?", "paid", startToday).
		Select("COALESCE(SUM(current_price), 0)").Row().Scan(&todayRevenue)
	// 累计充值收入
	database.DB.Model(&models.RechargeRecord{}).
		Where("status = ?", "paid").
		Select("COALESCE(SUM(current_price), 0)").Row().Scan(&totalRevenue)

	var newOrdersToday int64
	database.DB.Model(&models.RechargeRecord{}).Where("created_at >= ?", startToday).Count(&newOrdersToday)

	c.JSON(http.StatusOK, gin.H{
		"total_users":          totalUsers,
		"total_dramas":         totalDramas,
		"total_episodes":       totalEpisodes,
		"new_users_today":      newUsersToday,
		"new_orders_today":     newOrdersToday,
		"total_revenue":        totalRevenue,
		"today_revenue":        todayRevenue,
		"active_subscriptions": activeSubs,
	})
}

// ===================== Drama CRUD =====================

func (h *AdminHandler) ListDramas(c *gin.Context) {
	if database.IsDemo {
		all := database.MockDramas()
		responseList(c, int64(len(all)), all)
		return
	}
	p := getPagination(c)
	keyword := getKeyword(c)

	var total int64
	query := database.DB.Model(&models.Drama{})
	query = applyKeyword(query, keyword, "title", "category", "director", "description")
	query.Count(&total)

	var rows []models.Drama
	query.Order("created_at DESC").Offset(p.Offset).Limit(p.Limit).Find(&rows)
	responseList(c, total, rows)
}

// ListAllDramas 返回所有剧目（不分页，用于下拉选择）
func (h *AdminHandler) ListAllDramas(c *gin.Context) {
	if database.IsDemo {
		c.JSON(http.StatusOK, gin.H{"data": database.MockDramas()})
		return
	}
	var dramas []models.Drama
	database.DB.Select("id, title").Order("created_at DESC").Find(&dramas)
	c.JSON(http.StatusOK, gin.H{"data": dramas})
}

// SetUserVIP 设置用户VIP状态
func (h *AdminHandler) SetUserVIP(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		IsVIP       bool       `json:"is_vip"`
		VIPExpireAt *time.Time `json:"vip_expire_at"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if database.IsDemo {
		c.JSON(http.StatusOK, gin.H{"message": "ok"})
		return
	}
	updates := map[string]interface{}{
		"is_vip":        req.IsVIP,
		"vip_expire_at": req.VIPExpireAt,
	}
	if err := database.DB.Model(&models.User{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

func (h *AdminHandler) CreateDrama(c *gin.Context) {
	var drama models.Drama
	if err := c.ShouldBindJSON(&drama); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if drama.ID == uuid.Nil {
		drama.ID = uuid.New()
	}
	if err := database.DB.Create(&drama).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, drama)
}

func (h *AdminHandler) UpdateDrama(c *gin.Context) {
	id := c.Param("id")
	var drama models.Drama
	if err := database.DB.First(&drama, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Drama not found"})
		return
	}
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	delete(updates, "id")
	delete(updates, "created_at")
	if err := database.DB.Model(&drama).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	database.DB.First(&drama, "id = ?", id)
	c.JSON(http.StatusOK, drama)
}

func (h *AdminHandler) DeleteDrama(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.Drama{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ===================== Episode CRUD =====================

func (h *AdminHandler) ListEpisodes(c *gin.Context) {
	p := getPagination(c)
	keyword := getKeyword(c)
	dramaID := c.Query("drama_id")

	if database.IsDemo {
		responseList(c, 0, []models.Episode{})
		return
	}

	var total int64
	query := database.DB.Model(&models.Episode{})
	if dramaID != "" {
		query = query.Where("drama_id = ?", dramaID)
	}
	query = applyKeyword(query, keyword, "title")
	query.Count(&total)

	var rows []models.Episode
	query.Order("episode_number ASC").Offset(p.Offset).Limit(p.Limit).Find(&rows)
	responseList(c, total, rows)
}

func (h *AdminHandler) CreateEpisode(c *gin.Context) {
	var ep models.Episode
	if err := c.ShouldBindJSON(&ep); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if ep.ID == uuid.Nil {
		ep.ID = uuid.New()
	}
	if err := database.DB.Create(&ep).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ep)
}

func (h *AdminHandler) UpdateEpisode(c *gin.Context) {
	id := c.Param("id")
	var ep models.Episode
	if err := database.DB.First(&ep, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Episode not found"})
		return
	}
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	delete(updates, "id")
	delete(updates, "created_at")
	if err := database.DB.Model(&ep).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	database.DB.First(&ep, "id = ?", id)
	c.JSON(http.StatusOK, ep)
}

func (h *AdminHandler) DeleteEpisode(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.Episode{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ===================== User CRUD =====================

func (h *AdminHandler) ListUsers(c *gin.Context) {
	if database.IsDemo {
		u := database.MockUser()
		responseList(c, 1, []*models.User{u})
		return
	}
	p := getPagination(c)
	keyword := getKeyword(c)
	isVip := c.Query("is_vip")

	var total int64
	query := database.DB.Model(&models.User{})
	query = applyKeyword(query, keyword, "nickname", "open_id", "city", "country")
	if isVip == "true" {
		query = query.Where("is_vip = ?", true)
	} else if isVip == "false" {
		query = query.Where("is_vip = ?", false)
	}
	query.Count(&total)

	var rows []models.User
	query.Order("created_at DESC").Offset(p.Offset).Limit(p.Limit).Find(&rows)
	responseList(c, total, rows)
}

func (h *AdminHandler) UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := database.DB.First(&user, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	delete(updates, "id")
	delete(updates, "created_at")
	if err := database.DB.Model(&user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	database.DB.First(&user, "id = ?", id)
	c.JSON(http.StatusOK, user)
}

// ===================== Banner CRUD =====================

func (h *AdminHandler) ListBanners(c *gin.Context) {
	p := getPagination(c)
	keyword := getKeyword(c)
	area := c.Query("area")
	status := c.Query("status")

	if database.IsDemo {
		responseList(c, 0, []models.Banner{})
		return
	}

	var total int64
	query := database.DB.Model(&models.Banner{})
	query = applyKeyword(query, keyword, "title")
	if area != "" {
		query = query.Where("area = ?", area)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	query.Count(&total)

	var rows []models.Banner
	query.Order("weigh DESC, created_at DESC").Offset(p.Offset).Limit(p.Limit).Find(&rows)
	responseList(c, total, rows)
}

func (h *AdminHandler) CreateBanner(c *gin.Context) {
	var banner models.Banner
	if err := c.ShouldBindJSON(&banner); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := database.DB.Create(&banner).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, banner)
}

func (h *AdminHandler) UpdateBanner(c *gin.Context) {
	id, err := parseUintID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	var banner models.Banner
	if err := database.DB.First(&banner, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Banner not found"})
		return
	}
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	delete(updates, "id")
	delete(updates, "created_at")
	if err := database.DB.Model(&banner).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	database.DB.First(&banner, id)
	c.JSON(http.StatusOK, banner)
}

func (h *AdminHandler) DeleteBanner(c *gin.Context) {
	id, err := parseUintID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	if err := database.DB.Delete(&models.Banner{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ===================== Feedback =====================

func (h *AdminHandler) ListFeedback(c *gin.Context) {
	p := getPagination(c)
	keyword := getKeyword(c)

	if database.IsDemo {
		responseList(c, 0, []models.Feedback{})
		return
	}

	var total int64
	query := database.DB.Model(&models.Feedback{})
	query = applyKeyword(query, keyword, "content", "contact_info")
	query.Count(&total)

	var rows []models.Feedback
	query.Order("created_at DESC").Offset(p.Offset).Limit(p.Limit).Find(&rows)
	responseList(c, total, rows)
}

func (h *AdminHandler) DeleteFeedback(c *gin.Context) {
	id, err := parseUintID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	if err := database.DB.Delete(&models.Feedback{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ===================== RechargePlan CRUD =====================

func (h *AdminHandler) ListRechargePlans(c *gin.Context) {
	p := getPagination(c)
	keyword := getKeyword(c)
	rechargeType := c.Query("recharge_type")

	if database.IsDemo {
		responseList(c, 0, []models.RechargePlan{})
		return
	}

	var total int64
	query := database.DB.Model(&models.RechargePlan{})
	query = applyKeyword(query, keyword, "google_id", "ios_id")
	if rechargeType != "" {
		query = query.Where("recharge_type = ?", rechargeType)
	}
	query.Count(&total)

	var rows []models.RechargePlan
	query.Order("created_at DESC").Offset(p.Offset).Limit(p.Limit).Find(&rows)
	responseList(c, total, rows)
}

func (h *AdminHandler) CreateRechargePlan(c *gin.Context) {
	var plan models.RechargePlan
	if err := c.ShouldBindJSON(&plan); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := database.DB.Create(&plan).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, plan)
}

func (h *AdminHandler) UpdateRechargePlan(c *gin.Context) {
	id, err := parseUintID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	var plan models.RechargePlan
	if err := database.DB.First(&plan, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Plan not found"})
		return
	}
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	delete(updates, "id")
	delete(updates, "created_at")
	if err := database.DB.Model(&plan).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	database.DB.First(&plan, id)
	c.JSON(http.StatusOK, plan)
}

func (h *AdminHandler) DeleteRechargePlan(c *gin.Context) {
	id, err := parseUintID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	if err := database.DB.Delete(&models.RechargePlan{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ===================== RechargeRecord =====================

func (h *AdminHandler) ListRechargeRecords(c *gin.Context) {
	p := getPagination(c)
	keyword := getKeyword(c)
	userID := c.Query("user_id")
	status := c.Query("status")

	if database.IsDemo {
		responseList(c, 0, []models.RechargeRecord{})
		return
	}

	var total int64
	query := database.DB.Model(&models.RechargeRecord{})
	query = applyKeyword(query, keyword, "out_trade_no", "transaction_id")
	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	query.Count(&total)

	var rows []models.RechargeRecord
	query.Order("created_at DESC").Offset(p.Offset).Limit(p.Limit).Find(&rows)
	responseList(c, total, rows)
}

// ===================== RedeemBatch CRUD =====================

type createRedeemBatchRequest struct {
	BatchName      string `json:"batch_name"`
	BatchNo        string `json:"batch_no"`
	Type           string `json:"type"`
	Value          int    `json:"value"`
	TotalCount     int    `json:"total_count"`
	ValidStartTime string `json:"valid_start_time"`
	ValidEndTime   string `json:"valid_end_time"`
	Status         string `json:"status"`
}

func (h *AdminHandler) ListRedeemBatches(c *gin.Context) {
	p := getPagination(c)
	keyword := getKeyword(c)

	if database.IsDemo {
		responseList(c, 0, []models.RedeemBatch{})
		return
	}

	var total int64
	query := database.DB.Model(&models.RedeemBatch{})
	query = applyKeyword(query, keyword, "batch_name", "batch_no")
	query.Count(&total)

	var rows []models.RedeemBatch
	query.Order("created_at DESC").Offset(p.Offset).Limit(p.Limit).Find(&rows)
	responseList(c, total, rows)
}

func (h *AdminHandler) CreateRedeemBatch(c *gin.Context) {
	var req createRedeemBatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.TotalCount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "total_count must be > 0"})
		return
	}
	if req.TotalCount > 10000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "total_count cannot exceed 10000"})
		return
	}

	// 解析时间
	var validStart, validEnd time.Time
	var err error
	if req.ValidStartTime != "" {
		validStart, err = time.Parse(time.RFC3339, req.ValidStartTime)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid valid_start_time, use RFC3339"})
			return
		}
	} else {
		validStart = time.Now()
	}
	if req.ValidEndTime != "" {
		validEnd, err = time.Parse(time.RFC3339, req.ValidEndTime)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid valid_end_time, use RFC3339"})
			return
		}
	} else {
		validEnd = validStart.AddDate(1, 0, 0)
	}

	if req.BatchNo == "" {
		req.BatchNo = "BATCH_" + time.Now().Format("20060102150405") + "_" + randomCode(4)
	}
	if req.Status == "" {
		req.Status = "normal"
	}

	// 创建批次
	batch := models.RedeemBatch{
		BatchName:      req.BatchName,
		BatchNo:        req.BatchNo,
		Type:           req.Type,
		Value:          req.Value,
		TotalCount:     req.TotalCount,
		ValidStartTime: validStart,
		ValidEndTime:   validEnd,
		Status:         req.Status,
	}
	if err := database.DB.Create(&batch).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 生成兑换码
	codes := make([]models.RedeemCode, 0, req.TotalCount)
	seen := make(map[string]bool, req.TotalCount)
	for len(codes) < req.TotalCount {
		code := randomCode(10)
		if seen[code] {
			continue
		}
		seen[code] = true
		codes = append(codes, models.RedeemCode{
			Code:           code,
			BatchID:        batch.ID,
			Type:           batch.Type,
			Value:          batch.Value,
			Status:         "unused",
			UseLimit:       1,
			ValidStartTime: batch.ValidStartTime,
			ValidEndTime:   batch.ValidEndTime,
		})
	}

	if err := database.DB.CreateInBatches(codes, 500).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error(), "batch_id": batch.ID})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"batch":     batch,
		"code_count": len(codes),
	})
}

func (h *AdminHandler) UpdateRedeemBatch(c *gin.Context) {
	id, err := parseUintID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	var batch models.RedeemBatch
	if err := database.DB.First(&batch, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Batch not found"})
		return
	}
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	delete(updates, "id")
	delete(updates, "created_at")
	delete(updates, "total_count")
	delete(updates, "batch_no")
	if err := database.DB.Model(&batch).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	database.DB.First(&batch, id)
	c.JSON(http.StatusOK, batch)
}

func (h *AdminHandler) DeleteRedeemBatch(c *gin.Context) {
	id, err := parseUintID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	// 删除批次及关联兑换码
	tx := database.DB.Begin()
	if err := tx.Where("batch_id = ?", id).Delete(&models.RedeemCode{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if err := tx.Delete(&models.RedeemBatch{}, id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ===================== RedeemCode =====================

func (h *AdminHandler) ListRedeemCodes(c *gin.Context) {
	p := getPagination(c)
	keyword := getKeyword(c)
	batchID := c.Query("batch_id")
	status := c.Query("status")

	if database.IsDemo {
		responseList(c, 0, []models.RedeemCode{})
		return
	}

	var total int64
	query := database.DB.Model(&models.RedeemCode{})
	query = applyKeyword(query, keyword, "code")
	if batchID != "" {
		query = query.Where("batch_id = ?", batchID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	query.Count(&total)

	var rows []models.RedeemCode
	query.Order("created_at DESC").Offset(p.Offset).Limit(p.Limit).Find(&rows)
	responseList(c, total, rows)
}

func (h *AdminHandler) DeleteRedeemCode(c *gin.Context) {
	id, err := parseUintID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	if err := database.DB.Delete(&models.RedeemCode{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ===================== RedeemLog =====================

func (h *AdminHandler) ListRedeemLogs(c *gin.Context) {
	p := getPagination(c)
	keyword := getKeyword(c)
	userID := c.Query("user_id")
	batchID := c.Query("batch_id")

	if database.IsDemo {
		responseList(c, 0, []models.RedeemLog{})
		return
	}

	var total int64
	query := database.DB.Model(&models.RedeemLog{})
	query = applyKeyword(query, keyword, "code")
	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}
	if batchID != "" {
		query = query.Where("batch_id = ?", batchID)
	}
	query.Count(&total)

	var rows []models.RedeemLog
	query.Order("created_at DESC").Offset(p.Offset).Limit(p.Limit).Find(&rows)
	responseList(c, total, rows)
}

// ===================== TaskConfig CRUD =====================

func (h *AdminHandler) ListTaskConfigs(c *gin.Context) {
	p := getPagination(c)
	keyword := getKeyword(c)
	taskType := c.Query("type")

	if database.IsDemo {
		responseList(c, 0, []models.TaskConfig{})
		return
	}

	var total int64
	query := database.DB.Model(&models.TaskConfig{})
	query = applyKeyword(query, keyword, "title", "task_key")
	if taskType != "" {
		query = query.Where("type = ?", taskType)
	}
	query.Count(&total)

	var rows []models.TaskConfig
	query.Order("weigh DESC, created_at DESC").Offset(p.Offset).Limit(p.Limit).Find(&rows)
	responseList(c, total, rows)
}

func (h *AdminHandler) CreateTaskConfig(c *gin.Context) {
	var task models.TaskConfig
	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := database.DB.Create(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, task)
}

func (h *AdminHandler) UpdateTaskConfig(c *gin.Context) {
	id, err := parseUintID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	var task models.TaskConfig
	if err := database.DB.First(&task, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	delete(updates, "id")
	delete(updates, "created_at")
	if err := database.DB.Model(&task).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	database.DB.First(&task, id)
	c.JSON(http.StatusOK, task)
}

func (h *AdminHandler) DeleteTaskConfig(c *gin.Context) {
	id, err := parseUintID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	if err := database.DB.Delete(&models.TaskConfig{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ===================== CheckinConfig CRUD =====================

func (h *AdminHandler) ListCheckinConfigs(c *gin.Context) {
	p := getPagination(c)

	if database.IsDemo {
		responseList(c, 0, []models.CheckinConfig{})
		return
	}

	var total int64
	query := database.DB.Model(&models.CheckinConfig{})
	query.Count(&total)

	var rows []models.CheckinConfig
	query.Order("day ASC, weigh DESC").Offset(p.Offset).Limit(p.Limit).Find(&rows)
	responseList(c, total, rows)
}

func (h *AdminHandler) CreateCheckinConfig(c *gin.Context) {
	var checkin models.CheckinConfig
	if err := c.ShouldBindJSON(&checkin); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := database.DB.Create(&checkin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, checkin)
}

func (h *AdminHandler) UpdateCheckinConfig(c *gin.Context) {
	id, err := parseUintID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	var checkin models.CheckinConfig
	if err := database.DB.First(&checkin, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Checkin config not found"})
		return
	}
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	delete(updates, "id")
	delete(updates, "created_at")
	if err := database.DB.Model(&checkin).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	database.DB.First(&checkin, id)
	c.JSON(http.StatusOK, checkin)
}

func (h *AdminHandler) DeleteCheckinConfig(c *gin.Context) {
	id, err := parseUintID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	if err := database.DB.Delete(&models.CheckinConfig{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ===================== MoneyLog =====================

func (h *AdminHandler) ListMoneyLogs(c *gin.Context) {
	p := getPagination(c)
	keyword := getKeyword(c)
	userID := c.Query("user_id")
	logType := c.Query("type")

	if database.IsDemo {
		responseList(c, 0, []models.MoneyLog{})
		return
	}

	var total int64
	query := database.DB.Model(&models.MoneyLog{})
	query = applyKeyword(query, keyword, "remark")
	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}
	if logType != "" {
		query = query.Where("type = ?", logType)
	}
	query.Count(&total)

	var rows []models.MoneyLog
	query.Order("created_at DESC").Offset(p.Offset).Limit(p.Limit).Find(&rows)
	responseList(c, total, rows)
}

// ===================== WatchHistory =====================

func (h *AdminHandler) ListWatchHistory(c *gin.Context) {
	p := getPagination(c)
	userID := c.Query("user_id")
	dramaID := c.Query("drama_id")

	if database.IsDemo {
		responseList(c, 0, []models.WatchHistory{})
		return
	}

	var total int64
	query := database.DB.Model(&models.WatchHistory{})
	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}
	if dramaID != "" {
		query = query.Where("drama_id = ?", dramaID)
	}
	query.Count(&total)

	var rows []models.WatchHistory
	query.Order("watched_at DESC").Offset(p.Offset).Limit(p.Limit).Find(&rows)
	responseList(c, total, rows)
}

// ===================== Subscriptions =====================

func (h *AdminHandler) ListSubscriptions(c *gin.Context) {
	p := getPagination(c)
	userID := c.Query("user_id")
	status := c.Query("status")

	if database.IsDemo {
		responseList(c, 0, []models.Subscription{})
		return
	}

	var total int64
	query := database.DB.Model(&models.Subscription{})
	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	query.Count(&total)

	var rows []models.Subscription
	query.Order("created_at DESC").Offset(p.Offset).Limit(p.Limit).Find(&rows)
	responseList(c, total, rows)
}

func (h *AdminHandler) ListSubscriptionPlans(c *gin.Context) {
	p := getPagination(c)

	if database.IsDemo {
		plans := database.MockPlans()
		responseList(c, int64(len(plans)), plans)
		return
	}

	var total int64
	query := database.DB.Model(&models.SubscriptionPlan{})
	query.Count(&total)

	var rows []models.SubscriptionPlan
	query.Order("duration ASC").Offset(p.Offset).Limit(p.Limit).Find(&rows)
	responseList(c, total, rows)
}

func (h *AdminHandler) UpdateSubscriptionPlan(c *gin.Context) {
	id := c.Param("id")
	var plan models.SubscriptionPlan
	if err := database.DB.First(&plan, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Plan not found"})
		return
	}
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	delete(updates, "id")
	delete(updates, "created_at")
	if err := database.DB.Model(&plan).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	database.DB.First(&plan, "id = ?", id)
	c.JSON(http.StatusOK, plan)
}
