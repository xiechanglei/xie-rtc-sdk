/**
 * 销毁dom上渲染的流
 */
export const releaseStreamFromContainer = (container?: HTMLVideoElement | HTMLAudioElement) => {
    if (container !== undefined) {
        container.pause()
        container.removeAttribute("src")
        container.removeAttribute("srcObject")
    }
}
/**
 * 将流渲染到dom上
 */
export const renderStreamToContainer = (stream?: MediaStream, container?: HTMLVideoElement | HTMLAudioElement) => {
    if (stream !== undefined && container !== undefined) {
        container.srcObject = stream
        container.play()
    }
}

/**
 * 关闭流
 */
export const closeStreamAndTrack = (stream: MediaStream) => {
    stream.onaddtrack = null;
    stream.onremovetrack = null;
    stream.getTracks().forEach(track => {
        stream?.removeTrack(track)
        track.onended = null
        track.onmute = null
        track.onunmute = null
        track.stop()
    })
}