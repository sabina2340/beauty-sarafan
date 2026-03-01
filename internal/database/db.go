package database

import (
	"beauty-sarafan/internal/models"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() *gorm.DB {
	_ = godotenv.Load()

	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		dsn = fmt.Sprintf(
			"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
			os.Getenv("DB_HOST"),
			os.Getenv("DB_USER"),
			os.Getenv("DB_PASSWORD"),
			os.Getenv("DB_NAME"),
			os.Getenv("DB_PORT"),
		)
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("DB connection error:", err)
	}

	err = db.AutoMigrate(
		&models.User{},
		&models.PersonalDataConsent{},
		&models.Category{},
		&models.MasterProfile{},
		&models.Advertisement{},
		&models.Tariff{},
		&models.Payment{},
		&models.EquipmentItem{},
		&models.ModerationLog{},
	)
	if err != nil {
		log.Fatal("AutoMigrate error:", err)
	}

	seedAdmin(db)

	DB = db
	return db
}

func seedAdmin(db *gorm.DB) {
	login := os.Getenv("ADMIN_LOGIN")
	if login == "" {
		login = "admin"
	}

	password := os.Getenv("ADMIN_PASSWORD")
	if password == "" {
		password = "admin123"
	}

	var existing models.User
	if err := db.Where("login = ?", login).First(&existing).Error; err == nil {
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("admin seed password hash error: %v", err)
		return
	}

	admin := models.User{
		Login:        login,
		PasswordHash: string(hash),
		Role:         models.RoleAdmin,
		Status:       models.StatusApproved,
		Verified:     true,
	}

	if err := db.Create(&admin).Error; err != nil {
		log.Printf("admin seed create error: %v", err)
	}
}
