import React, { FC, useEffect, useState } from 'react'
import { View } from 'react-native'

import SuccessAnimation from '@common/components/SuccessAnimation'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import { getMsUntilNextSecond, getSecondsUntilClose } from './helpers'

import type { SafeSignatureAddedState } from '@common/hooks/useSign/useSign'

type Props = Pick<SafeSignatureAddedState, 'signedCount' | 'threshold' | 'closesAt'>

/**
 * Shown briefly after a Safe "Sign & Close", before the request closes on its own.
 * Makes it clear that only a signature was added - the transaction itself
 * can be sent once the rest of the required signatures are added
 */
const SafeSignatureAdded: FC<Props> = ({ signedCount, threshold, closesAt }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  // Read from closesAt instead of counted on its own, so a remount picks up where it was
  const [secondsUntilClose, setSecondsUntilClose] = useState(() =>
    getSecondsUntilClose(closesAt, Date.now())
  )

  useEffect(() => {
    let tickTimeout: ReturnType<typeof setTimeout> | undefined

    // Each tick reads the real time and schedules the next one from it, so a timer that
    // fires a moment early only re-checks shortly after, instead of skipping a second
    const tick = () => {
      const now = Date.now()
      const seconds = getSecondsUntilClose(closesAt, now)
      setSecondsUntilClose(seconds)

      // The request closes when the last second runs out, so the count never shows 0
      if (seconds <= 1) return

      tickTimeout = setTimeout(tick, getMsUntilNextSecond(closesAt, now))
    }

    tickTimeout = setTimeout(tick, getMsUntilNextSecond(closesAt, Date.now()))

    return () => clearTimeout(tickTimeout)
  }, [closesAt])

  return (
    <View
      style={[
        flexbox.flex1,
        flexbox.center,
        spacings.ph,
        { backgroundColor: theme.primaryBackground }
      ]}
      testID="safe-signature-added"
    >
      <SuccessAnimation />
      <Text fontSize={20} weight="medium" style={[spacings.mbTy, text.center]}>
        {t('Signature added')}
      </Text>
      <Text
        fontSize={14}
        weight="medium"
        appearance="secondaryText"
        style={[spacings.mbLg, text.center]}
      >
        {t(
          '{{signedCount}} of {{threshold}} signatures added. Once the rest are added, the transaction can be sent.',
          { signedCount, threshold }
        )}
      </Text>
      <Text fontSize={12} appearance="tertiaryText" style={text.center}>
        {t('Closing in {{seconds}}s...', { seconds: secondsUntilClose })}
      </Text>
    </View>
  )
}

export default React.memo(SafeSignatureAdded)
