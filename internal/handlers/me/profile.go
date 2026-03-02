package me

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ProfileUpsertRequest struct {
	CategoryID  uint   `json:"category_id" binding:"required"`
	FullName    string `json:"full_name"`
	Description string `json:"description"`
	Services    string `json:"services"`
	Phone       string `json:"phone"`
	City        string `json:"city"`
	SocialLinks string `json:"social_links"`
}

// GetProfile godoc
// @Summary Профиль текущего мастера
// @Tags me
// @Produce json
// @Success 200 {object} models.MasterProfile
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /me/profile [get]
func GetProfile(c *gin.Context) {
	userID := c.GetUint("user_id")

	var profile models.MasterProfile
	if err := database.DB.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "profile not found"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// PutProfile godoc
// @Summary Создание/обновление профиля мастера
// @Description Upsert профиля. После изменений отправляет пользователя на повторную модерацию (status=pending)
// @Tags me
// @Accept json
// @Produce json
// @Param data body ProfileUpsertRequest true "Данные профиля"
// @Success 200 {object} models.MasterProfile
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /me/profile [put]
func PutProfile(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req ProfileUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data"})
		return
	}

	var profile models.MasterProfile
	err := database.DB.Where("user_id = ?", userID).First(&profile).Error
	if err != nil {
		profile = models.MasterProfile{
			UserID:          userID,
			CategoryID:      req.CategoryID,
			FullName:        req.FullName,
			Description:     req.Description,
			Services:        req.Services,
			Phone:           req.Phone,
			City:            req.City,
			SocialLinks:     req.SocialLinks,
			Status:          models.StatusPending,
			RejectionReason: nil,
		}

		if err := database.DB.Create(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create profile"})
			return
		}
	} else {
		profile.CategoryID = req.CategoryID
		profile.FullName = req.FullName
		profile.Description = req.Description
		profile.Services = req.Services
		profile.Phone = req.Phone
		profile.City = req.City
		profile.SocialLinks = req.SocialLinks
		profile.Status = models.StatusPending
		profile.RejectionReason = nil

		if err := database.DB.Save(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update profile"})
			return
		}
	}

	if err := database.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"status":           models.StatusPending,
		"verified":         false,
		"rejection_reason": nil,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user moderation status"})
		return
	}

	c.JSON(http.StatusOK, profile)
}
