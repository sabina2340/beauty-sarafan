package payments

import "beauty-sarafan/internal/models"

func MapBankStatus(bankStatus string) string {
	switch bankStatus {
	case "APPROVED":
		return models.PaymentStatusPaid
	case "AUTHORIZED", "IN-PROCESS", "PROCESSING", "3DS_CHECKING":
		return models.PaymentStatusProcessing
	case "EXPIRED":
		return models.PaymentStatusExpired
	case "ON-REFUND", "REFUNDED", "REFUNDED_PARTIALLY":
		return models.PaymentStatusRefunded
	case "DECLINED", "REJECTED", "CANCELLED", "FAILED":
		return models.PaymentStatusFailed
	case "CREATED", "NEW", "":
		return models.PaymentStatusCreated
	default:
		return models.PaymentStatusProcessing
	}
}

func IsSuccessfulBankStatus(bankStatus string) bool {
	return bankStatus == "APPROVED"
}
