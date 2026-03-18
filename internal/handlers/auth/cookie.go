package auth

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

const accessTokenCookieName = "access_token"

func isCookieSecure() bool {
	if strings.EqualFold(os.Getenv("COOKIE_SECURE"), "true") {
		return true
	}

	env := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV")))
	return env == "prod" || env == "production"
}

func cookieDomain() string {
	return strings.TrimSpace(os.Getenv("AUTH_COOKIE_DOMAIN"))
}

func setAccessTokenCookie(c *gin.Context, token string, maxAge int) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(accessTokenCookieName, token, maxAge, "/", cookieDomain(), isCookieSecure(), true)
}

func clearAccessTokenCookie(c *gin.Context) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(accessTokenCookieName, "", -1, "/", cookieDomain(), isCookieSecure(), true)
}
