package models

import "time"

const (
	PaymentStatusCreated    = "created"
	PaymentStatusProcessing = "processing"
	PaymentStatusPaid       = "paid"
	PaymentStatusFailed     = "failed"
	PaymentStatusExpired    = "expired"
	PaymentStatusRefunded   = "refunded"
)

type Payment struct {
	ID              uint    `gorm:"primaryKey"`
	AdvertisementID uint    `gorm:"index;not null"`
	TariffID        uint    `gorm:"index;not null"`
	Amount          int     `gorm:"not null"`
	Currency        string  `gorm:"type:varchar(10);not null;default:RUB"`
	CustomerCode    string  `gorm:"type:varchar(64);not null;default:''"`
	OperationID     string  `gorm:"type:varchar(128)"`
	PaymentLink     string  `gorm:"type:text"`
	Status          string  `gorm:"type:varchar(20);not null;default:created"`
	BankStatus      string  `gorm:"type:varchar(64)"`
	PaymentModes    string  `gorm:"type:text"`
	RedirectURL     string  `gorm:"type:text"`
	FailRedirectURL string  `gorm:"type:text"`
	MerchantID      *string `gorm:"type:varchar(64)"`
	BankRequestRaw  string  `gorm:"type:text"`
	BankResponseRaw string  `gorm:"type:text"`
	ErrorMessage    string  `gorm:"type:text"`
	Comment         string  `gorm:"type:text"`
	MarkedPaidAt    *time.Time
	PaidAt          *time.Time
	ExpiresAt       *time.Time
	CreatedAt       time.Time `gorm:"autoCreateTime"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime"`
}
