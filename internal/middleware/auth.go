package middleware

import (
	"beauty-sarafan/internal/database"
	jwtutil "beauty-sarafan/internal/jwt"
	"beauty-sarafan/internal/models"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie("access_token")
		if err != nil || token == "" {
			header := c.GetHeader("Authorization")
			parts := strings.SplitN(header, " ", 2)
			if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
				token = parts[1]
			}
		}

		if token == "" {
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
		var user models.User
		if err := database.DB.First(&user, userID).Error; err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
			return
		}

		if user.Status != models.StatusApproved {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "профиль на модерации или отклонён"})
			return
		}

		c.Next()
	}
}
