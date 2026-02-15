package auth

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"net/http"
)

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// Register godoc
// @Summary Регистрация мастера
// @Description Создаёт пользователя с ролью master
// @Tags auth
// @Accept json
// @Produce json
// @Param data body RegisterRequest true "Данные регистрации"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Router /auth/register [post]
func Register(c *gin.Context) {
	var req RegisterRequest

	// 1. Проверяем входные данные
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request data",
		})
		return
	}

	// 2. Проверяем, существует ли пользователь
	var existing models.User
	if err := database.DB.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user already exists",
		})
		return
	}

	// 3. Хэшируем пароль
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "password hashing failed",
		})
		return
	}

	// 4. Создаём пользователя
	user := models.User{
		Email:    req.Email,
		Password: string(hashedPassword),
		Role:     "master",
		IsActive: true,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to create user",
		})
		return
	}

	// 5. Ответ
	c.JSON(http.StatusCreated, gin.H{
		"message": "registration successful",
		"user_id": user.ID,
	})
}
