package models

type City struct {
	ID             uint   `gorm:"primaryKey" json:"id"`
	Name           string `gorm:"type:varchar(150);not null" json:"name"`
	NormalizedName string `gorm:"type:varchar(150);uniqueIndex;not null" json:"-"`
}
