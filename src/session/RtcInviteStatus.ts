export enum RtcInviteStatus {
    timeout = 408,
    reject = 488,
    busy = 486,
    notfound = 404,
    notAllowedMedia = 415,//不允许的媒体类型,目前至少包好一个音频媒体流
    ok = 200
}