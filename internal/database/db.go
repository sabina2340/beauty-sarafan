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
		&models.MasterWorkImage{},
		&models.AdImage{},
		&models.Tariff{},
		&models.Payment{},
		&models.EquipmentItem{},
		&models.ModerationLog{},
	)
	if err != nil {
		log.Fatal("AutoMigrate error:", err)
	}

	seedAdmin(db)
	seedCategories(db)
	seedTariffs(db)

	DB = db
	return db
}

func seedTariffs(db *gorm.DB) {
	items := []models.Tariff{
		{Name: "Акции и спецпредложения · 7 дней", Description: "Размещение во вкладке «Акции и спецпредложения»", Price: 500, DurationDays: 7, IsActive: true, SortOrder: 10},
		{Name: "Акции и спецпредложения · 14 дней", Description: "Размещение во вкладке «Акции и спецпредложения»", Price: 900, DurationDays: 14, IsActive: true, SortOrder: 20},
		{Name: "Акции и спецпредложения · 30 дней", Description: "Размещение во вкладке «Акции и спецпредложения»", Price: 1700, DurationDays: 30, IsActive: true, SortOrder: 30},
		{Name: "Всплывающие окна и баннеры · 7 дней", Description: "Размещение во всплывающих окнах и баннерах", Price: 600, DurationDays: 7, IsActive: true, SortOrder: 40},
		{Name: "Всплывающие окна и баннеры · 14 дней", Description: "Размещение во всплывающих окнах и баннерах", Price: 1000, DurationDays: 14, IsActive: true, SortOrder: 50},
		{Name: "Всплывающие окна и баннеры · 30 дней", Description: "Размещение во всплывающих окнах и баннерах", Price: 1900, DurationDays: 30, IsActive: true, SortOrder: 60},
	}
	_ = db.Model(&models.Tariff{}).Update("is_active", false).Error
	for _, item := range items {
		tariff := item
		if err := db.Where("name = ?", item.Name).Assign(item).FirstOrCreate(&tariff).Error; err != nil {
			log.Printf("tariff seed error (%s): %v", item.Name, err)
		}
	}
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

type seedCategory struct {
	Name       string
	Slug       string
	GroupName  string
	GroupTitle string
	Audience   string
	IsBusiness bool
}

func seedCategories(db *gorm.DB) {
	items := []seedCategory{
		{"Косметология", "cosmetology", "beauty-health", "Красота и здоровье", "both", false},
		{"Массаж", "massage", "beauty-health", "Красота и здоровье", "both", false},
		{"Эпиляция", "epilation", "beauty-health", "Красота и здоровье", "both", false},
		{"Наращивание ресниц", "lash-extension", "beauty-health", "Красота и здоровье", "both", false},
		{"Бровист", "brow-master", "beauty-health", "Красота и здоровье", "both", false},
		{"Татуаж", "permanent-makeup", "beauty-health", "Красота и здоровье", "both", false},
		{"Маникюр и педикюр", "manicure-pedicure", "beauty-health", "Красота и здоровье", "both", false},
		{"Парикмахер", "hairdresser", "beauty-health", "Красота и здоровье", "both", false},
		{"Визажист", "makeup-artist", "beauty-health", "Красота и здоровье", "both", false},
		{"Няня", "nanny", "home-help", "Домашняя помощь", "both", false},
		{"Сиделка", "caregiver", "home-help", "Домашняя помощь", "both", false},
		{"Клининг", "cleaning", "home-help", "Домашняя помощь", "both", false},
		{"Муж на час", "handyman", "home-help", "Домашняя помощь", "both", false},
		{"Тур агент", "travel-agent", "tourism", "Туризм", "both", false},
		{"Репетитор", "tutor", "education", "Образование", "both", false},
		{"Учитель", "teacher", "education", "Образование", "both", false},
		{"Тренер", "trainer", "fitness-sport", "Фитнес и спорт", "both", false},
		{"Инструктор", "instructor", "fitness-sport", "Фитнес и спорт", "both", false},
		{"Психолог", "psychologist", "psychology", "Психология", "both", false},
		{"Коуч", "coach", "psychology", "Психология", "both", false},
		{"Мебель", "furniture", "design-interior", "Дизайн и интерьер", "both", false},
		{"Дизайн", "design", "design-interior", "Дизайн и интерьер", "both", false},
		{"Ветеринарная помощь", "veterinary-help", "pets", "Животные", "both", false},
		{"Груминг", "grooming", "pets", "Животные", "both", false},
		{"Передержка", "pet-boarding", "pets", "Животные", "both", false},
		{"Обучение", "business-training", "business-growth", "Развитие специалистов и бизнеса", "both", true},
		{"Оборудование", "equipment", "business-growth", "Развитие специалистов и бизнеса", "both", true},
		{"Недвижимость", "real-estate", "business-growth", "Развитие специалистов и бизнеса", "both", true},
		{"Сотрудники", "staff", "business-growth", "Развитие специалистов и бизнеса", "both", true},
		{"Юридические услуги", "legal-services", "business-growth", "Развитие специалистов и бизнеса", "both", true},
		{"Бухгалтерские услуги", "accounting-services", "business-growth", "Развитие специалистов и бизнеса", "both", true},
		{"Маркетинг", "marketing", "business-growth", "Развитие специалистов и бизнеса", "both", true},
		{"Консалтинг", "consulting", "business-growth", "Развитие специалистов и бизнеса", "both", true},
	}

	for _, item := range items {
		category := models.Category{
			Name:       item.Name,
			Slug:       item.Slug,
			GroupName:  item.GroupName,
			GroupTitle: item.GroupTitle,
			Audience:   item.Audience,
			IsBusiness: item.IsBusiness,
		}
		if err := db.Where("slug = ?", item.Slug).Assign(category).FirstOrCreate(&category).Error; err != nil {
			log.Printf("category seed error (%s): %v", item.Slug, err)
		}
	}
}
