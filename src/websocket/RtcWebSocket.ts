import { log } from '../log/Logger'
import { EventEmitter } from "events"
import { RtcWebSocketEvent } from "./RtcWebSocketEvent"

/**
 * 对websocket进行封装
 */
export class RtcWebSocket extends EventEmitter {
    /**
     * signal server address
     */
    server: string
    /**
     * websocket client
     */
    ws?: WebSocket

    constructor(server: string) {
        super()
        this.server = server
    }

    /**
     * connect to the websocket server
     */
    connect() {
        this.ws = new WebSocket(this.server)
        this.ws.onopen = () => {
            log("websocket connected  ", this.server)
            this.emit(RtcWebSocketEvent.connected)
        }
        this.ws.onclose = () => {
            log("websocket disconnected ", this.server)
            this.ws = undefined
            this.emit(RtcWebSocketEvent.disconnected)
        }
        this.ws.onmessage = ({ data }) => {
            let message = JSON.parse(data)
            log("websocket recive message ", message)
            this.emit(RtcWebSocketEvent.message, message)
        }
    }


    /**
    * 主动断开websocket，不会触发冲连机制
    */
    close(): void {
        if (this.ws !== undefined) {
            this.ws.close()
            this.ws = undefined
        }
    }

    /**
     * 发送消息
     */
    sendMessage(message: any): void {
        log("websocket send message ", message)
        if (message !== undefined && this.ws !== undefined && this.ws.readyState === 1) {
            this.ws.send(JSON.stringify(message))
        }
    }
}