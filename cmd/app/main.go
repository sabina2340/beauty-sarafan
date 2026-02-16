package main

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/routes"

	_ "beauty-sarafan/docs"
	"github.com/gin-gonic/gin"
)

// @title Beauty Sarafan API
// @version 1.0
// @description API платформы Beauty Sarafan
// @host localhost:8080
// @BasePath /
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Введите JWT в формате: Bearer <token>
func main() {
	db := database.InitDB()

	r := gin.New()
	r.Use(gin.Logger())

	routes.RegisterRoutes(r, db)

	r.Run(":8080")
}
