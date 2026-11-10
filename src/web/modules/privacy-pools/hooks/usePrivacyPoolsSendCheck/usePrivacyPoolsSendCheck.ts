import { useEffect, useMemo } from 'react'

import { PrivacyPoolsWithdrawalPrivacy } from '@ambire-common/interfaces/privacyPools'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/** Waits for the user to stop typing, as each check may ask the network about the recipient. */
const CHECK_DEBOUNCE_MS = 300

const NO_AMOUNTS: bigint[] = []

const selectWithdrawalPrivacy = (state: AllControllersMappingType['PrivacyPoolsController']) =>
  state.withdrawalPrivacy

const selectPoolStats = (state: AllControllersMappingType['PrivacyPoolsController']) =>
  state.poolStats

type Params = {
  chainId: string
  tokenAddress: string
  /** 0 before the user enters an amount, which still gets the whole-deposit amounts. */
  amount: bigint
  /** Null before the user enters a valid one. */
  recipient: string | null
}

const isSameAddress = (a: string | null, b: string | null) =>
  (a?.toLowerCase() ?? null) === (b?.toLowerCase() ?? null)

/**
 * Checks what the Send form's transfer gives away, once the user stops typing, and again once the
 * pool's deposits are first read, as nothing can be checked before. Returns the result
 * only while it matches the form, so an answer about an older entry is never shown, and the amounts
 * that send whole deposits of the token.
 */
const usePrivacyPoolsSendCheck = (
  params: Params | null
): { privacy: PrivacyPoolsWithdrawalPrivacy | null; wholeNoteAmounts: bigint[] } => {
  const { state: check, dispatch } = useController(
    'PrivacyPoolsController',
    selectWithdrawalPrivacy
  )
  const { state: poolStats } = useController('PrivacyPoolsController', selectPoolStats)
  const chainId = params?.chainId
  const tokenAddress = params?.tokenAddress
  const amount = params?.amount
  const recipient = params?.recipient ?? null
  // Pool numbers come with the deposits the check needs
  const isPoolRead =
    !!chainId && !!tokenAddress && !!poolStats?.[chainId]?.byToken[tokenAddress.toLowerCase()]

  useEffect(() => {
    if (!chainId || !tokenAddress || amount === undefined) return

    const timeout = setTimeout(() => {
      dispatch({
        type: 'method',
        params: {
          method: 'checkWithdrawalPrivacy',
          args: [{ chainId, tokenAddress, amount, recipient }]
        }
      })
    }, CHECK_DEBOUNCE_MS)

    return () => clearTimeout(timeout)
  }, [amount, chainId, dispatch, isPoolRead, recipient, tokenAddress])

  return useMemo(() => {
    const isSameToken =
      !!check &&
      check.chainId === chainId &&
      !!tokenAddress &&
      isSameAddress(check.tokenAddress, tokenAddress)
    if (!isSameToken) return { privacy: null, wholeNoteAmounts: NO_AMOUNTS }

    const isSameSend = check.amount === amount && isSameAddress(check.recipient, recipient)

    return {
      privacy: isSameSend ? check.privacy : null,
      wholeNoteAmounts: check.wholeNoteAmounts
    }
  }, [amount, chainId, check, recipient, tokenAddress])
}

export default usePrivacyPoolsSendCheck
