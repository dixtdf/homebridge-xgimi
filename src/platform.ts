import {API, Characteristic, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service} from 'homebridge';
import {MANUFACTURER, PLATFORM_NAME, PLUGIN_NAME} from './settings';
import {XGimiVisionAccessory} from './remote';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PACKAGE_REQUIRE = require('../package.json');

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 * 这个类是你的插件的主构造函数，这是你应该做的
 * 解析用户配置并使用homebridge发现附件
 */
export class XGimiRemoteHomeBridgePlugin implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  // 这用于跟踪恢复的缓存附件
  public accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('完成平台初始化:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // 当触发此事件时，意味着Homebridge已经从磁盘恢复了所有缓存的附件。
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // 动态平台插件只能在此事件触发后注册新的附件，
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // 为了确保它们没有被添加到homebridge。也可以使用此事件
    // to start discovery of new accessories.
    // 开始发现新的配件。
    this.api.on('didFinishLaunching', () => {
      log.debug('执行didFinishLaunching回调');
      // run the method to discover / register your devices as accessories
      // 运行此方法以发现将您的设备注册为附件
      (this.config.devices as Array<any>).forEach(deviceConfig => {
        log.debug(deviceConfig);
        this.discoverDevices(deviceConfig);
      });
      this.removeDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * 当homebridge在启动时从磁盘恢复缓存的附件时调用此函数。
   * It should be used to setup event handlers for characteristics and update respective values.
   * 它应该用于为特征设置事件处理程序并更新各自的值。
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('从缓存加载附件:', accessory.displayName);
    // add the restored accessory to the accessories cache so we can track if it has already been registered
    // 将恢复的配件添加到配件缓存中，以便我们可以跟踪它是否已经注册
    const config = (this.config.devices as Array<any>).filter((config) => this.api.hap.uuid.generate(config.name + config.host) == accessory.UUID);
    if (config) {
      this.log.info('配置的配件:', accessory.displayName);
      this.initAccessory(accessory, config)
    }
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   * 这是一个示例方法，展示如何注册发现的附件。配件只能注册一次，以前创建的配件不能再次注册，以防止“重复UUID”错误。
   */
  discoverDevices(deviceConfig) {
    // EXAMPLE ONLY
    // A real plugin you would discover accessories from the local network, cloud services
    // or a user-defined array in the platform config.
    // 只有一个真正的插件，你会从本地网络、云服务或平台配置中用户定义的数组中发现附件。

    // generate a unique id for the accessory this should be generated from
    // something globally unique, but constant, for example, the device serial
    // number or MAC address
    // 为配件生成一个唯一的id，这应该由全局唯一的东西生成，但是是常量，例如，设备序列号或MAC地址
    const uuid = this.api.hap.uuid.generate(deviceConfig.name + deviceConfig.host);

    // see if an accessory with the same uuid has already been registered and restored from
    // the cached devices we stored in the `configureAccessory` method above
    // 查看是否已经从' configureAccessory '方法中存储的缓存设备中注册并恢复了具有相同uuid的附件
    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
    if (!existingAccessory) {
      // the accessory does not yet exist, so we need to create it
      // 这个附件还不存在，所以我们需要创建它
      this.log.info('添加新附件:', deviceConfig.name);
      // create a new accessory
      // 创建一个新附件
      const accessory = new this.api.platformAccessory(deviceConfig.name, uuid);
      this.initAccessory(accessory, deviceConfig)
    }
  }

  initAccessory(accessory, deviceConfig) {
    // store a copy of the device object in the `accessory.context`
    // the `context` property can be used to store any data about the accessory you may need
    // 在' accessory.context '中存储设备对象的副本
    // ' context '属性可用于存储您可能需要的有关配件的任何数据
    // accessory.context.device = device;

    accessory.on('identify', () => {
      this.log.info('标识:', accessory.displayName);
    });
    // 注册未电视
    accessory.category = this.api.hap.Categories.TELEVISION;
    // 信息
    const accessoryInfo = accessory.getService(this.Service.AccessoryInformation);
    // 版本
    const version = PACKAGE_REQUIRE.version;
    // 制造商
    const manufacturer = deviceConfig.manufacturer ?? this.config.manufacturer ?? MANUFACTURER;
    // 平台名称
    const model = deviceConfig.model ?? PLATFORM_NAME;
    // 平台名称
    const serialNumber = deviceConfig.serialNumber ?? PLATFORM_NAME;
    if (accessoryInfo) {
      accessoryInfo.setCharacteristic(this.Characteristic.Manufacturer, manufacturer);
      accessoryInfo.setCharacteristic(this.Characteristic.Model, model);
      accessoryInfo.setCharacteristic(this.Characteristic.SerialNumber, serialNumber);
      accessoryInfo.setCharacteristic(this.Characteristic.FirmwareRevision, version);
    }

    const tvAccessory = new XGimiVisionAccessory(this.log, deviceConfig, this.api, accessory);
    tvAccessory.initServices();

    // create the accessory handler for the newly create accessory
    // this is imported from `platformAccessory.ts`
    // new ExamplePlatformAccessory(this, accessory);
    // 为新创建的附件创建附件处理程序，这是从' platformAccessory导入的。ts的new ExamplePlatformAccessory(this, accessory);

    // link the accessory to your platform
    // this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);

    // {
    //   name: 'XGimi TV',
    //     host: '10.10.10.10',
    //   manufacturer: 'XGimi',
    //   model: 'H3',
    //   serialNumber: 'JRTZYCSJRK4R',
    //   firmwareRevision: '1.10.241',
    //   inputs: [
    //   {
    //     name: '资源管理器',
    //     type: 'APPLICATION',
    //     package: 'com.xgimi.filemanager'
    //   }
    // ]
    // }
  }

  removeAccessory(accessory) {
    this.log.info('移除废旧设备开始');
    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    this.log.info('移除废旧设备完成');
  }

  /**
   * 移除废旧设备
   */
  removeDevices() {
    this.log.info('移除废旧设备开始');
    // 设备uuidMap
    const deviceUUIDMap = (this.config.devices as Array<any>).map((config) => this.api.hap.uuid.generate(config.name + config.host));
    this.accessories.forEach((a) => {
      const includes = deviceUUIDMap.includes(a.UUID);
      try {
        if (!includes) {
          this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [a]);
        }
      } catch (e) {
        this.log.error('移除废旧设备异常:' + e);
      }
    })
    this.accessories = this.accessories.filter(a => a != null);
    this.log.info('移除废旧设备完成');
  }

}
