import { uniqBy } from 'lodash'
import groupBy from 'lodash/groupBy'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { NativeScrollEvent, Platform, View } from 'react-native'

import {
  Account as AccountInterface,
  AccountOnPage,
  ImportStatus
} from '@ambire-common/interfaces/account'
import { IAccountPickerController } from '@ambire-common/interfaces/accountPicker'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Alert from '@common/components/Alert'
import Badge from '@common/components/Badge'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Pagination from '@common/components/Pagination'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import Account from '@common/modules/account-picker/components/Account'
import AnimatedDownArrow from '@common/modules/account-picker/components/AccountsOnPageList/AnimatedDownArrow/AnimatedDownArrow'
import AccountsRetrieveError from '@common/modules/account-picker/components/AccountsRetrieveError'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import getStyles from './styles'

const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
  const paddingToBottom = 20
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom
}

type Props = {
  state: IAccountPickerController
  setPage: (page: number) => void
  subType: IAccountPickerController['subType']
  isLoading: boolean
  lookingForLinkedAccounts: boolean
  children?: any
}

const isMobile = Platform.OS === 'ios' || Platform.OS === 'android'

const AccountsOnPageList = ({
  state,
  setPage,
  subType,
  isLoading,
  lookingForLinkedAccounts,
  children
}: Props) => {
  const { t } = useTranslation()
  const { networks: allNetworks } = useController('NetworksController').state
  const { state: accountPickerState, dispatch: accountPickerDispatch } =
    useController('AccountPickerController')
  const [hasReachedBottom, setHasReachedBottom] = useState<null | boolean>(null)
  const [containerHeight, setContainerHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)
  const { styles, theme } = useTheme(getStyles)

  const slots = useMemo(() => {
    return groupBy(
      [
        ...state.accountsOnPage.filter((a) => !a.isLinked),
        // A linked account with the same address could have multiple Basic accounts
        // added as keys. Therefore, it could appear multiple times in the list.
        // In this case, show it only one time. When it gets selected, all keys
        // will get selected (and later on, imported) below the hood.
        ...uniqBy(
          state.accountsOnPage.filter((a) => a.isLinked),
          (a) => a.account.addr
        )
      ],
      'slot'
    )
  }, [state.accountsOnPage])

  const hasLinkedAccounts = useMemo(
    () => state.accountsOnPage.some((a) => a.isLinked),
    [state.accountsOnPage]
  )

  const handleSelectAccount = useCallback(
    (account: AccountInterface) => {
      accountPickerDispatch({
        type: 'method',
        params: { method: 'selectAccount', args: [account] }
      })
    },
    [accountPickerDispatch]
  )

  const handleDeselectAccount = useCallback(
    (account: AccountInterface) => {
      accountPickerDispatch({
        type: 'method',
        params: { method: 'deselectAccount', args: [account] }
      })
    },
    [accountPickerDispatch]
  )

  const handleRetryFindingLinkedAccounts = useCallback(() => {
    accountPickerDispatch({
      type: 'method',
      params: {
        method: 'findAndSetLinkedAccounts',
        args: []
      }
    })
  }, [accountPickerDispatch])

  const getType = useCallback((acc: any) => {
    if (!acc.account.creation) return 'basic'
    if (acc.isLinked) return 'linked'

    return 'smart'
  }, [])

  const isImportingFromPrivateKey = subType === 'private-key'

  const getAccounts = useCallback(
    ({
      accounts,
      isLastSlot = false,
      byType = ['basic', 'smart']
    }: {
      accounts: AccountOnPage[]
      isLastSlot?: boolean
      slotIndex?: number
      byType?: ('basic' | 'linked' | 'smart')[]
    }) => {
      const filteredAccounts = accounts.filter((a) => byType.includes(getType(a)))

      return filteredAccounts.map((acc, i: number) => {
        const hasBottomSpacing = !(isLastSlot && i === filteredAccounts.length - 1)
        const isUnused =
          Array.isArray(acc.account.usedOnNetworks) && !acc.account.usedOnNetworks.length
        const isSelected = state.selectedAccounts.some(
          (selectedAcc) => selectedAcc.account.addr === acc.account.addr
        )

        return (
          <Account
            key={acc.account.addr}
            account={acc.account}
            type={getType(acc)}
            withBottomSpacing={hasBottomSpacing}
            unused={isUnused}
            isSelected={isSelected}
            importStatus={acc.importStatus}
            onSelect={handleSelectAccount}
            onDeselect={handleDeselectAccount}
            displayTypeBadge={false}
            displayTypePill={getType(acc) === 'linked'}
            // Only show "new" badge for the last unused smart account.
            // Otherwise, multiple smart accounts could be displayed as "new",
            // because they could have identity on the Relayer, but still be unused.
            shouldBeDisplayedAsNew={
              isLastSlot &&
              getType(acc) === 'smart' &&
              isUnused &&
              acc.importStatus === ImportStatus.NotImported
            }
          />
        )
      })
    },
    [getType, state.selectedAccounts, handleSelectAccount, handleDeselectAccount]
  )

  const networkNamesWithAccountStateError = useMemo(() => {
    return accountPickerState.networksWithAccountStateError.map((chainId) => {
      return allNetworks.find((n) => n.chainId === chainId)?.name
    })
  }, [accountPickerState.networksWithAccountStateError, allNetworks])

  // Empty means it's not loading and no accounts on the current page are derived.
  // Should rarely happen - if the deriving request gets cancelled on the device
  // or if something goes wrong with deriving in general.
  const isAccountPickerEmpty = useMemo(
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
    ) {
      if (hasReachedBottom) return

      setHasReachedBottom(contentHeight === containerHeight)
      return
    }

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

  const shouldDisplayAnimatedDownArrow =
    typeof hasReachedBottom === 'boolean' &&
    !hasReachedBottom &&
    !state.accountsLoading &&
    !isAccountPickerEmpty &&
    !state.pageError

  // Prevents the user from temporarily seeing (flashing) empty (error) states
  // while being navigated back (resetting the Account Picker state).
  if (!state.isInitialized) return null

  return (
    <View style={[spacings.ptTy, flexbox.flex1]} nativeID="account-picker-page-list">
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
          style={[isMobile ? spacings.mbMd : spacings.mbLg]}
          contentContainerStyle={{ flexGrow: 1 }}
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
          {!isLoading && (isAccountPickerEmpty || !!accountPickerState.pageError) && (
            <AccountsRetrieveError
              pageError={accountPickerState.pageError}
              page={accountPickerState.page}
              setPage={setPage}
            />
          )}
          {state.accountsLoading || !!isLoading ? (
            <View style={[flexbox.flex1, flexbox.center, spacings.mt2Xl]}>
              <Spinner style={styles.spinner} />
            </View>
          ) : (
            <>
              <View style={[!isMobile && spacings.phSm, isMobile ? spacings.pbMd : spacings.pbLg]}>
                {Object.keys(slots).map((key, i) => {
                  return (
                    <View key={key}>
                      {getAccounts({
                        accounts: slots[key] || [],
                        isLastSlot: i === Object.keys(slots).length - 1,
                        slotIndex: 1,
                        byType: ['basic']
                      })}
                    </View>
                  )
                })}
              </View>
              {!!Object.keys(slots).length && (
                <View style={[styles.smartAccountWrapper, isMobile && spacings.ptSm]}>
                  <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbSm]}>
                    <Text fontSize={16} weight="medium" style={[text.center, spacings.mrTy]}>
                      {t('Smart accounts')}
                      {/* TODO: Add an info icon here with a tooltip */}
                    </Text>
                    <View
                      style={[
                        flexbox.directionRow,
                        flexbox.justifySpaceBetween,
                        flexbox.alignCenter
                      ]}
                    >
                      {lookingForLinkedAccounts && (
                        <View style={[flexbox.alignCenter, flexbox.directionRow]}>
                          <Spinner
                            style={{ width: isMobile ? 14 : 16, height: isMobile ? 14 : 16 }}
                          />
                          <Text appearance="primary" style={[spacings.mlTy]} fontSize={12}>
                            {t(`Looking for linked ${!isMobile ? 'smart ' : ''}accounts`)}
                          </Text>
                        </View>
                      )}
                      {!isMobile && !lookingForLinkedAccounts && hasLinkedAccounts && (
                        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                          <Badge
                            type="info"
                            size="md"
                            withRightSpacing
                            text={`Linked Smart Account (found on page ${state.page})`}
                            tooltipText="Linked smart accounts are accounts that were not created with a given key originally, but this key was authorized for that given account on any supported network."
                          />

                          <WarningIcon
                            color={theme.warning300}
                            dataSet={createGlobalTooltipDataSet({
                              id: 'linked-accounts-warning',
                              style: {
                                backgroundColor: theme.warningBackground as string,
                                color: theme.warningText as string
                              },
                              content: t('Do not add linked accounts you are not aware of!')
                            })}
                          />
                        </View>
                      )}
                    </View>
                  </View>

                  {isMobile && !lookingForLinkedAccounts && hasLinkedAccounts && (
                    <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mb]}>
                      <Badge
                        type="info"
                        size="md"
                        withRightSpacing
                        text={`Linked Smart Account (found on page ${state.page})`}
                        tooltipText={
                          isMobile
                            ? undefined
                            : 'Linked smart accounts are accounts that were not created with a given key originally, but this key was authorized for that given account on any supported network.'
                        }
                      />
                    </View>
                  )}

                  {Object.keys(slots).map((key, i) => {
                    return (
                      <View key={key}>
                        {getAccounts({
                          accounts: slots[key] || [],
                          isLastSlot: i === Object.keys(slots).length - 1,
                          slotIndex: 1,
                          byType: ['smart', 'linked']
                        })}
                      </View>
                    )
                  })}

                  {!!accountPickerState.linkedAccountsError && (
                    <Alert
                      type="warning"
                      text={accountPickerState.linkedAccountsError}
                      buttonProps={{
                        onPress: handleRetryFindingLinkedAccounts,
                        text: t('Retry'),
                        type: 'warning'
                      }}
                    />
                  )}
                </View>
              )}
              {isMobile && (
                <View
                  style={[
                    flexbox.flex1,
                    flexbox.justifyEnd,
                    flexbox.alignCenter,
                    spacings.mtLg,
                    spacings.mbTy
                  ]}
                >
                  {!isImportingFromPrivateKey && (
                    <Pagination
                      page={state.page}
                      maxPages={1000}
                      setPage={setPage}
                      isDisabled={state.accountsLoading}
                      hideLastPage
                    />
                  )}
                </View>
              )}
            </>
          )}
        </ScrollableWrapper>
        <AnimatedDownArrow isVisible={shouldDisplayAnimatedDownArrow} />
      </View>
      {!isMobile && (
        <View style={[flexbox.alignEnd, spacings.mbMd]}>
          {!isImportingFromPrivateKey && (
            <Pagination
              page={state.page}
              maxPages={1000}
              setPage={setPage}
              isDisabled={state.accountsLoading}
              hideLastPage
            />
          )}
        </View>
      )}
      {children}
    </View>
  )
}

export default React.memo(AccountsOnPageList)
