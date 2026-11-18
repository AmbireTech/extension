import React, { useCallback } from 'react'

import WalletIcon from '@common/assets/svg/WalletIcon'
import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectShouldSubtractBorrowedFunds = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.shouldSubtractBorrowedFunds

const BorrowedFundsControlOption = () => {
  const { t } = useTranslation()
  const { state: shouldSubtractBorrowedFunds, dispatch: selectedAccountDispatch } = useController(
    'SelectedAccountController',
    selectShouldSubtractBorrowedFunds
  )

  const toggle = useCallback(
    (isOn: boolean) => {
      selectedAccountDispatch({
        type: 'method',
        params: { method: 'setShouldSubtractBorrowedFunds', args: [isOn] }
      })
    },
    [selectedAccountDispatch]
  )

  return (
    <ControlOption
      style={spacings.mbTy}
      title={t('Subtract loans from balance')}
      description={t(
        'Your total balance will not include money you borrowed in apps like Aave, Morpho or Compound.'
      )}
      renderIcon={<WalletIcon />}
    >
      <FatToggle
        isOn={shouldSubtractBorrowedFunds}
        onToggle={toggle}
        testID="borrowed-funds-setting-toggle"
      />
    </ControlOption>
  )
}

export default React.memo(BorrowedFundsControlOption)
