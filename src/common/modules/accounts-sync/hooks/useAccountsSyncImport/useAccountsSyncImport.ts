import { hexlify } from 'ethers'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  AccountsSyncSettings,
  isSyncPasswordRequired,
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

/** What the screen needs to know once the scanned data is imported */
export type AccountsSyncImportResult = {
  /**
   * The password of the exporting device, which this one can adopt as its own. Missing
   * when nothing needed decrypting, so the user wasn't asked for it.
   */
  password?: string
  importedAccountsCount: number
  /** The names of what came along with the accounts, e.g. "Settings, Networks" */
  syncedExtrasLabel: string
}

/**
 * Owns the import side of the accounts sync: validating what the camera scanned and
 * handing it to the background together with the password of the exporting device
 * (and applying the synced settings that the app keeps itself).
 *
 * The scanned data is parsed here as well, so that a QR code from somewhere else is
 * rejected before the user is asked for a password (and so the UI can tell how many
 * accounts are about to be imported). Data with nothing encrypted in it (no private keys
 * or recovery phrases) needs no password, so it gets imported right after the scan.
 */
const useAccountsSyncImport = ({
  onImported
}: {
  onImported: (result: AccountsSyncImportResult) => void | Promise<void>
}) => {
  const { t } = useTranslation()
  const { dispatchAndWait } = useController('MainController')
  const { dispatch: walletStateDispatch } = useController('WalletStateController')

  const [payload, setPayload] = useState<string | null>(null)
  const [scannedAccounts, setScannedAccounts] = useState<Account[]>([])
  const [scannedAppSettings, setScannedAppSettings] = useState<AccountsSyncSettings['app']>()
  const [scannedExtrasLabel, setScannedExtrasLabel] = useState('')
  const [isPasswordRequired, setIsPasswordRequired] = useState(true)
  const [scanError, setScanError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  // Imported once per scan without a password, so a failed import is retried by the user
  // instead of in a loop
  const autoImportedPayloadRef = useRef<string | null>(null)

  const handleScanComplete = useCallback(
    (scannedBytes: Uint8Array) => {
      try {
        const scannedPayload = parseAccountsSyncPayload(scannedBytes)
        const { accounts, settings, networks, contacts } = scannedPayload
        const extras = [
          settings && t('Settings'),
          networks && t('Networks'),
          contacts && t('Address book')
        ].filter(Boolean)

        setScannedAccounts(accounts)
        setScannedAppSettings(settings?.app)
        setScannedExtrasLabel(extras.join(', '))
        setIsPasswordRequired(isSyncPasswordRequired(scannedPayload))
        setPayload(hexlify(scannedBytes))
        setScanError(null)
      } catch {
        setScannedAccounts([])
        setScannedAppSettings(undefined)
        setScannedExtrasLabel('')
        setPayload(null)
        setScanError(
          t('This QR code does not come from Ambire. Please scan the one from your other device.')
        )
      }
    },
    [t]
  )

  const retryScan = useCallback(() => {
    setScannedAccounts([])
    setScannedAppSettings(undefined)
    setScannedExtrasLabel('')
    setPayload(null)
    setScanError(null)
    autoImportedPayloadRef.current = null
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
    async (password?: string) => {
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

        await onImported({
          password,
          importedAccountsCount: scannedAccounts.length,
          syncedExtrasLabel: scannedExtrasLabel
        })
      } catch {
        // A wrong password is displayed by the password form itself (through the
        // keystore's error message), anything else is emitted by the controller
      } finally {
        setIsImporting(false)
      }
    },
    [
      applyScannedAppSettings,
      dispatchAndWait,
      isImporting,
      onImported,
      payload,
      scannedAccounts.length,
      scannedExtrasLabel
    ]
  )

  useEffect(() => {
    if (!payload || isPasswordRequired || autoImportedPayloadRef.current === payload) return

    autoImportedPayloadRef.current = payload
    void importScannedAccounts()
  }, [importScannedAccounts, isPasswordRequired, payload])

  return {
    handleScanComplete,
    hasScannedPayload: !!payload,
    scannedAccounts,
    isPasswordRequired,
    scanError,
    retryScan,
    importScannedAccounts,
    isImporting
  }
}

export default useAccountsSyncImport
