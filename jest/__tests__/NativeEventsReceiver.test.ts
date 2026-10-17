/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NativeEventEmitter, TurboModuleRegistry } from 'react-native';
import { NativeEventsReceiver } from '../../src/adapters/NativeEventsReceiver';
import { Notification } from '../../src/DTO/Notification';
import { NotificationActionResponse } from '../../src/interfaces/NotificationActionResponse';

describe('NativeEventsReceiver', () => {
  let addListenerSpy: jest.SpyInstance;
  let fromPayload: jest.Mock;
  let receiver: NativeEventsReceiver;

  beforeEach(() => {
    addListenerSpy = jest.spyOn(NativeEventEmitter.prototype, 'addListener');
    fromPayload = jest.fn((payload: any) => new Notification(payload));
    receiver = new NativeEventsReceiver({ fromPayload } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('attaches its NativeEventEmitter to the RNBridgeModule turbo module', () => {
    expect(TurboModuleRegistry.get).toHaveBeenCalledWith('RNBridgeModule');
  });

  it('falls back to a real NotificationFactory when none is provided', () => {
    const receiverWithoutFactory = new NativeEventsReceiver();
    const callback = jest.fn();

    receiverWithoutFactory.registerNotificationReceived(callback);
    const wrappedListener = addListenerSpy.mock.calls[0][1];
    wrappedListener({ identifier: 'default-factory', title: 'harmony-flat' });

    expect(callback).toHaveBeenCalledWith(expect.any(Notification));
    expect(callback.mock.calls[0][0].title).toBe('harmony-flat');
  });

  it('registers remoteNotificationsRegistered listeners', () => {
    const callback = jest.fn();
    const subscription = receiver.registerRemoteNotificationsRegistered(callback);

    expect(addListenerSpy).toHaveBeenCalledWith('remoteNotificationsRegistered', callback);
    expect(subscription).toBeDefined();
  });

  it('registers appNotificationSettingsLinked listeners', () => {
    const callback = jest.fn();
    receiver.appNotificationSettingsLinked(callback);

    expect(addListenerSpy).toHaveBeenCalledWith('appNotificationSettingsLinked', callback);
  });

  it('registers pushKitRegistered listeners', () => {
    const callback = jest.fn();
    receiver.registerPushKitRegistered(callback);

    expect(addListenerSpy).toHaveBeenCalledWith('pushKitRegistered', callback);
  });

  it('registers remoteNotificationsRegistrationFailed listeners', () => {
    const callback = jest.fn();
    receiver.registerRemoteNotificationsRegistrationFailed(callback);

    expect(addListenerSpy).toHaveBeenCalledWith('remoteNotificationsRegistrationFailed', callback);
  });

  it('registers remoteNotificationsRegistrationDenied listeners', () => {
    const callback = jest.fn();
    receiver.registerRemoteNotificationsRegistrationDenied(callback);

    expect(addListenerSpy).toHaveBeenCalledWith('remoteNotificationsRegistrationDenied', callback);
  });

  it('registers pushKitNotificationReceived listeners without payload mapping', () => {
    const callback = jest.fn();
    receiver.registerPushKitNotificationReceived(callback);

    expect(addListenerSpy).toHaveBeenCalledWith('pushKitNotificationReceived', callback);
  });

  describe('payload-mapping subscriptions', () => {
    it('maps notificationReceived payloads through the factory before invoking the callback', () => {
      const callback = jest.fn();
      receiver.registerNotificationReceived(callback);

      const wrappedListener = addListenerSpy.mock.calls[0][1];
      wrappedListener({ identifier: 'raw-fg' });

      expect(fromPayload).toHaveBeenCalledWith({ identifier: 'raw-fg' });
      expect(callback).toHaveBeenCalledWith(expect.any(Notification));
    });

    it('maps notificationReceivedBackground payloads through the factory', () => {
      const callback = jest.fn();
      receiver.registerNotificationReceivedBackground(callback);

      const wrappedListener = addListenerSpy.mock.calls[0][1];
      wrappedListener({ identifier: 'raw-bg' });

      expect(fromPayload).toHaveBeenCalledWith({ identifier: 'raw-bg' });
      expect(callback).toHaveBeenCalledWith(expect.any(Notification));
    });
  });

  describe('registerNotificationOpened', () => {
    it('maps the notification payload and builds an action response when present', () => {
      const callback = jest.fn();
      receiver.registerNotificationOpened(callback);

      const wrappedListener = addListenerSpy.mock.calls[0][1];
      wrappedListener({
        notification: { identifier: 'opened-1' },
        action: { identifier: 'action-1', text: 'reply text' },
      });

      expect(fromPayload).toHaveBeenCalledWith({ identifier: 'opened-1' });
      expect(callback).toHaveBeenCalledTimes(1);

      const [notification, action] = callback.mock.calls[0];
      expect(notification).toBeInstanceOf(Notification);
      expect(action).toBeInstanceOf(NotificationActionResponse);
      expect(action.identifier).toBe('action-1');
      expect(action.text).toBe('reply text');
    });

    it('passes undefined action when the response carries none', () => {
      const callback = jest.fn();
      receiver.registerNotificationOpened(callback);

      const wrappedListener = addListenerSpy.mock.calls[0][1];
      wrappedListener({ notification: { identifier: 'opened-2' } });

      expect(callback).toHaveBeenCalledWith(expect.any(Notification), undefined);
    });
  });
});
