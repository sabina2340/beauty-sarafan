package routes

import (
	"beauty-sarafan/internal/handlers/admin"
	"beauty-sarafan/internal/handlers/ads"
	"beauty-sarafan/internal/handlers/auth"
	"beauty-sarafan/internal/handlers/categories"
	"beauty-sarafan/internal/handlers/me"
	publicHandlers "beauty-sarafan/internal/handlers/public"
	"beauty-sarafan/internal/middleware"
	"beauty-sarafan/internal/models"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"
)

func RegisterRoutes(r *gin.Engine, db *gorm.DB) {
	_ = db

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	authGroup := r.Group("/auth")
	{
		authGroup.POST("/register", auth.Register)
		authGroup.POST("/login", auth.Login)
		authGroup.GET("/me", middleware.AuthMiddleware(), auth.Me)
	}

	meGroup := r.Group("/me")
	meGroup.Use(middleware.AuthMiddleware())
	{
		meGroup.GET("/profile", me.GetProfile)
		meGroup.PUT("/profile", middleware.RequireRole(models.RoleUser), me.PutProfile)
	}

	r.GET("/categories", categories.List)

	r.GET("/masters", publicHandlers.ListMasters)
	r.GET("/masters/:id", publicHandlers.GetMaster)

	adminGroup := r.Group("/admin")
	adminGroup.Use(middleware.AuthMiddleware(), middleware.RequireAnyRole(models.RoleAdmin, models.RoleModerator))
	{
		adminGroup.GET("/ping", admin.Ping)
		adminGroup.GET("/masters", admin.ListMasters)
		adminGroup.PATCH("/users/:id/moderate", admin.ModerateUser)
		adminGroup.PATCH("/users/:id/approve", admin.ApproveUser)
		adminGroup.PATCH("/users/:id/reject", admin.RejectUser)
		adminGroup.POST("/categories", categories.Create)
	}

	adsGroup := r.Group("/ads")
	adsGroup.Use(middleware.AuthMiddleware(), middleware.RequireRole(models.RoleUser), middleware.EnsureApproved())
	{
		adsGroup.POST("", ads.Create)
	}

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
}
