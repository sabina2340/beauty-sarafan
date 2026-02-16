package categories

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CreateCategoryRequest struct {
	Name string `json:"name" binding:"required"`
	Slug string `json:"slug" binding:"required"`
}

// List godoc
// @Summary Список категорий
// @Tags categories
// @Produce json
// @Success 200 {array} models.Category
// @Router /categories [get]
func List(c *gin.Context) {
	var items []models.Category
	if err := database.DB.Order("id asc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load categories"})
		return
	}

	c.JSON(http.StatusOK, items)
}

// Create godoc
// @Summary Создать категорию
// @Tags categories
// @Accept json
// @Produce json
// @Param data body CreateCategoryRequest true "Категория"
// @Success 201 {object} models.Category
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/categories [post]
func Create(c *gin.Context) {
	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data"})
		return
	}

	item := models.Category{Name: req.Name, Slug: req.Slug}
	if err := database.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create category"})
		return
	}

	c.JSON(http.StatusCreated, item)
}
