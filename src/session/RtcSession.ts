import { RtcAbstractSession } from './RtcAbstractSession'
import { RtcInviteStatus } from "./RtcInviteStatus"

/**
 * Rtc 会话对象封装
 * 流程：
 * 1.创建会话
 * 1.（选择本地流/添加被叫用户）
 * 2.发送请求
 * 3.接受响应
 * 4.开始会话，被拒绝（结束会话）
 * 5.被挂断，主动挂断（结束会话）
 * 6.用户掉线
 */
export class RtcSession extends RtcAbstractSession {


    /**
     * 开始会话
     */
    async start() {
        let [rtcClient, remoteNumber] = this.checkIsNotUndefined(this.rtcClient, this.remoteNumber)
        let offer = await this.createOffer()
        let { status, sdp } = await rtcClient.invite(remoteNumber, this.sessionId, offer.sdp)
        if (status === RtcInviteStatus.ok) {
            await this.setAnswer(sdp);
        }
        return status
    }

    /**
     * 添加会话用户
     */
    addRemote(remoteNumber: string) {
        this.remoteNumber = remoteNumber
    }
}