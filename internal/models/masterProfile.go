package models

import "time"

type MasterProfile struct {
	ID              uint      `gorm:"primaryKey"`
	UserID          uint      `gorm:"uniqueIndex;not null"`
	CategoryID      uint      `gorm:"not null"`
	FullName        string    `gorm:"type:varchar(255)"`
	Description     string    `gorm:"type:text"`
	Services        string    `gorm:"type:text"`
	Phone           string    `gorm:"type:varchar(50)"`
	City            string    `gorm:"type:varchar(100)"`
	SocialLinks     string    `gorm:"type:text"`
	AvatarURL       string    `gorm:"type:text"`
	Status          string    `gorm:"type:varchar(20);default:pending"`
	RejectionReason *string   `gorm:"type:text"`
	CreatedAt       time.Time `gorm:"autoCreateTime"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime"`
}
