package ads

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"beauty-sarafan/internal/payments"
	"beauty-sarafan/internal/storage"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type createAdRequest struct {
	UpsertAdRequest
	ImageURLs []string `json:"image_urls"`
}

type selectTariffRequest struct {
	TariffID uint `json:"tariff_id" binding:"required"`
}

type markPaidRequest struct {
	Comment string `json:"comment"`
}

func parseAdPayload(c *gin.Context) (createAdRequest, error) {
	var req createAdRequest
	if strings.Contains(c.GetHeader("Content-Type"), "multipart/form-data") {
		req.Type = strings.TrimSpace(c.PostForm("type"))
		req.Title = strings.TrimSpace(c.PostForm("title"))
		req.Description = strings.TrimSpace(c.PostForm("description"))
		req.City = strings.TrimSpace(c.PostForm("city"))
		req.ImageURLs = c.PostFormArray("image_urls[]")
		if rawCategoryID := strings.TrimSpace(c.PostForm("category_id")); rawCategoryID != "" {
			if categoryID, err := strconv.ParseUint(rawCategoryID, 10, 64); err == nil {
				parsed := uint(categoryID)
				req.CategoryID = &parsed
			}
		}
		return req, nil
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		return req, err
	}
	return req, nil
}

func upsertAdImagesFromRequest(tx *gorm.DB, c *gin.Context, adID uint, appendMode bool, imageURLs []string) error {
	if !appendMode {
		if err := tx.Where("advertisement_id = ?", adID).Delete(&models.AdImage{}).Error; err != nil {
			return err
		}
	}

	var currentCount int64
	if err := tx.Model(&models.AdImage{}).Where("advertisement_id = ?", adID).Count(&currentCount).Error; err != nil {
		return err
	}

	sortOrder := int(currentCount)
	for _, imageURL := range imageURLs {
		if strings.TrimSpace(imageURL) == "" {
			continue
		}
		if err := tx.Create(&models.AdImage{AdvertisementID: adID, ImageURL: strings.TrimSpace(imageURL), SortOrder: sortOrder}).Error; err != nil {
			return err
		}
		sortOrder++
	}

	form, formErr := c.MultipartForm()
	if formErr == nil && form != nil {
		files := append(form.File["images[]"], form.File["ads[]"]...)
		if len(files) > 0 {
			uploader, err := storage.NewService()
			if err != nil {
				return err
			}
			for _, fileHeader := range files {
				uploaded, uploadErr := uploader.UploadImage(fileHeader, "ads/images")
				if uploadErr != nil {
					return uploadErr
				}
				if err := tx.Create(&models.AdImage{AdvertisementID: adID, ImageURL: uploaded, SortOrder: sortOrder}).Error; err != nil {
					return err
				}
				sortOrder++
			}
		}
	}

	return nil
}

// CreateWithImages POST /advertisements
func CreateWithImages(c *gin.Context) {
	userID := c.GetUint("user_id")

	req, err := parseAdPayload(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data"})
		return
	}
	if req.Type == "" || req.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "type and title are required"})
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

	err = database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&ad).Error; err != nil {
			return err
		}
		return upsertAdImagesFromRequest(tx, c, ad.ID, true, req.ImageURLs)
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create ad"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Объявление отправлено на модерацию", "advertisement": ad})
}

// TariffsList GET /tariffs
func TariffsList(c *gin.Context) {
	var tariffs []models.Tariff
	if err := database.DB.Where("is_active = ?", true).Order("sort_order asc, price asc").Find(&tariffs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load tariffs"})
		return
	}
	c.JSON(http.StatusOK, tariffs)
}

// SelectTariff POST /advertisements/:id/select-tariff
func SelectTariff(c *gin.Context) {
	userID := c.GetUint("user_id")
	adID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ad id"})
		return
	}

	var req selectTariffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data"})
		return
	}

	var ad models.Advertisement
	if err := database.DB.Where("id = ? AND user_id = ?", adID, userID).First(&ad).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ad not found"})
		return
	}
	if ad.Status != models.AdStatusApproved {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tariff can be selected only for approved ad"})
		return
	}

	var tariff models.Tariff
	if err := database.DB.Where("id = ? AND is_active = ?", req.TariffID, true).First(&tariff).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tariff not found"})
		return
	}

	service := payments.DefaultService()
	result, err := service.CreatePaymentForAd(c.Request.Context(), payments.CreatePaymentParams{
		Advertisement: ad,
		Tariff:        tariff,
	})
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"payment_id":   result.Payment.ID,
		"operation_id": result.Payment.OperationID,
		"payment_url":  result.Payment.PaymentLink,
		"status":       result.Payment.Status,
		"redirect":     fmt.Sprintf("/account/ads/%d/payment?payment_id=%d", ad.ID, result.Payment.ID),
	})
}

// GetPaymentByAd GET /advertisements/:id/payment
func GetPaymentByAd(c *gin.Context) {
	userID := c.GetUint("user_id")
	adID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ad id"})
		return
	}

	var ad models.Advertisement
	if err := database.DB.Where("id = ? AND user_id = ?", adID, userID).First(&ad).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ad not found"})
		return
	}

	var payment models.Payment
	if err := database.DB.Where("advertisement_id = ?", ad.ID).Order("id desc").First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}

	payment = syncPaymentIfNeeded(c, payment)

	var tariff models.Tariff
	_ = database.DB.First(&tariff, payment.TariffID).Error

	c.JSON(http.StatusOK, paymentPayload(ad, payment, tariff))
}

// PaymentStatus GET /payments/:id/status
func PaymentStatus(c *gin.Context) {
	userID := c.GetUint("user_id")
	paymentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment id"})
		return
	}

	var payment models.Payment
	if err := database.DB.First(&payment, paymentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}

	var ad models.Advertisement
	if err := database.DB.Where("id = ? AND user_id = ?", payment.AdvertisementID, userID).First(&ad).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ad not found"})
		return
	}

	payment = syncPaymentIfNeeded(c, payment)

	var tariff models.Tariff
	_ = database.DB.First(&tariff, payment.TariffID).Error

	c.JSON(http.StatusOK, paymentPayload(ad, payment, tariff))
}

// TochkaAcquiringWebhook POST /webhooks/tochka/acquiring
func TochkaAcquiringWebhook(c *gin.Context) {
	rawBody, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read webhook body"})
		return
	}

	service := payments.DefaultService()
	payment, payload, err := service.ApplyWebhook(c.Request.Context(), string(rawBody))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "webhook processed",
		"payment_id":   payment.ID,
		"operation_id": payload.OperationID,
		"status":       payment.Status,
		"bank_status":  payment.BankStatus,
	})
}

// MarkPaymentPaid POST /payments/:id/mark-paid
func MarkPaymentPaid(c *gin.Context) {
	var req markPaidRequest
	_ = c.ShouldBindJSON(&req)
	c.JSON(http.StatusGone, gin.H{"error": "manual payment confirmation is disabled; use Tochka payment link and status polling"})
}

// AdminPendingPayments GET /admin/payments/pending
func AdminPendingPayments(c *gin.Context) {
	var rows []map[string]interface{}
	err := database.DB.Table("payments p").
		Select(`p.id, p.status, p.amount, p.comment, p.created_at, p.marked_paid_at,
			u.login, a.id as advertisement_id, a.title as advertisement_title,
			t.name as tariff_name, t.duration_days`).
		Joins("JOIN advertisements a ON a.id = p.advertisement_id").
		Joins("JOIN users u ON u.id = a.user_id").
		Joins("JOIN tariffs t ON t.id = p.tariff_id").
		Where("p.status = ? AND p.marked_paid_at IS NOT NULL AND COALESCE(p.operation_id, '') = ''", "pending").
		Order("p.id desc").
		Find(&rows).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load payments"})
		return
	}

	c.JSON(http.StatusOK, rows)
}

// AdminConfirmPayment POST /admin/payments/:id/confirm
func AdminConfirmPayment(c *gin.Context) {
	adminID := c.GetUint("user_id")
	paymentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment id"})
		return
	}

	var payment models.Payment
	if err := database.DB.First(&payment, paymentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}
	if payment.OperationID != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tochka payments are confirmed automatically from bank status APPROVED"})
		return
	}
	if payment.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payment is already processed"})
		return
	}

	now := time.Now()
	payment.Status = models.PaymentStatusPaid
	payment.BankStatus = "APPROVED"
	payment.PaidAt = &now
	if err := database.DB.Save(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to confirm payment"})
		return
	}
	_ = database.DB.Create(&models.ModerationLog{EntityType: "payment", EntityID: payment.ID, AdminID: adminID, Action: "confirmed"}).Error

	if err := payments.ApplyBankOperation(database.DB, &payment, payments.TochkaPaymentOperation{Status: "APPROVED", OperationID: payment.OperationID}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to activate ad"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "payment confirmed"})
}

// AdminRejectPayment POST /admin/payments/:id/reject
func AdminRejectPayment(c *gin.Context) {
	adminID := c.GetUint("user_id")
	paymentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment id"})
		return
	}

	var payment models.Payment
	if err := database.DB.First(&payment, paymentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}
	if payment.OperationID != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tochka payments are rejected by bank status updates, not manual moderation"})
		return
	}
	if payment.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payment is already processed"})
		return
	}

	payment.Status = models.PaymentStatusFailed
	payment.BankStatus = "REJECTED"
	if err := database.DB.Save(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to reject payment"})
		return
	}
	_ = database.DB.Create(&models.ModerationLog{EntityType: "payment", EntityID: payment.ID, AdminID: adminID, Action: "rejected"}).Error

	c.JSON(http.StatusOK, gin.H{"message": "payment rejected"})
}

// HotOffers GET /hot-offers
func HotOffers(c *gin.Context) {
	now := time.Now()
	var rows []map[string]interface{}
	err := publiclyVisibleAdsQuery(now).
		Select(`a.id, a.user_id, a.type, a.title, a.description, a.city,
			COALESCE(a.activated_at, p.paid_at, a.created_at) as activated_at,
			COALESCE(a.expires_at, p.paid_at + (t.duration_days || ' days')::interval) as expires_at,
			COALESCE((SELECT ai.image_url FROM ad_images ai WHERE ai.advertisement_id = a.id ORDER BY ai.sort_order asc, ai.id asc LIMIT 1), '') AS image_url`).
		Order("COALESCE(a.activated_at, p.paid_at, a.created_at) desc").
		Find(&rows).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load offers"})
		return
	}
	c.JSON(http.StatusOK, rows)
}

// ActiveAds GET /ads/active?limit=10
func ActiveAds(c *gin.Context) {
	limit := 10
	if q := c.Query("limit"); q != "" {
		if parsed, err := strconv.Atoi(q); err == nil && parsed > 0 && parsed <= 30 {
			limit = parsed
		}
	}
	now := time.Now()
	var rows []map[string]interface{}
	err := publiclyVisibleAdsQuery(now).
		Select(`a.id, a.user_id, a.type, a.title, a.description, a.city,
			COALESCE(a.activated_at, p.paid_at, a.created_at) as activated_at,
			COALESCE(a.expires_at, p.paid_at + (t.duration_days || ' days')::interval) as expires_at,
			COALESCE((SELECT ai.image_url FROM ad_images ai WHERE ai.advertisement_id = a.id ORDER BY ai.sort_order asc, ai.id asc LIMIT 1), '') AS image_url`).
		Order("COALESCE(a.activated_at, p.paid_at, a.created_at) desc").
		Limit(limit).
		Find(&rows).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load active ads"})
		return
	}
	c.JSON(http.StatusOK, rows)
}

func syncPaymentIfNeeded(c *gin.Context, payment models.Payment) models.Payment {
	if payment.OperationID == "" {
		return payment
	}
	if payment.Status == models.PaymentStatusPaid || payment.Status == models.PaymentStatusExpired || payment.Status == models.PaymentStatusFailed || payment.Status == models.PaymentStatusRefunded {
		return payment
	}
	service := payments.DefaultService()
	if err := service.SyncPaymentStatus(c.Request.Context(), &payment); err != nil {
		return payment
	}
	return payment
}

func paymentPayload(ad models.Advertisement, payment models.Payment, tariff models.Tariff) gin.H {
	return gin.H{
		"advertisement": ad,
		"payment":       payment,
		"tariff":        tariff,
		"payment_url":   payment.PaymentLink,
		"operation_id":  payment.OperationID,
		"bank_status":   payment.BankStatus,
		"status":        payment.Status,
	}
}
