package admin

import (
	"beauty-sarafan/internal/database"
	"beauty-sarafan/internal/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type UserStatsResponse struct {
	TotalUsers     int64 `json:"total_users"`
	NewUsers7d     int64 `json:"new_users_7d"`
	NewUsers30d    int64 `json:"new_users_30d"`
	ActiveUsers7d  int64 `json:"active_users_7d"`
	ActiveUsers30d int64 `json:"active_users_30d"`
}

func GetUserStats(c *gin.Context) {
	now := time.Now().UTC()
	sevenDaysAgo := now.AddDate(0, 0, -7)
	thirtyDaysAgo := now.AddDate(0, 0, -30)

	resp := UserStatsResponse{}
	query := database.DB.Model(&models.User{})

	if err := query.Count(&resp.TotalUsers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load total users"})
		return
	}
	if err := query.Where("created_at >= ?", sevenDaysAgo).Count(&resp.NewUsers7d).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load new users 7d"})
		return
	}
	if err := query.Where("created_at >= ?", thirtyDaysAgo).Count(&resp.NewUsers30d).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load new users 30d"})
		return
	}
	if err := query.Where("last_login_at >= ?", sevenDaysAgo).Count(&resp.ActiveUsers7d).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load active users 7d"})
		return
	}
	if err := query.Where("last_login_at >= ?", thirtyDaysAgo).Count(&resp.ActiveUsers30d).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load active users 30d"})
		return
	}

	c.JSON(http.StatusOK, resp)
}
