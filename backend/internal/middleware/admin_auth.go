package middleware

import (
	"net/http"
	"strings"

	"github.com/dramamax/backend/internal/database"
	"github.com/dramamax/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

// AdminAuth 校验管理员 JWT token
func AdminAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// DEMO 模式下放行，使用默认管理员上下文（admin ID = 1）
		if database.IsDemo {
			c.Set("adminID", uint(1))
			c.Set("adminUsername", "admin")
			c.Set("isAdmin", true)
			c.Next()
			return
		}

		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		claims, err := utils.ValidateAdminToken(parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired admin token"})
			c.Abort()
			return
		}

		c.Set("adminID", claims.AdminID)
		c.Set("adminUsername", claims.UserID)
		c.Set("isAdmin", claims.IsAdmin)
		c.Next()
	}
}
