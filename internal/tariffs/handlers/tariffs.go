package handlers

import (
	advertisementHandlers "beauty-sarafan/internal/advertisements/handlers"

	"github.com/gin-gonic/gin"
)

func TariffsList(c *gin.Context) {
	advertisementHandlers.TariffsList(c)
}
