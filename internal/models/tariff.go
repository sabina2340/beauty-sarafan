package models

type Tariff struct {
	ID           uint   `json:"id"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	Price        int    `json:"price"`
	DurationDays int    `json:"duration_days"`
	IsActive     bool   `json:"is_active"`
	SortOrder    int    `json:"sort_order"`
}
