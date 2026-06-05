package routes

import (
	"beauty-sarafan/internal/middleware"
	"beauty-sarafan/internal/models"
	"beauty-sarafan/internal/payments/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterProtected(r *gin.Engine) {
	advertisementsProtected := r.Group("/advertisements")
	advertisementsProtected.Use(middleware.AuthMiddleware(), middleware.RequireRole(models.RoleUser), middleware.EnsureApproved())
	{
		advertisementsProtected.GET("/:id/payment", handlers.GetPaymentByAd)
	}

	paymentsProtected := r.Group("/payments")
	paymentsProtected.Use(middleware.AuthMiddleware(), middleware.RequireRole(models.RoleUser), middleware.EnsureApproved())
	{
		paymentsProtected.POST("/:id/mark-paid", handlers.MarkPaymentPaid)
	}
}

func RegisterAdmin(adminGroup *gin.RouterGroup) {
	adminGroup.GET("/payments/pending", handlers.AdminPendingPayments)
	adminGroup.POST("/payments/:id/confirm", handlers.AdminConfirmPayment)
	adminGroup.POST("/payments/:id/reject", handlers.AdminRejectPayment)
}
