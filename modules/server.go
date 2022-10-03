package modules

import (
	"context"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"html/template"
	"io"
	"io/fs"
	"log"
	"mime/multipart"
	"net/http"
	"os"
)

type Server struct {
	ctx    context.Context
	e      *gin.Engine
	event  *Event
	assert fs.FS
	files  map[string]string
	port   string
}

func NewServer(ctx context.Context, engine *gin.Engine, event *Event, assert fs.FS) *Server {
	return &Server{
		ctx:    ctx,
		e:      engine,
		event:  event,
		assert: assert,
		files:  make(map[string]string),
		port:   "38888",
	}
}

func (s *Server) Run() {
	server := &http.Server{
		Addr:    ":" + s.port,
		Handler: s.e,
	}

	s.InitRoutes()

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			runtime.LogError(s.ctx, fmt.Sprintf("server.ListenAndServe err: %v", err))
		}
	}()
}

func (s *Server) GetEngine() *gin.Engine {
	return s.e
}

func (s *Server) GetPort() string {
	return s.port
}

func (s *Server) InitRoutes() {
	s.e.Use(gin.Recovery())

	temp := template.Must(template.New("").ParseFS(s.assert, "web/dist/*.html"))
	s.e.SetHTMLTemplate(temp)

	assets, _ := fs.Sub(s.assert, "web/dist/assets")
	s.e.StaticFS("/assets", http.FS(assets))

	s.e.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", gin.H{})
	})

	s.e.POST("/upload", s.Upload)
	s.e.POST("/download", s.Download)
}

func (s *Server) Upload(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		log.Println("parse multipart form error: ", err)

		return
	}

	files := form.File["files"]

	outputFiles := make([]*File, 0)
	for _, fileHeader := range files {
		uid := uuid.New()
		id := uid.String()

		log.Println(id, fileHeader.Filename)

		path, err := s.SaveUploadedFile(id, fileHeader)
		if err != nil {
			continue
		}

		outputFiles = append(outputFiles, &File{
			FileID: id, Filename: fileHeader.Filename, FilePath: path,
		})
	}

	s.event.Notice(c.ClientIP(), MTypeFile, outputFiles)

	c.String(http.StatusOK, fmt.Sprintf("%d files uploaded!", len(files)))
}

func (s *Server) SaveUploadedFile(fuuid string, fileHeader *multipart.FileHeader) (string, error) {
	f, err := fileHeader.Open()
	if err != nil {
		log.Println("SaveUploadedFile Open error: ", err)

		return "", fmt.Errorf("open file error: %s", err)
	}

	filePath := GetFilePath(fileHeader.Filename)
	file, err := os.Create(filePath)
	if err != nil {
		log.Println("SaveUploadedFile Create error: ", err)

		return "", fmt.Errorf("create file error: %s", err)
	}

	_, err = io.Copy(file, f)
	if err != nil {
		log.Println("SaveUploadedFile Copy error: ", err)

		return "", fmt.Errorf("copy file error: %s", err)
	}

	s.AddFile(fuuid, filePath)

	return filePath, nil
}

func (s *Server) Download(c *gin.Context) {
	fileId := c.Query("fid")

	filePath, ok := s.files[fileId]
	if !ok {
		fmt.Println("file not exist")

		return
	}

	c.File(filePath)
}

func (s *Server) AddFile(id string, file string) {
	s.files[id] = file
}
