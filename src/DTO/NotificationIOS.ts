import {Notification} from './Notification';

// lodash 内联替代：上游 NotificationIOS 仅使用 _.isObject/_.isString，且 lodash 未声明为
// 运行时依赖，鸿蒙包内以原生 typeof 判断等价实现。
export class NotificationIOS extends Notification {
  identifier: string;
  constructor(payload: object) {
    super(payload);
    this.identifier = this.payload.identifier;
  }

  get aps(): any {
    return this.payload.aps || {};
  }

  get alert(): any {
    if (this.aps.alert && typeof this.aps.alert === 'object') {
      return this.aps.alert;
    } else if (typeof this.aps.alert === 'string') {
      return {
        body: this.aps.alert
      }
    }
  }

  get title(): string {
    return this.alert.title;
  }

  get body(): string {
    return this.alert.body;
  }

  get sound(): string {
    return this.aps.sound;
  }

  get badge(): number {
    return this.aps.badge;
  }

  get thread(): string {
    return this.aps.thread;
  }
}
