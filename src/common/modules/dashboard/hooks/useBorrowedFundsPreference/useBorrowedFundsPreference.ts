import { useCallback } from 'react'

import { BorrowedFundsPreference } from '@ambire-common/interfaces/selectedAccount'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectBorrowedFundsPreference = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.borrowedFundsPreference

/**
 * True while the selected account has borrowed funds in its total balance and the user
 * hasn't chosen yet whether to subtract them.
 */
export const selectShouldAskAboutBorrowedFunds = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.borrowedFundsPreference === null && state.portfolio.borrowedBalance > 0

/**
 * The user's choice on subtracting borrowed funds from the total balance, null until they
 * choose, and its setter.
 */
const useBorrowedFundsPreference = () => {
  const { state: borrowedFundsPreference, dispatch: selectedAccountDispatch } = useController(
    'SelectedAccountController',
    selectBorrowedFundsPreference
  )

  const setBorrowedFundsPreference = useCallback(
    (preference: BorrowedFundsPreference) => {
      selectedAccountDispatch({
        type: 'method',
        params: {
          method: 'setBorrowedFundsPreference',
          args: [preference]
        }
      })
    },
    [selectedAccountDispatch]
  )

  return { borrowedFundsPreference, setBorrowedFundsPreference }
}

export default useBorrowedFundsPreference
