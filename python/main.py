#!/usr/bin/python
# -*- coding: UTF-8 -*-

import json, yaml, os, io
import paho.mqtt.client as mqtt
from time import sleep
from onvif import ONVIFCamera

'''  读取本地配置 '''
def get_yaml_data(yaml_file):
    with io.open(yaml_file,'r',encoding='utf-8') as f:
        file_data = file.read()
    return yaml.load(file_data)

current_path = os.path.abspath(".")
yaml_path = os.path.join(current_path, "config.yaml")
config = get_yaml_data(yaml_path)
config_mqtt = config['mqtt']

'''  onvif控制 '''

XMAX = 1
XMIN = -1
YMAX = 1
YMIN = -1

def perform_move(ptz, request, timeout):
    # Start continuous move
    ptz.ContinuousMove(request)
    # Wait a certain time
    sleep(timeout)
    # Stop continuous move
    ptz.Stop({'ProfileToken': request.ProfileToken})

def move_up(ptz, request, timeout=1):
    print 'move up...'
    request.Velocity.PanTilt._x = 0
    request.Velocity.PanTilt._y = YMAX
    perform_move(ptz, request, timeout)

def move_down(ptz, request, timeout=1):
    print 'move down...'
    request.Velocity.PanTilt._x = 0
    request.Velocity.PanTilt._y = YMIN
    perform_move(ptz, request, timeout)

def move_right(ptz, request, timeout=1):
    print 'move right...'
    request.Velocity.PanTilt._x = XMAX
    request.Velocity.PanTilt._y = 0
    perform_move(ptz, request, timeout)

def move_left(ptz, request, timeout=1):
    print 'move left...'
    request.Velocity.PanTilt._x = XMIN
    request.Velocity.PanTilt._y = 0
    perform_move(ptz, request, timeout)

def continuous_move(direction, host, port, user, password):
    mycam = ONVIFCamera(host, port, user, password)
    # Create media service object
    media = mycam.create_media_service()
    # Create ptz service object
    ptz = mycam.create_ptz_service()

    # Get target profile
    media_profile = media.GetProfiles()[0];

    # Get PTZ configuration options for getting continuous move range
    request = ptz.create_type('GetConfigurationOptions')
    request.ConfigurationToken = media_profile.PTZConfiguration._token
    ptz_configuration_options = ptz.GetConfigurationOptions(request)

    request = ptz.create_type('ContinuousMove')
    request.ProfileToken = media_profile._token

    ptz.Stop({'ProfileToken': media_profile._token})

    # Get range of pan and tilt
    # NOTE: X and Y are velocity vector
    global XMAX, XMIN, YMAX, YMIN
    XMAX = ptz_configuration_options.Spaces.ContinuousPanTiltVelocitySpace[0].XRange.Max
    XMIN = ptz_configuration_options.Spaces.ContinuousPanTiltVelocitySpace[0].XRange.Min
    YMAX = ptz_configuration_options.Spaces.ContinuousPanTiltVelocitySpace[0].YRange.Max
    YMIN = ptz_configuration_options.Spaces.ContinuousPanTiltVelocitySpace[0].YRange.Min

    if direction == 'right':
        # move right
        move_right(ptz, request)
    elif direction == 'left':
        # move left
        move_left(ptz, request)
    elif direction == 'up':
        # Move up
        move_up(ptz, request)
    elif direction == 'left':
        # move down
        move_down(ptz, request)

'''  连接MQTT '''

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