const onvif = require('node-onvif');
const fs = require('fs')
const { spawn } = require('child_process');

module.exports = class {

    constructor({ ip, user, password }) {
        this.ip = ip
        this.rtsp = `rtsp://${user}:${password}@${ip}:544/`
        this.ls = null
        // 初始化控制器
        let device = new onvif.OnvifDevice({
            xaddr: `http://${ip}/onvif/device_service`,
            user,
            pass: password
        });
        this.loading = false
        device.init().then((info) => {
            console.log(JSON.stringify(info, null, '  '));
            this.device = device
        }).catch(error => {
            console.error(error);
        })
    }

    // 录制
    record() {
        let { rtsp, ls, ip } = this

        if (ls != null) {
            this.stop();
            setTimeout(() => {
                this.ls = null;
                this.record()
            }, 1000)
        }
        else {
            let today = new Date()
            let dir = 'data/' + ip + '/' + [today.getFullYear(), today.getMonth(), today.getDate(), today.getHours(), today.getMinutes()].join('-')
            fs.mkdirSync(dir)
            this.playlist = `${dir}/playlist.m3u8`
            let args = `-i ${rtsp} -c copy -map 0 -f segment -segment_list ${this.playlist} -segment_time 5 ${dir}/output%03d.ts`
            
            const ls = spawn('ffmpeg', args.split(" "));

            ls.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
            });

            ls.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
            });

            ls.on('close', (code) => {
                console.log(`子进程退出，退出码 ${code}`);
            });
            this.ls = ls
        }
    }

    // 查看
    look() {

    }

    // 关闭
    stop() {
        if (this.ls) this.ls.kill('SIGHUP')
    }

    // 横向移动
    set x(x) {
        this.move({ x })
    }


    // 纵向移动
    set y(y) {
        this.move({ y })
    }

    // 缩放
    set z(z) {
        this.move({ z })
    }

    move({ x = 0, y = 0, z = 0 }) {
        let { device, loading } = this
        if (!device) {
            console.log('当前设备未初始化')
            return
        }
        if (loading) return
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
            setTimeout(() => {
                device.ptzStop().then(() => {
                    console.log('Succeeded to stop.');
                }).catch((error) => {
                    console.error(error);
                }).finally(() => {
                    this.loading = false
                });
            }, 3000);
        }).catch((error) => {
            console.error(error);
        });
    }
}
