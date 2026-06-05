package routes

import (
	"beauty-sarafan/internal/moderation/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterAdmin(adminGroup *gin.RouterGroup) {
	adminGroup.GET("/ping", handlers.Ping)
}
