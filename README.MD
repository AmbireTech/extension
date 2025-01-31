# Ambire Wallet

Ambire is a Web3 wallet that makes self-custody easy and secure. It's the first hybrid Account abstraction wallet to support Basic (EOA) and Smart Accounts, improving security and user experience. [Read more.](https://www.ambire.com/)

## Environment Setup

Built in a hybrid approach (with React Native and React Native Web) so that in a single codebase we can support building cross-browser extensions, mobile apps and web apps.

This project is built with Expo's bare workflow, allowing us to extend the default Vanilla React Native with additional expo modules in the form of installable expo libraries.

More about the environment setup and prerequisites [here](https://reactnative.dev/docs/environment-setup).

## Install

Install all dependencies:

```bash
yarn install
```

Install the [ambire-common](https://github.com/AmbireTech/ambire-common) submodule, a common ground for the Ambire apps, run:

```bash
git submodule init
git submodule update
```

## Environment Variables

Create ".env" file in the root directory and fill in all variables, see ".env-sample" for a reference.

## Editor Config

Make sure your code editor has plugins that support the following configuration files: `.editorconfig`, `.prettierrc`, `tsconfig.json`, `eslintrc.js`, [`import-sorter.json`](https://github.com/SoominHan/import-sorter).

## Browser Extensions

### Development-optimized Builds

Start the browser extension for webkit browsers (tested mostly on Chrome and Brave):

```bash
yarn web:webkit
```

Start the browser extension for gecko browsers (tested mostly on Firefox):

```bash
yarn web:gecko
```

Start the browser extension for the Safari browser:

```bash
yarn web:safari
```

Two new folders will be created:

1. build/safari-dev (dev build folder)
1. safari-extension/wallet-dev (Xcode project)
   then in the Safari browser:
1. Developer -> Developer settings...
1. Check the “Allow unsigned extensions” option. (Note: This setting may not persist after Safari is restarted.)​
1. Then the extension should be automatically added and pinned in the browser.

NOTE: You can manage the available extensions from: Safari -> Settings... -> Extensions

NOTE: The development script for Safari relies on the fswatch tool to automatically reload the Safari build when the development server is reloaded. If fswatch is not already installed on your system, you can install it using Homebrew with the following command:

```bash
brew install fswatch
```

### Production-optimized Builds

- For webkit browsers:

  ```bash
  yarn build:web:webkit
  ```

  And find the resulting build in the "build/webkit-prod" folder.

- For gecko browsers:

  ```bash
  yarn build:web:gecko
  ```

  And find the resulting build in the "build/gecko-prod" folder.

- For the Safari browser:

  ```bash
  yarn build:web:safari
  ```

  Two new folders will be created:

  1.  "build/safari-prod" (production build folder)
  1.  "safari-extension/wallet" (the Xcode project)

  Then, in xCode manually do (TODO: automate these steps, it turned out to be a huge challenge):

  1.  Delete "walletTests" and "walletUITests" targets.
  1.  For both targets (macOS and extension): Signing & Capabilities: Team: "Ambire Tech Ltd", Signing Certificate: Development
  1.  For both targets (macOS and extension): General - Identity - Version: X.X (should match the version in the app.json file, example: `4.36`) and Build: X (integer, bump up on every next build submitted to the App Store Connect, example: `3`)
  1.  For the macOS target: General - App Category: "Utilities"
  1.  For the extension target: General - Identity - Bundle Identifier: `com.ambire.app.wallet.extension`

## Mobile Apps

The Ambire v2 compatible mobile apps are yet to be developed. Coming sometime in the near future 🤞

## Benzin

Ambire's transaction explorer, that makes human readable ERC-4337 transactions and contract interactions.

Comes not only as integrated module in the Ambire extension(s), but as a standalone web app also.

### Development-optimized Build

```bash
yarn web:benzin
```

And find the resulting build in the "build/benzin-dev" folder.

### Production-optimized Build

```bash
yarn build:web:benzin
```

And find the resulting build in the "build/benzin-prod" folder.

## Ambire Legends

Ambire Legends is a gamified testing web3 app for the Ambire browser extensions. It is designed to users you discover the power of Smart Accounts via an epic onchain adventure. [Read more](https://legends.ambire.com/).

### Development-optimized Build

```bash
yarn web:legends
```

And find the resulting build in the "build/legends-dev" folder.

```bash
yarn build:web:legends
```

And find the resulting build in the "build/legends-prod" folder.

## Others

### Browser Extensions E2E Tests

#### Configuration

The best approach here is to follow `.github/workflows/tests.yml`. It contains all the necessary instructions for CI, which are also applicable locally. Make sure to:

- Set all necessary .env variables (marked as end-to-end tests configuration).
- See [#1409](https://github.com/AmbireTech/ambire-app/pull/1409) for more details.

#### Running against production

To build the webkit production version of the extension and run the E2E tests against the /webkit-prod folder, run:

```bash
yarn run test:e2e:web
```

#### Running against development

For debugging, to use the hot-reloaded webpack dev webkit build and to allow running individual tests easily run:

```bash
yarn test:e2e:web:dev
```

When debugging or writing a new test, it is easier to use this command, as the project is hot-reloaded with every change you make to the codebase (e.g., adding a new selector or debugging a state), eliminating the need for a complete production build (as before). Additionally, you can run tests for a single or multiple test files.

Here's how to run the tests for a single test file:

```json
{
  "test:e2e:web:dev": "WEBPACK_BUILD_OUTPUT_PATH=webkit-dev jest --config=./tests/jest.config.js -- ./tests/basic_account/ba_transactions.test.js"
}
```

If you are fixing a failing CI test and want to mimic CI at 100%, you should configure the display server:

First, run `Xvfb -ac :99 -screen 0 1280x1024x16 > /dev/null 2>&1 &`, then set the `DISPLAY` variable with `export DISPLAY=:99.0`. By doing this, when Jest & Puppeteer are running, they will use the newly created virtual display instead of your local display. If you want to switch back to your local display, you should run export `DISPLAY=:0`.

See [#2438](https://github.com/AmbireTech/ambire-app/pull/2438) for more details.

### Translations (Beta)

To scan the project for translation labels and to update translations JSON files, run:

```bash
yarn translations:scan
```

PS: Secondary languages not implemented / translated / fully tested yet.
