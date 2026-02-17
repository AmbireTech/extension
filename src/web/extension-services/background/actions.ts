import { HD_PATH_TEMPLATE_TYPE } from '@ambire-common/consts/derivation'
import { FeatureFlags } from '@ambire-common/consts/featureFlags'
import { Contact } from '@ambire-common/controllers/addressBook/addressBook'
import { Account } from '@ambire-common/interfaces/account'
import { Banner } from '@ambire-common/interfaces/banner'
import { Dapp } from '@ambire-common/interfaces/dapp'
import { MagicLinkFlow } from '@ambire-common/interfaces/emailVault'
import { Key, KeystoreSeed, ReadyToAddKeys } from '@ambire-common/interfaces/keystore'
import { Network } from '@ambire-common/interfaces/network'
import { SwapAndBridgeActiveRoute } from '@ambire-common/interfaces/swapAndBridge'
import { TransferUpdate } from '@ambire-common/interfaces/transfer'
import { OpenRequestWindowParams, UserRequest } from '@ambire-common/interfaces/userRequest'
import { TokenResult } from '@ambire-common/libs/portfolio'
import { CustomToken, TokenPreference } from '@ambire-common/libs/portfolio/customToken'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { LOG_LEVELS } from '@web/utils/logger'

import { AllControllersMappingType } from '../../../common/constants/controllersMapping'
import { AUTO_LOCK_TIMES } from './controllers/auto-lock'
import { AvatarType } from './controllers/wallet-state'

type UpdateNavigationUrl = {
  type: 'UPDATE_PORT_URL'
  params: { url: string; route?: string; searchParams?: { [key: string]: string } }
}

type InitControllerStateAction = {
  type: 'INIT_CONTROLLER_STATE'
  params: {
    controller: keyof AllControllersMappingType
  }
}

type HandshakeAction = {
  type: 'HANDSHAKE'
}

type MethodKeys<T> = {
  [K in keyof T]-?: T[K] extends (...args: any[]) => any ? K : never
}[keyof T]

type MethodActionParams = {
  [K in keyof AllControllersMappingType]: {
    ctrlName: K
  } & {
    [M in MethodKeys<AllControllersMappingType[K]>]: {
      method: M
      args: Parameters<Extract<AllControllersMappingType[K][M], (...args: any[]) => any>>
    }
  }[MethodKeys<AllControllersMappingType[K]>]
}[keyof AllControllersMappingType]

export type MethodAction = {
  type: 'method'
  params: MethodActionParams
}

type MainControllerAccountPickerInitLedgerAction = {
  type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LEDGER'
}
type MainControllerAccountPickerInitTrezorAction = {
  type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_TREZOR'
}
type MainControllerAccountPickerInitLatticeAction = {
  type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LATTICE'
}
type MainControllerAccountPickerInitPrivateKeyOrSeedPhraseAction = {
  type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_PRIVATE_KEY_OR_SEED_PHRASE'
  params: {
    privKeyOrSeed: string
    seedPassphrase?: string | null
    hdPathTemplate?: HD_PATH_TEMPLATE_TYPE
  }
}
type MainControllerAccountPickerInitFromSavedSeedPhraseAction = {
  type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_FROM_SAVED_SEED_PHRASE'
  params: { id: string }
}

type ResetAccountAddingOnPageErrorAction = {
  type: 'RESET_ACCOUNT_ADDING_ON_PAGE_ERROR'
}

type MainControllerHandleSignMessage = {
  type: 'MAIN_CONTROLLER_HANDLE_SIGN_MESSAGE'
  params: { keyAddr: Key['addr']; keyType: Key['type'] }
}

type MainControllerReloadSelectedAccount = {
  type: 'MAIN_CONTROLLER_RELOAD_SELECTED_ACCOUNT'
  params?: { chainId?: bigint | string }
}

type MainControllerUpdateSelectedAccountPortfolio = {
  type: 'MAIN_CONTROLLER_UPDATE_SELECTED_ACCOUNT_PORTFOLIO'
  params?: {
    networks?: Network[]
  }
}

type DefiControllerAddSessionAction = {
  type: 'DEFI_CONTOLLER_ADD_SESSION'
  params: { sessionId: string }
}

type DefiControllerRemoveSessionAction = {
  type: 'DEFI_CONTOLLER_REMOVE_SESSION'
  params: { sessionId: string }
}

type PortfolioControllerGetTemporaryToken = {
  type: 'PORTFOLIO_CONTROLLER_GET_TEMPORARY_TOKENS'
  params: {
    additionalHint: TokenResult['address']
    chainId: bigint
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
    token: { address: TokenResult['address']; chainId: bigint }
    allNetworks: boolean
  }
}

type KeystoreControllerAddSecretAction = {
  type: 'KEYSTORE_CONTROLLER_ADD_SECRET'
  params: { secretId: string; secret: string; extraEntropy: string; leaveUnlocked: boolean }
}
type KeystoreControllerAddTempSeedAction = {
  type: 'KEYSTORE_CONTROLLER_ADD_TEMP_SEED'
  params: Omit<KeystoreSeed, 'id' | 'label'>
}
type KeystoreControllerGenerateTempSeedAction = {
  type: 'KEYSTORE_CONTROLLER_GENERATE_TEMP_SEED'
  params: { extraEntropy?: string }
}
type KeystoreControllerUpdateSeedAction = {
  type: 'KEYSTORE_CONTROLLER_UPDATE_SEED'
  params: {
    id: KeystoreSeed['id']
    label?: KeystoreSeed['label']
    hdPathTemplate?: KeystoreSeed['hdPathTemplate']
  }
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
  params: { secret: string; newSecret: string; extraEntropy: string }
}
type KeystoreControllerChangePasswordFromRecoveryAction = {
  type: 'KEYSTORE_CONTROLLER_CHANGE_PASSWORD_FROM_RECOVERY'
  params: { newSecret: string; extraEntropy: string }
}
type KeystoreControllerSendPrivateKeyToUiAction = {
  type: 'KEYSTORE_CONTROLLER_SEND_PRIVATE_KEY_TO_UI'
  params: { keyAddr: string }
}
type KeystoreControllerSendEncryptedPrivateKeyToUiAction = {
  type: 'KEYSTORE_CONTROLLER_SEND_ENCRYPTED_PRIVATE_KEY_TO_UI'
  params: { keyAddr: string; secret: string; entropy: string }
}
type KeystoreControllerDeleteSeedAction = {
  type: 'KEYSTORE_CONTROLLER_DELETE_SEED'
  params: { id: string }
}
type KeystoreControllerSendSeedToUiAction = {
  type: 'KEYSTORE_CONTROLLER_SEND_SEED_TO_UI'
  params: { id: string }
}
type KeystoreControllerSendTempSeedToUiAction = {
  type: 'KEYSTORE_CONTROLLER_SEND_TEMP_SEED_TO_UI'
}
type KeystoreControllerSendDecryptedMessageToUiAction = {
  type: 'KEYSTORE_CONTROLLER_SEND_DECRYPTED_MESSAGE_TO_UI'
  params: {
    encryptedMessage: string
    keyAddr: Key['addr']
    keyType: Key['type']
  }
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

type DomainsControllerResolveDomainAction = {
  type: 'DOMAINS_CONTROLLER_RESOLVE_DOMAIN'
  params: { domain: string; bip44Item?: number[][] }
}

type DappsControllerFetchAndUpdateDappsAction = {
  type: 'DAPPS_CONTROLLER_FETCH_AND_UPDATE_DAPPS'
}
type DappsControllerRemoveConnectedSiteAction = {
  type: 'DAPPS_CONTROLLER_DISCONNECT_DAPP'
  params: {
    id: Dapp['id']
    url: Dapp['url']
  }
}
type DappsControllerUpdateDappAction = {
  type: 'DAPP_CONTROLLER_UPDATE_DAPP'
  params: { id: string; dapp: Partial<Dapp> }
}
type DappsControllerRemoveDappAction = {
  type: 'DAPP_CONTROLLER_REMOVE_DAPP'
  params: Dapp['id']
}
type DappsControllerGetCurrentDappAndSendResToUi = {
  type: 'DAPPS_CONTROLLER_GET_CURRENT_DAPP_AND_SEND_RES_TO_UI'
  params: {
    requestId: string
    dappId: string
    currentSessionId?: string
  }
}

type SwapAndBridgeControllerRemoveActiveRouteAction = {
  type: 'MAIN_CONTROLLER_REMOVE_ACTIVE_ROUTE'
  params: { activeRouteId: SwapAndBridgeActiveRoute['activeRouteId'] }
}

type TransferControllerUpdateForm = {
  type: 'TRANSFER_CONTROLLER_UPDATE_FORM'
  params: { formValues: TransferUpdate }
}
type TransferControllerResetForm = {
  type: 'TRANSFER_CONTROLLER_RESET_FORM'
}
type TransferControllerDestroyLatestBroadcastedAccountOp = {
  type: 'TRANSFER_CONTROLLER_DESTROY_LATEST_BROADCASTED_ACCOUNT_OP'
}
type TransferControllerUserProceededAction = {
  type: 'TRANSFER_CONTROLLER_HAS_USER_PROCEEDED'
  params: { proceeded: boolean }
}
type TransferControllerShouldSkipTransactionQueuedModal = {
  type: 'TRANSFER_CONTROLLER_SHOULD_SKIP_TRANSACTION_QUEUED_MODAL'
  params: { shouldSkip: boolean }
}

type RequestsControllerFocusRequestWindow = {
  type: 'REQUESTS_CONTROLLER_FOCUS_REQUEST_WINDOW'
}

type RequestsControllerSetCurrentRequestById = {
  type: 'REQUESTS_CONTROLLER_SET_CURRENT_REQUEST_BY_ID'
  params: {
    requestId: UserRequest['id']
  }
}

type RequestsControllerSetCurrentRequestByIndex = {
  type: 'REQUESTS_CONTROLLER_SET_CURRENT_REQUEST_BY_INDEX'
  params: {
    index: number
    params?: OpenRequestWindowParams
  }
}

type RequestsControllerSetWindowLoaded = {
  type: 'REQUESTS_CONTROLLER_SET_WINDOW_LOADED'
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
  params: { chainId: number; id: string }
}

type ContractNamesGetName = {
  type: 'CONTRACT_NAMES_CONTROLLER_GET_NAME'
  params: { address: string; chainId: bigint }
}

type SetAvatarTypeAction = {
  type: 'SET_AVATAR_TYPE'
  params: { avatarType: AvatarType }
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

type ImportSmartAccountJson = {
  type: 'IMPORT_SMART_ACCOUNT_JSON'
  params: { readyToAddAccount: Account; keys: ReadyToAddKeys['internal'] }
}

type ExtensionUpdateControllerApplyUpdate = {
  type: 'EXTENSION_UPDATE_CONTROLLER_APPLY_UPDATE'
}

type OpenExtensionPopupAction = {
  type: 'OPEN_EXTENSION_POPUP'
}

type SetThemeTypeAction = {
  type: 'SET_THEME_TYPE'
  params: { themeType: THEME_TYPES }
}
type SetLogLevelTypeAction = {
  type: 'SET_LOG_LEVEL'
  params: { logLevel: LOG_LEVELS }
}
type SetCrashAnalyticsAction = {
  type: 'SET_CRASH_ANALYTICS'
  params: { enabled: boolean }
}

type DismissBanner = {
  type: 'DISMISS_BANNER'
  params: {
    bannerId: Banner['id']
  }
}

type FlipFeature = {
  type: 'FEATURE_FLAGS_CONTROLLER_FLIP_FEATURE'
  params: {
    flag: keyof FeatureFlags
    isEnabled: boolean
  }
}

export type Action =
  | UpdateNavigationUrl
  | InitControllerStateAction
  | MethodAction
  | MainControllerAccountPickerInitLatticeAction
  | MainControllerAccountPickerInitTrezorAction
  | MainControllerAccountPickerInitLedgerAction
  | MainControllerAccountPickerInitPrivateKeyOrSeedPhraseAction
  | MainControllerAccountPickerInitFromSavedSeedPhraseAction
  | HandshakeAction
  | ResetAccountAddingOnPageErrorAction
  | MainControllerHandleSignMessage
  | MainControllerReloadSelectedAccount
  | MainControllerUpdateSelectedAccountPortfolio
  | DefiControllerAddSessionAction
  | DefiControllerRemoveSessionAction
  | PortfolioControllerAddCustomToken
  | PortfolioControllerGetTemporaryToken
  | PortfolioControllerToggleHideToken
  | PortfolioControllerRemoveCustomToken
  | PortfolioControllerCheckToken
  | KeystoreControllerAddSecretAction
  | KeystoreControllerAddTempSeedAction
  | KeystoreControllerGenerateTempSeedAction
  | KeystoreControllerUpdateSeedAction
  | KeystoreControllerUnlockWithSecretAction
  | KeystoreControllerResetErrorStateAction
  | KeystoreControllerChangePasswordAction
  | KeystoreControllerChangePasswordFromRecoveryAction
  | KeystoreControllerSendPrivateKeyToUiAction
  | KeystoreControllerSendDecryptedMessageToUiAction
  | EmailVaultControllerGetInfoAction
  | EmailVaultControllerUploadKeystoreSecretAction
  | EmailVaultControllerCancelConfirmationAction
  | EmailVaultControllerHandleMagicLinkKeyAction
  | EmailVaultControllerRecoverKeystoreAction
  | EmailVaultControllerCleanMagicAndSessionKeysAction
  | EmailVaultControllerRequestKeysSyncAction
  | EmailVaultControllerDismissBannerAction
  | DomainsControllerReverseLookupAction
  | DomainsControllerResolveDomainAction
  | DappsControllerFetchAndUpdateDappsAction
  | DappsControllerRemoveConnectedSiteAction
  | DappsControllerUpdateDappAction
  | ContractNamesGetName
  | DappsControllerRemoveDappAction
  | DappsControllerGetCurrentDappAndSendResToUi
  | SwapAndBridgeControllerRemoveActiveRouteAction
  | RequestsControllerFocusRequestWindow
  | RequestsControllerSetCurrentRequestById
  | RequestsControllerSetCurrentRequestByIndex
  | RequestsControllerSetWindowLoaded
  | AddressBookControllerAddContact
  | AddressBookControllerRenameContact
  | AddressBookControllerRemoveContact
  | ChangeCurrentDappNetworkAction
  | SetIsPinnedAction
  | SetIsSetupCompleteAction
  | AutoLockControllerSetLastActiveTimeAction
  | AutoLockControllerSetAutoLockTimeAction
  | InviteControllerVerifyAction
  | InviteControllerBecomeOGAction
  | InviteControllerRevokeOGAction
  | ImportSmartAccountJson
  | KeystoreControllerSendSeedToUiAction
  | KeystoreControllerSendTempSeedToUiAction
  | KeystoreControllerDeleteSeedAction
  | ExtensionUpdateControllerApplyUpdate
  | OpenExtensionPopupAction
  | TransferControllerUpdateForm
  | TransferControllerResetForm
  | TransferControllerDestroyLatestBroadcastedAccountOp
  | TransferControllerUserProceededAction
  | TransferControllerShouldSkipTransactionQueuedModal
  | SetThemeTypeAction
  | SetAvatarTypeAction
  | SetLogLevelTypeAction
  | SetCrashAnalyticsAction
  | DismissBanner
  | KeystoreControllerSendEncryptedPrivateKeyToUiAction
  | FlipFeature
