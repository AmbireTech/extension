import { requestPq1Permission } from 'pq1-sdk/extension'
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
import { toUserFacingPq1Error } from '@web/modules/hardware-wallet/libs/pq1/errors'

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts

const selectPq1Accounts = (state: AllControllersMappingType['PQ1Controller']) => state.accounts
const selectPq1DeviceId = (state: AllControllersMappingType['PQ1Controller']) => state.deviceId
const selectPq1IsConnected = (state: AllControllersMappingType['PQ1Controller']) =>
  state.isConnected
const selectLoadAccountsStatus = (state: AllControllersMappingType['PQ1Controller']) =>
  state.statuses.loadAccounts

/** How long to wait for the background import to show up in the
 *  AccountsController state before treating it as failed. Generous —
 *  the write path is local (storage), not network-bound. */
const IMPORT_CONFIRM_TIMEOUT_MS = 15000

const ACCOUNT_LIST_STYLE = { maxHeight: 240 }
const ACCOUNT_LABEL_PROPS = { fontSize: 14, appearance: 'primaryText' } as const

type DiscoveredAccountRowProps = {
  accountIndex: number
  address: string
  selected: boolean
  onToggle: (accountIndex: number) => void
}

const DiscoveredAccountRow = React.memo(function DiscoveredAccountRow({
  accountIndex,
  address,
  selected,
  onToggle
}: DiscoveredAccountRowProps) {
  const { t } = useTranslation()
  const onValueChange = useCallback(() => onToggle(accountIndex), [onToggle, accountIndex])

  return (
    <Checkbox
      value={selected}
      onValueChange={onValueChange}
      label={t('PQ1 account {{index}}: {{address}}', {
        index: accountIndex,
        address: shortenAddress(address, 13)
      })}
      labelProps={ACCOUNT_LABEL_PROPS}
      style={spacings.mbSm}
      testID={`pq1-account-${accountIndex}`}
    />
  )
})

/**
 * Pair-and-import flow for the PQ1 post-quantum hardware wallet.
 *
 * Granting the browser's permission to use the device (WebHID's device
 * picker) needs a user gesture in a page, so that is all this screen does
 * with the device. The background's `PQ1Controller`, which owns the only
 * connection, then opens the PQ1 through that permission and reads its
 * accounts. The selected ones are dispatched to the background via
 * `IMPORT_PQ1_ACCOUNTS`, which writes the keys and accounts.
 */
const PQ1ConnectScreen = () => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { dispatch } = useControllersMiddleware()
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const { state: pq1Accounts, dispatch: pq1Dispatch } = useController(
    'PQ1Controller',
    selectPq1Accounts
  )
  const { state: deviceId } = useController('PQ1Controller', selectPq1DeviceId)
  const { state: isConnected } = useController('PQ1Controller', selectPq1IsConnected)
  const { state: loadAccountsStatus } = useController('PQ1Controller', selectLoadAccountsStatus)
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const [isGrantingPermission, setIsGrantingPermission] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedIndices, setSelectedIndices] = useState<number[]>([0])
  /** Lowercased addresses whose background import we're waiting to see
   *  reflected in the AccountsController state. Null = no import pending. */
  const [pendingImportAddrs, setPendingImportAddrs] = useState<string[] | null>(null)

  useEffect(() => {
    // Forget the accounts read for this screen when the user leaves it.
    return () => pq1Dispatch({ type: 'method', params: { method: 'resetAccounts', args: [] } })
  }, [pq1Dispatch])

  // Physical unplug while accounts are listed: the background drops them
  // (they came from the now-gone device), and the user is back on the
  // Connect step with a clear message.
  const hadAccountsRef = useRef(false)
  useEffect(() => {
    if (pq1Accounts.length > 0) {
      hadAccountsRef.current = true
      return
    }
    if (!hadAccountsRef.current || isConnected) return
    hadAccountsRef.current = false
    addToast(t('PQ1 was disconnected. Plug it in and connect again.'), { type: 'error' })
  }, [pq1Accounts.length, isConnected, addToast, t])

  const onPressConnect = useCallback(async () => {
    setIsGrantingPermission(true)
    try {
      // First, before any other await: the browser shows its device picker
      // only while the button press is being handled.
      const device = await requestPq1Permission()
      if (!device) {
        addToast(t('No PQ1 was selected. Plug it in, press Connect and choose it in the list.'), {
          type: 'error'
        })
        return
      }
      setSelectedIndices([0])
      // Errors reach the user as toasts from the controller.
      pq1Dispatch({ type: 'method', params: { method: 'loadAccounts', args: [] } })
    } catch (e) {
      const { message } = toUserFacingPq1Error(
        e,
        "Couldn't connect to the PQ1. Plug it in with the USB cable and try again."
      )
      addToast(t(message), { type: 'error' })
    } finally {
      setIsGrantingPermission(false)
    }
  }, [pq1Dispatch, addToast, t])

  const onToggle = useCallback((accountIndex: number) => {
    setSelectedIndices((prev) =>
      prev.includes(accountIndex) ? prev.filter((i) => i !== accountIndex) : [...prev, accountIndex]
    )
  }, [])

  const onPressImport = useCallback(() => {
    const entries = pq1Accounts.filter((account) => selectedIndices.includes(account.index))
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
        entries: entries.map(({ index, address }) => ({ accountIndex: index, addr: address })),
        deviceId
      }
    })
    setPendingImportAddrs(entries.map(({ address }) => address.toLowerCase()))
  }, [pq1Accounts, selectedIndices, deviceId, dispatch, addToast, t])

  // Guards the one-shot success transition so a late accounts-state update
  // (or the timeout below firing during navigation) can't double-run it.
  const hasImportSucceededRef = useRef(false)

  useEffect(() => {
    if (!pendingImportAddrs || hasImportSucceededRef.current) return
    const imported = new Set(accounts.map((a) => a.addr.toLowerCase()))
    if (!pendingImportAddrs.every((addr) => imported.has(addr))) return
    hasImportSucceededRef.current = true
    goToNextRoute()
  }, [accounts, pendingImportAddrs, goToNextRoute])

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

  const isConnecting = isGrantingPermission || loadAccountsStatus === 'LOADING'

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

          {pq1Accounts.length === 0 ? (
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
                {pq1Accounts.map((account) => (
                  <DiscoveredAccountRow
                    key={account.index}
                    accountIndex={account.index}
                    address={account.address}
                    selected={selectedIndices.includes(account.index)}
                    onToggle={onToggle}
                  />
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
