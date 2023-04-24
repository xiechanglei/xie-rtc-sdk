/**
 * rtc 会话过程中向上抛出的所有事件
 */
export enum RtcCalledType {
    //接收到bye请求
    audio = "audio",//音频呼叫
    video = "video",//视频呼叫
    audioVideo = "audioVideo",//音视频呼叫
    unknown = "unknown"//未知
}