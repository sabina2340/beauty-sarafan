package models

import "time"

const (
	AdTypeService = "service"
	AdTypeCabinet = "cabinet"
	AdTypeSalon   = "salon"

	AdStatusPending  = "pending"
	AdStatusApproved = "approved"
	AdStatusRejected = "rejected"
	AdStatusActive   = "active"
	AdStatusExpired  = "expired"
)

type Advertisement struct {
	ID              uint   `gorm:"primaryKey"`
	UserID          uint   `gorm:"index;not null"`
	Type            string `gorm:"type:varchar(20);not null"`
	Title           string `gorm:"type:varchar(255);not null"`
	Description     string `gorm:"type:text"`
	City            string `gorm:"type:varchar(100)"`
	CategoryID      *uint  `gorm:"index"`
	Status          string `gorm:"type:varchar(20);not null;default:pending"`
	TariffID        *uint  `gorm:"index"`
	ActivatedAt     *time.Time
	ExpiresAt       *time.Time `gorm:"index"`
	RejectionReason *string    `gorm:"type:text"`
	CreatedAt       time.Time  `gorm:"autoCreateTime"`
	UpdatedAt       time.Time  `gorm:"autoUpdateTime"`
}
