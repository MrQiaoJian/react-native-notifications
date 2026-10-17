/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// 白盒单元测试全局 setup（不依赖鸿蒙设备）。
// __DEV__ 已由 jest.config.js 的 globals 提供，这里仅兜底，
// 并为未来需要全局 mock 的场景预留挂载点。
if (typeof global.__DEV__ === 'undefined') {
  global.__DEV__ = true;
}
