import React, { FC, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { SubmittedAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'
import RefreshIcon from '@common/assets/svg/RefreshIcon'
import useController from '@common/hooks/useController'

import FooterActionLink from './FooterActionLink'

type Props = {
  submittedAccountOp: SubmittedAccountOp
  textSize: number
  iconSize: number
  text?: string
}

const increaseByFifteenPercent = (value: bigint) => (value * 115n + 99n) / 100n

const SpeedUpTransaction: FC<Props> = ({ text, submittedAccountOp, textSize, iconSize }) => {
  const { t } = useTranslation()
  const { dispatch: requestsDispatch } = useController('RequestsController')

  const handleSpeedUpTransaction = useCallback(() => {
    if (!submittedAccountOp.calls || !submittedAccountOp.gasFeePayment) return

    const gasFeePayment = {
      ...submittedAccountOp.gasFeePayment,
      gasPrice: increaseByFifteenPercent(submittedAccountOp.gasFeePayment.gasPrice),
      maxPriorityFeePerGas:
        submittedAccountOp.gasFeePayment.maxPriorityFeePerGas &&
        submittedAccountOp.gasFeePayment.maxPriorityFeePerGas !== 0n
          ? increaseByFifteenPercent(submittedAccountOp.gasFeePayment.maxPriorityFeePerGas)
          : submittedAccountOp.gasFeePayment.maxPriorityFeePerGas
    }

    requestsDispatch({
      type: 'method',
      params: {
        method: 'build',
        args: [
          {
            type: 'calls',
            params: {
              userRequestParams: {
                calls: submittedAccountOp.calls,
                meta: {
                  chainId: submittedAccountOp.chainId,
                  accountAddr: submittedAccountOp.accountAddr
                },
                accountOp: {
                  id: submittedAccountOp.id,
                  accountAddr: submittedAccountOp.accountAddr,
                  chainId: submittedAccountOp.chainId,
                  signingKeyAddr: submittedAccountOp.signingKeyAddr,
                  signingKeyType: submittedAccountOp.signingKeyType,
                  nonce: submittedAccountOp.nonce,
                  eoaNonce: submittedAccountOp.eoaNonce,
                  calls: submittedAccountOp.calls,
                  feeCall: submittedAccountOp.feeCall,
                  activatorCall: submittedAccountOp.activatorCall,
                  gasLimit: submittedAccountOp.gasLimit,
                  signature: submittedAccountOp.signature,
                  gasFeePayment,
                  txnId: submittedAccountOp.txnId,
                  asUserOperation: submittedAccountOp.asUserOperation,
                  signers: submittedAccountOp.signers,
                  signed: submittedAccountOp.signed,
                  safeTx: submittedAccountOp.safeTx,
                  flags: submittedAccountOp.flags,
                  meta: {
                    ...submittedAccountOp.meta,
                    speedUp: {
                      enabled: true
                    }
                  }
                }
              }
            }
          }
        ]
      }
    })
  }, [submittedAccountOp, requestsDispatch])

  return (
    <FooterActionLink
      label={text || t('Speed Up Transaction')}
      onPress={handleSpeedUpTransaction}
      textSize={textSize}
      iconSize={iconSize}
      Icon={RefreshIcon}
    />
  )
}

export default SpeedUpTransaction
