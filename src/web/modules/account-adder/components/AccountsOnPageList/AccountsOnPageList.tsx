import groupBy from 'lodash/groupBy'
import React, { useCallback, useMemo } from 'react'
import { Dimensions, Pressable, TouchableOpacity, View } from 'react-native'

import { HD_PATHS, HDPath } from '@ambire-common/consts/derivation'
import AccountAdderController from '@ambire-common/controllers/accountAdder/accountAdder'
import { Account as AccountInterface } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import Wrapper from '@common/components/Wrapper'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useBackgroundService from '@web/hooks/useBackgroundService'
import Account from '@web/modules/account-adder/components/Account'
import Slot from '@web/modules/account-adder/components/Slot'

import styles from './styles'

const LIST_ITEM_HEIGHT = 78
const LIST_ITEM_GUTTER = 10
export const SMALL_PAGE_STEP = 1
export const LARGE_PAGE_STEP = 10

const hwDeviceNames: { [key in Exclude<Key['type'], 'internal'>]: string } = {
  ledger: 'Ledger',
  trezor: 'Trezor',
  lattice: 'GridPlus Lattice1'
}

const AccountsList = ({
  state,
  setPage,
  keyType
}: {
  state: AccountAdderController
  setPage: (page: number) => void
  keyType: string
}) => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()

  const getDerivationLabel = (_path: HDPath['path']) => {
    const path = HD_PATHS.find((x) => x.path === _path)

    return path ? path.label : _path
  }

  const slots = useMemo(() => {
    return groupBy(state.accountsOnPage, 'slot')
  }, [state.accountsOnPage])

  const handleSmallPageStepDecrement = () => {
    setPage(state.page - SMALL_PAGE_STEP)
  }

  const handleSmallPageStepIncrement = () => {
    setPage(state.page + SMALL_PAGE_STEP)
  }

  const handleLargePageStepDecrement = () => {
    setPage(state.page - LARGE_PAGE_STEP)
  }

  const handleLargePageStepIncrement = () => {
    setPage(state.page + LARGE_PAGE_STEP)
  }

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

  const setType = (acc: any) => {
    if (!acc.account.creation) return 'legacy'
    if (acc.isLinked) return 'linked'

    return 'smart'
  }

  const numberOfVisibleItems = useMemo(() => (Dimensions.get('window').height < 810 ? 4 : 5), [])

  // TODO: this is a temp solution because Dimensions gets the static sizes of the window and doesn't update dynamically
  const listHeight = useMemo(
    () =>
      Dimensions.get('window').height < 810
        ? LIST_ITEM_HEIGHT * numberOfVisibleItems + LIST_ITEM_GUTTER * (numberOfVisibleItems - 1)
        : LIST_ITEM_HEIGHT * numberOfVisibleItems + LIST_ITEM_GUTTER * (numberOfVisibleItems - 1),
    [numberOfVisibleItems]
  )

  const getAccounts = (accounts: any) => {
    return accounts.map((acc: any, i: any) => {
      const isSelected = state.selectedAccounts.some(
        (selectedAcc) => selectedAcc.addr === acc.account.addr
      )
      const isPreselected = state.preselectedAccounts.some(
        (selectedAcc) => selectedAcc.addr === acc.account.addr
      )

      return (
        <Account
          key={acc.account.addr}
          account={acc.account}
          type={setType(acc)}
          isLastInSlot={i === accounts.length - 1}
          unused={!acc.account.creation && !acc.account.usedOnNetworks.length}
          isSelected={isSelected || isPreselected}
          isDisabled={isPreselected}
          onSelect={handleSelectAccount}
          onDeselect={handleDeselectAccount}
        />
      )
    })
  }

  return (
    <View>
      <View
        style={[
          spacings.mbLg,
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          { minHeight: 40 }
        ]}
      >
        <Text
          fontSize={20}
          weight="medium"
          appearance="primaryText"
          numberOfLines={1}
          style={spacings.mrTy}
        >
          {keyType === 'internal'
            ? t('Pick Accounts To Import')
            : t('Import Account From {{ hwDeviceName }}', {
                hwDeviceName: hwDeviceNames[keyType]
              })}
        </Text>
        {/* TODO: impl change derivation and move this into a separate component */}
        {state.accountsLoading ? null : (
          <Pressable style={styles.derivationButton} disabled>
            <View style={styles.derivationButtonInfo}>
              <Text weight="medium" fontSize={14}>
                {state.hdPathTemplate && getDerivationLabel(state.hdPathTemplate)}{' '}
              </Text>
            </View>
            <DownArrowIcon />
          </Pressable>
        )}
      </View>
      <Wrapper
        style={spacings.mbLg}
        contentContainerStyle={{
          height: listHeight,
          ...spacings.pt0,
          ...spacings.pl0,
          ...spacings?.[state.accountsOnPage.length > numberOfVisibleItems ? 'prSm' : 'pr0']
        }}
      >
        {state.accountsLoading ? (
          <View
            style={[flexbox.alignCenter, flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}
          >
            <Spinner style={{ width: 28, height: 28 }} />
          </View>
        ) : (
          Object.keys(slots).map((key) => {
            return (
              <Slot key={key} slot={+key}>
                {getAccounts(slots[key])}
              </Slot>
            )
          })
        )}
      </Wrapper>

      <View style={[flexbox.directionRow, flexbox.justifyEnd, flexbox.alignCenter]}>
        <TouchableOpacity
          onPress={handleLargePageStepDecrement}
          disabled={state.page <= LARGE_PAGE_STEP || disablePagination}
          style={[
            spacings.mrLg,
            state.page <= (LARGE_PAGE_STEP || disablePagination) && { opacity: 0.4 }
          ]}
        >
          <View style={flexbox.directionRow}>
            <LeftArrowIcon />
            <LeftArrowIcon />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSmallPageStepDecrement}
          disabled={state.page === 1 || disablePagination}
          style={(state.page === 1 || disablePagination) && { opacity: 0.4 }}
        >
          <LeftArrowIcon />
        </TouchableOpacity>
        <Text style={spacings.phLg}>
          {state.page > 2 && <Text>...</Text>}
          {state.page === 1 && (
            <Text>
              <Text weight="semiBold">{state.page}</Text>
              <Text>{`  ${state.page + 1}  ${state.page + 2}`}</Text>
            </Text>
          )}
          {state.page !== 1 && (
            <Text>
              <Text>{`  ${state.page - 1}  `}</Text>
              <Text weight="semiBold">{state.page}</Text>
              <Text>{`  ${state.page + 1}`}</Text>
            </Text>
          )}
          <Text>{'  ...'}</Text>
        </Text>
        <TouchableOpacity
          style={[spacings.mrLg, (state.accountsLoading || disablePagination) && { opacity: 0.4 }]}
          disabled={state.accountsLoading || disablePagination}
          onPress={handleSmallPageStepIncrement}
        >
          <RightArrowIcon />
        </TouchableOpacity>
        <TouchableOpacity
          style={(state.accountsLoading || disablePagination) && { opacity: 0.4 }}
          disabled={state.accountsLoading || disablePagination}
          onPress={handleLargePageStepIncrement}
        >
          <View style={flexbox.directionRow}>
            <RightArrowIcon />
            <RightArrowIcon />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default React.memo(AccountsList)
