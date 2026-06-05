package routes

import (
	"beauty-sarafan/internal/middleware"
	"beauty-sarafan/internal/models"
	profileHandlers "beauty-sarafan/internal/profiles/handlers"
	adminHandlers "beauty-sarafan/internal/profiles/handlers/admin"
	publicHandlers "beauty-sarafan/internal/profiles/handlers/public"

	"github.com/gin-gonic/gin"
)

func RegisterPublic(r *gin.Engine) {
	r.GET("/masters", publicHandlers.ListMasters)
	r.GET("/masters/:id", publicHandlers.GetMaster)
}

func RegisterMe(meGroup *gin.RouterGroup) {
	meGroup.GET("/profile", profileHandlers.GetProfile)
	meGroup.PUT("/profile", middleware.RequireRole(models.RoleUser), profileHandlers.PutProfile)
}

func RegisterAdmin(adminGroup *gin.RouterGroup) {
	adminGroup.GET("/masters", adminHandlers.ListMasters)
	adminGroup.PATCH("/users/:id/approve", adminHandlers.ApproveUser)
	adminGroup.PATCH("/users/:id/reject", adminHandlers.RejectUser)
	adminGroup.PATCH("/masters/:id/approve", adminHandlers.ApproveUser)
	adminGroup.PATCH("/masters/:id/reject", adminHandlers.RejectUser)
}
