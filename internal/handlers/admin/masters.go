package admin

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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
// @Description Возвращает список мастер-профилей по статусу (по умолчанию pending)
// @Tags admin
// @Produce json
// @Param status query string false "Статус" default(pending)
// @Success 200 {array} MasterModerationItem
// @Router /admin/masters [get]
func ListMasters(c *gin.Context) {
	status := c.DefaultQuery("status", models.StatusPending)

	var rows []MasterModerationItem
	err := database.DB.Table("master_profiles mp").
		Select(`u.id as user_id, u.login, u.role, mp.status, mp.rejection_reason,
			mp.id as profile_id, mp.full_name, mp.city, mp.category_id,
			c.name as category_name, c.slug as category_slug`).
		Joins("JOIN users u ON u.id = mp.user_id").
		Joins("LEFT JOIN categories c ON c.id = mp.category_id").
		Where("mp.status = ?", status).
		Order("mp.id desc").
		Scan(&rows).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load masters"})
		return
	}

	c.JSON(http.StatusOK, rows)
}

func writeModerationLog(tx *gorm.DB, adminID uint, entityType string, entityID uint, action string, comment string) error {
	logItem := models.ModerationLog{
		EntityType: entityType,
		EntityID:   entityID,
		AdminID:    adminID,
		Action:     action,
		Comment:    comment,
	}
	return tx.Create(&logItem).Error
}

// ApproveUser godoc
// @Summary Одобрить мастера по профилю
// @Tags admin
// @Produce json
// @Param id path int true "User ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /admin/masters/{id}/approve [patch]
func ApproveUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	adminID := c.GetUint("user_id")

	err = database.DB.Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.First(&user, id).Error; err != nil {
			return err
		}

		var profile models.MasterProfile
		if err := tx.Where("user_id = ?", user.ID).First(&profile).Error; err != nil {
			return err
		}

		profile.Status = models.StatusApproved
		profile.RejectionReason = nil
		if err := tx.Save(&profile).Error; err != nil {
			return err
		}

		user.Status = models.StatusApproved
		user.Verified = true
		user.RejectionReason = nil
		if err := tx.Save(&user).Error; err != nil {
			return err
		}

		if err := writeModerationLog(tx, adminID, "profile", profile.ID, "approved", ""); err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "user or profile not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to approve master"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": id, "status": models.StatusApproved, "verified": true})
}

// RejectUser godoc
// @Summary Отклонить мастера по профилю
// @Tags admin
// @Accept json
// @Produce json
// @Param id path int true "User ID"
// @Param data body RejectUserRequest false "Причина"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /admin/masters/{id}/reject [patch]
func RejectUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	var req RejectUserRequest
	_ = c.ShouldBindJSON(&req)

	adminID := c.GetUint("user_id")

	err = database.DB.Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.First(&user, id).Error; err != nil {
			return err
		}

		var profile models.MasterProfile
		if err := tx.Where("user_id = ?", user.ID).First(&profile).Error; err != nil {
			return err
		}

		profile.Status = models.StatusRejected
		if req.Reason != "" {
			profile.RejectionReason = &req.Reason
		}
		if err := tx.Save(&profile).Error; err != nil {
			return err
		}

		user.Status = models.StatusRejected
		user.Verified = false
		if req.Reason != "" {
			user.RejectionReason = &req.Reason
		}
		if err := tx.Save(&user).Error; err != nil {
			return err
		}

		if err := writeModerationLog(tx, adminID, "profile", profile.ID, "rejected", req.Reason); err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "user or profile not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to reject master"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": id, "status": models.StatusRejected, "rejection_reason": req.Reason})
}
