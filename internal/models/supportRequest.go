package models

import "time"

type SupportRequestStatus string

const (
	SupportRequestStatusNew        SupportRequestStatus = "new"
	SupportRequestStatusInProgress SupportRequestStatus = "in_progress"
	SupportRequestStatusClosed     SupportRequestStatus = "closed"
)

type SupportRequest struct {
	ID        uint                 `json:"id" gorm:"primaryKey"`
	Name      string               `json:"name" gorm:"size:120;not null"`
	Contact   string               `json:"contact" gorm:"size:160;not null;index"`
	Message   string               `json:"message" gorm:"size:2000;not null"`
	Status    SupportRequestStatus `json:"status" gorm:"type:varchar(20);not null;default:'new';index"`
	CreatedAt time.Time            `json:"created_at"`
	UpdatedAt time.Time            `json:"updated_at"`
}
