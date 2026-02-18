package auth

import (
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
// @Description Возвращает user_id и role из JWT
// @Tags auth
// @Produce json
// @Success 200 {object} MeResponse
// @Failure 401 {object} map[string]string
// @Router /auth/me [get]
func Me(c *gin.Context) {
	userID := c.GetUint("user_id")
	login := c.GetString("login")
	role := c.GetString("role")

	c.JSON(http.StatusOK, MeResponse{
		UserID: userID,
		Login:  login,
		Role:   role,
	})
}
