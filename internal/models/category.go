package models

type Category struct {
	ID   uint   `gorm:"primaryKey"`
	Name string `gorm:"not null"`
	Slug string `gorm:"uniqueIndex;not null"`
}
