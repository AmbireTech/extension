import useManageAsset from '@common/modules/settings/hooks/useManageAsset'

type Props = {
  address: string
  chainId: bigint
  onTokenPreferenceOrCustomTokenChange: () => void
}

type UseManageTokenReturnType = {
  isHidden: boolean
  toggleHideToken: () => void
  removeCustomToken: () => void
}

const useManageToken = ({
  address,
  chainId,
  onTokenPreferenceOrCustomTokenChange
}: Props): UseManageTokenReturnType => {
  const { isHidden, toggleHideAsset, removeCustomAsset } = useManageAsset({
    address,
    chainId,
    standard: 'ERC20',
    onAssetPreferenceChange: onTokenPreferenceOrCustomTokenChange
  })

  return { isHidden, toggleHideToken: toggleHideAsset, removeCustomToken: removeCustomAsset }
}

export default useManageToken
