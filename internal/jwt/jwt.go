package jwt

import (
	"beauty-sarafan/internal/models"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Claims struct {
	UID   uint   `json:"uid"`
	Login string `json:"login"`
	Role  string `json:"role"`
	Exp   int64  `json:"exp"`
}

func secretKey() []byte {
	key := os.Getenv("JWT_SECRET")
	if key == "" {
		key = "change-me-in-env"
	}
	return []byte(key)
}

func tokenTTL() time.Duration {
	ttl := os.Getenv("JWT_TTL_HOURS")
	if ttl == "" {
		return 24 * time.Hour
	}

	hours, err := strconv.Atoi(ttl)
	if err != nil || hours <= 0 {
		return 24 * time.Hour
	}
	return time.Duration(hours) * time.Hour
}

func GenerateToken(user models.User) (string, int64, error) {
	exp := time.Now().Add(tokenTTL()).Unix()
	header := map[string]string{"alg": "HS256", "typ": "JWT"}
	payload := Claims{UID: user.ID, Login: user.Login, Role: user.Role, Exp: exp}

	headerJSON, err := json.Marshal(header)
	if err != nil {
		return "", 0, err
	}
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return "", 0, err
	}

	encodedHeader := base64.RawURLEncoding.EncodeToString(headerJSON)
	encodedPayload := base64.RawURLEncoding.EncodeToString(payloadJSON)
	signingInput := encodedHeader + "." + encodedPayload
	signature := sign(signingInput)

	return signingInput + "." + signature, int64(tokenTTL().Seconds()), nil
}

func ParseToken(rawToken string) (*Claims, error) {
	parts := strings.Split(rawToken, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid token format")
	}

	signingInput := parts[0] + "." + parts[1]
	if !hmac.Equal([]byte(sign(signingInput)), []byte(parts[2])) {
		return nil, fmt.Errorf("invalid token signature")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("invalid token payload")
	}

	var claims Claims
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return nil, fmt.Errorf("invalid token claims")
	}
	if time.Now().Unix() >= claims.Exp {
		return nil, fmt.Errorf("token expired")
	}

	return &claims, nil
}

func sign(input string) string {
	h := hmac.New(sha256.New, secretKey())
	h.Write([]byte(input))
	return base64.RawURLEncoding.EncodeToString(h.Sum(nil))
}
