import { RtcInviteStatus } from './../session/RtcInviteStatus'
import { SignalMessageType } from "../message/SingalMessageType"
import { SignalMessage } from "../message/SignalMessage"
import { RtcSignalServer } from "./RtcSignalServer"

/**
 * 信令请求Api
 */
export abstract class RtcSignalApi extends RtcSignalServer {

    /**
     * send register message to the server
     */
    async register(): Promise<any> {
        let message = new SignalMessage(SignalMessageType.MESSAGE_TYPE_REGISTER, this.localNumber, this.localNumber, { "expire": this.expireTime })
        return this.sendRespondableMessage(message)
    }

    /**
     * send a invite request to user
     * @param user the remote user who you want invite 
     * @param cid the session id
     * @param sdp  sdp content
     * @returns 
     */
    async invite(user: string, cid: string, sdp?: string): Promise<any> {
        return this.sendRespondableMessage(new SignalMessage(SignalMessageType.MESSAGE_TYPE_INVITE, this.localNumber, user, { cid, sdp }))
    }

    /**
     * send a ice request to user
     * @param user the remote user
     * @param cid  session id
     * @param ice ice message
     * @returns 
     */
    sendIce(user: string, cid: string, ice: RTCIceCandidate) {
        // return this.sendMessage(new SignalMessage(SignalMessageType.MESSAGE_TYPE_ICE, this.localNumber, user, { cid, ice: JSON.stringify(ice) }))
    }

    /**
     * send  bye message
     * @param user the remote user
     * @param cid session id
     */
    sendBye(user: string, cid: string) {
        return this.sendMessage(new SignalMessage(SignalMessageType.MESSAGE_TYPE_BYE, this.localNumber, user, { cid }))
    }

    /**
     *  answer message
     * @param status  answer status
     * @param seq  the seq number from offer
     * @param to  the remote offer user
     * @param cid  session id
     * @param sdp sdp content
     */
    answer(status: RtcInviteStatus, seq: number, to: string, cid: string, sdp?: string) {
        this.sendMessage({ status, seq, from: to, to: this.localNumber, cid, sdp })
    }

}