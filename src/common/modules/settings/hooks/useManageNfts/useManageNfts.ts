import { CollectionResult } from '@ambire-common/libs/portfolio'
import { ManagedAsset } from '@common/modules/settings/hooks/useManageAssets/composeAssetLists'
import useManageAssets from '@common/modules/settings/hooks/useManageAssets'

type Props = {
  search: string
  networkFilter: string
}

type UseManageNftsReturnType = {
  customCollections: ManagedAsset<CollectionResult>[]
  hiddenCollections: ManagedAsset<CollectionResult>[]
  isLoading: boolean
}

const useManageNfts = ({ search, networkFilter }: Props): UseManageNftsReturnType => {
  const { customAssets, hiddenAssets, isLoading } = useManageAssets<CollectionResult>({
    search,
    networkFilter,
    standard: 'ERC721'
  })

  return {
    customCollections: customAssets,
    hiddenCollections: hiddenAssets,
    isLoading
  }
}

export default useManageNfts
