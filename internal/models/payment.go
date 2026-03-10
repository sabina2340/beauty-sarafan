package models

import "time"

type Payment struct {
	ID              uint   `gorm:"primaryKey"`
	AdvertisementID uint   `gorm:"index;not null"`
	TariffID        uint   `gorm:"index;not null"`
	Amount          int    `gorm:"not null"`
	Method          string `gorm:"type:varchar(20);default:QR"` // SBP | QR
	Status          string `gorm:"type:varchar(20);not null;default:pending"`
	Comment         string `gorm:"type:text"`
	MarkedPaidAt    *time.Time
	PaidAt          *time.Time
	CreatedAt       time.Time `gorm:"autoCreateTime"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime"`
}
