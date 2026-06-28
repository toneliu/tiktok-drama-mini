package storage

import (
	"io"
	"os"
	"path/filepath"
)

// LocalStorage 本地文件存储
type LocalStorage struct {
	BaseDir string // 存储根目录，如 "./data/uploads"
	BaseURL string // 访问 URL 前缀，如 "/uploads"
	SubDir  string // 子目录，如 "images" 或 "videos"
}

func (s *LocalStorage) Name() string { return "local" }

func (s *LocalStorage) Upload(reader io.Reader, ext string, contentType string) (string, string, error) {
	key := genObjectKey(s.SubDir, ext)
	savePath := filepath.Join(s.BaseDir, key)

	if err := os.MkdirAll(filepath.Dir(savePath), 0755); err != nil {
		return "", "", err
	}

	f, err := os.Create(savePath)
	if err != nil {
		return "", "", err
	}
	defer f.Close()

	if _, err := io.Copy(f, reader); err != nil {
		return "", "", err
	}

	url := s.BaseURL + "/" + key
	return url, key, nil
}
