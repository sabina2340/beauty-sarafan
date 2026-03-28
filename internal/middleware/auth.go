package middleware

import (
	"beauty-sarafan/internal/database"
	jwtutil "beauty-sarafan/internal/jwt"
	"beauty-sarafan/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie("access_token")
		if err != nil || token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing access token"})
			return
		}

		claims, err := jwtutil.ParseToken(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}

		c.Set("user_id", claims.UID)
		c.Set("login", claims.Login)
		c.Set("role", claims.Role)
		c.Next()
	}
}

func RequireRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		currentRole := c.GetString("role")
		if currentRole != role {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient role"})
			return
		}
		c.Next()
	}
}

func RequireAnyRole(roles ...string) gin.HandlerFunc {
	allowed := map[string]struct{}{}
	for _, role := range roles {
		allowed[role] = struct{}{}
	}

	return func(c *gin.Context) {
		currentRole := c.GetString("role")
		if _, ok := allowed[currentRole]; !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient role"})
			return
		}
		c.Next()
	}
}

func EnsureApproved() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetUint("user_id")

		var profile models.MasterProfile
		if err := database.DB.Where("user_id = ?", userID).First(&profile).Error; err != nil {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "сначала заполните профиль мастера"})
			return
		}

		if profile.Status == models.StatusRejected {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "профиль на модерации или отклонён"})
			return
		}

		if profile.Status == models.StatusPending {
			_ = database.DB.Model(&models.MasterProfile{}).Where("id = ?", profile.ID).Update("status", models.StatusApproved).Error
			_ = database.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
				"status":   models.StatusApproved,
				"verified": true,
			}).Error
		}

		c.Next()
	}
}
