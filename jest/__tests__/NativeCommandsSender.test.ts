/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NativeCommandsSender } from '../../src/adapters/NativeCommandsSender';
import { TurboModuleRegistry, mockRNBridgeModule } from 'react-native';
import { Notification } from '../../src/DTO/Notification';
import { NotificationCategory } from '../../src/interfaces/NotificationCategory';
import { NotificationChannel } from '../../src/interfaces/NotificationChannel';
import { NotificationCompletion } from '../../src/interfaces/NotificationCompletion';

describe('NativeCommandsSender', () => {
  let sender: NativeCommandsSender;

  beforeEach(() => {
    sender = new NativeCommandsSender();
  });

  it('resolves the RNBridgeModule turbo module on construction', () => {
    expect(TurboModuleRegistry.getEnforcing).toHaveBeenCalledWith('RNBridgeModule');
  });

  it('sends postLocalNotification with the notification and id', () => {
    const notification = new Notification({ identifier: 'local' });
    sender.postLocalNotification(notification, 5);
    expect(mockRNBridgeModule.postLocalNotification).toHaveBeenCalledWith(notification, 5);
  });

  it('returns the native promise from getInitialNotification', async () => {
    mockRNBridgeModule.getInitialNotification.mockResolvedValueOnce({ identifier: 'init' });
    await expect(sender.getInitialNotification()).resolves.toEqual({ identifier: 'init' });
  });

  it('sends requestPermissions with the given options', () => {
    const options = { provisional: true };
    sender.requestPermissions(options);
    expect(mockRNBridgeModule.requestPermissions).toHaveBeenCalledWith(options);
  });

  it('defaults requestPermissions to an empty options object', () => {
    sender.requestPermissions();
    expect(mockRNBridgeModule.requestPermissions).toHaveBeenCalledWith({});
  });

  it('sends abandonPermissions', () => {
    sender.abandonPermissions();
    expect(mockRNBridgeModule.abandonPermissions).toHaveBeenCalledTimes(1);
  });

  it('sends refreshToken', () => {
    sender.refreshToken();
    expect(mockRNBridgeModule.refreshToken).toHaveBeenCalledTimes(1);
  });

  it('sends registerPushKit', () => {
    sender.registerPushKit();
    expect(mockRNBridgeModule.registerPushKit).toHaveBeenCalledTimes(1);
  });

  it('sends setCategories with the categories', () => {
    const categories = [new NotificationCategory('cat-1')] as [NotificationCategory?];
    sender.setCategories(categories);
    expect(mockRNBridgeModule.setCategories).toHaveBeenCalledWith(categories);
  });

  it('returns the native promise from getBadgeCount', async () => {
    mockRNBridgeModule.getBadgeCount.mockResolvedValueOnce(4);
    await expect(sender.getBadgeCount()).resolves.toBe(4);
  });

  it('sends setBadgeCount with the count', () => {
    sender.setBadgeCount(9);
    expect(mockRNBridgeModule.setBadgeCount).toHaveBeenCalledWith(9);
  });

  it('sends cancelLocalNotification with the id', () => {
    sender.cancelLocalNotification(12);
    expect(mockRNBridgeModule.cancelLocalNotification).toHaveBeenCalledWith(12);
  });

  it('sends cancelAllLocalNotifications', () => {
    sender.cancelAllLocalNotifications();
    expect(mockRNBridgeModule.cancelAllLocalNotifications).toHaveBeenCalledTimes(1);
  });

  it('returns the native promise from isRegisteredForRemoteNotifications', async () => {
    mockRNBridgeModule.isRegisteredForRemoteNotifications.mockResolvedValueOnce(true);
    await expect(sender.isRegisteredForRemoteNotifications()).resolves.toBe(true);
  });

  it('returns the native promise from checkPermissions', async () => {
    const permissions = { alert: true, badge: false, sound: true };
    mockRNBridgeModule.checkPermissions.mockResolvedValueOnce(permissions);
    await expect(sender.checkPermissions()).resolves.toBe(permissions);
  });

  it('sends removeAllDeliveredNotifications', () => {
    sender.removeAllDeliveredNotifications();
    expect(mockRNBridgeModule.removeAllDeliveredNotifications).toHaveBeenCalledTimes(1);
  });

  it('sends removeDeliveredNotifications with the identifiers', () => {
    sender.removeDeliveredNotifications(['id-1', 'id-2']);
    expect(mockRNBridgeModule.removeDeliveredNotifications).toHaveBeenCalledWith(['id-1', 'id-2']);
  });

  it('returns the native promise from getDeliveredNotifications', async () => {
    const delivered = [{ identifier: 'd1' }];
    mockRNBridgeModule.getDeliveredNotifications.mockResolvedValueOnce(delivered);
    await expect(sender.getDeliveredNotifications()).resolves.toBe(delivered);
  });

  it('sends finishPresentingNotification with the completion', () => {
    const completion: NotificationCompletion = { badge: true };
    sender.finishPresentingNotification('notif-1', completion);
    expect(mockRNBridgeModule.finishPresentingNotification).toHaveBeenCalledWith('notif-1', completion);
  });

  it('sends finishHandlingAction with the notification id', () => {
    sender.finishHandlingAction('notif-2');
    expect(mockRNBridgeModule.finishHandlingAction).toHaveBeenCalledWith('notif-2');
  });

  it('sends setNotificationChannel with the channel', () => {
    const channel: NotificationChannel = {
      channelId: 'chan',
      name: 'Chan',
      importance: 3,
    };
    sender.setNotificationChannel(channel);
    expect(mockRNBridgeModule.setNotificationChannel).toHaveBeenCalledWith(channel);
  });

  it('sends finishHandlingBackgroundAction with id and fetch result', () => {
    sender.finishHandlingBackgroundAction('notif-3', 'newData');
    expect(mockRNBridgeModule.finishHandlingBackgroundAction).toHaveBeenCalledWith('notif-3', 'newData');
  });
});
