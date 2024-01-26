import { Mnemonic } from 'ethers'
import groupBy from 'lodash/groupBy'
import React, { useCallback, useMemo, useState } from 'react'
import { Dimensions, ScrollView, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import AccountAdderController from '@ambire-common/controllers/accountAdder/accountAdder'
import { Account as AccountInterface } from '@ambire-common/interfaces/account'
import { isValidPrivateKey } from '@ambire-common/libs/keyIterator/keyIterator'
import Alert from '@common/components/Alert'
import Badge from '@common/components/Badge'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Pagination from '@common/components/Pagination'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import Toggle from '@common/components/Toggle'
import Wrapper from '@common/components/Wrapper'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { tabLayoutWidths } from '@web/components/TabLayoutWrapper'
import useBackgroundService from '@web/hooks/useBackgroundService'
import Account from '@web/modules/account-adder/components/Account'
import { HARDWARE_WALLET_DEVICE_NAMES } from '@web/modules/hardware-wallet/constants/names'

const AccountsList = ({
  state,
  setPage,
  keyType,
  privKeyOrSeed,
  lookingForLinkedAccounts
}: {
  state: AccountAdderController
  setPage: (page: number) => void
  keyType: string
  privKeyOrSeed?: string
  lookingForLinkedAccounts: boolean
}) => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const { theme } = useTheme()
  const [containerHeight, setContainerHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)
  const [modalContainerHeight, setModalContainerHeight] = useState(0)
  const [modalContentHeight, setModalContentHeight] = useState(0)
  const [hideEmptyAccounts, setHideEmptyAccounts] = useState(false)
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { maxWidthSize } = useWindowSize()

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

  const disablePagination = Object.keys(slots).length === 1

  const getType = useCallback((acc: any) => {
    if (!acc.account.creation) return 'legacy'
    if (acc.isLinked) return 'linked'

    return 'smart'
  }, [])

  const linkedAccounts = useMemo(() => {
    if (lookingForLinkedAccounts) return []
    return state.accountsOnPage.filter((a) => getType(a) === 'linked')
  }, [state.accountsOnPage, getType, lookingForLinkedAccounts])

  const numberOfSelectedLinkedAccounts = useMemo(() => {
    return linkedAccounts.filter((lAcc) =>
      state.selectedAccounts.map((sAcc) => sAcc.account.addr).includes(lAcc.account.addr)
    ).length
  }, [linkedAccounts, state.selectedAccounts])

  const hasScroll = useMemo(() => contentHeight > containerHeight, [contentHeight, containerHeight])
  const shouldEnablePagination = useMemo(() => Object.keys(slots).length >= 5, [slots])

  const hasModalScroll = useMemo(
    () => modalContentHeight > modalContainerHeight,
    [modalContentHeight, modalContainerHeight]
  )

  const getAccounts = useCallback(
    (
      accounts: any,
      shouldCheckForLastAccountInTheList: boolean = false,
      byType: ('legacy' | 'linked' | 'smart')[] = ['legacy', 'smart']
    ) => {
      const filteredAccounts = accounts.filter((a: any) => byType.includes(getType(a)))
      return filteredAccounts.map((acc: any, i: number) => {
        let hasBottomSpacing = true
        if (shouldCheckForLastAccountInTheList && i === filteredAccounts.length - 1) {
          hasBottomSpacing = false
        }

        const isSelected = state.selectedAccounts.some(
          (selectedAcc) => selectedAcc.account.addr === acc.account.addr
        )
        const isPreselected = state.preselectedAccounts.some(
          (selectedAcc) => selectedAcc.addr === acc.account.addr
        )

        if (hideEmptyAccounts && getType(acc) === 'legacy' && !acc.account.usedOnNetworks.length) {
          return null
        }

        return (
          <Account
            key={acc.account.addr}
            account={acc.account}
            type={getType(acc)}
            withBottomSpacing={hasBottomSpacing}
            unused={!acc.account.usedOnNetworks.length}
            isSelected={isSelected || isPreselected}
            isDisabled={isPreselected}
            onSelect={handleSelectAccount}
            onDeselect={handleDeselectAccount}
          />
        )
      })
    },
    [
      handleDeselectAccount,
      handleSelectAccount,
      hideEmptyAccounts,
      state.preselectedAccounts,
      state.selectedAccounts,
      getType
    ]
  )

  const setTitle = useCallback(() => {
    if (keyType !== 'internal') {
      return t('Import Accounts From {{ hwDeviceName }}', {
        hwDeviceName: HARDWARE_WALLET_DEVICE_NAMES[keyType]
      })
    }

    if (privKeyOrSeed && Mnemonic.isValidMnemonic(privKeyOrSeed)) {
      return t('Import Accounts from Seed Phrase')
    }

    if (privKeyOrSeed && isValidPrivateKey(privKeyOrSeed)) {
      return t('Import Accounts from Private Key')
    }

    return t('Select Accounts To Import')
  }, [keyType, privKeyOrSeed, t])

  return (
    <View style={flexbox.flex1}>
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
              {t('Selected ({{numOfAccounts}}) linked accounts on this page', {
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
              <Badge type="info" withIcon text="linked" />
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
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        scrollViewProps={{
          scrollEnabled: false
        }}
        containerInnerWrapperStyles={{ maxHeight: Dimensions.get('window').height * 0.65 }}
        style={{ maxWidth: tabLayoutWidths.lg, backgroundColor: theme.primaryBackground }}
      >
        <Text style={spacings.mbMd} weight="medium" fontSize={20}>
          {t('Add Linked Accounts')}
        </Text>
        <Alert type="info" style={spacings.mbTy}>
          <Text fontSize={16} style={flexbox.flex1} appearance="infoText">
            {t(
              'Linked smart accounts are accounts that were not originally created with this key or Ambire V.1, but this key is authorized to control and sign transactions for that linked smart account on one or more networks.'
            )}
          </Text>
        </Alert>
        <Alert
          type="warning"
          style={{ ...spacings.mbLg, alignSelf: 'stretch' }}
          title={t('Do not add linked accounts you are not aware of!')}
        />

        <ScrollView
          onLayout={(e) => {
            setModalContainerHeight(e.nativeEvent.layout.height)
          }}
          onContentSizeChange={(_, height) => {
            setModalContentHeight(height)
          }}
          contentContainerStyle={{
            ...spacings?.[hasModalScroll ? 'prSm' : 'pr0']
          }}
        >
          {getAccounts(linkedAccounts, true, ['linked'])}
        </ScrollView>
        <View
          style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyEnd, spacings.ptXl]}
        >
          <Button size="large" text={t('Done')} onPress={closeBottomSheet as any} />
        </View>
      </BottomSheet>

      <View style={[spacings.mbLg, flexbox.alignStart]}>
        <Toggle
          isOn={hideEmptyAccounts}
          onToggle={() => setHideEmptyAccounts((p) => !p)}
          label={t('Hide empty legacy accounts')}
          labelProps={{ appearance: 'secondaryText', weight: 'medium' }}
        />
      </View>
      <Wrapper
        style={shouldEnablePagination && spacings.mbLg}
        contentContainerStyle={{
          flexGrow: 1,
          ...spacings.pt0,
          ...spacings.pl0,
          ...spacings?.[hasScroll ? 'prSm' : 'pr0']
        }}
        onLayout={(e) => {
          setContainerHeight(e.nativeEvent.layout.height)
        }}
        onContentSizeChange={(_, height) => {
          setContentHeight(height)
        }}
      >
        {state.accountsLoading ? (
          <View
            style={[flexbox.alignCenter, flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}
          >
            <Spinner style={{ width: 28, height: 28 }} />
          </View>
        ) : (
          Object.keys(slots).map((key, i) => {
            return (
              <View key={key}>{getAccounts(slots[key], i === Object.keys(slots).length - 1)}</View>
            )
          })
        )}
      </Wrapper>
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
        {!!shouldEnablePagination && (
          <Pagination
            page={state.page}
            setPage={setPage}
            isDisabled={state.accountsLoading || disablePagination}
          />
        )}
      </View>
    </View>
  )
}

export default React.memo(AccountsList)
