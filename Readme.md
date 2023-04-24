## 音视频通话 webrtc sdk开发手册 

### 更新日志
#### version 0.3.9 (2022-07-01)
- RtcInviteStatus增加创建会话失败的状态码,notAllowedMedia(415),表示当前主动呼叫的媒体流是不合法的,目前版本的webrtc的媒体服务器,要求至少包含一个音频媒体
#### version 0.3.7 (2022-06-24)
- 全局导出增加authDevice,此方法为工具类型的方法,用以向用户申请摄像头与麦克风设备的使用权限,也可以通过navigator.mediaDevices.getUserMedia({ audio: true, video: true })来自行向浏览器申请相关权限
#### version 0.3.5 (2022-06-17)
- 增加环境噪音控制与回音消除支持
- RtcSession 与 RtcCalledSession 上增加了videoConstrains与audioConstrants,在获取本地流媒体之前进行设置可以用来约束流媒体,如帧率,视频的宽高等
#### version 0.3.4 (2022-06-14)
- RtcCalledSession增加字段callType 标识当前被叫的类型,类型值为RtcCalledType
#### version 0.3.0 (2022-05-17)
- 删除RtcClient中createVideoCall与createAudioCall两个方法，使用createSession代替，原先的接口在名称上区分了会话的类型，但是在实际创建会话之后，并不能代表最终会话的实际类型，因为在session的api中是可以选择输入源的类型的，所以对api进行了语义上的重制
- 删除RtcSession中switchToUserMedia以及switchToDeviceMedia接口
- RtcSession中增加useAudio，useDeviceVideo，useDeskTopVideo以代替上述删除接口，具体接口描述参照下方接口文档
- RtcSession中删除了renderLocalStreamToVideoContainer的方法，增加了renderLocalStreamToContainer，不在局限于只能在video中进行播放，audio也加入了支持
- RtcSession中增加了renderStreamToContainer 和releaseStreamFromContainer的方法，可以便捷的播放媒体流与释放媒体流
- 全局导出模块中增加renderStreamToContainer(stream,container:HTMLVideoElement|HTMLAudioElement) 和 releaseStreamFromContainer(container:HTMLVideoElement|HTMLAudioElement) ，用以简化操作
### 1.安装
```
//使用yarn安装 
yarn add usc-rtc-sdk
//使用npm安装
npm install usc-rtc-sdk
```
### 2.简单使用demo
```javascript
//用户A，演示主叫端的逻辑
import { RtcClient, createRtcClient, RtcSessionEvent, RtcClientEvent } from "usc-rtc-sdk"
const startClientA = async () => {
    //初始化一个webrtc的sdk客户端，这里的本地号码是7001,server对应的是信令服务器地址由线下对接进行提供
    let client  = await createRtcClient({ server: "xxxxxxx", localNumber: "7001" })
    //创建一个针对于7002的视频会话
    let session = client.createSession("7002")
    //这里演示给会话注册一个接受到远端视频流的事件监听
    session.on(RtcSessionEvent.stream, (data) => {
        //data 的stream 属性就是视频流信息，你可以像下面这样把他放到一个视频容器下进行播放
        let playerContainer = document.getElementById("player")
        playerContainer.srcObject = data.stream
        playerContainer.play()
    })
    //给会话注册断开事件，
    session.on(RtcSessionEvent.bye, () => alert("BYE!!!!!!"))
    //给会话选择本端所提供的流，这里使用的是摄像头的流信息
    await session.useDefaultDevice(document.getElementById("localPalyer") as HTMLVideoElement)
    //开始呼叫
    session.start()
}
startClientA()


//====================================
//用户B，演示被叫端的逻辑
const startClientB = async (client: RtcClient) => {
     //初始化一个webrtc的sdk客户端，这里的本地号码是7021,server对应的是信令服务器地址由线下对接进行提供
    let client  = await createRtcClient({ server: "xxxxxxx", localNumber: "7002" })
    //给客户端注册一个接收到视频通话邀请的事件监听
    client.on(RtcClientEvent.invite, async (session) => {
        //注册接受到远端流信息的事件监听
        session.on(RtcSessionEvent.stream, (data: any) => {
            //播放流信息的代码，如上面的主叫端一样
        })
        ////给会话注册断开事件，
        session.on(RtcSessionEvent.bye, () => alert("BYE!!!!!!"))
        //给会话选择本端所提供的流，这里使用的是摄像头的流信息
        await session.useDefaultDevice(document.getElementById("localPalyer") as HTMLVideoElement);
        //接受会话
        await session.acceptCall();
    })
}
startClientB()

```

### 3.sdk说明
此项目为typescript项目，按照npm的约定生成了type描述文件，具体api说明请在type描述文件中进行查看，以下是一些重要的Api说明：
#### 1.createRtcClient
此方法用来创建一个webrtc的终端，内部已经封装了心跳，信令交互，以及视频处理的逻辑,api描述如下：
```javascript
declare const createRtcClient: (config: {
    server: string; //信令服务器的地址
    localNumber: string; //自己的号码
    heartTime?: number; //向信令服务器的发送心跳的间隔时间，默认是30s
    expireTime?: number; //注册信令的过期时间，默认是60s
}) => Promise<RtcClient>; //注意，这里返回的是Promise的对象，resolve前置是在创建websocket链接之后发送一次心跳信息，等待服务器返回确认信息
```
使用事例:
```javascript
import { createRtcClient } from "usc-rtc-sdk"
let client  = await createRtcClient({server:"wss://xxxxxx.com/",localNumber:"7001"})
```

#### 2.RtcClient
RtcClient是用来实例化webrtc终端的对象，内部主要方法如下
- createSession(remoteNumber?: string): RtcSession 用来来创建一个会话
- destory() 销毁客户端，会销毁所有创建的会话以及断开与信令服务器的链接，与信令服务器断开链接之后也会自动触发此方法
- reConnect() 重新连接信令服务器，如果之前处于连接状态会自动调用destory的方法
- on(event:RtcClientEvent,cb:Function)  注册相关监听事件

事例代码：
```javascript
import { createRtcClient,RtcClientEvent,RtcSession,RtcCalledSession } from "usc-rtc-sdk"
let client  = await createRtcClient({server:"wss://xxxxxx.com/",localNumber:"7001"})
let session:RtcSession = client.createSession("7002")
client.on(RtcClientEvent.invite,(calledSession:RtcCalledSession)=>{})
```

#### 3.RtcClientEvent
RtcClientEvent 表示底层封装向上抛出的一些业务与非业务的生命周期事件，具体如下
- connected 信令服务器连接成功事件
- disconnected 信令服务器断开事件，连接失败这里也可以触发
- invite  收到音视频通话邀请的事件

事例代码
```javascript
import { createRtcClient , RtcClientEvent,RtcCalledSession } from "usc-rtc-sdk"
let client  = await createRtcClient({server:"wss://xxxxxx.com/",localNumber:"7001"})

client.on(RtcClientEvent.disconnected，()=>{
    console.log("socket is closed")
})

client.on(RtcClientEvent.invite,(session:RtcCalledSession)=>{
    console.log("revice invite,do something plz...")
})
```

#### 4.RtcSession
RtcSession是用来实例化RtcClient所创建的音视频会话的对象，内部主要方法如下
- addRemote(remoteNumber: string)  修改需要呼叫的用户
- rejectCall() 拒绝邀请，使用于创建会话过程中的会议类型变更
- acceptCall() 接受邀请，使用于创建会话过程中的会议类型变更
- start() 开始呼叫
- destory() 销毁会话，如果呼叫已经开始，会先向被叫端发送bye请求
- getAllInputResource()  获取所有的音视频输入源
- useDefaultDevice(container: HTMLVideoElement)  使用默认的本地音视频输入设备（麦克风与摄像头）,并将本地的流媒体渲染到对应的video上（可以不传），实际上是下面几个方法的组合使用
- useAudio(deviceId) 使用对应deviceId的麦克风设备作为音频流，如果deviceId为undefined，那么使用默认的设备作为音频源
- useDeviceVideo(deviceId) 使用对应deviceid摄像头设备的视频流，如果deviceId为undefined，那么使用默认的设备作为视频源
- useDeskTopVideo()  使用桌面流作为视频流输入
- disableAudio() 禁用本地流的音频输入,本地音频静音
- disableVideo() 禁用本地流的视频输入，关闭本地视频画面
- enableAudio()  启用本地音频输入
- enableVideo()  启用本地视频输入
- renderLocalStreamToContainer(container:HTMLVideoElement|HTMLAudioElement) 将本地的流媒体使用对应的video或者audio元素进行播放
- on(event:RtcSessionEvent,cb:Function)  注册相关监听事件
- addDeviceChangeListener(listener) 注册物理输入设备变化监听事件，如摄像头拔线之类的操作
- removeDeviceChangeListener(listener) 删除物理输入设备变化监听事件（组件化的框架如react之类的，在组件销毁的时候使用这个方法进行回收）

事例代码
```javascript
...
session.addRemote("7003")
await session.useDefaultDevice(document.getElementById("localplayer"))
session.start()
```

#### 5.RtcCalledSession
RtcCalledSession是用来实例化被叫会话的对象，主要方法如下
- getRemoteNumber() 获取呼叫自己的远端号码
- rejectCall() 拒绝邀请，使用于创建会话与会话过程中的会议类型变更
- acceptCall() 接受邀请，使用于创建会话与会话过程中的会议类型变更
- destory() 销毁会话，如果呼叫已经开始，会先向被叫端发送bye请求
- getAllInputResource()  获取所有的音视频输入源
- useDefaultDevice(container: HTMLVideoElement)  使用默认的本地音视频输入设备（麦克风与摄像头）,并将本地的流媒体渲染到对应的video上（可以不传），实际上是下面几个方法的组合使用
- useAudio(deviceId) 使用对应deviceId的麦克风设备作为音频流，如果deviceId为undefined，那么使用默认的设备作为音频源
- useDeviceVideo(deviceId) 使用对应deviceid摄像头设备的视频流，如果deviceId为undefined，那么使用默认的设备作为视频源
- useDeskTopVideo()  使用桌面流作为视频流输入
- disableAudio() 禁用本地流的音频输入,本地音频静音
- disableVideo() 禁用本地流的视频输入，关闭本地视频画面
- enableAudio()  启用本地音频输入
- enableVideo()  启用本地视频输入
- renderLocalStreamToContainer(container:HTMLVideoElement|HTMLAudioElement) 将本地的流媒体使用对应的video或者audio元素进行播放
- on(event:RtcSessionEvent,cb:Function)  注册相关监听事件
- addDeviceChangeListener(listener) 注册物理输入设备变化监听事件，如摄像头拔线之类的操作
- removeDeviceChangeListener(listener) 删除物理输入设备变化监听事件（组件化的框架如react之类的，在组件销毁的时候使用这个方法进行回收

事例代码
```javascript
...
client.on(RtcClientEvent.invite,async (session:RtcCalledSession)=>{
    await session.useDefaultDevice(document.getElementById("localplayer"))
    session.acceptCall()
})
```

#### 6.RtcSessionEvent
会话流程事件
- bye 会话结束事件
- stream 会话收到流的事件
- localAudioChange  本地音频流设备发生了变化
- localVideoChange  本地视频流设备发生了变化
- reInvite 会话过程中修改会话类型会重新发invite 比如原先只是语音通话，然后变成视频会话
- localStreamChange 本地流发生了变化

事例代码
```javascript
...
session.on(RtcSessionEvent.stream,({audioOnly,stream})=>{
    if(audioOnly){
        //use audio to play
    }else{
        let playerContainer = document.getElementById("player")
        playerContainer.srcObject = data.stream
        playerContainer.remoteVideoContainer.play()
    }
})
...
session.on(RtcSessionEvent.bye,()=>{
    //close something
    alert("bye")
})
```

### 4.限制
- 1.目前仅做了chrome浏览器的兼容支持，要求chrome内核版本在90以上
- 2.webrtc接口调用的页面需要依赖https环境(本地地址如localhost,127.0.0.1除外)，页面运行环境如果无法提供支持，请在chrome的unsafely-treat-insecure中添加白名单来让页面支持webrtc(chrome 浏览器打开chrome://flags/#unsafely-treat-insecure-origin-as-secure，在Insecure origins treated as secure下面的输入框中添加您的网页地址，选择右边的enable，重启浏览器生效)