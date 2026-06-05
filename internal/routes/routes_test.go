package routes

import (
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRegisterRoutesKeepsPublicContracts(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	RegisterRoutes(r, nil)

	actual := make(map[string]bool)
	for _, route := range r.Routes() {
		actual[route.Method+" "+route.Path] = true
	}

	expected := []string{
		"GET /swagger/*any",
		"POST /auth/register",
		"POST /auth/login",
		"POST /auth/logout",
		"GET /auth/me",
		"GET /me/profile",
		"PUT /me/profile",
		"PUT /me/password",
		"PUT /me/login",
		"GET /me/consents/personal-data",
		"POST /me/consents/personal-data",
		"GET /me/ads",
		"GET /me/ads/:id",
		"PUT /me/ads/:id",
		"DELETE /me/ads/:id",
		"GET /categories",
		"GET /category-groups",
		"GET /masters",
		"GET /masters/:id",
		"GET /masters/:id/ads",
		"GET /masters/:id/reviews",
		"POST /masters/:id/reviews",
		"POST /support-requests",
		"GET /equipment",
		"GET /equipment/:id",
		"GET /ads",
		"GET /hot-offers",
		"GET /ads/active",
		"GET /tariffs",
		"GET /advertisements/my",
		"GET /advertisements/:id",
		"POST /ads",
		"POST /advertisements",
		"POST /advertisements/:id/select-tariff",
		"GET /advertisements/:id/payment",
		"POST /payments/:id/mark-paid",
		"GET /admin/ping",
		"GET /admin/masters",
		"PATCH /admin/users/:id/moderate",
		"PATCH /admin/users/:id/approve",
		"PATCH /admin/users/:id/reject",
		"PATCH /admin/masters/:id/approve",
		"PATCH /admin/masters/:id/reject",
		"POST /admin/categories",
		"GET /admin/ads",
		"GET /admin/ads/moderation",
		"PUT /admin/ads/:id",
		"PATCH /admin/ads/:id/approve",
		"PATCH /admin/ads/:id/reject",
		"GET /admin/payments/pending",
		"POST /admin/payments/:id/confirm",
		"POST /admin/payments/:id/reject",
		"GET /admin/equipment",
		"POST /admin/equipment",
		"PUT /admin/equipment/:id",
		"DELETE /admin/equipment/:id",
		"GET /admin/reviews",
		"GET /admin/reviews/:id",
		"PATCH /admin/reviews/:id/moderate",
		"DELETE /admin/reviews/:id",
		"GET /admin/support-requests",
		"GET /admin/support-requests/:id",
		"PATCH /admin/support-requests/:id",
		"DELETE /admin/support-requests/:id",
		"GET /",
	}

	for _, route := range expected {
		if !actual[route] {
			t.Fatalf("expected route %s to be registered", route)
		}
	}

	if len(actual) != len(expected) {
		t.Fatalf("registered route count changed: got %d want %d", len(actual), len(expected))
	}
}
