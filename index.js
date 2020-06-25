const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://192.168.1.110')
const Camera = require('./camera')

const device = {
    '192.168.1.104': new Camera({
        ip: '192.168.1.104',
        user: 'admin',
        password: '123456'
    })
}

client.on('connect', function () {
    console.log('开始监听当前连接状态')
    Object.keys(device).forEach(k => {
        client.subscribe(`onvifCamera/cmd/${k}`)
    })
})

client.on('message', function (topic, message) {
    Object.keys(device).forEach(k => {
        if (topic == `onvifCamera/cmd/${k}`) {
            let d = device[k]
            let res = JSON.parse(message.toString())
            switch (res.type) {
                case 'x':
                    d.x = res.data
                    break;
                case 'y':
                    d.y = res.data
                    break;
                case 'z':
                    d.z = res.data
                    break;
                case 'recored':
                    d.record()
                    break;
                case 'stop':
                    d.stop()
                    break;
                case 'look':
                    d.look()
                    break;
            }
        }
    })
})



client.on('disconnect', function () {
    console.log('断开连接')
})


client.on('reconnect', function () {
    console.log('重新连接')
})

client.on('error', function (err) {
    console.log('出现错误', err)
})