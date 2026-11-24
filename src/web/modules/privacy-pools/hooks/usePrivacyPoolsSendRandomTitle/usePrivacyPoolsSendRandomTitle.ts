import { useState } from 'react'

import { useTranslation } from '@common/config/localization'

/**
 * A heading for a sent Privacy Pools transfer, picked at random once per mount. Call it from a
 * component mounted with the outcome, so that every transfer gets a new one.
 */
const usePrivacyPoolsSendRandomTitle = () => {
  const { t } = useTranslation()
  const titles: [string, ...string[]] = [
    t('Transfer in motion.'),
    t('Signed and on its way.'),
    t('Mission accomplished!'),
    t('Whoosh!'),
    t('Beep boop. Done!')
  ]
  const [titleIndex] = useState(() => Math.floor(Math.random() * titles.length))

  return titles[titleIndex] ?? titles[0]
}

export default usePrivacyPoolsSendRandomTitle
