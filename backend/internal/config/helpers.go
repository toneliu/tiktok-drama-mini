package config

import "github.com/spf13/viper"

var appConfig *Config

func SetConfig(cfg *Config) {
	appConfig = cfg
}

func GetJWTSecret() string {
	if appConfig != nil {
		return appConfig.JWT.Secret
	}
	return viper.GetString("jwt.secret")
}
