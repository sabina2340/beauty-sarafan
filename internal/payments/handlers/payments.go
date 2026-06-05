package handlers

import (
	advertisementHandlers "beauty-sarafan/internal/advertisements/handlers"

	"github.com/gin-gonic/gin"
)

func GetPaymentByAd(c *gin.Context) {
	advertisementHandlers.GetPaymentByAd(c)
}

func MarkPaymentPaid(c *gin.Context) {
	advertisementHandlers.MarkPaymentPaid(c)
}

func AdminPendingPayments(c *gin.Context) {
	advertisementHandlers.AdminPendingPayments(c)
}

func AdminConfirmPayment(c *gin.Context) {
	advertisementHandlers.AdminConfirmPayment(c)
}

func AdminRejectPayment(c *gin.Context) {
	advertisementHandlers.AdminRejectPayment(c)
}
