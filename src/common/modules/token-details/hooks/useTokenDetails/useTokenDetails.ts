import { useMemo } from 'react'

import useController from '@common/hooks/useController'
import useRoute from '@common/hooks/useRoute'
import useTokenActions from '@common/modules/token-details/hooks/useTokenActions'
import { getTokenId } from '@common/utils/token'

const useTokenDetails = () => {
  const { state } = useRoute()
  const { state: portfolio } = useController('SelectedAccountController', 'portfolio')
  const tokenId = state?.tokenId
  const token = useMemo(() => {
    if (!tokenId) return null
    return portfolio.tokens.find((t) => getTokenId(t) === tokenId) ?? null
  }, [portfolio, tokenId])

  const { networks, hideTokenModalRef, closeHideTokenModal, handleHideTokenFromModal, actions } =
    useTokenActions(token)

  return {
    token,
    networks,
    hideTokenModalRef,
    closeHideTokenModal,
    handleHideTokenFromModal,
    actions
  }
}

export default useTokenDetails
