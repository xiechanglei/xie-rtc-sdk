import { renderStreamToContainer } from './StreamUtil';
import { RtcSessionEvent } from '../session/RtcSessionEvent';
import EventEmitter from 'events'
import { log } from '../log/Logger'



/**
 * devicechange  设备输入变化
 */
export default abstract class LocalStreamHandler extends EventEmitter {
    constructor() {
        super()
        super.setMaxListeners(0)
    }
    //本地流媒体
    audioTrack: MediaStreamTrack | undefined
    videoTrack: MediaStreamTrack | undefined
    localMediaStream: MediaStream | undefined = new MediaStream()
    //https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings
    videoConstrains = { width: { max: 1920 }, height: { max: 1080 }, frameRate: { ideal: 10, max: 30 } }
    audioConstrants = { noiseSuppression: true, echoCancellation: true, autoGainControl: true }

    /**
     * 释放track
     */
    releaseTrack(track: MediaStreamTrack | undefined) {
        if (track !== undefined) {
            this.localMediaStream?.removeTrack(track)
            track.stop()
        }
    }

    /**
     * 注册设备变化事件，记得组件销毁的时候remove
     */
    addDeviceChangeListener(listener: any) {
        navigator.mediaDevices.addEventListener("devicechange", listener)
    }
    removeDeviceChangeListener(listener: any) {
        navigator.mediaDevices.removeEventListener("devicechange", listener)
    }

    /**
     * 设置本地视频输入流
     */
    setVideoTrack(videoTrack: MediaStreamTrack) {
        this.emit(RtcSessionEvent.localVideoChange, { from: this.videoTrack, to: videoTrack })
        if (this.videoTrack !== videoTrack) {
            this.localMediaStream?.addTrack(videoTrack)
            this.localTractChange(this.videoTrack, videoTrack)
        }
        this.videoTrack = videoTrack
    }


    /**
     * 设置本地音頻输入流
     */
    setAudioTrack(audioTrack: MediaStreamTrack) {
        this.emit(RtcSessionEvent.localAudioChange, { from: this.audioTrack, to: audioTrack })
        if (this.audioTrack !== audioTrack) {
            this.localMediaStream?.addTrack(audioTrack)
            this.localTractChange(this.audioTrack, audioTrack)
        }
        this.audioTrack = audioTrack
    }

    abstract localTractChange(prev: MediaStreamTrack | undefined, next: MediaStreamTrack | undefined): void

    /**
     * 将流渲染到dom上
     */
    renderLocalStreamToContainer(container: HTMLVideoElement | HTMLAudioElement | undefined) {
        renderStreamToContainer(this.localMediaStream, container)
    }

    /**
     * 获取所有的输入设备源
     */
    async getAllInputResource() {
        let all = await navigator.mediaDevices.enumerateDevices();
        return { audio: all.filter(res => res.kind === "audioinput"), video: all.filter(res => res.kind === "videoinput") }
    }

    /**
     * 使用默认的音视频输入源
     */
    async useDefaultDevice(container: HTMLVideoElement | HTMLAudioElement | undefined) {
        let constraints = { audio: true, video: true }
        let stream = await navigator.mediaDevices.getUserMedia(constraints)
        this.setAudioTrack(stream.getAudioTracks()[0])
        this.setVideoTrack(stream.getVideoTracks()[0])
        this.renderLocalStreamToContainer(container)
    }
    /**
     * 设置本地音频输入流
     * https://developer.mozilla.org/zh-CN/docs/Web/API/MediaDevices/getUserMedia
     * @param deviceId 设备id，如果为空，表示使用默认输入设备
     */
    async useAudio(deviceId?: string) {
        let constraints = deviceId === undefined ? { audio: { ...this.audioConstrants }, video: false } : { video: false, audio: { deviceId, ...this.audioConstrants } }
        let stream = await navigator.mediaDevices.getUserMedia(constraints)
        this.setAudioTrack(stream.getAudioTracks()[0])
    }

    /**
     * 使用设备视频流
     */
    async useDeviceVideo(deviceId?: string) {
        let constraints = deviceId === undefined ? { audio: false, video: { ...this.videoConstrains } } : { audio: false, video: { deviceId, ...this.videoConstrains } }
        let stream = await navigator.mediaDevices.getUserMedia(constraints)
        this.setVideoTrack(stream.getVideoTracks()[0])
    }

    /**
     * 使用桌面视频流
     */
    async useDeskTopVideo() {
        let stream = await navigator.mediaDevices.getDisplayMedia({ video: { ...this.videoConstrains }, audio: false })
        this.setVideoTrack(stream.getVideoTracks()[0])
    }
    /**
     * 禁用本地音频输入
     */
    disableAudio() {
        if (this.audioTrack !== undefined && this.audioTrack.enabled) {
            log("local audio status change", this.audioTrack)
            this.audioTrack.enabled = false
            this.setAudioTrack(this.audioTrack)
        }
    }
    /**
     * 启用本地音频输入
     */
    enableAudio() {
        if (this.audioTrack !== undefined && !this.audioTrack.enabled) {
            log("local audio status change", this.audioTrack)
            this.audioTrack.enabled = true
            this.setAudioTrack(this.audioTrack)
        }
    }

    /**
     * 禁用本地视频输入
     */
    disableVideo() {
        if (this.videoTrack !== undefined && this.videoTrack.enabled) {
            log("local video status change", this.videoTrack)
            this.videoTrack.enabled = false
            this.setVideoTrack(this.videoTrack)
        }

    }

    /**
     * 启用本地视频输入
     */
    enableVideo() {
        if (this.videoTrack !== undefined && !this.videoTrack.enabled) {
            log("local video status change", this.videoTrack)
            this.videoTrack.enabled = true
            this.setVideoTrack(this.videoTrack)
        }
    }

    close() {
        this.releaseTrack(this.audioTrack)
        this.releaseTrack(this.videoTrack)
        this.audioTrack = undefined
        this.videoTrack = undefined
        this.localMediaStream = undefined
    }
}