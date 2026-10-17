/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { UniqueIdProvider } from '../../src/adapters/UniqueIdProvider';

describe('UniqueIdProvider', () => {
  it('generates sequential ids starting from 1', () => {
    const provider = new UniqueIdProvider();
    expect(provider.generate()).toBe(1);
    expect(provider.generate()).toBe(2);
    expect(provider.generate()).toBe(3);
  });

  it('shares the counter across instances (lodash uniqueId semantics)', () => {
    // 鸿蒙包内 lodash 缺失，以内联静态计数器实现等价语义：跨实例递增
    const first = new UniqueIdProvider();
    const second = new UniqueIdProvider();
    const firstId = first.generate();
    expect(second.generate()).toBe(firstId + 1);
  });
});
