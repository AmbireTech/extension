import { useCallback } from 'react'

import { CustomToken, getAssetPreferenceId } from '@ambire-common/libs/portfolio/customToken'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'
import { ASSET_COPY } from '@common/modules/settings/constants/assetCopy'

type Props = {
  address: string
  chainId: bigint
  standard: CustomToken['standard']
  /** Of a collectible, which is hidden and removed on its own */
  tokenId?: bigint
  onAssetPreferenceChange: () => void
}

type UseManageAssetReturnType = {
  isHidden: boolean
  toggleHideAsset: () => void
  removeCustomAsset: () => void
}

/** An NFT is hidden and removed on its own, so the preferences carry its id */
const useManageAsset = ({
  address,
  chainId,
  standard,
  tokenId,
  onAssetPreferenceChange
}: Props): UseManageAssetReturnType => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const {
    state: { tokenPreferences },
    dispatch: portfolioDispatch
  } = useController('PortfolioController')
  const { account } = useController('SelectedAccountController').state
  const copy = ASSET_COPY[standard]

  // flags.isHidden is updated after the portfolio is updated
  // so we use tokenPreferences to get the value faster
  const assetPreferenceId = getAssetPreferenceId({ address, chainId, tokenId })
  const isHidden = !!tokenPreferences?.find(
    (preference) => getAssetPreferenceId(preference) === assetPreferenceId
  )?.isHidden

  const toggleHideAsset = useCallback(() => {
    addToast(t(isHidden ? copy.unhiddenToast : copy.hiddenToast), { timeout: 4000 })

    portfolioDispatch({
      type: 'method',
      params: {
        method: 'toggleHideToken',
        args: [{ address, chainId, standard, tokenId }, account?.addr]
      }
    })
    onAssetPreferenceChange()
  }, [
    account?.addr,
    addToast,
    address,
    chainId,
    isHidden,
    onAssetPreferenceChange,
    portfolioDispatch,
    standard,
    copy,
    t
  ])

  const removeCustomAsset = useCallback(() => {
    addToast(t(copy.removedToast), { timeout: 2000 })

    portfolioDispatch({
      type: 'method',
      params: {
        method: 'removeCustomToken',
        args: [{ address, chainId, tokenId }, account?.addr]
      }
    })
    onAssetPreferenceChange()
  }, [
    account?.addr,
    addToast,
    address,
    chainId,
    onAssetPreferenceChange,
    portfolioDispatch,
    copy,
    t
  ])

  return { isHidden, toggleHideAsset, removeCustomAsset }
}

export default useManageAsset
