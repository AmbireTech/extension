import { HD_PATH_TEMPLATE_TYPE } from '@ambire-common/consts/derivation'
import { Contact } from '@ambire-common/controllers/addressBook/addressBook'
import { Account } from '@ambire-common/interfaces/account'
import { Dapp } from '@ambire-common/interfaces/dapp'
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

type MainControllerAccountPickerInitLedgerAction = {
  type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LEDGER'
}
type MainControllerAccountPickerInitTrezorAction = {
  type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_TREZOR'
}
type MainControllerAccountPickerInitLatticeAction = {
  type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LATTICE'
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

export type Action =
  | UpdateNavigationUrl
  | UpdateUiViewRoute
  | MainControllerAccountPickerInitLatticeAction
  | MainControllerAccountPickerInitTrezorAction
  | MainControllerAccountPickerInitLedgerAction
  | MainControllerAccountPickerInitFromSavedSeedPhraseAction
  | HandshakeAction
  | ResetAccountAddingOnPageErrorAction
  | MainControllerHandleSignMessage
  | DappsControllerRemoveConnectedSiteAction
  | AddressBookControllerAddContact
  | AddressBookControllerRenameContact
  | ChangeCurrentDappNetworkAction
  | ImportSmartAccountJson
  | OpenExtensionPopupAction
<<<<<<< HEAD
  | InitAllControllersAction
  | WindowRemovedAction
=======
  | GetAllControllerNamesAction
  | InitControllerStateAction
>>>>>>> v2
