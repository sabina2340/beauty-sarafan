package me

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type ChangePasswordRequest struct {
	NewPassword        string `json:"new_password" binding:"required"`
	ConfirmNewPassword string `json:"confirm_new_password" binding:"required"`
}

type ChangeLoginRequest struct {
	Login string `json:"login" binding:"required"`
}

func PutPassword(c *gin.Context) {
	userID := c.GetUint("user_id")
	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data"})
		return
	}

	req.NewPassword = strings.TrimSpace(req.NewPassword)
	req.ConfirmNewPassword = strings.TrimSpace(req.ConfirmNewPassword)

	if req.NewPassword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "new password is required"})
		return
	}
	if len([]rune(req.NewPassword)) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "new password must be at least 8 characters"})
		return
	}
	if req.NewPassword != req.ConfirmNewPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "new password and confirmation do not match"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.NewPassword)); err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "new password must differ from current password"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	if err := database.DB.Model(&user).Update("password_hash", string(hash)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password updated"})
}

func PutLogin(c *gin.Context) {
	userID := c.GetUint("user_id")
	var req ChangeLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data"})
		return
	}

	login := strings.TrimSpace(req.Login)
	if login == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "login is required"})
		return
	}

	var count int64
	if err := database.DB.Model(&models.User{}).Where("login = ? AND id <> ?", login, userID).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check login uniqueness"})
		return
	}
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "login already exists"})
		return
	}

	if err := database.DB.Model(&models.User{}).Where("id = ?", userID).Update("login", login).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update login"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "login updated", "login": login})
}

func PostPersonalDataConsent(c *gin.Context) {
	userID := c.GetUint("user_id")

	var existing models.PersonalDataConsent
	if err := database.DB.Where("user_id = ?", userID).First(&existing).Error; err == nil {
		c.JSON(http.StatusOK, gin.H{"message": "consent already accepted", "accepted_at": existing.AcceptedAt})
		return
	}

	consent := models.PersonalDataConsent{
		UserID:     userID,
		IPAddress:  c.ClientIP(),
		UserAgent:  c.GetHeader("User-Agent"),
		AcceptedAt: time.Now(),
	}
	if err := database.DB.Create(&consent).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save consent"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "consent accepted", "accepted_at": consent.AcceptedAt})
}

func GetPersonalDataConsent(c *gin.Context) {
	userID := c.GetUint("user_id")

	var consent models.PersonalDataConsent
	if err := database.DB.Where("user_id = ?", userID).First(&consent).Error; err == nil {
		c.JSON(http.StatusOK, gin.H{"accepted": true, "accepted_at": consent.AcceptedAt})
		return
	}

	c.JSON(http.StatusOK, gin.H{"accepted": false})
}
