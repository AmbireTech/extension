import useManageAsset from '@common/modules/settings/hooks/useManageAsset'

type Props = {
  address: string
  chainId: bigint
  /** Of the collectible, which is hidden and removed on its own */
  tokenId?: bigint
}

type UseManageNftReturnType = {
  isHidden: boolean
  toggleHideCollection: () => void
  removeCustomCollection: () => void
}

const useManageNft = ({ address, chainId, tokenId }: Props): UseManageNftReturnType => {
  const { isHidden, toggleHideAsset, removeCustomAsset } = useManageAsset({
    address,
    chainId,
    standard: 'ERC721',
    tokenId
  })

  return {
    isHidden,
    toggleHideCollection: toggleHideAsset,
    removeCustomCollection: removeCustomAsset
  }
}

export default useManageNft
