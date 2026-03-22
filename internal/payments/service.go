package payments

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"time"

	"gorm.io/gorm"
)

type Service struct {
	config Config
	client *Client
}

func NewService(config Config) *Service {
	return &Service{config: config, client: NewClient(config)}
}

func DefaultService() *Service {
	config := LoadConfigFromEnv()
	return NewService(config)
}

type CreatePaymentParams struct {
	Advertisement models.Advertisement
	Tariff        models.Tariff
}

type CreatePaymentResult struct {
	Payment models.Payment
	Bank    TochkaPaymentOperation
}

func (s *Service) Config() Config {
	return s.config
}

func (s *Service) CreatePaymentForAd(ctx context.Context, params CreatePaymentParams) (CreatePaymentResult, error) {
	var result CreatePaymentResult
	if err := s.config.Validate(); err != nil {
		return result, err
	}

	paymentModes := []string{"sbp", "card"}
	redirectURL := s.config.RedirectURL
	failRedirectURL := s.config.FailRedirectURL
	purpose := fmt.Sprintf("Оплата тарифа \"%s\" для объявления #%d", params.Tariff.Name, params.Advertisement.ID)
	amountString := strconv.Itoa(params.Tariff.Price)
	request := TochkaCreatePaymentRequest{
		Data: TochkaCreatePaymentRequestData{
			CustomerCode:    s.config.CustomerCode,
			Amount:          amountString,
			Purpose:         purpose,
			PaymentMode:     paymentModes,
			RedirectURL:     redirectURL,
			FailRedirectURL: failRedirectURL,
			MerchantID:      s.config.MerchantID,
			TTL:             s.config.TTLMinutes,
		},
	}
	requestRaw, _ := json.Marshal(request)
	payment := models.Payment{
		AdvertisementID: params.Advertisement.ID,
		TariffID:        params.Tariff.ID,
		Amount:          params.Tariff.Price,
		Currency:        "RUB",
		CustomerCode:    s.config.CustomerCode,
		Status:          models.PaymentStatusCreated,
		BankStatus:      "CREATED",
		PaymentModes:    mustJSONString(paymentModes),
		RedirectURL:     redirectURL,
		FailRedirectURL: failRedirectURL,
		BankRequestRaw:  string(requestRaw),
		ExpiresAt:       ttlToExpiresAt(s.config.TTLMinutes),
	}
	if s.config.MerchantID != "" {
		merchantID := s.config.MerchantID
		payment.MerchantID = &merchantID
	}

	if err := database.DB.Create(&payment).Error; err != nil {
		return result, err
	}

	response, responseRaw, err := s.client.CreatePaymentOperation(ctx, request)
	if err != nil {
		payment.Status = models.PaymentStatusFailed
		payment.ErrorMessage = err.Error()
		payment.BankResponseRaw = string(responseRaw)
		if saveErr := database.DB.Save(&payment).Error; saveErr != nil {
			log.Printf("save failed payment error: %v", saveErr)
		}
		return result, err
	}

	payment.OperationID = response.Data.OperationID
	payment.PaymentLink = response.Data.PaymentLink
	payment.BankStatus = response.Data.Status
	payment.Status = MapBankStatus(response.Data.Status)
	payment.BankResponseRaw = string(responseRaw)
	if response.Data.RedirectURL != "" {
		payment.RedirectURL = response.Data.RedirectURL
	}
	if len(response.Data.PaymentModes) > 0 {
		payment.PaymentModes = mustJSONString(response.Data.PaymentModes)
	}
	if expiresAt := parseTochkaExpiresAt(response.Data.ExpiresAtRaw); expiresAt != nil {
		payment.ExpiresAt = expiresAt
	}

	if err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&payment).Error; err != nil {
			return err
		}
		params.Advertisement.TariffID = &params.Tariff.ID
		return tx.Save(&params.Advertisement).Error
	}); err != nil {
		return result, err
	}

	result.Payment = payment
	result.Bank = response.Data
	return result, nil
}

func (s *Service) SyncPaymentStatus(ctx context.Context, payment *models.Payment) error {
	if payment == nil || payment.OperationID == "" {
		return fmt.Errorf("payment operation id is empty")
	}
	if err := s.config.Validate(); err != nil {
		return err
	}

	response, responseRaw, err := s.client.GetPaymentOperationInfo(ctx, payment.OperationID)
	if err != nil {
		payment.ErrorMessage = err.Error()
		return err
	}
	payment.BankResponseRaw = string(responseRaw)
	return ApplyBankOperation(database.DB, payment, response.Data)
}

func (s *Service) ApplyWebhook(ctx context.Context, rawToken string) (*models.Payment, TochkaAcquiringWebhook, error) {
	payload, err := DecodeWebhookPayload(rawToken, s.config.WebhookPublicKeyPEM)
	if err != nil {
		return nil, payload, err
	}

	var payment models.Payment
	if err := database.DB.Where("operation_id = ?", payload.OperationID).First(&payment).Error; err != nil {
		return nil, payload, err
	}

	operation := TochkaPaymentOperation{
		OperationID: payment.OperationID,
		Status:      payload.Status,
		Amount:      payload.Amount,
		Purpose:     payload.Purpose,
	}
	if err := ApplyBankOperation(database.DB.WithContext(ctx), &payment, operation); err != nil {
		return nil, payload, err
	}
	return &payment, payload, nil
}

func ApplyBankOperation(db *gorm.DB, payment *models.Payment, operation TochkaPaymentOperation) error {
	var ad models.Advertisement
	var tariff models.Tariff
	now := time.Now()

	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(&ad, payment.AdvertisementID).Error; err != nil {
			return err
		}
		if err := tx.First(&tariff, payment.TariffID).Error; err != nil {
			return err
		}

		payment.BankStatus = operation.Status
		payment.Status = MapBankStatus(operation.Status)
		if operation.PaymentLink != "" {
			payment.PaymentLink = operation.PaymentLink
		}
		if operation.RedirectURL != "" {
			payment.RedirectURL = operation.RedirectURL
		}
		if len(operation.PaymentModes) > 0 {
			payment.PaymentModes = mustJSONString(operation.PaymentModes)
		}
		if expiresAt := parseTochkaExpiresAt(operation.ExpiresAtRaw); expiresAt != nil {
			payment.ExpiresAt = expiresAt
		}
		if IsSuccessfulBankStatus(operation.Status) && payment.PaidAt == nil {
			payment.PaidAt = &now
			payment.ErrorMessage = ""
			ad.Status = models.AdStatusActive
			ad.ActivatedAt = &now
			expiresAt := now.AddDate(0, 0, tariff.DurationDays)
			ad.ExpiresAt = &expiresAt
		} else if payment.Status == models.PaymentStatusExpired && payment.ExpiresAt == nil {
			payment.ExpiresAt = &now
		}

		if err := tx.Save(payment).Error; err != nil {
			return err
		}
		if IsSuccessfulBankStatus(operation.Status) {
			if err := tx.Save(&ad).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func parseTochkaExpiresAt(raw string) *time.Time {
	if raw == "" {
		return nil
	}
	layouts := []string{time.RFC3339, "2006-01-02T15:04:05", "2006-01-02 15:04:05"}
	for _, layout := range layouts {
		if parsed, err := time.Parse(layout, raw); err == nil {
			return &parsed
		}
	}
	return nil
}

func ttlToExpiresAt(ttlMinutes int) *time.Time {
	if ttlMinutes <= 0 {
		return nil
	}
	expiresAt := time.Now().Add(time.Duration(ttlMinutes) * time.Minute)
	return &expiresAt
}

func mustJSONString(value any) string {
	encoded, _ := json.Marshal(value)
	return string(encoded)
}
