package models

type Category struct {
	ID         uint   `gorm:"primaryKey"`
	Name       string `gorm:"not null"`
	Slug       string `gorm:"uniqueIndex;not null"`
	GroupName  string `gorm:"type:varchar(100);not null;index"`
	GroupTitle string `gorm:"type:varchar(150);not null"`
	Audience   string `gorm:"type:varchar(20);not null;default:both"`
	IsBusiness bool   `gorm:"not null;default:false"`
}
