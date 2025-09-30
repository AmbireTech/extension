import React, { useCallback } from 'react'

import { TokenResult } from '@ambire-common/libs/portfolio'
import Button from '@common/components/Button'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'

import BaseTokenItem from './BaseTokenItem'

const ProjectedRewardsTokenItem = ({ token }: { token: TokenResult }) => {
  const { t } = useTranslation()
  const { themeType } = useTheme()

  return (
    <BaseTokenItem
      token={token}
      extraActions={
        <Button
          size="small"
          type="secondary"
          text={t('Learn more')}
          hasBottomSpacing={false}
          onPress={() => console.log('Learn more about projected rewards')}
        />
      }
      gradientStyle={
        themeType === THEME_TYPES.DARK
          ? 'linear-gradient(81deg, #2B2D36 0%, #2A1D6F 100%)'
          : 'linear-gradient(81deg, #D6DBF3 0%, #6000FF 100%)'
      }
      label={t('Projected rewards')}
      borderRadius={16}
    />
  )
}

export default React.memo(ProjectedRewardsTokenItem)
