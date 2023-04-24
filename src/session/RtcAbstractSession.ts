import { closeStreamAndTrack } from "src/peer/StreamUtil"
import { RtcClient } from "../client/RtcClient"
import RTCPeerConnectionHandler from "../peer/RTCPeerConnectionHandler"
import { RtcInviteStatus } from "./RtcInviteStatus"

export abstract class RtcAbstractSession extends RTCPeerConnectionHandler {
    sessionId: string
    //隶属的rtcclient
    rtcClient: RtcClient | undefined
    //远端号码
    remoteNumber: string | undefined
    //invite的seq
    inviteSeq?: number
    //offer
    inviteOffer?: string

    constructor(rtcClient: RtcClient, sessionId: string, remoteNumber: string | undefined) {
        super()
        this.sessionId = sessionId
        this.rtcClient = rtcClient
        this.remoteNumber = remoteNumber
    }

    reciveIceRequest({ ice }: any) {
        this.setRemoteIce(JSON.parse(ice))
    }


    //获取远端主叫号码
    getRemoteNumber(): string | undefined {
        return this.remoteNumber
    }


    /**
     * ice candidate is trigger after createoffer or createanswer
     */
    onIceCandidate(e: RTCPeerConnectionIceEvent) {
        // if (e && e.candidate) {
        //     this.rtcClient.ice(this.remoteNumber, this.sessionId, e.candidate)
        // }
    }

    /**
     * 销毁会话
     */
    destory() {
        this.removeAllListeners()
        if (this.rtcClient !== undefined) {
            if (this.remoteNumber !== undefined) {
                this.rtcClient.sendBye(this.remoteNumber, this.sessionId)
                this.remoteNumber = undefined
            }
            this.rtcClient.removeSession(this)
        }
        this.rtcClient = undefined
        super.close()
    }


    //拒绝会话
    rejectCall() {
        let [rtcClient, remoteNumber, inviteSeq] = this.checkIsNotUndefined(this.rtcClient, this.remoteNumber, this.inviteSeq)
        rtcClient.answer(RtcInviteStatus.reject, inviteSeq, remoteNumber, this.sessionId)
        this.destory()
    }

    //接受会话，不过在这之前应该使用对应接口准备好本地的流(switchToUserMedia/switchToDeviceMedia)
    async acceptCall() {
        if (this.inviteOffer !== undefined) {
            await this.setOffer(this.inviteOffer)
            let [rtcClient, remoteNumber, inviteSeq] = this.checkIsNotUndefined(this.rtcClient, this.remoteNumber, this.inviteSeq)
            let { sdp } = await this.createAnswer()
            rtcClient.answer(RtcInviteStatus.ok, inviteSeq, remoteNumber, this.sessionId, sdp)
        }
    }

    /**
   * 当同一个会议又收到offer的时候，尝试重新做一个链接，
   * 直接setoffer服务端有一些问题，使用此方案来处理一下，看看是否可行
   */
    async pickNewConnection() {
        if (this.peerConnection !== undefined) {
            this.closeConnection(this.peerConnection)//关闭connection
        }
        this.peerConnection = this.buildConnection()
        if (this.remoteStream !== undefined) {//当前处于会话过程中
            closeStreamAndTrack(this.remoteStream)//关闭远程的流
            this.remoteStream = undefined
            this.acceptCall()
        }
    }

    checkIsNotUndefined(...x: any[]) {
        for (const item of x) {
            if (item === undefined) {
                throw new Error(`someone is undefined`)
            }
        }
        return x
    }
}