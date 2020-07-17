const Koa = require('koa');
const send = require('koa-send');
const cors = require('koa2-cors');

const fs = require('fs')
const path = require('path')
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

// 开启服务
const app = new Koa();
app.use(cors());

const token = config.token

app.use(async ctx => {
    let { url, method, query } = ctx.request
    if (method == 'GET') {
        // 判断url是否存在
        if (url.includes(token)) {
            console.log('有权限访问')
            let filePath = url.replace(`/${token}`, '')
            if (filePath.indexOf('/get') == 0) {
                let { ip, time } = query
                let dir = 'data'
                if (ip) dir += `/${ip}`
                if (ip && time) dir += `/${time}`
                let arr = []
                if (fs.existsSync(dir)) {
                    arr = fs.readdirSync(dir)
                }
                ctx.body = {
                    code: 0,
                    data: arr
                }
            } else {
                let storagePath = path.resolve(__dirname, './data') + '/'
                console.log(storagePath, filePath)
                await send(ctx, filePath, { root: storagePath });
            }
        }
    }
});

app.listen(3001);
console.log('监听地址：http://localhost:3001/')