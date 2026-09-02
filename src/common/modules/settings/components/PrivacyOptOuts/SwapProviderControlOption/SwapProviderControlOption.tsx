import React from 'react'
import { View } from 'react-native'

import SwapAndBridgeIcon from '@common/assets/svg/SwapAndBridgeIcon'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { SwapProviderSettings } from '@common/modules/swap-and-bridge/components/ProviderSettingsBottomSheet'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

const SwapProviderControlOption = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <View
      style={[
        spacings.mbTy,
        spacings.ph,
        spacings.pv,
        common.borderRadiusPrimary,
        { backgroundColor: theme.secondaryBackground }
      ]}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbTy]}>
        {isWeb && (
          <View style={{ width: 24, ...flexbox.center }}>
            <SwapAndBridgeIcon width={24} height={24} color={theme.iconPrimary} />
          </View>
        )}
        <Text fontSize={16} weight="medium" style={isWeb && spacings.ml}>
          {t('Swap & Bridge Providers')}
        </Text>
      </View>
      <SwapProviderSettings />
    </View>
  )
}

export default React.memo(SwapProviderControlOption)
