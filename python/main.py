import json, yaml, os
import paho.mqtt.client as mqtt
from .move import continuous_move

def get_yaml_data(yaml_file):
    file = open(yaml_file, 'r', encoding="utf-8")
    file_data = file.read()
    file.close()
    data = yaml.load(file_data)
    return data

current_path = os.path.abspath(".")
yaml_path = os.path.join(current_path, "config.yaml")
config = get_yaml_data(yaml_path)
config_mqtt = config['mqtt']

def on_connect(client, userdata, flags, rc):
    print("Connected with result code: " + str(rc))

def on_message(client, userdata, msg):    
    try:
        print(msg.topic + " " + str(msg.payload))
        if msg.topic == 'onvif/camera/ptz':
            # 控制位置
            payload = json.loads(msg.payload)
            continuous_move(payload['direction'], payload['host'], int(payload['port']), payload['user'], payload['password'])            
        elif msg.topic == 'onvif/camera/live':
            # 录制视频
            print('录制视频')
    except Exception as ex:
        print(ex)

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message
client.connect(config_mqtt['host'], 1883, 600) # 600为keepalive的时间间隔
client.subscribe('onvif/camera/ptz', qos=0)
client.loop_forever() # 保持连接