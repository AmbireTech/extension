# Task 8.2: Manual Testing Guide - Webview Flow Regression Verification

## Overview

This document provides a comprehensive manual testing guide to verify that the WalletConnect implementation has not caused any regression in the existing in-app webview flow.

**Task:** 8.2 Verify no regression in webview flow
**Requirements:** 7.1, 7.2, 7.4
**Status:** Manual Testing Required

## Background

Task 4.2 performed a code review and verified that:
- ✅ Webview requests continue to use `HANDLE_PROVIDER_REQUEST` action
- ✅ Webview responses are sent through `sendToDappWebView` as before
- ✅ No interference between WalletConnect and webview flows (topic-based isolation)

This task (8.2) confirms these findings through **manual testing** to ensure the implementation works correctly in practice.

## Prerequisites

Before starting manual testing:
1. Build and install the app on a test device or simulator
2. Ensure you have access to a test dapp that can be loaded in the in-app webview
3. Have the app logs accessible for debugging if needed
4. Ensure the wallet has at least one account configured

## Test Environment Setup

### Option 1: Use Existing Test Dapp
If the project has an existing test dapp for webview testing, use that.

### Option 2: Create a Simple Test Dapp
Create a simple HTML file with JavaScript to test provider requests:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Webview Test Dapp</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        button { margin: 10px 0; padding: 10px; font-size: 16px; }
        .result { background: #f0f0f0; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Webview Provider Test</h1>

    <button onclick="testEthAccounts()">Test eth_accounts</button>
    <button onclick="testEthChainId()">Test eth_chainId</button>
    <button onclick="testWalletGetCapabilities()">Test wallet_getCapabilities</button>
    <button onclick="testPersonalSign()">Test personal_sign</button>

    <div id="results"></div>

    <script>
        const resultsDiv = document.getElementById('results');

        function logResult(method, result) {
            const div = document.createElement('div');
            div.className = 'result';
            div.innerHTML = `<strong>${method}:</strong><br><pre>${JSON.stringify(result, null, 2)}</pre>`;
            resultsDiv.insertBefore(div, resultsDiv.firstChild);
        }

        async function testEthAccounts() {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                logResult('eth_accounts', { success: true, accounts });
            } catch (error) {
                logResult('eth_accounts', { success: false, error: error.message });
            }
        }

        async function testEthChainId() {
            try {
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                logResult('eth_chainId', { success: true, chainId });
            } catch (error) {
                logResult('eth_chainId', { success: false, error: error.message });
            }
        }

        async function testWalletGetCapabilities() {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                const capabilities = await window.ethereum.request({
                    method: 'wallet_getCapabilities',
                    params: [accounts[0]]
                });
                logResult('wallet_getCapabilities', { success: true, capabilities });
            } catch (error) {
                logResult('wallet_getCapabilities', { success: false, error: error.message });
            }
        }

        async function testPersonalSign() {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                const message = 'Hello from webview test!';
                const signature = await window.ethereum.request({
                    method: 'personal_sign',
                    params: [message, accounts[0]]
                });
                logResult('personal_sign', { success: true, signature });
            } catch (error) {
                logResult('personal_sign', { success: false, error: error.message });
            }
        }
    </script>
</body>
</html>
```

Host this file on a local server or use a service like GitHub Pages.

## Manual Test Cases

### Test Case 1: Basic Provider Requests

**Objective:** Verify that basic provider requests work correctly in the webview

**Steps:**
1. Open the in-app webview and navigate to the test dapp
2. Click "Test eth_accounts"
3. Observe the response

**Expected Result:**
- ✅ Request completes successfully
- ✅ Returns array of account addresses
- ✅ No errors in console
- ✅ Response appears within 1-2 seconds

**Validates:** Requirements 7.1, 7.2

---

### Test Case 2: Chain ID Request

**Objective:** Verify chain-related requests work correctly

**Steps:**
1. In the webview, click "Test eth_chainId"
2. Observe the response

**Expected Result:**
- ✅ Request completes successfully
- ✅ Returns current chain ID (e.g., "0x1" for Ethereum mainnet)
- ✅ No errors in console
- ✅ Response appears within 1-2 seconds

**Validates:** Requirements 7.1, 7.2

---

### Test Case 3: Wallet Capabilities Request

**Objective:** Verify wallet-specific requests work correctly

**Steps:**
1. In the webview, click "Test wallet_getCapabilities"
2. Observe the response

**Expected Result:**
- ✅ Request completes successfully
- ✅ Returns capabilities object for the current chain
- ✅ No errors in console
- ✅ Response appears within 1-2 seconds

**Validates:** Requirements 7.1, 7.2

---

### Test Case 4: User Interaction Request (Signing)

**Objective:** Verify requests requiring user interaction work correctly

**Steps:**
1. In the webview, click "Test personal_sign"
2. Approve the signing request in the wallet UI
3. Observe the response

**Expected Result:**
- ✅ Signing modal appears
- ✅ After approval, request completes successfully
- ✅ Returns signature string
- ✅ No errors in console

**Validates:** Requirements 7.1, 7.2

---

### Test Case 5: Multiple Sequential Requests

**Objective:** Verify multiple requests work correctly in sequence

**Steps:**
1. In the webview, click "Test eth_accounts"
2. Wait for response
3. Click "Test eth_chainId"
4. Wait for response
5. Click "Test wallet_getCapabilities"
6. Wait for response

**Expected Result:**
- ✅ All requests complete successfully
- ✅ Each request returns correct data
- ✅ No interference between requests
- ✅ No errors in console

**Validates:** Requirements 7.1, 7.2, 7.4

---

### Test Case 6: Webview + WalletConnect Isolation

**Objective:** Verify no interference between webview and WalletConnect flows

**Steps:**
1. Connect to a WalletConnect dapp (if available)
2. Open the in-app webview and navigate to the test dapp
3. In the webview, click "Test eth_accounts"
4. Switch to the WalletConnect dapp and send a request
5. Switch back to the webview and click "Test eth_chainId"

**Expected Result:**
- ✅ Both webview requests complete successfully
- ✅ WalletConnect request completes successfully
- ✅ No interference between the two flows
- ✅ Each flow receives correct responses
- ✅ No errors in console

**Validates:** Requirement 7.4

---

### Test Case 7: Error Handling in Webview

**Objective:** Verify error responses work correctly in webview

**Steps:**
1. In the webview, modify the test dapp to send an invalid request:
   ```javascript
   window.ethereum.request({ method: 'invalid_method' })
   ```
2. Observe the response

**Expected Result:**
- ✅ Request fails with appropriate error
- ✅ Error message is clear and informative
- ✅ No app crashes
- ✅ Subsequent requests still work

**Validates:** Requirements 7.1, 7.2

---

### Test Case 8: Page Reload

**Objective:** Verify webview flow works after page reload

**Steps:**
1. In the webview, send a successful request (e.g., eth_accounts)
2. Reload the page
3. Send the same request again

**Expected Result:**
- ✅ Request works before reload
- ✅ Request works after reload
- ✅ No errors in console
- ✅ No session issues

**Validates:** Requirements 7.1, 7.2

---

## Test Results Template

Use this template to document your test results:

```markdown
## Test Execution Results

**Date:** [Date]
**Tester:** [Name]
**App Version:** [Version]
**Device:** [Device/Simulator]
**OS Version:** [OS Version]

### Test Case 1: Basic Provider Requests
- Status: [ ] Pass [ ] Fail
- Notes:

### Test Case 2: Chain ID Request
- Status: [ ] Pass [ ] Fail
- Notes:

### Test Case 3: Wallet Capabilities Request
- Status: [ ] Pass [ ] Fail
- Notes:

### Test Case 4: User Interaction Request (Signing)
- Status: [ ] Pass [ ] Fail
- Notes:

### Test Case 5: Multiple Sequential Requests
- Status: [ ] Pass [ ] Fail
- Notes:

### Test Case 6: Webview + WalletConnect Isolation
- Status: [ ] Pass [ ] Fail
- Notes:

### Test Case 7: Error Handling in Webview
- Status: [ ] Pass [ ] Fail
- Notes:

### Test Case 8: Page Reload
- Status: [ ] Pass [ ] Fail
- Notes:

### Overall Result
- [ ] All tests passed - No regression detected
- [ ] Some tests failed - Regression detected (see notes)

### Additional Notes
[Any additional observations or issues]
```

## Debugging Tips

If any test fails:

1. **Check Console Logs:**
   - Look for errors in the app logs
   - Check for any WalletConnect-related errors
   - Look for routing issues in handleActions

2. **Verify Topic Parameter:**
   - Webview requests should NOT have `wc_session_request_` or `wc_session_proposal_` prefix
   - Check that routing logic correctly identifies webview requests

3. **Check Event Routing:**
   - Verify `action.sendToDappWebView` events are being sent
   - Verify `DappWebViewScreen.onProviderResponse` is being called
   - Check that responses are being injected into the webview

4. **Compare with Task 4.2 Findings:**
   - Review `.kiro/specs/walletconnect-dapp-communication-adapter/task-4.2-summary.md`
   - Verify the code paths match the documented flow

## Success Criteria

Task 8.2 is considered **PASSED** if:
- ✅ All 8 test cases pass
- ✅ No errors or crashes occur during testing
- ✅ Webview requests complete successfully
- ✅ No interference with WalletConnect flow (if tested)
- ✅ Response times are acceptable (< 2 seconds for non-signing requests)

Task 8.2 is considered **FAILED** if:
- ❌ Any test case fails
- ❌ Errors or crashes occur
- ❌ Webview requests hang or timeout
- ❌ Interference with WalletConnect flow is detected

## Next Steps

After completing manual testing:

1. **If all tests pass:**
   - Document results using the template above
   - Mark task 8.2 as complete
   - Proceed to task 8.3 (documentation)

2. **If any tests fail:**
   - Document the failure details
   - Review the code changes in handleActions.ts
   - Check for unintended modifications to webview flow
   - Fix any issues found
   - Re-run the failed tests

## References

- **Task 4.2 Summary:** `.kiro/specs/walletconnect-dapp-communication-adapter/task-4.2-summary.md`
- **Requirements:** `.kiro/specs/walletconnect-dapp-communication-adapter/requirements.md` (Requirements 7.1, 7.2, 7.4)
- **Design Document:** `.kiro/specs/walletconnect-dapp-communication-adapter/design.md`
- **handleActions Implementation:** `src/mobile/handlers/handleActions.ts`
- **Webview Screen:** `src/mobile/modules/webview/screens/DappWebViewScreen/DappWebViewScreen.tsx`
