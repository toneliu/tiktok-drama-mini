package storage

import (
	"io"
	"time"
)

// Storage 存储后端抽象接口
type Storage interface {
	// Upload 上传文件，返回可访问的 URL 和对象 key
	// ext 含点号如 ".mp4"，contentType 为 MIME 类型
	Upload(reader io.Reader, ext string, contentType string) (url string, key string, err error)
	// Name 后端名称
	Name() string
}

// Options 存储选项
type Options struct {
	SubDir string // 子目录，如 "images" 或 "videos"
}

// genObjectKey 生成对象 key：子目录/年月/时间戳-随机.ext
func genObjectKey(subDir, ext string) string {
	sub := time.Now().Format("200601")
	name := time.Now().Format("20060102150405") + "-" + randHex(8) + ext
	if subDir == "" {
		return sub + "/" + name
	}
	return subDir + "/" + sub + "/" + name
}
