import { HD_PATH_TEMPLATE_TYPE } from '@ambire-common/consts/derivation'
import {
  AccountOpAction,
  Action as ActionFromActionsQueue
} from '@ambire-common/controllers/actions/actions'
import { Filters, Pagination } from '@ambire-common/controllers/activity/activity'
import { Contact } from '@ambire-common/controllers/addressBook/addressBook'
import { FeeSpeed, SigningStatus } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { Account, AccountPreferences, AccountStates } from '@ambire-common/interfaces/account'
import { Dapp } from '@ambire-common/interfaces/dapp'
import { Key, KeyPreferences } from '@ambire-common/interfaces/keystore'
import { AddNetworkRequestParams, Network, NetworkId } from '@ambire-common/interfaces/network'
import { SocketAPIToken } from '@ambire-common/interfaces/swapAndBridge'
import { Message, UserRequest } from '@ambire-common/interfaces/userRequest'
import { AccountOp } from '@ambire-common/libs/accountOp/accountOp'
import { EstimateResult } from '@ambire-common/libs/estimate/interfaces'
import { GasRecommendation } from '@ambire-common/libs/gasPrice/gasPrice'
import { TokenResult } from '@ambire-common/libs/portfolio'
import { CustomToken } from '@ambire-common/libs/portfolio/customToken'

import { AUTO_LOCK_TIMES } from './controllers/auto-lock'
import { controllersMapping } from './types'

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
  params: { privKeyOrSeed: string; shouldPersist?: boolean }
}
type MainControllerAccountAdderInitFromDefaultSeedPhraseAction = {
  type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_FROM_DEFAULT_SEED_PHRASE'
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
type AddNextSmartAccountFromDefaultSeedPhraseAction = {
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
    executionType: 'queue' | 'open'
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
  params: { err: string; id: UserRequest['id'] }
}
type MainControllerResolveAccountOpAction = {
  type: 'MAIN_CONTROLLER_RESOLVE_ACCOUNT_OP'
  params: { data: any; actionId: AccountOpAction['id'] }
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
type MainControllerActivityInitAction = {
  type: 'MAIN_CONTROLLER_ACTIVITY_INIT'
  params?: { filters?: Filters }
}
type MainControllerActivitySetFiltersAction = {
  type: 'MAIN_CONTROLLER_ACTIVITY_SET_FILTERS'
  params: { filters: Filters }
}
type MainControllerActivitySetAccountOpsPaginationAction = {
  type: 'MAIN_CONTROLLER_ACTIVITY_SET_ACCOUNT_OPS_PAGINATION'
  params: { pagination: Pagination }
}
type MainControllerActivitySetSignedMessagesPaginationAction = {
  type: 'MAIN_CONTROLLER_ACTIVITY_SET_SIGNED_MESSAGES_PAGINATION'
  params: { pagination: Pagination }
}
type MainControllerActivityResetAction = {
  type: 'MAIN_CONTROLLER_ACTIVITY_RESET'
}

type MainControllerReloadSelectedAccount = {
  type: 'MAIN_CONTROLLER_RELOAD_SELECTED_ACCOUNT'
}

type PortfolioControllerGetTemporaryToken = {
  type: 'PORTFOLIO_CONTROLLER_GET_TEMPORARY_TOKENS'
  params: {
    additionalHint: TokenResult['address']
    networkId: NetworkId
  }
}

type PortfolioControllerUpdateTokenPreferences = {
  type: 'PORTFOLIO_CONTROLLER_UPDATE_TOKEN_PREFERENCES'
  params: {
    token: CustomToken
  }
}
type PortfolioControllerRemoveTokenPreferences = {
  type: 'PORTFOLIO_CONTROLLER_REMOVE_TOKEN_PREFERENCES'
  params: {
    token: CustomToken | TokenResult
  }
}

type PortfolioControllerCheckToken = {
  type: 'PORTFOLIO_CONTROLLER_CHECK_TOKEN'
  params: {
    token: { address: TokenResult['address']; networkId: NetworkId }
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

type KeystoreControllerAddSecretAction = {
  type: 'KEYSTORE_CONTROLLER_ADD_SECRET'
  params: { secretId: string; secret: string; extraEntropy: string; leaveUnlocked: boolean }
}
type KeystoreControllerUnlockWithSecretAction = {
  type: 'KEYSTORE_CONTROLLER_UNLOCK_WITH_SECRET'
  params: { secretId: string; secret: string }
}
type KeystoreControllerLockAction = {
  type: 'KEYSTORE_CONTROLLER_LOCK'
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
  params: { email: string }
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
  type: 'SWAP_AND_BRIDGE_CONTROLLER_INIT'
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
  }
}
type SwapAndBridgeControllerSubmitFormAction = {
  type: 'SWAP_AND_BRIDGE_CONTROLLER_SUBMIT_FORM'
}
type SwapAndBridgeControllerUpdatePortfolioTokenListAction = {
  type: 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_PORTFOLIO_TOKEN_LIST'
  params: TokenResult[]
}

type ActionsControllerAddToActionsQueue = {
  type: 'ACTIONS_CONTROLLER_ADD_TO_ACTIONS_QUEUE'
  params: ActionFromActionsQueue
}
type ActionsControllerRemoveFromActionsQueue = {
  type: 'ACTIONS_CONTROLLER_REMOVE_FROM_ACTIONS_QUEUE'
  params: { id: ActionFromActionsQueue['id']; shouldOpenNextAction: boolean }
}
type ActionsControllerFocusActionWindow = {
  type: 'ACTIONS_CONTROLLER_FOCUS_ACTION_WINDOW'
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

type MainControllerTraceCallAction = {
  type: 'MAIN_CONTROLLER_TRACE_CALL'
  params: { estimation: EstimateResult }
}

export type Action =
  | InitControllerStateAction
  | MainControllerAccountAdderInitLatticeAction
  | MainControllerAccountAdderInitTrezorAction
  | MainControllerAccountAdderInitLedgerAction
  | MainControllerAccountAdderInitPrivateKeyOrSeedPhraseAction
  | MainControllerAccountAdderInitFromDefaultSeedPhraseAction
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
  | AddNextSmartAccountFromDefaultSeedPhraseAction
  | MainControllerRemoveAccount
  | MainControllerAddUserRequestAction
  | MainControllerBuildTransferUserRequest
  | MainControllerRemoveUserRequestAction
  | MainControllerResolveUserRequestAction
  | MainControllerRejectUserRequestAction
  | MainControllerResolveAccountOpAction
  | MainControllerRejectAccountOpAction
  | MainControllerSignMessageInitAction
  | MainControllerSignMessageResetAction
  | MainControllerHandleSignMessage
  | MainControllerActivityInitAction
  | MainControllerActivitySetFiltersAction
  | MainControllerActivitySetAccountOpsPaginationAction
  | MainControllerActivitySetSignedMessagesPaginationAction
  | MainControllerActivityResetAction
  | MainControllerSignAccountOpInitAction
  | MainControllerSignAccountOpDestroyAction
  | MainControllerSignAccountOpUpdateMainDepsAction
  | MainControllerHandleSignAndBroadcastAccountOp
  | MainControllerSignAccountOpUpdateAction
  | MainControllerSignAccountOpUpdateStatus
  | MainControllerReloadSelectedAccount
  | PortfolioControllerUpdateTokenPreferences
  | PortfolioControllerGetTemporaryToken
  | PortfolioControllerRemoveTokenPreferences
  | PortfolioControllerCheckToken
  | KeystoreControllerAddSecretAction
  | KeystoreControllerUnlockWithSecretAction
  | KeystoreControllerLockAction
  | KeystoreControllerResetErrorStateAction
  | KeystoreControllerChangePasswordAction
  | KeystoreControllerChangePasswordFromRecoveryAction
  | EmailVaultControllerGetInfoAction
  | EmailVaultControllerUploadKeystoreSecretAction
  | EmailVaultControllerCancelConfirmationAction
  | EmailVaultControllerHandleMagicLinkKeyAction
  | EmailVaultControllerRecoverKeystoreAction
  | EmailVaultControllerCleanMagicAndSessionKeysAction
  | EmailVaultControllerRequestKeysSyncAction
  | DomainsControllerReverseLookupAction
  | DomainsControllerSaveResolvedReverseLookupAction
  | DappsControllerRemoveConnectedSiteAction
  | DappsControllerAddDappAction
  | DappsControllerUpdateDappAction
  | DappsControllerRemoveDappAction
  | SwapAndBridgeControllerInitAction
  | SwapAndBridgeControllerUpdateFormAction
  | SwapAndBridgeControllerSubmitFormAction
  | SwapAndBridgeControllerUpdatePortfolioTokenListAction
  | ActionsControllerAddToActionsQueue
  | ActionsControllerRemoveFromActionsQueue
  | ActionsControllerFocusActionWindow
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
  | MainControllerTraceCallAction
