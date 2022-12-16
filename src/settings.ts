/**
 * 这是用户用来在Homebridge config.json中注册插件的平台名称
 */
export const PLATFORM_NAME = 'XGimiRemoteHomeBridgePlugin';
/**
 * 这必须与package.json中定义的插件名称相匹配
 */
export const PLUGIN_NAME = 'homebridge-xgimi-remote';
export const MANUFACTURER = 'XGimi';
/**
 * 复杂端口
 */
export const COMPLEX_PORT = 16750;
/**
 * 简单端口
 */
export const SIMPLE_PORT = 16735;

export const COMPLEX_PARAMS = {
  // 关机
  'off': '{"action":20000,"controlCmd":{"delayTime":0,"mode":6,"time":0,"type":2},"msgid":"2"}',
  // 开机
  'on': '{"action":20000,"controlCmd":{"delayTime":0,"mode":6,"time":0,"type":4},"msgid":"2"}',
  // 重启
  'reboot': '{"action":20000,"controlCmd":{"delayTime":0,"mode":6,"time":0,"type":1},"msgid":"2"}',
  // 取消定时关机
  'cancelOff': '{"action":20000,"controlCmd":{"delayTime":0,"mode":6,"time":0,"type":3},"msgid":"2"}',
  // 定时关机15分钟
  'off15': '{"action":20000,"controlCmd":{"delayTime":0,"mode":6,"time":1,"type":3},"msgid":"2"}',
  // 定时关机 30分钟
  'off30': '{"action":20000,"controlCmd":{"delayTime":0,"mode":6,"time":2,"type":3},"msgid":"2"}',
  // 定时关机 60分钟
  'off60': '{"action":20000,"controlCmd":{"delayTime":0,"mode":6,"time":3,"type":3},"msgid":"2"}',
  // 定时关机 120分钟
  'off120': '{"action":20000,"controlCmd":{"delayTime":0,"mode":6,"time":4,"type":3},"msgid":"2"}',
  // 打开应用
  'openApp': (appPackageName) => `{"action":20000,"controlCmd":{"data":"${appPackageName}","delayTime":0,"mode":7,"time":0,"type":1},"msgid":"2"}`,
  // 语音搜索
  'voiceSearch': '{"action":20000,"controlCmd":{"data":"语音搜索","delayTime":0,"mode":5,"time":0,"type":0},"msgid":"2"}',
  // 投屏
  'forScreen': (url) => `{"action":30200,"customPlay":{"mediatype":2,"mode":0,"playlist":[{"num":0,"url":"${url}","vips":[]}],"pos":0,"position":0,"songId":0,"songsList":[],"type":0},"msgid":"2","packageName":"com.xgimi.zhushou","version":"4.0.6"}`,
  // 清理内存
  'cleanMemory': '{"action":20000,"controlCmd":{"delayTime":0,"mode":9,"time":0,"type":2},"msgid":"2"}',
  // hdmi1
  'hdmi1': '{"action":20000,"controlCmd":{"data":"HDMI1","delayTime":0,"mode":5,"time":0,"type":0},"msgid":"2"}',
  // hdmi2
  'hdmi2': '{"action":20000,"controlCmd":{"data":"HDMI2","delayTime":0,"mode":5,"time":0,"type":0},"msgid":"2"}',
}

export const SIMPLE_PARAMS = {
  // 播放
  'play': 'KEYPRESSES:49',
  // 暂停
  'pause': 'KEYPRESSES:49',
  // 电源
  'power': 'KEYPRESSES:116',
  // 返回
  'back': 'KEYPRESSES:48',
  // 主页
  'home': 'KEYPRESSES:35',
  // 菜单
  'menu': 'KEYPRESSES:139',
  // 右
  'right': 'KEYPRESSES:37',
  // 左
  'left': 'KEYPRESSES:50',
  // 上
  'up': 'KEYPRESSES:36',
  // 下
  'down': 'KEYPRESSES:38',
  // 静音
  'volumeMute': 'KEYPRESSES:113',
  // 音量减小
  'volumeDown': 'KEYPRESSES:114',
  // 音量增大
  'volumeUp': 'KEYPRESSES:115',
  // 关机
  'powerOff': 'KEYPRESSES:30',
  // 设置
  'setting': 'KEYPRESSES:251',
  // 调焦往左开始
  'focusLeftStart': 'KEYSSTATUS:253+1',
  // 调焦往左结束
  'focusLeftEnd': 'KEYSSTATUS:253+0',
  // 调焦往右开始
  'focusRightStart': 'KEYSSTATUS:254+1',
  // 调焦往右结束
  'focusRightEnd': 'KEYSSTATUS:254+0',
}
export const SIMPLE_PARAMS_MAP = {
  // REWIND 倒带
  0: '',
  // FAST_FORWARD 快进
  1: '',
  // NEXT_TRACK 下一曲目
  2: '',
  // PREVIOUS_TRACK 上一曲目
  3: '',
  // ARROW_UP 向上
  4: 'up',
  // ARROW_DOWN 向下
  5: 'down',
  // ARROW_LEFT 向左
  6: 'left',
  // ARROW_RIGHT 向右
  7: 'right',
  // SELECT 播放
  8: 'play',
  // BACK 返回
  9: 'back',
  // EXIT 退出
  10: 'home',
  // PLAY_PAUSE 播放暂停
  11: 'pause',
  // 信息（菜單键）
  15: 'menu',
}
