package models

import "time"

type AdImage struct {
	ID              uint      `gorm:"primaryKey"`
	AdvertisementID uint      `gorm:"index;not null"`
	ImageURL        string    `gorm:"type:text;not null"`
	SortOrder       int       `gorm:"not null;default:0"`
	CreatedAt       time.Time `gorm:"autoCreateTime"`
}
