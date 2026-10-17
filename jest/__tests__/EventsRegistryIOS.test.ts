/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventsRegistryIOS } from '../../src/events/EventsRegistryIOS';
import { NativeEventsReceiver } from '../../src/adapters/NativeEventsReceiver';
import { CompletionCallbackWrapper } from '../../src/adapters/CompletionCallbackWrapper';

function createNativeEventsReceiver() {
  const subscriptionStub = { remove: jest.fn() };
  return {
    registerPushKitRegistered: jest.fn(() => subscriptionStub),
    registerPushKitNotificationReceived: jest.fn(),
    appNotificationSettingsLinked: jest.fn(),
  };
}

describe('EventsRegistryIOS', () => {
  let nativeEventsReceiver: ReturnType<typeof createNativeEventsReceiver>;
  let eventsRegistryIOS: EventsRegistryIOS;

  beforeEach(() => {
    nativeEventsReceiver = createNativeEventsReceiver();
    eventsRegistryIOS = new EventsRegistryIOS(
      nativeEventsReceiver as unknown as NativeEventsReceiver,
      new CompletionCallbackWrapper()
    );
  });

  it('passes the callback through for pushKitRegistered', () => {
    const callback = jest.fn();
    const subscription = eventsRegistryIOS.registerPushKitRegistered(callback);

    expect(nativeEventsReceiver.registerPushKitRegistered).toHaveBeenCalledWith(callback);
    expect(subscription).toBeDefined();
  });

  it('passes the callback through for appNotificationSettingsLinked', () => {
    const callback = jest.fn();
    eventsRegistryIOS.appNotificationSettingsLinked(callback);

    expect(nativeEventsReceiver.appNotificationSettingsLinked).toHaveBeenCalledWith(callback);
  });

  it('wraps the pushKit notification callback and injects a completion', () => {
    const callback = jest.fn();
    eventsRegistryIOS.registerPushKitNotificationReceived(callback);

    expect(nativeEventsReceiver.registerPushKitNotificationReceived).toHaveBeenCalledTimes(1);
    const wrapped = nativeEventsReceiver.registerPushKitNotificationReceived.mock.calls[0][0];
    expect(wrapped).not.toBe(callback);

    const pushKitEvent = { payload: 'push-kit' };
    wrapped(pushKitEvent);

    // wrapOpenedCallback 固定注入 completion，并将 actionResponse 透传（此处为 undefined）
    expect(callback).toHaveBeenCalledWith(pushKitEvent, expect.any(Function), undefined);
  });
});
