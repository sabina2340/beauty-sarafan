package public

import (
	"beauty-sarafan/internal/database"
	storiesHandler "beauty-sarafan/internal/handlers/stories"
	"beauty-sarafan/internal/models"
	"beauty-sarafan/internal/storage"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type PublicStoryItem struct {
	ID        uint      `json:"id"`
	MediaType string    `json:"media_type"`
	MediaURL  string    `json:"media_url"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

func cleanupStoriesLazy() {
	uploader, err := storage.NewService()
	if err != nil {
		return
	}
	storiesHandler.CleanupExpiredStories(database.DB, uploader)
}

func GetMasterStories(c *gin.Context) {
	cleanupStoriesLazy()

	masterID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var stories []models.Story
	if err := database.DB.Where("user_id = ? AND expires_at > ?", masterID, time.Now().UTC()).Order("created_at asc").Find(&stories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load stories"})
		return
	}

	items := make([]PublicStoryItem, 0, len(stories))
	for _, item := range stories {
		items = append(items, PublicStoryItem{
			ID:        item.ID,
			MediaType: item.MediaType,
			MediaURL:  item.MediaURL,
			CreatedAt: item.CreatedAt,
			ExpiresAt: item.ExpiresAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"items": items})
}
