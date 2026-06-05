package common

import (
	"database/sql"
	"mime/multipart"

	"gorm.io/gorm"
)

// TransactionRunner describes the database capability shared by domain repositories.
type TransactionRunner interface {
	Transaction(fc func(tx *gorm.DB) error, opts ...*sql.TxOptions) error
}

// ImageUploader is the common media upload contract used by domains that accept images.
type ImageUploader interface {
	UploadImage(fileHeader *multipart.FileHeader, folder string) (string, error)
}
