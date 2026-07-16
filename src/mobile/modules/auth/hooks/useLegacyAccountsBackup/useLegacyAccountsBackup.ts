import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { useCallback } from 'react'

import { useTranslation } from '@common/config/localization'
import useToast from '@common/hooks/useToast'
import { getLegacyEmailAccounts } from '@mobile/services/legacyMigration/legacyMigration'

export default function useLegacyAccountsBackup() {
  const { t } = useTranslation()
  const { addToast } = useToast()

  // Exports each legacy v1 email-based smart account as its own JSON file
  // (`<account.id>.json`), matching the single-account import on
  // wallet.ambire.com. Sharing handles one file at a time, so the share dialog
  // opens once per account.
  const exportEmailAccountsBackup = useCallback(async (): Promise<boolean> => {
    const emailAccounts = getLegacyEmailAccounts()

    if (!emailAccounts.length) {
      addToast(t('No email-based smart accounts were found to back up.'), { type: 'error' })
      return false
    }

    const isAvailable = await Sharing.isAvailableAsync()
    if (!isAvailable) {
      addToast(t('Sharing is not available on this device. Please contact support.'), {
        type: 'error'
      })
      return false
    }

    for (const account of emailAccounts) {
      const fileName = `${account.id}.json`
      const jsonString = JSON.stringify(account, null, 2)
      const tempUri = FileSystem.cacheDirectory + fileName

      // Await each share sequentially so the dialogs don't overlap.

      await FileSystem.writeAsStringAsync(tempUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8
      })

      await Sharing.shareAsync(tempUri, {
        mimeType: 'application/json',
        dialogTitle: t('Save account backup'),
        UTI: 'public.json'
      })
    }

    return true
  }, [addToast, t])

  return { exportEmailAccountsBackup }
}
