import { QyElementDirty, createElement, wrap2QyElement } from "./qingyan.esm.js"
import { createRtcClient, releaseStreamFromContainer, renderStreamToContainer, RtcClientEvent, RtcSessionEvent, enableLog } from "../dist/index.esm.js"
// enableLog()
class App extends QyElementDirty {
    fitting() {
        this.leftSide = createElement("div").appendTo(this)
        this.configELement = new AppConfig().appendTo(this.leftSide)
        this.messageBar = new MessageBar().appendTo(this.leftSide)
        this.videoContainer = createElement().appendTo(this)
        this.localPlayer = new StreamPlayer(true).appendTo(this.videoContainer)
        this.remotePlayer = new StreamPlayer().appendTo(this.videoContainer)
        this.addMessage("增加白名单：" + window.location.origin)
        this.addMessage("安全策略配置地址：chrome://flags/#unsafely-treat-insecure-origin-as-secure")
        this.addMessage("非https域名形式访问，请在浏览器安全策略中添加白名单")
    }

    decorate() {
        this.style({ height: "100vh", width: "100vw", display: "flex" })
        if (window.innerWidth < 900) {
            this.style({ flexDirection: "column" })
            this.leftSide.style({ flexShrink: "0", display: "flex", width: "100%", flexDirection: "column" })
            this.messageBar.show(false)
            this.videoContainer.style({ flexGrow: "1", display: "flex", width: "100%", flexDirection: "row", background: "#333", color: "#fff" })
            this.localPlayer.style({ width: "50%" })
            this.remotePlayer.style({ width: "50%" })
        } else {
            this.leftSide.style({ width: "550px", flexShrink: "0", display: "flex", height: "100%", flexDirection: "column" })
            this.messageBar.style({ flexGrow: 1, overflowY: "auto" })
            this.videoContainer.style({ flexGrow: "1", display: "flex", height: "100%", flexDirection: "column", background: "#333", color: "#fff" })
            this.localPlayer.style({ height: "50%" })
            this.remotePlayer.style({ height: "50%" })
        }

    }

    motion() {
        this.on("login", ({ data }) => this.doLogin(data))
        this.on("voiceCall", ({ data }) => this.doVoiceCall(data))
        this.on("videoCall", ({ data }) => this.doVideoCall(data))
        this.on("deskCall", ({ data }) => this.doDeskCall(data))
    }

    addMessage(message, type = "info") {
        this.messageBar.appendMessage(message, type)
    }

    async doDeskCall({ remoteNumber }) {
        if (this.rtcClient === undefined) {
            this.addMessage("请先登录", "error")
            return
        }
        if (this.meeting !== undefined) {
            this.addMessage("您正处于会议中，请挂断当前会议之后再重试", "error")
            return
        }
        if (remoteNumber === "") {
            this.addMessage("呼叫号码不能为空", "error")
            return
        }
        this.addMessage("开始呼叫用户:" + remoteNumber)
        this.configELement.deActiveBtn(this.configELement.voiceCallBtn, this.configELement.videoCallBtn)
        this.meeting = this.rtcClient.createSession(remoteNumber)
        this.meeting.on(RtcSessionEvent.localStreamChange, (data) => {
            console.log("local stream", data)
            this.addMessage("收到本地流")
            this.localPlayer.playStream(data)
        })
        this.meeting.on(RtcSessionEvent.stream, (data) => {
            console.log("remote stream", data)
            this.addMessage("收到远程流")
            this.remotePlayer.playStream(data)
        })
        this.meeting.on(RtcSessionEvent.bye, () => {
            this.addMessage("会话结束")
            this.meeting = undefined
            this.configELement.activeBtn(this.configELement.voiceCallBtn, this.configELement.videoCallBtn, this.configELement.deskCallBtn)
        })
        let data = await this.meeting.getAllInputResource()
        if (data.audio.length === 0) {
            this.addMessage("没有检测到麦克风", "error")
            this.meeting.destory()
            this.meeting = undefined
            this.configELement.activeBtn(this.configELement.voiceCallBtn, this.configELement.videoCallBtn, this.configELement.deskCallBtn)
            return
        } else {
            await this.meeting.useAudio()
        }
        await this.meeting.useDeskTopVideo()
        this.meeting.start()
    }


    async doVideoCall({ remoteNumber }) {
        if (this.rtcClient === undefined) {
            this.addMessage("请先登录", "error")
            return
        }
        if (this.meeting !== undefined) {
            this.addMessage("您正处于会议中，请挂断当前会议之后再重试", "error")
            return
        }
        if (remoteNumber === "") {
            this.addMessage("呼叫号码不能为空", "error")
            return
        }
        this.addMessage("开始呼叫用户:" + remoteNumber)
        this.configELement.deActiveBtn(this.configELement.voiceCallBtn, this.configELement.videoCallBtn, this.configELement.deskCallBtn)
        this.meeting = this.rtcClient.createSession(remoteNumber)
        this.meeting.on(RtcSessionEvent.localStreamChange, (data) => {
            console.log("local stream", data)
            this.addMessage("收到本地流")
            this.localPlayer.playStream(data)
        })
        this.meeting.on(RtcSessionEvent.stream, (data) => {
            console.log("remote stream", data)
            this.addMessage("收到远程流")
            this.remotePlayer.playStream(data)
        })
        this.meeting.on(RtcSessionEvent.bye, () => {
            this.addMessage("会话结束")
            this.meeting = undefined
            this.configELement.activeBtn(this.configELement.voiceCallBtn, this.configELement.videoCallBtn, this.configELement.deskCallBtn)
        })
        let data = await this.meeting.getAllInputResource()
        if (data.audio.length === 0) {
            this.addMessage("没有检测到麦克风", "error")
            this.meeting.destory()
            this.meeting = undefined
            this.configELement.activeBtn(this.configELement.voiceCallBtn, this.configELement.videoCallBtn, this.configELement.deskCallBtn)
            return
        } else {
            await this.meeting.useAudio()
        }
        if (data.video.length === 0) {
            await this.meeting.useDeskTopVideo()
        } else {
            await this.meeting.useDeviceVideo()
        }
        this.meeting.start()
    }

    async doVoiceCall({ remoteNumber }) {
        if (this.rtcClient === undefined) {
            this.addMessage("请先登录", "error")
            return
        }
        if (this.meeting !== undefined) {
            this.addMessage("您正处于会议中，请挂断当前会议之后再重试", "error")
            return
        }
        if (remoteNumber === "") {
            this.addMessage("呼叫号码不能为空", "error")
            return
        }
        this.addMessage("开始呼叫用户:" + remoteNumber)
        this.configELement.deActiveBtn(this.configELement.voiceCallBtn, this.configELement.videoCallBtn, this.configELement.deskCallBtn)
        this.meeting = this.rtcClient.createSession(remoteNumber)
        this.meeting.on(RtcSessionEvent.localStreamChange, (data) => {
            console.log("local stream", data)
            this.addMessage("收到本地流")
            this.localPlayer.playStream(data)
        })
        this.meeting.on(RtcSessionEvent.stream, (data) => {
            console.log("remote stream", data)
            this.addMessage("收到远程流")
            this.remotePlayer.playStream(data)
        })
        this.meeting.on(RtcSessionEvent.bye, () => {
            this.addMessage("会话结束")
            this.meeting = undefined
            this.configELement.activeBtn(this.configELement.voiceCallBtn, this.configELement.videoCallBtn, this.configELement.deskCallBtn)
        })

        let data = await this.meeting.getAllInputResource()
        if (data.audio.length === 0) {
            this.addMessage("没有检测到麦克风", "error")
            this.meeting.destory()
            this.meeting = undefined
            this.configELement.activeBtn(this.configELement.voiceCallBtn, this.configELement.videoCallBtn, this.configELement.deskCallBtn)
            return
        }
        await this.meeting.useAudio();
        this.meeting.start()
    }

    async doLogin({ server, localNumber }) {
        if (this.rtcClient !== undefined) {
            this.addMessage("当前已经是登录状态", "error")
            return
        }
        if (localNumber === "") {
            this.addMessage("本地号码不能为空！", "error")
            return
        }
        try {
            this.addMessage(`准备链接服务器：${server}`)
            this.rtcClient = await createRtcClient({ server, localNumber })
            this.configELement.activeBtn(this.configELement.voiceCallBtn, this.configELement.videoCallBtn, this.configELement.deskCallBtn)
            this.configELement.deActiveBtn(this.configELement.loginBtn)
            this.addMessage(`用户${localNumber}链接服务器成功`)
            this.rtcClient.on(RtcClientEvent.disconnected, () => {
                this.addMessage(`服务器断开链接`, "error")
                this.configELement.deActiveBtn(this.configELement.voiceCallBtn, this.configELement.videoCallBtn, this.configELement.deskCallBtn)
                this.configELement.activeBtn(this.configELement.loginBtn)
                this.rtcClient = undefined
                this.meeting = undefined
            })
            this.rtcClient.on(RtcClientEvent.invite, async (session) => {
                this.addMessage(`接受到会话邀请：${session.remoteNumber}`)
                this.meeting = session
                this.meeting.on(RtcSessionEvent.localStreamChange, (data) => {
                    console.log("local stream", data)
                    this.addMessage("收到本地流")
                    this.localPlayer.playStream(data)
                })
                this.meeting.on(RtcSessionEvent.stream, (data) => {
                    console.log("remote stream", data)
                    this.addMessage("收到远程流")
                    this.remotePlayer.playStream(data)
                })
                this.meeting.on(RtcSessionEvent.bye, () => {
                    this.addMessage("会话结束", "error")
                    this.meeting = undefined
                    this.configELement.activeBtn(this.configELement.voiceCallBtn, this.configELement.videoCallBtn, this.configELement.deskCallBtn)
                })
                let data = await this.meeting.getAllInputResource()
                if (data.audio.length === 0) {
                    this.addMessage("没有检测到麦克风,开启仅接受音频模式", "error")
                } else {
                    await this.meeting.useAudio()
                }
                if (data.video.length === 0) {
                    await this.meeting.useDeskTopVideo()
                } else {
                    await this.meeting.useDeviceVideo()
                }
                await this.meeting.acceptCall();
                this.configELement.deActiveBtn(this.configELement.voiceCallBtn, this.configELement.videoCallBtn, this.configELement.deskCallBtn)
            })
        } catch (error) {
            this.addMessage("链接服务器失败", "error")
        }
    }
}


class StreamPlayer extends QyElementDirty {
    fitting(muted) {
        this.videoPlayer = createElement("video").show(false).appendTo(this)
        this.audioPlayer = createElement("audio").show(false).appendTo(this)
        if (muted) {
            this.videoPlayer.on("play", () => {
                this.videoPlayer.current.muted = true
            })
            this.audioPlayer.on("play", () => {
                this.audioPlayer.current.muted = true
            })
        }
    }
    playStream({ audioOnly, stream }) {
        if (audioOnly) {
            renderStreamToContainer(stream, this.audioPlayer.current)
            this.audioPlayer.show()
            releaseStreamFromContainer(this.videoPlayer.current)
            this.videoPlayer.show(false)
        } else {
            renderStreamToContainer(stream, this.videoPlayer.current)
            this.videoPlayer.show()
            releaseStreamFromContainer(this.audioPlayer.current)
            this.audioPlayer.show(false)

        }
    }

    decorate() {
        this.videoPlayer.style({ width: "100%", height: "100%", objectFit: "contain" })
        this.audioPlayer.style({ width: "100%", height: "100%" })
        this.style({ overflow: "hidden" })
    }

}

class MessageBar extends QyElementDirty {

    appendMessage(message, type = "info") {
        let messageBlock = createElement("div").prependTo(this)
        let time = new Date();
        let timeStr = `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`
        createElement("span").append(timeStr).appendTo(messageBlock).style({ marginRight: "20px", color: "#777" })
        createElement("span").append(message).appendTo(messageBlock).style({ color: type === "info" ? "#009933" : "red" })
        messageBlock.style({ margin: "10px" })
        this.current.scrollTop = 0
    }

    decorate() {
        this.style({ fontSize: "12px" })
    }
}

class AppConfig extends QyElementDirty {
    fitting() {
        let data = this.getStoredData({ server: "wss://rtc.timeone.top/signServer" })
        this.serverElement = new InputItem({ label: "服务器地址", placeholder: "请输入webrtc服务器地址", defaultValue: data.server }).appendTo(this)
        this.localUserElement = new InputItem({ label: "本地号码", placeholder: "请输入您的号码用以登录", defaultValue: data.localNumber }).appendTo(this)
        this.remoteUserElement = new InputItem({ label: "远程号码", placeholder: "请输入您的号码用以呼叫", defaultValue: data.remoteNumber }).appendTo(this)
        this.btnGroup = createElement().appendTo(this)
        this.loginBtn = createElement("button").append("登录").appendTo(this.btnGroup)
        this.voiceCallBtn = createElement("button").append("语音呼叫").appendTo(this.btnGroup)
        this.videoCallBtn = createElement("button").append("音视频呼叫").appendTo(this.btnGroup)
        this.deskCallBtn = createElement("button").append("桌面流呼叫").appendTo(this.btnGroup)
    }

    activeBtn(...btns) {
        btns.forEach(btn => {
            btn.style({ background: "#009933", cursor: "pointer" })
            btn.attr({ disabled: undefined })
        })
    }

    deActiveBtn(...btns) {
        btns.forEach(btn => {
            btn.style({ background: "#aaa", cursor: "not-allowed" })
            btn.attr({ disabled: "" })
        })
    }

    decorate() {
        this.style({ padding: "10px" })
        this.btnGroup.style({ display: "flex", "justify-content": "space-around", marginTop: "10px", flexWrap: "wrap" })
        this.loginBtn.style({ cursor: "pointer", background: "#009933", border: "none", color: "#fff", padding: "10px 20px", borderRadius: "3px", marginTop: "10px" })
        this.voiceCallBtn.style({ background: "#009933", border: "none", color: "#fff", padding: "10px 20px", borderRadius: "3px", marginTop: "10px" })
        this.videoCallBtn.style({ background: "#009933", border: "none", color: "#fff", padding: "10px 20px", borderRadius: "3px", marginTop: "10px" })
        this.deskCallBtn.style({ background: "#009933", border: "none", color: "#fff", padding: "10px 20px", borderRadius: "3px", marginTop: "10px" })
        if (window.innerWidth < 900) {
            this.loginBtn.style({ padding: "10px" })
            this.voiceCallBtn.style({ padding: "10px" })
            this.videoCallBtn.style({ padding: "10px" })
            this.deskCallBtn.style({ padding: "10px" })
        }



        this.deActiveBtn(this.voiceCallBtn, this.videoCallBtn, this.deskCallBtn)
    }

    motion() {
        this.loginBtn.on("click", () => this.dispatch("login", { data: this.getDataAndStore() }))
        this.voiceCallBtn.on("click", () => this.dispatch("voiceCall", { data: this.getDataAndStore() }))
        this.videoCallBtn.on("click", () => this.dispatch("videoCall", { data: this.getDataAndStore() }))
        this.deskCallBtn.on("click", () => this.dispatch("deskCall", { data: this.getDataAndStore() }))
    }
    getDataAndStore() {
        let data = {}
        data.server = this.serverElement.getValue()
        data.localNumber = this.localUserElement.getValue()
        data.remoteNumber = this.remoteUserElement.getValue()
        sessionStorage.setItem("rtc_data", JSON.stringify(data))
        localStorage.setItem("rtc_server", data.server)
        return data
    }

    getStoredData(defaultValue) {
        let data = JSON.parse(sessionStorage.getItem("rtc_data")) ?? {}
        let server = localStorage.getItem("rtc_server") ?? ""
        if (server !== "") {
            data.server = server
        }
        console.log(data)
        return { ...defaultValue, ...data }
    }
}

class InputItem extends QyElementDirty {
    fitting({ label, defaultValue, placeholder }) {
        this.labelElement = createElement("span").append(`${label}:`).appendTo(this)
        this.inputElement = createElement("input").appendTo(this)
        if (defaultValue !== undefined) {
            this.inputElement.current.value = defaultValue
        }
        if (placeholder !== undefined) {
            this.inputElement.attr({ placeholder })
        }
    }
    decorate() {
        this.style({ margin: "10px", display: "flex", alignItems: "center" })
        this.labelElement.style({ width: "100px", display: "inline-block" })
        this.inputElement.style({ height: "30px", flexGrow: "1", color: "#333", padding: "0 10px", borderRadius: "3px", border: "1px dashed #ccc", outline: "none" })
    }

    getValue() {
        return this.inputElement.current.value
    }
}

new App().appendTo(document.body)

wrap2QyElement(document.body).style({ margin: "0", fontSize: "14px" })