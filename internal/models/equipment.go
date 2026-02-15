package models

import "time"

type Equipment struct {
	ID           uint
	Title        string
	Description  string
	PriceInfo    string
	ContactName  string
	ContactPhone string
	Images       string
	CreatedAt    time.Time
}
