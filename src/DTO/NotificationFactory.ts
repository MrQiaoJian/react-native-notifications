import {Notification} from './Notification';
import {NotificationIOS} from './NotificationIOS';
import {NotificationAndroid} from './NotificationAndroid';
import { Platform } from 'react-native';

export class NotificationFactory {
  fromPayload(payload: any) : Notification {
    if (Platform.OS === 'ios') {
      return payload.aps ? new NotificationIOS(payload) : new Notification(payload);
    }
    if ((Platform.OS as string) === 'harmony') {
      // 鸿蒙原生侧保证 payload 平铺结构（title/body/... 顶层 + payload 嵌套自定义数据），
      // 直接使用基础 Notification，不走 iOS aps / Android google.message_id 解析。
      return new Notification(payload);
    }
    return new NotificationAndroid(payload);
  }
}
