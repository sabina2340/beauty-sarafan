package routes

import (
	"beauty-sarafan/internal/auth/handlers"
	"beauty-sarafan/internal/middleware"

	"github.com/gin-gonic/gin"
)

func Register(r *gin.Engine) {
	authGroup := r.Group("/auth")
	{
		authGroup.POST("/register", handlers.Register)
		authGroup.POST("/login", handlers.Login)
		authGroup.POST("/logout", middleware.AuthMiddleware(), handlers.Logout)
		authGroup.GET("/me", handlers.Me)
	}
}
