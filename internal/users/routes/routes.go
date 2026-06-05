package routes

import (
	"beauty-sarafan/internal/users/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterMe(meGroup *gin.RouterGroup) {
	meGroup.PUT("/password", handlers.PutPassword)
	meGroup.PUT("/login", handlers.PutLogin)
	meGroup.GET("/consents/personal-data", handlers.GetPersonalDataConsent)
	meGroup.POST("/consents/personal-data", handlers.PostPersonalDataConsent)
}

func RegisterAdmin(adminGroup *gin.RouterGroup) {
	adminGroup.PATCH("/users/:id/moderate", handlers.ModerateUser)
}
