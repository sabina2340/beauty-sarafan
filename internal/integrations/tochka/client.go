package tochka

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

type Client struct {
	apiBaseURL      string
	jwtToken        string
	customerCode    string
	paymentMode     string
	redirectBaseURL string
	httpClient      *http.Client
}

type CreatePaymentLinkRequest struct {
	Amount          int
	Purpose         string
	RedirectURL     string
	FailRedirectURL string
	PaymentLinkID   string
}

type PaymentLinkResponse struct {
	OperationID string
	PaymentLink string
	Status      string
}

type OperationInfo struct {
	OperationID string
	PaymentLink string
	Status      string
}

type apiOperation struct {
	Amount          int      `json:"amount,omitempty"`
	OperationID     string   `json:"operationId,omitempty"`
	PaymentLink     string   `json:"paymentLink,omitempty"`
	PaymentLinkID   string   `json:"paymentLinkId,omitempty"`
	Status          string   `json:"status,omitempty"`
	Purpose         string   `json:"purpose,omitempty"`
	PaymentMode     []string `json:"paymentMode,omitempty"`
	RedirectURL     string   `json:"redirectUrl,omitempty"`
	FailRedirectURL string   `json:"failRedirectUrl,omitempty"`
}

type createPaymentOperationRequest struct {
	Data struct {
		CustomerCode string         `json:"customerCode"`
		Operation    []apiOperation `json:"operation"`
	} `json:"Data"`
}

type operationEnvelope struct {
	Data struct {
		Operation []apiOperation `json:"operation"`
	} `json:"Data"`
}

type apiErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

func NewClientFromEnv() (*Client, error) {
	apiBaseURL := strings.TrimSpace(os.Getenv("TOCHKA_API_BASE_URL"))
	jwtToken := strings.TrimSpace(os.Getenv("TOCHKA_JWT_TOKEN"))
	customerCode := strings.TrimSpace(os.Getenv("TOCHKA_CUSTOMER_CODE"))
	paymentMode := strings.TrimSpace(os.Getenv("TOCHKA_PAYMENT_MODE"))
	redirectBaseURL := strings.TrimSpace(os.Getenv("TOCHKA_REDIRECT_BASE_URL"))

	if apiBaseURL == "" {
		return nil, errors.New("required environment variable TOCHKA_API_BASE_URL is not set")
	}
	if jwtToken == "" {
		return nil, errors.New("required environment variable TOCHKA_JWT_TOKEN is not set")
	}
	if customerCode == "" {
		return nil, errors.New("required environment variable TOCHKA_CUSTOMER_CODE is not set")
	}
	if paymentMode == "" {
		return nil, errors.New("required environment variable TOCHKA_PAYMENT_MODE is not set")
	}
	if redirectBaseURL == "" {
		return nil, errors.New("required environment variable TOCHKA_REDIRECT_BASE_URL is not set")
	}

	return &Client{
		apiBaseURL:      strings.TrimRight(apiBaseURL, "/"),
		jwtToken:        jwtToken,
		customerCode:    customerCode,
		paymentMode:     paymentMode,
		redirectBaseURL: strings.TrimRight(redirectBaseURL, "/"),
		httpClient: &http.Client{
			Timeout: 20 * time.Second,
		},
	}, nil
}

func (c *Client) BuildRedirectURL(path string) string {
	path = strings.TrimSpace(path)
	if path == "" {
		return c.redirectBaseURL
	}
	if strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://") {
		return path
	}
	if strings.HasPrefix(path, "/") {
		return c.redirectBaseURL + path
	}
	return c.redirectBaseURL + "/" + path
}

func (c *Client) CreatePaymentLink(req CreatePaymentLinkRequest) (*PaymentLinkResponse, error) {
	if req.Amount <= 0 {
		return nil, errors.New("invalid payment amount")
	}
	if strings.TrimSpace(req.Purpose) == "" {
		return nil, errors.New("payment purpose is required")
	}
	if strings.TrimSpace(req.RedirectURL) == "" {
		return nil, errors.New("redirect URL is required")
	}

	var payload createPaymentOperationRequest
	payload.Data.CustomerCode = c.customerCode
	payload.Data.Operation = []apiOperation{{
		Amount:          req.Amount,
		Purpose:         req.Purpose,
		PaymentMode:     []string{c.paymentMode},
		RedirectURL:     req.RedirectURL,
		FailRedirectURL: req.FailRedirectURL,
		PaymentLinkID:   req.PaymentLinkID,
	}}

	responseBody, err := c.doJSONRequest(http.MethodPost, "/acquiring/v1.0/payments", payload)
	if err != nil {
		return nil, err
	}

	operation, err := firstOperation(responseBody)
	if err != nil {
		return nil, err
	}

	return &PaymentLinkResponse{
		OperationID: operation.OperationID,
		PaymentLink: operation.PaymentLink,
		Status:      operation.Status,
	}, nil
}

func (c *Client) GetOperationInfo(operationID string) (*OperationInfo, error) {
	operationID = strings.TrimSpace(operationID)
	if operationID == "" {
		return nil, errors.New("operation id is required")
	}

	query := url.Values{}
	query.Set("customerCode", c.customerCode)
	responseBody, err := c.doJSONRequest(http.MethodGet, "/acquiring/v1.0/payments/"+url.PathEscape(operationID)+"?"+query.Encode(), nil)
	if err != nil {
		return nil, err
	}

	operation, err := firstOperation(responseBody)
	if err != nil {
		return nil, err
	}

	return &OperationInfo{
		OperationID: operation.OperationID,
		PaymentLink: operation.PaymentLink,
		Status:      operation.Status,
	}, nil
}

func (c *Client) doJSONRequest(method, requestPath string, payload any) (map[string]any, error) {
	var body io.Reader
	if payload != nil {
		encoded, err := json.Marshal(payload)
		if err != nil {
			return nil, errors.New("failed to encode Tochka request")
		}
		body = bytes.NewReader(encoded)
	}

	req, err := http.NewRequest(method, c.apiBaseURL+requestPath, body)
	if err != nil {
		return nil, errors.New("failed to create Tochka request")
	}
	req.Header.Set("Authorization", "Bearer "+c.jwtToken)
	req.Header.Set("Accept", "application/json")
	if payload != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, errors.New("failed to reach Tochka payment API")
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, errors.New("failed to read Tochka response")
	}

	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
		return nil, errors.New("Tochka authorization failed, check API token permissions")
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var apiErr apiErrorResponse
		if json.Unmarshal(bodyBytes, &apiErr) == nil {
			msg := strings.TrimSpace(apiErr.Error)
			if msg == "" {
				msg = strings.TrimSpace(apiErr.Message)
			}
			if msg != "" {
				return nil, fmt.Errorf("Tochka API error: %s", msg)
			}
		}
		return nil, fmt.Errorf("Tochka API error: status %d", resp.StatusCode)
	}

	var generic map[string]any
	if err := json.Unmarshal(bodyBytes, &generic); err != nil {
		return nil, errors.New("failed to decode Tochka response")
	}
	return generic, nil
}

func firstOperation(payload map[string]any) (*apiOperation, error) {
	encoded, err := json.Marshal(payload)
	if err != nil {
		return nil, errors.New("failed to parse Tochka response")
	}

	var envelope operationEnvelope
	if err := json.Unmarshal(encoded, &envelope); err != nil {
		return nil, errors.New("failed to parse Tochka operation response")
	}
	if len(envelope.Data.Operation) > 0 {
		operation := envelope.Data.Operation[0]
		if operation.OperationID == "" {
			operation.OperationID = readString(payload, "operationId")
		}
		if operation.PaymentLink == "" {
			operation.PaymentLink = readString(payload, "paymentLink")
		}
		if operation.Status == "" {
			operation.Status = readString(payload, "status")
		}
		return &operation, nil
	}

	operation := &apiOperation{
		OperationID: readString(payload, "operationId"),
		PaymentLink: readString(payload, "paymentLink"),
		Status:      readString(payload, "status"),
	}
	if operation.OperationID == "" && operation.PaymentLink == "" && operation.Status == "" {
		return nil, errors.New("Tochka response does not contain operation data")
	}
	return operation, nil
}

func readString(value any, target string) string {
	switch v := value.(type) {
	case map[string]any:
		for key, nested := range v {
			if strings.EqualFold(key, target) {
				if str, ok := nested.(string); ok {
					return str
				}
			}
			if found := readString(nested, target); found != "" {
				return found
			}
		}
	case []any:
		for _, item := range v {
			if found := readString(item, target); found != "" {
				return found
			}
		}
	}
	return ""
}
