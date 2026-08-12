# Boot profiler

Measures where cold-start time goes on mobile, across both JS realms (the RN app and
the WebView worker) plus whatever the platform reports about the native launch. It
prints one merged timeline and writes the raw marks to a JSON file so runs can be
diffed.

Off unless the `IS_BOOT_PROFILING_ENABLED=true` environment variable is present when
the bundles are built, so a shipped build carries none of it.

## Switching it on
Update `.env` to: 
```sh
IS_BOOT_PROFILING_ENABLED=true
```

## Getting a profile

Numbers from a dev build are close to meaningless: dev downloads the RN bundle from
Metro instead of mmap-ing Hermes bytecode, and fetches the 8.5 MB worker bundle over
HTTP from webpack-dev-server instead of reading it from `file://`. Those two
differences dominate the timeline. Profile a release build.

```sh
# Android
yarn build:android:production:apk:install
adb shell am force-stop com.ambire.wallet          # cold start, every run
adb shell am start -W -n com.ambire.wallet/.MainActivity
adb logcat -s ReactNativeJS:V ActivityTaskManager:V

# iOS
yarn build:ios:simulator && yarn build:ios:simulator:install
xcrun simctl terminate booted com.ambire.wallet
xcrun simctl launch --console booted com.ambire.wallet
```

Do at least five runs and take the median - first-launch-after-install pays for the
worker bundle materialization and a cold page cache, so it is not representative.

The report prints once the last controller state has landed, or after
`BOOT_PROFILE_DEADLINE` if the boot never gets there (a stuck controller or a dead
dev server is exactly the case worth reading). The JSON path is logged next to it;
pull it with `adb pull` / `xcrun simctl get_app_container`.

## Reading the report

Five sections:

- **Phase summary** - the boot broken into consecutive phases. Start here.
- **Measured spans, slowest first** - individually timed operations (the MMKV dump,
  the init-payload stringify, `new MainController`, the OTA bundle write). The hit
  list.
- **First controller state across the bridge** - per controller: `toJSON` ms,
  richJson stringify ms, wire bytes, richJson parse ms on the RN side, and when it
  arrived. Ranked by total cost. This is usually where the time is.
- **Init storage snapshot by key** - per storage key: its share of the MMKV dump that
  travels in the init payload, and when the worker first read it. `when` is about
  timing only: a key read while the splash is up is genuinely needed there only if a
  critical controller waits on it. A controller that eagerly loads a bulk cache in
  its constructor reads during the splash without the splash needing it.
- **Full timeline** - every mark with `t+ms` from the origin and the delta from the
  previous mark, tagged by realm. The per-key and per-storage-read marks are left out
  here (they have their own table) but are all in the JSON.

The two realms are stitched together on the wall clock (`Date.now()`), which is also
what lets a mark be lined up against a `logcat` or Console.app timestamp. Span
durations use each realm's monotonic clock instead, so a clock adjustment mid-boot
cannot distort them.

## The native phase

Everything before the first line of JS comes from RN's `performance.rnStartupTiming`,
which is populated from native `ReactMarker` calls and is not guaranteed on every
platform or build. When it is empty the report says so and the pre-JS window has to
be measured with platform tooling:

- **Android** - `adb shell am start -W` gives ThisTime/TotalTime/WaitTime.
  `ActivityTaskManager: Displayed com.ambire.wallet/...` in logcat gives the same
  from the system's point of view. For the breakdown inside it (zygote fork, `.so`
  loading, dex/class init, Hermes bytecode load) record a Perfetto trace:
  `record_android_trace -t 20s -a com.ambire.wallet sched freq gfx view wm am dalvik`.
- **iOS** - Xcode → Product → Profile → **App Launch**, which splits pre-main dyld
  work from post-main. Time Profiler on the JS thread for the rest.

Correlate either one with `t+0` in the report: the marks carry wall-clock epochs, so
a logcat line and a mark can be placed on the same axis.

## Going deeper on a phase

The profiler tells you which phase is expensive; these tell you why:

- **Worker realm** (controller construction, state serialization) -
  `webviewDebuggingEnabled` is already on in dev, so attach `chrome://inspect`
  (Android) or Safari → Develop (iOS) to the worker WebView and record a Performance
  profile of the boot. This is the most useful tool for the worker half.
- **RN realm** - Hermes sampling profiler from the dev menu ("Start/Stop JS Sampling
  Profiler"), then open the `.cpuprofile` in Chrome DevTools. React render cost:
  React DevTools Profiler.
- **Module graph eval** - if `worker.bundle.evalStart → worker.imports.evaluated` is
  large, the worker bundle is the problem: `npx webpack --config
  src/mobile/modules/webview/services/webpack.webview.config.js --json > stats.json`
  and inspect it (statoscope, or the reason graph directly). For the RN bundle,
  `react-native-bundle-visualizer`.

## Where the marks are

You can trace them by searching for `bootProfiler.`
