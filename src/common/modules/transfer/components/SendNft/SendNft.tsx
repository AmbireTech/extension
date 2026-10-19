import React, { FC, memo } from 'react'
import { View } from 'react-native'

import shortenAddress from '@ambire-common/utils/shortenAddress'
import Collectible from '@common/components/Collectible'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import getTokenAndAmountSelectorStyles from '@common/components/TokenAndAmountSelector/styles'
import { ItemPanel } from '@web/components/TransactionsScreen'

import type { TransferNft } from '@ambire-common/interfaces/transfer'
import type { Validation } from '@ambire-common/services/validations'
import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks

const NFT_IMAGE_SIZE = 56

type Props = {
  nft: TransferNft
  validation: Validation
}

/**
 * Shows the NFT that is being sent, in place of the token and amount fields. Framed the same way
 * as those fields, so both modes of the form look alike.
 */
const SendNft: FC<Props> = ({ nft, validation }) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getTokenAndAmountSelectorStyles)
  const { state: networks } = useController('NetworksController', selectNetworks)

  const network = networks.find(({ chainId }) => chainId === nft.chainId)
  // The portfolio has no name for collections it can't read one from
  const collectionName = nft.collectionName || shortenAddress(nft.address, 13)
  const isError = validation.severity === 'error' && !!validation.message

  return (
    <>
      <View style={[styles.outerContainer, isError && styles.outerContainerError]}>
        <ItemPanel style={{ ...styles.container, ...(isError ? styles.containerError : {}) }}>
          <Text appearance="secondaryText" fontSize={14} weight="medium" style={spacings.mbSm}>
            {t('Send NFT')}
          </Text>
          <View style={[flexbox.directionRow, flexbox.alignCenter]} testID="send-nft-details">
            <Collectible
              id={nft.tokenId}
              collectionData={{ name: collectionName, address: nft.address, chainId: nft.chainId }}
              size={NFT_IMAGE_SIZE}
              networks={networks}
            />
            <View style={[flexbox.flex1, spacings.mlSm]}>
              <Text fontSize={16} weight="semiBold" numberOfLines={1} ellipsizeMode="tail">
                {collectionName}
              </Text>
              <Text
                fontSize={14}
                appearance="secondaryText"
                numberOfLines={1}
                ellipsizeMode="middle"
                selectable
              >
                #{nft.tokenId.toString()}
              </Text>
              {!!network && (
                <Text fontSize={12} appearance="secondaryText" style={spacings.mtMi}>
                  {t('on {{networkName}}', { networkName: network.name })}
                </Text>
              )}
            </View>
          </View>
        </ItemPanel>
      </View>
      {isError && (
        <Text fontSize={12} appearance="errorText" style={styles.message}>
          {t(validation.message)}
        </Text>
      )}
    </>
  )
}

export default memo(SendNft)
