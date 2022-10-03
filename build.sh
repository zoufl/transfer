export GIN_MODE=release

(
  cd web || exit
  npm run build
)

(
  wails build
)