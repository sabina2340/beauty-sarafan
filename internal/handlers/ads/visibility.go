package ads

import (
	"beauty-sarafan/internal/database"
	"time"

	"gorm.io/gorm"
)

const successfulAdPaymentJoin = `LEFT JOIN LATERAL (
	SELECT pay.id, pay.paid_at, pay.tariff_id
	FROM payments pay
	WHERE pay.advertisement_id = a.id AND (pay.status = 'paid' OR pay.bank_status = 'APPROVED')
	ORDER BY pay.paid_at DESC NULLS LAST, pay.id DESC
	LIMIT 1
) p ON true`

func publiclyVisibleAdsQuery(now time.Time) *gorm.DB {
	return database.DB.Table("advertisements a").
		Joins(successfulAdPaymentJoin).
		Joins("LEFT JOIN tariffs t ON t.id = p.tariff_id").
		Where("p.id IS NOT NULL AND COALESCE(a.expires_at, p.paid_at + (t.duration_days || ' days')::interval) > ?", now)
}
