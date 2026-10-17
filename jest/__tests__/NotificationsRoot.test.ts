/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Platform, mockRNBridgeModule } from 'react-native';
import { NotificationsRoot } from '../../src/Notifications';
import { NotificationsIOS } from '../../src/NotificationsIOS';
import { NotificationsAndroid } from '../../src/NotificationsAndroid';
import { EventsRegistry } from '../../src/events/EventsRegistry';
import { Notification } from '../../src/DTO/Notification';
import { NotificationCategory } from '../../src/interfaces/NotificationCategory';
import { NotificationChannel } from '../../src/interfaces/NotificationChannel';
import { NotificationPermissionOptions } from '../../src/interfaces/NotificationPermissions';

describe('NotificationsRoot', () => {
  afterEach(() => {
    Platform.OS = 'harmony';
  });

  it('wires the ios/android sub-facades and the events registry', () => {
    const root = new NotificationsRoot();

    expect(root.ios).toBeInstanceOf(NotificationsIOS);
    expect(root.android).toBeInstanceOf(NotificationsAndroid);
    expect(root.events()).toBeInstanceOf(EventsRegistry);
    expect(root._ios).toBe(root.ios);
    expect(root._android).toBe(root.android);
  });

  describe('registerRemoteNotifications platform routing', () => {
    it('routes to the ios facade (with options) on ios', () => {
      Platform.OS = 'ios';
      const options: NotificationPermissionOptions = { provisional: true };

      new NotificationsRoot().registerRemoteNotifications(options);

      expect(mockRNBridgeModule.requestPermissions).toHaveBeenCalledWith(options);
    });

    it('routes to the android facade on harmony (options are not forwarded)', () => {
      Platform.OS = 'harmony';

      new NotificationsRoot().registerRemoteNotifications();

      // android 面 → commands.requestPermissions() → native sender 归一为 {}
      expect(mockRNBridgeModule.requestPermissions).toHaveBeenCalledWith({});
    });

    it('routes to the android facade on android', () => {
      Platform.OS = 'android';

      new NotificationsRoot().registerRemoteNotifications();

      expect(mockRNBridgeModule.requestPermissions).toHaveBeenCalledWith({});
    });

    it('does nothing on other platforms', () => {
      Platform.OS = 'windows';

      new NotificationsRoot().registerRemoteNotifications();

      expect(mockRNBridgeModule.requestPermissions).not.toHaveBeenCalled();
    });
  });

  it('postLocalNotification returns the id and forwards to native', () => {
    const notification = new Notification({ identifier: 'local' });

    const id = new NotificationsRoot().postLocalNotification(notification, 12);

    expect(id).toBe(12);
    expect(mockRNBridgeModule.postLocalNotification).toHaveBeenCalledWith(notification, 12);
  });

  it('postLocalNotification generates an id when none is given', () => {
    const id = new NotificationsRoot().postLocalNotification(new Notification({}));

    expect(id).toBe(1);
    expect(mockRNBridgeModule.postLocalNotification).toHaveBeenCalledWith(expect.any(Notification), 1);
  });

  it('getInitialNotification resolves the mapped cold-start notification', async () => {
    mockRNBridgeModule.getInitialNotification.mockResolvedValueOnce({ identifier: 'cold-start' });

    const notification = await new NotificationsRoot().getInitialNotification();

    expect(notification).toBeInstanceOf(Notification);
    expect(notification!.identifier).toBe('cold-start');
  });

  it('getInitialNotification resolves undefined for an empty cold-start payload', async () => {
    mockRNBridgeModule.getInitialNotification.mockResolvedValueOnce({});

    await expect(new NotificationsRoot().getInitialNotification()).resolves.toBeUndefined();
  });

  it('setCategories forwards the categories to native', () => {
    const categories = [new NotificationCategory('cat-1')] as [NotificationCategory?];

    new NotificationsRoot().setCategories(categories);

    expect(mockRNBridgeModule.setCategories).toHaveBeenCalledWith(categories);
  });

  it('cancelLocalNotification forwards the id to native', () => {
    new NotificationsRoot().cancelLocalNotification(34);

    expect(mockRNBridgeModule.cancelLocalNotification).toHaveBeenCalledWith(34);
  });

  it('removeAllDeliveredNotifications forwards the call to native', () => {
    new NotificationsRoot().removeAllDeliveredNotifications();

    expect(mockRNBridgeModule.removeAllDeliveredNotifications).toHaveBeenCalledTimes(1);
  });

  it('isRegisteredForRemoteNotifications resolves the native answer', async () => {
    mockRNBridgeModule.isRegisteredForRemoteNotifications.mockResolvedValueOnce(true);

    await expect(new NotificationsRoot().isRegisteredForRemoteNotifications()).resolves.toBe(true);
  });

  it('setNotificationChannel forwards through the android facade on harmony', () => {
    const channel: NotificationChannel = { channelId: 'chan', name: 'Chan', importance: 4 };

    new NotificationsRoot().setNotificationChannel(channel);

    expect(mockRNBridgeModule.setNotificationChannel).toHaveBeenCalledWith(channel);
  });
});
