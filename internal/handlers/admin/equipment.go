package admin

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"beauty-sarafan/internal/storage"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

func ListEquipment(c *gin.Context) {
	var items []models.EquipmentItem
	if err := database.DB.Order("id desc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load equipment"})
		return
	}
	c.JSON(http.StatusOK, items)
}

func CreateEquipment(c *gin.Context) {
	uploader, err := storage.NewService()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "storage is not configured"})
		return
	}

	name := strings.TrimSpace(c.PostForm("name"))
	description := strings.TrimSpace(c.PostForm("description"))
	contact := strings.TrimSpace(c.PostForm("contact"))

	if description == "" || contact == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "description and contact are required"})
		return
	}

	if name == "" {
		name = "Оборудование"
	}

	imageHeader, _ := c.FormFile("image")
	if imageHeader == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "image is required"})
		return
	}

	imageURL, err := uploader.UploadImage(imageHeader, "equipment")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to upload image"})
		return
	}

	item := models.EquipmentItem{
		Name:        name,
		Description: description,
		Contact:     contact,
		ImageURL:    imageURL,
	}

	if err := database.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create equipment item"})
		return
	}

	c.JSON(http.StatusCreated, item)
}

func UpdateEquipment(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid equipment id"})
		return
	}

	var item models.EquipmentItem
	if err := database.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "equipment not found"})
		return
	}

	name := strings.TrimSpace(c.PostForm("name"))
	description := strings.TrimSpace(c.PostForm("description"))
	contact := strings.TrimSpace(c.PostForm("contact"))

	if name != "" {
		item.Name = name
	}
	if description != "" {
		item.Description = description
	}
	if contact != "" {
		item.Contact = contact
	}

	if imageHeader, _ := c.FormFile("image"); imageHeader != nil {
		uploader, uploadErr := storage.NewService()
		if uploadErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "storage is not configured"})
			return
		}
		imageURL, uploadErr := uploader.UploadImage(imageHeader, "equipment")
		if uploadErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to upload image"})
			return
		}
		item.ImageURL = imageURL
	}

	if err := database.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update equipment item"})
		return
	}

	c.JSON(http.StatusOK, item)
}

func DeleteEquipment(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid equipment id"})
		return
	}

	if err := database.DB.Delete(&models.EquipmentItem{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete equipment item"})
		return
	}

	c.Status(http.StatusNoContent)
}
