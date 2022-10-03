package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

//go:embed frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title: "局域网传送",
		//Width:  1024,
		//Height: 768,
		Width:              800,
		Height:             600,
		DisableResize:      true,
		Fullscreen:         false,
		MinWidth:           400,
		MinHeight:          400,
		MaxWidth:           1280,
		MaxHeight:          1024,
		Assets:             assets,
		BackgroundColour:   &options.RGBA{R: 255, G: 255, B: 255, A: 255},
		LogLevel:           logger.DEBUG,
		LogLevelProduction: logger.ERROR,
		OnStartup:          app.startup,
		OnShutdown:         app.shutdown,
		Bind: []interface{}{
			app,
		},
		Mac: &mac.Options{
			TitleBar: mac.TitleBarHiddenInset(),
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
