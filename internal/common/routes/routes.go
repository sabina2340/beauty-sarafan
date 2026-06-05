package routes

import (
	"beauty-sarafan/internal/common/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterPublic(r *gin.Engine) {
	r.GET("/categories", handlers.List)
	r.GET("/category-groups", handlers.ListGroups)
}

func RegisterAdmin(adminGroup *gin.RouterGroup) {
	adminGroup.POST("/categories", handlers.Create)
}
