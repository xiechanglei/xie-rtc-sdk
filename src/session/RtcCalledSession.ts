import { RtcCalledType } from './RtcCalledTyped';
import { RtcClient } from "../client/RtcClient"
import { RtcAbstractSession } from "./RtcAbstractSession"
/**
 * 被叫session
 */
export class RtcCalledSession extends RtcAbstractSession {
    callType: RtcCalledType = RtcCalledType.unknown
    //invite seq

    constructor(rtcClient: RtcClient, sessionId: string, remoteNumber: string, offerSdp: string, seq: number) {
        super(rtcClient, sessionId, remoteNumber)
        this.inviteSeq = seq
        //不直接setofer，改成存一下，用户接受的时候再set下去，因为对接sip电话的时候，用户还没有同意，流就过来了
        // this.setOffer(offerSdp)
        this.inviteOffer = offerSdp
        const lines = offerSdp.split("\r\n")
        const hasAudio = lines.find(line => line.startsWith("m=audio"))
        const hasVideo = lines.find(line => line.startsWith("m=video"))
        this.callType = hasAudio && hasVideo ? RtcCalledType.audioVideo : hasAudio ? RtcCalledType.audio : hasVideo ? RtcCalledType.video : RtcCalledType.unknown
    }
}