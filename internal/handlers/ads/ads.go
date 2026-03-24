package ads

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"beauty-sarafan/internal/payments"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UpsertAdRequest struct {
	Type        string `json:"type" binding:"required,oneof=service cabinet salon"`
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	City        string `json:"city"`
	CategoryID  *uint  `json:"category_id"`
}

type RejectAdRequest struct {
	Reason string `json:"reason"`
}

type AdminUpdateAdRequest struct {
	Type        string
	Title       string
	Description string
	City        string
	CategoryID  *uint
	Status      string
}

// Create godoc
// @Summary Создать объявление
// @Description Доступно только user со статусом approved; новое объявление уходит в pending
// @Tags ads
// @Accept json
// @Produce json
// @Param data body UpsertAdRequest true "Объявление"
// @Success 201 {object} models.Advertisement
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /ads [post]
func Create(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req UpsertAdRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data"})
		return
	}

	ad := models.Advertisement{
		UserID:      userID,
		Type:        req.Type,
		Title:       req.Title,
		Description: req.Description,
		City:        req.City,
		CategoryID:  req.CategoryID,
		Status:      models.AdStatusPending,
	}

	if err := database.DB.Create(&ad).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create ad"})
		return
	}

	c.JSON(http.StatusCreated, ad)
}

// ListMine godoc
// @Summary Мои объявления
// @Tags me
// @Produce json
// @Success 200 {array} models.Advertisement
// @Router /me/ads [get]
func ListMine(c *gin.Context) {
	userID := c.GetUint("user_id")
	var ads []models.Advertisement
	if err := database.DB.Where("user_id = ?", userID).Order("id desc").Find(&ads).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load ads"})
		return
	}

	paymentService := payments.DefaultService()
	rows := make([]gin.H, 0, len(ads))
	for _, ad := range ads {
		var p models.Payment
		if err := database.DB.Where("advertisement_id = ?", ad.ID).Order("id desc").First(&p).Error; err == nil {
			if p.OperationID != "" && p.Status != models.PaymentStatusPaid && p.Status != models.PaymentStatusExpired && p.Status != models.PaymentStatusFailed && p.Status != models.PaymentStatusRefunded {
				_ = paymentService.SyncPaymentStatus(c.Request.Context(), &p)
				_ = database.DB.First(&ad, ad.ID).Error
			}
		}

		row := gin.H{
			"id":                  ad.ID,
			"user_id":             ad.UserID,
			"type":                ad.Type,
			"title":               ad.Title,
			"description":         ad.Description,
			"city":                ad.City,
			"category_id":         ad.CategoryID,
			"status":              ad.Status,
			"tariff_id":           ad.TariffID,
			"activated_at":        ad.ActivatedAt,
			"expires_at":          ad.ExpiresAt,
			"is_expired":          ad.ExpiresAt != nil && ad.ExpiresAt.Before(time.Now()),
			"rejection_reason":    ad.RejectionReason,
			"created_at":          ad.CreatedAt,
			"is_paid":             false,
			"can_select_tariff":   ad.Status == models.AdStatusApproved,
			"has_pending_payment": false,
		}

		if p.ID != 0 {
			isPaid := p.Status == models.PaymentStatusPaid
			hasPendingPayment := p.Status == models.PaymentStatusCreated || p.Status == models.PaymentStatusProcessing
			row["last_payment_id"] = p.ID
			row["last_payment_status"] = p.Status
			row["last_bank_status"] = p.BankStatus
			row["has_pending_payment"] = hasPendingPayment
			row["is_paid"] = isPaid
			row["can_select_tariff"] = ad.Status == models.AdStatusApproved && !hasPendingPayment && !isPaid
		}

		rows = append(rows, row)
	}

	c.JSON(http.StatusOK, rows)
}

// GetMine godoc
// @Summary Детали моего объявления
// @Tags me
// @Produce json
// @Param id path int true "Ad ID"
// @Success 200 {object} models.Advertisement
// @Failure 404 {object} map[string]string
// @Router /me/ads/{id} [get]
func GetMine(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ad id"})
		return
	}

	var ad models.Advertisement
	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&ad).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ad not found"})
		return
	}
	c.JSON(http.StatusOK, ad)
}

// UpdateMine godoc
// @Summary Редактировать моё объявление
// @Description После правок объявление снова уходит на модерацию (pending)
// @Tags me
// @Accept json
// @Produce json
// @Param id path int true "Ad ID"
// @Param data body UpsertAdRequest true "Объявление"
// @Success 200 {object} models.Advertisement
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /me/ads/{id} [put]
func UpdateMine(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ad id"})
		return
	}

	var req UpsertAdRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data"})
		return
	}

	var ad models.Advertisement
	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&ad).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ad not found"})
		return
	}

	ad.Type = req.Type
	ad.Title = req.Title
	ad.Description = req.Description
	ad.City = req.City
	ad.CategoryID = req.CategoryID
	ad.Status = models.AdStatusPending
	ad.RejectionReason = nil

	if err := database.DB.Save(&ad).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update ad"})
		return
	}

	c.JSON(http.StatusOK, ad)
}

// DeleteMine godoc
// @Summary Удалить моё объявление
// @Tags me
// @Param id path int true "Ad ID"
// @Success 204 {string} string ""
// @Failure 404 {object} map[string]string
// @Router /me/ads/{id} [delete]
func DeleteMine(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ad id"})
		return
	}

	res := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Advertisement{})
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete ad"})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ad not found"})
		return
	}

	c.Status(http.StatusNoContent)
}

// AdminList godoc
// @Summary Список объявлений для модерации
// @Tags admin
// @Produce json
// @Param status query string false "Статус" default(pending)
// @Success 200 {array} map[string]interface{}
// @Router /admin/ads [get]
func AdminList(c *gin.Context) {
	status := c.DefaultQuery("status", models.AdStatusPending)

	var rows []map[string]interface{}
	err := database.DB.Table("advertisements a").
		Select(`a.id, a.user_id, a.type, a.title, a.description, a.city, a.status, a.rejection_reason,
			u.login, mp.full_name, c.name as category_name, c.slug as category_slug,
			COALESCE((SELECT ai.image_url FROM ad_images ai WHERE ai.advertisement_id = a.id ORDER BY ai.sort_order asc, ai.id asc LIMIT 1), '') AS image_url`).
		Joins("JOIN users u ON u.id = a.user_id").
		Joins("LEFT JOIN master_profiles mp ON mp.user_id = a.user_id").
		Joins("LEFT JOIN categories c ON c.id = a.category_id").
		Where("a.status = ?", status).
		Order("a.id desc").
		Find(&rows).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load ads"})
		return
	}

	c.JSON(http.StatusOK, rows)
}

func AdminUpdate(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ad id"})
		return
	}

	var ad models.Advertisement
	if err := database.DB.First(&ad, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ad not found"})
		return
	}

	req := AdminUpdateAdRequest{
		Type:        strings.TrimSpace(c.PostForm("type")),
		Title:       strings.TrimSpace(c.PostForm("title")),
		Description: strings.TrimSpace(c.PostForm("description")),
		City:        strings.TrimSpace(c.PostForm("city")),
		Status:      strings.TrimSpace(c.PostForm("status")),
	}
	if rawCategoryID := strings.TrimSpace(c.PostForm("category_id")); rawCategoryID != "" {
		if categoryID, parseErr := strconv.ParseUint(rawCategoryID, 10, 64); parseErr == nil {
			value := uint(categoryID)
			req.CategoryID = &value
		}
	}

	if req.Type != "" {
		ad.Type = req.Type
	}
	if req.Title != "" {
		ad.Title = req.Title
	}
	if req.Description != "" {
		ad.Description = req.Description
	}
	if req.City != "" {
		ad.City = req.City
	}
	if req.CategoryID != nil {
		ad.CategoryID = req.CategoryID
	}
	if req.Status != "" {
		ad.Status = req.Status
	}

	imageURLs := []string{}
	if raw := c.PostFormArray("image_urls[]"); len(raw) > 0 {
		imageURLs = append(imageURLs, raw...)
	}
	appendImages := c.DefaultPostForm("append_images", "true") != "false"

	err = database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&ad).Error; err != nil {
			return err
		}
		return upsertAdImagesFromRequest(tx, c, ad.ID, appendImages, imageURLs)
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update ad"})
		return
	}

	c.JSON(http.StatusOK, ad)
}

// AdminApprove godoc
// @Summary Одобрить объявление
// @Tags admin
// @Param id path int true "Ad ID"
// @Success 200 {object} models.Advertisement
// @Router /admin/ads/{id}/approve [patch]
func AdminApprove(c *gin.Context) {
	adminID := c.GetUint("user_id")
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ad id"})
		return
	}

	var ad models.Advertisement
	if err := database.DB.First(&ad, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ad not found"})
		return
	}

	ad.Status = models.AdStatusApproved
	ad.RejectionReason = nil
	if err := database.DB.Save(&ad).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update ad"})
		return
	}
	_ = database.DB.Create(&models.ModerationLog{EntityType: "advertisement", EntityID: ad.ID, AdminID: adminID, Action: "approved"}).Error

	c.JSON(http.StatusOK, ad)
}

// AdminReject godoc
// @Summary Отклонить объявление
// @Tags admin
// @Accept json
// @Param id path int true "Ad ID"
// @Param data body RejectAdRequest false "Причина"
// @Success 200 {object} models.Advertisement
// @Router /admin/ads/{id}/reject [patch]
func AdminReject(c *gin.Context) {
	adminID := c.GetUint("user_id")
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ad id"})
		return
	}

	var req RejectAdRequest
	_ = c.ShouldBindJSON(&req)

	var ad models.Advertisement
	if err := database.DB.First(&ad, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ad not found"})
		return
	}

	ad.Status = models.AdStatusRejected
	if req.Reason != "" {
		ad.RejectionReason = &req.Reason
	}
	if err := database.DB.Save(&ad).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update ad"})
		return
	}
	_ = database.DB.Create(&models.ModerationLog{EntityType: "advertisement", EntityID: ad.ID, AdminID: adminID, Action: "rejected", Comment: req.Reason}).Error

	c.JSON(http.StatusOK, ad)
}

// PublicList godoc
// @Summary Публичный список объявлений
// @Tags ads
// @Produce json
// @Param type query string false "Тип service|cabinet|salon"
// @Param city query string false "Город"
// @Param category_id query int false "ID категории"
// @Success 200 {array} models.Advertisement
// @Router /ads [get]
func PublicList(c *gin.Context) {
	adType := c.Query("type")
	city := c.Query("city")
	categoryID := c.Query("category_id")

	now := time.Now()
	query := publiclyVisibleAdsQuery(now).Select("a.*")
	if adType != "" {
		query = query.Where("a.type = ?", adType)
	}
	if city != "" {
		query = query.Where("LOWER(a.city) = LOWER(?)", city)
	}
	if categoryID != "" {
		query = query.Where("a.category_id = ?", categoryID)
	}

	var ads []models.Advertisement
	if err := query.Order("COALESCE(a.activated_at, p.paid_at, a.created_at) desc").Find(&ads).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load ads"})
		return
	}

	c.JSON(http.StatusOK, ads)
}

// PublicByMaster godoc
// @Summary Объявления мастера
// @Tags ads
// @Produce json
// @Param id path int true "Master user ID"
// @Success 200 {array} models.Advertisement
// @Router /masters/{id}/ads [get]
func PublicByMaster(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	now := time.Now()
	var ads []models.Advertisement
	if err := publiclyVisibleAdsQuery(now).Select("a.*").Where("a.user_id = ?", userID).Order("COALESCE(a.activated_at, p.paid_at, a.created_at) desc").Find(&ads).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load ads"})
		return
	}

	c.JSON(http.StatusOK, ads)
}
