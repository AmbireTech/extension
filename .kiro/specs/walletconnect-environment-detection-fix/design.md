# WalletConnect Environment Detection Fix - Bugfix Design

## Overview

The @walletconnect/environment package incorrectly detects React Native as a browser environment in our mobile app because our shim.js creates a global `document` object. The detection logic checks `typeof document === "undefined"` as one of the conditions to identify React Native, but our shim creates `global.document = { location: global.location }`, causing this check to fail.

This bug prevents WalletConnect from operating in React Native mode, leading to errors when WalletConnect attempts to use browser-specific APIs that don't exist in our minimal document shim. The fix must ensure WalletConnect correctly identifies the environment as React Native while preserving the document shim functionality needed by shared components between the browser extension and mobile app.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when WalletConnect's `isReactNative()` function evaluates in a React Native environment where `global.document` has been shimmed
- **Property (P)**: The desired behavior - WalletConnect should correctly identify the environment as React Native and operate in React Native mode
- **Preservation**: Existing document/window shim functionality that shared components depend on must remain unchanged
- **isReactNative()**: The function in `node_modules/@walletconnect/environment/dist/cjs/env.js` that determines if the code is running in React Native
- **shim.js**: The file at the project root that creates global polyfills and shims for compatibility between browser extension and mobile app
- **WalletKit**: The WalletConnect SDK class from `@reown/walletkit` used in `src/mobile/modules/wallet-connect/services/walletConnectService.ts`

## Bug Details

### Bug Condition

The bug manifests when WalletConnect's environment detection runs in the React Native mobile app after shim.js has executed. The `isReactNative()` function checks three conditions, but the first condition fails because our shim creates a global document object.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type RuntimeEnvironment
  OUTPUT: boolean

  RETURN input.platform === "ReactNative"
         AND input.hasGlobalDocument === true
         AND input.hasNavigatorWithReactNativeProduct === true
         AND isReactNative() === false
END FUNCTION
```

### Examples

- **Example 1**: When `initWalletConnect()` is called in `walletConnectService.ts`, WalletConnect initializes in browser mode instead of React Native mode, causing errors when it tries to access browser-specific document methods
- **Example 2**: The check `typeof document === "undefined"` returns `false` because shim.js creates `global.document = { location: global.location }`
- **Example 3**: WalletConnect's `isBrowser()` function returns `true` (because `!isReactNative() && !isNode()` evaluates to true), leading to incorrect code paths
- **Edge case**: If shim.js is modified or removed in the future, WalletConnect should still work correctly in React Native

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Shared components between browser extension and mobile app must continue to access `document.addEventListener`, `document.removeEventListener`, `document.querySelector`, `document.querySelectorAll` without errors
- Shared components must continue to access `window.addEventListener`, `window.removeEventListener`, `window.close` without errors
- The browser extension must continue to function correctly with all existing shim functionality intact
- Code accessing `global.location`, `MutationObserver`, or `CustomEvent` in the mobile app must continue to work with shimmed implementations

**Scope:**
All code paths that do NOT involve WalletConnect's environment detection should be completely unaffected by this fix. This includes:
- All existing shim functionality for shared components
- Browser extension behavior
- Other libraries that may check for document/window existence
- Application code that relies on the shims

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Shim Interference with Environment Detection**: The shim.js file creates `global.document = { location: global.location }` to support shared components, but this minimal object causes `typeof document === "undefined"` to return `false`, breaking WalletConnect's React Native detection logic

2. **Detection Order**: WalletConnect checks `typeof document === "undefined"` before checking `navigator.product === "ReactNative"`, so the presence of any document object (even a minimal shim) causes the check to fail

3. **Insufficient Shim Detection**: WalletConnect's detection logic doesn't account for environments where a minimal document shim exists but the environment is still React Native

4. **Timing Issue**: The shim.js file executes before WalletConnect initializes, so by the time `isReactNative()` runs, the document object already exists

## Correctness Properties

Property 1: Bug Condition - WalletConnect Correctly Identifies React Native

_For any_ runtime environment where the platform is React Native (navigator.product === "ReactNative") and a document shim exists, the fixed environment detection SHALL correctly identify the environment as React Native, causing `isReactNative()` to return `true` and WalletConnect to operate in React Native mode.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Shim Functionality Unchanged

_For any_ code path that accesses document or window methods provided by the shim (addEventListener, removeEventListener, querySelector, querySelectorAll, close), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing shim functionality for shared components and the browser extension.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct, we have several potential approaches:

**Approach 1: Modify the Document Shim to be More Detectable**

**File**: `shim.js`

**Specific Changes**:
1. **Add a marker property**: Add a property to the document shim that indicates it's a minimal shim, not a real browser document
   - Add `global.document.__isShim = true` or `global.document.__reactNativeShim = true`
   - This allows detection logic to distinguish between a real browser document and our shim

2. **Make document more minimal**: Remove or minimize properties that might confuse detection logic
   - Consider if `location` property is necessary on the document object
   - Evaluate if document could be undefined initially and only defined when needed

**Approach 2: Patch WalletConnect's Environment Detection**

**File**: `patches/@walletconnect+environment+1.0.1.patch` (using patch-package)

**Specific Changes**:
1. **Modify isReactNative() logic**: Change the detection to check for React Native indicators first
   - Reorder checks to prioritize `navigator.product === "ReactNative"`
   - Add additional checks for React Native-specific globals (e.g., `global.HermesInternal`)

2. **Add shim detection**: Enhance the logic to detect minimal document shims
   - Check if document has only minimal properties (e.g., only `location`)
   - Check for marker properties that indicate a shim

**Approach 3: Import WalletConnect Before Shim Execution**

**File**: `src/mobile/modules/wallet-connect/services/walletConnectService.ts` and potentially `index.js`

**Specific Changes**:
1. **Reorder imports**: Ensure `@walletconnect/react-native-compat` and WalletConnect imports happen before shim.js executes
   - This may require restructuring the import order in the entry point
   - May need to conditionally apply shims only after WalletConnect initializes

2. **Conditional shimming**: Apply document shims only when needed, not globally at startup
   - Detect when shared components are loaded and apply shims just-in-time
   - More complex but preserves WalletConnect's detection

**Recommended Approach: Approach 2 (Patch WalletConnect)**

This approach is recommended because:
- It's the most isolated change - doesn't affect our shim logic or import order
- It's explicit and maintainable - the patch file documents exactly what we changed and why
- It's reversible - if WalletConnect fixes this in a future version, we can remove the patch
- It doesn't risk breaking shared components or the browser extension
- The project already uses patch-package (visible in package.json devDependencies)

**Detailed Implementation for Approach 2**:

Create a patch file that modifies `node_modules/@walletconnect/environment/dist/cjs/env.js`:

```javascript
function isReactNative() {
    // Check for React Native first, before checking document
    if (typeof navigator !== "undefined" && navigator.product === "ReactNative") {
        return true;
    }

    // Check for Hermes (React Native's JavaScript engine)
    if (typeof global !== "undefined" &&
        typeof global.HermesInternal !== "undefined") {
        return true;
    }

    // Original check (but now only as a fallback)
    return (typeof document === "undefined" &&
        typeof navigator !== "undefined" &&
        navigator.product === "ReactNative");
}
```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that check WalletConnect's environment detection in a React Native environment with the document shim present. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Environment Detection Test**: Check that `isReactNative()` returns `false` when it should return `true` (will fail on unfixed code)
2. **Document Shim Presence Test**: Verify that `typeof document !== "undefined"` after shim.js executes (will pass, confirming the root cause)
3. **Navigator Product Test**: Verify that `navigator.product === "ReactNative"` in the mobile app (will pass, confirming React Native environment)
4. **WalletConnect Initialization Test**: Attempt to initialize WalletConnect and observe browser-mode errors (will fail on unfixed code)

**Expected Counterexamples**:
- `isReactNative()` returns `false` even though `navigator.product === "ReactNative"`
- WalletConnect throws errors about missing browser APIs (e.g., "Cannot read property 'createElement' of undefined")
- Possible causes: document shim interferes with detection, detection order is wrong, insufficient React Native indicators

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := isReactNative_fixed()
  ASSERT result === true
  ASSERT walletConnectInitializes(input) === true
  ASSERT walletConnectOperatesInReactNativeMode(input) === true
END FOR
```

**Test Cases**:
1. **Fixed Environment Detection**: Verify `isReactNative()` returns `true` in React Native with document shim
2. **WalletConnect Initialization Success**: Verify WalletConnect initializes without browser-mode errors
3. **React Native Mode Operation**: Verify WalletConnect uses React Native-specific code paths
4. **Session Proposal Handling**: Verify WalletConnect can handle session proposals correctly

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT shimBehavior_original(input) = shimBehavior_fixed(input)
  ASSERT sharedComponentBehavior_original(input) = shimBehavior_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for shared components and shim usage, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Document Method Preservation**: Verify `document.addEventListener`, `document.removeEventListener`, `document.querySelector`, `document.querySelectorAll` continue to work in shared components
2. **Window Method Preservation**: Verify `window.addEventListener`, `window.removeEventListener`, `window.close` continue to work
3. **Browser Extension Preservation**: Verify the browser extension continues to function correctly with all shim functionality
4. **Other Library Preservation**: Verify other libraries that may check for document/window existence continue to work correctly

### Unit Tests

- Test `isReactNative()` returns `true` in React Native environment with document shim
- Test `isReactNative()` returns `false` in actual browser environment
- Test `isReactNative()` returns `false` in Node.js environment
- Test document shim methods are callable and don't throw errors
- Test WalletConnect initialization succeeds in React Native mode

### Property-Based Tests

- Generate random shared component usage patterns and verify document/window methods work correctly
- Generate random WalletConnect initialization scenarios and verify correct environment detection
- Test that all non-WalletConnect code paths produce identical behavior before and after the fix

### Integration Tests

- Test full WalletConnect flow: initialization → session proposal → session approval → session request → response
- Test shared components in mobile app continue to work with document/window shims
- Test browser extension continues to work with all shim functionality
- Test that WalletConnect operates in React Native mode (not browser mode) in the mobile app
