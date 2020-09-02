# 摄像头控制

## 运行环境
- python2.7

```bash
# 编译onvif控制
git clone https://github.com.cnpmjs.org/quatanium/python-onvif

cd python-onvif 

python setup.py install

cp -r wsdl /etc/

# 安装相关依赖
pip install paho-mqtt pyyaml
```

```bash
{"direction": "left", "host": "192.168.1.111", "port": "80", "user": "admin", "password": "123456"}
```