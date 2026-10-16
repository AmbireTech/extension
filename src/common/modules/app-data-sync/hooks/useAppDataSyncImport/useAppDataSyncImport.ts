import { hexlify } from 'ethers'
import { useCallback, useState } from 'react'

import {
  AppDataSyncNewerVersionError,
  AppDataSyncSettings,
  parseAppDataSyncPayload
} from '@ambire-common/libs/appDataSync/appDataSync'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { APP_DATA_SYNC_IMPORT_TIMEOUT } from '@common/modules/app-data-sync/consts'
import { THEME_TYPES, ThemeType } from '@common/styles/theme/types'

import type { AvatarType } from '@common/controllers/wallet-state'
import type { Account } from '@ambire-common/interfaces/account'

const SYNCABLE_THEME_TYPES: string[] = Object.values(THEME_TYPES)
const SYNCABLE_AVATAR_TYPES: string[] = ['blockies', 'jazzicons', 'polycons', 'ens']

const isThemeType = (value: unknown): value is ThemeType =>
  typeof value === 'string' && SYNCABLE_THEME_TYPES.includes(value)
const isAvatarType = (value: unknown): value is AvatarType =>
  typeof value === 'string' && SYNCABLE_AVATAR_TYPES.includes(value)

/** What the screen needs to know once the scanned data is imported */
export type AppDataSyncImportResult = {
  /** The password of the exporting device, which this one can adopt as its own */
  password: string
  importedAccountsCount: number
  /** The names of what came along with the accounts, e.g. "Settings, Networks" */
  syncedExtrasLabel: string
}

/**
 * Owns the import side of the app data sync: validating what the camera scanned and
 * handing it to the background together with the password of the exporting device
 * (and applying the synced settings that the app keeps itself).
 *
 * The scanned data is parsed here as well, so that a QR code from somewhere else is
 * rejected before the user is asked for a password (and so the UI can tell how many
 * accounts are about to be imported). The password is asked for whatever was synced,
 * even with nothing encrypted in it, so nothing is taken over without the user's say.
 */
const useAppDataSyncImport = ({
  onImported
}: {
  onImported: (result: AppDataSyncImportResult) => void | Promise<void>
}) => {
  const { t } = useTranslation()
  const { dispatchAndWait } = useController('AppDataSyncController')
  const { dispatch: walletStateDispatch } = useController('WalletStateController')

  const [payload, setPayload] = useState<string | null>(null)
  const [scannedAccounts, setScannedAccounts] = useState<Account[]>([])
  const [scannedAppSettings, setScannedAppSettings] = useState<AppDataSyncSettings['app']>()
  const [scannedExtrasLabel, setScannedExtrasLabel] = useState('')
  const [scanError, setScanError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleScanComplete = useCallback(
    (scannedBytes: Uint8Array) => {
      try {
        const { accounts, settings, networks, contacts } = parseAppDataSyncPayload(scannedBytes)
        const extras = [
          settings && t('Settings'),
          networks && t('Networks'),
          contacts && t('Address book')
        ].filter(Boolean)

        setScannedAccounts(accounts)
        setScannedAppSettings(settings?.app)
        setScannedExtrasLabel(extras.join(', '))
        setPayload(hexlify(scannedBytes))
        setScanError(null)
      } catch (error) {
        setScannedAccounts([])
        setScannedAppSettings(undefined)
        setScannedExtrasLabel('')
        setPayload(null)
        setScanError(
          error instanceof AppDataSyncNewerVersionError
            ? t('This QR code comes from a newer version of Ambire. Please update this app first.')
            : t(
                'This QR code does not come from Ambire. Please scan the one from your other device.'
              )
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

  const importScannedData = useCallback(
    async (password: string) => {
      if (!payload || isImporting) return

      setIsImporting(true)
      try {
        await dispatchAndWait<'importData'>(
          {
            type: 'method',
            params: { method: 'importData', args: [{ payload, password }] }
          },
          APP_DATA_SYNC_IMPORT_TIMEOUT
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

  return {
    handleScanComplete,
    hasScannedPayload: !!payload,
    scannedAccounts,
    scanError,
    retryScan,
    importScannedData,
    isImporting
  }
}

export default useAppDataSyncImport
