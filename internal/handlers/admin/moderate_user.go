package admin

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ModerateUserRequest struct {
	Role   string `json:"role" binding:"required,oneof=admin moderator user"`
	Status string `json:"status" binding:"required,oneof=approved rejected pending"`
}

// ModerateUser godoc
// @Summary Модерация пользователя
// @Description Обновляет роль и статус пользователя (admin/moderator)
// @Tags admin
// @Accept json
// @Produce json
// @Param id path int true "User ID"
// @Param data body ModerateUserRequest true "Новая роль и статус"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /admin/users/{id}/moderate [patch]
func ModerateUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	var req ModerateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	user.Role = req.Role
	user.Status = req.Status
	user.Verified = req.Status == models.StatusApproved

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":       user.ID,
		"login":    user.Login,
		"role":     user.Role,
		"status":   user.Status,
		"verified": user.Verified,
	})
}
