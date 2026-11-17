import { useEffect, useMemo, useState } from 'react'

import { submittedAccountOpToAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'
import { humanizeAccountOp } from '@ambire-common/libs/humanizer'
import type { Erc7730CallDescriptors } from '@ambire-common/libs/humanizer/erc7730/types'
import type { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import useController from '@common/hooks/useController'

import { getDappInteractionsFromHumanizedCalls, getHumanizedCalls } from './humanizedHelpers'
import { DappInteraction, SubmittedAccountOpLike } from './types'

/**
 * Renders the plain humanization immediately, then upgrades it in place once `Erc7730Controller`
 * resolves the "clear signing" descriptors, so a past transaction reads the same way it did while
 * being signed. Any failure (unreachable relayer, no descriptor for these calls) simply leaves the
 * plain humanization on screen.
 */
export const useHumanizedCalls = (submittedAccountOp: SubmittedAccountOpLike): IrCall[] => {
  const { dispatchAndWait } = useController('Erc7730Controller')
  const fallbackCalls = useMemo(() => getHumanizedCalls(submittedAccountOp), [submittedAccountOp])
  const [erc7730Calls, setErc7730Calls] = useState<IrCall[] | null>(null)

  useEffect(() => {
    let isStale = false
    const accountOp = submittedAccountOpToAccountOp(submittedAccountOp)

    dispatchAndWait<'resolveDescriptorsForAccountOp', Erc7730CallDescriptors>({
      type: 'method',
      params: { method: 'resolveDescriptorsForAccountOp', args: [accountOp] }
    })
      .then((erc7730Descriptors) => {
        if (isStale || !erc7730Descriptors || !Object.keys(erc7730Descriptors).length) return

        setErc7730Calls(
          humanizeAccountOp(accountOp, { erc7730Descriptors }).map((call, index) => ({
            ...call,
            id: call.id || String(index)
          }))
        )
      })
      .catch((error) => {
        // The plain humanization stays on screen, so this is not worth interrupting the user over
        captureException(error)
      })

    return () => {
      isStale = true
      setErc7730Calls(null)
    }
  }, [submittedAccountOp, dispatchAndWait])

  return erc7730Calls ?? fallbackCalls
}

export const useDappInteractions = (
  submittedAccountOp: SubmittedAccountOpLike
): DappInteraction[] => {
  const humanizedCalls = useHumanizedCalls(submittedAccountOp)

  return useMemo(
    () => getDappInteractionsFromHumanizedCalls(submittedAccountOp, humanizedCalls),
    [submittedAccountOp, humanizedCalls]
  )
}
