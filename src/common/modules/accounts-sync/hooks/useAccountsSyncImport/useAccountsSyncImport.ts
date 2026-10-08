import { hexlify } from 'ethers'
import { useCallback, useState } from 'react'

import {
  AccountsSyncSettings,
  parseAccountsSyncPayload
} from '@ambire-common/libs/accountsSync/accountsSync'
import { useTranslation } from '@common/config/localization'
import type { AvatarType } from '@common/controllers/wallet-state'
import useController from '@common/hooks/useController'
import { ACCOUNTS_SYNC_IMPORT_TIMEOUT } from '@common/modules/accounts-sync/consts'
import { THEME_TYPES, ThemeType } from '@common/styles/theme/types'

import type { Account } from '@ambire-common/interfaces/account'

const SYNCABLE_THEME_TYPES: string[] = Object.values(THEME_TYPES)
const SYNCABLE_AVATAR_TYPES: string[] = ['blockies', 'jazzicons', 'polycons', 'ens']

const isThemeType = (value: unknown): value is ThemeType =>
  typeof value === 'string' && SYNCABLE_THEME_TYPES.includes(value)
const isAvatarType = (value: unknown): value is AvatarType =>
  typeof value === 'string' && SYNCABLE_AVATAR_TYPES.includes(value)
/**
 * Owns the import side of the accounts sync: validating what the camera scanned and
 * handing it to the background together with the password of the exporting device
 * (and applying the synced settings that the app keeps itself).
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
  const { dispatch: walletStateDispatch } = useController('WalletStateController')

  const [payload, setPayload] = useState<string | null>(null)
  const [scannedAccounts, setScannedAccounts] = useState<Account[]>([])
  const [scannedAppSettings, setScannedAppSettings] = useState<AccountsSyncSettings['app']>()
  const [scanError, setScanError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleScanComplete = useCallback(
    (scannedBytes: Uint8Array) => {
      try {
        const { accounts, settings } = parseAccountsSyncPayload(scannedBytes)

        setScannedAccounts(accounts)
        setScannedAppSettings(settings?.app)
        setPayload(hexlify(scannedBytes))
        setScanError(null)
      } catch {
        setScannedAccounts([])
        setScannedAppSettings(undefined)
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
    setScannedAppSettings(undefined)
    setPayload(null)
    setScanError(null)
  }, [])

  /**
   * The background merges everything else it synced, but these settings are kept by the
   * app, so they are applied here. Values this app doesn't know are ignored.
   */
  const applyScannedAppSettings = useCallback(() => {
    if (!scannedAppSettings) return

    const { themeType, avatarType, crashAnalyticsEnabled } = scannedAppSettings
    if (isThemeType(themeType))
      walletStateDispatch({ type: 'method', params: { method: 'setThemeType', args: [themeType] } })
    if (isAvatarType(avatarType))
      walletStateDispatch({
        type: 'method',
        params: { method: 'setAvatarType', args: [avatarType] }
      })
    if (typeof crashAnalyticsEnabled === 'boolean')
      walletStateDispatch({
        type: 'method',
        params: { method: 'setCrashAnalytics', args: [crashAnalyticsEnabled] }
      })
  }, [scannedAppSettings, walletStateDispatch])

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
        applyScannedAppSettings()

        await onImported(password)
      } catch {
        // A wrong password is displayed by the password form itself (through the
        // keystore's error message), anything else is emitted by the controller
      } finally {
        setIsImporting(false)
      }
    },
    [applyScannedAppSettings, dispatchAndWait, isImporting, onImported, payload]
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
