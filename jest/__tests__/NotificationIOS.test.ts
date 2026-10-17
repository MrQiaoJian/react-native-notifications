/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Notification } from '../../src/DTO/Notification';
import { NotificationIOS } from '../../src/DTO/NotificationIOS';

describe('NotificationIOS', () => {
  it('maps identifier from the payload', () => {
    const notification = new NotificationIOS({ identifier: 'ios-id' });
    expect(notification.identifier).toBe('ios-id');
  });

  it('exposes aps from the payload', () => {
    const aps = { alert: { title: 't' } };
    expect(new NotificationIOS({ aps }).aps).toBe(aps);
  });

  it('defaults aps to an empty object when missing', () => {
    expect(new NotificationIOS({}).aps).toEqual({});
  });

  describe('alert normalization', () => {
    it('passes an object alert through unchanged', () => {
      const alert = { title: 'obj-title', body: 'obj-body' };
      const notification = new NotificationIOS({ aps: { alert } });
      expect(notification.alert).toBe(alert);
      expect(notification.title).toBe('obj-title');
      expect(notification.body).toBe('obj-body');
    });

    it('wraps a string alert into { body }', () => {
      const notification = new NotificationIOS({ aps: { alert: 'plain-alert' } });
      expect(notification.alert).toEqual({ body: 'plain-alert' });
      expect(notification.body).toBe('plain-alert');
      expect(notification.title).toBeUndefined();
    });

    it('leaves alert undefined when aps has none (title/body then dereference undefined)', () => {
      const notification = new NotificationIOS({ aps: {} });
      expect(notification.alert).toBeUndefined();
      // 与上游语义一致：alert 缺失时 title/body getter 解引用 undefined 抛错
      expect(() => notification.title).toThrow(TypeError);
      expect(() => notification.body).toThrow(TypeError);
    });
  });

  it('exposes sound from aps', () => {
    expect(new NotificationIOS({ aps: { sound: 'chime' } }).sound).toBe('chime');
  });

  it('exposes badge from aps', () => {
    expect(new NotificationIOS({ aps: { badge: 7 } }).badge).toBe(7);
  });

  it('exposes thread from aps', () => {
    expect(new NotificationIOS({ aps: { thread: 'thread-id' } }).thread).toBe('thread-id');
  });

  it('extends the base Notification', () => {
    expect(new NotificationIOS({})).toBeInstanceOf(Notification);
  });
});
