// Uses require to preserve import order
require('./shim')

const { markBoot } = require('./src/mobile/services/bootProfiler/bootProfiler')
const { BOOT_MARK } = require('./src/mobile/services/bootProfiler/constants')

markBoot(BOOT_MARK.rnShimsEvaluated)

require('./src/common/config/analytics/CrashAnalytics')
require('./src/common/services/layoutAnimation')
require('react-native-gesture-handler')
require('expo-asset')

import { registerRootComponent } from 'expo'
const { LogBox, Platform } = require('react-native')

markBoot(BOOT_MARK.rnNativeModulesEvaluated)

LogBox.ignoreLogs([
  // Ignore the Android specific warnings for setting long timers
  // {@link https://stackoverflow.com/a/64832663/1333836}
  'Setting a timer',
  // Ignores the warning: "ViewPropTypes will be removed from React Native.
  // Migrate to ViewPropTypes exported from 'deprecated-react-native-prop-types'."
  // It is coming from the "lottie-react-native" package.
  // Updating it to v5.1.3 removes the warn, but the "expected version"
  // (based on expo doctor) is v5.0.1. Therefore, we keep using v5.0.1 for now,
  // and ignore the warning temporarily.
  "exported from 'deprecated-react-native-prop-types'."
])
const App = require('./App').default

if (Platform.OS === 'web') {
  // react-dom is only reachable from this branch, so a native boot never evaluates it.
  const { createElement } = require('react')
  const { createRoot } = require('react-dom/client')

  // Fixes ReactDOM.render error
  // https://github.com/expo/expo/issues/18485
  const rootTag = createRoot(document.getElementById('root') ?? document.getElementById('main'))
  rootTag.render(createElement(App))
} else {
  // registerRootComponent calls AppRegistry.registerComponent('main', () => App);
  // It also ensures that whether you load the app in Expo Go or in a native build,
  // the environment is set up appropriately
  registerRootComponent(App)
}
