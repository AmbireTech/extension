import React from 'react'
import { View } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { privateValue } from '@common/utils/ui'

type Props = {
  count: number
  onPress: () => void
  variant: 'summary' | 'collapse'
  totalUSD?: number
}

const DustTokensSummary = ({ count, onPress, variant, totalUSD }: Props) => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { isPrivacyModeEnabled } = useController('WalletStateController').state

  const isSummary = variant === 'summary'
  const totalUSDFormatted =
    isSummary && totalUSD !== undefined ? formatDecimals(totalUSD, 'value') : undefined

  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: { from: theme.primaryBackground, to: theme.secondaryBackground }
  })

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        spacings.pvTy,
        spacings.phTy,
        spacings.mhTy,
        spacings.mvMi,
        {
          borderRadius: 4,
          backgroundColor: theme.primaryBackground
        },
        animStyle
      ]}
      {...bindAnim}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <View
          style={{
            marginRight: 8,
            transform: [{ rotate: isSummary ? '-90deg' : '180deg' }]
          }}
        >
          <DownArrowIcon height={12} width={12} color={theme.secondaryText} />
        </View>
        <Text appearance="secondaryText" fontSize={14} weight="medium">
          {isSummary
            ? t('{{count}} dust {{tokensLabel}}', {
                count,
                tokensLabel: count > 1 ? t('tokens') : t('token')
              })
            : t('Hide {{count}} dust {{tokensLabel}}', {
                count,
                tokensLabel: count > 1 ? t('tokens') : t('token')
              })}
        </Text>
      </View>
      {isSummary && totalUSDFormatted && (
        <Text fontSize={14} weight="number_bold" color={theme.primaryText}>
          {privateValue(totalUSDFormatted, isPrivacyModeEnabled, 8)}
        </Text>
      )}
    </AnimatedPressable>
  )
}

export default React.memo(DustTokensSummary)
