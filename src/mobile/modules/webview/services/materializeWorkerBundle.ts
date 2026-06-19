import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync
} from 'expo-file-system/legacy'

import { captureException } from '@common/config/analytics/CrashAnalytics'

// Materializes the WebView worker bundle from the OTA-shipped copy into a writable,
// app-sandboxed dir and returns the `file://` URI of its HTML entry, so the WebView can
// load the OTA'd worker via `file://` (preserving the strict CSP + SHA-384 SRI).
//
// Why: the worker bundle (the wallet's core controllers) used to ship ONLY as a native
// asset baked into the signed app, which an OTA cannot replace. We now also emit it into
// the Metro/OTA JS bundle (webview-bundle-ota.json), write it out here, and load from the
// writable copy - so OTA updates reach the worker. If anything fails, the caller falls back
// to the native-asset copy, so the worker always has a working bundle to boot.
//
// SECURITY: once the worker ships via OTA, its integrity depends on signed OTA delivery.
// TODO(security): enable Stallion bundle signing (--private-key) - see scripts/publish-ota.sh.
// The HTML's SRI only guards HTML<->JS consistency; a compromised OTA controls both, so it
// is defense-in-depth, not the primary guarantee.
const materializeWorkerBundle = async (): Promise<string | null> => {
  try {
    if (!documentDirectory) return null

    const webviewDir = `${documentDirectory}webview/`
    const htmlPath = `${webviewDir}webview-bundle.html`
    const jsPath = `${webviewDir}webview-bundle.js`
    const versionPath = `${webviewDir}webview-bundle.version`

    // { html, js, integrity } are emitted together by build:webview, so the HTML's SRI
    // always matches its JS. Required lazily so it is not loaded into memory in dev.
    const otaBundle: {
      html: string
      js: string
      integrity: string
    } = require('./webview-bundle-ota.json')

    const dirInfo = await getInfoAsync(webviewDir)
    if (!dirInfo.exists) await makeDirectoryAsync(webviewDir, { intermediates: true })

    const versionInfo = await getInfoAsync(versionPath)
    const currentVersion = versionInfo.exists ? await readAsStringAsync(versionPath) : null

    const [htmlInfo, jsInfo] = await Promise.all([getInfoAsync(htmlPath), getInfoAsync(jsPath)])
    const isUpToDate = currentVersion === otaBundle.integrity && htmlInfo.exists && jsInfo.exists

    // Skip the multi-MB write when the on-disk copy already matches (avoids startup cost on
    // every launch; only the launch after an OTA actually rewrites).
    if (!isUpToDate) {
      // JS first, then the HTML that pins it, then the version marker LAST - so a crash
      // mid-write never leaves a "valid" version pointing at a partial/mismatched bundle.
      await writeAsStringAsync(jsPath, otaBundle.js)
      await writeAsStringAsync(htmlPath, otaBundle.html)
      await writeAsStringAsync(versionPath, otaBundle.integrity)
    }

    return htmlPath
  } catch (error) {
    captureException(error)
    return null
  }
}

export default materializeWorkerBundle
