import { EventEmitter } from 'events'
import { RtcWebSocketEvent } from './RtcWebSocketEvent'
import { RtcWebSocket } from "./RtcWebSocket"

/**
 * 内部持有一个websocket，并且对websocket进行管理，对外提供发送消息的接口以及相关事件
 */
export abstract class RtcSocketServerHandler extends EventEmitter {

    socket?: RtcWebSocket
    server: string

    constructor(server: string) {
        super()
        this.server = server
        super.setMaxListeners(0)
    }


    abstract onReviceMessage(data: any): any

    abstract onConnected(): any

    abstract onDisConnected(): any

    /**
     * 修改/设置 websocket地址
     */
    reConnect(): Promise<void> {
        this.destory()
        return new Promise((resolve, reject) => {
            if (this.server !== undefined) {
                let socket = new RtcWebSocket(this.server)
                socket.on(RtcWebSocketEvent.connected, () => {
                    this.socket = socket
                    this.onConnected()
                    resolve()
                })
                socket.on(RtcWebSocketEvent.disconnected, () => {
                    this.socket = undefined
                    this.onDisConnected()
                    reject("socket connecion failed")
                })
                socket.on(RtcWebSocketEvent.message, (data) => this.onReviceMessage(data))
                socket.connect()
            } else {
                reject("server is empty")
            }
        })
    }


    /**
    * 发送消息
    */
    sendMessage(message: any): void {
        if (this.socket !== undefined) {
            this.socket.sendMessage(message)
        } else {
            throw new Error("socket is closed")
        }
    }


    //销毁socket
    destory() {
        if (this.socket !== undefined) {
            this.socket.close()
            this.socket = undefined
        }
        // this.removeAllListeners()
    }
}