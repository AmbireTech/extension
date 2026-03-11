import {
  ExternalKey,
  ParsedQrAccount,
  QrAccountImportController,
  QrProtocolType,
  QrWalletType
} from '@ambire-common/interfaces/keystore'

import { deriveAddressesFromParsedQrAccount } from './deriveAddressesFromParsedQrAccount'
import { mapParsedQrAccountToExternalKeys } from './mapParsedQrAccountToExternalKeys'

export type ImportQrAccountsToExternalKeysArgs = {
  controller: QrAccountImportController
  payload: string | Uint8Array
  qrWalletType: QrWalletType
  qrProtocol: QrProtocolType
  hdPathTemplate: ExternalKey['meta']['hdPathTemplate']
  label?: string
  relativePathTemplate?: string
}

export async function importQrAccountsToExternalKeys({
  controller,
  payload,
  qrWalletType,
  qrProtocol,
  hdPathTemplate,
  label,
  relativePathTemplate = '0/{index}'
}: ImportQrAccountsToExternalKeysArgs): Promise<ExternalKey[]> {
  const parsedAccount: ParsedQrAccount = await controller.importAccountQR(payload)

  const parsedAccountWithAddresses = deriveAddressesFromParsedQrAccount({
    parsedAccount,
    relativePathTemplate
  })

  return mapParsedQrAccountToExternalKeys({
    parsedAccount: parsedAccountWithAddresses,
    qrWalletType,
    qrProtocol,
    hdPathTemplate,
    label
  })
}
