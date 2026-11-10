import React, { FC, useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { PrivacyPoolsLeakId } from '@ambire-common/interfaces/privacyPools'
import InfoIcon from '@common/assets/svg/InfoIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import PrivacyModal from './PrivacyModal'
import { PrivacyStatusProps } from './types'

type Props = Omit<PrivacyStatusProps, 'stage'> & {
  /** The leaks that come from the field, e.g. `PRIVACY_POOLS_RECIPIENT_LEAK_IDS`. */
  fieldLeakIds: PrivacyPoolsLeakId[]
  testID: string
}

const ICON_SIZE = 14

/**
 * A short note under a field of a send, such as the recipient, on what in it makes the transfer
 * easy to link to the user. It opens every suggestion with its fixes. Renders nothing when the
 * field is fine.
 */
const PrivacyFieldNote: FC<Props> = ({ fieldLeakIds, testID, ...props }) => {
  const { leaks, style } = props
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { ref: sheetRef, open: openSheet, close: closeSheet } = useModalize()
  const handleOpen = useCallback(() => openSheet(), [openSheet])

  const fieldLeaks = useMemo(
    () => leaks.filter(({ id }) => fieldLeakIds.includes(id)),
    [fieldLeakIds, leaks]
  )
  // Leaks come worst first
  const worstLeak = fieldLeaks[0]
  if (!worstLeak) return null

  const textAppearance =
    worstLeak.type === 'error'
      ? 'errorText'
      : worstLeak.type === 'warning'
        ? 'warningText'
        : 'infoText'
  const iconColor =
    worstLeak.type === 'error'
      ? theme.errorText
      : worstLeak.type === 'warning'
        ? theme.warningText
        : theme.infoText
  const NoteIcon = worstLeak.type === 'info' ? InfoIcon : WarningIcon
  const otherLeaksCount = fieldLeaks.length - 1

  return (
    <View style={style}>
      <HoverablePressable
        testID={testID}
        onPress={handleOpen}
        style={[flexbox.directionRow, flexbox.alignCenter]}
      >
        <NoteIcon width={ICON_SIZE} height={ICON_SIZE} color={iconColor} style={spacings.mrMi} />
        <Text fontSize={12} appearance={textAppearance} style={flexbox.flex1}>
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
