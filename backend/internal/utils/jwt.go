package utils

import (
	"time"
	"github.com/dramamax/backend/internal/config"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	UserID  string `json:"user_id"`
	AdminID uint   `json:"admin_id,omitempty"` // 管理员 ID，用于区分 admin token
	IsAdmin bool   `json:"is_admin,omitempty"` // 是否管理员 token
	jwt.RegisteredClaims
}

func GenerateToken(userID uuid.UUID) (string, error) {
	claims := Claims{
		UserID: userID.String(),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.GetJWTSecret()))
}

// GenerateAdminToken 为管理员生成 JWT token
func GenerateAdminToken(adminID uint, username string) (string, error) {
	claims := Claims{
		AdminID: adminID,
		IsAdmin: true,
		UserID:  username, // 复用字段保存 username，便于上下文识别
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.GetJWTSecret()))
}

func ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.GetJWTSecret()), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrSignatureInvalid
}

// ValidateAdminToken 校验管理员 token，若不是管理员 token 则返回错误
func ValidateAdminToken(tokenString string) (*Claims, error) {
	claims, err := ValidateToken(tokenString)
	if err != nil {
		return nil, err
	}
	if !claims.IsAdmin {
		return nil, jwt.ErrSignatureInvalid
	}
	return claims, nil
}
