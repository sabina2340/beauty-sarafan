package models

import "time"

type ReviewStatus string

const (
	ReviewStatusPending  ReviewStatus = "pending"
	ReviewStatusApproved ReviewStatus = "approved"
	ReviewStatusRejected ReviewStatus = "rejected"
)

type Review struct {
	ID                      uint         `json:"id" gorm:"primaryKey"`
	MasterID                uint         `json:"master_id" gorm:"index;not null"`
	Phone                   string       `json:"phone" gorm:"size:20;not null"`
	Text                    string       `json:"text" gorm:"size:1000;not null"`
	PhotoURL                string       `json:"photo_url"`
	Status                  ReviewStatus `json:"status" gorm:"type:varchar(20);default:'pending';index"`
	IsPersonalDataConsent   bool         `json:"is_personal_data_consent" gorm:"not null;default:false"`
	PersonalDataConsentAt   *time.Time   `json:"personal_data_consent_at"`
	PersonalDataConsentType string       `json:"personal_data_consent_type" gorm:"size:120"`
	AdminComment            string       `json:"admin_comment" gorm:"size:1000"`
	CreatedAt               time.Time    `json:"created_at"`
	UpdatedAt               time.Time    `json:"updated_at"`
	PublishedAt             *time.Time   `json:"published_at"`
}
