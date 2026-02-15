package models

import "time"

type MasterProfile struct {
	ID          uint
	UserID      uint
	CategoryID  uint
	FullName    string
	Description string
	Services    string
	Phone       string
	SocialLinks string
	Status      string // draft | pending | approved | rejected
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
