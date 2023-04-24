import { RtcClient } from './client/RtcClient'
import { RtcInviteStatus } from "./session/RtcInviteStatus"

/**
 * create a rtc client 
 * the heartTime and expireTime units are secounds
 */
export const createRtcClient = async (config: { server: string, localNumber: string, heartTime?: number, expireTime?: number }): Promise<RtcClient> => {
    let client = new RtcClient(config)
    await client.reConnect()
    let message = await client.register()
    if (message.status === RtcInviteStatus.ok) {
        return client
    } else {
        client.destory()
        return Promise.reject(message)
    }
}

/**
 * 获取webrtc授权, 只需要调用一次,在合适的场景下使用就可以了
 */
export const authDevice = async () => {
    await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
}

export { RtcClient, RtcInviteStatus }
export { disableLog, enableLog } from "./log/Logger"
export { RtcClientEvent } from "./client/RtcClientEvent"
export { RtcSessionEvent } from './session/RtcSessionEvent'
export { RtcCalledType } from "./session/RtcCalledTyped"
export { releaseStreamFromContainer, renderStreamToContainer } from "./peer/StreamUtil"