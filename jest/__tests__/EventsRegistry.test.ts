/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventsRegistry } from '../../src/events/EventsRegistry';
import { NativeEventsReceiver } from '../../src/adapters/NativeEventsReceiver';
import { CompletionCallbackWrapper } from '../../src/adapters/CompletionCallbackWrapper';
import { Notification } from '../../src/DTO/Notification';
import { NotificationActionResponse } from '../../src/interfaces/NotificationActionResponse';

function createNativeEventsReceiver() {
  const subscriptionStub = { remove: jest.fn() };
  return {
    registerRemoteNotificationsRegistered: jest.fn(() => subscriptionStub),
    registerNotificationReceived: jest.fn(),
    registerNotificationReceivedBackground: jest.fn(),
    registerNotificationOpened: jest.fn(),
    registerRemoteNotificationsRegistrationFailed: jest.fn(),
    registerRemoteNotificationsRegistrationDenied: jest.fn(),
  };
}

describe('EventsRegistry', () => {
  let nativeEventsReceiver: ReturnType<typeof createNativeEventsReceiver>;
  let eventsRegistry: EventsRegistry;

  beforeEach(() => {
    nativeEventsReceiver = createNativeEventsReceiver();
    eventsRegistry = new EventsRegistry(
      nativeEventsReceiver as unknown as NativeEventsReceiver,
      new CompletionCallbackWrapper()
    );
  });

  it('passes the callback through for remoteNotificationsRegistered', () => {
    const callback = jest.fn();
    const subscription = eventsRegistry.registerRemoteNotificationsRegistered(callback);

    expect(nativeEventsReceiver.registerRemoteNotificationsRegistered).toHaveBeenCalledWith(callback);
    expect(subscription).toBeDefined();
  });

  it('passes the callback through for remoteNotificationsRegistrationFailed', () => {
    const callback = jest.fn();
    eventsRegistry.registerRemoteNotificationsRegistrationFailed(callback);

    expect(nativeEventsReceiver.registerRemoteNotificationsRegistrationFailed).toHaveBeenCalledWith(callback);
  });

  it('passes the callback through for remoteNotificationsRegistrationDenied', () => {
    const callback = jest.fn();
    eventsRegistry.registerRemoteNotificationsRegistrationDenied(callback);

    expect(nativeEventsReceiver.registerRemoteNotificationsRegistrationDenied).toHaveBeenCalledWith(callback);
  });

  it('wraps the foreground callback and injects a completion', () => {
    const callback = jest.fn();
    eventsRegistry.registerNotificationReceivedForeground(callback);

    expect(nativeEventsReceiver.registerNotificationReceived).toHaveBeenCalledTimes(1);
    const wrapped = nativeEventsReceiver.registerNotificationReceived.mock.calls[0][0];
    expect(wrapped).not.toBe(callback);

    const notification = new Notification({ identifier: 'fg' });
    wrapped(notification);

    expect(callback).toHaveBeenCalledWith(notification, expect.any(Function));
  });

  it('wraps the background callback and injects a completion', () => {
    const callback = jest.fn();
    eventsRegistry.registerNotificationReceivedBackground(callback);

    expect(nativeEventsReceiver.registerNotificationReceivedBackground).toHaveBeenCalledTimes(1);
    const wrapped = nativeEventsReceiver.registerNotificationReceivedBackground.mock.calls[0][0];

    const notification = new Notification({ identifier: 'bg' });
    wrapped(notification);

    expect(callback).toHaveBeenCalledWith(notification, expect.any(Function));
  });

  it('wraps the opened callback and injects a completion before the action response', () => {
    const callback = jest.fn();
    eventsRegistry.registerNotificationOpened(callback);

    expect(nativeEventsReceiver.registerNotificationOpened).toHaveBeenCalledTimes(1);
    const wrapped = nativeEventsReceiver.registerNotificationOpened.mock.calls[0][0];
    expect(wrapped).not.toBe(callback);

    const notification = new Notification({ identifier: 'opened' });
    const actionResponse = new NotificationActionResponse({ identifier: 'action' });
    wrapped(notification, actionResponse);

    expect(callback).toHaveBeenCalledWith(notification, expect.any(Function), actionResponse);
  });
});
