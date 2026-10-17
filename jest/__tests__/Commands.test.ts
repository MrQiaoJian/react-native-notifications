/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Commands } from '../../src/commands/Commands';
import { NativeCommandsSender } from '../../src/adapters/NativeCommandsSender';
import { UniqueIdProvider } from '../../src/adapters/UniqueIdProvider';
import { NotificationFactory } from '../../src/DTO/NotificationFactory';
import { Notification } from '../../src/DTO/Notification';
import { NotificationCategory } from '../../src/interfaces/NotificationCategory';
import { NotificationChannel } from '../../src/interfaces/NotificationChannel';

function createDependencies() {
  return {
    nativeCommandsSender: {
      postLocalNotification: jest.fn(),
      getInitialNotification: jest.fn(),
      requestPermissions: jest.fn(),
      abandonPermissions: jest.fn(),
      registerPushKit: jest.fn(),
      setCategories: jest.fn(),
      getBadgeCount: jest.fn(),
      setBadgeCount: jest.fn(),
      cancelLocalNotification: jest.fn(),
      cancelAllLocalNotifications: jest.fn(),
      isRegisteredForRemoteNotifications: jest.fn(),
      checkPermissions: jest.fn(),
      removeAllDeliveredNotifications: jest.fn(),
      removeDeliveredNotifications: jest.fn(),
      getDeliveredNotifications: jest.fn(),
      refreshToken: jest.fn(),
      setNotificationChannel: jest.fn(),
    },
    uniqueIdProvider: { generate: jest.fn(() => 42) },
    notificationFactory: { fromPayload: jest.fn((payload: any) => new Notification(payload)) },
  };
}

describe('Commands', () => {
  let deps: ReturnType<typeof createDependencies>;
  let commands: Commands;

  beforeEach(() => {
    deps = createDependencies();
    commands = new Commands(
      deps.nativeCommandsSender as unknown as NativeCommandsSender,
      deps.uniqueIdProvider as unknown as UniqueIdProvider,
      deps.notificationFactory as unknown as NotificationFactory
    );
  });

  describe('postLocalNotification', () => {
    it('uses the provided id and does not generate one', () => {
      const notification = new Notification({ identifier: 'local' });

      expect(commands.postLocalNotification(notification, 7)).toBe(7);
      expect(deps.nativeCommandsSender.postLocalNotification).toHaveBeenCalledWith(notification, 7);
      expect(deps.uniqueIdProvider.generate).not.toHaveBeenCalled();
    });

    it('generates an id when none is provided', () => {
      const notification = new Notification({ identifier: 'local' });

      expect(commands.postLocalNotification(notification)).toBe(42);
      expect(deps.nativeCommandsSender.postLocalNotification).toHaveBeenCalledWith(notification, 42);
      expect(deps.uniqueIdProvider.generate).toHaveBeenCalledTimes(1);
    });

    it('generates an id when the provided id is falsy (0)', () => {
      expect(commands.postLocalNotification(new Notification({}), 0)).toBe(42);
    });
  });

  describe('getInitialNotification', () => {
    it('maps a non-empty payload through the notification factory', async () => {
      const payload = { identifier: 'cold-start' };
      deps.nativeCommandsSender.getInitialNotification.mockResolvedValueOnce(payload);

      const notification = await commands.getInitialNotification();

      expect(deps.notificationFactory.fromPayload).toHaveBeenCalledWith(payload);
      expect(notification).toBeInstanceOf(Notification);
    });

    it('resolves undefined for an empty payload (harmony cold start resolves {})', async () => {
      deps.nativeCommandsSender.getInitialNotification.mockResolvedValueOnce({});

      await expect(commands.getInitialNotification()).resolves.toBeUndefined();
      expect(deps.notificationFactory.fromPayload).not.toHaveBeenCalled();
    });

    it('resolves undefined when the native side resolves null', async () => {
      deps.nativeCommandsSender.getInitialNotification.mockResolvedValueOnce(null);

      await expect(commands.getInitialNotification()).resolves.toBeUndefined();
    });
  });

  it('requestPermissions returns the native result', () => {
    const result = { granted: true };
    deps.nativeCommandsSender.requestPermissions.mockReturnValueOnce(result);

    expect(commands.requestPermissions({ provisional: true })).toBe(result);
    expect(deps.nativeCommandsSender.requestPermissions).toHaveBeenCalledWith({ provisional: true });
  });

  it('abandonPermissions returns the native result', () => {
    const result = {};
    deps.nativeCommandsSender.abandonPermissions.mockReturnValueOnce(result);

    expect(commands.abandonPermissions()).toBe(result);
  });

  it('registerPushKit forwards to the native sender', () => {
    commands.registerPushKit();
    expect(deps.nativeCommandsSender.registerPushKit).toHaveBeenCalledTimes(1);
  });

  it('setCategories forwards the categories', () => {
    const categories = [new NotificationCategory('cat-1')] as [NotificationCategory?];
    commands.setCategories(categories);
    expect(deps.nativeCommandsSender.setCategories).toHaveBeenCalledWith(categories);
  });

  it('getBadgeCount returns the native promise result', async () => {
    deps.nativeCommandsSender.getBadgeCount.mockResolvedValueOnce(3);
    await expect(commands.getBadgeCount()).resolves.toBe(3);
  });

  it('setBadgeCount forwards the count', () => {
    commands.setBadgeCount(6);
    expect(deps.nativeCommandsSender.setBadgeCount).toHaveBeenCalledWith(6);
  });

  it('cancelLocalNotification forwards the id', () => {
    commands.cancelLocalNotification(99);
    expect(deps.nativeCommandsSender.cancelLocalNotification).toHaveBeenCalledWith(99);
  });

  it('cancelAllLocalNotifications forwards the call', () => {
    commands.cancelAllLocalNotifications();
    expect(deps.nativeCommandsSender.cancelAllLocalNotifications).toHaveBeenCalledTimes(1);
  });

  it('isRegisteredForRemoteNotifications returns the native promise result', async () => {
    deps.nativeCommandsSender.isRegisteredForRemoteNotifications.mockResolvedValueOnce(false);
    await expect(commands.isRegisteredForRemoteNotifications()).resolves.toBe(false);
  });

  it('checkPermissions returns the native promise result', async () => {
    const permissions = { alert: true };
    deps.nativeCommandsSender.checkPermissions.mockResolvedValueOnce(permissions);
    await expect(commands.checkPermissions()).resolves.toBe(permissions);
  });

  it('removeAllDeliveredNotifications forwards the call', () => {
    commands.removeAllDeliveredNotifications();
    expect(deps.nativeCommandsSender.removeAllDeliveredNotifications).toHaveBeenCalledTimes(1);
  });

  it('removeDeliveredNotifications forwards the identifiers', () => {
    commands.removeDeliveredNotifications(['id-1']);
    expect(deps.nativeCommandsSender.removeDeliveredNotifications).toHaveBeenCalledWith(['id-1']);
  });

  it('getDeliveredNotifications returns the native promise result', async () => {
    const delivered = [new Notification({ identifier: 'd1' })];
    deps.nativeCommandsSender.getDeliveredNotifications.mockResolvedValueOnce(delivered);
    await expect(commands.getDeliveredNotifications()).resolves.toBe(delivered);
  });

  it('refreshToken forwards the call', () => {
    commands.refreshToken();
    expect(deps.nativeCommandsSender.refreshToken).toHaveBeenCalledTimes(1);
  });

  it('setNotificationChannel forwards the channel', () => {
    const channel: NotificationChannel = { channelId: 'chan', name: 'Chan', importance: 2 };
    commands.setNotificationChannel(channel);
    expect(deps.nativeCommandsSender.setNotificationChannel).toHaveBeenCalledWith(channel);
  });
});
