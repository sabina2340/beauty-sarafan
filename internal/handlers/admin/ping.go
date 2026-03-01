package admin

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Ping godoc
// @Summary Проверка admin/moderator доступа
// @Tags admin
// @Produce json
// @Success 200 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /admin/ping [get]
func Ping(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "admin/moderator ok"})
}
