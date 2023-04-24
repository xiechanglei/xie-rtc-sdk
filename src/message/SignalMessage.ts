import { SignalMessageType } from "./SingalMessageType"

//消息体
export class SignalMessage {

    static seqNum: number = 1
    /**
     * 请求类型
     */
    req: SignalMessageType
    /**
     * 每次请求序列号增加1，后端设计如此
     * 导致前端websocket通道无法复用，对于每个账号都使用单独的websocket
     */
    seq: number

    /**
     * 信令发送方
     */
    from: string

    /**
     * 信令接收方 
     */
    to: string

    constructor(req: SignalMessageType, from: string, to: string, data?: Object) {
        this.req = req
        this.seq = SignalMessage.seqNum++
        this.from = from
        this.to = to
        if (data !== undefined) {
            Object.assign(this, data)
        }
    }
}