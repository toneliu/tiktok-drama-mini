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

func (h *UserHandler) GetWatchHistory(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"data": []models.WatchHistory{}})
}

func (h *UserHandler) RecordProgress(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"success": true})
}
