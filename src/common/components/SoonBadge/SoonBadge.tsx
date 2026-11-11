import React from 'react'

import Badge from '@common/components/Badge'
import { useTranslation } from '@common/config/localization'

/** Marks a feature that is shown but not released yet, so it can't be used. */
const SoonBadge = () => {
  const { t } = useTranslation()

  return <Badge text={t('Soon')} type="primaryAccent" />
}

export default React.memo(SoonBadge)
