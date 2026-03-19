package cities

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func List(c *gin.Context) {
	var items []models.City
	if err := database.DB.Order("name asc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load cities"})
		return
	}

	c.JSON(http.StatusOK, items)
}
