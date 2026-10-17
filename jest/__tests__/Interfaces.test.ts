/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NotificationActionResponse } from '../../src/interfaces/NotificationActionResponse';
import {
  NotificationAction,
  NotificationCategory,
} from '../../src/interfaces/NotificationCategory';
import { NotificationBackgroundFetchResult } from '../../src/interfaces/NotificationCompletion';

describe('NotificationActionResponse', () => {
  it('maps identifier and text from the raw response', () => {
    const response = new NotificationActionResponse({
      identifier: 'reply',
      text: 'hello',
    });

    expect(response.identifier).toBe('reply');
    expect(response.text).toBe('hello');
  });

  it('leaves text undefined when the raw response carries none', () => {
    const response = new NotificationActionResponse({ identifier: 'open' });

    expect(response.identifier).toBe('open');
    expect(response.text).toBeUndefined();
  });
});

describe('NotificationCategory', () => {
  it('stores the identifier and actions', () => {
    const actions = [
      new NotificationAction('reply', 'background', 'Reply', false),
    ];

    const category = new NotificationCategory('category-id', actions);

    expect(category.identifier).toBe('category-id');
    expect(category.actions).toBe(actions);
  });

  it('allows building a category without actions', () => {
    const category = new NotificationCategory('category-id');

    expect(category.actions).toBeUndefined();
  });
});

describe('NotificationAction', () => {
  it('stores identifier, activation mode, title and authentication flag', () => {
    const action = new NotificationAction(
      'action-id',
      'foreground',
      'Open',
      true
    );

    expect(action.identifier).toBe('action-id');
    expect(action.activationMode).toBe('foreground');
    expect(action.title).toBe('Open');
    expect(action.authenticationRequired).toBe(true);
    expect(action.textInput).toBeUndefined();
  });

  it('stores the optional text input configuration', () => {
    const action = new NotificationAction(
      'action-id',
      'background',
      'Reply',
      false,
      { buttonTitle: 'Send', placeholder: 'Type something' }
    );

    expect(action.textInput).toEqual({ buttonTitle: 'Send', placeholder: 'Type something' });
  });
});

describe('NotificationBackgroundFetchResult', () => {
  it('exposes the three background fetch result values', () => {
    expect(NotificationBackgroundFetchResult.NEW_DATA).toBe('newData');
    expect(NotificationBackgroundFetchResult.NO_DATA).toBe('noData');
    expect(NotificationBackgroundFetchResult.FAILED).toBe('failed');
  });
});
