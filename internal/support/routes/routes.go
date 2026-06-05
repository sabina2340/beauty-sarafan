package routes

import (
	"beauty-sarafan/internal/support/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterPublic(r *gin.Engine) {
	r.POST("/support-requests", handlers.CreateSupportRequest)
}

func RegisterAdmin(adminGroup *gin.RouterGroup) {
	adminGroup.GET("/support-requests", handlers.ListSupportRequests)
	adminGroup.GET("/support-requests/:id", handlers.GetSupportRequest)
	adminGroup.PATCH("/support-requests/:id", handlers.UpdateSupportRequest)
	adminGroup.DELETE("/support-requests/:id", handlers.DeleteSupportRequest)
}
