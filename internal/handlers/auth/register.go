package auth

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	Login    string `json:"login" binding:"required,min=3,max=64"`
	Password string `json:"password" binding:"required,min=6"`
}

// Register godoc
// @Summary Регистрация пользователя
// @Description Создаёт пользователя с ролью user и статусом pending
// @Tags auth
// @Accept json
// @Produce json
// @Param data body RegisterRequest true "Данные регистрации"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/register [post]
func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data"})
		return
	}

	var existing models.User
	if err := database.DB.Where("login = ?", req.Login).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user already exists"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "password hashing failed"})
		return
	}

	user := models.User{
		Login:        req.Login,
		PasswordHash: string(hashedPassword),
		Role:         models.RoleUser,
		Status:       models.StatusPending,
		Verified:     false,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "registration successful, profile is pending moderation",
		"user_id": user.ID,
		"status":  user.Status,
	})
}
