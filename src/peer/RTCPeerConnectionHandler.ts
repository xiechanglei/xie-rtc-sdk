import { RtcSessionEvent } from './../session/RtcSessionEvent';
import { log, error } from '../log/Logger'
import { UscRtcProtocol } from '../session/UscRtcProtocol'
import LocalStreamHandler from './LocalStreamHandler'
import { closeStreamAndTrack } from './StreamUtil';

/**
 * 链接流程
 * https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling
 * TODO 1.音频呼叫
 * TODO 2.会话的过程中切换流
 */
export default abstract class RTCPeerConnectionHandler extends LocalStreamHandler {
    //peers
    peerConnection?: RTCPeerConnection

    //custorm codec
    videoCodecs: RTCRtpCodecCapability[] = []
    audioCodecs: RTCRtpCodecCapability[] = []
    audioReciveCodecs: RTCRtpCodecCapability[] = []
    remoteStream?: MediaStream
    emitStreamTimeout?: NodeJS.Timeout;
    constructor() {
        super()
        this.preferCodec()
        this.peerConnection = this.buildConnection()
    }

    /**生成一个peerconnection */
    buildConnection() {
        //指定dtls 证书
        // let cert = await RTCPeerConnection.generateCertificate({
        //     name: 'RSASSA-PKCS1-v1_5',
        //     hash: 'SHA-256',
        //     modulusLength: 2048,
        //     publicExponent: new Uint8Array([1, 0, 1])
        // })
        // this.peerConnection = new RTCPeerConnection({ certificates: [cert] });
        let peerConnection = new RTCPeerConnection()
        peerConnection.addEventListener("connectionstatechange", (e) => log("connectionstatechange", e))
        peerConnection.addEventListener("icecandidate", (e) => { log("icecandidate", e); this.onIceCandidate(e) })
        peerConnection.addEventListener("datachannel", (e) => log("datachannel", e))
        peerConnection.addEventListener("icecandidateerror", (e) => log("icecandidateerror", e))
        peerConnection.addEventListener("iceconnectionstatechange", (e) => log("iceconnectionstatechange", e))
        peerConnection.addEventListener("icegatheringstatechange", (e) => log("icegatheringstatechange", e))
        peerConnection.addEventListener("negotiationneeded", (e) => log("negotiationneeded", e))
        peerConnection.addEventListener("signalingstatechange", (e) => log("signalingstatechange", e))
        peerConnection.addEventListener("track", (e) => this.reciveTrack(e))
        return peerConnection
    }



    //当流本地的流发生变化的时候，判断当前是否处于会话状态，从而进行处理
    async localTractChange(prev: MediaStreamTrack | undefined, next: MediaStreamTrack | undefined) {
        if (this.remoteStream !== undefined && this.peerConnection !== undefined) {//如果处于会话过程中，那么判断之前的sender是否含有该类型的流，如果存在那么就替换，如果不存在，重新发offer
            if (next !== undefined) { //修改流
                let prevSender = this.peerConnection.getSenders().find(sender => sender.track?.kind === next.kind)
                if (prevSender !== undefined) {
                    prevSender.replaceTrack(next)
                } else {
                    //TODO
                    //reoffer 重发offer的时候是三个sender？ 然后再peerConnection.removetrack
                }
            } else { //删除流，如果原先存在对应类型的流，直接stop？还是reoffer
                let prevSender = this.peerConnection.getSenders().find(sender => sender.track?.kind === prev?.kind)
                if (prevSender !== undefined) {
                    this.peerConnection.removeTrack(prevSender)
                }
            }
        }

        //TODO 
        if (next !== undefined) {
            next.onended = (e) => log("local track end", e)
            next.onmute = (e) => {
                log("local mute", e)
                this.emitLocalStreamChange()
            }
            next.onunmute = (e) => {
                log("local unmute", e)
                this.emitLocalStreamChange()
            }
        }

        this.releaseTrack(prev)
        this.emitLocalStreamChange()
    }

    /**
     * 是否处于会议当中
     */
    isInMeeting() {
        return this.remoteStream !== undefined
    }

    hasRemoteVideo(strem?: MediaStream) {
        return strem?.getVideoTracks().some(track => track.muted === false && track.readyState === "live") ?? false
    }


    emitLocalStreamChange() {
        this.emit(RtcSessionEvent.localStreamChange, { audioOnly: !this.hasRemoteVideo(this.localMediaStream), stream: this.localMediaStream })
    }

    /**
     * 通知用户远程的流发生了变化
     */
    emitRemoteStreamChange() {
        this.emit(RtcSessionEvent.stream, { audioOnly: !this.hasRemoteVideo(this.remoteStream), stream: this.remoteStream })
    }

    /**
   * 做个100ms的延时来缓冲流的变化
   */
    trigerStreamChange(timeout: number = 100) {
        if (this.emitStreamTimeout !== undefined) {
            clearTimeout(this.emitStreamTimeout)
        }
        this.emitStreamTimeout = setTimeout(() => {
            this.emitRemoteStreamChange()
            this.emitStreamTimeout = undefined
        }, timeout)
    }

    /**
     * 接受track时候的处理事件
     */
    reciveTrack(e: RTCTrackEvent) {
        log("recive track", e)
        if (this.remoteStream === undefined) {
            this.remoteStream = new MediaStream()
        }
        e.track.addEventListener("ended", () => this.trigerStreamChange())
        e.track.addEventListener("mute", () => this.trigerStreamChange(3000))
        e.track.addEventListener("unmute", () => this.trigerStreamChange(10))
        this.remoteStream.addTrack(e.track)
        this.trigerStreamChange()
    }


    abstract onIceCandidate(e: RTCPeerConnectionIceEvent): any;
    /**
     * use custorm codec , 
     * default is H264/PCMA,
     * TODO 火狐浏览器没有RTCRtpSender.getCapabilities相关方法，是否在createoffer之后进行sdp协议处理来适配编码工作
     * @param videoCodec 
     * @param audioCodec 
     */
    preferCodec(videoCodec = "H264", audioCodec = "PCMA") {
        this.videoCodecs = []
        let senderVideoCapabilities = RTCRtpSender.getCapabilities("video")
        if (senderVideoCapabilities !== null) {
            this.videoCodecs.push(...senderVideoCapabilities.codecs.filter(codec => codec.mimeType === `video/${videoCodec}`))
        }
        let reciverVideoCapabilities = RTCRtpReceiver.getCapabilities("video")
        if (reciverVideoCapabilities !== null) {
            this.videoCodecs.push(...reciverVideoCapabilities.codecs.filter(codec => codec.mimeType === `video/${videoCodec}`))
        }
        this.audioCodecs = []
        let senderAudioCapabilities = RTCRtpSender.getCapabilities("audio")
        if (senderAudioCapabilities !== null) {
            this.audioCodecs.push(...senderAudioCapabilities.codecs.filter(codec => codec.mimeType === `audio/${audioCodec}`))
        }
        let reciverAudioCapabilities = RTCRtpReceiver.getCapabilities("audio")
        if (reciverAudioCapabilities !== null) {
            this.audioCodecs.push(...reciverAudioCapabilities.codecs.filter(codec => codec.mimeType === `audio/${audioCodec}`))
        }
    }

    trackIsInPeerConnection(track: MediaStreamTrack) {
        return this.peerConnection?.getSenders().some(sender => sender.track?.id === track.id) ?? false
    }
    /**
     * 将本地的track更新到peereonnection 中
     * 只接受流:没有本地stream rtcPeerConnection.addTransceiver("video", {direction: "recvonly"});rtcPeerConnection.addTransceiver("audio", {direction: "recvonly"});
     * recvonly/sendonly/sendrecv/inactive
     * 
     */
    updateTracks() {
        if (this.peerConnection === undefined || this.peerConnection.signalingState === 'closed') {
            throw new Error("session is closed !")
        }
        if (this.audioTrack === undefined && this.videoCodecs === undefined) {
            throw new Error("no input found")
        }

        //这里addtrack不指定stream，接收的地方就得ontrack，指定stream，表示由RTCPeerConnection 接管流的管理
        if (this.audioTrack !== undefined && !this.trackIsInPeerConnection(this.audioTrack)) {
            try {
                this.peerConnection.addTrack(this.audioTrack)
            } catch (error) {
            }
        }
        if (this.videoTrack !== undefined && !this.trackIsInPeerConnection(this.videoTrack)) {
            try {
                this.peerConnection.addTrack(this.videoTrack)
            } catch (error) {
            }
        }
        //修改视频编码
        try {
            this.peerConnection.getTransceivers().forEach(transceiver => {
                if (transceiver.sender.track !== null) {
                    if (transceiver.sender.track.kind === "video") {
                        transceiver.setCodecPreferences([...this.videoCodecs])
                    } else if (transceiver.sender.track.kind === "audio") {
                        transceiver.setCodecPreferences([...this.audioCodecs])
                    }
                }
            })
        } catch (errorMessage) {
            error("preferCodec error", errorMessage, this.audioCodecs, this.videoCodecs)
        }
    }


    /**
     * create and format offer
     */
    async createOffer() {
        if (this.peerConnection === undefined) {
            throw new Error("session is closed !")
        }
        this.updateTracks()
        let offer = await this.peerConnection.createOffer()
        offer = UscRtcProtocol.formatOffer(offer)
        await this.peerConnection.setLocalDescription(offer)
        return offer
    }

    /**
     * set offer 
     */
    async setOffer(sdp: string) {
        if (this.peerConnection === undefined) {
            throw new Error("session is closed !")
        }
        await this.peerConnection.setRemoteDescription({ type: "offer", sdp })
    }

    /**
     * create answer
     */
    async createAnswer() {
        if (this.peerConnection === undefined) {
            throw new Error("session is closed !")
        }
        this.updateTracks()
        let answer = await this.peerConnection.createAnswer()
        this.peerConnection.setLocalDescription(answer)
        return answer
    }

    /**
     * set answer
     */
    async setAnswer(sdp: string) {
        if (this.peerConnection === undefined) {
            throw new Error("session is closed !")
        }
        await this.peerConnection.setRemoteDescription({ type: "answer", sdp })
    }


    /**
     * set ice candidate
     * @param ice 
     */
    setRemoteIce(ice: RTCIceCandidateInit) {
        if (this.peerConnection === undefined) {
            throw new Error("session is closed !")
        }
        let candidate = new RTCIceCandidate(ice)
        this.peerConnection.addIceCandidate(candidate)
    }

    /**
     * 关闭链接
     */
    closeConnection(peerConnection: RTCPeerConnection) {
        peerConnection.close()
        peerConnection.ontrack = null;
        peerConnection.onicecandidate = null;
        peerConnection.oniceconnectionstatechange = null;
        peerConnection.onsignalingstatechange = null;
        peerConnection.onicegatheringstatechange = null;
        peerConnection.onnegotiationneeded = null;
        peerConnection.onicecandidateerror = null;
        peerConnection.ondatachannel = null;
        peerConnection.onconnectionstatechange = null

    }

    /**
     * 销毁会话
     */
    close() {
        super.close()
        if (this.peerConnection !== undefined) {
            this.closeConnection(this.peerConnection)
            this.peerConnection = undefined
        }
        if (this.remoteStream !== undefined) {
            closeStreamAndTrack(this.remoteStream)
        }
    }
}