import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import { safeTokenAmountAndNumberMultiplication } from '@ambire-common/utils/numbers/formatters'
import RewardsCircularIcon from '@common/assets/svg/RewardsCircularIcon/RewardsCircularIcon'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'

import RewardsButtonWrapper from './RewardsButtonWrapper'

const RewardsButton = () => {
  const {
    state: { portfolio }
  } = useController('SelectedAccountController')
  const { navigate } = useNavigation()
  const { t } = useTranslation()

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

  if (!portfolio.isReadyToVisualize) {
    return <SkeletonLoader lowOpacity width={80} height={26} borderRadius={12} />
  }

  return (
    <RewardsButtonWrapper onPress={() => navigate(WEB_ROUTES.rewards)}>
      <RewardsCircularIcon width={14} height={14} />
      <Text color="#D7FF00" fontSize={12} style={spacings.mhMi} weight="medium">
        +{totalFormatted}
      </Text>
      <Text appearance="secondaryText" fontSize={10} style={spacings.mrMi} weight="medium">
        {t('from')}
      </Text>
      <Text color="#D7FF00" fontSize={10} weight="medium">
        Rewards
      </Text>
    </RewardsButtonWrapper>
  )
}

export default RewardsButton
