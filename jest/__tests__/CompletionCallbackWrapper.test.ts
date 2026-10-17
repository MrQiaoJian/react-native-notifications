/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompletionCallbackWrapper } from '../../src/adapters/CompletionCallbackWrapper';
import { Notification } from '../../src/DTO/Notification';
import { NotificationActionResponse } from '../../src/interfaces/NotificationActionResponse';

describe('CompletionCallbackWrapper', () => {
  let wrapper: CompletionCallbackWrapper;

  beforeEach(() => {
    wrapper = new CompletionCallbackWrapper();
  });

  describe('wrapReceivedForegroundCallback', () => {
    it('invokes the callback with the notification and a completion function', () => {
      const callback = jest.fn();
      const notification = new Notification({ identifier: 'fg' });

      wrapper.wrapReceivedForegroundCallback(callback)(notification);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(notification, expect.any(Function));
    });

    it('provides a no-op completion on harmony (no foreground interception protocol)', () => {
      const callback = jest.fn();
      wrapper.wrapReceivedForegroundCallback(callback)(new Notification({}));

      const completion = callback.mock.calls[0][1];
      expect(() => completion({ badge: true, alert: true, sound: true })).not.toThrow();
    });
  });

  describe('wrapReceivedBackgroundCallback', () => {
    it('invokes the callback with the notification and a completion function', () => {
      const callback = jest.fn();
      const notification = new Notification({ identifier: 'bg' });

      wrapper.wrapReceivedBackgroundCallback(callback)(notification);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(notification, expect.any(Function));
    });

    it('provides a callable completion accepting a background fetch result', () => {
      const callback = jest.fn();
      wrapper.wrapReceivedBackgroundCallback(callback)(new Notification({}));

      const completion = callback.mock.calls[0][1];
      expect(() => completion('newData' as never)).not.toThrow();
    });
  });

  describe('wrapOpenedCallback', () => {
    it('invokes the callback with notification, completion and actionResponse', () => {
      const callback = jest.fn();
      const notification = new Notification({ identifier: 'opened' });
      const actionResponse = new NotificationActionResponse({
        identifier: 'action',
        text: 'reply',
      });

      wrapper.wrapOpenedCallback(callback)(notification, actionResponse);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        notification,
        expect.any(Function),
        actionResponse
      );

      const completion = callback.mock.calls[0][1];
      expect(() => completion()).not.toThrow();
    });

    it('passes undefined actionResponse through', () => {
      const callback = jest.fn();
      const notification = new Notification({ identifier: 'opened-no-action' });

      wrapper.wrapOpenedCallback(callback)(notification, undefined);

      expect(callback).toHaveBeenCalledWith(notification, expect.any(Function), undefined);
    });
  });
});
