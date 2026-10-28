import React, { useCallback } from 'react'
import { ViewStyle } from 'react-native'

import Alert from '@common/components/Alert'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'

import type { IFeatureFlagsController } from '@ambire-common/interfaces/featureFlags'

type Props = {
  style?: ViewStyle
}

const selectAreNftImagesEnabled = (state: IFeatureFlagsController) =>
  !!state.flags?.tokenAndDefiAutoDiscovery

/**
 * Explains where the NFT images went: they are turned off in the privacy opt-outs,
 * because loading them reveals the IP and the NFTs of the user. Lets the user turn
 * them back on right away. Displays nothing while the images are on.
 */
const NftImagesDisabledHint = ({ style }: Props) => {
  const { t } = useTranslation()
  const { state: areNftImagesEnabled, dispatch: featureFlagsDispatch } = useController(
    'FeatureFlagsController',
    selectAreNftImagesEnabled
  )

  const handleEnable = useCallback(() => {
    featureFlagsDispatch({
      type: 'method',
      params: {
        method: 'setFeatureFlags',
        args: [{ tokenAndDefiAutoDiscovery: true }]
      }
    })
  }, [featureFlagsDispatch])

  if (areNftImagesEnabled) return null

  return (
    <Alert
      type="info"
      size="sm"
      title={t('Images are hidden')}
      text={t(
        'The token and NFT privacy setting is on, so NFT images and token icons are not loaded. Turn it off to see them.'
      )}
      style={style}
      buttonProps={{
        text: t('Show images'),
        onPress: handleEnable
      }}
    />
  )
}

export default React.memo(NftImagesDisabledHint)
