/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Notification } from '../../src/DTO/Notification';

describe('Notification', () => {
  const payload = {
    identifier: 'notification-id',
    title: 'title',
    body: 'body',
    sound: 'sound',
    badge: 3,
    type: 'type',
    thread: 'thread',
  };

  it('keeps the raw payload on the instance', () => {
    const notification = new Notification(payload);
    expect(notification.payload).toBe(payload);
  });

  it('maps identifier from the payload', () => {
    expect(new Notification(payload).identifier).toBe('notification-id');
  });

  it('exposes title from the payload', () => {
    expect(new Notification(payload).title).toBe('title');
  });

  it('exposes body from the payload', () => {
    expect(new Notification(payload).body).toBe('body');
  });

  it('exposes sound from the payload', () => {
    expect(new Notification(payload).sound).toBe('sound');
  });

  it('exposes badge from the payload', () => {
    expect(new Notification(payload).badge).toBe(3);
  });

  it('exposes type from the payload', () => {
    expect(new Notification(payload).type).toBe('type');
  });

  it('exposes thread from the payload', () => {
    expect(new Notification(payload).thread).toBe('thread');
  });

  it('returns undefined for missing payload fields', () => {
    const notification = new Notification({});
    expect(notification.identifier).toBeUndefined();
    expect(notification.title).toBeUndefined();
    expect(notification.body).toBeUndefined();
    expect(notification.sound).toBeUndefined();
    expect(notification.badge).toBeUndefined();
    expect(notification.type).toBeUndefined();
    expect(notification.thread).toBeUndefined();
  });
});
