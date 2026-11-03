> Document Template: v0.4.2

<p align="center">
  <h1 align="center"> <code>@react-native-ohos/react-native-notifications</code> </h1>
</p>

This project is based on [react-native-notifications](https://github.com/wix/react-native-notifications).

The version correspondence details are as follows:

| Name | Version(Npm Address) | Release Information | Supported RN Version | Supported Autolink | Compile API Version | Community Baseline Version | Source code address |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @react-native-ohos/react-native-notifications | [~ 5.1.1](https://www.npmjs.com/package/@react-native-ohos/react-native-notifications) | [GitHub Releases](https://github.com/react-native-oh-library/react-native-notifications/releases) | 0.72+ | Yes | API12+ | 5.1.0 | [master](https://github.com/react-native-oh-library/react-native-notifications/tree/master) |

## Introduction

The Notifications component for React Native.<br/>
It provides end-to-end notification capabilities: publishing and managing local notifications, remote push (Push Kit), notification event listening (foreground/background arrival, taps, action buttons with text input), notification categories, notification channels, and badge management.

## Installation

Go to the project directory and execute the following instruction:

**npm**

```bash
npm install @react-native-ohos/react-native-notifications
```

**yarn**

```bash
yarn add @react-native-ohos/react-native-notifications
```

## Link

|                                      | Supported Autolink | Supported RN Version |
|--------------------------------------|--------------------|----------------------|
| ~ 5.1.1                         | partially(0.72/0.82/0.84) | 0.72/0.77/0.82/0.84  |

Projects using Autolink need to be configured according to this document, Autolink framework guide: https://gitcode.com/CPF-RN/ohos_react_native/blob/main/docs/en/02-development/02-development-guide/autolinking.md

If the version you are using supports Autolink and the project has integrated Autolink, you can skip the ManualLink configuration.

<details>
  <summary>ManualLink: This step provides guidance for manually configuring native dependencies.</summary>

Open the `harmony` directory of the OpenHarmony project in DevEco Studio.

> [!TIP] This module is a TurboModule; the Package needs to be registered on both the C++ side and the ArkTS side.

### 1. Overrides RN SDK

To ensure the project relies on the same version of the RN SDK, you need to add an `overrides` field in the project's root `oh-package.json5` file, specifying the RN SDK version to be used. The replacement version can be a specific version number, a semver range, or a locally available HAR package or source directory.

For more information about the purpose of this field, please refer to the [official documentation](https://developer.huawei.com/consumer/en/doc/harmonyos-guides-V5/ide-oh-package-json5-V5#en-us_topic_0000001792256137_overrides).

```json
{
  "overrides": {
    "@rnoh/react-native-openharmony" : "./react_native_openharmony" // source code directory
  }
}
```

### 2. Introducing Native Code

Currently, two methods are available:

- Use the HAR file.
- Directly link to the source code.

Method 1 (recommended): Use the HAR file.

> [!TIP] The HAR file is stored in the `harmony` directory in the installation path of the third-party library.

Open `entry/oh-package.json5` file and add the following dependencies:

```json
"dependencies": {
    "@react-native-ohos/react-native-notifications": "file:../../node_modules/@react-native-ohos/react-native-notifications/harmony/notifications.har"
  }
```

Click the `sync` button in the upper right corner.

Alternatively, run the following instruction on the terminal:

```bash
cd entry
ohpm install
```

Method 2: Directly link to the source code.

> [!TIP] For details, see [Directly Linking Source Code](https://atomgit.com/CPF-RN/usage-docs/blob/master/en/link-source-code.md).

### 3. Configuring CMakeLists and Introducing NotificationsPackage

Open `entry/src/main/cpp/CMakeLists.txt` and add the following code:

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

Open `entry/src/main/cpp/PackageProvider.cpp` and add the following code:

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

### 4. Introducing NotificationsPackage to ArkTS

Open `entry/src/main/ets/RNPackagesFactory.ets` and add the following code:

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

### Running

Click the `sync` button in the upper right corner.

Alternatively, run the following instruction on the terminal:

```bash
cd entry
ohpm install
```

Then build and run the code.

## Constraints

### Compatibility

This document is verified based on the following versions:

1. RNOH: 0.72.145; SDK: HarmonyOS 6.0.0 Release SDK; IDE: DevEco Studio 6.0.0.858; ROM: 6.0.0.112;
2. RNOH: 0.77.18; SDK: HarmonyOS 6.0.0 Release SDK; IDE: DevEco Studio 6.0.0.858; ROM: 6.0.0.112;
3. RNOH: 0.82.1; SDK: HarmonyOS 6.0.0 Release SDK; IDE: DevEco Studio 6.0.0.858; ROM: 6.0.0.112;
4. RNOH: 0.84.1; SDK: HarmonyOS 6.0.0 Release SDK; IDE: DevEco Studio 6.0.0.858; ROM: 6.0.0.112;

### Permission Requirements

- If `registerRemoteNotifications` is used to register remote notifications, the application needs to apply for network permissions.

  Include applicable permissions in the `entry/src/main/module.json5` file within the entry directory.

```json
requestPermissions: [
  {
    "name": "ohos.permission.INTERNET",
  },
],
```

- Notification authorization is requested at runtime via the `requestEnableNotification` system dialog; no `ohos.permission.*` permission needs to be declared in `entry/src/main/module.json5`.
- For a custom notification sound, place the audio file in the rawfile directory of the OpenHarmony project and pass the file name (with extension, e.g. `'chime.wav'`) as `sound`; if not provided, the system default sound is used.

rawfile path: `entry/src/main/resources/rawfile`.

### API requirements

> [!TIP] All versions of the current third-party libraries have implemented version isolation, supporting compilation in `API12+` projects and execution on `API12+` ROMs.

> [!TIP] The following features depend on specific API versions. Compiling the project with an API version lower than specified or running the ROM with an API version lower than specified may result in limited functionality.

1. Reading in `getBadgeCount` relies on `getBadgeNumber` (an API 22+ interface); on ROMs below API 22, it returns the value recorded by the last `setBadgeCount`.
2. `abandonPermissions` jumping to the app's notification settings page relies on `openNotificationSettings` (API 13+); ROMs below API 13 have no such capability.

## Example

The following code shows the basic use scenario of the repository:

> [!WARNING] The name of the imported repository remains unchanged.

```tsx
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { Notifications } from 'react-native-notifications';

export default function App() {
  const [registered, setRegistered] = useState<boolean | null>(null);

  useEffect(() => {
    // Register remote notifications (OpenHarmony: system authorization dialog → obtain Push Kit token)
    Notifications.registerRemoteNotifications();

    // Event listening: register on mount, remove all on unmount (resource release contract)
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

  // Check registration status
  const doCheckRegistered = () => {
    Notifications.isRegisteredForRemoteNotifications().then((value: boolean) => {
      setRegistered(value);
    });
  };

  // Abandon authorization (OpenHarmony semantics: jump to the app's notification settings page)
  const doAbandonPermissions = () => {
    (Notifications.ios as any).abandonPermissions();
  };

  // Post a basic local notification (fields align with Notification; sound passes the ringtone file name in rawfile, e.g. 'chime.wav')
  const postBasic = () => {
    Notifications.postLocalNotification(
      {
        identifier: '0',
        title: 'Basic local notification',
        body: 'Text notification from the OpenHarmony notification center',
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
        <Button title="Abandon (open settings)" onPress={doAbandonPermissions} />
        <Button title="Check registration" onPress={doCheckRegistered} />
      </View>
      <View style={styles.row}>
        <Button title="Post basic notification" onPress={postBasic} />
      </View>
      <Text style={styles.value}>Notification switch: {registered === null ? 'Not queried' : String(registered)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', padding: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  value: { fontSize: 13, color: '#333333' },
});
```

## How to Use

**Register remote notifications**

```tsx
Notifications.registerRemoteNotifications();
Notifications.events().registerRemoteNotificationsRegistered((event) => {
  console.log('deviceToken:', event.deviceToken);
});
```

Remote push uses Push Kit: the `requestEnableNotification` system authorization dialog is shown first, then the push token is obtained (requires Push Service enabled on AGC and a signed real device; on failure `remoteNotificationsRegistrationFailed` is dispatched, and local notifications are not affected).

**Post a local notification**

```tsx
Notifications.postLocalNotification(
  {
    identifier: '0',
    title: 'Meeting reminder',
    body: 'Product review at 10:30',
    sound: '',
    badge: 0,
    type: '',
    thread: '',
    payload: { category: 'SOME_CATEGORY', link: 'app://meeting/1' }, // carried when a notification tap reopens the app
  },
  1
);
```

**Listen for notification events**

```tsx
Notifications.events().registerNotificationOpened((notification, completion, actionResponse) => {
  // actionResponse.text carries the text input from an action button
  console.log(notification.title, actionResponse?.identifier, actionResponse?.text);
  completion();
});
```

## Available APIs

> [!TIP] The **Platform** column indicates the platform where the properties are supported in the original third-party library.

> [!TIP] If the value of **OpenHarmony Platform Support** is **yes**, it means that the OpenHarmony platform supports this property; **no** means the opposite; **partially** means some capabilities of this property are supported. The usage method is the same on different platforms and the effect is the same as that of iOS or Android.

### API

| Name | Parameter Type | Return Value | Platform | OpenHarmony Platform Support | Description |
| --- | --- | --- | --- | --- | --- |
| registerRemoteNotifications | options?: NotificationPermissionOptions | void | All | Yes | Register remote notifications: request notification authorization and obtain the push token once authorized. |
| postLocalNotification | notification: Notification, id?: number | number | All | Yes | Post a local notification. |
| cancelLocalNotification | notificationId: number | void | All | Yes | Cancel the local notification with the given id. |
| cancelAllLocalNotifications | None | void | iOS | Yes | Cancel all local notifications. |
| getInitialNotification | None | Promise<Notification \| undefined> | All | Yes | Get the cold-start notification (consumed once). |
| setCategories | categories: NotificationCategory[] | void | iOS | partially | Register notification categories to configure action buttons for notifications (at most 2 buttons per notification on OpenHarmony). |
| setNotificationChannel | channel: NotificationChannel | void | Android | partially | Set the notification channel (on OpenHarmony only `importance` is mapped to the notification slot type; fine-grained fields do not take effect). |
| isRegisteredForRemoteNotifications | None | Promise<boolean> | All | Yes | Query whether remote notifications are enabled. |
| checkPermissions | None | Promise<NotificationPermissions> | All | partially | Query notification permission details (on OpenHarmony all permission items are mapped to the app-level notification switch). |
| getDeliveredNotifications | None | Promise<Notification[]> | All | Yes | Query notifications displayed in the notification panel. |
| removeDeliveredNotifications | identifiers: string[] | void | All | Yes | Remove the specified delivered notifications from the notification panel. |
| removeAllDeliveredNotifications | None | void | All | Yes | Remove all delivered notifications from the notification panel. |
| refreshToken | None | void | Android | Yes | Refresh the push token. |
| abandonPermissions | None | void | iOS | partially | Abandon notification authorization (programmatic revocation is not supported on OpenHarmony; jumps to the app's notification settings page, API 13+). |
| registerPushKit | None | void | iOS | Yes | Register PushKit to obtain the token. |
| getBadgeCount | None | Promise<number> | iOS | partially | Read the app badge count (actually read on OpenHarmony API 22+; on lower versions returns the value recorded by the last `setBadgeCount`). |
| setBadgeCount | count: number | void | iOS | Yes | Set the app badge count. |
| finishPresentingNotification | notificationId: string, options: Object | void | iOS | No | Finish presenting a foreground notification (no foreground presentation interception point on OpenHarmony; empty implementation). |
| finishHandlingAction | notificationId: string | void | iOS | No | Finish handling a foreground action button (no corresponding callback point on OpenHarmony; empty implementation). |
| finishHandlingBackgroundAction | notificationId: string, backgroundFetchResult: string | void | iOS | No | Finish handling a background action (no corresponding callback point on OpenHarmony; empty implementation). |

### Events

| Name | Parameter | Platform | OpenHarmony Platform Support | Description |
| --- | --- | --- | --- | --- |
| remoteNotificationsRegistered | event: { deviceToken } | All | Yes | Remote notifications registered successfully; returns the deviceToken. |
| remoteNotificationsRegistrationFailed | event: RegistrationError(code/domain/localizedDescription) | All | Yes | Remote notification registration failed; returns error information. |
| remoteNotificationsRegistrationDenied | None | All | Yes | Notification authorization denied by the user. |
| notificationReceived | notification: Notification | All | partially | Notification received while the app is in the foreground (on OpenHarmony triggered only by Push Kit transparent messages). |
| notificationReceivedBackground | notification: Notification | All | No | Notification received while the app is in the background (not triggered while the app is in the background on OpenHarmony). |
| notificationOpened | notification, completion, actionResponse? | All | Yes | The user tapped a notification or an action button (text input is returned via `actionResponse.text`). |
| pushKitRegistered | event: { pushKitToken } | iOS | Yes | PushKit registered successfully; returns the token. |
| pushKitNotificationReceived | event: { type, data } | iOS | Yes | A PushKit transparent message was received. |
| appNotificationSettingsLinked | None | iOS | No | Triggered when the user jumps to the app's notification settings link (no such event source in the OpenHarmony notification system). |

### Exported Types

The following types can be imported from the package root `react-native-notifications`:

| Name | Description |
| --- | --- |
| Notification | Notification DTO (returned by `getInitialNotification` and `getDeliveredNotifications`, and delivered in event callbacks). |
| NotificationCategory | Notification category; the parameter type of `setCategories`. |
| NotificationActionResponse | Type of the `actionResponse` parameter in the `notificationOpened` callback; textInput input is returned via its `text` field. |
| NotificationCompletion | Foreground presentation completion options (iOS protocol; no-op on OpenHarmony). |
| NotificationBackgroundFetchResult | Background fetch result enum (`newData` / `noData` / `failed`; iOS protocol, no-op on OpenHarmony). |
| Registered / RegistrationError / RegisteredPushKit / NotificationResponse | Event payload interfaces (push token, registration errors, PushKit token, etc.). |
| EventSubscription | Event subscription handle; a compatibility alias for the react-native `EmitterSubscription` type (added by this library, behaviorally identical — event registration methods actually return `EmitterSubscription`). |

## Known Issues

None

## Other

- The iOS completion protocol (the `finish` series methods) is not supported on OpenHarmony and is implemented as an empty implementation: notifications are presented directly by the system notification center, and the app has no foreground presentation interception or completion callback point (consistent with the original library's Android behavior).
- The `appNotificationSettingsLinked` event is an iOS-only concept; the OpenHarmony notification system has no such event source.
- `abandonPermissions` cannot programmatically revoke authorization (no corresponding API on OpenHarmony); the closest alternative is jumping to the app's notification settings page (API 13+).

## Directory Structure

```
/react-native-notifications  # Project root directory
├── harmony                    # Adaptation code
│    └─ notifications.har      # HAR package
│    └─ notifications          # Adaptation core code
│          └─ index.ets        # Adaptation code entry point
│          └─ src/main/ets
│              └─ NotificationsTurboModule.ets   # TurboModule implementation
│              └─ RNNotificationsBridge.ets      # OpenHarmony notification / Push Kit bridge
├── src                        # React Native code
│    └─ index.ts               # Entry file
│    └─ Notifications.ts       # Main entry of the Notifications component
│    └─ specs                  # Codegen type files
│    └─ interfaces             # Type files
├── example                    # Example project
├── README.md                  # Chinese installation and usage guide
├── README_en.md               # English installation and usage guide
```

## How to Contribute

If you find any problem when using react-native-notifications, submit an [issue](https://github.com/react-native-oh-library/react-native-notifications/issues) or a [PR](https://github.com/react-native-oh-library/react-native-notifications/pulls).

## License

The repository is based on [MIT License](https://github.com/wix/react-native-notifications/blob/master/LICENSE).
