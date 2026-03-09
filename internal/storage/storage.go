package storage

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Service struct {
	baseURL string
	rootDir string
}

func NewService() *Service {
	baseURL := strings.TrimRight(os.Getenv("STORAGE_PUBLIC_BASE_URL"), "/")
	if baseURL == "" {
		baseURL = "/uploads"
	}

	rootDir := os.Getenv("STORAGE_UPLOAD_DIR")
	if rootDir == "" {
		rootDir = "uploads"
	}

	return &Service{baseURL: baseURL, rootDir: rootDir}
}

func (s *Service) UploadImage(fileHeader *multipart.FileHeader, folder string) (string, error) {
	if fileHeader == nil {
		return "", fmt.Errorf("file is required")
	}

	safeFolder := strings.Trim(strings.ReplaceAll(folder, "..", ""), "/")
	dir := filepath.Join(s.rootDir, safeFolder)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if ext == "" {
		ext = ".jpg"
	}
	name := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	path := filepath.Join(dir, name)

	src, err := fileHeader.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	dst, err := os.Create(path)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if _, err = io.Copy(dst, src); err != nil {
		return "", err
	}

	return fmt.Sprintf("%s/%s/%s", s.baseURL, safeFolder, name), nil
}
