/**
 * rtc 会话过程中向上抛出的所有事件
 */
export enum RtcSessionEvent {
    //接收到bye请求
    bye = "bye",
    //接收到远程的流信息
    stream = "stream",
    //会话过程中修改视频流会触发重建invite
    reInvite = "reInvite",
    //本地音频流发生变化，流的变化以及是否启用的变化都会触发
    localAudioChange = "localAudioChange",
    //本地视频流发生变化，流的变化以及是否启用的变化都会触发
    localVideoChange = "localVideoChange",
    //本地流发生变化
    localStreamChange = "localStreamChange"
}