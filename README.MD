# Ambire Mobile Wallet

## For the extension, please use `v2` branch

Hybrid (React Native) Mobile App. This project is built with Expo's bare workflow, allowing developers to extend the default Vanilla React Native with additional expo modules in the form of installable expo libraries. Bare template projects come with expo installed and configured, so you're ready to install and use any package from the Expo SDK. A complete list of all expo packages can be found here: https://docs.expo.dev/versions/latest/

## React Native Environment Setup

Read about the environment setup and prerequisites [here](https://reactnative.dev/docs/environment-setup).

## Install

First run:

```bash
yarn install
```

- iOS: Then run:

  ```
  cd ios && pod install
  ```

  from the root folder of the project. This command links the native iOS packages using CocoaPods.

- Android:

  No additional steps required.

## Environment Variables

Create ".env" file in the root directory and fill in all variables, see ".env-sample" for a reference.

To provide the EAS build jobs with access to the environment variables, use [EAS secrets](https://docs.expo.dev/build-reference/variables/#using-secrets-in-environment-variables).

### Upload all local .env file variables to EAS (as secrets)

```bash
yarn eas:secret:push
```

### List all current .env variables (secrets) on EAS

```bash
yarn eas:secret:list
```

## Editor Config

Make sure your code editor has plugins that support the following configuration files: `.editorconfig`, `.prettierrc`, `tsconfig.json`, `eslintrc.js`, [`import-sorter.json`](https://github.com/SoominHan/import-sorter).

## Start

iOS:

```bash
yarn ios
```

Note: This command runs `expo run:ios`.

Android:

```bash
yarn android
```

Note: This command runs `expo run:android`.

Development server (Metro bundler):

```bash
yarn start
```

Note: This command runs `react-native start`.

Browser extension (web app) for webkit browsers (tested on Chrome only)::

```bash
yarn web:webkit
```

Browser extension (web app) for gecko browsers (tested on Firefox only)::

```bash
yarn web:gecko
```

## Translations (Beta)

To scan the project for translation labels and to update translations JSON files, run:

```bash
yarn translations:scan
```

PS: Secondary languages not implemented / translated / fully tested yet.

## Publishing over the air updates

When doing over the air updates, be careful. Adding new packages requires a new build if they require native "linking".

```bash
yarn publish:production
```

## Building the app on EAS

Create `credentials.json` file in the root directory. See `credentials-sample.json` as an example. Fill-in the required credentials. Then:

- iOS: Create `ios/certs` directory and place there the 1) Provisioning Profile (`profile.mobileprovision` file) 2) Distribution Certificate (`dist.p12` file) and (optionally) 3) Push Notifications Service Key (`AuthKey_XXX.p8` file). Then run:

  ```bash
  yarn build:ios:production
  ```

- Android: Create `android/keystores` directory and place there the `release.keystore` file. Then run:

  ```bash
  yarn build:android:production
  ```

## Building the iOS app locally on a real device

Add the Apple Distribution Certificate (`dist.p12` file) and the Apple Development Certificate (`test.dist.p12` file) to your macOS Keychain.

Open the app in xCode. Go to "Signing & Capabilities". Then:

- For the "Signing (Debug)" import the Apple Development Provisioning Profile (`test.profile.mobileprovision` file).
- For the "Signing (Release)" import the Apple Distribution Provisioning Profile (`profile.mobileprovision` file).

FIXME: building the iOS app locally with the Release build configuration fails. It works only with the Debug build configuration. The issue is caused by a conflict between the `OpenSSL-Universal` pod versions of Flipper and the react-native-quick-crypto packages.

For the CI builds, running in Release build configuration, the Flipper is not included (skipped by env variable in ios/Podfile). The workaround for the local builds with Release build configuration is commenting out `use_flipper!(...` in the Podfile and running "pod install" in the ios directory.

## Building the browser extension (web app) locally

For webkit browsers (tested on Chrome only):

```bash
yarn build:web:webkit
```

For gecko browsers (tested on Firefox only):

```bash
yarn build:web:gecko
```

## Versioning

When releasing a new version, here are the steps:

1. Our internal app version: X.X.X (example: `1.4.2`). Follows semantic versioning.

   Change in app.json -> `version`

1. Native version: X.X (example: `1.4`). This one is mostly for labeling within the App Store and Google Play. Keep synced with our internal app version when creating a new build. But it could also be behind, if the next internal version we're about to ship doesn't require creating a new build.

   iOS: Change `CFBundleShortVersionString` in the `ios/ambire/Info.plist` file

   Android: Change `versionName` string in the `android/app/build.gradle` file

1. Native build version. Integer. Bump up If the next internal version we're about to ship requires creating a new build (example: `4`):

   iOS: `CFBundleVersion` in the `ios/ambire/Info.plist` file

   Android: `versionCode` in the `android/app/build.gradle` file

1. Runtime version. Integer. Bump up If the next internal version we're about to ship requires creating a new build and shipping it over the air will break the previous (existing) builds: (example: `1`)

   For both platforms: change `runtimeVersion` key in `app.json`. Then run: `yarn build:configure`.

   iOS: Change the key `EXUpdatesRuntimeVersion` in the `Expo.plist` file

   Android: Change the `expo_runtime_version` string in the strings.xml file
