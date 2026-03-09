package models

import "time"

type MasterWorkImage struct {
	ID              uint      `gorm:"primaryKey"`
	MasterProfileID uint      `gorm:"index;not null"`
	ImageURL        string    `gorm:"type:text;not null"`
	SortOrder       int       `gorm:"not null;default:0"`
	CreatedAt       time.Time `gorm:"autoCreateTime"`
}
