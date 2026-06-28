package storage

import (
	"crypto/rand"
	"encoding/hex"
)

// randHex 生成 n 字节的随机十六进制字符串
func randHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
