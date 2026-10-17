import { Notification } from '../DTO/Notification';
import { NotificationActionResponse } from '../interfaces/NotificationActionResponse';

export class CompletionCallbackWrapper {
  constructor() {}

  public wrapReceivedBackgroundCallback(callback: Function): (notification: Notification) => void {
    return (notification) => {
      this.wrapReceivedAndInvoke(callback, notification, true);
    }
  }

  public wrapReceivedForegroundCallback(callback: Function): (notification: Notification) => void {
    return (notification) => {
      this.wrapReceivedAndInvoke(callback, notification, false);
    }
  }

  private wrapReceivedAndInvoke(callback: Function, notification: Notification, background: boolean) {
    // iOS 的 completion 协议在鸿蒙通知语义下不存在（通知由系统直接呈现，无前台拦截回调），
    // 与 JS 层原实现一致：仅 iOS 平台会回传原生，harmony 上 completion 为 no-op。
    const completion = (response: object) => {};
    callback(notification, completion);
  }

  public wrapOpenedCallback(callback: Function): (notification: object, actionResponse?: NotificationActionResponse) => void {
    return (notification, actionResponse) => {
      const completion = () => {};
      callback(notification, completion, actionResponse);
    }
  }
}
