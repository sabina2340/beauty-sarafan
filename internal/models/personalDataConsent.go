package models

import "time"

type PersonalDataConsent struct {
	ID         uint
	UserID     uint
	IPAddress  string
	UserAgent  string
	AcceptedAt time.Time
}
