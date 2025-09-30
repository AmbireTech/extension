import React, { useCallback } from 'react'

import { TokenResult } from '@ambire-common/libs/portfolio'
import Button from '@common/components/Button'
import { useTranslation } from '@common/config/localization'
import useBackgroundService from '@web/hooks/useBackgroundService'
import { getUiType } from '@web/utils/uiType'

import BaseTokenItem from './BaseTokenItem'

const { isPopup } = getUiType()

const VestingTokenItem = ({ token }: { token: TokenResult }) => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()

  const sendVestingTransaction = useCallback(() => {
    dispatch({
      type: 'REQUESTS_CONTROLLER_BUILD_REQUEST',
      params: { type: 'mintVestingRequest', params: { token } }
    })
  }, [dispatch, token])

  return (
    <BaseTokenItem
      token={token}
      extraActions={
        <Button
          size="small"
          type="secondary"
          text={t('Claim')}
          onPress={sendVestingTransaction}
          hasBottomSpacing={false}
        />
      }
      label={!isPopup ? t('Claimable early supporters vestings') : t('Claimable vestings')}
    />
  )
}

export default React.memo(VestingTokenItem)
