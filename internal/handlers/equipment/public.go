package equipment

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// List godoc
// @Summary Каталог оборудования
// @Tags equipment
// @Produce json
// @Success 200 {array} models.EquipmentItem
// @Router /equipment [get]
func List(c *gin.Context) {
	var items []models.EquipmentItem
	if err := database.DB.Order("id desc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load equipment"})
		return
	}
	c.JSON(http.StatusOK, items)
}

// Get godoc
// @Summary Оборудование по ID
// @Tags equipment
// @Produce json
// @Param id path int true "Equipment ID"
// @Success 200 {object} models.EquipmentItem
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /equipment/{id} [get]
func Get(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid equipment id"})
		return
	}

	var item models.EquipmentItem
	if err := database.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "equipment not found"})
		return
	}

	c.JSON(http.StatusOK, item)
}
