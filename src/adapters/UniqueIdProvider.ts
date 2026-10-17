// lodash 内联替代：上游 package.json 未把 lodash 声明为运行时依赖（打包瑕疵），
// 鸿蒙包内以零依赖实现等价的递增 id 生成（_.uniqueId 从 '1' 起递增，parseInt 后为整数）。
export class UniqueIdProvider {
  private static nextId = 0;

  generate(): number {
    UniqueIdProvider.nextId += 1;
    return UniqueIdProvider.nextId;
  }
}
