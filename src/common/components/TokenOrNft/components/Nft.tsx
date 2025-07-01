import React, { FC, memo, useCallback, useState } from 'react'
import { View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Network } from '@ambire-common/interfaces/network'
import Collectible from '@common/components/Collectible'
import CollectibleModal, { SelectedCollectible } from '@common/components/CollectibleModal'
import HumanizerAddress from '@common/components/HumanizerAddress'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  tokenId: bigint
  textSize?: number
  network: Network
  networks: Network[]
  address: string
  nftInfo: { name: string }
  hideSendNft?: boolean
  style?: ViewStyle
}

const Nft: FC<Props> = ({
  address,
  tokenId,
  textSize = 16,
  network,
  networks,
  nftInfo,
  hideSendNft,
  style
}) => {
  const { ref: modalRef, open: openModal, close: closeModal } = useModalize()
  const [collectibleData, setCollectibleData] = useState<SelectedCollectible | null>(null)

  const openCollectibleModal = useCallback(
    (collectible: SelectedCollectible) => {
      setCollectibleData(collectible)
      openModal()
    },
    [openModal]
  )

  return (
    <View style={[flexbox.directionRow, style]}>
      <Collectible
        style={{ ...spacings.mrTy, marginTop: 2 }}
        size={20}
        id={tokenId}
        collectionData={{
          name: nftInfo?.name || 'Unknown NFT',
          address,
          chainId: network.chainId
        }}
        openCollectibleModal={openCollectibleModal}
        networks={networks}
      />
      <CollectibleModal
        modalRef={modalRef}
        handleClose={closeModal}
        selectedCollectible={collectibleData}
        hideSendNft={hideSendNft}
      />
      <View style={[spacings.mrTy, flexbox.flex1]}>
        <HumanizerAddress
          fontSize={textSize}
          address={address}
          highestPriorityAlias={`${nftInfo?.name || 'NFT'} #${tokenId}`}
          chainId={network.chainId}
        />
      </View>
    </View>
  )
}

export default memo(Nft)
