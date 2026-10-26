import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import OpenIcon from '@common/assets/svg/OpenIcon'
import SendIcon from '@common/assets/svg/SendIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import ManifestImage from '@common/components/ManifestImage'
import Text from '@common/components/Text'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'
import { getUiType } from '@common/utils/uiType'
import ImageIcon from '@web/assets/svg/ImageIcon'

import HideCollectibleButton from './HideCollectibleButton'
import Row from './Row'
import getStyles, { COLLECTIBLE_IMAGE_SIZE } from './styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks

const { isTab } = getUiType()

export type SelectedCollectible = {
  address: string
  name: string
  chainId: bigint
  lastPrice: string
  id: bigint
  image: string
  collectionName: string
} | null

const CollectibleModal = ({
  handleClose,
  modalRef,
  selectedCollectible,
  hideSendNft,
  canHideCollectible
}: {
  handleClose: () => void
  modalRef: any
  selectedCollectible: SelectedCollectible
  hideSendNft?: boolean
  /** Displays the action that hides the collectible */
  canHideCollectible?: boolean
}) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { isNarrowWebLayout } = useCompactLayout()
  const { state: networks } = useController('NetworksController', selectNetworks)
  const { navigate } = useNavigation()
  // No actions on a collectible that is only being previewed (in a simulation)
  const shouldDisplayHideCollectionAction = !hideSendNft && !!canHideCollectible

  const handleSendNft = useCallback(() => {
    if (!selectedCollectible) return

    const { address, chainId, id } = selectedCollectible
    handleClose()
    navigate(`${ROUTES.transfer}?address=${address}&chainId=${chainId}&tokenId=${id}`)
  }, [handleClose, navigate, selectedCollectible])

  const modalContent = useMemo(() => {
    if (!selectedCollectible) return null

    const { address, image, name, collectionName, chainId, id, lastPrice } = selectedCollectible
    const networkData = networks.find(({ chainId: networkChainId }) => chainId === networkChainId)
    return (
      <>
        <View style={styles.imageContainer}>
          <ManifestImage
            uri={image}
            size={COLLECTIBLE_IMAGE_SIZE}
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
          {shouldDisplayHideCollectionAction && (
            <HideCollectibleButton
              address={address}
              chainId={chainId}
              tokenId={id}
              handleClose={handleClose}
            />
          )}
        </View>
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            spacings.mbMd,
            flexbox.justifyCenter,
            { width: '100%' }
          ]}
        >
          <Text
            fontSize={isTab ? 18 : 16}
            weight="semiBold"
            style={[spacings.mrMi]}
            numberOfLines={1}
            ellipsizeMode="tail"
            selectable
          >
            {name || 'Unknown Name'}
          </Text>
          <Pressable
            style={spacings.mlSm}
            onPress={() =>
              openInTab({ url: `${networkData?.explorerUrl}/nft/${address}/${String(id)}` })
            }
          >
            {({ hovered }: any) => (
              <OpenIcon
                color={hovered ? theme.primaryText : theme.secondaryText}
                width={20}
                height={20}
                strokeWidth="2"
              />
            )}
          </Pressable>
        </View>

        <View
          style={[
            spacings.phSm,
            spacings.pvSm,
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
        {!hideSendNft && (
          <Button
            testID="send-nft-button"
            onPress={handleSendNft}
            childrenPosition="right"
            text={t('Send')}
            style={{ width: '100%', ...spacings.mb0, ...spacings.mtMd }}
          >
            {/* The same white as the text of a primary button, in both themes */}
            <SendIcon style={spacings.mlTy} color="#fff" width={26} height={26} />
          </Button>
        )}
      </>
    )
  }, [
    handleClose,
    handleSendNft,
    hideSendNft,
    networks,
    selectedCollectible,
    shouldDisplayHideCollectionAction,
    styles.image,
    styles.imageContainer,
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
      style={isNarrowWebLayout ? styles.sidePanelSheet : styles.modal}
      autoWidth={!isNarrowWebLayout}
      containerInnerWrapperStyles={isNarrowWebLayout ? flexbox.alignCenter : undefined}
    >
      {isNarrowWebLayout ? (
        <View style={styles.sidePanelContent}>{modalContent}</View>
      ) : (
        modalContent
      )}
    </BottomSheet>
  )
}

export default React.memo(CollectibleModal)
