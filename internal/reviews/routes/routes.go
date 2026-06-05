package routes

import (
	"beauty-sarafan/internal/reviews/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterPublic(r *gin.Engine) {
	r.GET("/masters/:id/reviews", handlers.ListApprovedReviews)
	r.POST("/masters/:id/reviews", handlers.CreateReview)
}

func RegisterAdmin(adminGroup *gin.RouterGroup) {
	adminGroup.GET("/reviews", handlers.ListReviews)
	adminGroup.GET("/reviews/:id", handlers.GetReview)
	adminGroup.PATCH("/reviews/:id/moderate", handlers.ModerateReview)
	adminGroup.DELETE("/reviews/:id", handlers.DeleteReview)
}
