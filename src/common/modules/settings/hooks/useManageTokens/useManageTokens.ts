import { TokenResult } from '@ambire-common/libs/portfolio'
import { ManagedAsset } from '@common/modules/settings/hooks/useManageAssets/composeAssetLists'
import useManageAssets, {
  ALL_NETWORKS_FILTER
} from '@common/modules/settings/hooks/useManageAssets'

export { ALL_NETWORKS_FILTER }

type Props = {
  search: string
  networkFilter: string
}

type UseManageTokensReturnType = {
  customTokens: ManagedAsset<TokenResult>[]
  hiddenTokens: ManagedAsset<TokenResult>[]
  isLoading: boolean
  onTokenPreferenceOrCustomTokenChange: () => void
}

const useManageTokens = ({ search, networkFilter }: Props): UseManageTokensReturnType => {
  const { customAssets, hiddenAssets, isLoading, onAssetPreferenceChange } =
    useManageAssets<TokenResult>({ search, networkFilter, standard: 'ERC20' })

  return {
    customTokens: customAssets,
    hiddenTokens: hiddenAssets,
    isLoading,
    onTokenPreferenceOrCustomTokenChange: onAssetPreferenceChange
  }
}

export default useManageTokens
