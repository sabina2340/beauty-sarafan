package admin

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type MasterModerationItem struct {
	UserID          uint    `json:"user_id"`
	Login           string  `json:"login"`
	Role            string  `json:"role"`
	Status          string  `json:"status"`
	RejectionReason *string `json:"rejection_reason"`
	ProfileID       uint    `json:"profile_id"`
	FullName        string  `json:"full_name"`
	City            string  `json:"city"`
	CategoryID      uint    `json:"category_id"`
	CategoryName    string  `json:"category_name"`
	CategorySlug    string  `json:"category_slug"`
}

type RejectUserRequest struct {
	Reason string `json:"reason"`
}

// ListMasters godoc
// @Summary Список мастеров для модерации
// @Description Возвращает список мастеров с профилями по статусу (по умолчанию pending)
// @Tags admin
// @Produce json
// @Param status query string false "Статус" default(pending)
// @Success 200 {array} MasterModerationItem
// @Router /admin/masters [get]
func ListMasters(c *gin.Context) {
	status := c.DefaultQuery("status", models.StatusPending)

	var rows []MasterModerationItem
	err := database.DB.Table("users u").
		Select(`u.id as user_id, u.login, u.role, u.status, u.rejection_reason,
			mp.id as profile_id, mp.full_name, mp.city, mp.category_id,
			c.name as category_name, c.slug as category_slug`).
		Joins("LEFT JOIN master_profiles mp ON mp.user_id = u.id").
		Joins("LEFT JOIN categories c ON c.id = mp.category_id").
		Where("u.role = ? AND u.status = ?", models.RoleUser, status).
		Order("u.id desc").
		Scan(&rows).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load masters"})
		return
	}

	c.JSON(http.StatusOK, rows)
}

// ApproveUser godoc
// @Summary Одобрить пользователя
// @Tags admin
// @Produce json
// @Param id path int true "User ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /admin/users/{id}/approve [patch]
func ApproveUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	user.Status = models.StatusApproved
	user.Verified = true
	user.RejectionReason = nil

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": user.ID, "status": user.Status, "verified": user.Verified})
}

// RejectUser godoc
// @Summary Отклонить пользователя
// @Tags admin
// @Accept json
// @Produce json
// @Param id path int true "User ID"
// @Param data body RejectUserRequest false "Причина"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /admin/users/{id}/reject [patch]
func RejectUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	var req RejectUserRequest
	_ = c.ShouldBindJSON(&req)

	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	user.Status = models.StatusRejected
	user.Verified = false
	if req.Reason != "" {
		user.RejectionReason = &req.Reason
	}

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": user.ID, "status": user.Status, "rejection_reason": user.RejectionReason})
}
