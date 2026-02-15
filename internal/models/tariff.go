package models

type Tariff struct {
	ID           uint
	Name         string
	Price        int
	DurationDays int
	IsActive     bool
}
