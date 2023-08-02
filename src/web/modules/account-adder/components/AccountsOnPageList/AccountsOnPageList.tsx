import AccountAdderController from 'ambire-common/src/controllers/accountAdder/accountAdder'
import groupBy from 'lodash/groupBy'
import React, { useMemo, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import LeftDoubleArrowIcon from '@common/assets/svg/LeftDoubleArrowIcon.tsx'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import RightDoubleArrowIcon from '@common/assets/svg/RightDoubleArrowIcon'
import Button from '@common/components/Button'
import Select from '@common/components/Select'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import Toggle from '@common/components/Toggle'
import Wrapper from '@common/components/Wrapper'
import { useTranslation } from '@common/config/localization'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import Account from '@web/modules/account-adder/components/Account'
import Slot from '@web/modules/account-adder/components/Slot'

const LIST_ITEM_HEIGHT = 70
const LIST_ITEM_GUTTER = 10
export const SMALL_PAGE_STEP = 1
export const LARGE_PAGE_STEP = 10

const AccountsList = ({
  state,
  onImportReady,
  enableCreateEmailVault,
  onCreateEmailVaultStep,
  setPage
}: {
  state: AccountAdderController
  onImportReady: () => void
  enableCreateEmailVault?: boolean
  onCreateEmailVaultStep?: () => void
  setPage: (page: number) => void
}) => {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [emailVaultStep, setEmailVaultStep] = useState(false)
  const [showUnused, setShowUnused] = useState(false)

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

  const disablePagination = Object.keys(slots).length === 1

  const getFilteredAccounts = (accounts: any) => {
    const filteredAccounts = accounts.filter((a: any) => {
      if (!showUnused && a.type === 'legacy' && !a.account.usedOnNetworks.length) return false
      return true
    })
    return filteredAccounts.map((acc: any, i: any) => (
      <Account
        key={acc.account.addr}
        account={acc.account}
        type={acc.type}
        isLastInSlot={i === filteredAccounts.length - 1}
      />
    ))
  }

  return (
    <View>
      <View style={[flexbox.alignCenter]}>
        {enableCreateEmailVault && (
          <Toggle
            isOn={emailVaultStep}
            onToggle={() => {
              setEmailVaultStep(true)
              onCreateEmailVaultStep && onCreateEmailVaultStep()
            }}
            label="Enable email recovery for new Smart Accounts"
          />
        )}
        <Wrapper
          contentContainerStyle={{
            height: LIST_ITEM_HEIGHT * 5 + LIST_ITEM_GUTTER * 4,
            ...spacings.pt0,
            ...spacings.phSm
          }}
        >
          {state.accountsLoading ? (
            <View
              style={[
                flexbox.alignCenter,
                flexbox.flex1,
                flexbox.alignCenter,
                flexbox.justifyCenter
              ]}
            >
              <Spinner style={{ width: 28, height: 28 }} />
            </View>
          ) : (
            Object.keys(slots).map((key) => (
              <Slot key={key} slot={+key + (state.page - 1) * state.pageSize}>
                {getFilteredAccounts(slots[key])}
              </Slot>
            ))
          )}
        </Wrapper>

        <View
          style={[
            flexbox.alignCenter,
            spacings.ptSm,
            { opacity: state.linkedAccountsLoading ? 1 : 0 }
          ]}
        >
          <View style={[spacings.mbTy, flexbox.alignCenter, flexbox.directionRow]}>
            <Spinner style={{ width: 16, height: 16 }} />
            <Text color={colors.violet} style={[spacings.mlSm]} fontSize={12}>
              {t('Looking for linked smart accounts')}
            </Text>
          </View>
        </View>

        <View
          style={[flexbox.directionRow, flexbox.justifyCenter, flexbox.alignCenter, spacings.pv]}
        >
          <TouchableOpacity
            onPress={handleLargePageStepDecrement}
            disabled={state.page <= LARGE_PAGE_STEP || disablePagination}
            style={state.page <= (LARGE_PAGE_STEP || disablePagination) && { opacity: 0.6 }}
          >
            <LeftDoubleArrowIcon />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSmallPageStepDecrement}
            disabled={state.page === 1 || disablePagination}
            style={(state.page === 1 || disablePagination) && { opacity: 0.6 }}
          >
            <LeftArrowIcon width={36} height={36} style={[spacings.mlTy]} />
          </TouchableOpacity>
          <Text style={spacings.ph}>
            {state.page > 2 && <Text>{'...  '}</Text>}
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
            style={(state.accountsLoading || disablePagination) && { opacity: 0.6 }}
            disabled={state.accountsLoading || disablePagination}
            onPress={handleSmallPageStepIncrement}
          >
            <RightArrowIcon style={[spacings.mrTy]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={(state.accountsLoading || disablePagination) && { opacity: 0.6 }}
            disabled={state.accountsLoading || disablePagination}
            onPress={handleLargePageStepIncrement}
          >
            <RightDoubleArrowIcon />
          </TouchableOpacity>
        </View>
        {!enableCreateEmailVault && (
          <>
            <Toggle label="Show unused legacy accounts" onToggle={() => setShowUnused((p) => !p)} />
            <Select
              hasArrow
              options={[
                { label: 'Swap', value: 'Swap' },
                { label: 'Bridge', value: 'Bridge' },
                { label: 'Top Up Gas Tank', value: 'Top Up Gas Tank' },
                { label: 'Deposit', value: 'Deposit' }
              ]}
              setValue={setValue}
              value={value}
              menuPlacement="top"
              label="Custom Derivation"
            />
          </>
        )}
        <Button
          style={{ ...spacings.mtTy, width: 296, ...flexbox.alignSelfCenter }}
          onPress={onImportReady}
          text="Import Accounts"
        />
      </View>
    </View>
  )
}

export default React.memo(AccountsList)
