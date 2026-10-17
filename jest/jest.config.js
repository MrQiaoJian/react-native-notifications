/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// react-native-notifications JS 层白盒单元测试专用 Jest 配置。
// 自包含：`babelrc: false` + `configFile: false` 隔离根目录 babel.config.js，
// 不使用根目录 jest.config.js / jest.setup.ts（通过 --config 显式指定本文件）。
module.exports = {
  rootDir: '..',
  testEnvironment: 'node',

  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],

  // 源码与测试均为 TS：babel-jest + preset-typescript 剥离类型并转 CommonJS，
  // preset-env 仅针对当前 Node 版本（保留 class/getter/Proxy 原生语义）。
  transform: {
    '^.+\\.(ts|tsx)$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript',
        ],
      },
    ],
  },

  // react-native 仅作为桥接面被源码 import（Platform / TurboModuleRegistry /
  // NativeEventEmitter），统一映射到 jest/__mocks__ 下的手工 mock，
  // 避免 transformIgnorePatterns 与 RN 包内 Flow/ESM 语法问题。
  moduleNameMapper: {
    '^react-native$': '<rootDir>/jest/__mocks__/react-native.ts',
  },

  setupFiles: ['<rootDir>/jest/jest.setup.js'],

  testMatch: ['<rootDir>/jest/__tests__/**/*.test.ts'],

  // 每个用例前清空 mock 调用记录（保留 jest.fn(impl) 的默认实现）
  clearMocks: true,

  globals: {
    __DEV__: true,
  },

  transformIgnorePatterns: ['/node_modules/'],

  // babel provider：对 TS 编译产物（enum IIFE、class fields）按插桩计数，
  // 避免 v8 provider 经 sourcemap 回映射时把部分语句漏计。
  coverageProvider: 'babel',

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    // codegen spec 无可测业务逻辑（仅类型 + 模块级 getEnforcing）
    '!src/specs/**',
    // 纯类型声明文件无运行时代码，istanbul 不可插桩（编译产物为空模块）；
    // 其中 NotificationCompletion 的 enum 值已在 Interfaces/Index 用例中实际断言
    '!src/interfaces/EventSubscription.ts',
    '!src/interfaces/NotificationChannel.ts',
    '!src/interfaces/NotificationCompletion.ts',
    '!src/interfaces/NotificationEvents.ts',
    '!src/interfaces/NotificationPermissions.ts',
  ],
  coverageDirectory: '<rootDir>/jest/coverage',
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
};
