# Bug Condition Exploration - Counterexamples

**Date:** 2024
**Test File:** `src/mobile/modules/wallet-connect/services/__tests__/walletConnectEnvironmentDetection.bugfix.test.ts`
**Status:** ✅ Bug Confirmed - Test Failed as Expected

## Summary

The bug condition exploration test successfully confirmed the bug exists in the unfixed code. All 4 test cases failed as expected, demonstrating that WalletConnect's `isReactNative()` function incorrectly returns `false` when a document shim is present in a React Native environment.

## Counterexamples Found

### 1. Property 1: Minimal Failing Case (Property-Based Test)

**Test Type:** Property-based test with fast-check
**Runs:** 50 test cases generated
**Result:** Failed on first test case

**Minimal Counterexample (after shrinking):**
```json
{
  "documentHasLocation": false,
  "documentHasAddEventListener": false,
  "documentHasQuerySelector": false,
  "navigatorProduct": "ReactNative",
  "hasHermesInternal": false
}
```

**Shrinking History:**
The property-based test found the bug immediately and then shrunk the counterexample through 3 iterations to find the minimal failing case:
1. Started with: `{documentHasLocation:false, documentHasAddEventListener:true, documentHasQuerySelector:true, navigatorProduct:"ReactNative", hasHermesInternal:true}`
2. Shrunk to: `{documentHasLocation:false, documentHasAddEventListener:false, documentHasQuerySelector:true, navigatorProduct:"ReactNative", hasHermesInternal:true}`
3. Shrunk to: `{documentHasLocation:false, documentHasAddEventListener:false, documentHasQuerySelector:false, navigatorProduct:"ReactNative", hasHermesInternal:true}`
4. Final minimal case: `{documentHasLocation:false, documentHasAddEventListener:false, documentHasQuerySelector:false, navigatorProduct:"ReactNative", hasHermesInternal:false}`

**Key Insight:** The bug occurs even with the most minimal document shim (empty object). The presence of ANY document object breaks the detection.

### 2. Property 1b: Concrete Case from shim.js

**Test Type:** Unit test with exact shim.js configuration
**Result:** Failed as expected

**Environment Setup:**
```javascript
global.document = {
  location: {
    href: '',
    pathname: '/',
    search: '',
    hash: '',
    origin: '',
    protocol: 'https:',
    hostname: 'localhost'
  }
}

global.navigator = {
  product: 'ReactNative'
}
```

**Observed Behavior:**
- `typeof document`: `"object"` ✓ (confirms shim present)
- `document.location`: Defined ✓ (confirms shim structure)
- `navigator.product`: `"ReactNative"` ✓ (confirms RN environment)
- `isReactNative()`: `false` ❌ (BUG - should be `true`)

### 3. Property 1c: Environment Detection Results

**Test Type:** Integration test checking both isReactNative() and isBrowser()
**Result:** Failed as expected

**Environment Detection Results:**
```
isReactNative(): false  ❌ (INCORRECT - should be true)
isBrowser(): false      ✓ (correct by accident in test environment)
typeof document: object ✓ (confirms shim presence)
navigator.product: ReactNative ✓ (confirms RN environment)
```

**Analysis:**
- `isReactNative()` returns `false` because `typeof document === "undefined"` check fails
- `isBrowser()` returns `false` because it checks `!isReactNative() && !isNode()`
- In the test environment, `isNode()` returns `true`, so `isBrowser()` is `false`
- In actual React Native app, `isNode()` would return `false`, making `isBrowser()` return `true` (incorrect)

### 4. Property 1d: Hermes Engine Indicator

**Test Type:** Unit test with HermesInternal global
**Result:** Failed as expected

**Environment Setup:**
```javascript
global.document = { location: { href: '' } }
global.navigator = { product: 'ReactNative' }
global.HermesInternal = {}
```

**Observed Behavior:**
- `typeof HermesInternal`: `"object"` ✓ (confirms Hermes present)
- `isReactNative()`: `false` ❌ (BUG - should detect via Hermes)

**Key Insight:** The current detection logic doesn't check for `HermesInternal`, which is a reliable React Native indicator.

## Root Cause Analysis

### Confirmed Root Cause

The bug is caused by the order of checks in WalletConnect's `isReactNative()` function:

```javascript
function isReactNative() {
    return (typeof document === "undefined" &&
        typeof navigator !== "undefined" &&
        navigator.product === "ReactNative");
}
```

**Problem:** The function requires `typeof document === "undefined"` to be `true`. When shim.js creates a global document object (even a minimal one), this check fails, causing the entire function to return `false`.

### Why This Matters

1. **Shim Interference:** Our shim.js creates `global.document` to support shared components between browser extension and mobile app
2. **Detection Failure:** WalletConnect checks for document absence BEFORE checking React Native indicators
3. **Incorrect Mode:** WalletConnect operates in browser mode instead of React Native mode
4. **Runtime Errors:** Browser-mode code tries to access browser-specific APIs that don't exist in our minimal shim

## Expected Behavior After Fix

After implementing the fix (reordering detection logic), the tests should pass:

1. ✅ `isReactNative()` returns `true` when `navigator.product === "ReactNative"` (regardless of document presence)
2. ✅ `isReactNative()` returns `true` when `HermesInternal` is present
3. ✅ `isBrowser()` returns `false` in React Native environment
4. ✅ WalletConnect initializes in React Native mode without errors

## Test Execution Details

**Command:** `yarn test src/mobile/modules/wallet-connect/services/__tests__/walletConnectEnvironmentDetection.bugfix.test.ts --verbose`

**Results:**
- Test Suites: 1 failed, 1 total
- Tests: 4 failed, 4 total
- Time: 8.966s

**All failures are EXPECTED** - they confirm the bug exists on unfixed code.

## Next Steps

1. ✅ Bug condition confirmed - counterexamples documented
2. ⏭️ Write preservation property tests (Task 2)
3. ⏭️ Implement fix using patch-package (Task 3)
4. ⏭️ Verify bug condition test passes after fix
5. ⏭️ Verify preservation tests still pass after fix
