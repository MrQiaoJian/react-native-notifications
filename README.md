# @oh-rn/react-native-notifications for HarmonyOS

本项目基于 [react-native-notifications](https://github.com/wix/react-native-notifications) 开发，为 React Native 鸿蒙（OpenHarmony）适配版本。

## 版本对应关系

| 鸿蒙适配包版本 | 原始库版本 | 支持 RN 版本 | Autolink | 编译 API 版本 |
| ------------ | ---------- | ------------ | -------- | ------------- |
| 见发布记录 | 5.1.0 | 0.72+ | 是 | API12+ |

## 安装

```bash
npm install @oh-rn/react-native-notifications
```

## 使用

```tsx
import { Notifications } from 'react-native-notifications';

// 注册远程通知（鸿蒙：弹系统授权框 → 获取 Push Kit token）
Notifications.registerRemoteNotifications();
Notifications.events().registerRemoteNotificationsRegistered((event) => {
  console.log('deviceToken:', event.deviceToken);
});

// 发布本地通知（点击通知经 wantAgent 回拉应用并携带原始 payload）
Notifications.postLocalNotification({
  title: '会议提醒',
  body: '10:30 产品评审',
  payload: { category: 'SOME_CATEGORY', link: 'app://meeting/1' },
});

// 监听通知点击（含行动按钮文本输入回传）
Notifications.events().registerNotificationOpened((notification, completion, actionResponse) => {
  console.log(notification.title, actionResponse?.identifier, actionResponse?.text);
  completion();
});
```

> import 时使用原库名 `'react-native-notifications'`，而非鸿蒙包名（由 RNOH alias 映射）。

**平台差异**：
- 远程推送走 Push Kit：`registerRemoteNotifications()` 先经 `requestEnableNotification` 弹系统授权框，再取 Push token（需 AGC 开通推送服务 + 真机签名；失败派发 `remoteNotificationsRegistrationFailed`，本地通知不受影响）
- 前台通知展示由系统通知中心管理，iOS 的 completion 协议（3 个 finish 方法）为空实现
- `abandonPermissions()` 跳转本应用通知设置页（API 18+），鸿蒙不支持程序化撤销授权

**权限要求**：
- 通知授权经运行时 `requestEnableNotification` 系统弹窗申请，`module.json5` 无需声明 `ohos.permission.*`
- 自定义铃声需将音频文件放入应用 `resources/rawfile`，`sound` 传文件名（如 `'chime.wav'`）

## Link

| 版本 | 是否支持 Autolink |
|------|------------------|
| 当前版本 | 是 |

如使用版本支持 Autolink 且工程已接入，可跳过手动配置。

<details>
<summary>Manual Link 配置</summary>

> **说明**：本模块需要同时在 C++ 侧和 ETS 侧注册 Package。

### 1. Overrides RN SDK

在工程根目录 `oh-package.json5` 添加：

```json
{
  "overrides": {
    "@rnoh/react-native-openharmony": "./react_native_openharmony"
  }
}
```

### 2. 引入原生端依赖

打开 `entry/oh-package.json5`，添加：

```json
"dependencies": {
  "@oh-rn/react-native-notifications": "file:../../node_modules/@oh-rn/react-native-notifications/harmony/notifications.har"
}
```

执行 `ohpm install`。

### 3. 配置 CMakeLists

打开 `entry/src/main/cpp/CMakeLists.txt`，添加：

```cmake
set(OH_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../oh_modules")

add_subdirectory("${OH_MODULES}/@oh-rn/react-native-notifications/src/main/cpp" ./notifications)

target_link_libraries(rnoh_app PUBLIC notifications)
```

### 4. 注册 Package（C++ 侧）

打开 `entry/src/main/cpp/PackageProvider.cpp`，添加：

```cpp
#include "NotificationsPackage.h"

std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
    return {
        std::make_shared<NotificationsPackage>(ctx),
    };
}
```

### 5. 注册 Package（ETS 侧）

打开 `entry/src/main/ets/RNPackagesFactory.ets`，添加：

```typescript
import { NotificationsPackage } from '@oh-rn/react-native-notifications/ts';

export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [
    new NotificationsPackage(ctx),
  ];
}
```

</details>

## 属性 / API

| API | 描述 | 参数 | 返回值 | HarmonyOS 支持 |
|-----|------|------|--------|----------------|
| registerRemoteNotifications | 申请通知授权并注册远程推送 | options?: NotificationPermissionOptions | void | ⚠️ 需特定条件（授权链路完整；token 依赖 AGC + 真机） |
| postLocalNotification | 发布本地通知 | notification: Notification, id?: number | number | ✅ 完全支持 |
| cancelLocalNotification | 取消指定本地通知 | notificationId: number | void | ✅ 完全支持 |
| cancelAllLocalNotifications | 取消全部本地通知（ios 面） | 无 | void | ✅ 完全支持 |
| getInitialNotification | 获取冷启动通知（一次性消费） | 无 | Promise<Notification \| undefined> | ✅ 完全支持 |
| setCategories | 注册通知类别（行动按钮） | categories: NotificationCategory[] | void | ⚠️ 部分支持（每条通知最多 2 个按钮；activationMode 等属性无系统映射） |
| setNotificationChannel | 设置通知渠道 | channel: NotificationChannel | void | ⚠️ 部分支持（importance 映射槽类型枚举，细粒度字段无系统映射） |
| isRegisteredForRemoteNotifications | 查询通知开关状态 | 无 | Promise<boolean> | ✅ 完全支持 |
| checkPermissions | 查询通知权限 | 无 | Promise<NotificationPermissions> | ⚠️ 部分支持（五项能力统一映射应用级通知开关） |
| getDeliveredNotifications | 查询已发通知 | 无 | Promise<Notification[]> | ✅ 完全支持 |
| removeDeliveredNotifications | 删除指定已发通知 | identifiers: string[] | void | ✅ 完全支持 |
| removeAllDeliveredNotifications | 删除全部已发通知 | 无 | void | ✅ 完全支持 |
| refreshToken | 刷新 Push token（android 面） | 无 | void | ⚠️ 需特定条件（依赖 AGC 开通推送 + 真机） |
| abandonPermissions | 撤销通知授权（ios 面） | 无 | void | ⚠️ 部分支持（跳转本应用通知设置页） |
| registerPushKit | 注册 Push Kit（ios 面） | 无 | void | ⚠️ 需特定条件（依赖 AGC + 真机） |
| getBadgeCount | 读取应用角标（ios 面） | 无 | Promise<number> | ⚠️ 部分支持（API 22+ 真实读取；低版本返回最近一次 setBadgeCount 记录值） |
| setBadgeCount | 设置应用角标（ios 面） | count: number | void | ✅ 完全支持 |
| finishPresentingNotification / finishHandlingAction / finishHandlingBackgroundAction | iOS completion 协议 | notificationId 等 | void | ❌ 不支持（鸿蒙无前台展示拦截回调，空实现） |
| 事件：remoteNotificationsRegistered | token 获取成功 | event: { deviceToken } | — | ⚠️ 需特定条件（依赖 AGC + 真机） |
| 事件：remoteNotificationsRegistrationFailed | token 获取失败 | event: RegistrationError(code/domain/localizedDescription) | — | ✅ 完全支持（失败路径真实派发） |
| 事件：remoteNotificationsRegistrationDenied | 通知授权被拒 | 无 | — | ✅ 完全支持 |
| 事件：notificationReceived / notificationReceivedBackground | 前台/后台收到推送 | notification: Notification | — | ⚠️ 部分支持（仅 Push Kit BACKGROUND 透传消息；通知类消息由系统直接呈现，无到达回调） |
| 事件：notificationOpened | 点击通知/行动按钮 | notification, completion, actionResponse? | — | ✅ 完全支持 |
| 事件：pushKitRegistered / pushKitNotificationReceived | Push Kit 注册成功/透传消息 | event | — | ⚠️ 需特定条件（依赖 AGC + 真机） |
| 事件：appNotificationSettingsLinked | iOS 通知设置链接 | 无 | — | ❌ 不支持（iOS 专属概念，鸿蒙无此事件源） |

### 平台差异

- 渠道粒度：`setNotificationChannel` 的 importance 映射通知槽类型（4+→社交通信、2~3→服务信息、0~1→其他）并 `addSlot`；enableLights/vibrationPattern/groupId/lightColor 等细粒度字段鸿蒙槽位不开放
- 行动按钮：鸿蒙 `NotificationActionButton` 仅支持 title/wantAgent/userInput；`textInput` 文本经 inputKey 回传到 `actionResponse.text`；每条通知最多 2 个按钮（超出截断）
- `checkPermissions` 的 alert/sound/badge/lockScreen/notificationCenter 五项统一映射应用级通知开关（鸿蒙无逐项开关）
- `getInitialNotification` 无冷启动通知时返回 `undefined`（对齐 Android resolve(null) 行为）
- 已发通知的 `identifier` 统一为系统通知 id 字符串，可直接传给 `removeDeliveredNotifications`

### 未实现功能

| API | 原因 |
|-----|------|
| finishPresentingNotification / finishHandlingAction / finishHandlingBackgroundAction | 鸿蒙通知由系统通知中心直接呈现，应用无前台展示拦截/完成回调点（与原库 Android 行为一致，JS 层 completion 为 no-op） |
| appNotificationSettingsLinked 事件 | iOS「通知设置链接」专属概念，鸿蒙通知体系无此事件源 |
| abandonPermissions 程序化撤销 | 鸿蒙无撤销授权 API，最接近替代为 `openNotificationSettings` 跳转设置页（API 18+） |

### 使用限制

- Push token 链路（refreshToken / registerPushKit / registerRemoteNotifications 的 token 事件）依赖 AGC 开通推送服务、`client_id` 配置与真机签名环境；未开通时派发 `remoteNotificationsRegistrationFailed`（错误码如 1000900012），本地通知全链路不受影响
- 自定义铃声音频需位于应用 `resources/rawfile`，`sound` 传文件名（含扩展名，如 `'chime.wav'`）；未提供文件时使用系统默认音
- `getBadgeNumber` 为 API 22+ 接口，低版本设备 `getBadgeCount` 返回最近一次 `setBadgeCount` 的记录值

## 快速验证（运行 Example）

### 前置条件

| 依赖 | 版本要求 |
|------|----------|
| Node.js | >= 18 |
| DevEco Studio | 5.0+ / 6.0+ |
| HarmonyOS SDK | API 12+ |

### 运行步骤

**1. 克隆仓库**

```bash
git clone <仓库地址>
cd <仓库目录>
```

**2. 安装依赖并构建**

```bash
npm install --legacy-peer-deps
npm pack           # 生成 tgz 包（会自动触发 prepare 构建 JS 产物）
```

**3. 进入 example 目录，安装依赖**

```bash
cd example
npm install --legacy-peer-deps
```

**4. 生成 JS Bundle**

```bash
npm run dev
```

产物：`harmony/entry/src/main/resources/rawfile/bundle.harmony.js`

**5. 用 DevEco Studio 打开鸿蒙工程**

- 打开 DevEco Studio
- 选择 `example/harmony` 目录
- 等待 Sync 完成

**6. 编译并运行 HAP**

在 DevEco Studio 中点击运行按钮，将 HAP 安装到设备/模拟器。

> **注意**：Example 中已预置插件依赖和 Package 注册，无需手动配置 Link。

## 约束与限制

### 兼容性

- RNOH: 0.72+
- HarmonyOS SDK: API 12+
- DevEco Studio: 5.0+

## 遗留问题

- Push token 获取依赖 AGC 开通推送服务与真机签名环境，普通构建环境下 `remoteNotificationsRegistered` 不可达（失败路径经 `remoteNotificationsRegistrationFailed` 真实暴露）
- iOS completion 协议（finish 系列方法）为空实现（见「未实现功能」）

## 开源协议

本项目基于 [MIT License](https://github.com/wix/react-native-notifications/blob/master/LICENSE)，详见 [LICENSE](./LICENSE) 文件。