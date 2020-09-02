const onvif = require('node-onvif');

class OnvifDevice {
    constructor() {
        let device = new onvif.OnvifDevice({
            xaddr: 'http://192.168.1.118:5000/onvif/device_service',
            user: 'admin',
            pass: '00000000'
        });
        this.loading = false

        device.init().then((info) => {
            console.log(JSON.stringify(info, null, '  '));
            this.device = device
        }).catch(error => {
            console.error(error);
        })
    }

    left() {
        this.move({ x: -0.5 })
    }

    right() {
        this.move({ x: 50 })
    }

    up() {
        this.move({ y: +0.5 })
    }

    down() {
        this.move({ y: -0.5 })
    }

    zoom_out() {
        this.move({ z: -0.1 })
    }

    zoom_in() {
        this.move({ z: +0.1 })
    }

    move({ x = 0, y = 0, z = 0 }) {
        let { device, loading } = this
        if (!device) {
            console.log('当前设备未初始化')
            return
        }
        if (loading === true) return
        this.loading = true
        // 移动
        device.ptzMove({
            'speed': {
                // // 左-0.5  右+0.5
                // x: -0.0, // Speed of pan (in the range of -1.0 to 1.0)
                // // 下-0.1  上+0.1
                // y: -0.0, // Speed of tilt (in the range of -1.0 to 1.0)
                // z: 0.0  // Speed of zoom (in the range of -1.0 to 1.0)
                x, y, z
            },
            'timeout': 60 // seconds
        }).then(() => {
            console.log('Succeeded to move.');
            // Stop to the PTZ in 2 seconds
         
        }).catch((error) => {
            console.error(error);
        });
    }
}

let onvifDevice = new OnvifDevice()

setTimeout(()=>{
    onvifDevice.right()
},10000)

setInterval(()=>{

}, 1000)