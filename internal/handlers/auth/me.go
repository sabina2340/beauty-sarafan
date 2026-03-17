package auth

import (
	jwtutil "beauty-sarafan/internal/jwt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type MeResponse struct {
	UserID uint   `json:"user_id"`
	Login  string `json:"login"`
	Role   string `json:"role"`
}

// Me godoc
// @Summary Проверка авторизации
// @Description Возвращает user_id и role из JWT или null без авторизации
// @Tags auth
// @Produce json
// @Success 200 {object} MeResponse
// @Router /auth/me [get]
func Me(c *gin.Context) {
	token, _ := c.Cookie(accessTokenCookieName)
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing access token"})
		return
	}

	claims, err := jwtutil.ParseToken(token)
	if err != nil {
		c.JSON(http.StatusOK, nil)
		return
	}

	c.JSON(http.StatusOK, MeResponse{
		UserID: claims.UID,
		Login:  claims.Login,
		Role:   claims.Role,
	})
}
