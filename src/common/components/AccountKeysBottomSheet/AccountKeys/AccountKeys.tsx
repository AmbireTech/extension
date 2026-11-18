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
import useCompactLayout from '@common/hooks/useCompactLayout'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { selectKeys, selectUnsupportedKeys } from '@common/utils/keys'
import { getUiType } from '@common/utils/uiType'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'
interface Props {
  account: Account
  openAddAccountBottomSheet?: () => void
  closeBottomSheet: () => void
  keyIconColor?: string
  showExportImport?: boolean
  /**
   * Which imported keys the user can remove: all of them, or only the ones this device can't sign
   * with (while signing, so a key that can sign never vanishes mid-flow). None when left out
   */
  removableKeys?: RemovableKeys
  chainId?: bigint
  /** The sheet takes the full width, see `AccountKeysBottomSheet` */
  isFullWidthSheet: boolean
}

const { isPopup } = getUiType()

// A compact view shows a full-width bottom sheet, so only a wider layout gets the minimum height.
// The popup is barely wider than the width cap, so the modal there takes the popup's full width
// instead of leaving a thin gap on each side
const WIDE_LAYOUT_SHEET_STYLE = {
  minHeight: 432,
  ...spacings.pvLg,
  ...(isPopup ? {} : { maxWidth: 432 })
}

// Sized like the export sheet above, but only as tall as its content
const REMOVE_KEY_SHEET_STYLE = {
  ...spacings.pvLg,
  ...(isPopup ? {} : { maxWidth: 432 })
}

/** Which imported keys can be removed from the keys list, see `AccountKeys` */
export type RemovableKeys = 'all' | 'unsupported'

const isKeyRemovable = (
  { isImported, isSupported }: AccountKeyType,
  removableKeys: RemovableKeys | undefined
) => {
  if (!isImported) return false
  if (removableKeys === 'all') return true
  return removableKeys === 'unsupported' && isSupported === false
}

const selectNetworks = (state: AllControllersMappingType['NetworksController']) =>
  state.networks || []
const selectAccounts = (state: AllControllersMappingType['AccountsController']) =>
  state.accounts || []
const selectContacts = (state: AllControllersMappingType['AddressBookController']) =>
  state.contacts || []

const AccountKeys: FC<Props> = ({
  account,
  openAddAccountBottomSheet,
  closeBottomSheet,
  keyIconColor,
  showExportImport,
  removableKeys,
  chainId,
  isFullWidthSheet
}) => {
  const { t } = useTranslation()
  const { isCompactLayout } = useCompactLayout()
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
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: contacts } = useController('AddressBookController', selectContacts)
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
      ...unsupportedKeys.map((key) => ({ ...key, isSupported: false }))
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

  // Looked up once for the whole list, so that the rows do not subscribe to the accounts and contacts
  const accountsByAddr = useMemo(
    () => new Map(accounts.map((acc) => [acc.addr.toLowerCase(), acc])),
    [accounts]
  )
  const contactNamesByAddr = useMemo(
    () => new Map(contacts.map((contact) => [contact.address.toLowerCase(), contact.name])),
    [contacts]
  )

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
    // In a full width web sheet, the sheet takes the height of this view rather than filling
    // a fixed one, see `AccountKeysBottomSheet`
    <View style={isWeb ? { maxHeight: 384, ...(!isFullWidthSheet && flexbox.flex1) } : undefined}>
      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
        {isWeb && <PanelBackButton onPress={closeBottomSheet} style={spacings.mrSm} />}
        <PanelTitle
          title={
            account.safeCreation
              ? t('{{accName}} owners', { accName: account.preferences.label })
              : t('{{accName}} keys', { accName: account.preferences.label })
          }
          style={isWeb ? text.left : text.center}
        />
      </View>
      <ScrollView
        bounces={isMobile}
        style={[!!withAlert && spacings.mb, isWeb && !isFullWidthSheet && flexbox.flex1]}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={isWeb}
      >
        {accountKeys.map((accountKey, index) => {
          const { type, addr, isImported, meta, dedicatedToOneSA, label } = accountKey
          const isLast = index === accountKeys.length - 1
          const accountKeyProps = { addr, type, isLast, isImported }
          const ownerAccount = accountsByAddr.get(addr.toLowerCase())
          // The key label ("Key 2") tells the least, so it is shown only when there is no other name
          const name =
            contactNamesByAddr.get(addr.toLowerCase()) || ownerAccount?.preferences.label || label

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
              onRemoveKeyPress={
                isKeyRemovable(accountKey, removableKeys) ? handleRemoveKeyPress : undefined
              }
              isSupported={accountKey.isSupported}
              onChains={safeOwnersByNetwork[addr]}
              // The owners of a Safe are often accounts of their own, so they are shown like
              // the account list. Any other account's keys keep the compact rows
              withNameAndAddress={!!account.safeCreation}
              name={name}
              ownerAccount={ownerAccount}
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
        style={isCompactLayout ? undefined : WIDE_LAYOUT_SHEET_STYLE}
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
        style={isCompactLayout ? undefined : REMOVE_KEY_SHEET_STYLE}
        onClosed={handleRemoveKeyClosed}
      >
        {!!keyToRemove && (
          <RemoveKey
            keyToRemove={keyToRemove}
            isSafeOwner={!!account.safeCreation}
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
