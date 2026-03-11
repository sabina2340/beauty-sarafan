package storage

import (
	"bytes"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

type Service struct {
	bucket    string
	accessKey string
	secretKey string
	region    string
	endpoint  string
	publicURL string
	http      *http.Client
}

func NewService() (*Service, error) {
	bucket := strings.TrimSpace(os.Getenv("S3_BUCKET"))
	accessKey := strings.TrimSpace(os.Getenv("S3_ACCESS_KEY"))
	secretKey := strings.TrimSpace(os.Getenv("S3_SECRET_KEY"))
	endpoint := strings.TrimRight(strings.TrimSpace(os.Getenv("S3_ENDPOINT")), "/")
	region := strings.TrimSpace(os.Getenv("S3_REGION"))
	publicBaseURL := strings.TrimRight(strings.TrimSpace(os.Getenv("S3_PUBLIC_BASE_URL")), "/")

	if bucket == "" || accessKey == "" || secretKey == "" {
		return nil, fmt.Errorf("S3_BUCKET, S3_ACCESS_KEY and S3_SECRET_KEY are required")
	}
	if endpoint == "" {
		endpoint = "https://storage.yandexcloud.net"
	}
	if region == "" {
		region = "ru-central1"
	}
	if publicBaseURL == "" {
		publicBaseURL = fmt.Sprintf("%s/%s", endpoint, bucket)
	}

	return &Service{
		bucket:    bucket,
		accessKey: accessKey,
		secretKey: secretKey,
		region:    region,
		endpoint:  endpoint,
		publicURL: publicBaseURL,
		http:      &http.Client{Timeout: 30 * time.Second},
	}, nil
}

func (s *Service) UploadImage(fileHeader *multipart.FileHeader, folder string) (string, error) {
	if fileHeader == nil {
		return "", fmt.Errorf("file is required")
	}

	safeFolder := strings.Trim(strings.ReplaceAll(folder, "..", ""), "/")
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if ext == "" {
		ext = ".jpg"
	}

	randomSuffix := make([]byte, 8)
	if _, err := rand.Read(randomSuffix); err != nil {
		return "", err
	}
	name := fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), hex.EncodeToString(randomSuffix), ext)
	key := path.Join(safeFolder, name)

	src, err := fileHeader.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	payload, err := io.ReadAll(src)
	if err != nil {
		return "", err
	}

	contentType := fileHeader.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	if err := s.putObject(key, payload, contentType); err != nil {
		return "", err
	}

	return fmt.Sprintf("%s/%s", s.publicURL, key), nil
}

func (s *Service) putObject(key string, payload []byte, contentType string) error {
	now := time.Now().UTC()
	amzDate := now.Format("20060102T150405Z")
	dateStamp := now.Format("20060102")

	endpointURL, err := url.Parse(s.endpoint)
	if err != nil {
		return err
	}

	canonicalURI := "/" + path.Join(s.bucket, key)
	payloadHash := hashHex(payload)

	headers := map[string]string{
		"content-type":         contentType,
		"host":                 endpointURL.Host,
		"x-amz-acl":            "public-read",
		"x-amz-content-sha256": payloadHash,
		"x-amz-date":           amzDate,
	}

	headerKeys := make([]string, 0, len(headers))
	for k := range headers {
		headerKeys = append(headerKeys, k)
	}
	sort.Strings(headerKeys)

	canonicalHeaders := ""
	for _, k := range headerKeys {
		canonicalHeaders += fmt.Sprintf("%s:%s\n", k, strings.TrimSpace(headers[k]))
	}
	signedHeaders := strings.Join(headerKeys, ";")

	canonicalRequest := strings.Join([]string{
		"PUT",
		canonicalURI,
		"",
		canonicalHeaders,
		signedHeaders,
		payloadHash,
	}, "\n")

	credentialScope := fmt.Sprintf("%s/%s/s3/aws4_request", dateStamp, s.region)
	stringToSign := strings.Join([]string{
		"AWS4-HMAC-SHA256",
		amzDate,
		credentialScope,
		hashHex([]byte(canonicalRequest)),
	}, "\n")

	signingKey := s.signingKey(dateStamp)
	signature := hmacHex(signingKey, stringToSign)
	authorization := fmt.Sprintf("AWS4-HMAC-SHA256 Credential=%s/%s, SignedHeaders=%s, Signature=%s", s.accessKey, credentialScope, signedHeaders, signature)

	requestURL := strings.TrimRight(s.endpoint, "/") + canonicalURI
	req, err := http.NewRequest(http.MethodPut, requestURL, bytes.NewReader(payload))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", contentType)
	req.Header.Set("X-Amz-ACL", "public-read")
	req.Header.Set("X-Amz-Date", amzDate)
	req.Header.Set("X-Amz-Content-Sha256", payloadHash)
	req.Header.Set("Authorization", authorization)

	resp, err := s.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("object storage upload failed: %s: %s", resp.Status, string(body))
	}

	return nil
}

func (s *Service) signingKey(dateStamp string) []byte {
	kDate := hmacBytes([]byte("AWS4"+s.secretKey), dateStamp)
	kRegion := hmacBytes(kDate, s.region)
	kService := hmacBytes(kRegion, "s3")
	return hmacBytes(kService, "aws4_request")
}

func hashHex(data []byte) string {
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}

func hmacBytes(key []byte, data string) []byte {
	h := hmac.New(sha256.New, key)
	h.Write([]byte(data))
	return h.Sum(nil)
}

func hmacHex(key []byte, data string) string {
	return hex.EncodeToString(hmacBytes(key, data))
}
