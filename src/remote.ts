import {API, Characteristic, Logger, PlatformAccessory, PlatformConfig, Service} from 'homebridge';
import DgramAsPromised from 'dgram-as-promised';
import ping from 'ping';
import {COMPLEX_PARAMS, COMPLEX_PORT, SIMPLE_PARAMS, SIMPLE_PARAMS_MAP, SIMPLE_PORT} from './settings';

export class XGimiVisionAccessory {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // 电视服务
  private televisionService;
  // 电视扬声器服务
  private televisionSpeakerService;
  // 输入资源
  private inputResources;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
    public accessories: PlatformAccessory,
  ) {
    this.inputResources = [];
  }

  initServices() {
    this.televisionService = this.accessories.getService(this.Service.Television);
    this.televisionSpeakerService = this.accessories.getService(this.Service.TelevisionSpeaker);
    if (!this.televisionService) {
      this.log.info('增加电视服务', this.accessories.displayName);
      this.initTelevisionService();
    }
    if (!this.televisionSpeakerService) {
      this.log.info('增加电视演讲者服务', this.accessories.displayName);
      this.televisionSpeakerService = this.accessories.addService(this.Service.TelevisionSpeaker);
      this.televisionSpeakerService
        .setCharacteristic(this.Characteristic.Active, this.Characteristic.Active.ACTIVE)
        .setCharacteristic(this.Characteristic.VolumeControlType, this.Characteristic.VolumeControlType.ABSOLUTE);
      // 音量控制
      this.televisionSpeakerService.getCharacteristic(this.Characteristic.VolumeSelector).on('set', this.setVolume.bind(this));
    }
    this.initInputSourceService();
    this.initPowerStatus();
    return [this.televisionService, this.televisionSpeakerService, ...this.inputResources];
  }

  /**
   * 初始化电视服务
   */
  initTelevisionService() {
    // 电视名称
    const name = this.config.name || 'XGimi';
    // 添加电视服务
    this.televisionService = this.accessories.addService(this.Service.Television);
    // 设置电视名称
    this.televisionService.setCharacteristic(this.Characteristic.ConfiguredName, name);
    // 设置睡眠发现特性
    this.televisionService.setCharacteristic(this.Characteristic.SleepDiscoveryMode, this.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
    // 设置活动标识符特征
    this.televisionService.setCharacteristic(this.Characteristic.ActiveIdentifier, 0);
    // 处理开关事件
    this.televisionService.getCharacteristic(this.Characteristic.Active).on('set', this.setPower.bind(this));
    // 处理输入源更改
    this.televisionService.getCharacteristic(this.Characteristic.ActiveIdentifier).on('set', this.setInputResource.bind(this));
    // 处理遥控输入
    this.televisionService.getCharacteristic(this.Characteristic.RemoteKey).on('set', this.setRemoteKey.bind(this));

    // this.televisionService.getCharacteristic(this.Characteristic.PowerModeSelection)
    //   .on('set', this.setRemoteKey.bind(this, 'SETTINGS'));

    /**
     * Create TV Input Source Services
     * These are the inputs the user can select from.
     * When a user selected an input the corresponding Identifier Characteristic
     * is sent to the TV Service ActiveIdentifier Characteristic handler.
     * 建电视输入源服务这些是用户可以选择的输入。
     * 当用户选择一个输入时，相应的标识符特征被发送到TV服务ActiveIdentifier特征处理程序。
     */
      // HDMI 1 Input Source
    const hdmi1InputService = this.accessories.addService(this.Service.InputSource, 'hdmi1', 'HDMI 1');
    hdmi1InputService
      .setCharacteristic(this.Characteristic.Identifier, 1)
      .setCharacteristic(this.Characteristic.ConfiguredName, 'HDMI 1')
      .setCharacteristic(this.Characteristic.IsConfigured, this.Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(this.Characteristic.InputSourceType, this.Characteristic.InputSourceType.HDMI);
    this.televisionService.addLinkedService(hdmi1InputService);
    // HDMI 2 Input Source
    const hdmi2InputService = this.accessories.addService(this.Service.InputSource, 'hdmi2', 'HDMI 2');
    hdmi2InputService
      .setCharacteristic(this.Characteristic.Identifier, 2)
      .setCharacteristic(this.Characteristic.ConfiguredName, 'HDMI 2')
      .setCharacteristic(this.Characteristic.IsConfigured, this.Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(this.Characteristic.InputSourceType, this.Characteristic.InputSourceType.HDMI);
    this.televisionService.addLinkedService(hdmi2InputService);

    // // Netflix Input Source
    // const netflixInputService = this.accessories.addService(this.Service.InputSource, 'netflix', 'Netflix');
    // netflixInputService
    //   .setCharacteristic(this.Characteristic.Identifier, 3)
    //   .setCharacteristic(this.Characteristic.ConfiguredName, 'Netflix')
    //   .setCharacteristic(this.Characteristic.IsConfigured, this.Characteristic.IsConfigured.CONFIGURED)
    //   .setCharacteristic(this.Characteristic.InputSourceType, this.Characteristic.InputSourceType.HDMI);
    // this.televisionService.addLinkedService(netflixInputService);
  }

  initInputSourceService() {
    const homeScreenInput = {
      'name': 'Home Screen',
      'type': 'HOME_SCREEN',
    };
    if (this.config.inputs) {
      const inputs = [homeScreenInput, ...(this.config.inputs as Array<any>)];
      (inputs as Array<any>).forEach((input, identifier) => {
        const name = input.name;
        let inputSource = this.accessories.addService(this.Service.InputSource, name.replace(/\s+/g, '').toLowerCase(), name);
        inputSource = inputSource
          .setCharacteristic(this.Characteristic.Identifier, identifier)
          .setCharacteristic(this.Characteristic.ConfiguredName, name)
          .setCharacteristic(this.Characteristic.IsConfigured, this.Characteristic.IsConfigured.CONFIGURED)
          .setCharacteristic(this.Characteristic.InputSourceType, this.Characteristic.InputSourceType[input.type]);
        this.inputResources.push(inputSource);
        this.televisionService.addLinkedService(inputSource);
      });
      this.log.debug("inputs:");
      this.log.debug(this.config.inputs);
    }
  }

  initPowerStatus() {
    this.powerStatus();
    setTimeout(() => {
      this.initPowerStatus();
    }, 10000);
  }

  async powerStatus() {
    try {
      const pingResult = await ping.promise.probe(this.config.host, {timeout: 3});
      const currentPowerStatus = pingResult.alive ? 1 : 0;
      this.televisionService.updateCharacteristic(this.Characteristic.Active, currentPowerStatus);
    } catch (e) {
      this.log.error('powerStatusError:' + e);
    }
  }

  async sendMessage(msg, portFlag = true) {
    const socket = DgramAsPromised.createSocket('udp4');
    const host = this.config.host as string;
    const port = portFlag ? SIMPLE_PORT : COMPLEX_PORT;
    const message = Buffer.from(msg, 'utf8');
    this.log.info('发送UDP消息:' + message);
    try {
      // ping对应的电视
      const pingResult = await ping.promise.probe(host, {timeout: 4});
      if (pingResult.alive) {
        // 发送消息
        await socket.send(message, port, host);
      } else {
        this.log.warn('电视没有响应');
        // 更改活跃状态
        (this.accessories.getService(this.Service.Television) as any).updateCharacteristic(this.Characteristic.Active, this.Characteristic.Active.INACTIVE);
      }
    } catch (e) {
      this.log.error('保活异常:' + e);
    }
  }

  async setPower(active, callback) {
    this.televisionService.updateCharacteristic(this.Characteristic.Active, active);
    switch (active) {
      // 不活跃的
      case this.Characteristic.Active.INACTIVE:
        this.sendMessage(COMPLEX_PARAMS['off']);
        this.log.info('关闭电视');
        break;
      // 活跃的
      case this.Characteristic.Active.ACTIVE:
        this.sendMessage(COMPLEX_PARAMS['on']);
        this.log.info('打开电视');
        break;
      default:
        break;
    }
    callback(null);
  }

  async setInputResource(newValue, callback) {
    this.log.debug('setInputResource' + newValue)
    // todo
    // // 电源状态
    // const powerStatus = (this.accessories.getService(this.Service.Television) as any).getCharacteristic(this.Characteristic.Active).value;
    // // 触发唤醒电视
    // callback(null);
    // if (!powerStatus) {
    //   this.log.info('等待电视打开后再发送命令');
    //   await this.createTimeout(2000);
    // }
    // if (newValue == 0) {
    //   // 主页
    //   this.sendMessage(SIMPLE_PARAMS['home'], false);
    // } else {
    //   // 打开app
    //   const input = (this.config.inputs as Array<any>)[newValue - 1];
    //   if (input.type === 'APPLICATION' && input.package) {
    //     this.sendMessage(COMPLEX_PARAMS['openApp'](input.package));
    //   }
    // }
    // this.log.info('设置输入:' + (newValue == 0 ? '主屏幕' : (this.config.inputs as Array<any>)[newValue - 1].name));
  }

  async setRemoteKey(newValue, callback) {
    // 电源状态
    const powerStatus = (this.accessories.getService(this.Service.Television) as any).getCharacteristic(this.Characteristic.Active).value;
    // 触发唤醒电视
    callback(null);
    if (!powerStatus) {
      this.log.info('等待电视打开后再发送命令');
      await this.createTimeout(2000);
    }
    if (SIMPLE_PARAMS_MAP[newValue] && SIMPLE_PARAMS[SIMPLE_PARAMS_MAP[newValue]]) {
      const api = SIMPLE_PARAMS[SIMPLE_PARAMS_MAP[newValue]];
      await this.sendMessage(api, true);
    }
    this.log.info('触发按键:' + newValue);
  }

  async setVolume(newValue, callback) {
    // 电源状态
    const powerStatus = (this.accessories.getService(this.Service.Television) as any).getCharacteristic(this.Characteristic.Active).value;
    // 触发唤醒电视
    callback(null);
    if (!powerStatus) {
      this.log.info('等待电视打开后再发送命令');
      await this.createTimeout(2000);
    }
    switch (newValue) {
      case this.Characteristic.VolumeSelector.INCREMENT:
        await this.sendMessage(SIMPLE_PARAMS['volumeUp'], true);
        this.log.info('调大音量');
        break;
      case this.Characteristic.VolumeSelector.DECREMENT:
        await this.sendMessage(SIMPLE_PARAMS['volumeDown'], true);
        this.log.info('调低音量');
        break;
      default:
        break;
    }
    this.log.info('修改音量:' + newValue);
  }

  createTimeout(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }
}
