package handlers

import (
	"net/http"
	"time"

	"github.com/dramamax/backend/internal/database"
	"github.com/dramamax/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SubscriptionHandler struct{}

func (h *SubscriptionHandler) GetPlans(c *gin.Context) {
	if database.IsDemo {
		c.JSON(http.StatusOK, gin.H{"data": database.MockPlans()})
		return
	}

	var plans []models.SubscriptionPlan
	database.DB.Where("is_active = ?", true).Order("duration ASC").Find(&plans)
	c.JSON(http.StatusOK, gin.H{"data": plans})
}

func (h *SubscriptionHandler) GetStatus(c *gin.Context) {
	userID := c.GetString("userID")

	if database.IsDemo {
		c.JSON(http.StatusOK, gin.H{"isVip": false, "expireAt": nil})
		return
	}

	var user models.User
	database.DB.First(&user, "id = ?", userID)
	status := map[string]interface{}{"isVip": user.IsVIP}
	if user.VIPExpireAt != nil {
		status["expireAt"] = user.VIPExpireAt
	}
	c.JSON(http.StatusOK, status)
}

type CreateOrderRequest struct {
	PlanID string `json:"planId" binding:"required"`
}

func (h *SubscriptionHandler) CreateOrder(c *gin.Context) {
	userID := c.GetString("userID")
	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if database.IsDemo {
		plans := database.MockPlans()
		var plan *models.SubscriptionPlan
		for i := range plans {
			if plans[i].ID.String() == req.PlanID {
				plan = &plans[i]
				break
			}
		}
		if plan == nil && len(plans) > 0 {
			plan = &plans[0]
		}
		if plan == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Plan not found"})
			return
		}

		orderID := "ORD_" + uuid.New().String()[:12]
		tradeOrderID := "TTO_" + uuid.New().String()[:12]
		c.JSON(http.StatusOK, gin.H{
			"orderId":       orderID,
			"tradeOrderId":  tradeOrderID,
			"priceAmount":   plan.Beans,
			"planId":        plan.ID.String(),
			"planName":      plan.Name,
			"planDuration":  plan.Duration,
			"userId":        userID,
		})
		return
	}

	var plan models.SubscriptionPlan
	if err := database.DB.First(&plan, "id = ?", req.PlanID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Plan not found"})
		return
	}

	orderID := "ORD_" + uuid.New().String()[:12]
	tradeOrderID := "TTO_" + uuid.New().String()[:12]

	c.JSON(http.StatusOK, gin.H{
		"orderId":      orderID,
		"tradeOrderId": tradeOrderID,
		"priceAmount":  plan.Beans,
	})
}

func (h *SubscriptionHandler) VerifyPayment(c *gin.Context) {
	orderID := c.Param("orderId")
	_ = orderID

	expireAt := time.Now().AddDate(0, 0, 30)
	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"expireAt": expireAt.Format(time.RFC3339),
	})
}

func (h *SubscriptionHandler) Cancel(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *SubscriptionHandler) PaymentCallback(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"success": true})
}
