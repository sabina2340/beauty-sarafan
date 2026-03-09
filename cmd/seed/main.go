package main

import (
	"fmt"
	"log"

	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"

	"golang.org/x/crypto/bcrypt"
)

func hashPassword(password string) string {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("failed to hash password:", err)
	}
	return string(hash)
}

func mustCategoryID(slug string) uint {
	var c models.Category
	if err := database.DB.Where("slug = ?", slug).First(&c).Error; err != nil {
		log.Fatalf("category not found: %s (%v)", slug, err)
	}
	return c.ID
}

func main() {
	database.InitDB()

	password := hashPassword("123456") // пароль для всех мастеров

	cat := map[string]uint{
		"lash-extension":    mustCategoryID("lash-extension"),
		"manicure-pedicure": mustCategoryID("manicure-pedicure"),
		"hairdresser":       mustCategoryID("hairdresser"),
		"cosmetology":       mustCategoryID("cosmetology"),
		"massage":           mustCategoryID("massage"),
		"brow-master":       mustCategoryID("brow-master"),
		"nanny":             mustCategoryID("nanny"),
	}

	type SeedMaster struct {
		Login       string
		FullName    string
		City        string
		CategoryID  uint
		Description string
		Services    string
		Phone       string
		SocialLinks string
	}

	masters := []SeedMaster{
		{"lash_anna", "Анна Лашмейкер", "Москва", cat["lash-extension"], "Наращивание ресниц, ламинирование. 5 лет опыта.", "Классика; 2D/3D; Ламинирование", "+79990000001", "tg:@lash_anna"},
		{"nails_kate", "Екатерина Маникюр", "Москва", cat["manicure-pedicure"], "Аккуратный маникюр, стерильность.", "Маникюр; Педикюр; Гель-лак", "+79990000002", "ig:@nails_kate"},
		{"hair_mila", "Мила Парикмахер", "СПб", cat["hairdresser"], "Стрижки и окрашивания.", "Стрижка; Окрашивание; Укладка", "+79990000003", "vk:hair_mila"},
		{"cosm_olga", "Ольга Косметолог", "Казань", cat["cosmetology"], "Уходовые процедуры.", "Чистка; Пилинг; Уход", "+79990000004", "tg:@cosm_olga"},
		{"mass_ivan", "Иван Массажист", "Екатеринбург", cat["massage"], "Классический и спортивный массаж.", "Классический; Спортивный", "+79990000005", "tg:@mass_ivan"},
		{"brow_nina", "Нина Бровист", "Новосибирск", cat["brow-master"], "Архитектура бровей.", "Коррекция; Окрашивание", "+79990000006", "ig:@brow_nina"},
		{"nanny_svet", "Светлана Няня", "Москва", cat["nanny"], "Присмотр за детьми.", "Почасово; Полный день", "+79990000007", "tg:@nanny_svet"},
		{"barber_tim", "Тимур Барбер", "Краснодар", cat["hairdresser"], "Мужские стрижки.", "Стрижка; Борода", "+79990000008", "vk:barber_tim"},
	}

	for _, m := range masters {

		user := models.User{
			Login:        m.Login,
			PasswordHash: password,
			Role:         models.RoleUser,
			Status:       models.StatusApproved,
			Verified:     true,
		}

		if err := database.DB.Create(&user).Error; err != nil {
			log.Fatalf("create user %s: %v", m.Login, err)
		}

		profile := models.MasterProfile{
			UserID:      user.ID,
			CategoryID:  m.CategoryID,
			FullName:    m.FullName,
			Description: m.Description,
			Services:    m.Services,
			Phone:       m.Phone,
			City:        m.City,
			SocialLinks: m.SocialLinks,
			Status:      models.StatusApproved,
		}

		if err := database.DB.Create(&profile).Error; err != nil {
			log.Fatalf("create profile %s: %v", m.Login, err)
		}

		fmt.Println("Created master:", m.FullName)
	}

	fmt.Println("Seeding completed")
}
