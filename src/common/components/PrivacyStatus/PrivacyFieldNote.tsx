import React, { FC, useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { PrivacyPoolsLeakId } from '@ambire-common/interfaces/privacyPools'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'

import { getLeakTextAppearance } from './helpers'
import PrivacyModal from './PrivacyModal'
import { PrivacyStatusProps } from './types'

type Props = Omit<PrivacyStatusProps, 'stage'> & {
  /** The leaks that come from the field, e.g. `PRIVACY_POOLS_RECIPIENT_LEAK_IDS`. */
  fieldLeakIds: PrivacyPoolsLeakId[]
  testID: string
}

/**
 * A short note under a field of a send, such as the recipient, on what in it makes the transfer
 * easy to link to the user. It opens every suggestion with its fixes. Renders nothing when the
 * field is fine.
 */
const PrivacyFieldNote: FC<Props> = ({ fieldLeakIds, testID, ...props }) => {
  const { leaks, style } = props
  const { t } = useTranslation()
  const { ref: sheetRef, open: openSheet, close: closeSheet } = useModalize()
  const handleOpen = useCallback(() => openSheet(), [openSheet])

  const fieldLeaks = useMemo(
    () => leaks.filter(({ id }) => fieldLeakIds.includes(id)),
    [fieldLeakIds, leaks]
  )
  // Leaks come worst first
  const worstLeak = fieldLeaks[0]
  if (!worstLeak) return null

  const textAppearance = getLeakTextAppearance(worstLeak.type)
  const otherLeaksCount = fieldLeaks.length - 1

  return (
    <View style={style}>
      <HoverablePressable testID={testID} onPress={handleOpen}>
        <Text fontSize={12} appearance={textAppearance}>
          {t(worstLeak.title)}
          {otherLeaksCount > 0 && ` · ${t('{{count}} more', { count: otherLeaksCount })}`}
          {' · '}
          <Text fontSize={12} appearance={textAppearance} underline>
            {t('Details')}
          </Text>
        </Text>
      </HoverablePressable>
      <PrivacyModal {...props} stage="send" sheetRef={sheetRef} closeBottomSheet={closeSheet} />
    </View>
  )
}

export default React.memo(PrivacyFieldNote)
