import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * react-native-notifications 鸿蒙适配 TurboModule Spec。
 *
 * 旧架构原生模块名为 RNBridgeModule（Android RNNotificationsModule#getName / iOS RNBridgeModule），
 * 鸿蒙新架构实现必须保持同名契约：TurboModuleRegistry.get('RNBridgeModule')。
 * 方法面覆盖 lib/src/adapters/NativeCommandsSender.ts 声明的全部 20 个命令方法；
 * addListener/removeListeners 供 JS 侧 NativeEventEmitter 挂载事件订阅。
 */
export interface Spec extends TurboModule {
  // NativeEventEmitter 契约（事件经 RCTDeviceEventEmitter 透传）
  addListener(eventName: string): void;
  removeListeners(count: number): void;

  // 命令面（与 NativeCommandsSender 一一对应）
  getInitialNotification(): Promise<Object>;
  postLocalNotification(notification: Object, id: number): void;
  requestPermissions(options: Object): void;
  abandonPermissions(): void;
  refreshToken(): void;
  registerPushKit(): void;
  getBadgeCount(): Promise<number>;
  setBadgeCount(count: number): void;
  cancelLocalNotification(notificationId: number): void;
  cancelAllLocalNotifications(): void;
  isRegisteredForRemoteNotifications(): Promise<boolean>;
  checkPermissions(): Promise<Object>;
  removeDeliveredNotifications(identifiers: Array<string>): void;
  removeAllDeliveredNotifications(): void;
  getDeliveredNotifications(): Promise<Array<Object>>;
  setCategories(categories: Array<Object>): void;
  finishPresentingNotification(notificationId: string, options: Object): void;
  finishHandlingAction(notificationId: string): void;
  setNotificationChannel(notificationChannel: Object): void;
  finishHandlingBackgroundAction(notificationId: string, backgroundFetchResult: string): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNBridgeModule');
