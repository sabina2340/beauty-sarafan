package models

import "time"

type User struct {
	ID        uint   `gorm:"primaryKey"`
	Email     string `gorm:"unique"`
	Phone     string
	Password  string
	Role      string
	IsActive  bool
	CreatedAt time.Time
}
