package models

import (
	"time"

	"gorm.io/gorm"
)

type Story struct {
	ID        uint           `gorm:"primaryKey"`
	UserID    uint           `gorm:"index;not null"`
	MediaType string         `gorm:"not null;index"`
	MediaURL  string         `gorm:"not null"`
	CreatedAt time.Time      `gorm:"index"`
	ExpiresAt time.Time      `gorm:"index"`
	DeletedAt gorm.DeletedAt `gorm:"index"`
}
