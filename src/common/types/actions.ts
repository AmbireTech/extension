import { Account } from '@ambire-common/interfaces/account'
import { Contact } from '@ambire-common/interfaces/addressBook'
import { ConnectionSource, Dapp } from '@ambire-common/interfaces/dapp'
import { Key, ReadyToAddKeys } from '@ambire-common/interfaces/keystore'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

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

type GetAllControllerNamesAction = {
  type: 'GET_ALL_CONTROLLER_NAMES'
}

type InitControllerStateAction = {
  type: 'INIT_CONTROLLER_STATE'
  params: {
    controller: string
  }
}

type InitAllControllersAction = {
  type: 'INIT_ALL_CONTROLLERS'
  params: {
    controllers: (keyof AllControllersMappingType)[]
  }
}

type HandshakeAction = {
  type: 'HANDSHAKE'
}

type UpdateNavigationUrl = {
  type: 'UPDATE_PORT_URL'
  params: { url: string; route?: string; searchParams?: { [key: string]: string } }
}

type UpdateUiViewRoute = {
  type: 'UPDATE_UI_VIEW_ROUTE'
  params: { id: string; route?: string; searchParams?: { [key: string]: string } }
}

type SetViewFocusAction = {
  type: 'SET_VIEW_FOCUS'
  params: { id?: string }
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
type MainControllerAccountPickerInitQrWalletAction = {
  type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_QR_WALLET'
  params: { payload: string | Uint8Array }
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
  params: { signers: { addr: Key['addr']; type: Key['type'] }[] }
}

type DappsControllerRemoveConnectedSiteAction = {
  type: 'DAPPS_CONTROLLER_DISCONNECT_DAPP'
  params: {
    id: Dapp['id']
    url: Dapp['url']
    // Optional: when set, only the matching connection channel is torn down. Omitting
    // it disconnects every active source (backwards-compatible with web/extension and
    // with the "Disconnect both" choice on mobile).
    source?: ConnectionSource
  }
}

type DappsControllerDisconnectAllDappsAction = {
  type: 'DAPPS_CONTROLLER_DISCONNECT_ALL_DAPPS'
  params: {
    // Optional: when set, only that channel is torn down for every connected dapp
    // (web passes 'injected'). Omitting it disconnects every channel (mobile: WC + injected).
    // Handled in a single action so the per-dapp autoLogin revoke runs sequentially —
    // firing one action per dapp would race the `revokeAllPoliciesForDomain` status lock.
    source?: ConnectionSource
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

type ImportSmartAccountJson = {
  type: 'IMPORT_SMART_ACCOUNT_JSON'
  params: { readyToAddAccount: Account; keys: ReadyToAddKeys['internal'] }
}

type OpenExtensionPopupAction = {
  type: 'OPEN_EXTENSION_POPUP'
}

type WindowRemovedAction = {
  type: 'WINDOW_REMOVED'
  params: { id: number }
}

type WebviewOriginChangedAction = {
  type: 'WEBVIEW_ORIGIN_CHANGED'
  params: { previousOrigin: string }
}

type HandleProviderRequestAction = {
  type: 'HANDLE_PROVIDER_REQUEST'
  params: {
    request: {
      method: string
      params?: any
      origin: string
    }
    requestId: number
    providerId: number
    topic: string
    isWalletConnect?: boolean
    isWcAuthenticate?: boolean
    tabId?: number
  }
}

type SetupWcSessionMessengerAction = {
  type: 'SETUP_WC_SESSION_MESSENGER'
  params: {
    url: string
    tabId: number
    topic: string
    chainId: number
    candidateChainIds?: number[]
    name?: string
    icon?: string
    tempSessionTopic?: string
  }
}

type RestoreWcSessionsAction = {
  type: 'RESTORE_WC_SESSIONS'
  params: {
    sessions: {
      topic: string
      url: string
      chainId: number
      candidateChainIds?: number[]
      name?: string
      icon?: string
    }[]
  }
}

type DisconnectWcSessionAction = {
  type: 'DISCONNECT_WC_SESSION'
  params: {
    topic: string
  }
}

type SetBootPhaseAction = {
  type: 'SET_BOOT_PHASE'
  params: { phase: 'critical' | 'full' }
}

// Mobile-only. The UI reports which controllers currently have at least one
// active `useController` subscriber so the WebView worker can skip serializing
// and bridging the state of controllers no screen is displaying.
type SetSubscribedControllersAction = {
  type: 'SET_SUBSCRIBED_CONTROLLERS'
  params: { controllers: string[] }
}

export type Action =
  | UpdateNavigationUrl
  | UpdateUiViewRoute
  | SetViewFocusAction
  | MainControllerAccountPickerInitQrWalletAction
  | MainControllerAccountPickerInitLatticeAction
  | MainControllerAccountPickerInitTrezorAction
  | MainControllerAccountPickerInitLedgerAction
  | MainControllerAccountPickerInitFromSavedSeedPhraseAction
  | HandshakeAction
  | ResetAccountAddingOnPageErrorAction
  | MainControllerHandleSignMessage
  | DappsControllerRemoveConnectedSiteAction
  | DappsControllerDisconnectAllDappsAction
  | AddressBookControllerAddContact
  | AddressBookControllerRenameContact
  | ChangeCurrentDappNetworkAction
  | ImportSmartAccountJson
  | OpenExtensionPopupAction
  | InitAllControllersAction
  | WindowRemovedAction
  | GetAllControllerNamesAction
  | InitControllerStateAction
  | HandleProviderRequestAction
  | WebviewOriginChangedAction
  | SetupWcSessionMessengerAction
  | RestoreWcSessionsAction
  | DisconnectWcSessionAction
  | SetBootPhaseAction
  | SetSubscribedControllersAction
