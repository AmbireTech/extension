import React, { useCallback } from 'react'
import { ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

import type { IFeatureFlagsController } from '@ambire-common/interfaces/featureFlags'

type Props = {
  style?: ViewStyle
}

const selectAreNftImagesEnabled = (state: IFeatureFlagsController) =>
  !!state.flags?.tokenAndDefiAutoDiscovery

/**
 * Explains where the NFT images went: they are turned off in the privacy opt-outs,
 * because loading them reveals the IP and the NFTs of the user. Pressing it opens a
 * modal that lets the user turn them back on right away. Displays nothing while the
 * images are on.
 */
const NftImagesDisabledHint = ({ style }: Props) => {
  const { t } = useTranslation()
  const { isPopup } = getUiType()
  const { ref: modalRef, open: openModal, close: closeModal } = useModalize()
  const { state: areNftImagesEnabled, dispatch: featureFlagsDispatch } = useController(
    'FeatureFlagsController',
    selectAreNftImagesEnabled
  )

  const handleEnable = useCallback(() => {
    closeModal()
    featureFlagsDispatch({
      type: 'method',
      params: {
        method: 'setFeatureFlags',
        args: [{ tokenAndDefiAutoDiscovery: true }]
      }
    })
  }, [closeModal, featureFlagsDispatch])

  const handleOpen = useCallback(() => openModal(), [openModal])

  if (areNftImagesEnabled) return null

  return (
    <>
      <HoverablePressable
        onPress={handleOpen}
        style={[flexbox.directionRow, flexbox.alignCenter, style]}
      >
        <Text fontSize={14} appearance="primary" underline>
          {t('Missing image?')}
        </Text>
      </HoverablePressable>
      <BottomSheet
        id="nft-images-disabled-modal"
        type={isPopup || isMobile ? 'bottom-sheet' : 'modal'}
        sheetRef={modalRef}
        closeBottomSheet={closeModal}
        style={isWeb ? { maxWidth: 600 } : undefined}
        isScrollEnabled={false}
      >
        <ModalHeader title={t('Missing image')} handleClose={closeModal} />
        <Alert
          type="info"
          size="sm"
          title={t('Images are hidden')}
          text={t(
            'The token and NFT privacy setting is on, so NFT images and token icons are not loaded. Turn it off to see them.'
          )}
          style={spacings.mbLg}
          buttonProps={{
            text: t('Show images'),
            onPress: handleEnable
          }}
        />
      </BottomSheet>
    </>
  )
}

export default React.memo(NftImagesDisabledHint)
