package main

import (
	"context"
	"embed"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"strings"
	"transfer/modules"
)

//go:embed web/dist
var webAssets embed.FS

// App struct
type App struct {
	ctx     context.Context
	netInfo *modules.NetInfo
	dialog  *modules.Dialog
	server  *modules.Server
	ws      *modules.WS
	event   *modules.Event
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.netInfo = modules.NewNetInfo()
	a.dialog = modules.NewDialog(ctx)

	engine := gin.New()
	a.ws = modules.NewWS(engine)
	a.event = modules.NewEvent(ctx)
	a.event.AddWS(a.ws)
	a.ws.AddEvent(a.event)
	a.server = modules.NewServer(ctx, engine, a.event, webAssets)

	a.server.Run()

	a.ws.Run()
	a.event.Listen()
}

func (a *App) shutdown(ctx context.Context) {
	a.event.UnListen()
}

func (a *App) GetDefaultDir() string {
	return modules.GetSavePath()
}

func (a *App) OpenDirectoryDialog() string {
	return a.dialog.OpenDirectoryDialog()
}

func (a *App) OpenFilesDialog() []string {
	files := a.dialog.OpenMultipleFilesDialog()
	outputFiles := make([]*modules.File, 0)

	for _, filePath := range files {
		uid := uuid.New()

		a.server.AddFile(uid.String(), filePath)
		filename := extractFileName(filePath)
		outputFiles = append(outputFiles, &modules.File{FileID: uid.String(), Filename: filename})
	}

	a.ws.Send(modules.MTypeFile, outputFiles)

	return files
}

func extractFileName(path string) string {
	arr := strings.Split(path, "/")

	if len(arr) == 0 {
		return ""
	}

	return arr[len(arr)-1]
}

func (a *App) GetIps() ([]string, error) {
	return a.netInfo.GetIps()
}

func (a *App) OpenFileDir(path string) {
	a.event.OpenFileDir(path)
}

func (a *App) GetServerPort() string {
	return a.server.GetPort()
}
