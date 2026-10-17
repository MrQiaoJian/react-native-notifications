/**
 * react-native-notifications HarmonyOS 适配
 *
 * RNNotificationsBridge：原生侧全局单例桥。
 * - 持有宿主 UIAbility 引用（EntryAbility.onCreate 同步注入，Push Kit 回调注册需要 Ability 实例）；
 * - 暂存冷启动通知（getInitialNotification 一次性消费）；
 * - TurboModule 尚未创建时缓存事件，创建后冲刷；
 * - 维护 category（行动按钮）与 channel（通知渠道）注册表。
 */

import { UIAbility, Want } from '@kit.AbilityKit';
import { pushService, pushCommon } from '@kit.PushKit';
import { notificationManager } from '@kit.NotificationKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { hilog } from '@kit.PerformanceAnalysisKit';

const LOG_DOMAIN = 0x0000;
const LOG_TAG = 'RNNotifications';

export type RNNotificationsEventDispatcher = (eventName: string, payload: Object) => void;

/** setCategories 注册的单个行动按钮（JS 侧 NotificationAction 的原生镜像） */
export class RNNotificationsCategoryAction {
  identifier: string = '';
  title: string = '';
  hasTextInput: boolean = false;
}

/** setCategories 注册的通知类别（JS 侧 NotificationCategory 的原生镜像） */
export class RNNotificationsCategory {
  identifier: string = '';
  actions: RNNotificationsCategoryAction[] = [];
}

/** setNotificationChannel 注册的通知渠道（JS 侧 NotificationChannel 的原生镜像） */
export class RNNotificationsChannel {
  channelId: string = '';
  name: string = '';
  importance: number = 3;
  slotType: notificationManager.SlotType = notificationManager.SlotType.SERVICE_INFORMATION;
  soundFile: string = '';
}

/** TurboModule 就绪前缓存的事件 */
export class RNNotificationsPendingEvent {
  eventName: string = '';
  payload: Object | null = null;
}

export class RNNotificationsBridge {
  private static instance: RNNotificationsBridge | null = null;

  /** 宿主 Ability，EntryAbility.onCreate 中同步赋值 */
  public ability: UIAbility | null = null;
  /** 前后台标志，EntryAbility onForeground/onBackground 维护 */
  public isForeground: boolean = true;
  /** API 22 以下无法读取系统角标时，用最近一次 setBadgeCount 的值兜底 */
  public lastBadgeCount: number = 0;

  private initialNotification: Record<string, Object> | null = null;
  private dispatcher: RNNotificationsEventDispatcher | null = null;
  private pendingEvents: RNNotificationsPendingEvent[] = [];
  private categories: Map<string, RNNotificationsCategory> = new Map();
  private channels: Map<string, RNNotificationsChannel> = new Map();

  public static getInstance(): RNNotificationsBridge {
    if (RNNotificationsBridge.instance === null) {
      RNNotificationsBridge.instance = new RNNotificationsBridge();
    }
    return RNNotificationsBridge.instance;
  }

  /**
   * EntryAbility.onCreate 中同步调用：
   * 保存 Ability 引用并注册 Push Kit 回调（文档要求不能放在异步方法之后）。
   */
  public attachAbility(ability: UIAbility): void {
    this.ability = ability;
    try {
      // 上游契约（iOS RNPushKitEventHandler）：事件体键名为 pushKitToken
      pushService.on('tokenUpdate', ability, (token: string) => {
        this.dispatchEvent('pushKitRegistered', { 'pushKitToken': token });
      });
    } catch (e) {
      let err = e as BusinessError;
      hilog.warn(LOG_DOMAIN, LOG_TAG, 'pushService.on(tokenUpdate) failed: %{public}s %{public}s',
        `${err.code ?? -1}`, `${err.message ?? ''}`);
    }
    try {
      pushService.receiveMessage('BACKGROUND', ability, (payload: pushCommon.PushPayload) => {
        this.handlePushMessage(payload);
      });
    } catch (e) {
      let err = e as BusinessError;
      hilog.warn(LOG_DOMAIN, LOG_TAG, 'pushService.receiveMessage failed: %{public}s %{public}s',
        `${err.code ?? -1}`, `${err.message ?? ''}`);
    }
  }

  public setForeground(isForeground: boolean): void {
    this.isForeground = isForeground;
  }

  /** 冷启动：暂存启动通知，等待 JS 侧 getInitialNotification 消费 */
  public handleOnCreate(want: Want): void {
    let notification = this.parseLaunchNotification(want);
    if (notification !== null) {
      this.initialNotification = notification;
      hilog.info(LOG_DOMAIN, LOG_TAG, 'cold launch notification captured');
    }
  }

  /** 热启动：直接派发 notificationOpened */
  public handleNewWant(want: Want): void {
    let notification = this.parseLaunchNotification(want);
    if (notification === null) {
      return;
    }
    let opened: Record<string, Object> = { 'notification': notification };
    let action = this.parseLaunchAction(want);
    if (action !== null) {
      opened['action'] = action;
    }
    this.dispatchEvent('notificationOpened', opened);
  }

  /** getInitialNotification 一次性消费冷启动通知 */
  public consumeInitialNotification(): Record<string, Object> | null {
    let notification = this.initialNotification;
    this.initialNotification = null;
    return notification;
  }

  /** TurboModule 创建后注入事件派发器并冲 flush 缓存事件 */
  public setDispatcher(dispatcher: RNNotificationsEventDispatcher): void {
    this.dispatcher = dispatcher;
    let pending = this.pendingEvents;
    this.pendingEvents = [];
    for (let event of pending) {
      if (event.payload !== null) {
        dispatcher(event.eventName, event.payload);
      }
    }
  }

  public dispatchEvent(eventName: string, payload: Record<string, Object>): void {
    if (this.dispatcher !== null) {
      this.dispatcher(eventName, payload);
      return;
    }
    if (this.pendingEvents.length < 200) {
      let event = new RNNotificationsPendingEvent();
      event.eventName = eventName;
      event.payload = payload;
      this.pendingEvents.push(event);
    }
  }

  /** setCategories：解析 JS 传来的类别数组并登记 */
  public setCategoriesFromJs(categories: Object[]): void {
    let map = new Map<string, RNNotificationsCategory>();
    for (let raw of categories) {
      let record = raw as Record<string, Object>;
      let category = new RNNotificationsCategory();
      category.identifier = paramAsString(record, 'identifier');
      let rawActions = record['actions'];
      if (typeof rawActions === 'object' && rawActions !== null && Array.isArray(rawActions)) {
        let actions = rawActions as Object[];
        for (let rawAction of actions) {
          let actionRecord = rawAction as Record<string, Object>;
          let action = new RNNotificationsCategoryAction();
          action.identifier = paramAsString(actionRecord, 'identifier');
          action.title = paramAsString(actionRecord, 'title');
          action.hasTextInput = actionRecord['textInput'] !== undefined && actionRecord['textInput'] !== null;
          category.actions.push(action);
        }
      }
      if (category.identifier !== '') {
        map.set(category.identifier, category);
      }
    }
    this.categories = map;
  }

  public getCategory(identifier: string): RNNotificationsCategory | null {
    return this.categories.get(identifier) ?? null;
  }

  /** setNotificationChannel：解析渠道并登记（返回登记结果） */
  public setChannelFromJs(channel: Object): RNNotificationsChannel {
    let record = channel as Record<string, Object>;
    let result = new RNNotificationsChannel();
    result.channelId = paramAsString(record, 'channelId');
    result.name = paramAsString(record, 'name');
    result.importance = paramAsNumber(record, 'importance', 3);
    result.soundFile = paramAsString(record, 'soundFile');
    // importance 映射槽类型：HIGH(4+)→社交通信（横幅提醒），2~3→服务信息，0~1→其他
    if (result.importance >= 4) {
      result.slotType = notificationManager.SlotType.SOCIAL_COMMUNICATION;
    } else if (result.importance >= 2) {
      result.slotType = notificationManager.SlotType.SERVICE_INFORMATION;
    } else {
      result.slotType = notificationManager.SlotType.OTHER_TYPES;
    }
    this.channels.set(result.channelId, result);
    return result;
  }

  public getSlotTypeForChannel(channelId: string): notificationManager.SlotType {
    let channel = this.channels.get(channelId);
    if (channel !== undefined) {
      return channel.slotType;
    }
    return notificationManager.SlotType.SERVICE_INFORMATION;
  }

  public getSoundForChannel(channelId: string): string {
    let channel = this.channels.get(channelId);
    if (channel !== undefined) {
      return channel.soundFile;
    }
    return '';
  }

  /** Push Kit 透传消息：前台→notificationReceived，后台→notificationReceivedBackground；同时透传 pushKitNotificationReceived */
  private handlePushMessage(payload: pushCommon.PushPayload): void {
    this.dispatchEvent('pushKitNotificationReceived', { 'type': payload.type, 'data': payload.data });
    let notification: Record<string, Object>;
    try {
      notification = JSON.parse(payload.data) as Record<string, Object>;
    } catch (e) {
      hilog.warn(LOG_DOMAIN, LOG_TAG, 'push payload data is not JSON, wrapping raw string');
      let inner: Record<string, Object> = { 'pushType': payload.type };
      notification = { 'body': payload.data, 'payload': inner };
    }
    if (this.isForeground) {
      this.dispatchEvent('notificationReceived', notification);
    } else {
      this.dispatchEvent('notificationReceivedBackground', notification);
    }
  }

  /** 从启动 Want 还原通知对象（发布时经 wantAgent.parameters 携带） */
  private parseLaunchNotification(want: Want): Record<string, Object> | null {
    let params = want.parameters;
    if (params === undefined || params === null) {
      return null;
    }
    let payloadJson = paramAsString(params, 'rnNotificationsPayload');
    if (payloadJson === '') {
      return null;
    }
    try {
      return JSON.parse(payloadJson) as Record<string, Object>;
    } catch (e) {
      hilog.warn(LOG_DOMAIN, LOG_TAG, 'failed to parse launch notification payload');
      return null;
    }
  }

  /** 从启动 Want 还原行动按钮响应（含文本输入回传） */
  private parseLaunchAction(want: Want): Record<string, Object> | null {
    let params = want.parameters;
    if (params === undefined || params === null) {
      return null;
    }
    let actionId = paramAsString(params, 'rnNotificationsAction');
    if (actionId === '') {
      return null;
    }
    let actionText = paramAsString(params, 'rnNotificationsActionText');
    if (actionText === '') {
      // 用户通过文本输入按钮提交时，系统以 inputKey 为键回填输入内容
      actionText = paramAsString(params, 'rnActionText');
    }
    let action: Record<string, Object> = { 'identifier': actionId, 'text': actionText };
    return action;
  }
}

/** Record 取 string 值（类型不符返回空串） */
export function paramAsString(record: Record<string, Object>, key: string): string {
  let value = record[key];
  if (typeof value === 'string') {
    return value as string;
  }
  return '';
}

/** Record 取 number 值（类型不符返回 fallback） */
export function paramAsNumber(record: Record<string, Object>, key: string, fallback: number): number {
  let value = record[key];
  if (typeof value === 'number') {
    return value as number;
  }
  return fallback;
}
