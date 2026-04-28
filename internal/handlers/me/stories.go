package me

import (
	"beauty-sarafan/internal/database"
	storiesHandler "beauty-sarafan/internal/handlers/stories"
	"beauty-sarafan/internal/models"
	"beauty-sarafan/internal/storage"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type StoryItemResponse struct {
	ID        uint      `json:"id"`
	MediaType string    `json:"media_type"`
	MediaURL  string    `json:"media_url"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

type StoryListResponse struct {
	Items []StoryItemResponse `json:"items"`
}

func cleanupStoriesLazy() {
	uploader, err := storage.NewService()
	if err != nil {
		return
	}
	storiesHandler.CleanupExpiredStories(database.DB, uploader)
}

func toStoryResponse(stories []models.Story) StoryListResponse {
	items := make([]StoryItemResponse, 0, len(stories))
	for _, item := range stories {
		items = append(items, StoryItemResponse{
			ID:        item.ID,
			MediaType: item.MediaType,
			MediaURL:  item.MediaURL,
			CreatedAt: item.CreatedAt,
			ExpiresAt: item.ExpiresAt,
		})
	}
	return StoryListResponse{Items: items}
}

func GetMyStories(c *gin.Context) {
	cleanupStoriesLazy()

	userID := c.GetUint("user_id")
	var stories []models.Story
	if err := database.DB.Where("user_id = ? AND expires_at > ?", userID, time.Now().UTC()).Order("created_at asc").Find(&stories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load stories"})
		return
	}

	c.JSON(http.StatusOK, toStoryResponse(stories))
}

func PostMyStory(c *gin.Context) {
	cleanupStoriesLazy()

	userID := c.GetUint("user_id")
	fileHeader, err := c.FormFile("media")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "media is required"})
		return
	}

	contentType := strings.ToLower(strings.TrimSpace(fileHeader.Header.Get("Content-Type")))
	mediaType := ""
	switch contentType {
	case "image/jpeg", "image/png", "image/webp":
		if fileHeader.Size > 10*1024*1024 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "image size must be <= 10MB"})
			return
		}
		mediaType = "image"
	case "video/mp4", "video/webm", "video/quicktime":
		if fileHeader.Size > 50*1024*1024 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "video size must be <= 50MB"})
			return
		}
		mediaType = "video"
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported media type"})
		return
	}

	var activeCount int64
	if err := database.DB.Model(&models.Story{}).Where("user_id = ? AND expires_at > ?", userID, time.Now().UTC()).Count(&activeCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to validate story limit"})
		return
	}
	if activeCount >= 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "max 10 active stories allowed"})
		return
	}

	uploader, err := storage.NewService()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "storage is not configured"})
		return
	}
	mediaURL, err := uploader.UploadImage(fileHeader, "stories")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to upload story media"})
		return
	}

	now := time.Now().UTC()
	story := models.Story{
		UserID:    userID,
		MediaType: mediaType,
		MediaURL:  mediaURL,
		CreatedAt: now,
		ExpiresAt: now.Add(24 * time.Hour),
	}
	if err := database.DB.Create(&story).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create story"})
		return
	}

	c.JSON(http.StatusOK, StoryItemResponse{
		ID:        story.ID,
		MediaType: story.MediaType,
		MediaURL:  story.MediaURL,
		CreatedAt: story.CreatedAt,
		ExpiresAt: story.ExpiresAt,
	})
}

func DeleteMyStory(c *gin.Context) {
	userID := c.GetUint("user_id")
	storyID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid story id"})
		return
	}

	var story models.Story
	if err := database.DB.Where("id = ? AND user_id = ?", storyID, userID).First(&story).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "story not found"})
		return
	}

	uploader, err := storage.NewService()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "storage is not configured"})
		return
	}
	if err := uploader.DeleteFileByURL(story.MediaURL); err != nil {
		log.Printf("delete story storage failed story_id=%d: %v", story.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete story media"})
		return
	}

	if err := database.DB.Delete(&story).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete story"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "story deleted"})
}
