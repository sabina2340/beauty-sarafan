package payments

import (
	"bytes"
	"context"
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	defaultCreatePaymentPath = "/acquiring/v1.0/payments"
)

type Config struct {
	BaseURL             string
	Token               string
	CustomerCode        string
	MerchantID          string
	RedirectURL         string
	FailRedirectURL     string
	TTLMinutes          int
	PublicAppURL        string
	WebhookPublicKeyPEM string
	CreatePaymentPath   string
}

func LoadConfigFromEnv() Config {
	ttl := 10080
	if rawTTL := strings.TrimSpace(os.Getenv("TOCHKA_PAYMENT_TTL")); rawTTL != "" {
		if parsed, err := strconv.Atoi(rawTTL); err == nil && parsed > 0 {
			ttl = parsed
		}
	}

	createPath := strings.TrimSpace(os.Getenv("TOCHKA_CREATE_PAYMENT_PATH"))
	if createPath == "" {
		createPath = defaultCreatePaymentPath
	}

	return Config{
		BaseURL:             strings.TrimRight(strings.TrimSpace(os.Getenv("TOCHKA_API_BASE_URL")), "/"),
		Token:               strings.TrimSpace(os.Getenv("TOCHKA_API_TOKEN")),
		CustomerCode:        strings.TrimSpace(os.Getenv("TOCHKA_CUSTOMER_CODE")),
		MerchantID:          strings.TrimSpace(os.Getenv("TOCHKA_MERCHANT_ID")),
		RedirectURL:         strings.TrimSpace(os.Getenv("TOCHKA_PAYMENT_REDIRECT_URL")),
		FailRedirectURL:     strings.TrimSpace(os.Getenv("TOCHKA_PAYMENT_FAIL_REDIRECT_URL")),
		TTLMinutes:          ttl,
		PublicAppURL:        strings.TrimSpace(os.Getenv("APP_PUBLIC_URL")),
		WebhookPublicKeyPEM: strings.TrimSpace(os.Getenv("TOCHKA_WEBHOOK_PUBLIC_KEY")),
		CreatePaymentPath:   createPath,
	}
}

func (c Config) Validate() error {
	missing := make([]string, 0)
	if c.BaseURL == "" {
		missing = append(missing, "TOCHKA_API_BASE_URL")
	}
	if c.Token == "" {
		missing = append(missing, "TOCHKA_API_TOKEN")
	}
	if c.CustomerCode == "" {
		missing = append(missing, "TOCHKA_CUSTOMER_CODE")
	}
	if c.RedirectURL == "" {
		missing = append(missing, "TOCHKA_PAYMENT_REDIRECT_URL")
	}
	if len(missing) > 0 {
		return fmt.Errorf("missing Tochka payment config: %s", strings.Join(missing, ", "))
	}
	return nil
}

type Client struct {
	httpClient *http.Client
	config     Config
}

func NewClient(config Config) *Client {
	return &Client{
		httpClient: &http.Client{Timeout: 20 * time.Second},
		config:     config,
	}
}

func (c *Client) CreatePaymentOperation(ctx context.Context, request TochkaCreatePaymentRequest) (TochkaCreatePaymentResponse, []byte, error) {
	var response TochkaCreatePaymentResponse
	raw, err := c.doJSON(ctx, http.MethodPost, c.config.CreatePaymentPath, request, &response)
	if err != nil {
		return response, raw, err
	}
	return response, raw, nil
}

func (c *Client) GetPaymentOperationInfo(ctx context.Context, operationID string) (TochkaGetPaymentOperationResponse, []byte, error) {
	var response TochkaGetPaymentOperationResponse
	path := fmt.Sprintf("%s/%s", c.config.CreatePaymentPath, url.PathEscape(operationID))
	raw, err := c.doJSON(ctx, http.MethodGet, path, nil, &response)
	if err != nil {
		return response, raw, err
	}
	return response, raw, nil
}

func (c *Client) doJSON(ctx context.Context, method, path string, payload any, out any) ([]byte, error) {
	var body io.Reader
	if payload != nil {
		encoded, err := json.Marshal(payload)
		if err != nil {
			return nil, err
		}
		body = bytes.NewReader(encoded)
	}

	req, err := http.NewRequestWithContext(ctx, method, c.config.BaseURL+path, body)
	if err != nil {
		return nil, err
	}
	if payload != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.config.Token)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return raw, fmt.Errorf("tochka api returned %d", resp.StatusCode)
	}
	if out != nil {
		if err := json.Unmarshal(raw, out); err != nil {
			return raw, err
		}
	}
	return raw, nil
}

func DecodeWebhookPayload(rawToken string, publicKeyPEM string) (TochkaAcquiringWebhook, error) {
	var payload TochkaAcquiringWebhook
	rawToken = strings.TrimSpace(rawToken)
	if rawToken == "" {
		return payload, fmt.Errorf("empty webhook payload")
	}

	parts := strings.Split(rawToken, ".")
	if len(parts) != 3 {
		return payload, fmt.Errorf("invalid webhook token format")
	}

	if publicKeyPEM != "" {
		if err := verifyWebhookToken(parts, publicKeyPEM); err != nil {
			return payload, err
		}
	}

	decoded, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return payload, fmt.Errorf("decode webhook payload: %w", err)
	}
	if err := json.Unmarshal(decoded, &payload); err != nil {
		return payload, err
	}
	return payload, nil
}

func verifyWebhookToken(parts []string, publicKeyPEM string) error {
	block, _ := pem.Decode([]byte(publicKeyPEM))
	if block == nil {
		return fmt.Errorf("invalid webhook public key pem")
	}
	publicKeyAny, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		certificate, certErr := x509.ParseCertificate(block.Bytes)
		if certErr != nil {
			return fmt.Errorf("parse webhook public key: %w", err)
		}
		publicKeyAny = certificate.PublicKey
	}
	publicKey, ok := publicKeyAny.(*rsa.PublicKey)
	if !ok {
		return fmt.Errorf("webhook public key is not rsa")
	}

	signingInput := strings.Join(parts[:2], ".")
	hash := sha256.Sum256([]byte(signingInput))
	signature, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return fmt.Errorf("decode webhook signature: %w", err)
	}
	if err := rsa.VerifyPKCS1v15(publicKey, crypto.SHA256, hash[:], signature); err != nil {
		return fmt.Errorf("verify webhook signature: %w", err)
	}
	return nil
}
