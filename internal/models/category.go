package models

type Category struct {
	ID       uint   `gorm:"primaryKey"`
	Name     string `gorm:"not null"`
	Slug     string `gorm:"uniqueIndex;not null"`
	Audience string `gorm:"type:varchar(20);not null;default:both"` // master | client | both
}
