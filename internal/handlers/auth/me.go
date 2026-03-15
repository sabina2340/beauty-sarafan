package auth

import (
	jwtutil "beauty-sarafan/internal/jwt"
	"net/http"
	"strings"

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
	token, _ := c.Cookie("access_token")
	if token == "" {
		header := c.GetHeader("Authorization")
		parts := strings.SplitN(header, " ", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
			token = parts[1]
		}
	}

	if token == "" {
		c.JSON(http.StatusOK, nil)
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
