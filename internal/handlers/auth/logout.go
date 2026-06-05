package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Logout(c *gin.Context) {
	clearAccessTokenCookie(c)
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}
