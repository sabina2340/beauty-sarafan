package ads

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/integrations/tochka"
	"beauty-sarafan/internal/models"
	"beauty-sarafan/internal/storage"
	"errors"
	"fmt"
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

func activateAdvertisementPayment(tx *gorm.DB, payment *models.Payment, ad *models.Advertisement, tariff *models.Tariff) error {
	if payment.Status == "confirmed" && payment.PaidAt != nil && ad.Status == models.AdStatusActive && ad.ActivatedAt != nil && ad.ExpiresAt != nil {
		return nil
	}

	now := time.Now()
	expires := now.AddDate(0, 0, tariff.DurationDays)

	payment.Status = "confirmed"
	payment.PaidAt = &now
	payment.ProviderStatus = "APPROVED"
	if err := tx.Save(payment).Error; err != nil {
		return err
	}

	ad.Status = models.AdStatusActive
	ad.ActivatedAt = &now
	ad.ExpiresAt = &expires
	return tx.Save(ad).Error
}

func paymentStatusMessage(status string) string {
	switch strings.ToUpper(strings.TrimSpace(status)) {
	case "APPROVED":
		return "Платеж подтвержден"
	case "CREATED":
		return "Платеж еще не подтвержден"
	case "EXPIRED":
		return "Срок действия ссылки на оплату истек"
	case "REFUNDED":
		return "Платеж был возвращен"
	case "ON-REFUND":
		return "Платеж находится в процессе возврата"
	default:
		if status == "" {
			return "Статус платежа пока недоступен"
		}
		return fmt.Sprintf("Текущий статус платежа: %s", status)
	}
}

func paymentCheckHTTPStatus(status string) int {
	if strings.ToUpper(strings.TrimSpace(status)) == "APPROVED" {
		return http.StatusOK
	}
	return http.StatusAccepted
}

func syncPaymentWithTochka(tx *gorm.DB, payment *models.Payment, ad *models.Advertisement, tariff *models.Tariff) (string, error) {
	if strings.TrimSpace(payment.Provider) == "" || payment.Provider != "tochka" {
		return "", errors.New("payment provider is not supported")
	}
	if strings.TrimSpace(payment.ProviderOperationID) == "" {
		return "", errors.New("operation id is missing")
	}

	client, err := tochka.NewClientFromEnv()
	if err != nil {
		return "", err
	}

	operation, err := client.GetOperationInfo(payment.ProviderOperationID)
	if err != nil {
		return "", err
	}

	payment.ProviderStatus = operation.Status
	if operation.PaymentLink != "" {
		payment.ProviderPaymentLink = operation.PaymentLink
	}
	if err := tx.Save(payment).Error; err != nil {
		return "", err
	}

	if strings.ToUpper(operation.Status) == "APPROVED" {
		if err := activateAdvertisementPayment(tx, payment, ad, tariff); err != nil {
			return operation.Status, err
		}
	}

	return operation.Status, nil
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

	client, err := tochka.NewClientFromEnv()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	redirectPath := fmt.Sprintf("/account/ads/%d/payment", ad.ID)
	paymentLinkResponse, err := client.CreatePaymentLink(tochka.CreatePaymentLinkRequest{
		Amount:          tariff.Price,
		Purpose:         fmt.Sprintf("Оплата тарифа %s для объявления %s", tariff.Name, ad.Title),
		RedirectURL:     client.BuildRedirectURL(redirectPath),
		FailRedirectURL: client.BuildRedirectURL(redirectPath),
		PaymentLinkID:   fmt.Sprintf("ad-%d-payment-%d", ad.ID, time.Now().Unix()),
	})
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}
	if paymentLinkResponse.PaymentLink == "" {
		c.JSON(http.StatusBadGateway, gin.H{"error": "payment link was not returned by provider"})
		return
	}
	if paymentLinkResponse.OperationID == "" {
		c.JSON(http.StatusBadGateway, gin.H{"error": "operation id was not returned by provider"})
		return
	}

	var payment models.Payment
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		ad.TariffID = &tariff.ID
		if err := tx.Save(&ad).Error; err != nil {
			return err
		}
		payment = models.Payment{
			AdvertisementID:     ad.ID,
			TariffID:            tariff.ID,
			Amount:              tariff.Price,
			Method:              "card",
			Status:              "pending",
			Provider:            "tochka",
			ProviderOperationID: paymentLinkResponse.OperationID,
			ProviderPaymentLink: paymentLinkResponse.PaymentLink,
			ProviderStatus:      paymentLinkResponse.Status,
		}
		return tx.Create(&payment).Error
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create payment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"payment_id":      payment.ID,
		"payment_link":    payment.ProviderPaymentLink,
		"operation_id":    payment.ProviderOperationID,
		"provider_status": payment.ProviderStatus,
		"redirect":        redirectPath,
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

	var tariff models.Tariff
	_ = database.DB.First(&tariff, payment.TariffID).Error

	c.JSON(http.StatusOK, gin.H{
		"advertisement":  ad,
		"payment":        payment,
		"tariff":         tariff,
		"payment_link":   payment.ProviderPaymentLink,
		"operation_id":   payment.ProviderOperationID,
		"current_status": payment.ProviderStatus,
		"is_paid":        payment.Status == "confirmed",
	})
}

// CheckPaymentStatus POST /payments/:id/check-status
func CheckPaymentStatus(c *gin.Context) {
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

	var tariff models.Tariff
	if err := database.DB.First(&tariff, payment.TariffID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "tariff not found"})
		return
	}

	var status string
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		var syncErr error
		status, syncErr = syncPaymentWithTochka(tx, &payment, &ad, &tariff)
		return syncErr
	})
	if err != nil {
		switch {
		case strings.Contains(err.Error(), "missing"):
			c.JSON(http.StatusBadRequest, gin.H{"error": "payment operation id is missing"})
		case strings.Contains(err.Error(), "required environment variable"):
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(paymentCheckHTTPStatus(status), gin.H{
		"message":          paymentStatusMessage(status),
		"payment":          payment,
		"operation_id":     payment.ProviderOperationID,
		"payment_link":     payment.ProviderPaymentLink,
		"current_status":   status,
		"is_paid":          payment.Status == "confirmed",
		"advertisement_id": ad.ID,
	})
}

// MarkPaymentPaid POST /payments/:id/mark-paid
func MarkPaymentPaid(c *gin.Context) {
	CheckPaymentStatus(c)
}

// AdminPendingPayments GET /admin/payments/pending
func AdminPendingPayments(c *gin.Context) {
	var rows []map[string]interface{}
	err := database.DB.Table("payments p").
		Select(`p.id, p.status, p.amount, p.comment, p.created_at, p.marked_paid_at,
			p.provider, p.provider_status, p.provider_operation_id,
			u.login, a.id as advertisement_id, a.title as advertisement_title,
			t.name as tariff_name, t.duration_days`).
		Joins("JOIN advertisements a ON a.id = p.advertisement_id").
		Joins("JOIN users u ON u.id = a.user_id").
		Joins("JOIN tariffs t ON t.id = p.tariff_id").
		Where("p.status = ? AND (p.marked_paid_at IS NOT NULL OR p.provider = ?)", "pending", "tochka").
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
	if payment.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payment is already processed"})
		return
	}

	var ad models.Advertisement
	if err := database.DB.First(&ad, payment.AdvertisementID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ad not found"})
		return
	}
	var tariff models.Tariff
	if err := database.DB.First(&tariff, payment.TariffID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "tariff not found"})
		return
	}

	err = database.DB.Transaction(func(tx *gorm.DB) error {
		if err := activateAdvertisementPayment(tx, &payment, &ad, &tariff); err != nil {
			return err
		}

		return tx.Create(&models.ModerationLog{
			EntityType: "payment",
			EntityID:   payment.ID,
			AdminID:    adminID,
			Action:     "confirmed",
		}).Error
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to confirm payment"})
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
	if payment.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payment is already processed"})
		return
	}

	payment.Status = "rejected"
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
	err := database.DB.Table("advertisements a").
		Select(`a.id, a.user_id, a.type, a.title, a.description, a.city,
			COALESCE(a.activated_at, p.paid_at, a.created_at) as activated_at,
			COALESCE(a.expires_at, p.paid_at + (t.duration_days || ' days')::interval) as expires_at,
			COALESCE((SELECT ai.image_url FROM ad_images ai WHERE ai.advertisement_id = a.id ORDER BY ai.sort_order asc, ai.id asc LIMIT 1), '') AS image_url`).
		Joins(`LEFT JOIN LATERAL (
			SELECT pay.id, pay.paid_at, pay.tariff_id
			FROM payments pay
			WHERE pay.advertisement_id = a.id AND pay.status = 'confirmed'
			ORDER BY pay.paid_at DESC NULLS LAST, pay.id DESC
			LIMIT 1
		) p ON true`).
		Joins("LEFT JOIN tariffs t ON t.id = p.tariff_id").
		Where(`
			(a.status = ?)
			OR
			(a.status = ? AND (a.expires_at IS NULL OR a.expires_at > ?))
			OR
			(p.id IS NOT NULL AND COALESCE(a.expires_at, p.paid_at + (t.duration_days || ' days')::interval) > ?)
		`, models.AdStatusApproved, models.AdStatusActive, now, now).
		Order("COALESCE(a.activated_at, p.paid_at, a.created_at) desc").
		Group("a.id, p.id, p.paid_at, t.duration_days").
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
	err := database.DB.Table("advertisements a").
		Select(`a.id, a.user_id, a.type, a.title, a.description, a.city,
			COALESCE(a.activated_at, p.paid_at, a.created_at) as activated_at,
			COALESCE(a.expires_at, p.paid_at + (t.duration_days || ' days')::interval) as expires_at,
			COALESCE((SELECT ai.image_url FROM ad_images ai WHERE ai.advertisement_id = a.id ORDER BY ai.sort_order asc, ai.id asc LIMIT 1), '') AS image_url`).
		Joins(`LEFT JOIN LATERAL (
			SELECT pay.id, pay.paid_at, pay.tariff_id
			FROM payments pay
			WHERE pay.advertisement_id = a.id AND pay.status = 'confirmed'
			ORDER BY pay.paid_at DESC NULLS LAST, pay.id DESC
			LIMIT 1
		) p ON true`).
		Joins("LEFT JOIN tariffs t ON t.id = p.tariff_id").
		Where(`
			(a.status = ?)
			OR
			(a.status = ? AND (a.expires_at IS NULL OR a.expires_at > ?))
			OR
			(p.id IS NOT NULL AND COALESCE(a.expires_at, p.paid_at + (t.duration_days || ' days')::interval) > ?)
		`, models.AdStatusApproved, models.AdStatusActive, now, now).
		Order("COALESCE(a.activated_at, p.paid_at, a.created_at) desc").
		Group("a.id, p.id, p.paid_at, t.duration_days").
		Limit(limit).
		Find(&rows).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load active ads"})
		return
	}
	c.JSON(http.StatusOK, rows)
}
