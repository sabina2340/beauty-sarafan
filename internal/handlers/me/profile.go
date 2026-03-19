package me

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"beauty-sarafan/internal/storage"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ProfileUpsertRequest struct {
	CategoryID  uint
	CityID      uint
	CityName    string
	FullName    string
	Description string
	Services    string
	Phone       string
	SocialLinks string
}

type WorkImageResponse struct {
	ImageURL  string `json:"image_url"`
	SortOrder int    `json:"sort_order"`
}

type ProfileResponse struct {
	ID              uint                `json:"id"`
	UserID          uint                `json:"user_id"`
	CategoryID      uint                `json:"category_id"`
	CityID          uint                `json:"city_id"`
	FullName        string              `json:"full_name"`
	Description     string              `json:"description"`
	Services        string              `json:"services"`
	Phone           string              `json:"phone"`
	City            string              `json:"city"`
	SocialLinks     string              `json:"social_links"`
	AvatarURL       string              `json:"avatar_url"`
	Status          string              `json:"status"`
	RejectionReason *string             `json:"rejection_reason"`
	CreatedAt       time.Time           `json:"created_at"`
	UpdatedAt       time.Time           `json:"updated_at"`
	WorkImages      []WorkImageResponse `json:"work_images"`
}

func validateProfileUpsert(req *ProfileUpsertRequest) string {
	req.FullName = strings.TrimSpace(req.FullName)
	req.Description = strings.TrimSpace(req.Description)
	req.Services = strings.TrimSpace(req.Services)
	req.Phone = strings.TrimSpace(req.Phone)
	req.CityName = strings.TrimSpace(req.CityName)
	req.SocialLinks = strings.TrimSpace(req.SocialLinks)

	if req.CategoryID == 0 {
		return "category_id is required"
	}
	if req.FullName == "" {
		return "full_name is required"
	}
	if req.CityID == 0 && req.CityName == "" {
		return "city is required"
	}
	if req.Description == "" {
		return "description is required"
	}
	if req.Services == "" {
		return "services is required"
	}
	if req.Phone == "" && req.SocialLinks == "" {
		return "phone or social_links is required"
	}
	return ""
}

func hasPersonalDataConsent(userID uint) bool {
	var consent models.PersonalDataConsent
	err := database.DB.Where("user_id = ?", userID).First(&consent).Error
	return err == nil
}

func loadProfileResponse(profile models.MasterProfile) (ProfileResponse, error) {
	var works []models.MasterWorkImage
	err := database.DB.Where("master_profile_id = ?", profile.ID).Order("sort_order asc, id asc").Find(&works).Error
	resp := ProfileResponse{
		ID:              profile.ID,
		UserID:          profile.UserID,
		CategoryID:      profile.CategoryID,
		CityID:          profile.CityID,
		FullName:        profile.FullName,
		Description:     profile.Description,
		Services:        profile.Services,
		Phone:           profile.Phone,
		City:            profile.City,
		SocialLinks:     profile.SocialLinks,
		AvatarURL:       profile.AvatarURL,
		Status:          profile.Status,
		RejectionReason: profile.RejectionReason,
		CreatedAt:       profile.CreatedAt,
		UpdatedAt:       profile.UpdatedAt,
		WorkImages:      make([]WorkImageResponse, 0, len(works)),
	}
	for _, item := range works {
		resp.WorkImages = append(resp.WorkImages, WorkImageResponse{ImageURL: item.ImageURL, SortOrder: item.SortOrder})
	}
	return resp, err
}

func GetProfile(c *gin.Context) {
	userID := c.GetUint("user_id")

	var profile models.MasterProfile
	if err := database.DB.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusOK, nil)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load profile"})
		return
	}

	resp, err := loadProfileResponse(profile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load work images"})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func PutProfile(c *gin.Context) {
	userID := c.GetUint("user_id")
	if !hasPersonalDataConsent(userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "personal data consent is required"})
		return
	}

	categoryID, _ := strconv.ParseUint(c.PostForm("category_id"), 10, 64)
	cityID, _ := strconv.ParseUint(c.PostForm("city_id"), 10, 64)
	req := ProfileUpsertRequest{
		CategoryID:  uint(categoryID),
		CityID:      uint(cityID),
		CityName:    c.PostForm("city_name"),
		FullName:    c.PostForm("full_name"),
		Description: c.PostForm("description"),
		Services:    c.PostForm("services"),
		Phone:       c.PostForm("phone"),
		SocialLinks: c.PostForm("social_links"),
	}

	if validationError := validateProfileUpsert(&req); validationError != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": validationError})
		return
	}

	uploader, err := storage.NewService()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "storage is not configured"})
		return
	}
	avatarHeader, _ := c.FormFile("avatar")

	var profile models.MasterProfile
	if err := database.DB.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		profile = models.MasterProfile{UserID: userID}
	}

	city, err := database.EnsureCity(database.DB, req.CityID, req.CityName)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "city is required"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to resolve city"})
		return
	}

	if avatarHeader != nil {
		avatarURL, err := uploader.UploadImage(avatarHeader, "masters/avatar")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to upload avatar"})
			return
		}
		profile.AvatarURL = avatarURL
	}

	profile.CategoryID = req.CategoryID
	profile.CityID = city.ID
	profile.FullName = req.FullName
	profile.Description = req.Description
	profile.Services = req.Services
	profile.Phone = req.Phone
	profile.City = city.Name
	profile.SocialLinks = req.SocialLinks
	profile.Status = models.StatusPending
	profile.RejectionReason = nil

	if profile.ID == 0 {
		if err := database.DB.Create(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create profile"})
			return
		}
	} else {
		if err := database.DB.Save(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update profile"})
			return
		}
	}

	form, err := c.MultipartForm()
	if err == nil && form != nil {
		if files, ok := form.File["works[]"]; ok && len(files) > 0 {
			if err := database.DB.Where("master_profile_id = ?", profile.ID).Delete(&models.MasterWorkImage{}).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to clear old work images"})
				return
			}
			for i, fileHeader := range files {
				imageURL, uploadErr := uploader.UploadImage(fileHeader, "masters/works")
				if uploadErr != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to upload work image"})
					return
				}
				item := models.MasterWorkImage{MasterProfileID: profile.ID, ImageURL: imageURL, SortOrder: i}
				if createErr := database.DB.Create(&item).Error; createErr != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save work image"})
					return
				}
			}
		}
	}

	if err := database.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"status":           models.StatusPending,
		"verified":         false,
		"rejection_reason": nil,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user moderation status"})
		return
	}

	resp, err := loadProfileResponse(profile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load work images"})
		return
	}
	c.JSON(http.StatusOK, resp)
}
