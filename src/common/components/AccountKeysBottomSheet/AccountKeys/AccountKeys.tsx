import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { AMBIRE_V1_QUICK_ACC_MANAGER } from '@ambire-common/consts/addresses'
import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import { isAmbireV1LinkedAccount } from '@ambire-common/libs/account/account'
import AccountKey, {
  AccountKeyMenuTarget,
  AccountKeyType
} from '@common/components/AccountKey/AccountKey'
import RemoveKey from '@common/components/AccountKeysBottomSheet/RemoveKey'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import ExportKey from '@common/components/ExportKey'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'
interface Props {
  account: Account
  openAddAccountBottomSheet?: () => void
  closeBottomSheet: () => void
  keyIconColor?: string
  showExportImport?: boolean
  /** Lets the user remove imported keys. Left off while signing, so a key can't vanish mid-flow */
  canRemoveKeys?: boolean
  chainId?: bigint
}

const selectNetworks = (state: AllControllersMappingType['NetworksController']) =>
  state.networks || []
const selectKeys = (state: AllControllersMappingType['KeystoreController']) => state.keys || []
const selectUnsupportedKeys = (state: AllControllersMappingType['KeystoreController']) =>
  state.unsupportedKeys

const AccountKeys: FC<Props> = ({
  account,
  openAddAccountBottomSheet,
  closeBottomSheet,
  keyIconColor,
  showExportImport,
  canRemoveKeys = false,
  chainId
}) => {
  const { t } = useTranslation()
  const selectAccountState = useCallback(
    (state: AllControllersMappingType['AccountsController']) =>
      state.accountStates?.[account.addr] || null,
    [account.addr]
  )
  const { state: accountState, dispatch: accountsDispatch } = useController(
    'AccountsController',
    selectAccountState
  )
  const { state: networks } = useController('NetworksController', selectNetworks)
  const { state: keys } = useController('KeystoreController', selectKeys)
  const { state: unsupportedKeys } = useController('KeystoreController', selectUnsupportedKeys)
  const accountStateRefreshRef = useRef<{ accountAddr: string | null; chainIds: Set<string> }>({
    accountAddr: null,
    chainIds: new Set()
  })
  const [selectedExportKey, setSelectedExportKey] = useState<{
    addr: string
    label?: string
  } | null>(null)
  const { ref: sheetRefExportKey, open: openExportKey, close: closeExportKey } = useModalize()
  const [keyToRemove, setKeyToRemove] = useState<{ addr: string; type: Key['type'] } | null>(null)
  const { ref: sheetRefRemoveKey, open: openRemoveKey, close: closeRemoveKey } = useModalize()

  const usedNetworks = useMemo(() => {
    return account.safeCreation && chainId
      ? networks.filter((n) => n.chainId === chainId)
      : networks
  }, [chainId, networks, account.safeCreation])

  const networkChainIdsToRefresh = useMemo(() => {
    const missingNetworkChainIds = usedNetworks
      .filter((n) => !accountState || !accountState[n.chainId.toString()])
      .map((n) => n.chainId)

    return account.safeCreation ? usedNetworks.map((n) => n.chainId) : missingNetworkChainIds
  }, [account.safeCreation, accountState, usedNetworks])

  useEffect(() => {
    if (!networkChainIdsToRefresh.length || !usedNetworks.length) return

    if (accountStateRefreshRef.current.accountAddr !== account.addr) {
      accountStateRefreshRef.current = {
        accountAddr: account.addr,
        chainIds: new Set()
      }
    }

    const chainIdsToRefresh = networkChainIdsToRefresh.filter(
      (id) => !accountStateRefreshRef.current.chainIds.has(id.toString())
    )
    if (!chainIdsToRefresh.length) return

    chainIdsToRefresh.forEach((id) => {
      accountStateRefreshRef.current.chainIds.add(id.toString())
    })

    accountsDispatch({
      type: 'method',
      params: {
        method: 'updateAccountState',
        args: [account.addr, 'latest', chainIdsToRefresh]
      }
    })
  }, [account.addr, accountsDispatch, networkChainIdsToRefresh, usedNetworks.length])

  /**
   * Get the Safe owners by network if the account is a Safe
   * We do not display network icons for the others as it doesn't make sense
   */
  const safeOwnersByNetwork: { [address: string]: bigint[] } = useMemo(() => {
    if (!account.safeCreation || !usedNetworks.length || !accountState) return {}

    const associatedKeysByNetwork: { [address: string]: bigint[] } = {}
    usedNetworks.forEach((n) => {
      const networkState = accountState[n.chainId.toString()]
      if (!networkState) return
      networkState.associatedKeys.forEach((key) => {
        if (!associatedKeysByNetwork[key]) associatedKeysByNetwork[key] = []
        associatedKeysByNetwork[key].push(n.chainId)
      })
    })
    return associatedKeysByNetwork
  }, [accountState, usedNetworks, account.safeCreation])

  /**
   * Get all the associatedKeys for this account found accross networks.
   * This is especially important for Safe accounts as they may have
   * different owners across networks
   */
  const associatedKeys: string[] = useMemo(() => {
    if (!usedNetworks.length || !accountState) return []
    return [
      ...new Set(
        usedNetworks
          .map((n) => {
            const networkState = accountState[n.chainId.toString()]
            if (!networkState) return []
            return networkState.associatedKeys
          })
          .flat()
      )
    ]
  }, [accountState, usedNetworks])

  const accountKeys: AccountKeyType[] = useMemo(() => {
    const associatedKeysSet = new Set(associatedKeys.map((addr) => addr.toLowerCase()))
    // Keys this device can't sign with are imported all the same, so they are listed (and marked)
    const importedKeys = [
      ...keys.map((key) => ({ ...key, isSupported: true })),
      ...(unsupportedKeys || []).map((key) => ({ ...key, isSupported: false }))
    ].filter(({ addr }) => associatedKeysSet.has(addr.toLowerCase()))
    const importedKeyAddrs = new Set(importedKeys.map(({ addr }) => addr.toLowerCase()))
    const notImportedKeys = associatedKeys.filter(
      (keyAddr) => !importedKeyAddrs.has(keyAddr.toLowerCase())
    )

    return [
      ...importedKeys
        .map((key) => ({ isImported: true, ...key }))
        .sort((a, b) => {
          const aCreatedAt = a.meta?.createdAt
          const bCreatedAt = b.meta?.createdAt

          if (aCreatedAt === null && bCreatedAt === null) return 0
          if (aCreatedAt === null) return -1
          if (bCreatedAt === null) return 1

          return aCreatedAt - bCreatedAt
        }),
      ...notImportedKeys.map((keyAddr) => ({
        isImported: false,
        addr: keyAddr,
        label:
          keyAddr === AMBIRE_V1_QUICK_ACC_MANAGER ? 'Email/password signer (Ambire v1)' : undefined,
        dedicatedToOneSA: false
      }))
    ]
  }, [associatedKeys, keys, unsupportedKeys])

  const withAlert = useMemo(
    () => associatedKeys.length > 1 && isAmbireV1LinkedAccount(account.creation?.factoryAddr),
    [account.creation?.factoryAddr, associatedKeys.length]
  )

  const handleExportKeyPress = useCallback(
    ({ addr, label }: { addr: string; label?: string }) => {
      setSelectedExportKey({ addr, label })
      openExportKey()
    },
    [openExportKey]
  )

  const handleExportKeyClosed = useCallback(() => {
    setSelectedExportKey(null)
  }, [])

  const handleRemoveKeyPress = useCallback(
    ({ addr, type }: AccountKeyMenuTarget) => {
      if (!type) return
      setKeyToRemove({ addr, type })
      openRemoveKey()
    },
    [openRemoveKey]
  )

  const handleRemoveKeyClosed = useCallback(() => {
    setKeyToRemove(null)
  }, [])

  const handleExportFromRemoveKey = useCallback(() => {
    if (!keyToRemove) return
    const label = keys.find(
      ({ addr, type }) => addr === keyToRemove.addr && type === keyToRemove.type
    )?.label
    closeRemoveKey()
    handleExportKeyPress({ addr: keyToRemove.addr, label })
  }, [closeRemoveKey, handleExportKeyPress, keyToRemove, keys])

  return (
    <View style={isWeb ? { maxHeight: 384, flex: 1 } : undefined}>
      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
        {isWeb && <PanelBackButton onPress={closeBottomSheet} style={spacings.mrSm} />}
        <PanelTitle
          title={t('{{accName}} keys', { accName: account.preferences.label })}
          style={isWeb ? text.left : text.center}
        />
      </View>
      <ScrollView
        bounces={isMobile}
        style={[!!withAlert && spacings.mb, isWeb && flexbox.flex1]}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={isWeb}
      >
        {accountKeys.map((accountKey, index) => {
          const { type, addr, isImported, meta, dedicatedToOneSA } = accountKey
          const isLast = index === accountKeys.length - 1
          const accountKeyProps = { addr, type, isLast, isImported }

          return (
            <AccountKey
              key={addr + type}
              meta={meta}
              dedicatedToOneSA={dedicatedToOneSA}
              showCopyAddr={!dedicatedToOneSA}
              {...accountKeyProps}
              account={account}
              openAddAccountBottomSheet={openAddAccountBottomSheet}
              keyIconColor={keyIconColor}
              showExportImport={showExportImport}
              onExportKeyPress={handleExportKeyPress}
              onRemoveKeyPress={canRemoveKeys && isImported ? handleRemoveKeyPress : undefined}
              isSupported={accountKey.isSupported}
              onChains={safeOwnersByNetwork[addr]}
            />
          )
        })}
      </ScrollView>
      {!!withAlert && (
        <Alert
          withIcon={false}
          title={t('Some keys may no longer be signers of this account')}
          text={t(
            'The listed keys are based on historical data from the blockchain and may no longer be signers of this account.'
          )}
          size="sm"
          type="info"
        />
      )}
      <BottomSheet
        sheetRef={sheetRefExportKey}
        id="account-key-export-bottom-sheet"
        type={isWeb ? 'modal' : 'bottom-sheet'}
        closeBottomSheet={closeExportKey}
        scrollViewProps={isWeb ? { contentContainerStyle: { flex: 1 } } : undefined}
        containerInnerWrapperStyles={{ flex: 1 }}
        style={isWeb ? { maxWidth: 432, minHeight: 432, ...spacings.pvLg } : undefined}
        onClosed={handleExportKeyClosed}
      >
        {!!selectedExportKey && (
          <ExportKey
            account={account}
            keyAddr={selectedExportKey.addr}
            keyLabel={selectedExportKey.label}
            onBackButtonPress={closeExportKey}
          />
        )}
      </BottomSheet>
      <BottomSheet
        sheetRef={sheetRefRemoveKey}
        id="account-key-remove-bottom-sheet"
        type={isWeb ? 'modal' : 'bottom-sheet'}
        closeBottomSheet={closeRemoveKey}
        style={isWeb ? { maxWidth: 432, ...spacings.pvLg } : undefined}
        onClosed={handleRemoveKeyClosed}
      >
        {!!keyToRemove && (
          <RemoveKey
            keyToRemove={keyToRemove}
            onCancel={closeRemoveKey}
            onRemoved={closeRemoveKey}
            onExportPress={handleExportFromRemoveKey}
          />
        )}
      </BottomSheet>
    </View>
  )
}

export default React.memo(AccountKeys)
