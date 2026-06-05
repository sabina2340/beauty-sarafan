package routes

import (
	"beauty-sarafan/internal/media/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterPublic(r *gin.Engine) {
	r.GET("/equipment", handlers.List)
	r.GET("/equipment/:id", handlers.Get)
}

func RegisterAdmin(adminGroup *gin.RouterGroup) {
	adminGroup.GET("/equipment", handlers.ListEquipment)
	adminGroup.POST("/equipment", handlers.CreateEquipment)
	adminGroup.PUT("/equipment/:id", handlers.UpdateEquipment)
	adminGroup.DELETE("/equipment/:id", handlers.DeleteEquipment)
}
