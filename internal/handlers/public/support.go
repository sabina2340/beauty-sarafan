package public

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"net/http"
	"net/mail"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	supportMessageMinLen = 10
	supportMessageMaxLen = 2000
)

var supportPhoneRegexp = regexp.MustCompile(`^\+?[0-9()\-\s]{7,20}$`)

type createSupportRequestPayload struct {
	Name    string `json:"name" binding:"required"`
	Contact string `json:"contact" binding:"required"`
	Message string `json:"message" binding:"required"`
}

func CreateSupportRequest(c *gin.Context) {
	var payload createSupportRequestPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	name := strings.TrimSpace(payload.Name)
	contact := strings.TrimSpace(payload.Contact)
	message := strings.TrimSpace(payload.Message)

	if name == "" || contact == "" || message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "all fields are required"})
		return
	}
	if len([]rune(message)) < supportMessageMinLen {
		c.JSON(http.StatusBadRequest, gin.H{"error": "message must be at least 10 characters"})
		return
	}
	if len([]rune(message)) > supportMessageMaxLen {
		c.JSON(http.StatusBadRequest, gin.H{"error": "message must be at most 2000 characters"})
		return
	}
	if !isValidSupportContact(contact) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "contact must be a valid email or phone number"})
		return
	}

	request := models.SupportRequest{
		Name:    name,
		Contact: contact,
		Message: message,
		Status:  models.SupportRequestStatusNew,
	}
	if err := database.DB.Create(&request).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save support request"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":      request.ID,
		"status":  request.Status,
		"message": "Ваше сообщение отправлено",
	})
}

func isValidSupportContact(contact string) bool {
	if strings.Contains(contact, "@") {
		_, err := mail.ParseAddress(contact)
		return err == nil
	}
	return supportPhoneRegexp.MatchString(contact)
}
