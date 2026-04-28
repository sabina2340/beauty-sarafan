package stories

import (
	"beauty-sarafan/internal/models"
	"beauty-sarafan/internal/storage"
	"log"
	"time"

	"gorm.io/gorm"
)

const cleanupBatchSize = 50

func CleanupExpiredStories(db *gorm.DB, storageService *storage.Service) {
	if db == nil || storageService == nil {
		return
	}

	var items []models.Story
	if err := db.Where("expires_at < ?", time.Now().UTC()).Order("expires_at asc").Limit(cleanupBatchSize).Find(&items).Error; err != nil {
		log.Printf("stories cleanup query failed: %v", err)
		return
	}

	for _, item := range items {
		if err := storageService.DeleteFileByURL(item.MediaURL); err != nil {
			log.Printf("stories cleanup delete storage failed story_id=%d: %v", item.ID, err)
			continue
		}
		if err := db.Delete(&item).Error; err != nil {
			log.Printf("stories cleanup delete db failed story_id=%d: %v", item.ID, err)
		}
	}
}
