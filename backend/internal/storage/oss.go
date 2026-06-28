package storage

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// OSSStorage 阿里云 OSS 存储（使用 REST API PutObject，无外部 SDK 依赖）
type OSSStorage struct {
	Endpoint   string // oss-cn-hangzhou.aliyuncs.com
	AccessKey  string
	SecretKey  string
	Bucket     string
	Domain     string // 自定义域名或 CDN，留空则用 Bucket.Endpoint
	SubDir     string // 子目录，如 "images" 或 "videos"
}

func (s *OSSStorage) Name() string { return "oss" }

// publicURL 构造公开访问 URL
func (s *OSSStorage) publicURL(key string) string {
	if s.Domain != "" {
		return strings.TrimRight(s.Domain, "/") + "/" + key
	}
	return fmt.Sprintf("https://%s.%s/%s", s.Bucket, s.Endpoint, key)
}

// host 构造 Host 头
func (s *OSSStorage) host() string {
	return fmt.Sprintf("%s.%s", s.Bucket, s.Endpoint)
}

// sign 计算OSS签名 (Authorization: OSS {AccessKey}:{Signature})
func (s *OSSStorage) sign(method, contentType, date, resource string) string {
	stringToSign := method + "\n\n" + contentType + "\n" + date + "\n" + resource
	h := hmac.New(sha1.New, []byte(s.SecretKey))
	h.Write([]byte(stringToSign))
	signature := base64.StdEncoding.EncodeToString(h.Sum(nil))
	return "OSS " + s.AccessKey + ":" + signature
}

// Upload 上传文件到 OSS
func (s *OSSStorage) Upload(reader io.Reader, ext string, contentType string) (string, string, error) {
	if s.AccessKey == "" || s.SecretKey == "" || s.Bucket == "" || s.Endpoint == "" {
		return "", "", fmt.Errorf("OSS 配置不完整")
	}

	if contentType == "" {
		contentType = "application/octet-stream"
	}

	key := genObjectKey(s.SubDir, ext)
	resource := "/" + s.Bucket + "/" + key
	host := s.host()
	date := time.Now().UTC().Format(http.TimeFormat)

	// 读取内容到 buffer（需要计算 Content-Length 且 PutObject 需要完整 body）
	buf, err := io.ReadAll(reader)
	if err != nil {
		return "", "", fmt.Errorf("读取文件失败: %w", err)
	}

	req, err := http.NewRequest(http.MethodPut, "https://"+host+"/"+key, bytes.NewReader(buf))
	if err != nil {
		return "", "", err
	}
	req.Header.Set("Host", host)
	req.Header.Set("Date", date)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("Content-Length", fmt.Sprintf("%d", len(buf)))
	req.Header.Set("Authorization", s.sign(http.MethodPut, contentType, date, resource))

	client := &http.Client{Timeout: 10 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("OSS 上传请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return "", "", fmt.Errorf("OSS 上传失败: HTTP %d, %s", resp.StatusCode, string(body))
	}

	return s.publicURL(key), key, nil
}
