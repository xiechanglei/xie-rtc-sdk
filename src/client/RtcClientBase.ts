import { RtcSignalApi } from './RtcSignalApi'

/**
 * RTC终端基础类，用来处理心跳等信息
 */
export abstract class RtcClientBase extends RtcSignalApi {

    //the default register expire time of seconds
    static defaultExpireTime = 60

    //the resgister signal heart beat time (seconds)
    heartTime: number
    heartBeatInterval?: NodeJS.Timer

    constructor(config: { server: string, localNumber: string, heartTime?: number, expireTime?: number }) {
        let expireTime = config.expireTime || RtcClientBase.defaultExpireTime
        super(config.server, config.localNumber, expireTime)
        this.heartTime = config.heartTime || this.expireTime / 2
    }

    /**
     * 连接建立成功之后设置定时任务开始发送心跳
     * 如果需要登录之后立即发送心跳，请自行调用register方法，
     * 全局导出的index.ts上createRtcClient上面已经处理此逻辑了
     */
    onConnected() {
        // this.register()
        this.heartBeatInterval = setInterval(() => this.register(), this.heartTime * 1000)
    }

    /**
    * 连接断开之后停止发送心跳
    */
    onDisConnected() {
        super.onDisConnected()
        //停止心跳
        if (this.heartBeatInterval !== undefined) {
            clearInterval(this.heartBeatInterval)
        }
    }

}