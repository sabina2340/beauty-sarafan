package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type MeResponse struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
}

// Me godoc
// @Summary Проверка авторизации
// @Description Возвращает данные пользователя из JWT токена
// @Tags auth
// @Produce json
// @Security BearerAuth
// @Success 200 {object} MeResponse
// @Failure 401 {object} map[string]string
// @Router /auth/me [get]
func Me(c *gin.Context) {
	userID := c.GetUint("user_id")
	email := c.GetString("user_email")
	role := c.GetString("user_role")

	c.JSON(http.StatusOK, MeResponse{
		UserID: userID,
		Email:  email,
		Role:   role,
	})
}
