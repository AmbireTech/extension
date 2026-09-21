import { useMemo } from 'react'

import { STK_WALLET } from '@ambire-common/consts/addresses'
import { ETHEREUM_CHAIN_ID } from '@ambire-common/consts/networks'
import { getFeePercentForStkWalletToken } from '@ambire-common/libs/swapAndBridge/fee'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'

const selectPortfolioTokens = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio.tokens

/**
 * Returns the Swap & Bridge fee percent for the selected account's stkWALLET holdings, based on
 * the confirmed on-chain balance. Shares its calculation with SwapAndBridgeController so the fee
 * shown in the UI always matches the fee that would actually be applied to a swap.
 */
const useStkWalletFeePercent = () => {
  const { state: portfolioTokens } = useController(
    'SelectedAccountController',
    selectPortfolioTokens
  )
  const stkWalletToken = useMemo(
    () =>
      portfolioTokens.find(
        (token) =>
          token.chainId === ETHEREUM_CHAIN_ID &&
          token.address.toLowerCase() === STK_WALLET.toLowerCase()
      ),
    [portfolioTokens]
  )

  return useMemo(() => getFeePercentForStkWalletToken(stkWalletToken), [stkWalletToken])
}

export default useStkWalletFeePercent
