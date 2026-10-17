/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Notifications, Notification, NotificationBackgroundFetchResult } from '../../src/index';
import { NotificationsRoot } from '../../src/Notifications';
import { NotificationsIOS } from '../../src/NotificationsIOS';
import { NotificationsAndroid } from '../../src/NotificationsAndroid';
import { EventsRegistry } from '../../src/events/EventsRegistry';

describe('index', () => {
  it('exports a NotificationsRoot singleton', () => {
    expect(Notifications).toBeInstanceOf(NotificationsRoot);
  });

  it('re-exports the shared Notification DTO', () => {
    const notification = new Notification({ identifier: 'id' });
    expect(notification.identifier).toBe('id');
  });

  it('re-exports the NotificationBackgroundFetchResult enum', () => {
    expect(NotificationBackgroundFetchResult.NEW_DATA).toBe('newData');
  });

  it('exposes the ios/android faces and the events registry on the singleton', () => {
    expect(Notifications.ios).toBeInstanceOf(NotificationsIOS);
    expect(Notifications.android).toBeInstanceOf(NotificationsAndroid);
    expect(Notifications.events()).toBeInstanceOf(EventsRegistry);
  });
});
