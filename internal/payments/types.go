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
	Data TochkaGetPaymentOperationData `json:"Data"`
}

type TochkaGetPaymentOperationData struct {
	Operation []TochkaPaymentOperation `json:"Operation"`
}

type TochkaPaymentOrder struct {
	OrderID string `json:"orderId,omitempty"`
}

type TochkaPaymentOperation struct {
	Purpose       string               `json:"purpose"`
	Status        string               `json:"status"`
	Amount        float64              `json:"amount"`
	OperationID   string               `json:"operationId"`
	PaymentType   string               `json:"paymentType,omitempty"`
	PaymentID     string               `json:"paymentId,omitempty"`
	TransactionID string               `json:"transactionId,omitempty"`
	PaymentLink   string               `json:"paymentLink,omitempty"`
	PaymentLinkID string               `json:"paymentLinkId,omitempty"`
	PaymentModes  []string             `json:"paymentMode,omitempty"`
	RedirectURL   string               `json:"redirectUrl,omitempty"`
	ConsumerID    string               `json:"consumerId,omitempty"`
	CreatedAtRaw  string               `json:"createdAt,omitempty"`
	PaidAtRaw     string               `json:"paidAt,omitempty"`
	ExpiresAtRaw  string               `json:"ttlDate,omitempty"`
	Order         []TochkaPaymentOrder `json:"Order,omitempty"`
	RawData       json.RawMessage      `json:"-"`
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
