/**
 * 流程:初始化=>获取本地流=>发送请求=>收到应答=>建立连接=>收到视频
 */
export enum RtcSessionStatus {

    // SendInvite = 2,//发送请求
    // SendInviteFailed = -2,//发送请求失败  网络层通信失败|无权限|被拒绝|超时

    // Connecting = 3,//建立连接中
    // ConnectingFailed = -3,//连接建立失败

    // RecivedStream = 4,//连接建立成功，接收到视频


}