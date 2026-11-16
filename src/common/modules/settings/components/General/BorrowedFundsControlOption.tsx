import React, { useCallback } from 'react'

import WalletIcon from '@common/assets/svg/WalletIcon'
import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import { useTranslation } from '@common/config/localization'
import useBorrowedFundsPreference from '@common/modules/dashboard/hooks/useBorrowedFundsPreference'
import spacings from '@common/styles/spacings'

const BorrowedFundsControlOption = () => {
  const { t } = useTranslation()
  const { borrowedFundsPreference, setBorrowedFundsPreference } = useBorrowedFundsPreference()

  const toggle = useCallback(
    (isOn: boolean) => setBorrowedFundsPreference(isOn ? 'subtract' : 'include'),
    [setBorrowedFundsPreference]
  )

  return (
    <ControlOption
      style={spacings.mbTy}
      title={t('Subtract loans from balance')}
      description={t('Your total balance will not include money you borrowed in apps like Aave.')}
      renderIcon={<WalletIcon />}
    >
      <FatToggle
        isOn={borrowedFundsPreference === 'subtract'}
        onToggle={toggle}
        testID="borrowed-funds-setting-toggle"
      />
    </ControlOption>
  )
}

export default React.memo(BorrowedFundsControlOption)
