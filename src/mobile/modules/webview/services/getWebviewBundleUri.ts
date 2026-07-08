import { Platform } from 'react-native'
import { bundleDirectory } from 'expo-file-system/legacy'

// Resolves the platform-specific `file://` URI of the WebView worker bundle's
// HTML entry point.
//
// On iOS the bundle is shipped inside `Ambire.app/webview/` (folder reference
// in Xcode pointing at `ios/Ambire/Resources/webview/`). The legacy
// `bundleDirectory` on iOS returns a plain filesystem path (e.g.
// `/var/.../Ambire.app/`) — WKWebView needs the `file://` scheme prepended.
// On Android the bundle is packaged under `assets/webview/` and reachable via
// the well-known `file:///android_asset/` scheme.
const getWebviewBundleUri = (): string => {
  if (Platform.OS === 'android') return 'file:///android_asset/webview/webview-bundle.html'
  const base = bundleDirectory || ''
  const withScheme = base.startsWith('file://') ? base : `file://${base}`
  return `${withScheme}webview/webview-bundle.html`
}

export default getWebviewBundleUri
