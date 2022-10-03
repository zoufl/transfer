package modules

import (
	"log"
	"os"
)

var saveUploadedPath string

func GetSavePath() string {
	if saveUploadedPath == "" {
		dir, err := os.UserHomeDir()
		if err != nil {
			log.Println("get user home dir error: ", err)
		}

		SetSavePath(dir)
	}

	return saveUploadedPath
}

func SetSavePath(dir string) {
	saveUploadedPath = dir
}

func GetFilePath(filename string) string {
	return saveUploadedPath + "/" + filename
}
