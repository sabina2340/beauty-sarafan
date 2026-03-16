package public

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"beauty-sarafan/internal/storage"
	"net/http"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	reviewMinTextLen = 10
	reviewMaxTextLen = 1000
	reviewMaxPhotoMB = 5
)

var (
	phoneRegexp            = regexp.MustCompile(`^[0-9+()\-\s]{5,20}$`)
	allowedReviewImageExts = map[string]struct{}{".jpg": {}, ".jpeg": {}, ".png": {}, ".webp": {}}
)

type publicReviewItem struct {
	ID          uint       `json:"id"`
	Text        string     `json:"text"`
	PhotoURL    string     `json:"photo_url"`
	PublishedAt *time.Time `json:"published_at"`
	CreatedAt   time.Time  `json:"created_at"`
	AuthorName  string     `json:"author_name"`
}

func ListApprovedReviews(c *gin.Context) {
	masterID, err := strconv.Atoi(c.Param("id"))
	if err != nil || masterID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid master id"})
		return
	}

	var reviews []publicReviewItem
	err = database.DB.Table("reviews").
		Select("id, text, photo_url, published_at, created_at").
		Where("master_id = ? AND status = ?", masterID, models.ReviewStatusApproved).
		Order("COALESCE(published_at, created_at) DESC").
		Scan(&reviews).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load reviews"})
		return
	}

	for i := range reviews {
		reviews[i].AuthorName = "Анонимный клиент"
	}
	c.JSON(http.StatusOK, reviews)
}

func CreateReview(c *gin.Context) {
	masterID, err := strconv.Atoi(c.Param("id"))
	if err != nil || masterID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid master id"})
		return
	}

	var userCount int64
	if err := database.DB.Table("users u").
		Joins("JOIN master_profiles mp ON mp.user_id = u.id").
		Where("u.id = ? AND u.role = ? AND mp.status = ?", masterID, models.RoleUser, models.StatusApproved).
		Count(&userCount).Error; err != nil || userCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "master not found"})
		return
	}

	phone := strings.TrimSpace(c.PostForm("phone"))
	text := strings.TrimSpace(c.PostForm("text"))
	consent := strings.TrimSpace(c.PostForm("is_personal_data_consent"))
	consentType := strings.TrimSpace(c.PostForm("personal_data_consent_type"))
	if consentType == "" {
		consentType = "privacy_policy_v1"
	}

	if phone == "" || !phoneRegexp.MatchString(phone) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid phone"})
		return
	}
	if len([]rune(text)) < reviewMinTextLen || len([]rune(text)) > reviewMaxTextLen {
		c.JSON(http.StatusBadRequest, gin.H{"error": "review text length must be 10..1000"})
		return
	}
	if consent != "true" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "personal data consent is required"})
		return
	}

	var recentByPhone int64
	if err := database.DB.Model(&models.Review{}).
		Where("master_id = ? AND phone = ? AND created_at >= ?", uint(masterID), phone, time.Now().Add(-24*time.Hour)).
		Count(&recentByPhone).Error; err == nil && recentByPhone >= 3 {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "too many reviews from this phone"})
		return
	}

	fileHeader, err := c.FormFile("photo")
	if err != nil || fileHeader == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "photo is required"})
		return
	}
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if _, ok := allowedReviewImageExts[ext]; !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "photo must be jpg, jpeg, png or webp"})
		return
	}
	if fileHeader.Size > reviewMaxPhotoMB*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "photo max size is 5MB"})
		return
	}

	uploader, err := storage.NewService()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "storage is not configured"})
		return
	}
	photoURL, err := uploader.UploadImage(fileHeader, "reviews")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to upload photo"})
		return
	}

	now := time.Now()
	review := models.Review{
		MasterID:                uint(masterID),
		Phone:                   phone,
		Text:                    text,
		PhotoURL:                photoURL,
		Status:                  models.ReviewStatusPending,
		IsPersonalDataConsent:   true,
		PersonalDataConsentAt:   &now,
		PersonalDataConsentType: consentType,
	}
	if err := database.DB.Create(&review).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save review"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":      review.ID,
		"status":  review.Status,
		"message": "Спасибо, ваш отзыв отправлен и будет опубликован после модерации.",
	})
}
