package modules

import (
	"context"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type Dialog struct {
	ctx context.Context
}

func NewDialog(ctx context.Context) *Dialog {
	return &Dialog{ctx}
}

func (d *Dialog) OpenDirectoryDialog() string {
	dir, err := runtime.OpenDirectoryDialog(d.ctx, runtime.OpenDialogOptions{})
	if err != nil {
		println("OpenDirectoryDialog error:", err.Error())

		return ""
	}

	SetSavePath(dir)

	return dir
}

func (d *Dialog) OpenMultipleFilesDialog() []string {
	files, err := runtime.OpenMultipleFilesDialog(d.ctx, runtime.OpenDialogOptions{})
	if err != nil {
		println("OpenMultipleFilesDialog error:", err.Error())

		return nil
	}

	return files
}
