import { RtcSessionEvent } from './../session/RtcSessionEvent';
import { RtcClientEvent } from './RtcClientEvent';
import { SignalMessageType } from './../message/SingalMessageType'
import { nanoid } from 'nanoid'
import { RtcSession } from './../session/RtcSession'
import { RtcClientBase } from './RtcClientBase'
import { RtcCalledSession } from '../session/RtcCalledSession'
import { RtcAbstractSession } from '../session/RtcAbstractSession'
export class RtcClient extends RtcClientBase {

    allSession: RtcAbstractSession[] = []

    //开启一个视频呼叫会话
    createSession(remoteNumber?: string): RtcSession {
        let session = new RtcSession(this, nanoid(), remoteNumber)
        this.allSession.push(session)
        return session
    }

    //处理一些服务端主动发送来的消息
    processMessage(data: any) {
        let { req } = data
        if (req === SignalMessageType.MESSAGE_TYPE_INVITE) {//there is a calling
            let session = this.allSession.find(se => se.sessionId == data.cid)
            if (session !== undefined) {//resetoffer
                session.inviteSeq = data.seq
                session.inviteOffer = data.sdp
                //先直接同意吧，服务端不会在没有answer的时候发这个reinvite，后面改成自己这边做状态控制
                session.acceptCall()
                // session.emit(RtcSessionEvent.reInvite)
                // session.pickNewConnection()
            } else {//new session
                session = new RtcCalledSession(this, data.cid, data.from, data.sdp, data.seq)
                this.allSession.push(session)
                this.emit(RtcClientEvent.invite, session)
            }
        } else if (req === SignalMessageType.MESSAGE_TYPE_ICE) {//recive ice request
            this.allSession.find(sess => sess.sessionId === data.cid)?.reciveIceRequest(data)
        } else if (req === SignalMessageType.MESSAGE_TYPE_BYE) {//recive bye request
            let session = this.allSession.find(sess => sess.sessionId === data.cid)
            if (session !== undefined) {
                session.emit(RtcSessionEvent.bye)
                session.destory()
            }
        }
    }

    destory() {
        if (this.allSession !== undefined) {
            this.allSession.forEach(session => {
                session.destory()
            });
        }
        super.destory()
    }

    removeSession(session: RtcAbstractSession) {
        if (this.allSession !== undefined) {
            this.allSession = this.allSession.filter(sess => sess.sessionId !== session.sessionId)
        }
    }

    onDisConnected() {
        super.onDisConnected()
        this.destory()
    }

}