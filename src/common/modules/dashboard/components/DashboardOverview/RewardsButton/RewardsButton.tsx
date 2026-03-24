import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import { safeTokenAmountAndNumberMultiplication } from '@ambire-common/utils/numbers/formatters'
import RewardsCircularIcon from '@common/assets/svg/RewardsCircularIcon/RewardsCircularIcon'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import alert from '@common/services/alert'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

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
    return `+$${formatDecimals(total, 'noDecimal')}`
  }, [total])

  if (!portfolio.isReadyToVisualize) {
    return (
      <SkeletonLoader lowOpacity width={80} height={26} borderRadius={12} style={spacings.mlMi} />
    )
  }

  return (
    <RewardsButtonWrapper
      onPress={() => {
        if (isMobile) {
          alert('Coming soon!')
          return
        }
        navigate(WEB_ROUTES.rewards)
      }}
    >
      <RewardsCircularIcon width={14} height={14} />
      <View
        style={[flexbox.directionRow, flexbox.justifyCenter, flexbox.alignEnd]}
        testID="dashboard-button-rewards"
      >
        <Text
          color="#D7FF00"
          fontSize={12}
          style={{ ...spacings.mhMi, lineHeight: 16 }}
          weight="number_medium"
        >
          {totalFormatted}
        </Text>
        <Text
          fontSize={10}
          color="#fff"
          style={{ ...spacings.mrMi, lineHeight: 15 }}
          weight="medium"
        >
          {t('from')}
        </Text>
        <Text color="#D7FF00" fontSize={10} weight="medium" style={{ lineHeight: 15 }}>
          {t('Rewards')}
        </Text>
      </View>
    </RewardsButtonWrapper>
  )
}

export default memo(RewardsButton)
