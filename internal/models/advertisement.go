package models

import "time"

type Advertisement struct {
	ID            uint
	MasterID      uint
	Title         string
	Description   string
	AdType        string // service | cabinet | salon
	Status        string // pending | approved | rejected
	PaymentStatus string // unpaid | paid
	TariffID      uint
	CreatedAt     time.Time
}
