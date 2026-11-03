<p align="center">
  <h1 align="center"> <code>@react-native-ohos/react-native-notifications</code> </h1>
</p>

本项目基于 [react-native-notifications](https://github.com/wix/react-native-notifications) 开发。

版本所属关系如下：

| 三方库名称 | 三方库版本（npm地址） | 发布信息 | 支持RN版本 | Autolink | 编译API版本 | 社区基线版本 | 源码地址 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @react-native-ohos/react-native-notifications | [~ 5.1.1](https://www.npmjs.com/package/@react-native-ohos/react-native-notifications) | [GitHub Releases](https://github.com/react-native-oh-library/react-native-notifications/releases) | 0.72/0.77/0.82/0.84 | partially(0.72/0.82/0.84) | API12+ | 5.1.0 | [master](https://github.com/react-native-oh-library/react-native-notifications/tree/master) |

## 简介

Notifications 组件用于 React Native。<br/>
提供本地通知发布与管理、远程推送（Push Kit）、通知事件监听（前台/后台到达、点击、行动按钮及文本回传）、通知类别、通知渠道、角标管理等通知全链路能力。

## 下载安装

进入到工程目录并输入以下命令：

**npm**

```bash
npm install @react-native-ohos/react-native-notifications
```

**yarn**

```bash
yarn add @react-native-ohos/react-native-notifications
```

## Link

|                                     | 是否支持Autolink | RN框架版本 |
|--------------------------------------|----------------|-----------|
| ~ 5.1.1  | partially(0.72/0.82/0.84)   |  0.72/0.77/0.82/0.84     |

使用 Autolink 的工程需要根据该文档配置，Autolink 框架指导文档：https://gitcode.com/CPF-RN/ohos_react_native/blob/main/docs/zh-cn/02-开发/02-开发指南/Autolinking.md   

如您使用的版本支持 Autolink，并且工程已接入 Autolink，可跳过 ManualLink 配置。

<details>
  <summary>ManualLink: 此步骤为手动配置原生依赖项的指导</summary>

首先需要使用 DevEco Studio 打开项目里的 OpenHarmony 工程 `harmony`。

### 1. Overrides RN SDK

为了让工程依赖同一个版本的 RN SDK，需要在工程根目录的 `oh-package.json5` 添加 overrides 字段，指向工程需要使用的 RN SDK 版本。替换的版本既可以是一个具体的版本号，也可以是一个模糊版本，还可以是本地存在的 HAR 包或源码目录。

关于该字段的作用请阅读[官方说明](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/ide-oh-package-json5-V5#zh-cn_topic_0000001792256137_overrides)。

```json
{
  "overrides": {
    "@rnoh/react-native-openharmony" : "./react_native_openharmony" // 指向源码路径
  }
}
```

### 2. 引入原生端代码

目前有两种方法：

- 通过 har 包引入。
- 直接链接源码。

方法一：通过 har 包引入（推荐）

> [!TIP] har 包位于三方库安装路径的 `harmony` 文件夹下。

打开 `entry/oh-package.json5`，添加以下依赖：

```json
"dependencies": {
    "@react-native-ohos/react-native-notifications": "file:../../node_modules/@react-native-ohos/react-native-notifications/harmony/notifications.har"
  }
```

点击右上角的 `sync` 按钮

或者在命令行终端执行：

```bash
cd entry
ohpm install
```
方法二：直接链接源码

> [!TIP] 如需使用直接链接源码，请参考[直接链接源码说明](https://atomgit.com/CPF-RN/usage-docs/blob/master/zh-cn/link-source-code.md)。

### 3. 配置 CMakeLists 和引入 NotificationsPackage

打开 `entry/src/main/cpp/CMakeLists.txt`，添加：

```diff
project(rnapp)
cmake_minimum_required(VERSION 3.4.1)
set(CMAKE_SKIP_BUILD_RPATH TRUE)
set(RNOH_APP_DIR "${CMAKE_CURRENT_SOURCE_DIR}")
set(NODE_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../../../node_modules")
+ set(OH_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../oh_modules")
set(RNOH_CPP_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../../../../react-native-harmony/harmony/cpp")

add_subdirectory("${RNOH_CPP_DIR}" ./rn)

# RNOH_BEGIN: manual_package_linking_1
+ add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-notifications/src/main/cpp" ./rnoh_notifications)
# RNOH_END: manual_package_linking_1

add_library(rnoh_app SHARED
    ${GENERATED_CPP_FILES}
    "./PackageProvider.cpp"
    "${RNOH_CPP_DIR}/RNOHAppNapiBridge.cpp"
)
target_link_libraries(rnoh_app PUBLIC rnoh)

# RNOH_BEGIN: manual_package_linking_2
+ target_link_libraries(rnoh_app PUBLIC rnoh_notifications)
# RNOH_END: manual_package_linking_2
```

打开 `entry/src/main/cpp/PackageProvider.cpp`，添加：

```diff
#include "RNOH/PackageProvider.h"
+ #include "NotificationsPackage.h"

using namespace rnoh;

std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
    return {
+     std::make_shared<NotificationsPackage>(ctx)
    };
}
```

### 4. 在 ArkTs 侧引入 NotificationsPackage

打开 `entry/src/main/ets/RNPackagesFactory.ets`，添加：

```diff
  ...
+ import { NotificationsPackage } from '@react-native-ohos/react-native-notifications/ts';

export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [
+    new NotificationsPackage(ctx)
  ];
}
```
</details>

### 运行

点击右上角的 `sync` 按钮

或者在命令行终端执行：

```bash
cd entry
ohpm install
```

然后编译、运行即可。

## 约束与限制

### 兼容性

本文档内容基于以下版本验证通过：

1. RNOH: 0.72.145; SDK: HarmonyOS 6.0.0 Release SDK; IDE: DevEco Studio 6.0.0.858; ROM: 6.0.0.112;
2. RNOH: 0.77.18; SDK: HarmonyOS 6.0.0 Release SDK; IDE: DevEco Studio 6.0.0.858; ROM: 6.0.0.112;
3. RNOH: 0.82.1; SDK: HarmonyOS 6.0.0 Release SDK; IDE: DevEco Studio 6.0.0.858; ROM: 6.0.0.112;
4. RNOH: 0.84.1; SDK: HarmonyOS 6.0.0 Release SDK; IDE: DevEco Studio 6.0.0.858; ROM: 6.0.0.112;

### 权限要求

- 如果使用 `registerRemoteNotifications` 注册远程通知，应用需要申请网络权限，在 `entry/src/main/module.json5` 中添加：

```json
requestPermissions: [
  {
    name: "ohos.permission.INTERNET",
  },
],
```

- 通知授权通过运行时 `requestEnableNotification` 系统弹窗申请，`entry/src/main/module.json5` 无需声明任何 `ohos.permission.*` 权限。
- 自定义铃声需将音频文件放置到 OpenHarmony 工程 rawfile 下，`sound` 传文件名（含扩展名，如 `'chime.wav'`）；未提供文件时使用系统默认提示音。

rawfile 路径：`entry/src/main/resources/rawfile`。

### 编译运行API要求

> [!TIP] 当前三方库所有版本均已实现版本隔离，支持在 `API12+` 工程编译，及 `API12+` ROM 运行。

> [!TIP] 以下功能依赖特定版本的 API，使用 `低于指定API版本的工程编译` 或 `低于指定API版本的ROM运行` 均可能导致部分功能受限。

1. `getBadgeCount` 的真实读取依赖 `getBadgeNumber`（API 22+ 接口），低于 API 22 的 ROM 上返回最近一次 `setBadgeCount` 的记录值。
2. `abandonPermissions` 跳转本应用通知设置页依赖 `openNotificationSettings`（API 13+），低于 API 13 的 ROM 上无跳转能力。

## 使用示例

下面的代码展示了这个库的基本使用场景：

> [!WARNING] 使用时 import 的库名不变。

```tsx
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { Notifications } from 'react-native-notifications';

export default function App() {
  const [registered, setRegistered] = useState<boolean | null>(null);

  useEffect(() => {
    // 注册远程通知（鸿蒙：弹系统授权框 → 获取 Push Kit token）
    Notifications.registerRemoteNotifications();

    // 事件监听：组件挂载注册、卸载时全部移除（资源释放契约）
    const subscriptions = [
      Notifications.events().registerRemoteNotificationsRegistered((event) => {
        console.log('deviceToken:', event.deviceToken);
      }),
      Notifications.events().registerRemoteNotificationsRegistrationFailed((event) => {
        console.log('failed:', event.code, event.localizedDescription);
      }),
      Notifications.events().registerNotificationOpened((notification, completion, actionResponse) => {
        console.log('notificationOpened', notification.title, actionResponse?.identifier, actionResponse?.text);
        completion();
      }),
    ];

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, []);

  // 查询注册状态
  const doCheckRegistered = () => {
    Notifications.isRegisteredForRemoteNotifications().then((value: boolean) => {
      setRegistered(value);
    });
  };

  // 撤销授权（鸿蒙语义：跳转本应用通知设置页）
  const doAbandonPermissions = () => {
    (Notifications.ios as any).abandonPermissions();
  };

  // 发布基础本地通知（字段对齐 Notification；sound 传 rawfile 内的铃声文件名，如 'chime.wav'）
  const postBasic = () => {
    Notifications.postLocalNotification(
      {
        identifier: '0',
        title: '基础本地通知',
        body: '来自 OpenHarmony 通知中心的文本通知',
        sound: '',
        badge: 0,
        type: '',
        thread: '',
        payload: { category: '', link: 'rnnotifications://demo/basic' },
      },
      1
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Button title="撤销授权(跳设置)" onPress={doAbandonPermissions} />
        <Button title="查询注册状态" onPress={doCheckRegistered} />
      </View>
      <View style={styles.row}>
        <Button title="发布基础通知" onPress={postBasic} />
      </View>
      <Text style={styles.value}>通知开关：{registered === null ? '未查询' : String(registered)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', padding: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  value: { fontSize: 13, color: '#333333' },
});
```

## 使用说明

**注册远程通知**

```tsx
Notifications.registerRemoteNotifications();
Notifications.events().registerRemoteNotificationsRegistered((event) => {
  console.log('deviceToken:', event.deviceToken);
});
```

远程推送走 Push Kit：先经 `requestEnableNotification` 弹系统授权框，再获取 Push token（需 AGC 开通推送服务 + 真机签名；失败派发 `remoteNotificationsRegistrationFailed`，本地通知不受影响）。

**发布本地通知**

```tsx
Notifications.postLocalNotification(
  {
    identifier: '0',
    title: '会议提醒',
    body: '10:30 产品评审',
    sound: '',
    badge: 0,
    type: '',
    thread: '',
    payload: { category: 'SOME_CATEGORY', link: 'app://meeting/1' }, // 点击通知回拉应用时携带
  },
  1
);
```

**监听通知事件**

```tsx
Notifications.events().registerNotificationOpened((notification, completion, actionResponse) => {
  // actionResponse.text 为行动按钮 textInput 的输入回传
  console.log(notification.title, actionResponse?.identifier, actionResponse?.text);
  completion();
});
```

## 接口说明

> [!TIP] "平台"列表示该属性在原三方库上支持的平台。

> [!TIP] "OpenHarmony平台支持"列为 "是" 表示 OpenHarmony 平台支持该属性；"否" 则表示不支持；partially 表示部分支持。使用方法跨平台一致，效果对标 iOS 或 Android 的效果。

### API

| 名称 | 参数类型 | 返回值 | 平台 | OpenHarmony平台支持 | 描述 |
| --- | --- | --- | --- | --- | --- |
| registerRemoteNotifications | options?: NotificationPermissionOptions | void | All | 是 | 注册远程通知：申请通知授权，授权成功后获取推送 token。 |
| postLocalNotification | notification: Notification, id?: number | number | All | 是 | 发布本地通知。 |
| cancelLocalNotification | notificationId: number | void | All | 是 | 取消指定 id 的本地通知。 |
| cancelAllLocalNotifications | 无 | void | iOS | 是 | 取消全部本地通知。 |
| getInitialNotification | 无 | Promise<Notification \| undefined> | All | 是 | 获取冷启动通知（一次性消费）。 |
| setCategories | categories: NotificationCategory[] | void | iOS | partially | 注册通知类别，为通知配置行动按钮（鸿蒙每条通知最多 2 个按钮）。 |
| setNotificationChannel | channel: NotificationChannel | void | Android | partially | 设置通知渠道（鸿蒙仅 importance 映射通知槽类型，细粒度字段不生效。） |
| isRegisteredForRemoteNotifications | 无 | Promise<boolean> | All | 是 | 查询远程通知是否已启用。 |
| checkPermissions | 无 | Promise<NotificationPermissions> | All | partially | 查询通知权限详情（鸿蒙各权限项统一映射应用级通知开关）。 |
| getDeliveredNotifications | 无 | Promise<Notification[]> | All | 是 | 查询通知栏内已展示的通知。 |
| removeDeliveredNotifications | identifiers: string[] | void | All | 是 | 从通知栏移除指定已展示的通知。 |
| removeAllDeliveredNotifications | 无 | void | All | 是 | 从通知栏移除全部已展示的通知。 |
| refreshToken | 无 | void | Android | 是 | 刷新推送 token。 |
| abandonPermissions | 无 | void | iOS | partially | 撤销通知授权（鸿蒙不支持程序化撤销，跳转本应用通知设置页 API 13+）。 |
| registerPushKit | 无 | void | iOS | 是 | 注册 PushKit 获取 token。 |
| getBadgeCount | 无 | Promise<number> | iOS | partially | 读取应用角标数（鸿蒙API 22+ 真实读取，低版本返回最近一次 setBadgeCount 的记录值）。 |
| setBadgeCount | count: number | void | iOS | 是 | 设置应用角标数。 |
| finishPresentingNotification | notificationId: string | void | iOS | 否 | 完成前台通知的展示（鸿蒙无前台展示拦截点，空实现）。 |
| finishHandlingAction | notificationId: string, actionResponse: NotificationActionResponse | void | iOS | 否 | 完成前台行动按钮的处理（鸿蒙无对应回调点，空实现）。 |
| finishHandlingBackgroundAction | notificationId: string, actionResponse: NotificationActionResponse | void | iOS | 否 | 完成后台行动的处理（鸿蒙无对应回调点，空实现）。 |

### 事件

| 名称 | 参数 | 平台 | OpenHarmony平台支持 | 描述 |
| --- | --- | --- | --- | --- |
| remoteNotificationsRegistered | event: { deviceToken } | All | 是 | 远程通知注册成功，返回 deviceToken。 |
| remoteNotificationsRegistrationFailed | event: RegistrationError(code/domain/localizedDescription) | All | 是 | 远程通知注册失败，返回错误信息。 |
| remoteNotificationsRegistrationDenied | 无 | All | 是 | 通知授权被用户拒绝。 |
| notificationReceived | notification: Notification | All | partially | 应用前台收到通知（鸿蒙仅 Push Kit 透传消息触发）。 |
| notificationReceivedBackground | notification: Notification | All | 否 | 应用后台收到通知（鸿蒙应用在后台时不会触发）。 |
| notificationOpened | notification, completion, actionResponse? | All | 是 | 用户点击通知或行动按钮（textInput 输入经 actionResponse.text 回传）。 |
| pushKitRegistered | event: { pushKitToken } | iOS | 是 | PushKit 注册成功，返回 token。 |
| pushKitNotificationReceived | event: { type, data } | iOS | 是 | 收到 PushKit 透传消息。 |
| appNotificationSettingsLinked | 无 | iOS | 否 | 用户跳转应用通知设置链接时触发（鸿蒙通知体系无此事件源）。 |

## 遗留问题

无

## 其他

- iOS completion 协议（finish 系列方法）鸿蒙不支持，为空实现：鸿蒙通知由系统通知中心直接呈现，应用无前台展示拦截/完成回调点（与原库 Android 行为一致）。
- appNotificationSettingsLinked 事件为 iOS 专属概念，鸿蒙通知体系无此事件源。
- abandonPermissions 无法程序化撤销授权（鸿蒙无对应 API），最接近替代为跳转本应用通知设置页（API 13+）。

## 目录结构

```
/react-native-notifications  # 项目根目录
├── harmony                    # 适配代码
│    └─ notifications.har      # har包
│    └─ notifications          # 适配核心代码
│          └─ index.ets        # 适配代码入口
│          └─ src/main/ets
│              └─ NotificationsTurboModule.ets   # TurboModule 实现
│              └─ RNNotificationsBridge.ets      # 鸿蒙通知 / Push Kit 桥接
├── src                        # RN代码
│    └─ index.ts               # 入口文件
│    └─ Notifications.ts       # Notifications 组件主入口
│    └─ specs                  # codegen 类型文件
│    └─ interfaces             # 类型文件
├── example                    # 示例工程
├── README.md                  # 中文安装使用方法
├── README_en.md               # 英文安装使用方法
```

## 贡献代码

使用过程中发现任何问题都可以提交 [Issue](https://github.com/react-native-oh-library/react-native-notifications/issues)，当然，也非常欢迎提交 [PR](https://github.com/react-native-oh-library/react-native-notifications/pulls)。

## 开源协议

本项目基于 [MIT License](https://github.com/wix/react-native-notifications/blob/master/LICENSE)，请自由地享受和参与开源。