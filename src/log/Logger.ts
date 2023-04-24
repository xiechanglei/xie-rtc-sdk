//是否打印日志
let logAble = false
//是否在网页上显示日志

export const log = (title: string, ...args: any) => {
    if (logAble) {
        console.log(
            `%c usc-rtc-devtools %c ${title} %c `,
            'background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff',
            'background:#41b883 ; padding: 1px; border-radius: 0 3px 3px 0;  color: #fff',
            'background:transparent',
            ...args
        )
    }
}

export const error = (title: string, ...args: any) => {
    if (logAble) {
        console.log(
            `%c usc-rtc-devtools %c ${title} %c `,
            'background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff',
            'background:#ff0000 ; padding: 1px; border-radius: 0 3px 3px 0;  color: #fff',
            'background:transparent',
            ...args
        )
    }
}

export const disableLog = () => {
    logAble = false
}

export const enableLog = () => {
    logAble = true
}