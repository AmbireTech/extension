import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import OpenIcon from '@common/assets/svg/OpenIcon'
import SendIcon from '@common/assets/svg/SendIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import ImageIcon from '@web/assets/svg/ImageIcon'
import ManifestImage from '@web/components/ManifestImage'
import { createTab } from '@web/extension-services/background/webapi/tab'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import { getUiType } from '@web/utils/uiType'

import Row from './Row'
import getStyles, { COLLECTIBLE_IMAGE_SIZE } from './styles'

const { isTab } = getUiType()

export type SelectedCollectible = {
  address: string
  name: string
  networkId: string
  lastPrice: string
  image: string
  collectionName: string
} | null

const CollectibleModal = ({
  handleClose,
  modalRef,
  selectedCollectible
}: {
  handleClose: () => void
  modalRef: any
  selectedCollectible: SelectedCollectible
}) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const renderFallbackImage = !selectedCollectible?.image
  const { networks } = useNetworksControllerState()

  const ModalInner = useCallback(() => {
    if (!selectedCollectible) return null

    const { address, image, name, collectionName, networkId, lastPrice } = selectedCollectible
    const networkData = networks.find(({ id }) => networkId === id)
    return (
      <>
        <ManifestImage
          uri={image}
          size={COLLECTIBLE_IMAGE_SIZE}
          containerStyle={styles.imageContainer}
          imageStyle={styles.image}
          fallback={() => (
            <View
              style={[
                flexbox.flex1,
                flexbox.center,
                { backgroundColor: theme.primaryBackground, width: '100%' }
              ]}
            >
              <ImageIcon
                color={theme.secondaryText}
                width={COLLECTIBLE_IMAGE_SIZE / 2}
                height={COLLECTIBLE_IMAGE_SIZE / 2}
              />
            </View>
          )}
        />
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            spacings.mbSm,
            flexbox.alignSelfStart,
            { width: '100%' }
          ]}
        >
          <Text
            fontSize={isTab ? 18 : 14}
            weight="medium"
            style={[spacings.mrMi]}
            numberOfLines={1}
          >
            {name || 'Unknown Name'}
          </Text>
          <Pressable
            style={spacings.mlTy}
            onPress={() => createTab(`${networkData?.explorerUrl}/address/${address}`)}
          >
            {({ hovered }: any) => (
              <OpenIcon
                color={hovered ? theme.primaryText : theme.secondaryText}
                width={isTab ? 16 : 12}
                height={isTab ? 16 : 12}
                strokeWidth="2"
              />
            )}
          </Pressable>
        </View>

        <View
          style={[
            spacings.phSm,
            spacings.pvSm,
            spacings.mbSm,
            {
              borderRadius: BORDER_RADIUS_PRIMARY,
              backgroundColor: theme.secondaryBackground,
              width: '100%'
            }
          ]}
        >
          <Row title={t('Collection')} text={collectionName} />
          <Row title={t('Chain')} text={networkData?.name || 'Unknown Network'} />
          <Row title={t('Last Price')} text={lastPrice || '$-'} noMb />
        </View>
        {/* @TODO: Implement NFT transfer */}
        <Button
          disabled
          childrenPosition="right"
          text="Send"
          style={{ width: '100%', ...spacings.mb0 }}
        >
          <SendIcon style={spacings.mlTy} color={theme.primaryBackground} width={26} height={26} />
        </Button>
      </>
    )
  }, [
    networks,
    renderFallbackImage,
    selectedCollectible,
    styles.image,
    t,
    theme.primaryBackground,
    theme.primaryText,
    theme.secondaryBackground,
    theme.secondaryText
  ])

  return (
    <BottomSheet
      id="collectible-modal"
      type="modal"
      sheetRef={modalRef}
      closeBottomSheet={handleClose}
      style={styles.modal}
      backgroundColor="primaryBackground"
      autoWidth
    >
      <ModalInner />
    </BottomSheet>
  )
}

export default React.memo(CollectibleModal)
