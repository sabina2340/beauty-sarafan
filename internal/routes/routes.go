package routes

import (
	advertisementRoutes "beauty-sarafan/internal/advertisements/routes"
	authRoutes "beauty-sarafan/internal/auth/routes"
	commonRoutes "beauty-sarafan/internal/common/routes"
	mediaRoutes "beauty-sarafan/internal/media/routes"
	"beauty-sarafan/internal/middleware"
	"beauty-sarafan/internal/models"
	moderationRoutes "beauty-sarafan/internal/moderation/routes"
	paymentRoutes "beauty-sarafan/internal/payments/routes"
	profileRoutes "beauty-sarafan/internal/profiles/routes"
	reviewRoutes "beauty-sarafan/internal/reviews/routes"
	supportRoutes "beauty-sarafan/internal/support/routes"
	tariffRoutes "beauty-sarafan/internal/tariffs/routes"
	userRoutes "beauty-sarafan/internal/users/routes"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"
)

func RegisterRoutes(r *gin.Engine, db *gorm.DB) {
	_ = db

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	authRoutes.Register(r)
	commonRoutes.RegisterPublic(r)
	profileRoutes.RegisterPublic(r)
	advertisementRoutes.RegisterPublic(r)
	reviewRoutes.RegisterPublic(r)
	supportRoutes.RegisterPublic(r)
	mediaRoutes.RegisterPublic(r)
	tariffRoutes.RegisterPublic(r)

	meGroup := r.Group("/me")
	meGroup.Use(middleware.AuthMiddleware())
	{
		profileRoutes.RegisterMe(meGroup)
		userRoutes.RegisterMe(meGroup)
		advertisementRoutes.RegisterMe(meGroup)
	}

	advertisementRoutes.RegisterProtected(r)
	paymentRoutes.RegisterProtected(r)

	adminGroup := r.Group("/admin")
	adminGroup.Use(middleware.AuthMiddleware(), middleware.RequireAnyRole(models.RoleAdmin, models.RoleModerator))
	{
		moderationRoutes.RegisterAdmin(adminGroup)
		profileRoutes.RegisterAdmin(adminGroup)
		userRoutes.RegisterAdmin(adminGroup)
		commonRoutes.RegisterAdmin(adminGroup)
		advertisementRoutes.RegisterAdmin(adminGroup)
		paymentRoutes.RegisterAdmin(adminGroup)
		mediaRoutes.RegisterAdmin(adminGroup)
		reviewRoutes.RegisterAdmin(adminGroup)
		supportRoutes.RegisterAdmin(adminGroup)
	}

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
}
