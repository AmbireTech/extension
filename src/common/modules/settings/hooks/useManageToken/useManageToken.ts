import { useCallback } from 'react'

import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'

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
  const { t } = useTranslation()
  const { addToast } = useToast()
  const {
    state: { tokenPreferences },
    dispatch: portfolioDispatch
  } = useController('PortfolioController')
  const { state: account } = useController('SelectedAccountController', 'account')

  // flags.isHidden is updated after the portfolio is updated
  // so we use tokenPreferences to get the value faster
  const isHidden = !!tokenPreferences?.find(
    ({ address: addr, chainId: nChainId }) =>
      addr.toLowerCase() === address.toLowerCase() && nChainId === chainId
  )?.isHidden

  const toggleHideToken = useCallback(() => {
    addToast(t('Token is now visible. You can hide it again from the dashboard.'), {
      timeout: 2000
    })

    portfolioDispatch({
      type: 'method',
      params: {
        method: 'toggleHideToken',
        args: [{ address, chainId }, account?.addr]
      }
    })
    onTokenPreferenceOrCustomTokenChange()
  }, [
    addToast,
    t,
    portfolioDispatch,
    address,
    chainId,
    onTokenPreferenceOrCustomTokenChange,
    account?.addr
  ])

  const removeCustomToken = useCallback(() => {
    addToast(t('Token removed'), {
      timeout: 2000
    })
    portfolioDispatch({
      type: 'method',
      params: {
        method: 'removeCustomToken',
        args: [{ address, chainId }, account?.addr]
      }
    })
    onTokenPreferenceOrCustomTokenChange()
  }, [
    addToast,
    t,
    portfolioDispatch,
    address,
    chainId,
    onTokenPreferenceOrCustomTokenChange,
    account?.addr
  ])

  return { isHidden, toggleHideToken, removeCustomToken }
}

export default useManageToken
