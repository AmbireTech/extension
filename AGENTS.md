You are an AI Agent working in a security-critical Web3 monorepo that encompasses a mobile app wallet, browser extension wallet and standalone websites (`src/benzin` and `src/legends`).

## Tech stack
react, react-native, react-native-web, typescript, expo (bare workflow), ethers, viem and more (check the root `package.json` if another package is needed)

## Project overview
- The extension is using manifest version 3 on Chrome, but also works on Firefox using a background script
- `background` in the wallet refers to:
  - Service worker on Chrome (`src/web/extension-services/background/`)
  - Background script on Firefox (`src/web/extension-services/background/`)
  - Webview worker on mobile (`src/mobile/services/WebViewWorker/`)
- The business logic and persistent state is handled primarily using `controllers` (JS classes), which usually run in the `background`
- The websites run some controllers separately without a `background`
- `src/ambire-common` is a **git submodule** that contains the business logic of the application. Changes inside it are in a separate repo and require a separate commit flow
- `src/common` can be imported by all environments, but environments shouldn't import from other environments (e.g., `web/` SHOULD NOT import from `mobile/`)
- There are environment specific files. Be VERY careful when creating files and debugging as they exist in two ways:
  - Have the file in the environment folder (e.g., `mobile/`, `web/`) and import it from there
  - Use the `.native.tsx` or `.web.tsx` suffix and import from `common/`, which automatically resolves to the correct file based on the environment

## Useful commands (not exhaustive):
- Check for typescript errors - `yarn extension:type:check-new`
- Lint and auto-fix source files: `yarn lint:fix`

## Rules

### Project specific:
- Prefer naming variable ways in a self-explanatory way instead of adding comments
- Prefer short circuits to nested if statements for better readability
- Aim for low cyclomatic complexity unless it's not for parts that are handling large sets of data and performance is critical
- Use `yarn` in the root directory and `npm` in `src/ambire-common` (if present)
- NEVER run `yarn install` directly, use `yarn setup` instead
- Use `useHover` and `HoverablePressable` for interactive elements
- ALWAYS use `theme` from `useTheme()` for colors
- ALWAYS use `spacings` from `@common/styles/spacings` for margins and paddings (unless the spacing is missing in the utility)
- ALWAYS use `flexbox` from `@common/styles/utils/flexbox` for flex styling (unless the style is missing in the utility)
- ALWAYS use `isDev`, `isWeb`, `isMobile`, `isAndroid`, `isiOS`, etc. from `@common/config/env` for environment and platform checks; NEVER use `__DEV__` outside `.native.tsx` files because it does not exist in web/extension builds
- ALWAYS use `useNavigation` and `useRoute` from `@common/hooks` for routing; NEVER import `react-router-dom` or `react-router-native` directly
- ALWAYS use `useToast` from `@common/hooks/useToast` for toasts; NEVER use `window.alert`, `Alert.alert`, or `console.log` for user-facing messages
- ALWAYS wrap text in `t()` from `useTranslation()` (`imported from '@common/config/localization'`)
- ALWAYS use `react-native-modalize` with `BottomSheet` for modals and bottom sheets
- Tooltips are added using the pattern: `dataSet={createGlobalTooltipDataSet(...)}` which creates a global dataset that is picked up by a `GlobalTooltip` component at the root of the app.
- All icons are in src/common/assets/svg/...; ALWAYS use icons from there and report if you can't find a suitable one by adding a comment instead of the icon and asking the human to add it
- NEVER use `gap` for spacings as it is not supported in React Native; use `margin` instead

### Security:
- This is a security-critical Web3 wallet. Private keys and seed phrases must never be logged or exposed
- The extension uses LavaMoat with SES for the background. If you add/remove dependencies or change import patterns, regenerate the policy with `yarn build:extensions:generate-policy` and review the changes

### Code quality:
- Ensure that list keys are unique and stable (NEVER use the array index)
- ALWAYS memoize functions, components and complex values with `useMemo`, `useCallback` and `React.memo`.
- ALWAYS ensure that subscriptions, event listeners, timers and other side effects are properly cleaned up
- NEVER delete existing comments when updating a code block. If the logic changes and the comment becomes inaccurate, update the comment instead of deleting it. Delete a comment ONLY if the logic it describes is completely removed or the new logic is entirely self-explanatory without the comment
- NEVER swallow errors, log them and handle them appropriately. If the error is unexpected also track it in Sentry with `captureException`
- NEVER modify git config or run destructive git operations
- NEVER commit unless explicitly requested by user
- NEVER stage changes unless explicitly requested by user

## Controller state update lifecycle
1. The UI calls `dispatch` from `useController` to invoke a controller method. This is **fire-and-forget** — `dispatch` does NOT return a response or the new state
2. The action travels to the background (via `PortMessenger` in the extension, `WebViewWorker` in mobile) where `handleActions` finds the controller and calls the requested method
3. The controller method updates its internal state and calls `this.emitUpdate()`
4. The `background` has an `onUpdate` listener for every registered controller that serializes the controller state and sends it back to the UI
5. The UI receives the update, writes it to the `controllerStore`, and `useControllerState` (via `useSyncExternalStore`) triggers a React re-render with the new state
6. Because of this asynchronous cycle, state changes are NOT immediate after `dispatch`. If an action fails silently or the controller doesn't call `emitUpdate`, the UI will never re-render
- On standalone websites (`benzin`, `legends`) controllers run in the main thread directly and `dispatch` invokes methods synchronously, but the `emitUpdate` → store → re-render cycle still applies
