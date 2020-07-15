const fs = require('fs')
const { spawn } = require('child_process');

// 读取配置文件


// 开始录制
function startRecord(rstp) {
    let url = new URL(rstp)
    // console.log(url)
    // 创建data目录
    if (!fs.existsSync('data')) fs.mkdirSync('data')
    // 创建IP目录
    let ipPath = `data/${url.hostname}`
    if (!fs.existsSync(ipPath)) fs.mkdirSync(ipPath)
    // 创建当前时间目录
    let today = new Date()
    let dir = ipPath + '/' + [today.getFullYear(), today.getMonth(), today.getDate(), today.getHours(), today.getMinutes()].join('-')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir)
    // 生成录像参数
    let args = `-i ${rstp} -c copy -map 0 -f segment -segment_list ${dir}/playlist.m3u8 -segment_time 5 ${dir}/output%03d.ts`
    console.log(args)
    return
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
}

startRecord('rtsp://admin:123456@192.168.1.111:554/')