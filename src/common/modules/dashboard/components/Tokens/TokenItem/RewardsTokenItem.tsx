import React, { useCallback } from 'react'

import { TokenResult } from '@ambire-common/libs/portfolio'
import Button from '@common/components/Button'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'
import useBackgroundService from '@web/hooks/useBackgroundService'

import BaseTokenItem from './BaseTokenItem'

const RewardsTokenItem = ({ token }: { token: TokenResult }) => {
  const { t } = useTranslation()
  const { themeType } = useTheme()
  const { dispatch } = useBackgroundService()

  const sendClaimTransaction = useCallback(() => {
    dispatch({
      type: 'REQUESTS_CONTROLLER_BUILD_REQUEST',
      params: { type: 'claimWalletRequest', params: { token } }
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
          hasBottomSpacing={false}
          onPress={sendClaimTransaction}
        />
      }
      gradientStyle={
        themeType === THEME_TYPES.DARK
          ? 'linear-gradient(81deg, #2B2D36 0%, #2A1D6F 100%)'
          : 'linear-gradient(81deg, #D6DBF3 0%, #6000FF 100%)'
      }
      label={t('Claimable rewards')}
      borderRadius={16}
    />
  )
}

export default React.memo(RewardsTokenItem)
