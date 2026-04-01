import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'

import Badge from '@common/components/Badge'

import BADGE_PRESETS from './presets'
import { Props } from './types'

const BadgeWithPreset: FC<Props> = ({ preset, ...rest }) => {
  const { t } = useTranslation()
  const { text, type, tooltipText, specialType } = BADGE_PRESETS[preset]

  return (
    <Badge
      {...rest}
      text={t(text)}
      type={type}
      specialType={Platform.OS === 'web' ? specialType : undefined}
      tooltipText={Platform.OS === 'web' ? t(tooltipText) : undefined}
    />
  )
}

export default BadgeWithPreset
