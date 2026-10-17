/**
 * react-native-notifications HarmonyOS 适配
 *
 * NotificationsTurboModule：实现 Spec（RNBridgeModule）声明的 22 个方法，
 * 接入 Notification Kit（发布/取消/角标/授权/已发通知查询）、Push Kit（token/透传）、
 * wantAgent（点击通知回拉 Ability 并携带原始 payload）。
 */

import { EtsUITurboModule } from '@rnoh/react-native-openharmony/ets';
import { UITurboModuleContext } from '@rnoh/react-native-openharmony';
import { notificationManager } from '@kit.NotificationKit';
import { wantAgent, Want, WantAgent } from '@kit.AbilityKit';
import { pushService } from '@kit.PushKit';
import { deviceInfo, BusinessError } from '@kit.BasicServicesKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { RNBridgeModule } from './generated/turboModules/RNBridgeModule';
import { RNNotificationsBridge, paramAsString, paramAsNumber } from './RNNotificationsBridge';

const LOG_DOMAIN = 0x0000;
const LOG_TAG = 'RNNotifications';

export class NotificationsTurboModule extends EtsUITurboModule implements RNBridgeModule.Spec {
  public static readonly NAME: string = RNBridgeModule.NAME;

  constructor(ctx: UITurboModuleContext) {
    super(ctx);
    // 注入事件派发器（emitDeviceEvent → JS 侧 RCTDeviceEventEmitter / NativeEventEmitter）
    RNNotificationsBridge.getInstance().setDispatcher((eventName: string, payload: Object): void => {
      this.ctx.rnInstance.emitDeviceEvent(eventName, payload);
    });
  }

  /** NativeEventEmitter 桥接契约方法，事件实际经 RNInstance.emitDeviceEvent 派发 */
  addListener(eventName: string): void {
    this.ctx.logger.info(`RNNotifications.addListener(${eventName})`);
  }

  removeListeners(count: number): void {
    this.ctx.logger.info(`RNNotifications.removeListeners(${count})`);
  }

  getInitialNotification(): Promise<Object> {
    let notification = RNNotificationsBridge.getInstance().consumeInitialNotification();
    if (notification === null) {
      // 与 Android 行为对齐：无冷启动通知时返回“空对象”，JS 侧 identifier 为 undefined
      let empty: Record<string, Object> = {};
      return Promise.resolve(empty);
    }
    return Promise.resolve(notification);
  }

  postLocalNotification(notification: Object, id: number): void {
    this.publishLocalNotification(notification, id);
  }

  requestPermissions(options: Object): void {
    this.doRequestPermissions();
  }

  abandonPermissions(): void {
    // 鸿蒙无“撤销通知授权”API，最接近替代：跳转该应用的通知设置页由用户手动关闭
    notificationManager.openNotificationSettings(this.ctx.uiAbilityContext).catch((e: BusinessError) => {
      hilog.warn(LOG_DOMAIN, LOG_TAG, 'openNotificationSettings failed: %{public}s', `${e.code}`);
    });
  }

  refreshToken(): void {
    this.fetchRegistrationToken();
  }

  registerPushKit(): void {
    pushService.getToken().then((token: string) => {
      // 上游契约（iOS RNPushKitEventHandler）：事件体键名为 pushKitToken
      this.emitEvent('pushKitRegistered', { 'pushKitToken': token });
    }).catch((e: BusinessError) => {
      // Push Kit 取 token 依赖 AGC 配置与设备形态，失败路径记录日志（wix 无 pushKit 失败事件）
      hilog.warn(LOG_DOMAIN, LOG_TAG, 'registerPushKit getToken failed: %{public}s %{public}s',
        `${e.code}`, `${e.message}`);
    });
  }

  getBadgeCount(): Promise<number> {
    let bridge = RNNotificationsBridge.getInstance();
    if (deviceInfo.sdkApiVersion >= 22) {
      return notificationManager.getBadgeNumber().then((count: number): number => {
        bridge.lastBadgeCount = count;
        return count;
      }).catch((): number => {
        return bridge.lastBadgeCount;
      });
    }
    // getBadgeNumber 需 API 22+；低版本用最近一次 setBadgeCount 的记录兜底
    return Promise.resolve(bridge.lastBadgeCount);
  }

  setBadgeCount(count: number): void {
    let bridge = RNNotificationsBridge.getInstance();
    bridge.lastBadgeCount = count;
    notificationManager.setBadgeNumber(count).catch((e: BusinessError) => {
      hilog.warn(LOG_DOMAIN, LOG_TAG, 'setBadgeNumber failed: %{public}s', `${e.code}`);
    });
  }

  cancelLocalNotification(notificationId: number): void {
    notificationManager.cancel(notificationId).catch((e: BusinessError) => {
      hilog.warn(LOG_DOMAIN, LOG_TAG, 'cancel failed: %{public}s', `${e.code}`);
    });
  }

  cancelAllLocalNotifications(): void {
    notificationManager.cancelAll().catch((e: BusinessError) => {
      hilog.warn(LOG_DOMAIN, LOG_TAG, 'cancelAll failed: %{public}s', `${e.code}`);
    });
  }

  isRegisteredForRemoteNotifications(): Promise<boolean> {
    return notificationManager.isNotificationEnabled();
  }

  checkPermissions(): Promise<Object> {
    // 鸿蒙只有应用级开关，五项能力统一映射到 isNotificationEnabled
    return notificationManager.isNotificationEnabled().then((enabled: boolean): Object => {
      let result: Record<string, Object> = {
        'alert': enabled,
        'sound': enabled,
        'badge': enabled,
        'lockScreen': enabled,
        'notificationCenter': enabled,
      };
      return result;
    });
  }

  removeDeliveredNotifications(identifiers: string[]): void {
    for (let identifier of identifiers) {
      let id = Number.parseInt(identifier, 10);
      if (!Number.isNaN(id)) {
        notificationManager.cancel(id).catch((e: BusinessError) => {
          hilog.warn(LOG_DOMAIN, LOG_TAG, 'removeDelivered cancel failed: %{public}s', `${e.code}`);
        });
      }
    }
  }

  removeAllDeliveredNotifications(): void {
    notificationManager.cancelAll().catch((e: BusinessError) => {
      hilog.warn(LOG_DOMAIN, LOG_TAG, 'removeAllDelivered cancelAll failed: %{public}s', `${e.code}`);
    });
  }

  getDeliveredNotifications(): Promise<Object[]> {
    return notificationManager.getActiveNotifications().then(
      (requests: Array<notificationManager.NotificationRequest>): Object[] => {
        let result: Object[] = [];
        for (let request of requests) {
          result.push(this.requestToJsNotification(request));
        }
        return result;
      });
  }

  setCategories(categories: Object[]): void {
    RNNotificationsBridge.getInstance().setCategoriesFromJs(categories);
  }

  /**
   * iOS 前台展示决策的 completion 机制在鸿蒙无对应能力
   * （前台通知展示由系统通知中心统一管理，应用不可拦截），保留方法为空实现。
   */
  finishPresentingNotification(notificationId: string, options: Object): void {
    this.ctx.logger.info(`finishPresentingNotification(${notificationId}) is a no-op on HarmonyOS`);
  }

  finishHandlingAction(notificationId: string): void {
    this.ctx.logger.info(`finishHandlingAction(${notificationId}) is a no-op on HarmonyOS`);
  }

  setNotificationChannel(notificationChannel: Object): void {
    let channel = RNNotificationsBridge.getInstance().setChannelFromJs(notificationChannel);
    notificationManager.addSlot(channel.slotType).catch((e: BusinessError) => {
      hilog.warn(LOG_DOMAIN, LOG_TAG, 'addSlot failed: %{public}s', `${e.code}`);
    });
  }

  finishHandlingBackgroundAction(notificationId: string, backgroundFetchResult: string): void {
    this.ctx.logger.info(
      `finishHandlingBackgroundAction(${notificationId}, ${backgroundFetchResult}) is a no-op on HarmonyOS`);
  }

  // ---------------- 私有实现 ----------------

  private emitEvent(eventName: string, payload: Record<string, Object>): void {
    this.ctx.rnInstance.emitDeviceEvent(eventName, payload);
  }

  /** 注册流程：先确保通知开关开启（弹系统授权框），再取 Push token 并派发注册事件 */
  private async doRequestPermissions(): Promise<void> {
    try {
      let enabled = await notificationManager.isNotificationEnabled();
      if (!enabled) {
        await notificationManager.requestEnableNotification(this.ctx.uiAbilityContext);
      }
    } catch (e) {
      let err = e as BusinessError;
      hilog.warn(LOG_DOMAIN, LOG_TAG, 'requestEnableNotification rejected: %{public}s %{public}s',
        `${err.code}`, `${err.message}`);
      this.emitEvent('remoteNotificationsRegistrationDenied', {});
      return;
    }
    this.fetchRegistrationToken();
  }

  /** Push Kit token 获取：成功→remoteNotificationsRegistered，失败→remoteNotificationsRegistrationFailed */
  private fetchRegistrationToken(): void {
    pushService.getToken().then((token: string) => {
      // 上游契约（Android FcmToken / iOS RNNotificationEventHandler）：事件体键名为 deviceToken
      this.emitEvent('remoteNotificationsRegistered', { 'deviceToken': token });
    }).catch((e: BusinessError) => {
      // 对齐 JS 侧 RegistrationError 接口（code/domain/localizedDescription），message 为补充字段
      this.emitEvent('remoteNotificationsRegistrationFailed', {
        'code': `${e.code}`,
        'domain': 'PushKit',
        'localizedDescription': `${e.message}`,
        'message': `${e.message}`,
      });
    });
  }

  private async publishLocalNotification(notification: Object, id: number): Promise<void> {
    try {
      let bridge = RNNotificationsBridge.getInstance();
      let record = notification as Record<string, Object>;
      let title = paramAsString(record, 'title');
      let body = paramAsString(record, 'body');
      // 对齐 Android：title/body 双空视为纯数据推送，不弹通知
      if (title === '' && body === '') {
        hilog.info(LOG_DOMAIN, LOG_TAG, 'data-only notification skipped');
        return;
      }
      if (title === '') {
        title = 'Notification';
      }
      if (body === '') {
        body = title;
      }
      let payloadRecord: Record<string, Object> | null = null;
      let payloadValue = record['payload'];
      if (typeof payloadValue === 'object' && payloadValue !== null) {
        payloadRecord = payloadValue as Record<string, Object>;
      }
      let categoryId = payloadRecord !== null ? paramAsString(payloadRecord, 'category') : '';
      let channelId = payloadRecord !== null ? paramAsString(payloadRecord, 'android_channel_id') : '';
      let sound = paramAsString(record, 'sound');
      let badge = paramAsNumber(record, 'badge', -1);

      let slotType = notificationManager.SlotType.SERVICE_INFORMATION;
      if (channelId !== '') {
        slotType = bridge.getSlotTypeForChannel(channelId);
        if (sound === '') {
          sound = bridge.getSoundForChannel(channelId);
        }
      }

      // 完整原始对象随 wantAgent 往返，点击通知回拉时原样交给 JS
      let payloadJson = JSON.stringify(record);
      let tapAgent = await this.createWantAgent(this.buildLaunchWant(payloadJson, ''));

      let content: notificationManager.NotificationContent = {
        notificationContentType: notificationManager.ContentType.NOTIFICATION_CONTENT_BASIC_TEXT,
        normal: {
          title: title,
          text: body,
        },
      };
      let request: notificationManager.NotificationRequest = {
        id: id,
        notificationSlotType: slotType,
        content: content,
        wantAgent: tapAgent,
      };
      let extra: Record<string, Object> = { 'rnPayload': payloadJson };
      request.extraInfo = extra;
      if (sound !== '') {
        request.sound = sound;
      }
      if (badge >= 0) {
        request.badgeNumber = badge;
      }

      // 行动按钮（系统上限 2 个，超出截断）
      let category = categoryId !== '' ? bridge.getCategory(categoryId) : null;
      if (category !== null && category.actions.length > 0) {
        let buttons: notificationManager.NotificationActionButton[] = [];
        for (let action of category.actions) {
          if (buttons.length >= 2) {
            hilog.warn(LOG_DOMAIN, LOG_TAG, 'action buttons truncated to 2 (system limit)');
            break;
          }
          let actionAgent = await this.createWantAgent(this.buildLaunchWant(payloadJson, action.identifier));
          if (action.hasTextInput) {
            let button: notificationManager.NotificationActionButton = {
              title: action.title,
              wantAgent: actionAgent,
              userInput: {
                inputKey: 'rnActionText',
              },
            };
            buttons.push(button);
          } else {
            let button: notificationManager.NotificationActionButton = {
              title: action.title,
              wantAgent: actionAgent,
            };
            buttons.push(button);
          }
        }
        request.actionButtons = buttons;
      }

      await notificationManager.publish(request);
    } catch (e) {
      let err = e as BusinessError;
      hilog.error(LOG_DOMAIN, LOG_TAG, 'postLocalNotification failed: %{public}s %{public}s',
        `${err.code}`, `${err.message}`);
    }
  }

  /** 构造点击通知后回拉本 Ability 的 Want，parameters 携带原始通知与行动标识 */
  private buildLaunchWant(payloadJson: string, actionId: string): Want {
    let context = this.ctx.uiAbilityContext;
    let parameters: Record<string, Object> = {
      'rnNotificationsPayload': payloadJson,
      'rnNotificationsAction': actionId,
      'rnNotificationsActionText': '',
    };
    let want: Want = {
      bundleName: context.abilityInfo.bundleName,
      abilityName: context.abilityInfo.name,
      parameters: parameters,
    };
    return want;
  }

  private async createWantAgent(want: Want): Promise<WantAgent> {
    let info: wantAgent.WantAgentInfo = {
      wants: [want],
      operationType: wantAgent.OperationType.START_ABILITY,
      requestCode: 0,
    };
    return wantAgent.getWantAgent(info);
  }

  /** 已发通知还原为 JS 通知对象：优先 extraInfo.rnPayload（发布时的原始对象），退化为基础字段 */
  private requestToJsNotification(request: notificationManager.NotificationRequest): Object {
    // identifier 统一回填为系统通知 id 字符串，保证 JS 侧 removeDeliveredNotifications(identifier)
    // 能经 Number.parseInt 还原回系统 id 完成删除（与 cancelLocalNotification 使用同一 id 空间）
    let restored: Record<string, Object> | null = null;
    let extra = request.extraInfo;
    if (extra !== undefined && extra !== null) {
      let raw: Object = extra['rnPayload'];
      if (typeof raw === 'string') {
        try {
          restored = JSON.parse(raw as string) as Record<string, Object>;
        } catch (e) {
          hilog.warn(LOG_DOMAIN, LOG_TAG, 'failed to restore delivered notification payload');
        }
      }
    }
    if (restored !== null) {
      restored['identifier'] = `${request.id}`;
      return restored;
    }
    let title = '';
    let text = '';
    if (request.content !== undefined && request.content.normal !== undefined
      && request.content.normal !== null) {
      title = request.content.normal.title;
      text = request.content.normal.text;
    }
    let fallback: Record<string, Object> = {
      'identifier': `${request.id}`,
      'title': title,
      'body': text,
    };
    return fallback;
  }
}
