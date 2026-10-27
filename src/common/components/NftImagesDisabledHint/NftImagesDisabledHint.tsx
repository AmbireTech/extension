import React, { useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import InfoIcon from '@common/assets/svg/InfoIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import type { IFeatureFlagsController } from '@ambire-common/interfaces/featureFlags'

type Props = {
  style?: ViewStyle
}

const TOOLTIP_ID = 'nft-images-disabled-hint'

const selectAreNftImagesEnabled = (state: IFeatureFlagsController) =>
  !!state.flags?.tokenAndDefiAutoDiscovery

/**
 * Explains where the NFT images went: they are turned off in the privacy opt-outs,
 * because loading them reveals the IP and the NFTs of the user. Displays nothing
 * while the images are on.
 */
const NftImagesDisabledHint = ({ style }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { state: areNftImagesEnabled } = useController(
    'FeatureFlagsController',
    selectAreNftImagesEnabled
  )
  const tooltipDataSet = useMemo(
    () =>
      createGlobalTooltipDataSet({
        id: TOOLTIP_ID,
        title: t('NFT images are turned off'),
        content: t(
          'NFT images are turned off by the "Tokens, NFTs & DeFi positions auto discovery" privacy setting. Showing them lets the image provider see your IP address and which NFTs you own. You can turn it on in Settings > Privacy opt-outs.'
        )
      }),
    [t]
  )

  if (areNftImagesEnabled) return null

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, style]}>
      <Text fontSize={14} appearance="secondaryText" style={spacings.mrMi}>
        {t('Missing image?')}
      </Text>
      <InfoIcon
        dataSet={tooltipDataSet}
        data-tooltip-id={TOOLTIP_ID}
        color={theme.secondaryText}
        width={16}
        height={16}
      />
    </View>
  )
}

export default React.memo(NftImagesDisabledHint)
