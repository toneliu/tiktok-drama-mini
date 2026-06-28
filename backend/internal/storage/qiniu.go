package storage

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"strings"
	"time"
)

// QiniuStorage 七牛云 Kodo 存储（上传凭证 + 表单上传，无 SDK 依赖）
type QiniuStorage struct {
	Endpoint  string // 上传域名，如 https://upload.qiniup.com（留空则用默认）
	AccessKey string
	SecretKey string
	Bucket    string
	Domain    string // 绑定的访问域名（必填），如 https://cdn.example.com
	SubDir    string
}

func (s *QiniuStorage) Name() string { return "qiniu" }

func (s *QiniuStorage) publicURL(key string) string {
	d := strings.TrimRight(strings.TrimSpace(s.Domain), "/")
	if d == "" {
		// 七牛要求绑定域名访问，兜底用 bucket 域名（可能无法直接访问）
		d = "https://" + s.Bucket + ".qiniudn.com"
	}
	return d + "/" + key
}

// urlsafeBase64 七牛 URL 安全 Base64（- _ 替换 + /，保留 = 填充）
func (s *QiniuStorage) urlsafeBase64(b []byte) string {
	return base64.URLEncoding.EncodeToString(b)
}

// uploadToken 生成七牛上传凭证
// token = AccessKey : urlsafe_base64(HMAC-SHA1(SecretKey, encodedPutPolicy)) : encodedPutPolicy
func (s *QiniuStorage) uploadToken() (string, error) {
	deadline := time.Now().Unix() + 3600
	policy := map[string]interface{}{
		"scope":    s.Bucket,
		"deadline": deadline,
	}
	policyJSON, err := json.Marshal(policy)
	if err != nil {
		return "", err
	}
	encodedPutPolicy := s.urlsafeBase64(policyJSON)

	mac := hmac.New(sha1.New, []byte(s.SecretKey))
	mac.Write([]byte(encodedPutPolicy))
	encodedSign := s.urlsafeBase64(mac.Sum(nil))

	return s.AccessKey + ":" + encodedSign + ":" + encodedPutPolicy, nil
}

// Upload 表单上传文件到七牛
func (s *QiniuStorage) Upload(reader io.Reader, ext string, contentType string) (string, string, error) {
	if s.AccessKey == "" || s.SecretKey == "" || s.Bucket == "" {
		return "", "", fmt.Errorf("七牛配置不完整")
	}
	if s.Domain == "" {
		return "", "", fmt.Errorf("七牛必须配置访问域名（CDN 或绑定域名）")
	}

	buf, err := io.ReadAll(reader)
	if err != nil {
		return "", "", fmt.Errorf("读取文件失败: %w", err)
	}

	key := genObjectKey(s.SubDir, ext)
	token, err := s.uploadToken()
	if err != nil {
		return "", "", err
	}

	if contentType == "" {
		contentType = "application/octet-stream"
	}

	// 构造 multipart/form-data 表单
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	_ = writer.WriteField("key", key)
	_ = writer.WriteField("token", token)

	h := textproto.MIMEHeader{}
	h.Set("Content-Disposition", fmt.Sprintf(`form-data; name="file"; filename="%s"`, key))
	h.Set("Content-Type", contentType)
	part, err := writer.CreatePart(h)
	if err != nil {
		return "", "", err
	}
	if _, err := part.Write(buf); err != nil {
		return "", "", err
	}
	writer.Close()

	uploadHost := strings.TrimSpace(s.Endpoint)
	if uploadHost == "" {
		uploadHost = "https://upload.qiniup.com"
	}

	req, err := http.NewRequest(http.MethodPost, uploadHost, body)
	if err != nil {
		return "", "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 10 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("七牛上传请求失败: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", "", fmt.Errorf("七牛上传失败: HTTP %d, %s", resp.StatusCode, string(respBody))
	}

	return s.publicURL(key), key, nil
}
