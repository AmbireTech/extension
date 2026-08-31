import useManageAsset from '@common/modules/settings/hooks/useManageAsset'

type Props = {
  address: string
  chainId: bigint
}

type UseManageTokenReturnType = {
  isHidden: boolean
  toggleHideToken: () => void
  removeCustomToken: () => void
}

const useManageToken = ({ address, chainId }: Props): UseManageTokenReturnType => {
  const { isHidden, toggleHideAsset, removeCustomAsset } = useManageAsset({
    address,
    chainId,
    standard: 'ERC20'
  })

  return { isHidden, toggleHideToken: toggleHideAsset, removeCustomToken: removeCustomAsset }
}

export default useManageToken
