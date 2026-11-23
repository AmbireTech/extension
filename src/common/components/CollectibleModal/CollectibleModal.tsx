import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import OpenIcon from '@common/assets/svg/OpenIcon'
import SendIcon from '@common/assets/svg/SendIcon'
import BottomSheet from '@common/components/BottomSheet'
import SheetHeaderRow from '@common/components/BottomSheet/SheetHeaderRow'
import Button from '@common/components/Button'
import NftImage from '@common/components/NftImage'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'
import { getUiType } from '@common/utils/uiType'

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

  const handleOpenExplorer = useCallback(() => {
    if (!selectedCollectible) return

    const { address, chainId, id } = selectedCollectible
    const networkData = networks.find(({ chainId: networkChainId }) => chainId === networkChainId)
    openInTab({ url: `${networkData?.explorerUrl}/nft/${address}/${String(id)}` }).catch((error) =>
      console.error(error)
    )
  }, [networks, selectedCollectible])

  // Grey Explorer and Hide above a full-width Send, like the Benzin footer
  const actions = useMemo(() => {
    if (!selectedCollectible) return null

    const { address, chainId, id } = selectedCollectible
    return (
      <View style={styles.actions}>
        <View style={styles.secondaryActions}>
          <Button
            type="secondary"
            size="small"
            text={t('Explorer')}
            onPress={handleOpenExplorer}
            childrenPosition="left"
            hasBottomSpacing={false}
            style={flexbox.flex1}
          >
            <OpenIcon
              color={theme.primaryText}
              width={18}
              height={18}
              strokeWidth="2"
              style={spacings.mrTy}
            />
          </Button>
          {shouldDisplayHideCollectionAction && (
            <HideCollectibleButton
              address={address}
              chainId={chainId}
              tokenId={id}
              handleClose={handleClose}
            />
          )}
        </View>
        {!hideSendNft && (
          <Button
            testID="send-nft-button"
            onPress={handleSendNft}
            childrenPosition="right"
            text={t('Send')}
            hasBottomSpacing={false}
          >
            {/* The same white as the text of a primary button, in both themes */}
            <SendIcon style={spacings.mlTy} color="#fff" width={26} height={26} />
          </Button>
        )}
      </View>
    )
  }, [
    handleClose,
    handleOpenExplorer,
    handleSendNft,
    hideSendNft,
    selectedCollectible,
    shouldDisplayHideCollectionAction,
    styles.actions,
    styles.secondaryActions,
    t,
    theme.primaryText
  ])

  const modalContent = useMemo(() => {
    if (!selectedCollectible) return null

    const { image, name, collectionName, chainId, lastPrice } = selectedCollectible
    const networkData = networks.find(({ chainId: networkChainId }) => chainId === networkChainId)
    return (
      <>
        <SheetHeaderRow>
          <Text fontSize={isTab ? 20 : 18} weight="semiBold" numberOfLines={2} selectable>
            {name || t('Unknown NFT')}
          </Text>
        </SheetHeaderRow>
        <View style={styles.imageContainer}>
          <NftImage
            withHint
            uri={image}
            size="100%"
            iconSize={COLLECTIBLE_IMAGE_SIZE / 2}
            backgroundColor={theme.secondaryBackground}
            imageStyle={styles.image}
          />
        </View>
        <View style={styles.details}>
          <Row title={t('Collection')} text={collectionName} />
          <Row title={t('Chain')} text={networkData?.name || t('Unknown network')} />
          <Row title={t('Last price')} text={lastPrice || '$-'} noMb />
        </View>
      </>
    )
  }, [
    networks,
    selectedCollectible,
    styles.details,
    styles.image,
    styles.imageContainer,
    t,
    theme.secondaryBackground
  ])

  // The actions are the sheet's footer, always in view
  const footer = useMemo(
    () => (actions ? <View style={spacings.ptSm}>{actions}</View> : undefined),
    [actions]
  )

  return (
    <BottomSheet
      id="collectible-modal"
      sheetRef={modalRef}
      closeBottomSheet={handleClose}
      adjustToContentHeight
      FooterComponent={footer}
      // As wide as the image in a centered card on web
      style={isWeb ? styles.card : undefined}
    >
      {modalContent}
    </BottomSheet>
  )
}

export default React.memo(CollectibleModal)
