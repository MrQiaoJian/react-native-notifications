/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Platform } from 'react-native';
import { NotificationFactory } from '../../src/DTO/NotificationFactory';
import { Notification } from '../../src/DTO/Notification';
import { NotificationIOS } from '../../src/DTO/NotificationIOS';
import { NotificationAndroid } from '../../src/DTO/NotificationAndroid';

describe('NotificationFactory', () => {
  afterEach(() => {
    Platform.OS = 'harmony';
  });

  it('creates a NotificationIOS on ios when the payload carries aps', () => {
    Platform.OS = 'ios';
    const notification = new NotificationFactory().fromPayload({
      aps: { alert: 'hello' },
    });
    expect(notification).toBeInstanceOf(NotificationIOS);
  });

  it('creates a plain Notification on ios when the payload has no aps', () => {
    Platform.OS = 'ios';
    const notification = new NotificationFactory().fromPayload({
      identifier: 'id',
    });
    expect(notification).toBeInstanceOf(Notification);
    expect(notification).not.toBeInstanceOf(NotificationIOS);
    expect(notification).not.toBeInstanceOf(NotificationAndroid);
  });

  it('creates a plain Notification on harmony even when aps is present', () => {
    // 鸿蒙原生侧保证 payload 平铺结构，不走 iOS aps / Android google.message_id 解析
    Platform.OS = 'harmony';
    const notification = new NotificationFactory().fromPayload({
      aps: { alert: 'ignored' },
      'google.message_id': 'ignored',
    });
    expect(notification).toBeInstanceOf(Notification);
    expect(notification).not.toBeInstanceOf(NotificationIOS);
    expect(notification).not.toBeInstanceOf(NotificationAndroid);
  });

  it('creates a NotificationAndroid on android', () => {
    Platform.OS = 'android';
    const notification = new NotificationFactory().fromPayload({
      'google.message_id': 'gmsg-1',
    });
    expect(notification).toBeInstanceOf(NotificationAndroid);
    expect(notification.identifier).toBe('gmsg-1');
  });

  it('falls back to NotificationAndroid on any other platform', () => {
    Platform.OS = 'windows';
    expect(new NotificationFactory().fromPayload({})).toBeInstanceOf(NotificationAndroid);
  });
});
