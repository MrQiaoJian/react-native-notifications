/**
 * 按 @react-native-oh/react-native-harmony 版本自动选 babel preset，
 * 切换 0.72/0.77/0.82/0.84 组合时无需再改本文件（只换 package.json + npm install）。
 *
 * 0.72：metro-react-native-babel-preset（老 preset，@babel/parser flow 插件）
 * 0.77+：@react-native/babel-preset（hermes-parser，才能解析 RN 源码的
 *        Flow component 语法，如 Button.js 的 `const Button: component(...)`）
 */
function pickPreset() {
  let minor = 77; // harmony 包未安装时默认按 0.77+ 处理
  try {
    const version = require('@react-native-oh/react-native-harmony/package.json').version;
    minor = Number(version.split('.')[1]);
  } catch {}

  const candidates = minor >= 77
    ? ['@react-native/babel-preset', 'metro-react-native-babel-preset']
    : ['metro-react-native-babel-preset', '@react-native/babel-preset'];
  for (const name of candidates) {
    try {
      require.resolve(name);
      return 'module:' + name;
    } catch {}
  }
  throw new Error(
    'babel preset 未安装：请先按所选版本组合（package_XX.json）执行 npm install',
  );
}

module.exports = {
  presets: [pickPreset()],
};
