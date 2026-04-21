import React, { FC, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { SubmittedAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'
import RefreshIcon from '@common/assets/svg/RefreshIcon'
import useController from '@common/hooks/useController'

import FooterActionLink from './FooterActionLink'

type Props = {
  accountAddr: string
  chainId: bigint
  rawCalls: SubmittedAccountOp['calls']
  textSize: number
  iconSize: number
  text?: string
}

const RepeatTransaction: FC<Props> = ({
  text,
  accountAddr,
  chainId,
  rawCalls,
  textSize,
  iconSize
}) => {
  const { t } = useTranslation()
  const { dispatch: requestsDispatch } = useController('RequestsController')

  const handleRepeatTransaction = useCallback(() => {
    if (!rawCalls) return

    requestsDispatch({
      type: 'method',
      params: {
        method: 'build',
        args: [
          {
            type: 'calls',
            params: {
              userRequestParams: {
                calls: rawCalls,
                meta: { chainId, accountAddr }
              }
            }
          }
        ]
      }
    })
  }, [rawCalls, chainId, accountAddr, requestsDispatch])

  return (
    <FooterActionLink
      label={text || t('Repeat Transaction')}
      onPress={handleRepeatTransaction}
      textSize={textSize}
      iconSize={iconSize}
      Icon={RefreshIcon}
    />
  )
}

export default RepeatTransaction
