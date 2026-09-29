import { nanoid } from 'nanoid'
import React, { FC, memo, useCallback, useMemo, useState } from 'react'
import { View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Network } from '@ambire-common/interfaces/network'
import Collectible from '@common/components/Collectible'
import CollectibleModal, { SelectedCollectible } from '@common/components/CollectibleModal'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
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

const NFT_LABEL_MAX_LENGTH = 20

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
  const fullName = `${nftInfo?.name || 'NFT'} #${tokenId.toString()}`
  const isNameTruncated = fullName.length > NFT_LABEL_MAX_LENGTH
  const visibleName = isNameTruncated ? `${fullName.slice(0, NFT_LABEL_MAX_LENGTH)}...` : fullName
  const tooltipId = useMemo(
    () => `nft-name-${address}-${tokenId.toString()}-${nanoid(6)}`,
    [address, tokenId]
  )

  const openCollectibleModal = useCallback(
    (collectible: SelectedCollectible) => {
      setCollectibleData(collectible)
      openModal()
    },
    [openModal]
  )

  return (
    <View
      style={[flexbox.directionRow, { maxWidth: '100%' }, style]}
      dataSet={
        isNameTruncated
          ? createGlobalTooltipDataSet({
              id: tooltipId,
              content: fullName
            })
          : undefined
      }
    >
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
      <View style={[spacings.mrTy, flexbox.flex1, { minWidth: 0 }]}>
        <HumanizerAddress
          fontSize={textSize}
          address={address}
          highestPriorityAlias={visibleName}
          chainId={network.chainId}
          numberOfLines={1}
        />
      </View>
    </View>
  )
}

export default memo(Nft)
