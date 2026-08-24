import { hexlify } from 'ethers'
import { useCallback, useState } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { parseAccountsSyncPayload } from '@ambire-common/libs/accountsSync/accountsSync'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { ACCOUNTS_SYNC_IMPORT_TIMEOUT } from '@common/modules/accounts-sync/consts'

/**
 * Owns the import side of the accounts sync: validating what the camera scanned and
 * handing it to the background together with the password of the exporting device.
 *
 * The scanned data is parsed here as well, so that a QR code from somewhere else is
 * rejected before the user is asked for a password (and so the UI can tell how many
 * accounts are about to be imported).
 */
const useAccountsSyncImport = ({
  onImported
}: {
  /** Receives the password of the exporting device, which this one can adopt as its own */
  onImported: (password: string) => void | Promise<void>
}) => {
  const { t } = useTranslation()
  const { dispatchAndWait } = useController('MainController')

  const [payload, setPayload] = useState<string | null>(null)
  const [scannedAccounts, setScannedAccounts] = useState<Account[]>([])
  const [scanError, setScanError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleScanComplete = useCallback(
    (scannedBytes: Uint8Array) => {
      try {
        const { accounts } = parseAccountsSyncPayload(scannedBytes)

        setScannedAccounts(accounts)
        setPayload(hexlify(scannedBytes))
        setScanError(null)
      } catch {
        setScannedAccounts([])
        setPayload(null)
        setScanError(
          t(
            'This QR code does not contain Ambire accounts. Please scan the one from your other device.'
          )
        )
      }
    },
    [t]
  )

  const retryScan = useCallback(() => {
    setScannedAccounts([])
    setPayload(null)
    setScanError(null)
  }, [])

  const importScannedAccounts = useCallback(
    async (password: string) => {
      if (!payload || isImporting) return

      setIsImporting(true)
      try {
        await dispatchAndWait<'importAccountsFromSync'>(
          {
            type: 'method',
            params: { method: 'importAccountsFromSync', args: [{ payload, password }] }
          },
          ACCOUNTS_SYNC_IMPORT_TIMEOUT
        )

        // The scanned data carries the other device's password wrapped main key, so it is
        // dropped as soon as the background is done with it (which is before the password
        // of this device gets set, a step the user can spend a while on)
        setPayload(null)

        await onImported(password)
      } catch {
        // A wrong password is displayed by the password form itself (through the
        // keystore's error message), anything else is emitted by the controller
      } finally {
        setIsImporting(false)
      }
    },
    [dispatchAndWait, isImporting, onImported, payload]
  )

  return {
    handleScanComplete,
    hasScannedPayload: !!payload,
    scannedAccounts,
    scanError,
    retryScan,
    importScannedAccounts,
    isImporting
  }
}

export default useAccountsSyncImport
