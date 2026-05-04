package models

import "time"

type MasterWorkImage struct {
	ID              uint   `gorm:"primaryKey"`
	MasterProfileID uint   `gorm:"index;not null"`
	ImageURL        string `gorm:"type:text;not null"`
	MediaType       string `gorm:"not null;default:'image';index"`
	VideoURL        string
	SortOrder       int       `gorm:"not null;default:0"`
	CreatedAt       time.Time `gorm:"autoCreateTime"`
}
