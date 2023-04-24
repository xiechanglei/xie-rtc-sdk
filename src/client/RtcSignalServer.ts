import { SignalMessage } from './../message/SignalMessage';
import { RtcSocketServerHandler } from "../websocket/RtcSocketServerHandler"
import { RtcClientEvent } from './RtcClientEvent';

/**
 * rtc 信令服务器，用来处理信令消息，以及按照协议获取信令的返回结果
 */
export abstract class RtcSignalServer extends RtcSocketServerHandler {
    // local sip number
    localNumber: string

    //register signal message expire time (seconds)
    expireTime: number

    // promise request 
    asyncProducer: Map<number, Function> = new Map<number, Function>()

    constructor(server: string, localNumber: string, expireTime: number) {
        super(server)
        this.localNumber = localNumber
        this.expireTime = expireTime
    }

    /**
    * 发送需要回应消息的信令消息
    */
    async sendRespondableMessage(message: SignalMessage): Promise<any> {
        this.sendMessage(message)
        return new Promise((resolve) => this.asyncProducer.set(message.seq, resolve))
    }

    /**
     * 获取异步回调
     */
    getAsyncResolve(seq: number): Function | undefined {
        let analyzer = this.asyncProducer.get(seq)
        if (analyzer !== undefined) {
            this.asyncProducer.delete(seq)
        }
        return analyzer
    }

    //连接断开
    onDisConnected() {
        //清空异步等待
        this.asyncProducer.clear()
        //事件上报
        this.emit(RtcClientEvent.disconnected, this)
    }

    //invoke on message reviced
    onReviceMessage(data: any) {
        let { status, seq } = data
        if (status !== undefined) {
            this.getAsyncResolve(seq)?.call(undefined, data)
        } else {
            this.processMessage(data)
        }
    }


    abstract processMessage(data: any): any
}