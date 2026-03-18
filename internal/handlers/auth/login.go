package auth

import (
	"beauty-sarafan/internal/database"
	jwtutil "beauty-sarafan/internal/jwt"
	"beauty-sarafan/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Login    string `json:"login" binding:"required,min=3,max=64"`
	Password string `json:"password" binding:"required,min=6"`
}

// Login godoc
// @Summary Логин пользователя
// @Description Выполняет вход и кладёт JWT в HttpOnly cookie access_token
// @Tags auth
// @Accept json
// @Produce json
// @Param data body LoginRequest true "Данные логина"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/login [post]
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data"})
		return
	}

	var user models.User
	if err := database.DB.Where("login = ?", req.Login).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid login or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid login or password"})
		return
	}

	token, expiresIn, err := jwtutil.GenerateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token generation failed"})
		return
	}

	maxAge := int(expiresIn)
	setAccessTokenCookie(c, token, maxAge)

	c.JSON(http.StatusOK, gin.H{
		"message": "ok",
		"role":    user.Role,
		"status":  user.Status,
	})
}
