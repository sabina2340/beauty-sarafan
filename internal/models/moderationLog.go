package models

import "time"

type ModerationLog struct {
	ID         uint
	EntityType string // profile | advertisement
	EntityID   uint
	AdminID    uint
	Action     string // approved | rejected
	Comment    string
	CreatedAt  time.Time
}
