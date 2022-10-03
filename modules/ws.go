package modules

import (
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"time"
)

type msgType int

const (
	MTypeText msgType = 0
	MTypeFile msgType = 1
)

const (
	StateOffline int8 = -1
	StateOnline  int8 = 1
)

type File struct {
	FileID   string `json:"fileID"`
	Filename string `json:"filename"`
	FilePath string `json:"filePath,omitempty"`
}

type WS struct {
	engine   *gin.Engine
	upgrader websocket.Upgrader
	clients  map[string]*websocket.Conn
	event    *Event
}

type wsResponse struct {
	MType   msgType `json:"mType"`
	Title   string  `json:"title"`
	Content string  `json:"content,omitempty"`
	Files   []*File `json:"files,omitempty"`
}

func NewWS(e *gin.Engine) *WS {
	return &WS{
		engine: e,
		upgrader: websocket.Upgrader{
			HandshakeTimeout: 60 * time.Second,
			ReadBufferSize:   1024,
			WriteBufferSize:  1024,
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
		clients: make(map[string]*websocket.Conn),
	}
}

func (w *WS) AddEvent(event *Event) {
	w.event = event
}

func (w *WS) Run() {
	w.engine.GET("/ws", func(c *gin.Context) {
		conn, err := w.upgrader.Upgrade(c.Writer, c.Request, nil)
		defer func() {
			_ = conn.Close()
		}()

		log.Println("connect: ", c.ClientIP())

		if err != nil {
			log.Println("connect err: ", err)
			return
		}

		clientIP := c.ClientIP()
		if oldConn, ok := w.clients[clientIP]; ok {
			_ = oldConn.Close()
		}

		w.clients[clientIP] = conn

		w.event.UpdateClient(StateOnline, clientIP)

		for {
			msgType, msg, err := conn.ReadMessage()

			if err != nil {
				log.Println("read message error: ", err)

				w.event.UpdateClient(StateOffline, clientIP)
				delete(w.clients, clientIP)

				return
			}

			log.Println("ReadMessage: ", msgType, msg, string(msg))

			switch msgType {
			case websocket.TextMessage:
				w.event.Notice(clientIP, MTypeText, string(msg))
			case websocket.BinaryMessage:

			case websocket.CloseMessage:
				log.Println("websocket close")

				w.event.UpdateClient(StateOffline, clientIP)
				delete(w.clients, clientIP)
				return
			default:
				continue
			}
		}
	})
}

func (w *WS) Send(mType msgType, data interface{}) {
	for ip, conn := range w.clients {
		resp := &wsResponse{
			MType: mType,
		}

		switch mType {
		case MTypeText:
			if s, ok := data.(string); ok {
				resp.Content = s
			}
		case MTypeFile:
			if files, ok := data.([]*File); ok {
				resp.Files = files
			}
		default:
			continue
		}

		err := conn.WriteJSON(resp)
		if err != nil {
			log.Println(ip, " write msg error: ", err)
		}
	}
}
