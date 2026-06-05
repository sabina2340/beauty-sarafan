package routes

import (
	"beauty-sarafan/internal/advertisements/handlers"
	"beauty-sarafan/internal/middleware"
	"beauty-sarafan/internal/models"

	"github.com/gin-gonic/gin"
)

func RegisterPublic(r *gin.Engine) {
	r.GET("/masters/:id/ads", handlers.PublicByMaster)
	r.GET("/ads", handlers.PublicList)
	r.GET("/hot-offers", handlers.HotOffers)
	r.GET("/ads/active", handlers.ActiveAds)
}

func RegisterMe(meGroup *gin.RouterGroup) {
	meAds := meGroup.Group("/ads")
	meAds.Use(middleware.RequireRole(models.RoleUser), middleware.EnsureApproved())
	{
		meAds.GET("", handlers.ListMine)
		meAds.GET("/:id", handlers.GetMine)
		meAds.PUT("/:id", handlers.UpdateMine)
		meAds.DELETE("/:id", handlers.DeleteMine)
	}
}

func RegisterProtected(r *gin.Engine) {
	r.GET("/advertisements/my", middleware.AuthMiddleware(), middleware.RequireRole(models.RoleUser), middleware.EnsureApproved(), handlers.ListMine)
	r.GET("/advertisements/:id", middleware.AuthMiddleware(), middleware.RequireRole(models.RoleUser), middleware.EnsureApproved(), handlers.GetMine)

	adsProtected := r.Group("/ads")
	adsProtected.Use(middleware.AuthMiddleware(), middleware.RequireRole(models.RoleUser), middleware.EnsureApproved())
	{
		adsProtected.POST("", handlers.Create)
	}

	advertisementsProtected := r.Group("/advertisements")
	advertisementsProtected.Use(middleware.AuthMiddleware(), middleware.RequireRole(models.RoleUser), middleware.EnsureApproved())
	{
		advertisementsProtected.POST("", handlers.CreateWithImages)
		advertisementsProtected.POST("/:id/select-tariff", handlers.SelectTariff)
	}
}

func RegisterAdmin(adminGroup *gin.RouterGroup) {
	adminGroup.GET("/ads", handlers.AdminList)
	adminGroup.GET("/ads/moderation", handlers.AdminList)
	adminGroup.PUT("/ads/:id", handlers.AdminUpdate)
	adminGroup.PATCH("/ads/:id/approve", handlers.AdminApprove)
	adminGroup.PATCH("/ads/:id/reject", handlers.AdminReject)
}
