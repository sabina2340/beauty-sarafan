package admin

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type adminReviewListItem struct {
	ID                      uint                `json:"id"`
	MasterID                uint                `json:"master_id"`
	Text                    string              `json:"text"`
	PhotoURL                string              `json:"photo_url"`
	Phone                   string              `json:"phone"`
	CreatedAt               time.Time           `json:"created_at"`
	Status                  models.ReviewStatus `json:"status"`
	IsPersonalDataConsent   bool                `json:"is_personal_data_consent"`
	PersonalDataConsentAt   *time.Time          `json:"personal_data_consent_at"`
	PersonalDataConsentType string              `json:"personal_data_consent_type"`
	AdminComment            string              `json:"admin_comment"`
	PublishedAt             *time.Time          `json:"published_at"`
}

type reviewModerationPayload struct {
	Status       models.ReviewStatus `json:"status" binding:"required,oneof=approved rejected pending"`
	AdminComment string              `json:"admin_comment"`
}

func ListReviews(c *gin.Context) {
	status := c.Query("status")
	masterID := c.Query("master_id")

	query := database.DB.Table("reviews")
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if masterID != "" {
		query = query.Where("master_id = ?", masterID)
	}

	var reviews []adminReviewListItem
	if err := query.Order("created_at desc").Scan(&reviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load reviews"})
		return
	}
	c.JSON(http.StatusOK, reviews)
}

func GetReview(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review id"})
		return
	}

	var review adminReviewListItem
	if err := database.DB.Table("reviews").Where("id = ?", id).Scan(&review).Error; err != nil || review.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
		return
	}
	c.JSON(http.StatusOK, review)
}

func ModerateReview(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review id"})
		return
	}

	var payload reviewModerationPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	updates := map[string]interface{}{
		"status": payload.Status,
	}
	if payload.AdminComment != "" {
		updates["admin_comment"] = payload.AdminComment
	}
	if payload.Status == models.ReviewStatusApproved {
		now := time.Now()
		updates["published_at"] = &now
	} else {
		updates["published_at"] = nil
	}

	res := database.DB.Model(&models.Review{}).Where("id = ?", id).Updates(updates)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to moderate review"})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "review updated"})
}

func DeleteReview(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review id"})
		return
	}

	res := database.DB.Delete(&models.Review{}, id)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete review"})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
		return
	}
	c.Status(http.StatusNoContent)
}
