package storage

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// TOSStorage 火山引擎 TOS 存储（TOS V4 签名，无 SDK 依赖）
type TOSStorage struct {
	Endpoint  string // tos-cn-beijing.volces.com
	AccessKey string
	SecretKey string
	Bucket    string
	Domain    string // 自定义域名/CDN，留空则用 https://bucket.endpoint
	SubDir    string
}

func (s *TOSStorage) Name() string { return "tos" }

// region 从 endpoint 推导：tos-cn-beijing.volces.com -> cn-beijing
func (s *TOSStorage) region() string {
	ep := strings.TrimSpace(s.Endpoint)
	ep = strings.TrimPrefix(ep, "https://")
	ep = strings.TrimPrefix(ep, "http://")
	if strings.HasPrefix(ep, "tos-") {
		ep = ep[4:]
	}
	if idx := strings.Index(ep, "."); idx >= 0 {
		ep = ep[:idx]
	}
	return ep
}

func (s *TOSStorage) host() string {
	return s.Bucket + "." + strings.TrimRight(strings.TrimPrefix(strings.TrimPrefix(s.Endpoint, "https://"), "http://"), "/")
}

func (s *TOSStorage) publicURL(key string) string {
	if s.Domain != "" {
		return strings.TrimRight(s.Domain, "/") + "/" + key
	}
	return "https://" + s.host() + "/" + key
}

func hmacSHA256(key, data []byte) []byte {
	h := hmac.New(sha256.New, key)
	h.Write(data)
	return h.Sum(nil)
}

func sha256Hex(b []byte) string {
	sum := sha256.Sum256(b)
	return hex.EncodeToString(sum[:])
}

// uriEncode TOS 风格 URI 编码。encodeSlash=true 时对 / 编码。
func uriEncode(s string, encodeSlash bool) string {
	var b strings.Builder
	for i := 0; i < len(s); i++ {
		c := s[i]
		if (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') ||
			c == '-' || c == '.' || c == '_' || c == '~' {
			b.WriteByte(c)
		} else if c == '/' && !encodeSlash {
			b.WriteByte(c)
		} else {
			fmt.Fprintf(&b, "%%%02X", c)
		}
	}
	return b.String()
}

// sign 计算 TOS V4 签名，返回 Authorization 头
func (s *TOSStorage) sign(method, canonicalURI, host, date, region, contentType string, payload []byte) string {
	payloadHash := sha256Hex(payload)

	// CanonicalHeaders（按小写 header 名字典序：content-type, host, x-tos-content-sha256, x-tos-date）
	canonicalHeaders := "content-type:" + contentType + "\n" +
		"host:" + host + "\n" +
		"x-tos-content-sha256:" + payloadHash + "\n" +
		"x-tos-date:" + date + "\n"
	signedHeaders := "content-type;host;x-tos-content-sha256;x-tos-date"

	canonicalRequest := method + "\n" +
		canonicalURI + "\n" +
		"" + "\n" + // CanonicalQueryString 为空
		canonicalHeaders + "\n" +
		signedHeaders + "\n" +
		payloadHash

	credentialScope := date[:8] + "/" + region + "/tos/request"
	stringToSign := "TOS4-HMAC-SHA256" + "\n" +
		date + "\n" +
		credentialScope + "\n" +
		sha256Hex([]byte(canonicalRequest))

	// 派生签名密钥：kDate -> kRegion -> kService -> kSigning
	kDate := hmacSHA256([]byte(s.SecretKey), []byte(date[:8]))
	kRegion := hmacSHA256(kDate, []byte(region))
	kService := hmacSHA256(kRegion, []byte("tos"))
	kSigning := hmacSHA256(kService, []byte("request"))
	signature := hex.EncodeToString(hmacSHA256(kSigning, []byte(stringToSign)))

	return "TOS4-HMAC-SHA256 Credential=" + s.AccessKey + "/" + credentialScope +
		",SignedHeaders=" + signedHeaders + ",Signature=" + signature
}

// Upload 上传文件到 TOS
func (s *TOSStorage) Upload(reader io.Reader, ext string, contentType string) (string, string, error) {
	if s.AccessKey == "" || s.SecretKey == "" || s.Bucket == "" || s.Endpoint == "" {
		return "", "", fmt.Errorf("TOS 配置不完整")
	}
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	key := genObjectKey(s.SubDir, ext)
	host := s.host()
	region := s.region()
	if region == "" {
		return "", "", fmt.Errorf("无法从 endpoint 推导 region，请检查 endpoint 格式（如 tos-cn-beijing.volces.com）")
	}
	date := time.Now().UTC().Format("20060102T150405Z")

	buf, err := io.ReadAll(reader)
	if err != nil {
		return "", "", fmt.Errorf("读取文件失败: %w", err)
	}

	canonicalURI := "/" + uriEncode(key, false)
	auth := s.sign(http.MethodPut, canonicalURI, host, date, region, contentType, buf)

	req, err := http.NewRequest(http.MethodPut, "https://"+host+canonicalURI, bytes.NewReader(buf))
	if err != nil {
		return "", "", err
	}
	req.Header.Set("Host", host)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("Content-Length", fmt.Sprintf("%d", len(buf)))
	req.Header.Set("x-tos-date", date)
	req.Header.Set("x-tos-content-sha256", sha256Hex(buf))
	req.Header.Set("Authorization", auth)

	client := &http.Client{Timeout: 10 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("TOS 上传请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return "", "", fmt.Errorf("TOS 上传失败: HTTP %d, %s", resp.StatusCode, string(body))
	}

	return s.publicURL(key), key, nil
}
