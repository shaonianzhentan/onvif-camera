const fs = require('fs')
const YAML = require('yaml')
const { spawn } = require('child_process');

// 开始录制方法
function startRecord(rtsp) {
    let url = new URL(rtsp)
    // console.log(url)
    // IP地址
    let ip = url.hostname
    // 创建data目录
    if (!fs.existsSync('data')) fs.mkdirSync('data')
    // 创建IP目录
    let ipPath = `data/${ip}`
    if (!fs.existsSync(ipPath)) fs.mkdirSync(ipPath)
    // 创建当前时间目录
    let today = new Date()
    let dir = ipPath + '/' + [today.getFullYear(), today.getMonth(), today.getDate(), today.getHours(), today.getMinutes()].join('-')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir)
    // 生成录像参数
    let args = `-i ${rtsp} -c copy -map 0 -f segment -segment_list ${dir}/playlist.m3u8 -segment_time 5 ${dir}/output%09d.ts`
    console.log(args)
    const ls = spawn('ffmpeg', args.split(" "));

    ls.stdout.on('data', (data) => {
        console.log(`【${ip}】 stdout: ${data}`);
    });

    ls.stderr.on('data', (data) => {
        console.error(`【${ip}】stderr: ${data}`);
    });

    ls.on('error', (code) => {
        console.log(`【${ip}】子进程退出，错误信息 ${code}`);
    });

    ls.on('close', (code) => {
        console.log(`【${ip}】子进程退出，退出码 ${code}`);
    });
}

// 读取配置
const file = fs.readFileSync('./config.yaml', 'utf8')
const config = YAML.parse(file)
config.rtsp.forEach(url => {
    console.log(url)
    startRecord(url)
})