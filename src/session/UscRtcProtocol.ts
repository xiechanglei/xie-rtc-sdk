/**
 * usc webrtc 协议格式
 */

export class UscRtcProtocol {
    static formatOffer(offer: RTCSessionDescriptionInit): RTCSessionDescriptionInit {
        let { sdp } = offer
        if (sdp === undefined) {
            throw new Error("offer sdp is empty")
        }
        sdp = sdp.split("\r\n").filter(lines => lines.indexOf("a=group:BUNDLE") === -1).join("\r\n")
        offer.sdp = sdp
        return offer
    }
}