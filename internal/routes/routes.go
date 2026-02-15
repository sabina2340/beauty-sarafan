package routes

import (
	"beauty-sarafan/internal/handlers/auth"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"
)

func RegisterRoutes(r *gin.Engine, db *gorm.DB) {

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	authGroup := r.Group("/auth")
	{
		authGroup.POST("/register", auth.Register)
	}

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})
}
