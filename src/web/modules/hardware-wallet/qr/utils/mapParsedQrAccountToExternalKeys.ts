import {
  ExternalKey,
  ParsedQrAccount,
  QrProtocolType,
  QrWalletType
} from '@ambire-common/interfaces/keystore'

export type MapParsedQrAccountToExternalKeysArgs = {
  parsedAccount: ParsedQrAccount
  qrWalletType: QrWalletType
  qrProtocol: QrProtocolType
  hdPathTemplate: ExternalKey['meta']['hdPathTemplate']
  label?: string
}

export function mapParsedQrAccountToExternalKeys({
  parsedAccount,
  qrWalletType,
  qrProtocol,
  hdPathTemplate,
  label
}: MapParsedQrAccountToExternalKeysArgs): ExternalKey[] {
  const createdAt = Date.now()

  return parsedAccount.accounts.map((account, index) => {
    if (!account.addr) {
      throw new Error(`QR imported account at index ${index} is missing addr`)
    }

    return {
      addr: account.addr,
      type: 'qr',
      label: label || parsedAccount.deviceModel || qrWalletType,
      dedicatedToOneSA: false,
      meta: {
        deviceId:
          parsedAccount.deviceId ||
          `${qrWalletType}-${parsedAccount.masterFingerprint || 'unknown'}`,
        deviceModel: parsedAccount.deviceModel || qrWalletType,
        hdPathTemplate,
        index: account.index ?? index,
        createdAt,
        qrWalletType,
        qrProtocol,
        masterFingerprint: parsedAccount.masterFingerprint,
        originHdPath: account.hdPath || parsedAccount.hdPath
      }
    }
  })
}
