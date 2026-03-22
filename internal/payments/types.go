package payments

import "encoding/json"

type TochkaCreatePaymentRequest struct {
	Data TochkaCreatePaymentRequestData `json:"Data"`
}

type TochkaCreatePaymentRequestData struct {
	CustomerCode    string   `json:"customerCode"`
	Amount          string   `json:"amount"`
	Purpose         string   `json:"purpose"`
	PaymentMode     []string `json:"paymentMode"`
	RedirectURL     string   `json:"redirectUrl,omitempty"`
	FailRedirectURL string   `json:"failRedirectUrl,omitempty"`
	MerchantID      string   `json:"merchantId,omitempty"`
	TTL             int      `json:"ttl,omitempty"`
}

type TochkaCreatePaymentResponse struct {
	Data TochkaPaymentOperation `json:"Data"`
}

type TochkaGetPaymentOperationResponse struct {
	Data TochkaPaymentOperation `json:"Data"`
}

type TochkaPaymentOperation struct {
	Purpose      string          `json:"purpose"`
	Status       string          `json:"status"`
	Amount       float64         `json:"amount"`
	OperationID  string          `json:"operationId"`
	PaymentLink  string          `json:"paymentLink,omitempty"`
	PaymentModes []string        `json:"paymentMode,omitempty"`
	RedirectURL  string          `json:"redirectUrl,omitempty"`
	ExpiresAtRaw string          `json:"ttlDate,omitempty"`
	RawData      json.RawMessage `json:"-"`
}

type TochkaAcquiringWebhook struct {
	WebhookType  string  `json:"webhookType"`
	CustomerCode string  `json:"customerCode"`
	OperationID  string  `json:"operationId"`
	Status       string  `json:"status"`
	Amount       float64 `json:"amount"`
	Purpose      string  `json:"purpose"`
	MerchantID   string  `json:"merchantId"`
}
