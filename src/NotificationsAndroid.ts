import { Commands } from './commands/Commands';
import { Platform } from 'react-native';
import { NotificationChannel } from './interfaces/NotificationChannel';

export class NotificationsAndroid {
  constructor(private readonly commands: Commands) {
    return new Proxy(this, {
      get(target, name) {
        // 鸿蒙承接 android 侧公开面（registerRemoteNotifications→refreshToken、setNotificationChannel）
        if (Platform.OS === 'android' || (Platform.OS as string) === 'harmony') {
          return (target as any)[name];
        } else {
          return () => {};
        }
      }
    });
  }

  /**
  * 注册远程通知（wix Android 语义为 FCM token 触发）
  * 鸿蒙语义：先经 requestEnableNotification 弹授权框确保通知开关开启，
  * 再经 Push Kit 取 token（需 AGC 开通推送服务，未开通时派发注册失败事件）
  */
  public registerRemoteNotifications() {
    this.commands.requestPermissions();
  }

  /**
   * Refresh push token（对应 wix Android 的 refreshToken）
   */
  public refreshToken() {
    this.commands.refreshToken();
  }

  /**
   * setNotificationChannel
   */
  public setNotificationChannel(notificationChannel: NotificationChannel) {
    return this.commands.setNotificationChannel(notificationChannel);
  }
}
