package routes

import (
	"beauty-sarafan/internal/handlers/admin"
	"beauty-sarafan/internal/handlers/ads"
	"beauty-sarafan/internal/handlers/auth"
	"beauty-sarafan/internal/handlers/categories"
	"beauty-sarafan/internal/handlers/equipment"
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
		authGroup.POST("/logout", middleware.AuthMiddleware(), auth.Logout)
		authGroup.GET("/me", middleware.AuthMiddleware(), auth.Me)
	}

	meGroup := r.Group("/me")
	meGroup.Use(middleware.AuthMiddleware())
	{
		meGroup.GET("/profile", me.GetProfile)
		meGroup.PUT("/profile", middleware.RequireRole(models.RoleUser), me.PutProfile)
		meGroup.PUT("/password", me.PutPassword)
		meGroup.PUT("/login", me.PutLogin)
		meGroup.POST("/consents/personal-data", me.PostPersonalDataConsent)

		meAds := meGroup.Group("/ads")
		meAds.Use(middleware.RequireRole(models.RoleUser), middleware.EnsureApproved())
		{
			meAds.GET("", ads.ListMine)
			meAds.GET("/:id", ads.GetMine)
			meAds.PUT("/:id", ads.UpdateMine)
			meAds.DELETE("/:id", ads.DeleteMine)
		}
	}

	r.GET("/categories", categories.List)
	r.GET("/category-groups", categories.ListGroups)
	r.GET("/masters", publicHandlers.ListMasters)
	r.GET("/masters/:id", publicHandlers.GetMaster)
	r.GET("/masters/:id/ads", ads.PublicByMaster)

	r.GET("/equipment", equipment.List)
	r.GET("/equipment/:id", equipment.Get)

	r.GET("/ads", ads.PublicList)
	r.GET("/hot-offers", ads.HotOffers)
	r.GET("/ads/active", ads.ActiveAds)
	r.GET("/tariffs", ads.TariffsList)
	r.GET("/advertisements/my", middleware.AuthMiddleware(), middleware.RequireRole(models.RoleUser), middleware.EnsureApproved(), ads.ListMine)
	r.GET("/advertisements/:id", middleware.AuthMiddleware(), middleware.RequireRole(models.RoleUser), middleware.EnsureApproved(), ads.GetMine)

	adsProtected := r.Group("/ads")
	adsProtected.Use(middleware.AuthMiddleware(), middleware.RequireRole(models.RoleUser), middleware.EnsureApproved())
	{
		adsProtected.POST("", ads.Create)
	}

	advertisementsProtected := r.Group("/advertisements")
	advertisementsProtected.Use(middleware.AuthMiddleware(), middleware.RequireRole(models.RoleUser), middleware.EnsureApproved())
	{
		advertisementsProtected.POST("", ads.CreateWithImages)
		advertisementsProtected.POST("/:id/select-tariff", ads.SelectTariff)
		advertisementsProtected.GET("/:id/payment", ads.GetPaymentByAd)
	}

	paymentsProtected := r.Group("/payments")
	paymentsProtected.Use(middleware.AuthMiddleware(), middleware.RequireRole(models.RoleUser), middleware.EnsureApproved())
	{
		paymentsProtected.POST("/:id/mark-paid", ads.MarkPaymentPaid)
	}

	adminGroup := r.Group("/admin")
	adminGroup.Use(middleware.AuthMiddleware(), middleware.RequireAnyRole(models.RoleAdmin, models.RoleModerator))
	{
		adminGroup.GET("/ping", admin.Ping)
		adminGroup.GET("/masters", admin.ListMasters)
		adminGroup.PATCH("/users/:id/moderate", admin.ModerateUser)
		adminGroup.PATCH("/users/:id/approve", admin.ApproveUser)
		adminGroup.PATCH("/users/:id/reject", admin.RejectUser)
		adminGroup.PATCH("/masters/:id/approve", admin.ApproveUser)
		adminGroup.PATCH("/masters/:id/reject", admin.RejectUser)

		adminGroup.POST("/categories", categories.Create)

		adminGroup.GET("/ads", ads.AdminList)
		adminGroup.GET("/ads/moderation", ads.AdminList)
		adminGroup.PUT("/ads/:id", ads.AdminUpdate)
		adminGroup.PATCH("/ads/:id/approve", ads.AdminApprove)
		adminGroup.PATCH("/ads/:id/reject", ads.AdminReject)
		adminGroup.GET("/payments/pending", ads.AdminPendingPayments)
		adminGroup.POST("/payments/:id/confirm", ads.AdminConfirmPayment)
		adminGroup.POST("/payments/:id/reject", ads.AdminRejectPayment)
	}

	r.Static("/uploads", "./uploads")

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
}
