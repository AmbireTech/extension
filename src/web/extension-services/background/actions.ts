import { HD_PATH_TEMPLATE_TYPE } from '@ambire-common/consts/derivation'
import { FeatureFlags } from '@ambire-common/consts/featureFlags'
import { Contact } from '@ambire-common/controllers/addressBook/addressBook'
import { Account } from '@ambire-common/interfaces/account'
import { Banner } from '@ambire-common/interfaces/banner'
import { Dapp } from '@ambire-common/interfaces/dapp'
import { Key, ReadyToAddKeys } from '@ambire-common/interfaces/keystore'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { LOG_LEVELS } from '@web/utils/logger'

import { AllControllersMappingType } from '../../../common/constants/controllersMapping'

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

type ChangeCurrentDappNetworkAction = {
  type: 'CHANGE_CURRENT_DAPP_NETWORK'
  params: { chainId: number; id: string }
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
  | DappsControllerFetchAndUpdateDappsAction
  | DappsControllerRemoveConnectedSiteAction
  | DappsControllerUpdateDappAction
  | DappsControllerRemoveDappAction
  | DappsControllerGetCurrentDappAndSendResToUi
  | AddressBookControllerAddContact
  | AddressBookControllerRenameContact
  | ChangeCurrentDappNetworkAction
  | InviteControllerVerifyAction
  | InviteControllerBecomeOGAction
  | InviteControllerRevokeOGAction
  | ImportSmartAccountJson
  | OpenExtensionPopupAction
  | SetThemeTypeAction
  | SetLogLevelTypeAction
  | SetCrashAnalyticsAction
  | DismissBanner
  | FlipFeature
