import { useMemo } from 'react'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import { safeTokenAmountAndNumberMultiplication } from '@ambire-common/utils/numbers/formatters'
import RewardsCircularIcon from '@common/assets/svg/RewardsCircularIcon/RewardsCircularIcon'
import useNavigation from '@common/hooks/useNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

import OverviewButton from './OverviewButton'

const RewardsButton = () => {
  const { portfolio } = useSelectedAccountControllerState()
  const { navigate } = useNavigation()

  const total: number = useMemo(() => {
    const projectedRewardsToken = portfolio.tokens.find(
      (t) => t.flags.rewardsType === 'wallet-projected-rewards'
    )
    const price = projectedRewardsToken?.priceIn[0]?.price

    if (!projectedRewardsToken || !price) return 0

    return Number(
      safeTokenAmountAndNumberMultiplication(
        projectedRewardsToken.amount,
        projectedRewardsToken.decimals,
        price
      )
    )
  }, [portfolio.tokens])

  const totalFormatted = useMemo(() => {
    return formatDecimals(total, 'value')
  }, [total])

  return (
    <OverviewButton
      text={totalFormatted}
      renderIcon={() => <RewardsCircularIcon width={14} height={14} />}
      onPress={() => navigate(WEB_ROUTES.rewards)}
    />
  )
}

export default RewardsButton
