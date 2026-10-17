/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Notification } from '../../src/DTO/Notification';
import { NotificationAndroid } from '../../src/DTO/NotificationAndroid';

describe('NotificationAndroid', () => {
  const payload = {
    'google.message_id': 'gmsg-1',
    title: 'android-title',
    body: 'android-body',
    sound: 'android-sound',
  };

  it('maps identifier from google.message_id (FCM semantics)', () => {
    expect(new NotificationAndroid(payload).identifier).toBe('gmsg-1');
  });

  it('overrides the base identifier with google.message_id when both exist', () => {
    const notification = new NotificationAndroid({
      ...payload,
      identifier: 'plain-identifier',
    });
    expect(notification.identifier).toBe('gmsg-1');
  });

  it('exposes title from the payload', () => {
    expect(new NotificationAndroid(payload).title).toBe('android-title');
  });

  it('exposes body from the payload', () => {
    expect(new NotificationAndroid(payload).body).toBe('android-body');
  });

  it('exposes sound from the payload', () => {
    expect(new NotificationAndroid(payload).sound).toBe('android-sound');
  });

  it('extends the base Notification', () => {
    expect(new NotificationAndroid(payload)).toBeInstanceOf(Notification);
  });
});
