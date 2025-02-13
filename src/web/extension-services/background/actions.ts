import { HD_PATH_TEMPLATE_TYPE } from '@ambire-common/consts/derivation'
import {
  AccountOpAction,
  ActionExecutionType,
  Action as ActionFromActionsQueue
} from '@ambire-common/controllers/actions/actions'
import { Filters, Pagination } from '@ambire-common/controllers/activity/activity'
import { Contact } from '@ambire-common/controllers/addressBook/addressBook'
import { FeeSpeed, SigningStatus } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { Account, AccountPreferences, AccountStates } from '@ambire-common/interfaces/account'
import { Dapp } from '@ambire-common/interfaces/dapp'
import { MagicLinkFlow } from '@ambire-common/interfaces/emailVault'
import { Key, KeyPreferences, ReadyToAddKeys } from '@ambire-common/interfaces/keystore'
import { AddNetworkRequestParams, Network, NetworkId } from '@ambire-common/interfaces/network'
import { SocketAPIRoute, SocketAPIToken } from '@ambire-common/interfaces/swapAndBridge'
import { Message, UserRequest } from '@ambire-common/interfaces/userRequest'
import { AccountOp } from '@ambire-common/libs/accountOp/accountOp'
import { EstimateResult } from '@ambire-common/libs/estimate/interfaces'
import { GasRecommendation } from '@ambire-common/libs/gasPrice/gasPrice'
import { TokenResult } from '@ambire-common/libs/portfolio'
import { CustomToken, TokenPreference } from '@ambire-common/libs/portfolio/customToken'

import { AUTO_LOCK_TIMES } from './controllers/auto-lock'
import { controllersMapping } from './types'

type UpdateNavigationUrl = {
  type: 'UPDATE_PORT_URL'
  params: { url: string }
}

type InitControllerStateAction = {
  type: 'INIT_CONTROLLER_STATE'
  params: {
    controller: keyof typeof controllersMapping
  }
}

type MainControllerAccountAdderInitLedgerAction = {
  type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_LEDGER'
}
type MainControllerAccountAdderInitTrezorAction = {
  type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_TREZOR'
}
type MainControllerAccountAdderInitLatticeAction = {
  type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_LATTICE'
}
type MainControllerAccountAdderInitPrivateKeyOrSeedPhraseAction = {
  type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_PRIVATE_KEY_OR_SEED_PHRASE'
  params: {
    privKeyOrSeed: string
    shouldPersist?: boolean
    shouldAddToTemp?: boolean
    seedPassphrase?: string | null
  }
}
type MainControllerAccountAdderInitFromSavedSeedPhraseAction = {
  type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_FROM_SAVED_SEED_PHRASE'
}
type MainControllerSelectAccountAction = {
  type: 'MAIN_CONTROLLER_SELECT_ACCOUNT'
  params: {
    accountAddr: Account['addr']
  }
}
type MainControllerAccountAdderSelectAccountAction = {
  type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_SELECT_ACCOUNT'
  params: {
    account: Account
  }
}
type MainControllerAccountAdderDeselectAccountAction = {
  type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_DESELECT_ACCOUNT'
  params: {
    account: Account
  }
}

type MainControllerAccountAdderSetPageAction = {
  type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_SET_PAGE'
  params: {
    page: number
  }
}
type MainControllerAccountAdderSetHdPathTemplateAction = {
  type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_SET_HD_PATH_TEMPLATE'
  params: { hdPathTemplate: HD_PATH_TEMPLATE_TYPE }
}
type MainControllerAccountAdderAddAccounts = {
  type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_ADD_ACCOUNTS'
}
type MainControllerAddAccounts = {
  type: 'MAIN_CONTROLLER_ADD_VIEW_ONLY_ACCOUNTS'
  params: {
    accounts: (Account & {
      domainName: string | null
    })[]
  }
}
type CreateNewSeedPhraseAndAddFirstSmartAccount = {
  type: 'CREATE_NEW_SEED_PHRASE_AND_ADD_FIRST_SMART_ACCOUNT'
  params: { seed: string }
}
type AddNextSmartAccountFromSavedSeedPhraseAction = {
  type: 'ADD_NEXT_SMART_ACCOUNT_FROM_DEFAULT_SEED_PHRASE'
}
type MainControllerRemoveAccount = {
  type: 'MAIN_CONTROLLER_REMOVE_ACCOUNT'
  params: {
    accountAddr: Account['addr']
  }
}
type MainControllerAccountAdderResetIfNeeded = {
  type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_RESET_IF_NEEDED'
}
type MainControllerAddNetwork = {
  type: 'MAIN_CONTROLLER_ADD_NETWORK'
  params: AddNetworkRequestParams
}

type MainControllerRemoveNetwork = {
  type: 'MAIN_CONTROLLER_REMOVE_NETWORK'
  params: NetworkId
}

type AccountsControllerUpdateAccountPreferences = {
  type: 'ACCOUNTS_CONTROLLER_UPDATE_ACCOUNT_PREFERENCES'
  params: { addr: string; preferences: AccountPreferences }[]
}

type SettingsControllerSetNetworkToAddOrUpdate = {
  type: 'SETTINGS_CONTROLLER_SET_NETWORK_TO_ADD_OR_UPDATE'
  params: {
    chainId: Network['chainId']
    rpcUrl: string
    force4337?: boolean
  }
}

type SettingsControllerResetNetworkToAddOrUpdate = {
  type: 'SETTINGS_CONTROLLER_RESET_NETWORK_TO_ADD_OR_UPDATE'
}

type KeystoreControllerUpdateKeyPreferencesAction = {
  type: 'KEYSTORE_CONTROLLER_UPDATE_KEY_PREFERENCES'
  params: {
    addr: Key['addr']
    type: Key['type']
    preferences: KeyPreferences
  }[]
}

type MainControllerUpdateNetworkAction = {
  type: 'MAIN_CONTROLLER_UPDATE_NETWORK'
  params: {
    network: Partial<Network>
    networkId: NetworkId
  }
}

type MainControllerAddUserRequestAction = {
  type: 'MAIN_CONTROLLER_ADD_USER_REQUEST'
  params: UserRequest
}
type MainControllerBuildTransferUserRequest = {
  type: 'MAIN_CONTROLLER_BUILD_TRANSFER_USER_REQUEST'
  params: {
    amount: string
    selectedToken: TokenResult
    recipientAddress: string
    actionExecutionType: ActionExecutionType
  }
}
type MainControllerBuildClaimWalletUserRequest = {
  type: 'MAIN_CONTROLLER_BUILD_CLAIM_WALLET_USER_REQUEST'
  params: { token: TokenResult }
}
type MainControllerBuildMintVestingUserRequest = {
  type: 'MAIN_CONTROLLER_BUILD_MINT_VESTING_USER_REQUEST'
  params: {
    token: TokenResult
  }
}
type MainControllerRemoveUserRequestAction = {
  type: 'MAIN_CONTROLLER_REMOVE_USER_REQUEST'
  params: { id: UserRequest['id'] }
}
type MainControllerResolveUserRequestAction = {
  type: 'MAIN_CONTROLLER_RESOLVE_USER_REQUEST'
  params: { data: any; id: UserRequest['id'] }
}
type MainControllerRejectUserRequestAction = {
  type: 'MAIN_CONTROLLER_REJECT_USER_REQUEST'
  params: { err: string; id: UserRequest['id']; opts?: { shouldDisable7702Asking?: boolean } }
}
type MainControllerRejectSignAccountOpCall = {
  type: 'MAIN_CONTROLLER_REJECT_SIGN_ACCOUNT_OP_CALL'
  params: { callId: string }
}
type MainControllerResolveAccountOpAction = {
  type: 'MAIN_CONTROLLER_RESOLVE_ACCOUNT_OP'
  params: { data: any; actionId: AccountOpAction['id'] }
}
type MainControllerResolveSwitchAccountRequest = {
  type: 'MAIN_CONTROLLER_RESOLVE_SWITCH_ACCOUNT_REQUEST'
  params: { actionId: AccountOpAction['id'] }
}
type MainControllerRejectAccountOpAction = {
  type: 'MAIN_CONTROLLER_REJECT_ACCOUNT_OP'
  params: { err: string; actionId: AccountOpAction['id']; shouldOpenNextAction: boolean }
}
type MainControllerSignMessageInitAction = {
  type: 'MAIN_CONTROLLER_SIGN_MESSAGE_INIT'
  params: {
    dapp: {
      name: string
      icon: string
    }
    messageToSign: Message
  }
}
type MainControllerSignMessageResetAction = {
  type: 'MAIN_CONTROLLER_SIGN_MESSAGE_RESET'
}
type MainControllerHandleSignMessage = {
  type: 'MAIN_CONTROLLER_HANDLE_SIGN_MESSAGE'
  params: { keyAddr: Key['addr']; keyType: Key['type'] }
}
type MainControllerActivitySetAccOpsFiltersAction = {
  type: 'MAIN_CONTROLLER_ACTIVITY_SET_ACC_OPS_FILTERS'
  params: { filters: Filters; pagination?: Pagination; sessionId: string }
}
type MainControllerActivitySetSignedMessagesFiltersAction = {
  type: 'MAIN_CONTROLLER_ACTIVITY_SET_SIGNED_MESSAGES_FILTERS'
  params: { filters: Filters; pagination?: Pagination; sessionId: string }
}
type MainControllerActivityResetAccOpsAction = {
  type: 'MAIN_CONTROLLER_ACTIVITY_RESET_ACC_OPS_FILTERS'
  params: { sessionId: string }
}
type MainControllerActivityResetSignedMessagesAction = {
  type: 'MAIN_CONTROLLER_ACTIVITY_RESET_SIGNED_MESSAGES_FILTERS'
  params: { sessionId: string }
}
type MainControllerActivityHideBanner = {
  type: 'ACTIVITY_CONTROLLER_HIDE_BANNER'
  params: { addr: string; network: string; timestamp: number }
}

type MainControllerReloadSelectedAccount = {
  type: 'MAIN_CONTROLLER_RELOAD_SELECTED_ACCOUNT'
  params?: {
    networkId?: Network['id']
  }
}

type MainControllerUpdateSelectedAccountPortfolio = {
  type: 'MAIN_CONTROLLER_UPDATE_SELECTED_ACCOUNT_PORTFOLIO'
  params?: {
    forceUpdate?: boolean
    network?: Network
  }
}

type SelectedAccountSetDashboardNetworkFilter = {
  type: 'SELECTED_ACCOUNT_SET_DASHBOARD_NETWORK_FILTER'
  params: { dashboardNetworkFilter: NetworkId | null }
}

type PortfolioControllerGetTemporaryToken = {
  type: 'PORTFOLIO_CONTROLLER_GET_TEMPORARY_TOKENS'
  params: {
    additionalHint: TokenResult['address']
    networkId: NetworkId
  }
}

type PortfolioControllerAddCustomToken = {
  type: 'PORTFOLIO_CONTROLLER_ADD_CUSTOM_TOKEN'
  params: {
    token: CustomToken
    shouldUpdatePortfolio?: boolean
  }
}

type PortfolioControllerRemoveCustomToken = {
  type: 'PORTFOLIO_CONTROLLER_REMOVE_CUSTOM_TOKEN'
  params: {
    token: Omit<CustomToken, 'standard'>
    shouldUpdatePortfolio?: boolean
  }
}

type PortfolioControllerToggleHideToken = {
  type: 'PORTFOLIO_CONTROLLER_TOGGLE_HIDE_TOKEN'
  params: {
    token: Omit<TokenPreference, 'isHidden'>
    shouldUpdatePortfolio?: boolean
  }
}

type PortfolioControllerCheckToken = {
  type: 'PORTFOLIO_CONTROLLER_CHECK_TOKEN'
  params: {
    token: { address: TokenResult['address']; networkId: NetworkId }
  }
}

type PortfolioControllerUpdateConfettiToShown = {
  type: 'PORTFOLIO_CONTROLLER_UPDATE_CASHBACK_STATUS_BY_ACCOUNT'
  params: {
    accountAddr: Account['addr']
  }
}

type MainControllerSignAccountOpInitAction = {
  type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_INIT'
  params: {
    actionId: AccountOpAction['id']
  }
}
type MainControllerSignAccountOpDestroyAction = {
  type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_DESTROY'
}
type MainControllerSignAccountOpUpdateMainDepsAction = {
  type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE_MAIN_DEPS'
  params: {
    accounts?: Account[]
    networks?: Network[]
    accountStates?: AccountStates
  }
}
type MainControllerSignAccountOpUpdateAction = {
  type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE'
  params: {
    accountOp?: AccountOp
    gasPrices?: GasRecommendation[]
    estimation?: EstimateResult
    feeToken?: TokenResult
    paidBy?: string
    speed?: FeeSpeed
    signingKeyAddr?: string
    signingKeyType?: string
    gasUsedTooHighAgreed?: boolean
  }
}
type MainControllerSignAccountOpUpdateStatus = {
  type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE_STATUS'
  params: {
    status: SigningStatus
  }
}
type MainControllerHandleSignAndBroadcastAccountOp = {
  type: 'MAIN_CONTROLLER_HANDLE_SIGN_AND_BROADCAST_ACCOUNT_OP'
}

type MainControllerOnPopupOpenAction = {
  type: 'MAIN_CONTROLLER_ON_POPUP_OPEN'
}

type MainControllerLockAction = {
  type: 'MAIN_CONTROLLER_LOCK'
}

type KeystoreControllerAddSecretAction = {
  type: 'KEYSTORE_CONTROLLER_ADD_SECRET'
  params: { secretId: string; secret: string; extraEntropy: string; leaveUnlocked: boolean }
}
type KeystoreControllerUnlockWithSecretAction = {
  type: 'KEYSTORE_CONTROLLER_UNLOCK_WITH_SECRET'
  params: { secretId: string; secret: string }
}
type KeystoreControllerResetErrorStateAction = {
  type: 'KEYSTORE_CONTROLLER_RESET_ERROR_STATE'
}
type KeystoreControllerChangePasswordAction = {
  type: 'KEYSTORE_CONTROLLER_CHANGE_PASSWORD'
  params: { secret: string; newSecret: string }
}
type KeystoreControllerChangePasswordFromRecoveryAction = {
  type: 'KEYSTORE_CONTROLLER_CHANGE_PASSWORD_FROM_RECOVERY'
  params: { newSecret: string }
}
type KeystoreControllerSendPrivateKeyOverChannel = {
  type: 'KEYSTORE_CONTROLLER_SEND_PRIVATE_KEY_OVER_CHANNEL'
  params: { keyAddr: string }
}
type KeystoreControllerDeleteSavedSeed = {
  type: 'KEYSTORE_CONTROLLER_DELETE_SAVED_SEED'
}
type KeystoreControllerMoveSeedFromTemp = {
  type: 'KEYSTORE_CONTROLLER_MOVE_SEED_FROM_TEMP'
  params: { action: 'save' | 'delete' }
}
type KeystoreControllerSendSeedOverChannel = {
  type: 'KEYSTORE_CONTROLLER_SEND_SEED_OVER_CHANNEL'
}

type EmailVaultControllerGetInfoAction = {
  type: 'EMAIL_VAULT_CONTROLLER_GET_INFO'
  params: { email: string }
}
type EmailVaultControllerUploadKeystoreSecretAction = {
  type: 'EMAIL_VAULT_CONTROLLER_UPLOAD_KEYSTORE_SECRET'
  params: { email: string }
}
type EmailVaultControllerCancelConfirmationAction = {
  type: 'EMAIL_VAULT_CONTROLLER_CANCEL_CONFIRMATION'
}
type EmailVaultControllerHandleMagicLinkKeyAction = {
  type: 'EMAIL_VAULT_CONTROLLER_HANDLE_MAGIC_LINK_KEY'
  params: { email: string; flow: MagicLinkFlow }
}
type EmailVaultControllerRecoverKeystoreAction = {
  type: 'EMAIL_VAULT_CONTROLLER_RECOVER_KEYSTORE'
  params: { email: string; newPass: string }
}
type EmailVaultControllerCleanMagicAndSessionKeysAction = {
  type: 'EMAIL_VAULT_CONTROLLER_CLEAN_MAGIC_AND_SESSION_KEYS'
}
type EmailVaultControllerRequestKeysSyncAction = {
  type: 'EMAIL_VAULT_CONTROLLER_REQUEST_KEYS_SYNC'
  params: { email: string; keys: string[] }
}

type EmailVaultControllerDismissBannerAction = {
  type: 'EMAIL_VAULT_CONTROLLER_DISMISS_BANNER'
}

type DomainsControllerReverseLookupAction = {
  type: 'DOMAINS_CONTROLLER_REVERSE_LOOKUP'
  params: { address: string }
}

type DomainsControllerSaveResolvedReverseLookupAction = {
  type: 'DOMAINS_CONTROLLER_SAVE_RESOLVED_REVERSE_LOOKUP'
  params: {
    address: string
    name: string
    type: 'ens' | 'ud'
  }
}

type DappsControllerRemoveConnectedSiteAction = {
  type: 'DAPPS_CONTROLLER_DISCONNECT_DAPP'
  params: Dapp['url']
}
type DappsControllerAddDappAction = {
  type: 'DAPP_CONTROLLER_ADD_DAPP'
  params: Dapp
}
type DappsControllerUpdateDappAction = {
  type: 'DAPP_CONTROLLER_UPDATE_DAPP'
  params: { url: string; dapp: Partial<Dapp> }
}
type DappsControllerRemoveDappAction = {
  type: 'DAPP_CONTROLLER_REMOVE_DAPP'
  params: Dapp['url']
}

type SwapAndBridgeControllerInitAction = {
  type: 'SWAP_AND_BRIDGE_CONTROLLER_INIT_FORM'
  params: { sessionId: string }
}
type SwapAndBridgeControllerUnloadScreenAction = {
  type: 'SWAP_AND_BRIDGE_CONTROLLER_UNLOAD_SCREEN'
  params: { sessionId: string }
}
type SwapAndBridgeControllerUpdateFormAction = {
  type: 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_FORM'
  params: {
    fromAmount?: string
    fromAmountInFiat?: string
    fromAmountFieldMode?: 'fiat' | 'token'
    fromChainId?: bigint | number
    fromSelectedToken?: TokenResult | null
    toChainId?: bigint | number
    toSelectedToken?: SocketAPIToken | null
    routePriority?: 'output' | 'time'
  }
}
type SwapAndBridgeControllerAddToTokenByAddress = {
  type: 'SWAP_AND_BRIDGE_CONTROLLER_ADD_TO_TOKEN_BY_ADDRESS'
  params: { address: string }
}
type SwapAndBridgeControllerSwitchFromAndToTokensAction = {
  type: 'SWAP_AND_BRIDGE_CONTROLLER_SWITCH_FROM_AND_TO_TOKENS'
}
type SwapAndBridgeControllerSelectRouteAction = {
  type: 'SWAP_AND_BRIDGE_CONTROLLER_SELECT_ROUTE'
  params: { route: SocketAPIRoute }
}
type SwapAndBridgeControllerSubmitFormAction = {
  type: 'SWAP_AND_BRIDGE_CONTROLLER_SUBMIT_FORM'
}
type SwapAndBridgeControllerActiveRouteBuildNextUserRequestAction = {
  type: 'SWAP_AND_BRIDGE_CONTROLLER_ACTIVE_ROUTE_BUILD_NEXT_USER_REQUEST'
  params: { activeRouteId: number }
}
type SwapAndBridgeControllerUpdateQuoteAction = {
  type: 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_QUOTE'
}
type SwapAndBridgeControllerRemoveActiveRouteAction = {
  type: 'MAIN_CONTROLLER_REMOVE_ACTIVE_ROUTE'
  params: { activeRouteId: number }
}

type ActionsControllerRemoveFromActionsQueue = {
  type: 'ACTIONS_CONTROLLER_REMOVE_FROM_ACTIONS_QUEUE'
  params: { id: ActionFromActionsQueue['id']; shouldOpenNextAction: boolean }
}
type ActionsControllerFocusActionWindow = {
  type: 'ACTIONS_CONTROLLER_FOCUS_ACTION_WINDOW'
}
type ActionsControllerCloseActionWindow = {
  type: 'ACTIONS_CONTROLLER_CLOSE_ACTION_WINDOW'
}

type ActionsControllerMakeAllActionsActive = {
  type: 'ACTIONS_CONTROLLER_MAKE_ALL_ACTIONS_ACTIVE'
}

type ActionsControllerSetCurrentActionById = {
  type: 'ACTIONS_CONTROLLER_SET_CURRENT_ACTION_BY_ID'
  params: {
    actionId: ActionFromActionsQueue['id']
  }
}

type ActionsControllerSetCurrentActionByIndex = {
  type: 'ACTIONS_CONTROLLER_SET_CURRENT_ACTION_BY_INDEX'
  params: {
    index: number
  }
}

type ActionsControllerSetWindowLoaded = {
  type: 'ACTIONS_CONTROLLER_SET_WINDOW_LOADED'
}

type AddressBookControllerAddContact = {
  type: 'ADDRESS_BOOK_CONTROLLER_ADD_CONTACT'
  params: {
    address: Contact['address']
    name: Contact['name']
  }
}
type AddressBookControllerRenameContact = {
  type: 'ADDRESS_BOOK_CONTROLLER_RENAME_CONTACT'
  params: {
    address: Contact['address']
    newName: Contact['name']
  }
}
type AddressBookControllerRemoveContact = {
  type: 'ADDRESS_BOOK_CONTROLLER_REMOVE_CONTACT'
  params: {
    address: Contact['address']
  }
}

type ChangeCurrentDappNetworkAction = {
  type: 'CHANGE_CURRENT_DAPP_NETWORK'
  params: { chainId: number; origin: string }
}

type SetIsDefaultWalletAction = {
  type: 'SET_IS_DEFAULT_WALLET'
  params: { isDefaultWallet: boolean }
}
type SetOnboardingStateAction = {
  type: 'SET_ONBOARDING_STATE'
  params: { version: string; viewedAt: number }
}
type SetIsPinnedAction = {
  type: 'SET_IS_PINNED'
  params: { isPinned: boolean }
}
type SetIsSetupCompleteAction = {
  type: 'SET_IS_SETUP_COMPLETE'
  params: { isSetupComplete: boolean }
}

type AutoLockControllerSetLastActiveTimeAction = {
  type: 'AUTO_LOCK_CONTROLLER_SET_LAST_ACTIVE_TIME'
}
type AutoLockControllerSetAutoLockTimeAction = {
  type: 'AUTO_LOCK_CONTROLLER_SET_AUTO_LOCK_TIME'
  params: AUTO_LOCK_TIMES
}

type InviteControllerVerifyAction = {
  type: 'INVITE_CONTROLLER_VERIFY'
  params: { code: string }
}
type InviteControllerBecomeOGAction = { type: 'INVITE_CONTROLLER_BECOME_OG' }
type InviteControllerRevokeOGAction = { type: 'INVITE_CONTROLLER_REVOKE_OG' }

type MainControllerTraceCallAction = {
  type: 'MAIN_CONTROLLER_TRACE_CALL'
  params: { estimation: EstimateResult }
}

type ImportSmartAccountJson = {
  type: 'IMPORT_SMART_ACCOUNT_JSON'
  params: { readyToAddAccount: Account; keys: ReadyToAddKeys['internal'] }
}

type ExtensionUpdateControllerApplyUpdate = {
  type: 'EXTENSION_UPDATE_CONTROLLER_APPLY_UPDATE'
}

type AccountDisable7702Banner = {
  type: 'ACCOUNT_DISABLE_7702_BANNER'
  params: { accountAddr: string }
}

export type Action =
  | UpdateNavigationUrl
  | InitControllerStateAction
  | MainControllerAccountAdderInitLatticeAction
  | MainControllerAccountAdderInitTrezorAction
  | MainControllerAccountAdderInitLedgerAction
  | MainControllerAccountAdderInitPrivateKeyOrSeedPhraseAction
  | MainControllerAccountAdderInitFromSavedSeedPhraseAction
  | MainControllerSelectAccountAction
  | MainControllerAccountAdderSelectAccountAction
  | MainControllerAccountAdderDeselectAccountAction
  | MainControllerAccountAdderResetIfNeeded
  | AccountsControllerUpdateAccountPreferences
  | SettingsControllerSetNetworkToAddOrUpdate
  | SettingsControllerResetNetworkToAddOrUpdate
  | MainControllerAddNetwork
  | MainControllerRemoveNetwork
  | KeystoreControllerUpdateKeyPreferencesAction
  | MainControllerUpdateNetworkAction
  | MainControllerAccountAdderSetPageAction
  | MainControllerAccountAdderSetHdPathTemplateAction
  | MainControllerAccountAdderAddAccounts
  | MainControllerAddAccounts
  | CreateNewSeedPhraseAndAddFirstSmartAccount
  | AddNextSmartAccountFromSavedSeedPhraseAction
  | MainControllerRemoveAccount
  | MainControllerAddUserRequestAction
  | MainControllerLockAction
  | MainControllerOnPopupOpenAction
  | MainControllerBuildTransferUserRequest
  | MainControllerBuildClaimWalletUserRequest
  | MainControllerBuildMintVestingUserRequest
  | MainControllerRemoveUserRequestAction
  | MainControllerResolveUserRequestAction
  | MainControllerRejectUserRequestAction
  | MainControllerRejectSignAccountOpCall
  | MainControllerResolveAccountOpAction
  | MainControllerRejectAccountOpAction
  | MainControllerResolveSwitchAccountRequest
  | MainControllerSignMessageInitAction
  | MainControllerSignMessageResetAction
  | MainControllerHandleSignMessage
  | MainControllerActivitySetAccOpsFiltersAction
  | MainControllerActivitySetSignedMessagesFiltersAction
  | MainControllerActivityResetAccOpsAction
  | MainControllerActivityResetSignedMessagesAction
  | MainControllerSignAccountOpInitAction
  | MainControllerSignAccountOpDestroyAction
  | MainControllerSignAccountOpUpdateMainDepsAction
  | MainControllerHandleSignAndBroadcastAccountOp
  | MainControllerSignAccountOpUpdateAction
  | MainControllerSignAccountOpUpdateStatus
  | MainControllerReloadSelectedAccount
  | MainControllerUpdateSelectedAccountPortfolio
  | SelectedAccountSetDashboardNetworkFilter
  | PortfolioControllerAddCustomToken
  | PortfolioControllerGetTemporaryToken
  | PortfolioControllerToggleHideToken
  | PortfolioControllerRemoveCustomToken
  | PortfolioControllerCheckToken
  | PortfolioControllerUpdateConfettiToShown
  | KeystoreControllerAddSecretAction
  | KeystoreControllerUnlockWithSecretAction
  | KeystoreControllerResetErrorStateAction
  | KeystoreControllerChangePasswordAction
  | KeystoreControllerChangePasswordFromRecoveryAction
  | KeystoreControllerSendPrivateKeyOverChannel
  | EmailVaultControllerGetInfoAction
  | EmailVaultControllerUploadKeystoreSecretAction
  | EmailVaultControllerCancelConfirmationAction
  | EmailVaultControllerHandleMagicLinkKeyAction
  | EmailVaultControllerRecoverKeystoreAction
  | EmailVaultControllerCleanMagicAndSessionKeysAction
  | EmailVaultControllerRequestKeysSyncAction
  | EmailVaultControllerDismissBannerAction
  | DomainsControllerReverseLookupAction
  | DomainsControllerSaveResolvedReverseLookupAction
  | DappsControllerRemoveConnectedSiteAction
  | DappsControllerAddDappAction
  | DappsControllerUpdateDappAction
  | DappsControllerRemoveDappAction
  | SwapAndBridgeControllerInitAction
  | SwapAndBridgeControllerUnloadScreenAction
  | SwapAndBridgeControllerUpdateFormAction
  | SwapAndBridgeControllerAddToTokenByAddress
  | SwapAndBridgeControllerSwitchFromAndToTokensAction
  | SwapAndBridgeControllerSelectRouteAction
  | SwapAndBridgeControllerSubmitFormAction
  | SwapAndBridgeControllerActiveRouteBuildNextUserRequestAction
  | SwapAndBridgeControllerUpdateQuoteAction
  | SwapAndBridgeControllerRemoveActiveRouteAction
  | ActionsControllerRemoveFromActionsQueue
  | ActionsControllerFocusActionWindow
  | ActionsControllerCloseActionWindow
  | ActionsControllerMakeAllActionsActive
  | ActionsControllerSetCurrentActionById
  | ActionsControllerSetCurrentActionByIndex
  | ActionsControllerSetWindowLoaded
  | AddressBookControllerAddContact
  | AddressBookControllerRenameContact
  | AddressBookControllerRemoveContact
  | ChangeCurrentDappNetworkAction
  | SetIsDefaultWalletAction
  | SetOnboardingStateAction
  | SetIsPinnedAction
  | SetIsSetupCompleteAction
  | AutoLockControllerSetLastActiveTimeAction
  | AutoLockControllerSetAutoLockTimeAction
  | InviteControllerVerifyAction
  | InviteControllerBecomeOGAction
  | InviteControllerRevokeOGAction
  | MainControllerTraceCallAction
  | ImportSmartAccountJson
  | KeystoreControllerSendSeedOverChannel
  | MainControllerActivityHideBanner
  | KeystoreControllerDeleteSavedSeed
  | KeystoreControllerMoveSeedFromTemp
  | ExtensionUpdateControllerApplyUpdate
  | AccountDisable7702Banner
