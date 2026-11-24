import React from 'react'

import Completed from '@common/components/TrackProgress/ByStatus/Completed'
import { useTranslation } from '@common/config/localization'
import usePrivacyPoolsSendRandomTitle from '@web/modules/privacy-pools/hooks/usePrivacyPoolsSendRandomTitle'

type Props = {
  symbol: string | undefined
}

/**
 * The success outcome of a Privacy Pools transfer. Mounted only with the outcome, so that its
 * random heading is picked anew for every transfer.
 */
const PrivacyPoolsSendCompleted = ({ symbol }: Props) => {
  const { t } = useTranslation()
  const title = usePrivacyPoolsSendRandomTitle()

  return (
    <Completed
      title={title}
      titleSecondary={t('Your {{symbol}} is on its way.', { symbol: symbol || t('Token') })}
      openExplorerText={t('View Transfer')}
    />
  )
}

export default React.memo(PrivacyPoolsSendCompleted)
