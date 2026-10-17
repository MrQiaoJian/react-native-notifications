/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Platform } from 'react-native';
import { NotificationsAndroid } from '../../src/NotificationsAndroid';
import { Commands } from '../../src/commands/Commands';
import { NotificationChannel } from '../../src/interfaces/NotificationChannel';

function createCommands() {
  return {
    requestPermissions: jest.fn(),
    refreshToken: jest.fn(),
    setNotificationChannel: jest.fn(),
  };
}

describe('NotificationsAndroid', () => {
  afterEach(() => {
    Platform.OS = 'harmony';
  });

  describe('on harmony (android face is the public surface)', () => {
    it('registerRemoteNotifications triggers a permissions request', () => {
      Platform.OS = 'harmony';
      const commands = createCommands();

      new NotificationsAndroid(commands as unknown as Commands).registerRemoteNotifications();

      expect(commands.requestPermissions).toHaveBeenCalledTimes(1);
    });

    it('refreshToken delegates to the commands', () => {
      Platform.OS = 'harmony';
      const commands = createCommands();

      new NotificationsAndroid(commands as unknown as Commands).refreshToken();

      expect(commands.refreshToken).toHaveBeenCalledTimes(1);
    });

    it('setNotificationChannel delegates and returns the native result', () => {
      Platform.OS = 'harmony';
      const commands = createCommands();
      const channel: NotificationChannel = { channelId: 'chan', name: 'Chan', importance: 3 };
      const result = {};
      commands.setNotificationChannel.mockReturnValueOnce(result);

      const facade = new NotificationsAndroid(commands as unknown as Commands);
      expect(facade.setNotificationChannel(channel)).toBe(result);
      expect(commands.setNotificationChannel).toHaveBeenCalledWith(channel);
    });
  });

  describe('on android', () => {
    it('exposes the full android face', () => {
      Platform.OS = 'android';
      const commands = createCommands();
      const channel: NotificationChannel = { channelId: 'chan', name: 'Chan', importance: 3 };

      const facade = new NotificationsAndroid(commands as unknown as Commands);
      facade.registerRemoteNotifications();
      facade.refreshToken();
      facade.setNotificationChannel(channel);

      expect(commands.requestPermissions).toHaveBeenCalledTimes(1);
      expect(commands.refreshToken).toHaveBeenCalledTimes(1);
      expect(commands.setNotificationChannel).toHaveBeenCalledWith(channel);
    });
  });

  describe('on ios', () => {
    it('turns every android-face method into a no-op', () => {
      Platform.OS = 'ios';
      const commands = createCommands();

      const facade = new NotificationsAndroid(commands as unknown as Commands);
      expect(() => facade.registerRemoteNotifications()).not.toThrow();
      expect(() => facade.refreshToken()).not.toThrow();
      expect(facade.setNotificationChannel({} as NotificationChannel)).toBeUndefined();

      expect(commands.requestPermissions).not.toHaveBeenCalled();
      expect(commands.refreshToken).not.toHaveBeenCalled();
      expect(commands.setNotificationChannel).not.toHaveBeenCalled();
    });
  });
});
