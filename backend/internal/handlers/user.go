package handlers

import (
	"net/http"
	"time"

	"github.com/dramamax/backend/internal/database"
	"github.com/dramamax/backend/internal/models"
	"github.com/dramamax/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UserHandler struct{}

type LoginRequest struct {
	Code string `json:"code" binding:"required"`
}

type LoginResponse struct {
	Token        string      `json:"token"`
	User         *models.User `json:"user"`
	Subscription *struct {
		IsActive bool `json:"isActive"`
	} `json:"subscription,omitempty"`
}

func (h *UserHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	openID := "mock_open_id_" + req.Code

	if database.IsDemo {
		user := database.MockUser()
		token, _ := utils.GenerateToken(user.ID)
		c.JSON(http.StatusOK, LoginResponse{
			Token: token,
			User:  user,
		})
		return
	}

	var user models.User
	result := database.DB.Where("open_id = ?", openID).First(&user)
	if result.Error != nil {
		user = models.User{
			ID:       uuid.New(),
			OpenID:   openID,
			Nickname: "User_" + time.Now().Format("20060102"),
		}
		database.DB.Create(&user)
	}

	token, _ := utils.GenerateToken(user.ID)
	c.JSON(http.StatusOK, LoginResponse{
		Token: token,
		User:  &user,
	})
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID := c.GetString("userID")

	if database.IsDemo {
		c.JSON(http.StatusOK, database.MockUser())
		return
	}

	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID := c.GetString("userID")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if database.IsDemo {
		c.JSON(http.StatusOK, gin.H{"message": "updated", "data": database.MockUser()})
		return
	}

	database.DB.Model(&models.User{}).Where("id = ?", userID).Updates(updates)
	var user models.User
	database.DB.First(&user, "id = ?", userID)
	c.JSON(http.StatusOK, user)
}

// WatchHistoryItem 观看历史项（含剧目信息）
type WatchHistoryItem struct {
	ID            uuid.UUID `json:"id"`
	DramaID       uuid.UUID `json:"drama_id"`
	EpisodeID     uuid.UUID `json:"episode_id"`
	Title         string    `json:"title"`
	Cover         string    `json:"cover"`
	TotalEpisodes int       `json:"total_episodes"`
	EpisodeNumber int       `json:"progress"`   // 已看到第几集
	Position      int       `json:"position"`   // 当前集播放秒数
	Duration      int       `json:"duration"`
	WatchedAt     time.Time `json:"watched_at"`
}

func (h *UserHandler) GetWatchHistory(c *gin.Context) {
	userID := c.GetString("userID")

	if database.IsDemo {
		c.JSON(http.StatusOK, gin.H{"data": []WatchHistoryItem{}})
		return
	}

	// 查询该用户所有观看记录，按时间倒序
	var histories []models.WatchHistory
	if err := database.DB.Where("user_id = ?", userID).
		Order("watched_at DESC").Find(&histories).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"data": []WatchHistoryItem{}})
		return
	}

	// 按剧目去重，每个剧目只保留最新一条
	seen := make(map[uuid.UUID]bool)
	var items []WatchHistoryItem
	for _, wh := range histories {
		if seen[wh.DramaID] {
			continue
		}
		seen[wh.DramaID] = true

		var drama models.Drama
		database.DB.Select("id, title, cover, total_episodes").First(&drama, "id = ?", wh.DramaID)

		var episode models.Episode
		database.DB.Select("id, episode_number").First(&episode, "id = ?", wh.EpisodeID)

		items = append(items, WatchHistoryItem{
			ID:            wh.ID,
			DramaID:       wh.DramaID,
			EpisodeID:     wh.EpisodeID,
			Title:         drama.Title,
			Cover:         drama.Cover,
			TotalEpisodes: drama.TotalEpisodes,
			EpisodeNumber: episode.EpisodeNumber,
			Position:      wh.Progress,
			Duration:      wh.Duration,
			WatchedAt:     wh.WatchedAt,
		})
	}

	if items == nil {
		items = []WatchHistoryItem{}
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func (h *UserHandler) RecordProgress(c *gin.Context) {
	userID := c.GetString("userID")
	episodeID := c.Param("episodeId")

	var req struct {
		Progress int `json:"progress"`
		Duration int `json:"duration"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		// progress 可选
		req.Progress = 0
	}

	if database.IsDemo {
		c.JSON(http.StatusOK, gin.H{"success": true})
		return
	}

	// 查询剧集获取 drama_id 和 episode_number
	var episode models.Episode
	if err := database.DB.First(&episode, "id = ?", episodeID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Episode not found"})
		return
	}

	userUUID, _ := uuid.Parse(userID)
	now := time.Now()

	// upsert：同用户同剧集更新，否则新建
	var wh models.WatchHistory
	result := database.DB.Where("user_id = ? AND episode_id = ?", userUUID, episode.ID).First(&wh)
	if result.Error != nil {
		wh = models.WatchHistory{
			ID:          uuid.New(),
			UserID:      userUUID,
			DramaID:     episode.DramaID,
			EpisodeID:   episode.ID,
			Progress:    req.Progress,
			Duration:    req.Duration,
			IsCompleted: req.Duration > 0 && req.Progress >= req.Duration-5,
			WatchedAt:   now,
		}
		database.DB.Create(&wh)
	} else {
		database.DB.Model(&wh).Updates(map[string]interface{}{
			"progress":      req.Progress,
			"duration":      req.Duration,
			"is_completed":  req.Duration > 0 && req.Progress >= req.Duration-5,
			"watched_at":    now,
		})
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ===================== Favorites =====================

// FavoriteItem 收藏项（含剧目信息）
type FavoriteItem struct {
	ID            uuid.UUID `json:"id"`
	DramaID       uuid.UUID `json:"drama_id"`
	Title         string    `json:"title"`
	Cover         string    `json:"cover"`
	TotalEpisodes int       `json:"total_episodes"`
	Rating        float64   `json:"rating"`
	IsHot         bool      `json:"is_hot"`
	CreatedAt     time.Time `json:"created_at"`
}

func (h *UserHandler) GetFavorites(c *gin.Context) {
	userID := c.GetString("userID")

	if database.IsDemo {
		c.JSON(http.StatusOK, gin.H{"data": []FavoriteItem{}})
		return
	}

	var favs []models.Favorite
	if err := database.DB.Where("user_id = ?", userID).
		Order("created_at DESC").Find(&favs).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"data": []FavoriteItem{}})
		return
	}

	var items []FavoriteItem
	for _, f := range favs {
		var drama models.Drama
		database.DB.First(&drama, "id = ?", f.DramaID)
		items = append(items, FavoriteItem{
			ID:            f.ID,
			DramaID:       f.DramaID,
			Title:         drama.Title,
			Cover:         drama.Cover,
			TotalEpisodes: drama.TotalEpisodes,
			Rating:        drama.Rating,
			IsHot:         drama.IsHot,
			CreatedAt:     f.CreatedAt,
		})
	}

	if items == nil {
		items = []FavoriteItem{}
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func (h *UserHandler) AddFavorite(c *gin.Context) {
	userID := c.GetString("userID")

	var req struct {
		DramaID string `json:"drama_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if database.IsDemo {
		c.JSON(http.StatusOK, gin.H{"success": true})
		return
	}

	userUUID, _ := uuid.Parse(userID)
	dramaUUID, _ := uuid.Parse(req.DramaID)

	// 已存在则直接返回成功（幂等）
	var existing models.Favorite
	if err := database.DB.Where("user_id = ? AND drama_id = ?", userUUID, dramaUUID).First(&existing).Error; err == nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "id": existing.ID})
		return
	}

	fav := models.Favorite{
		ID:      uuid.New(),
		UserID:  userUUID,
		DramaID: dramaUUID,
	}
	if err := database.DB.Create(&fav).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "id": fav.ID})
}

func (h *UserHandler) RemoveFavorite(c *gin.Context) {
	userID := c.GetString("userID")
	dramaID := c.Param("dramaId")

	if database.IsDemo {
		c.JSON(http.StatusOK, gin.H{"success": true})
		return
	}

	userUUID, _ := uuid.Parse(userID)
	dramaUUID, _ := uuid.Parse(dramaID)

	if err := database.DB.Where("user_id = ? AND drama_id = ?", userUUID, dramaUUID).
		Delete(&models.Favorite{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// CheckFavorite 检查是否已收藏
func (h *UserHandler) CheckFavorite(c *gin.Context) {
	userID := c.GetString("userID")
	dramaID := c.Param("dramaId")

	if database.IsDemo {
		c.JSON(http.StatusOK, gin.H{"is_favorite": false})
		return
	}

	userUUID, _ := uuid.Parse(userID)
	dramaUUID, _ := uuid.Parse(dramaID)

	var count int64
	database.DB.Model(&models.Favorite{}).
		Where("user_id = ? AND drama_id = ?", userUUID, dramaUUID).Count(&count)
	c.JSON(http.StatusOK, gin.H{"is_favorite": count > 0})
}
