package categories

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CreateCategoryRequest struct {
	Name       string `json:"name" binding:"required"`
	Slug       string `json:"slug" binding:"required"`
	GroupName  string `json:"group_name" binding:"required"`
	GroupTitle string `json:"group_title" binding:"required"`
	Audience   string `json:"audience" binding:"required,oneof=master client both"`
	IsBusiness *bool  `json:"is_business"`
}

type CategoryGroupItem struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type CategoryGroupResponse struct {
	GroupName  string              `json:"group_name"`
	GroupTitle string              `json:"group_title"`
	IsBusiness bool                `json:"is_business"`
	Items      []CategoryGroupItem `json:"items"`
}

func applyFilters(queryAudience string, queryGroup string, queryBusiness string) (string, string, *bool, bool) {
	isBusiness := (*bool)(nil)
	if queryBusiness != "" {
		if parsed, err := strconv.ParseBool(queryBusiness); err == nil {
			isBusiness = &parsed
		}
	}

	validAudience := ""
	if queryAudience == "master" || queryAudience == "client" || queryAudience == "both" {
		validAudience = queryAudience
	}

	return validAudience, queryGroup, isBusiness, true
}

// List godoc
// @Summary Список категорий
// @Tags categories
// @Produce json
// @Param audience query string false "Фильтр по аудитории: master|client|both"
// @Param group query string false "Фильтр по группе: beauty-health"
// @Param business query bool false "Фильтр по бизнес категориям"
// @Success 200 {array} models.Category
// @Router /categories [get]
func List(c *gin.Context) {
	validAudience, queryGroup, isBusiness, _ := applyFilters(c.Query("audience"), c.Query("group"), c.Query("business"))

	query := database.DB.Order("group_name asc, id asc")
	if validAudience == "master" || validAudience == "client" {
		query = query.Where("audience = ? OR audience = ?", validAudience, "both")
	} else if validAudience == "both" {
		query = query.Where("audience = ?", "both")
	}
	if queryGroup != "" {
		query = query.Where("group_name = ?", queryGroup)
	}
	if isBusiness != nil {
		query = query.Where("is_business = ?", *isBusiness)
	}

	var items []models.Category
	if err := query.Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load categories"})
		return
	}

	c.JSON(http.StatusOK, items)
}

func ListGroups(c *gin.Context) {
	validAudience, _, isBusiness, _ := applyFilters(c.Query("audience"), "", c.Query("business"))

	query := database.DB.Model(&models.Category{}).Order("group_name asc, id asc")
	if validAudience == "master" || validAudience == "client" {
		query = query.Where("audience = ? OR audience = ?", validAudience, "both")
	} else if validAudience == "both" {
		query = query.Where("audience = ?", "both")
	}
	if isBusiness != nil {
		query = query.Where("is_business = ?", *isBusiness)
	}

	var categories []models.Category
	if err := query.Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load category groups"})
		return
	}

	groups := make([]CategoryGroupResponse, 0)
	idx := map[string]int{}
	for _, item := range categories {
		if _, ok := idx[item.GroupName]; !ok {
			idx[item.GroupName] = len(groups)
			groups = append(groups, CategoryGroupResponse{
				GroupName:  item.GroupName,
				GroupTitle: item.GroupTitle,
				IsBusiness: item.IsBusiness,
				Items:      []CategoryGroupItem{},
			})
		}
		pos := idx[item.GroupName]
		groups[pos].Items = append(groups[pos].Items, CategoryGroupItem{ID: item.ID, Name: item.Name, Slug: item.Slug})
	}

	c.JSON(http.StatusOK, groups)
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

	isBusiness := false
	if req.IsBusiness != nil {
		isBusiness = *req.IsBusiness
	}

	item := models.Category{
		Name:       req.Name,
		Slug:       req.Slug,
		GroupName:  req.GroupName,
		GroupTitle: req.GroupTitle,
		Audience:   req.Audience,
		IsBusiness: isBusiness,
	}

	if err := database.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create category"})
		return
	}

	c.JSON(http.StatusCreated, item)
}
