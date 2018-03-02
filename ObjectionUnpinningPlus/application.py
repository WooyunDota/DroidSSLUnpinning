# -*- coding: utf-8 -*-
import frida, sys, re, sys, os
from subprocess import Popen, PIPE, STDOUT
import codecs, time

if (len(sys.argv) > 1):
    APP_NAME = str(sys.argv[1])
else:
    APP_NAME = "sg.vantagepoint.uncrackable3"

def sbyte2ubyte(byte):
    return (byte % 256)

def print_result(message):
    print ("[!] Received: [%s]" %(message))

def on_message(message, data):
    if 'payload' in message:
        data = message['payload']
        if type(data) is str:
            print_result(data)
        elif type(data) is list:
            a = data[0]
            if type(a) is int:
                hexstr = "".join([("%02X" % (sbyte2ubyte(a))) for a in data])
                print_result(hexstr)
                print_result(hexstr.decode('hex'))
            else:
                print_result(data)
                print_result(hexstr.decode('hex'))
        else:
            print_result(data)
    else:
        if message['type'] == 'error':
            print (message['stack'])
        else:
            print_result(message)


def kill_process():
    cmd = "adb shell pm clear {} 1> /dev/null".format(APP_NAME)
    os.system(cmd)

kill_process()

try:
    with codecs.open("hooks.js", 'r', encoding='utf8') as f:
        jscode  = f.read()
        device  = frida.get_usb_device(timeout=5)
        pid     = device.spawn([APP_NAME])
        session = device.attach(pid)
        script  = session.create_script(jscode)
        device.resume(APP_NAME)
        script.on('message', on_message)
        print ("[*] Intercepting on {} (pid:{})...".format(APP_NAME,pid))
        script.load()
        sys.stdin.read()
except KeyboardInterrupt:
        print ("[!] Killing app...")
        kill_process()
        time.sleep(1)
        kill_process()
