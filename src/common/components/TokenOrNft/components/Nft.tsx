import { nanoid } from 'nanoid'
import React, { FC, memo, useCallback, useMemo, useState } from 'react'
import { View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Network } from '@ambire-common/interfaces/network'
import Collectible from '@common/components/Collectible'
import CollectibleModal, { SelectedCollectible } from '@common/components/CollectibleModal'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HumanizerAddress from '@common/components/HumanizerAddress'
import {
  AddressActionsInfoIcon,
  AddressActionsTooltip
} from '@common/components/HumanizerAddress/components/BaseAddress/AddressActions'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  tokenId: bigint
  textSize?: number
  iconSize?: number
  iconPosition?: 'left' | 'right'
  network: Network
  networks: Network[]
  address: string
  nftInfo: { name: string }
  hideSendNft?: boolean
  style?: ViewStyle
}

const NFT_NAME_MAX_LENGTH = 12
const NFT_TOKEN_ID_MAX_LENGTH = 9

const getVisibleNftName = (name: string) =>
  name.length > NFT_NAME_MAX_LENGTH ? `${name.slice(0, NFT_NAME_MAX_LENGTH)}...` : name

const getVisibleTokenId = (tokenId: string) =>
  tokenId.length > NFT_TOKEN_ID_MAX_LENGTH
    ? `${tokenId.slice(0, 3)}...${tokenId.slice(-3)}`
    : tokenId

const Nft: FC<Props> = ({
  address,
  tokenId,
  textSize = 16,
  iconSize = 20,
  iconPosition = 'left',
  network,
  networks,
  nftInfo,
  hideSendNft,
  style
}) => {
  const { ref: modalRef, open: openModal, close: closeModal } = useModalize()
  const [collectibleData, setCollectibleData] = useState<SelectedCollectible | null>(null)
  const nftName = nftInfo?.name || 'NFT'
  const fullTokenId = tokenId.toString()
  const fullName = `${nftName} #${fullTokenId}`
  // Truncate the collection name and the id separately so the id is always visible
  // and NFTs from the same collection (e.g. Uniswap positions) remain distinguishable
  const visibleCollectionName = getVisibleNftName(nftName)
  const visibleTokenId = `#${getVisibleTokenId(fullTokenId)}`
  const isNameTruncated = `${visibleCollectionName} ${visibleTokenId}` !== fullName
  const tooltipId = useMemo(
    () => `nft-name-${address}-${tokenId.toString()}-${nanoid(6)}`,
    [address, tokenId]
  )
  const actionsTooltipId = useMemo(() => `nft-actions-${address}-${nanoid(6)}`, [address])

  const openCollectibleModal = useCallback(
    (collectible: SelectedCollectible) => {
      setCollectibleData(collectible)
      openModal()
    },
    [openModal]
  )

  const collectible = (
    <Collectible
      style={{
        ...(iconPosition === 'left' ? spacings.mrTy : spacings.mlTy),
        marginTop: 2
      }}
      size={iconSize}
      id={tokenId}
      collectionData={{
        name: nftName,
        address,
        chainId: network.chainId
      }}
      openCollectibleModal={openCollectibleModal}
      networks={networks}
    />
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
      {iconPosition === 'left' ? collectible : null}
      <CollectibleModal
        modalRef={modalRef}
        handleClose={closeModal}
        selectedCollectible={collectibleData}
        hideSendNft={hideSendNft}
      />
      <View
        style={[
          iconPosition === 'left' ? spacings.mrTy : undefined,
          flexbox.directionRow,
          flexbox.alignCenter,
          { flexShrink: 1, minWidth: 0 }
        ]}
      >
        {/* Only the collection name shrinks in narrow containers, the id never gets cut off */}
        <View style={{ flexShrink: 1, minWidth: 0 }}>
          <HumanizerAddress
            fontSize={textSize}
            address={address}
            highestPriorityAlias={visibleCollectionName}
            chainId={network.chainId}
            numberOfLines={1}
            hideActions
          />
        </View>
        <Text fontSize={textSize} weight="medium" numberOfLines={1} style={{ flexShrink: 0 }}>
          {` ${visibleTokenId}`}
        </Text>
        {/* Rendered here instead of by HumanizerAddress so the info icon comes after the id */}
        {isWeb && (
          <>
            <AddressActionsInfoIcon tooltipId={actionsTooltipId} />
            <AddressActionsTooltip
              tooltipId={actionsTooltipId}
              address={address}
              chainId={network.chainId}
            />
          </>
        )}
      </View>
      {iconPosition === 'right' ? collectible : null}
    </View>
  )
}

export default memo(Nft)
