package models

import "time"

type EquipmentItem struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"type:varchar(255);not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	Contact     string    `gorm:"type:text" json:"contact"`
	Price       *float64  `gorm:"type:numeric" json:"price"`
	ImageURL    string    `gorm:"type:text" json:"image_url"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
