import { restart } from 'react-native-stallion'

// Applies a downloaded Stallion OTA bundle by restarting the RN runtime.
// restart() is a native-module call, so it runs on the RN main thread (UI),
// not in the webview-worker background where controllers live.
const applyOtaUpdate = () => restart()

export default applyOtaUpdate
