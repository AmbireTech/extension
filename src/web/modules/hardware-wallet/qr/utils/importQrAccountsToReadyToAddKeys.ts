import { ReadyToAddKeys } from '@ambire-common/interfaces/keystore'

import { externalKeysToReadyToAddKeys } from './externalKeysToReadyToAddKeys'
import {
  importQrAccountsToExternalKeys,
  ImportQrAccountsToExternalKeysArgs
} from './importQrAccountsToExternalKeys'

export async function importQrAccountsToReadyToAddKeys(
  args: ImportQrAccountsToExternalKeysArgs
): Promise<ReadyToAddKeys> {
  const externalKeys = await importQrAccountsToExternalKeys(args)

  return externalKeysToReadyToAddKeys(externalKeys)
}
