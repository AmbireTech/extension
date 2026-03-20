import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import NetworksIcon from '@common/assets/svg/NetworksIcon'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useMultiHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import getStyles from '@common/modules/networks/styles'
import spacings from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

const AllNetworksOption = ({ onPress }: { onPress: (chainId: bigint | null) => void }) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const {
    state: { portfolio: selectedAccountPortfolio, dashboardNetworkFilter }
  } = useController('SelectedAccountController')

  const [bindAnim, animStyle] = useMultiHover({
    values: [
      {
        property: 'backgroundColor',
        from: theme.primaryBackground,
        to: theme.secondaryBackground
      },
      {
        property: 'borderColor',
        from: hexToRgba(theme.neutral400, 0),
        to: theme.neutral400
      }
    ]
  })

  const handleOnPress = useCallback(() => {
    onPress(null)
  }, [onPress])

  return (
    <AnimatedPressable
      onPress={handleOnPress}
      style={[
        styles.network,
        { borderWidth: 2 },
        styles.noKebabNetwork,
        animStyle,
        !dashboardNetworkFilter && {
          backgroundColor: theme.secondaryBackground,
          borderColor: theme.neutral400
        }
      ]}
      {...bindAnim}
    >
      <View style={[flexbox.alignCenter, flexbox.directionRow]}>
        <View
          style={{
            ...flexbox.center,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: theme.neutral200
          }}
        >
          <NetworksIcon color={theme.iconPrimary} width={24} height={24} />
        </View>
        <Text style={spacings.mlTy} weight="medium" fontSize={16}>
          {t('All Networks')}
        </Text>
      </View>
      <Text fontSize={20} weight="semiBold" appearance="primaryText">
        {`$${formatDecimals(Number(selectedAccountPortfolio?.totalBalance || 0))}` || '$-'}
      </Text>
    </AnimatedPressable>
  )
}

export default React.memo(AllNetworksOption)
