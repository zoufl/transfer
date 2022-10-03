package modules

import (
	"context"
	"fmt"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"log"
	"os/exec"
)

const (
	CmdSendText     = "Cmd_Send_Text"
	CmdOpenFile     = "Cmd_Open_file"
	CmdNotice       = "Cmd_Notice"
	CmdUpdateClient = "Cmd_Update_Client"
)

type Event struct {
	ctx context.Context
	ws  *WS
}

func NewEvent(ctx context.Context) *Event {
	return &Event{
		ctx: ctx,
	}
}

func (e *Event) AddWS(ws *WS) {
	e.ws = ws
}

func (e *Event) Listen() {
	runtime.EventsOn(e.ctx, CmdSendText, e.SendText)
	runtime.EventsOn(e.ctx, CmdOpenFile, e.OpenFileDir)
}

func (e *Event) UnListen() {
	runtime.EventsOff(e.ctx, CmdSendText)
	runtime.EventsOff(e.ctx, CmdOpenFile)
}

func (e *Event) SendText(data ...interface{}) {
	for _, d := range data {
		if msg, ok := d.(string); ok {
			e.ws.Send(MTypeText, msg)
		}
	}
}

func (e *Event) OpenFileDir(data ...interface{}) {
	env := runtime.Environment(e.ctx)

	var err error
	for _, d := range data {
		if path, ok := d.(string); ok {
			switch env.Platform {
			case "darwin":
				err = exec.Command(`open`, `-R`, path).Start()
			case "windows":
				err = exec.Command(`explorer`, fmt.Sprintf("/e,/select,%s", path)).Start()
			}

			log.Println(err)
		}
	}
}

func (e *Event) Notice(clientIP string, mType msgType, data interface{}) {
	msg := &wsResponse{
		MType: mType,
		Title: clientIP,
	}

	switch mType {
	case MTypeText:
		if s, ok := data.(string); ok {
			msg.Content = s
		}
	case MTypeFile:
		if files, ok := data.([]*File); ok {
			msg.Files = files
		}
	}

	runtime.EventsEmit(e.ctx, CmdNotice, msg)
}

func (e *Event) UpdateClient(stat int8, data interface{}) {
	runtime.EventsEmit(e.ctx, CmdUpdateClient, stat, data)
}
