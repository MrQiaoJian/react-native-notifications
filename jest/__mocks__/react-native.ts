/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// react-native 手工 mock（经 jest.config.js 的 moduleNameMapper 注入）。
// 源码仅依赖三个导出：Platform / TurboModuleRegistry / NativeEventEmitter。
//
// Platform.OS 为可变字段，用例中直接改写（默认 'harmony'，对齐本包主要目标平台）
// 以覆盖 NotificationsRoot / NotificationsAndroid / NotificationsIOS / NotificationFactory
// 中的平台分支。所有模块拿到的是同一个对象引用，改写即时生效。
import type { EmitterSubscription } from 'react-native';

export const Platform = {
  OS: 'harmony',
  select: (spec: Record<string, unknown>): unknown => spec[Platform.OS],
};

// 与原生侧同名 TurboModule（'RNBridgeModule'）契约一致的 mock 命令面，
// 覆盖 src/specs/v1/NativeRNBridgeModule.ts 声明的全部方法。
export const mockRNBridgeModule = {
  // NativeEventEmitter 契约
  addListener: jest.fn(),
  removeListeners: jest.fn(),
  // 命令面
  getInitialNotification: jest.fn(),
  postLocalNotification: jest.fn(),
  requestPermissions: jest.fn(),
  abandonPermissions: jest.fn(),
  refreshToken: jest.fn(),
  registerPushKit: jest.fn(),
  getBadgeCount: jest.fn(),
  setBadgeCount: jest.fn(),
  cancelLocalNotification: jest.fn(),
  cancelAllLocalNotifications: jest.fn(),
  isRegisteredForRemoteNotifications: jest.fn(),
  checkPermissions: jest.fn(),
  removeDeliveredNotifications: jest.fn(),
  removeAllDeliveredNotifications: jest.fn(),
  getDeliveredNotifications: jest.fn(),
  setCategories: jest.fn(),
  finishPresentingNotification: jest.fn(),
  finishHandlingAction: jest.fn(),
  setNotificationChannel: jest.fn(),
  finishHandlingBackgroundAction: jest.fn(),
};

export const TurboModuleRegistry = {
  get: jest.fn(() => mockRNBridgeModule),
  getEnforcing: jest.fn(() => mockRNBridgeModule),
};

// 事件经 mock 的 NativeEventEmitter 派发；addListener 挂在原型上，
// 便于用例通过 jest.spyOn(NativeEventEmitter.prototype, 'addListener')
// 捕获（并触发）包装后的回调。
export class NativeEventEmitter {
  constructor(public readonly nativeModule?: unknown) {}

  addListener(
    eventType: string,
    listener: (...args: any[]) => void
  ): EmitterSubscription {
    return {
      eventType,
      listener,
      remove: jest.fn(),
    } as unknown as EmitterSubscription;
  }
}
