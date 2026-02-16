package models

import "time"

const (
	RoleAdmin     = "admin"
	RoleModerator = "moderator"
	RoleUser      = "user"

	StatusPending  = "pending"
	StatusApproved = "approved"
	StatusRejected = "rejected"
)

type User struct {
	ID              uint      `gorm:"primaryKey"`
	Login           string    `gorm:"uniqueIndex;not null"`
	PasswordHash    string    `gorm:"not null"`
	Role            string    `gorm:"type:varchar(20);not null;default:user"`
	Status          string    `gorm:"type:varchar(20);not null;default:pending"`
	Verified        bool      `gorm:"not null;default:false"`
	RejectionReason *string   `gorm:"type:text"`
	CreatedAt       time.Time `gorm:"autoCreateTime"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime"`
}
