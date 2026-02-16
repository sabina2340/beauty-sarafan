package ads

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Create godoc
// @Summary Тест создания объявления
// @Description Доступно только user со статусом approved
// @Tags ads
// @Produce json
// @Success 200 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /ads [post]
func Create(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}
