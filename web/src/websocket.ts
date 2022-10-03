import {isProdEnv} from "./env";

let ws: WebSocket

function getWebSocket() {
    if (!ws) {
        let url = `ws://${location.hostname}:38888/ws`

        if (isProdEnv) {
            url = `${location.origin}/ws`
            url = url.replace('http:', 'ws:')
        }

        ws = new WebSocket(url)
    }

    return ws
}

export {
    getWebSocket
}