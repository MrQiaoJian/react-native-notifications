/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Platform } from 'react-native';
import { NotificationsIOS } from '../../src/NotificationsIOS';
import { Commands } from '../../src/commands/Commands';
import { EventsRegistryIOS } from '../../src/events/EventsRegistryIOS';
import { Notification } from '../../src/DTO/Notification';
import { NotificationPermissionOptions } from '../../src/interfaces/NotificationPermissions';

function createCommands() {
  return {
    requestPermissions: jest.fn(),
    abandonPermissions: jest.fn(),
    registerPushKit: jest.fn(),
    getBadgeCount: jest.fn(),
    setBadgeCount: jest.fn(),
    cancelAllLocalNotifications: jest.fn(),
    checkPermissions: jest.fn(),
    removeDeliveredNotifications: jest.fn(),
    getDeliveredNotifications: jest.fn(),
  };
}

function createFacade(commands = createCommands(), eventsRegistry = {} as EventsRegistryIOS) {
  return new NotificationsIOS(
    commands as unknown as Commands,
    eventsRegistry
  );
}

describe('NotificationsIOS', () => {
  afterEach(() => {
    Platform.OS = 'harmony';
  });

  describe('on harmony (ios face implemented on top of harmony capabilities)', () => {
    it('registerRemoteNotifications requests permissions with the options', () => {
      Platform.OS = 'harmony';
      const commands = createCommands();
      const options: NotificationPermissionOptions = { provisional: true };
      const result = {};
      commands.requestPermissions.mockReturnValueOnce(result);

      expect(createFacade(commands).registerRemoteNotifications(options)).toBe(result);
      expect(commands.requestPermissions).toHaveBeenCalledWith(options);
    });

    it('delegates the remaining command surface', async () => {
      Platform.OS = 'harmony';
      const commands = createCommands();
      const facade = createFacade(commands);

      facade.abandonPermissions();
      facade.registerPushKit();
      commands.getBadgeCount.mockResolvedValueOnce(5);
      facade.setBadgeCount(5);
      facade.cancelAllLocalNotifications();
      commands.checkPermissions.mockResolvedValueOnce({ alert: true });
      facade.removeDeliveredNotifications(['id-1']);
      commands.getDeliveredNotifications.mockResolvedValueOnce([
        new Notification({ identifier: 'd1' }),
      ]);

      expect(commands.abandonPermissions).toHaveBeenCalledTimes(1);
      expect(commands.registerPushKit).toHaveBeenCalledTimes(1);
      await expect(facade.getBadgeCount()).resolves.toBe(5);
      expect(commands.setBadgeCount).toHaveBeenCalledWith(5);
      expect(commands.cancelAllLocalNotifications).toHaveBeenCalledTimes(1);
      await expect(facade.checkPermissions()).resolves.toEqual({ alert: true });
      expect(commands.removeDeliveredNotifications).toHaveBeenCalledWith(['id-1']);
      await expect(facade.getDeliveredNotifications()).resolves.toHaveLength(1);
    });

    it('exposes the ios events registry', () => {
      Platform.OS = 'harmony';
      const eventsRegistry = { registerPushKitRegistered: jest.fn() } as unknown as EventsRegistryIOS;
      const facade = createFacade(createCommands(), eventsRegistry);

      expect(facade.events()).toBe(eventsRegistry);
    });
  });

  describe('on ios', () => {
    it('exposes the full ios face', () => {
      Platform.OS = 'ios';
      const commands = createCommands();

      createFacade(commands).registerRemoteNotifications();

      expect(commands.requestPermissions).toHaveBeenCalledWith(undefined);
    });
  });

  describe('on android', () => {
    it('turns every ios-face method into a no-op', () => {
      Platform.OS = 'android';
      const commands = createCommands();
      const eventsRegistry = {} as EventsRegistryIOS;

      const facade = createFacade(commands, eventsRegistry);
      expect(() => facade.registerRemoteNotifications()).not.toThrow();
      expect(() => facade.abandonPermissions()).not.toThrow();
      expect(() => facade.registerPushKit()).not.toThrow();
      expect(() => facade.setBadgeCount(1)).not.toThrow();
      expect(() => facade.cancelAllLocalNotifications()).not.toThrow();
      expect(() => facade.removeDeliveredNotifications(['id'])).not.toThrow();
      expect(facade.events()).toBeUndefined();

      expect(commands.requestPermissions).not.toHaveBeenCalled();
      expect(commands.abandonPermissions).not.toHaveBeenCalled();
      expect(commands.setBadgeCount).not.toHaveBeenCalled();
    });
  });
});
