import { uniqBy } from 'lodash'
import groupBy from 'lodash/groupBy'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Dimensions, NativeScrollEvent, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import AccountAdderController from '@ambire-common/controllers/accountAdder/accountAdder'
import {
  Account as AccountInterface,
  AccountOnPage,
  ImportStatus
} from '@ambire-common/interfaces/account'
import Alert from '@common/components/Alert'
import BadgeWithPreset from '@common/components/BadgeWithPreset'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Pagination from '@common/components/Pagination'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import Toggle from '@common/components/Toggle'
import { useTranslation } from '@common/config/localization'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { tabLayoutWidths } from '@web/components/TabLayoutWrapper'
import useAccountAdderControllerState from '@web/hooks/useAccountAdderControllerState'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import Account from '@web/modules/account-adder/components/Account'
import AccountsRetrieveError from '@web/modules/account-adder/components/AccountsRetrieveError'
import ChangeHdPath from '@web/modules/account-adder/components/ChangeHdPath'
import {
  AccountAdderIntroStepsProvider,
  BasicAccountIntroId
} from '@web/modules/account-adder/contexts/accountAdderIntroStepsContext'
import { HARDWARE_WALLET_DEVICE_NAMES } from '@web/modules/hardware-wallet/constants/names'

import AnimatedDownArrow from './AnimatedDownArrow/AnimatedDownArrow'
import styles from './styles'

const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
  const paddingToBottom = 20
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom
}

const AccountsOnPageList = ({
  state,
  setPage,
  keyType,
  subType,
  lookingForLinkedAccounts
}: {
  state: AccountAdderController
  setPage: (page: number) => void
  keyType: AccountAdderController['type']
  subType: AccountAdderController['subType']
  lookingForLinkedAccounts: boolean
}) => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const accountsState = useAccountsControllerState()
  const keystoreState = useKeystoreControllerState()
  const { networks } = useNetworksControllerState()
  const accountAdderState = useAccountAdderControllerState()
  const [onlySmartAccountsVisible, setOnlySmartAccountsVisible] = useState(!!subType)
  const [hasReachedBottom, setHasReachedBottom] = useState<null | boolean>(null)
  const [containerHeight, setContainerHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { maxWidthSize } = useWindowSize()
  const [hideEmptyAccounts, setHideEmptyAccounts] = useState(false)

  const slots = useMemo(() => {
    return groupBy(state.accountsOnPage, 'slot')
  }, [state.accountsOnPage])

  const handleSelectAccount = useCallback(
    (account: AccountInterface) => {
      dispatch({
        type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_SELECT_ACCOUNT',
        params: { account }
      })
    },
    [dispatch]
  )

  const handleDeselectAccount = useCallback(
    (account: AccountInterface) => {
      dispatch({
        type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_DESELECT_ACCOUNT',
        params: { account }
      })
    },
    [dispatch]
  )

  const getType = useCallback((acc: any) => {
    if (!acc.account.creation) return 'basic'
    if (acc.isLinked) return 'linked'

    return 'smart'
  }, [])

  const accountsWithKeys = useMemo(
    () =>
      accountsState.accounts.filter((acc) =>
        keystoreState.keys.some((k) => acc.associatedKeys.includes(k.addr))
      ),
    [keystoreState.keys, accountsState.accounts]
  )

  const linkedAccounts = useMemo(() => {
    if (lookingForLinkedAccounts) return []

    // A linked account with the same address could have multiple Basic accounts
    // added as keys. Therefore, it could appear multiple times in the list.
    // In this case, show it only one time. When it gets selected, all keys
    // will get selected (and later on, imported) below the hood.
    return uniqBy(
      state.accountsOnPage.filter((a) => getType(a) === 'linked'),
      (a) => a.account.addr
    )
  }, [state.accountsOnPage, getType, lookingForLinkedAccounts])

  const numberOfSelectedLinkedAccounts = useMemo(() => {
    return linkedAccounts.filter((lAcc) =>
      state.selectedAccounts.map((sAcc) => sAcc.account.addr).includes(lAcc.account.addr)
    ).length
  }, [linkedAccounts, state.selectedAccounts])

  const isImportingFromPrivateKey = subType === 'private-key'

  const getAccounts = useCallback(
    ({
      accounts,
      shouldCheckForLastAccountInTheList,
      slotIndex,
      byType = ['basic', 'smart']
    }: {
      accounts: AccountOnPage[]
      shouldCheckForLastAccountInTheList?: boolean
      slotIndex?: number
      byType?: ('basic' | 'linked' | 'smart')[]
    }) => {
      const filteredAccounts = accounts.filter(
        (a) =>
          byType.includes(getType(a)) &&
          !(hideEmptyAccounts && getType(a) === 'basic' && !a.account.usedOnNetworks.length)
      )

      if (filteredAccounts.some((a) => getType(a) === 'basic') && onlySmartAccountsVisible) {
        setOnlySmartAccountsVisible(false)
      }

      return filteredAccounts.map((acc, i: number) => {
        const hasBottomSpacing = !(
          shouldCheckForLastAccountInTheList && i === filteredAccounts.length - 1
        )
        const isUnused = !acc.account.usedOnNetworks.length
        const isSelected = state.selectedAccounts.some(
          (selectedAcc) => selectedAcc.account.addr === acc.account.addr
        )

        return (
          <Account
            key={acc.account.addr}
            account={acc.account}
            type={getType(acc)}
            shouldAddIntroStepsIds={
              ['basic', 'smart'].includes(getType(acc)) &&
              slotIndex === 0 &&
              !isImportingFromPrivateKey
            }
            withBottomSpacing={hasBottomSpacing}
            unused={isUnused}
            isSelected={isSelected || acc.importStatus === ImportStatus.ImportedWithTheSameKeys}
            isDisabled={acc.importStatus === ImportStatus.ImportedWithTheSameKeys}
            importStatus={acc.importStatus}
            onSelect={handleSelectAccount}
            onDeselect={handleDeselectAccount}
            displayTypeBadge={false}
          />
        )
      })
    },
    [
      onlySmartAccountsVisible,
      getType,
      hideEmptyAccounts,
      state.selectedAccounts,
      isImportingFromPrivateKey,
      handleSelectAccount,
      handleDeselectAccount
    ]
  )

  const setTitle = useCallback(() => {
    if (keyType && keyType !== 'internal') {
      return t('Import accounts from {{ hwDeviceName }}', {
        hwDeviceName: HARDWARE_WALLET_DEVICE_NAMES[keyType]
      })
    }

    if (subType === 'seed') {
      return accountAdderState.isInitializedWithSavedSeed
        ? t('Import accounts from saved seed phrase')
        : t('Import accounts from seed phrase')
    }

    if (subType === 'private-key') {
      return t('Select account(s) to import')
    }

    return t('Select accounts to import')
  }, [accountAdderState.isInitializedWithSavedSeed, keyType, subType, t])

  const networkNamesWithAccountStateError = useMemo(() => {
    return accountAdderState.networksWithAccountStateError.map((chainId) => {
      return networks.find((n) => n.chainId === chainId)?.name
    })
  }, [accountAdderState.networksWithAccountStateError, networks])

  // Empty means it's not loading and no accounts on the current page are derived.
  // Should rarely happen - if the deriving request gets cancelled on the device
  // or if something goes wrong with deriving in general.
  const isAccountAdderEmpty = useMemo(
    () => !state.accountsLoading && state.accountsOnPage.length === 0,
    [state.accountsLoading, state.accountsOnPage]
  )

  useEffect(() => {
    if (
      state.accountsLoading ||
      contentHeight === containerHeight ||
      !Object.keys(slots).length ||
      !containerHeight ||
      !contentHeight
    )
      return

    const isScrollNotVisible = contentHeight <= containerHeight

    if (setHasReachedBottom && !hasReachedBottom) setHasReachedBottom(isScrollNotVisible)
  }, [
    contentHeight,
    containerHeight,
    setHasReachedBottom,
    hasReachedBottom,
    state.accountsLoading,
    slots
  ])
  const disableHideEmptyAccountsToggle =
    state.accountsLoading || !!state.pageError || isAccountAdderEmpty
  const shouldDisplayChangeHdPath = !!(
    subType === 'seed' ||
    // TODO: Disabled for Trezor, because the flow that retrieves accounts
    // from the device as of v4.32.0 throws "forbidden key path" when
    // accessing non-"BIP44 Standard" paths. Alternatively, this could be
    // enabled in Trezor Suit (settings - safety checks), but even if enabled,
    // 1) user must explicitly allow retrieving each address (that means 25
    // clicks to retrieve accounts of the first 5 pages, blah) and 2) The
    // Trezor device shows a scarry note: "Wrong address path for selected
    // coin. Continue at your own risk!", which is pretty bad UX.
    (keyType && ['ledger', 'lattice'].includes(keyType))
  )

  const shouldDisplayAnimatedDownArrow =
    typeof hasReachedBottom === 'boolean' &&
    !hasReachedBottom &&
    !state.accountsLoading &&
    !isAccountAdderEmpty &&
    !state.pageError

  // Prevents the user from temporarily seeing (flashing) empty (error) states
  // while being navigated back (resetting the Account Adder state).
  if (!state.isInitialized) return null

  return (
    <AccountAdderIntroStepsProvider forceCompleted={!!accountsWithKeys.length}>
      <View style={flexbox.flex1} nativeID="account-adder-page-list">
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mb, { height: 40 }]}>
          <Text
            fontSize={maxWidthSize('xl') ? 20 : 18}
            weight="medium"
            appearance="primaryText"
            numberOfLines={1}
            style={[spacings.mrTy, flexbox.flex1]}
          >
            {setTitle()}
          </Text>
          {!!numberOfSelectedLinkedAccounts && (
            <Alert type="success" size="sm" style={{ ...spacings.pvTy, ...flexbox.alignCenter }}>
              <Text fontSize={16} appearance="successText">
                {numberOfSelectedLinkedAccounts === 1
                  ? t('Selected ({{numOfAccounts}}) linked account on this page', {
                      numOfAccounts: numberOfSelectedLinkedAccounts
                    })
                  : t('Selected ({{numOfAccounts}}) linked accounts on this page', {
                      numOfAccounts: numberOfSelectedLinkedAccounts
                    })}
              </Text>
            </Alert>
          )}
        </View>

        {!lookingForLinkedAccounts && !!linkedAccounts.length && (
          <Alert type="info" style={spacings.mbXl}>
            <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbTy]}>
              <Text fontSize={16} weight="semiBold" appearance="infoText" style={spacings.mr}>
                {t(`Linked Smart Account (found on page ${state.page})`)}
              </Text>
              <View style={flexbox.alignStart}>
                <BadgeWithPreset preset="linked" />
              </View>
            </View>
            <View style={[flexbox.directionRow, flexbox.alignEnd]}>
              <Text fontSize={12} style={[flexbox.flex1, spacings.mrXl]} appearance="infoText">
                {t(
                  'Linked smart accounts are accounts that were not created with a given key originally, but this key was authorized for that given account on any supported network.'
                )}
              </Text>
              <Button
                text={t('Show Linked Accounts')}
                hasBottomSpacing={false}
                size="small"
                type="secondary"
                onPress={openBottomSheet as any}
              />
            </View>
          </Alert>
        )}

        <BottomSheet
          id="linked-accounts"
          sheetRef={sheetRef}
          closeBottomSheet={closeBottomSheet}
          scrollViewProps={{
            scrollEnabled: false
          }}
          backgroundColor="primaryBackground"
          containerInnerWrapperStyles={{ maxHeight: Dimensions.get('window').height * 0.65 }}
          style={{ maxWidth: tabLayoutWidths.lg }}
        >
          <Text style={spacings.mbMd} weight="medium" fontSize={20}>
            {t('Add Linked Accounts')}
          </Text>
          <Alert type="info" style={spacings.mbTy}>
            <Text fontSize={16} style={flexbox.flex1} appearance="infoText">
              {t(
                'Linked smart accounts are accounts that were not originally created with this key or Ambire v1, but this key is authorized to control and sign transactions for that linked smart account on one or more networks.'
              )}
            </Text>
          </Alert>
          <Alert
            type="warning"
            style={{ ...spacings.mbLg, alignSelf: 'stretch' }}
            title={t('Do not add linked accounts you are not aware of!')}
          />

          <ScrollableWrapper>
            {getAccounts({
              accounts: linkedAccounts,
              shouldCheckForLastAccountInTheList: true,
              byType: ['linked']
            })}
          </ScrollableWrapper>
          <View
            style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyEnd, spacings.ptXl]}
          >
            <Button size="large" text={t('Done')} onPress={closeBottomSheet as any} />
          </View>
        </BottomSheet>

        {(!isImportingFromPrivateKey || shouldDisplayChangeHdPath) && (
          <View
            style={[
              spacings.mbLg,
              flexbox.directionRow,
              flexbox.justifySpaceBetween,
              { width: '100%' }
            ]}
            {...(!!hideEmptyAccounts && onlySmartAccountsVisible
              ? {
                  nativeID: BasicAccountIntroId
                }
              : {})}
          >
            {!isImportingFromPrivateKey && (
              <Toggle
                isOn={hideEmptyAccounts}
                onToggle={() => setHideEmptyAccounts((p) => !p)}
                disabled={disableHideEmptyAccountsToggle}
                label={t('Hide empty Basic Accounts')}
                testID="hide-empty-accounts-toggle"
                labelProps={{ appearance: 'secondaryText', weight: 'medium' }}
                style={flexbox.alignSelfStart}
              />
            )}
            {shouldDisplayChangeHdPath && <ChangeHdPath />}
          </View>
        )}
        <View style={flexbox.flex1}>
          {!!networkNamesWithAccountStateError.length && (
            <Alert
              type="warning"
              style={spacings.mbTy}
              title={`We cannot determine if your accounts are used on ${networkNamesWithAccountStateError.join(
                ', '
              )}`}
            />
          )}
          <ScrollableWrapper
            style={!isImportingFromPrivateKey && spacings.mbLg}
            contentContainerStyle={{
              flexGrow: 1
            }}
            onScroll={(e) => {
              if (isCloseToBottom(e.nativeEvent) && setHasReachedBottom) setHasReachedBottom(true)
            }}
            onLayout={(e) => {
              setContainerHeight(e.nativeEvent.layout.height)
            }}
            onContentSizeChange={(_, height) => {
              setContentHeight(height)
            }}
            scrollEventThrottle={400}
          >
            {(isAccountAdderEmpty || accountAdderState.pageError) && (
              <AccountsRetrieveError
                pageError={accountAdderState.pageError}
                page={accountAdderState.page}
                setPage={setPage}
              />
            )}
            {state.accountsLoading ? (
              <View style={[flexbox.flex1, flexbox.center, spacings.mt2Xl]}>
                <Spinner style={styles.spinner} />
              </View>
            ) : (
              Object.keys(slots).map((key, i) => {
                return (
                  <View key={key}>
                    {getAccounts({
                      accounts: slots[key],
                      shouldCheckForLastAccountInTheList: i === Object.keys(slots).length - 1,
                      slotIndex: i
                    })}
                  </View>
                )
              })
            )}
          </ScrollableWrapper>
          <AnimatedDownArrow isVisible={shouldDisplayAnimatedDownArrow} />
        </View>
        <View style={[flexbox.directionRow, flexbox.justifySpaceBetween, flexbox.alignCenter]}>
          <View
            style={[
              flexbox.alignCenter,
              spacings.ptSm,
              { opacity: lookingForLinkedAccounts ? 1 : 0 }
            ]}
          >
            <View style={[spacings.mbTy, flexbox.alignCenter, flexbox.directionRow]}>
              <Spinner style={{ width: 16, height: 16 }} />
              <Text appearance="primary" style={[spacings.mlSm]} fontSize={12}>
                {t('Looking for linked smart accounts')}
              </Text>
            </View>
          </View>
          {!isImportingFromPrivateKey && (
            <Pagination
              page={state.page}
              maxPages={1000}
              setPage={setPage}
              isDisabled={state.isPageLocked}
              hideLastPage
            />
          )}
        </View>
      </View>
    </AccountAdderIntroStepsProvider>
  )
}

export default React.memo(AccountsOnPageList)
