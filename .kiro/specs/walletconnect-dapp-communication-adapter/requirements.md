# Requirements Document: WalletConnect Dapp Communication Adapter

## Introduction

This document specifies the requirements for fixing the WalletConnect response formatting issue. The current implementation correctly reuses the existing communication logic (`handleProviderRequests`, `rpcFlow`, `ProviderController`) for WalletConnect connections, which is the right approach. However, there is a response formatting problem in the WalletConnect service layer where raw results from the existing communication logic are not properly formatted into complete JSON-RPC responses before being sent to the WalletConnect SDK, causing "Missing or invalid respond() response" errors.

The solution focuses on fixing the response formatting in the WalletConnect service/context layer (`respondToWalletConnectRequest`) to properly wrap raw results into JSON-RPC response structures, while keeping the existing communication logic completely unchanged.

## Glossary

- **respondToWalletConnectRequest**: The function in walletConnectService that receives raw responses and sends them to WalletConnect SDK
- **JSON_RPC_Response**: A response object conforming to JSON-RPC 2.0 specification with id, jsonrpc, and either result or error fields
- **Provider_Controller**: The common controller that processes provider requests (eth_accounts, wallet_getCapabilities, etc.) - UNCHANGED
- **handleProviderRequests**: The common function that handles provider requests - UNCHANGED
- **rpcFlow**: The RPC flow handler - UNCHANGED
- **Dapp_Session**: A session object representing a connection between the wallet and a dapp
- **WC_Bridge_Messenger**: A messenger object that enables communication between the wallet and WalletConnect SDK
- **Response_Formatter**: Utility logic that converts raw results into JSON-RPC compliant responses
- **Session_Topic**: A unique identifier for a WalletConnect session
- **Request_ID**: A unique identifier for a JSON-RPC request
- **Raw_Response**: The unformatted result or error returned by handleProviderRequests

## Requirements

### Requirement 1: Response Formatting in WalletConnect Service

**User Story:** As a wallet developer, I want respondToWalletConnectRequest to properly format raw responses into JSON-RPC structures, so that WalletConnect SDK receives valid responses.

#### Acceptance Criteria

1. WHEN respondToWalletConnectRequest receives a raw response from handleActions, THE function SHALL determine if the response contains a result or error field
2. WHEN the raw response contains a result field, THE function SHALL create a JSON_RPC_Response with id, jsonrpc: '2.0', and result fields
3. WHEN the raw response contains an error field, THE function SHALL create a JSON_RPC_Response with id, jsonrpc: '2.0', and error fields
4. WHEN the result field is undefined, THE function SHALL convert it to null in the JSON_RPC_Response
5. WHEN the error field needs formatting, THE function SHALL ensure it has code and message fields before sending to WalletConnect SDK

### Requirement 2: JSON-RPC Response Structure

**User Story:** As a dapp developer, I want all responses to follow JSON-RPC 2.0 specification, so that my dapp can reliably parse wallet responses.

#### Acceptance Criteria

1. THE respondToWalletConnectRequest function SHALL create responses with id, jsonrpc, and either result or error fields
2. WHEN formatting a successful result, THE function SHALL set jsonrpc to '2.0', id to the Request_ID, and result to the value from the raw response
3. WHEN the raw response result is undefined, THE function SHALL convert it to null in the JSON_RPC_Response result field
4. WHEN formatting an error, THE function SHALL set jsonrpc to '2.0', id to the Request_ID, and error to an object with code and message fields
5. THE function SHALL ensure responses never contain both result and error fields simultaneously

### Requirement 3: Error Handling and Serialization

**User Story:** As a wallet user, I want errors to be properly communicated to dapps, so that I understand what went wrong and can take corrective action.

#### Acceptance Criteria

1. WHEN handleProviderRequests throws an error, handleActions SHALL catch it and send the raw error to React Native
2. WHEN respondToWalletConnectRequest receives an error, THE function SHALL serialize the error using its serialize() method if available
3. WHEN an error lacks a serialize() method, THE function SHALL create an error object with code, message, and optional data fields
4. WHEN an error lacks a code field, THE function SHALL use 5000 as the default error code
5. WHEN an error lacks a message field, THE function SHALL use error.toString() or 'Unknown error' as the default message

### Requirement 4: Session Management and Isolation

**User Story:** As a wallet developer, I want each WalletConnect connection to have an isolated session, so that requests from different dapps do not interfere with each other.

#### Acceptance Criteria

1. WHEN processing a WalletConnect request, handleActions SHALL use the Session_Topic from the topic parameter to identify the connection
2. WHEN creating a Dapp_Session, THE System SHALL use the proposer URL from the WalletConnect session metadata as the origin (existing behavior)
3. WHEN multiple requests are processed for different Session_Topics, THE System SHALL maintain separate Dapp_Sessions for each topic (existing behavior)
4. WHEN a WC_Bridge_Messenger is attached to a session, THE System SHALL ensure it does not affect other sessions (existing behavior)

### Requirement 5: Action Dispatching and Event Routing

**User Story:** As a wallet developer, I want WalletConnect requests to be routed through the existing action handling system, so that they use the same communication logic as webview requests.

#### Acceptance Criteria

1. WHEN the walletConnectService receives a session_request event, THE System SHALL dispatch a HANDLE_PROVIDER_REQUEST action (existing action type)
2. WHEN the HANDLE_PROVIDER_REQUEST action is dispatched for WalletConnect, THE System SHALL include the topic parameter to identify it as a WalletConnect request
3. WHEN handleActions completes processing, THE System SHALL send the raw response via sendToReactEvent with type 'action.respondToWalletConnectRequest'
4. WHEN sending the response event, THE System SHALL include the Session_Topic, raw result/error, and Request_ID in the payload
5. THE System SHALL maintain the existing HANDLE_PROVIDER_REQUEST action behavior for in-app webview requests without modification

### Requirement 6: Response Completeness and Validity

**User Story:** As a dapp developer, I want every request to receive a complete response, so that my dapp never hangs waiting for a reply.

#### Acceptance Criteria

1. WHEN a WalletConnect request is processed, THE System SHALL always send a response via respondToWalletConnectRequest to the WalletConnect SDK
2. WHEN a response is sent to WalletConnect SDK, THE System SHALL ensure it contains either a result field or an error field
3. WHEN a response contains a result field, THE System SHALL ensure the error field is undefined or not present
4. WHEN a response contains an error field, THE System SHALL ensure the result field is undefined or not present
5. WHEN a response is created, THE System SHALL ensure the id field matches the original Request_ID

### Requirement 7: Backward Compatibility and Communication Logic Preservation

**User Story:** As a wallet developer, I want the existing communication logic to remain unchanged, so that both webview and WalletConnect requests use the same proven code path.

#### Acceptance Criteria

1. WHEN an in-app webview sends a provider request, THE System SHALL continue to use the HANDLE_PROVIDER_REQUEST action
2. WHEN processing HANDLE_PROVIDER_REQUEST actions for webview, THE System SHALL send responses through the webview message bridge as before
3. THE System SHALL NOT modify the handleProviderRequests function signature or behavior
4. THE System SHALL NOT modify the rpcFlow function or ProviderController
5. WHEN WalletConnect requests are processed, THE System SHALL use the same handleProviderRequests, rpcFlow, and ProviderController logic as webview requests

### Requirement 8: Messenger Configuration

**User Story:** As a wallet developer, I want WalletConnect sessions to have the correct messenger type, so that broadcast events (disconnect, chainChanged) are routed properly.

#### Acceptance Criteria

1. WHEN a WalletConnect request is processed, handleActions SHALL create a WC_Bridge_Messenger for the session (existing behavior)
2. WHEN creating a WC_Bridge_Messenger, THE System SHALL include the Session_Topic and chain ID (existing behavior)
3. WHEN attaching a messenger to a session, THE System SHALL call setSessionMessenger with the session ID, messenger, and available flag set to false (existing behavior)
4. WHEN a WC_Bridge_Messenger is attached, THE System SHALL ensure the messenger name is 'wcBridgeMessenger' (existing behavior)
5. WHEN broadcast events occur, THE System SHALL route them through the WC_Bridge_Messenger to the WalletConnect SDK (existing behavior)

### Requirement 9: No Blocking Checks for WalletConnect

**User Story:** As a wallet developer, I want WalletConnect requests to flow through the existing communication logic without being blocked, so that they are processed correctly.

#### Acceptance Criteria

1. WHEN a WalletConnect request is processed through handleProviderRequests, THE System SHALL NOT block the request based on webview-specific checks
2. WHEN investigating the existing communication logic, THE System SHALL identify any checks that might block WalletConnect requests
3. WHEN such checks are found, THE System SHALL ensure WalletConnect requests are treated equivalently to webview requests
4. THE System SHALL maintain all existing security and permission checks for both webview and WalletConnect requests
5. WHEN processing WalletConnect requests, THE System SHALL use the same validation and authorization logic as webview requests

### Requirement 10: Performance and Resource Management

**User Story:** As a wallet user, I want WalletConnect requests to be processed efficiently, so that my wallet remains responsive.

#### Acceptance Criteria

1. WHEN processing multiple requests for the same Session_Topic, THE System SHALL reuse the existing Dapp_Session instead of creating new ones (existing behavior)
2. WHEN formatting responses in respondToWalletConnectRequest, THE System SHALL use simple object creation without complex transformations
3. WHEN serializing errors, THE System SHALL only invoke the serialize() method when the error object has one
4. THE System SHALL process all WalletConnect requests asynchronously to avoid blocking the main thread (existing behavior)
5. WHEN response formatting is added, THE System SHALL ensure it has minimal performance overhead
