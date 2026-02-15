package models

import "time"

type Payment struct {
	ID              uint
	AdvertisementID uint
	Amount          int
	Method          string // SBP | QR
	Status          string // pending | confirmed | rejected
	PaidAt          *time.Time
}
