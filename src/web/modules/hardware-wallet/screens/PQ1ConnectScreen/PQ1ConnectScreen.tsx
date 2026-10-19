import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'

import shortenAddress from '@ambire-common/utils/shortenAddress'
import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import type { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import spacings from '@common/styles/spacings'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import PQ1Controller from '@web/modules/hardware-wallet/controllers/PQ1Controller'
import { toUserFacingPq1Error } from '@web/modules/hardware-wallet/libs/pq1/errors'

/** How many of the device's accounts are offered for import. */
const DEFAULT_DISCOVERY_RANGE = 5

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts

/** How long to wait for the background import to show up in the
 *  AccountsController state before treating it as failed. Generous —
 *  the write path is local (storage), not network-bound. */
const IMPORT_CONFIRM_TIMEOUT_MS = 15000

const ACCOUNT_LIST_STYLE = { maxHeight: 240 }
const ACCOUNT_LABEL_PROPS = { fontSize: 14, appearance: 'primaryText' } as const

type DiscoveredEntry = { accountIndex: number; addr: string; selected: boolean }

type DiscoveredAccountRowProps = {
  entry: DiscoveredEntry
  onToggle: (accountIndex: number) => void
}

const DiscoveredAccountRow = React.memo(function DiscoveredAccountRow({
  entry,
  onToggle
}: DiscoveredAccountRowProps) {
  const { t } = useTranslation()
  const onValueChange = useCallback(
    () => onToggle(entry.accountIndex),
    [onToggle, entry.accountIndex]
  )

  return (
    <Checkbox
      value={entry.selected}
      onValueChange={onValueChange}
      label={t('PQ1 account {{index}}: {{address}}', {
        index: entry.accountIndex,
        address: shortenAddress(entry.addr, 13)
      })}
      labelProps={ACCOUNT_LABEL_PROPS}
      style={spacings.mbSm}
      testID={`pq1-account-${entry.accountIndex}`}
    />
  )
})

/**
 * Pair-and-import flow for the PQ1 post-quantum hardware wallet.
 *
 * Granting the browser's permission to use the device (WebHID's device
 * picker) needs a user gesture in a page, so this screen connects the device
 * with a `PQ1Controller` of its own and reads the addresses of its accounts
 * over that connection. The background's controller opens the device again,
 * through the permission granted here, when it signs. The selected
 * addresses are dispatched to the background via `IMPORT_PQ1_ACCOUNTS`,
 * which writes the keys and accounts.
 */
const PQ1ConnectScreen = () => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { dispatch } = useControllersMiddleware()
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()

  // The controller reaches the latest disconnect handler through this ref,
  // so it is created once and never changed afterwards.
  const onDeviceDisconnectRef = useRef<() => void>(() => {})
  // One controller for the screen's lifetime: it holds the open device.
  const [controller] = useState(() => {
    const c = new PQ1Controller()
    c.onDeviceDisconnect = () => onDeviceDisconnectRef.current()
    return c
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [discovered, setDiscovered] = useState<DiscoveredEntry[]>([])
  /** Lowercased addresses whose background import we're waiting to see
   *  reflected in the AccountsController state. Null = no import pending. */
  const [pendingImportAddrs, setPendingImportAddrs] = useState<string[] | null>(null)
  const { state: accounts } = useController('AccountsController', selectAccounts)
  /** Cleared on unmount so an in-flight address discovery stops talking to
   *  the device and doesn't update state or toast after the user left. */
  const isMountedRef = useRef(true)

  useEffect(() => {
    // Physical unplug while on this screen: drop the discovered list (its
    // addresses came from the now-gone device) and put the user back on the
    // Connect step with a clear message.
    onDeviceDisconnectRef.current = () => {
      setDiscovered([])
      addToast(t('PQ1 was disconnected. Plug it in and connect again.'), { type: 'error' })
    }
  }, [addToast, t])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      // Release the WebHID handle if the user leaves without importing —
      // signing re-acquires it from the background on demand. cleanUp()
      // logs transport errors internally, so it never rejects.
      void controller.cleanUp()
    }
  }, [controller])

  const onPressConnect = useCallback(async () => {
    setIsConnecting(true)
    try {
      await controller.unlock()
      const sdk = controller.walletSDK
      if (!sdk) throw new Error('PQ1 walletSDK missing right after unlock()')
      const next: DiscoveredEntry[] = []
      for (let i = 0; i < DEFAULT_DISCOVERY_RANGE && isMountedRef.current; i++) {
        const addr = await sdk.commands.getWalletAddress(i)
        next.push({ accountIndex: i, addr, selected: i === 0 })
      }
      if (isMountedRef.current) setDiscovered(next)
    } catch (e) {
      const { message } = toUserFacingPq1Error(
        e,
        "Couldn't connect to the PQ1. Plug it in with the USB cable and try again."
      )
      if (isMountedRef.current) addToast(t(message), { type: 'error' })
    } finally {
      if (isMountedRef.current) setIsConnecting(false)
      // The user left while the device was opening: the unmount cleanup ran
      // before there was a handle, so release the one opened since.
      else await controller.cleanUp()
    }
  }, [controller, addToast, t])

  const onToggle = useCallback((accountIndex: number) => {
    setDiscovered((prev) =>
      prev.map((e) => (e.accountIndex === accountIndex ? { ...e, selected: !e.selected } : e))
    )
  }, [])

  const onPressImport = useCallback(() => {
    const entries = discovered.filter((e) => e.selected)
    if (entries.length === 0) {
      addToast(t('Select at least one PQ1 account to import.'), { type: 'error' })
      return
    }
    setIsImporting(true)
    // Fire-and-forget per the controller lifecycle — dispatch reports
    // nothing back, so a local try/catch can never observe a background
    // failure. Success is confirmed by watching the AccountsController
    // state (effects below), and only then does the flow navigate on, so a
    // failed import never lands the user on the next screen with no accounts.
    dispatch({
      type: 'IMPORT_PQ1_ACCOUNTS',
      params: {
        entries: entries.map(({ accountIndex, addr }) => ({ accountIndex, addr })),
        deviceId: controller.deviceId
      }
    })
    setPendingImportAddrs(entries.map((e) => e.addr.toLowerCase()))
  }, [discovered, dispatch, controller, addToast, t])

  // Guards the one-shot success transition so a late accounts-state update
  // (or the timeout below firing during navigation) can't double-run it.
  const hasImportSucceededRef = useRef(false)

  useEffect(() => {
    if (!pendingImportAddrs || hasImportSucceededRef.current) return
    const imported = new Set(accounts.map((a) => a.addr.toLowerCase()))
    if (!pendingImportAddrs.every((addr) => imported.has(addr))) return
    hasImportSucceededRef.current = true
    // Release the device — signing will re-acquire on demand. cleanUp()
    // never rejects (it swallows transport errors internally).
    void controller.cleanUp().then(() => goToNextRoute())
  }, [accounts, pendingImportAddrs, controller, goToNextRoute])

  useEffect(() => {
    if (!pendingImportAddrs) return undefined
    const timer = setTimeout(() => {
      if (hasImportSucceededRef.current) return
      setPendingImportAddrs(null)
      setIsImporting(false)
      addToast(t('Importing PQ1 accounts failed or timed out. Please try again.'), {
        type: 'error'
      })
    }, IMPORT_CONFIRM_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [pendingImportAddrs, addToast, t])

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
      <TabLayoutWrapperMainContent>
        <Panel
          spacingsSize="small"
          type="onboarding"
          withBackButton
          onBackButtonPress={goToPrevRoute}
          title={t('Connect PQ1 (post-quantum)')}
        >
          <Text weight="medium" style={spacings.mbSm} fontSize={14}>
            {t('1. Plug your PQ1 in via USB.')}
          </Text>
          <Text weight="medium" style={spacings.mbSm} fontSize={14}>
            {t('2. Press Connect below — your browser will ask you to pick the device.')}
          </Text>
          <Text weight="medium" style={spacings.mbXl} fontSize={14}>
            {t('3. Enter your PIN on the PQ1 when prompted.')}
          </Text>

          {discovered.length === 0 ? (
            <Button
              text={isConnecting ? t('Connecting...') : t('Connect PQ1')}
              disabled={isConnecting}
              onPress={onPressConnect}
              hasBottomSpacing={false}
            />
          ) : (
            <>
              <Text style={spacings.mbSm} fontSize={14} appearance="secondaryText">
                {t('Select PQ1 accounts to import:')}
              </Text>
              <ScrollView style={ACCOUNT_LIST_STYLE}>
                {discovered.map((e) => (
                  <DiscoveredAccountRow key={e.accountIndex} entry={e} onToggle={onToggle} />
                ))}
              </ScrollView>
              <View style={spacings.mtXl}>
                <Button
                  text={isImporting ? t('Importing...') : t('Import selected')}
                  disabled={isImporting}
                  onPress={onPressImport}
                  hasBottomSpacing={false}
                />
              </View>
            </>
          )}
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(PQ1ConnectScreen)
