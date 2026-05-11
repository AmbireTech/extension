# Implementation Plan: WalletConnect Dapp Communication Adapter

## Overview

This implementation fixes the WalletConnect response formatting issue by updating the `respondToWalletConnectRequest` function to properly format raw results into complete JSON-RPC responses. The existing communication logic (`handleProviderRequests`, `rpcFlow`, `ProviderController`) remains completely unchanged and continues to be used for WalletConnect requests.

## Tasks

- [ ] 1. Update respondToWalletConnectRequest with response formatting logic
  - [x] 1.1 Implement response type detection (result vs error)
    - Add logic to check if rawResponse contains result or error field
    - Ensure only one field is present (never both)
    - _Requirements: 1.1, 2.5, 6.2, 6.3, 6.4_

  - [x] 1.2 Implement success response formatting
    - Create JSON-RPC response with id, jsonrpc: '2.0', and result fields
    - Convert undefined result values to null
    - Preserve arrays, objects, and primitive values correctly
    - _Requirements: 1.2, 2.2, 2.3, 6.5_

  - [x] 1.3 Implement error response formatting
    - Create JSON-RPC response with id, jsonrpc: '2.0', and error fields
    - Handle errors with serialize() method
    - Handle plain error objects without serialize() method
    - Set default error code (5000) if missing
    - Set default error message (error.toString() or 'Unknown error') if missing
    - Include optional data field if present
    - _Requirements: 1.5, 2.4, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 1.4 Write unit tests for respondToWalletConnectRequest
    - Test success response formatting with various result types (undefined, null, primitives, objects, arrays)
    - Test error response formatting with serialize() method
    - Test error response formatting without serialize() method
    - Test default error code and message handling
    - Test early return when walletKit is not initialized
    - _Requirements: 1.1, 1.2, 1.5, 2.2, 2.3, 2.4, 3.2, 3.3, 3.4, 3.5_

- [ ] 2. Investigate and verify existing communication logic
  - [x] 2.1 Review handleProviderRequests for blocking checks
    - Search for webview-specific checks that might block WalletConnect requests
    - Identify any origin validation or session checks
    - Document findings
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 2.2 Review rpcFlow and ProviderController for blocking checks
    - Search for webview-specific checks in rpcFlow
    - Search for webview-specific checks in ProviderController
    - Verify WalletConnect requests are treated equivalently to webview requests
    - Document findings
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 2.3 Fix any blocking checks if found
    - If blocking checks are found, update logic to allow WalletConnect requests
    - Ensure security and permission checks remain intact
    - Maintain existing validation and authorization logic
    - _Requirements: 9.1, 9.3, 9.4, 9.5_

- [ ] 3. Checkpoint - Verify response formatting and communication logic
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Verify handleActions response path for WalletConnect
  - [x] 4.1 Review HANDLE_PROVIDER_REQUEST handler for WalletConnect
    - Verify topic parameter is used to identify WalletConnect requests
    - Verify dapp session creation/retrieval logic
    - Verify wcBridgeMessenger setup
    - Verify raw results are sent to React Native via sendToReactEvent
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 7.5_

  - [x] 4.2 Verify webview response path remains unchanged
    - Confirm webview requests use sendToDappWebView
    - Confirm no interference between WalletConnect and webview flows
    - _Requirements: 7.1, 7.2, 7.4_

- [ ] 5. Create integration tests for end-to-end flow
  - [ ]* 5.1 Write integration test for successful WalletConnect request
    - Simulate session_request event from WalletConnect SDK
    - Verify HANDLE_PROVIDER_REQUEST action is dispatched
    - Verify dapp session creation
    - Verify wcBridgeMessenger setup
    - Verify handleProviderRequests is called
    - Verify raw result is sent to React Native
    - Verify JSON-RPC response is formatted correctly
    - Verify response is sent to WalletConnect SDK
    - _Requirements: 1.1, 1.2, 4.1, 5.1, 5.2, 5.3, 5.4, 6.1, 6.5, 7.5_

  - [ ]* 5.2 Write integration test for error handling
    - Simulate unauthorized request
    - Verify error is caught by handleActions
    - Verify raw error is sent to React Native
    - Verify error is formatted as JSON-RPC error response
    - Verify error response is sent to WalletConnect SDK
    - _Requirements: 1.5, 3.1, 3.2, 3.3, 3.4, 3.5, 6.1_

  - [ ]* 5.3 Write integration test for undefined result handling
    - Simulate request that returns undefined (e.g., wallet_switchEthereumChain)
    - Verify undefined is converted to null in JSON-RPC response
    - Verify response is sent to WalletConnect SDK
    - _Requirements: 1.2, 2.3, 6.1_

  - [ ]* 5.4 Write integration test for multiple concurrent requests
    - Simulate multiple requests from same session
    - Simulate requests from different sessions
    - Verify no interference between sessions
    - Verify correct responses for each request
    - _Requirements: 4.3, 4.4, 10.1_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 7. Write property-based tests for correctness properties
  - [ ]* 7.1 Property test for JSON-RPC response structure completeness
    - **Property 1: JSON-RPC Response Structure Completeness**
    - **Validates: Requirements 2.1, 2.2, 2.4, 2.5, 6.2, 6.3, 6.4, 6.5**
    - Generate random raw responses with result or error
    - Verify resulting JSON-RPC response has exactly one of result or error
    - Verify jsonrpc is '2.0'
    - Verify id matches request ID

  - [ ]* 7.2 Property test for undefined to null conversion
    - **Property 2: Undefined to Null Conversion**
    - **Validates: Requirement 2.3**
    - Generate random raw responses with undefined result
    - Verify undefined is converted to null in JSON-RPC response

  - [ ]* 7.3 Property test for error field defaults
    - **Property 10: Error Field Defaults**
    - **Validates: Requirements 3.4, 3.5**
    - Generate random error objects with missing code or message
    - Verify default error code (5000) is used when missing
    - Verify default error message is used when missing

  - [ ]* 7.4 Property test for response guarantee
    - **Property 16: Response Guarantee**
    - **Validates: Requirement 6.1**
    - Generate random WalletConnect requests (valid and invalid)
    - Verify every request produces a response via sendToReactEvent

- [ ] 8. Final verification and documentation
  - [x] 8.1 Test with real WalletConnect connection
    - Connect to a test dapp via WalletConnect
    - Send various requests (wallet_getCapabilities, eth_accounts, etc.)
    - Verify all responses are properly formatted
    - Verify no "Missing or invalid respond() response" errors
    - _Requirements: 1.1, 1.2, 1.5, 6.1_

  - [x] 8.2 Verify no regression in webview flow
    - Test in-app webview requests
    - Verify responses go through webview bridge
    - Verify no interference with WalletConnect flow
    - _Requirements: 7.1, 7.2, 7.4_

  - [x] 8.3 Document changes and update comments
    - Add comments explaining response formatting logic
    - Update any relevant documentation
    - Document any blocking checks found and fixed

- [ ] 9. Final checkpoint - Complete implementation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The primary fix is in task 1: updating `respondToWalletConnectRequest` with response formatting logic
- Task 2 investigates potential blocking checks in existing communication logic (may not require changes)
- Task 4 verifies the existing handleActions response path (likely no changes needed)
- All property tests validate universal correctness properties from the design document
- Integration tests validate end-to-end flows with multiple scenarios
- The existing communication logic (`handleProviderRequests`, `rpcFlow`, `ProviderController`) remains completely unchanged
