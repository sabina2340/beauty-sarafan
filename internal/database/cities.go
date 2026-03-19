package database

import (
	"beauty-sarafan/internal/models"
	"strings"

	"gorm.io/gorm"
)

func NormalizeCityName(name string) string {
	return strings.Join(strings.Fields(strings.ToLower(strings.TrimSpace(name))), " ")
}

func EnsureCity(tx *gorm.DB, cityID uint, rawName string) (*models.City, error) {
	if tx == nil {
		tx = DB
	}

	if cityID != 0 {
		var existing models.City
		if err := tx.First(&existing, cityID).Error; err != nil {
			return nil, err
		}
		return &existing, nil
	}

	name := strings.TrimSpace(rawName)
	normalized := NormalizeCityName(name)
	if normalized == "" {
		return nil, gorm.ErrRecordNotFound
	}

	city := models.City{Name: name, NormalizedName: normalized}
	if err := tx.Where("normalized_name = ?", normalized).Assign(models.City{Name: name}).FirstOrCreate(&city).Error; err != nil {
		return nil, err
	}
	return &city, nil
}

func backfillMasterProfileCities(db *gorm.DB) {
	var profiles []models.MasterProfile
	if err := db.Where("city_id = 0 OR city_id IS NULL").Find(&profiles).Error; err != nil {
		return
	}

	for _, profile := range profiles {
		city, err := EnsureCity(db, 0, profile.City)
		if err != nil || city == nil {
			continue
		}

		_ = db.Model(&models.MasterProfile{}).
			Where("id = ?", profile.ID).
			Updates(map[string]interface{}{"city_id": city.ID, "city": city.Name}).Error
	}
}
