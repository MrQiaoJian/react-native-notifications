/**
 * react-native-notifications HarmonyOS 适配
 *
 * RNOHPackage 注册入口：把 RNBridgeModule TurboModule 注册进 RN 实例
 * （example 的 RNPackagesFactory 经 autolinking 引用此处导出的 NotificationsPackage）。
 */

import { RNOHPackage } from '@rnoh/react-native-openharmony/ets';
import { UITurboModule, UITurboModuleContext } from '@rnoh/react-native-openharmony';
import { NotificationsTurboModule } from './NotificationsTurboModule';

export class NotificationsPackage extends RNOHPackage {
  override getUITurboModuleFactoryByNameMap(): Map<string, (ctx: UITurboModuleContext) => UITurboModule | null> {
    return new Map<string, ((ctx: UITurboModuleContext) => UITurboModule)>()
      .set(NotificationsTurboModule.NAME, (ctx: UITurboModuleContext) => new NotificationsTurboModule(ctx));
  }
}
