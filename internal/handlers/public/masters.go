package public

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type MasterCard struct {
	UserID       uint   `json:"user_id"`
	Login        string `json:"login"`
	FullName     string `json:"full_name"`
	Description  string `json:"description"`
	Services     string `json:"services"`
	Phone        string `json:"phone"`
	City         string `json:"city"`
	SocialLinks  string `json:"social_links"`
	CategoryID   uint   `json:"category_id"`
	CategoryName string `json:"category_name"`
	CategorySlug string `json:"category_slug"`
}

// ListMasters godoc
// @Summary Публичный каталог мастеров
// @Tags masters
// @Produce json
// @Param category_id query int false "ID категории"
// @Param slug query string false "Slug категории"
// @Param city query string false "Город"
// @Param q query string false "Поиск по имени"
// @Success 200 {array} MasterCard
// @Router /masters [get]
func ListMasters(c *gin.Context) {
	categoryID := c.Query("category_id")
	slug := c.Query("slug")
	city := c.Query("city")
	q := c.Query("q")

	query := database.DB.Table("users u").
		Select(`u.id as user_id, u.login,
			mp.full_name, mp.description, mp.services, mp.phone, mp.city, mp.social_links,
			mp.category_id, c.name as category_name, c.slug as category_slug`).
		Joins("JOIN master_profiles mp ON mp.user_id = u.id").
		Joins("LEFT JOIN categories c ON c.id = mp.category_id").
		Where("u.role = ? AND mp.status = ?", models.RoleUser, models.StatusApproved)

	if categoryID != "" {
		query = query.Where("mp.category_id = ?", categoryID)
	}
	if slug != "" {
		query = query.Where("c.slug = ?", slug)
	}
	if city != "" {
		query = query.Where("LOWER(mp.city) = LOWER(?)", city)
	}
	if q != "" {
		query = query.Where("LOWER(mp.full_name) LIKE LOWER(?)", "%"+q+"%")
	}

	var masters []MasterCard
	if err := query.Order("u.id desc").Scan(&masters).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load masters"})
		return
	}

	c.JSON(http.StatusOK, masters)
}

// GetMaster godoc
// @Summary Детальная карточка мастера
// @Tags masters
// @Produce json
// @Param id path int true "User ID мастера"
// @Success 200 {object} MasterCard
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /masters/{id} [get]
func GetMaster(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var master MasterCard
	err = database.DB.Table("users u").
		Select(`u.id as user_id, u.login,
			mp.full_name, mp.description, mp.services, mp.phone, mp.city, mp.social_links,
			mp.category_id, c.name as category_name, c.slug as category_slug`).
		Joins("JOIN master_profiles mp ON mp.user_id = u.id").
		Joins("LEFT JOIN categories c ON c.id = mp.category_id").
		Where("u.id = ? AND u.role = ? AND mp.status = ?", id, models.RoleUser, models.StatusApproved).
		Scan(&master).Error
	if err != nil || master.UserID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "master not found"})
		return
	}

	c.JSON(http.StatusOK, master)
}
