/**
 * This source code is licensed under the MIT license found in the
 * LICENSE-MIT file found in the root directory of this source tree.
 */

import { RNAbility } from '@rnoh/react-native-openharmony';
import { Want, AbilityConstant } from '@kit.AbilityKit';
import { RNNotificationsBridge } from '@oh-rn/react-native-notifications';

export default class EntryAbility extends RNAbility {
  getPagePath() {
    return 'pages/Index';
  }

  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam) {
    // Push Kit 回调注册要求在 onCreate 内同步完成（不能放在异步方法之后）
    RNNotificationsBridge.getInstance().attachAbility(this);
    // 冷启动通知暂存（用户从通知点击进入，等待 JS getInitialNotification 消费）
    RNNotificationsBridge.getInstance().handleOnCreate(want);
    super.onCreate(want, launchParam);
  }

  onNewWant(want: Want, launchParam: AbilityConstant.LaunchParam) {
    // 热启动点击通知：直接派发 notificationOpened
    RNNotificationsBridge.getInstance().handleNewWant(want);
    super.onNewWant(want, launchParam);
  }

  onForeground() {
    RNNotificationsBridge.getInstance().setForeground(true);
    super.onForeground();
  }

  onBackground() {
    RNNotificationsBridge.getInstance().setForeground(false);
    super.onBackground();
  }
}
