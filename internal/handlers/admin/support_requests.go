package admin

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type adminSupportRequestItem struct {
	ID        uint                        `json:"id"`
	Name      string                      `json:"name"`
	Contact   string                      `json:"contact"`
	Message   string                      `json:"message"`
	Status    models.SupportRequestStatus `json:"status"`
	CreatedAt time.Time                   `json:"created_at"`
	UpdatedAt time.Time                   `json:"updated_at"`
}

type updateSupportRequestPayload struct {
	Status models.SupportRequestStatus `json:"status" binding:"required,oneof=new in_progress closed"`
}

func ListSupportRequests(c *gin.Context) {
	status := strings.TrimSpace(c.Query("status"))
	query := database.DB.Model(&models.SupportRequest{})
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var items []adminSupportRequestItem
	if err := query.Order("created_at desc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load support requests"})
		return
	}
	c.JSON(http.StatusOK, items)
}

func GetSupportRequest(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid support request id"})
		return
	}

	var item adminSupportRequestItem
	if err := database.DB.Model(&models.SupportRequest{}).Where("id = ?", id).First(&item).Error; err != nil || item.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "support request not found"})
		return
	}
	c.JSON(http.StatusOK, item)
}

func UpdateSupportRequest(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid support request id"})
		return
	}

	var payload updateSupportRequestPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	res := database.DB.Model(&models.SupportRequest{}).Where("id = ?", id).Update("status", payload.Status)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update support request"})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "support request not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "support request updated"})
}

func DeleteSupportRequest(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid support request id"})
		return
	}

	res := database.DB.Delete(&models.SupportRequest{}, id)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete support request"})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "support request not found"})
		return
	}
	c.Status(http.StatusNoContent)
}
