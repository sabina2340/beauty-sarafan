package routes

import (
	"beauty-sarafan/internal/tariffs/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterPublic(r *gin.Engine) {
	r.GET("/tariffs", handlers.TariffsList)
}
