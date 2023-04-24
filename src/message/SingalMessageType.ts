/**
 * 信令服务器的消息头
 * @author xiechanglei
 */
export enum SignalMessageType {
    MESSAGE_TYPE_REGISTER = "REGISTER",//注册
    MESSAGE_TYPE_INVITE = "INVITE",//邀请会话
    MESSAGE_TYPE_ICE = "ICE",//ice探测消息发送
    MESSAGE_TYPE_INFO = "INFO",
    MESSAGE_TYPE_BYE = "BYE",//挂断
}