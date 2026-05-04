package public

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type MasterCard struct {
	UserID           uint      `json:"user_id"`
	Login            string    `json:"login"`
	FullName         string    `json:"full_name"`
	Description      string    `json:"description"`
	ShortDescription string    `json:"short_description"`
	Services         string    `json:"services"`
	ShortServices    string    `json:"short_services"`
	Phone            string    `json:"phone"`
	City             string    `json:"city"`
	SocialLinks      string    `json:"social_links"`
	AvatarURL        string    `json:"avatar_url"`
	CategoryID       uint      `json:"category_id"`
	CategoryName     string    `json:"category_name"`
	CategorySlug     string    `json:"category_slug"`
	Verified         bool      `json:"verified"`
	HasActiveStories bool      `json:"has_active_stories"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type MasterWorkItem struct {
	ID        uint   `json:"id"`
	MediaType string `json:"media_type"`
	ImageURL  string `json:"image_url"`
	VideoURL  string `json:"video_url"`
	SortOrder int    `json:"sort_order"`
}

type MasterDetail struct {
	MasterCard
	WorkImages []MasterWorkItem `json:"work_images"`
}

func shortText(value string, limit int) string {
	value = strings.TrimSpace(value)
	if len([]rune(value)) <= limit {
		return value
	}
	runes := []rune(value)
	return string(runes[:limit]) + "…"
}

func ListMasters(c *gin.Context) {
	categoryID := c.Query("category_id")
	slug := c.Query("slug")
	if slug == "" {
		slug = c.Query("category")
	}
	city := c.Query("city")
	q := c.Query("q")
	service := c.Query("service")

	query := database.DB.Table("users u").
		Select(`u.id as user_id, u.login,
			mp.full_name, mp.description, mp.services, mp.phone, mp.city, mp.social_links, mp.avatar_url,
			mp.category_id, c.name as category_name, c.slug as category_slug,
			(u.status IN ('approved', 'pending')) as verified, mp.created_at, mp.updated_at`).
		Joins("JOIN master_profiles mp ON mp.user_id = u.id").
		Joins("LEFT JOIN categories c ON c.id = mp.category_id").
		Where("u.role = ? AND mp.status IN ?", models.RoleUser, []string{models.StatusApproved, models.StatusPending})

	if categoryID != "" {
		query = query.Where("mp.category_id = ?", categoryID)
	}
	if slug != "" {
		query = query.Where("c.slug = ?", slug)
	}
	if city != "" {
		query = query.Where("LOWER(mp.city) LIKE LOWER(?)", "%"+city+"%")
	}
	if q != "" {
		query = query.Where("LOWER(mp.full_name) LIKE LOWER(?)", "%"+q+"%")
	}
	if service != "" {
		query = query.Where("LOWER(mp.services) LIKE LOWER(?)", "%"+service+"%")
	}

	var masters []MasterCard
	if err := query.Order("u.id desc").Scan(&masters).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load masters"})
		return
	}
	for i := range masters {
		masters[i].ShortDescription = shortText(masters[i].Description, 120)
		masters[i].ShortServices = shortText(masters[i].Services, 80)
		var storiesCount int64
		_ = database.DB.Model(&models.Story{}).
			Where("user_id = ? AND expires_at > ?", masters[i].UserID, time.Now().UTC()).
			Count(&storiesCount).Error
		masters[i].HasActiveStories = storiesCount > 0
	}

	c.JSON(http.StatusOK, masters)
}

func GetMaster(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var master MasterCard
	err = database.DB.Table("users u").
		Select(`u.id as user_id, u.login,
			mp.full_name, mp.description, mp.services, mp.phone, mp.city, mp.social_links, mp.avatar_url,
			mp.category_id, c.name as category_name, c.slug as category_slug,
			(u.status IN ('approved', 'pending')) as verified, mp.created_at, mp.updated_at`).
		Joins("JOIN master_profiles mp ON mp.user_id = u.id").
		Joins("LEFT JOIN categories c ON c.id = mp.category_id").
		Where("u.id = ? AND u.role = ? AND mp.status IN ?", id, models.RoleUser, []string{models.StatusApproved, models.StatusPending}).
		Scan(&master).Error
	if err != nil || master.UserID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "master not found"})
		return
	}
	master.ShortDescription = shortText(master.Description, 120)
	master.ShortServices = shortText(master.Services, 80)
	var storiesCount int64
	_ = database.DB.Model(&models.Story{}).
		Where("user_id = ? AND expires_at > ?", master.UserID, time.Now().UTC()).
		Count(&storiesCount).Error
	master.HasActiveStories = storiesCount > 0

	var works []models.MasterWorkImage
	if err := database.DB.Table("master_work_images mwi").
		Joins("JOIN master_profiles mp ON mp.id = mwi.master_profile_id").
		Where("mp.user_id = ?", master.UserID).
		Order("mwi.sort_order asc, mwi.id asc").
		Find(&works).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load work images"})
		return
	}
	workItems := make([]MasterWorkItem, 0, len(works))
	for _, w := range works {
		mediaType := strings.TrimSpace(w.MediaType)
		if mediaType == "" {
			mediaType = "image"
		}
		workItems = append(workItems, MasterWorkItem{
			ID:        w.ID,
			MediaType: mediaType,
			ImageURL:  w.ImageURL,
			VideoURL:  w.VideoURL,
			SortOrder: w.SortOrder,
		})
	}

	c.JSON(http.StatusOK, MasterDetail{MasterCard: master, WorkImages: workItems})
}
