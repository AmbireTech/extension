import React from 'react'
import { View } from 'react-native'

import CloseIcon from '@common/assets/svg/CloseIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  title: string
  subtitle?: string
  onClose: () => void
  closeButtonTestID?: string
}

const CLOSE_BUTTON_SIZE = 40

/**
 * The title of a compact bottom sheet or modal, with a round close button next to it and
 * an optional line of explanation under it.
 */
const BottomSheetTitle = ({ title, subtitle, onClose, closeButtonTestID }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <View style={spacings.mbLg}>
      <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
        <Text fontSize={24} weight="semiBold" style={[flexbox.flex1, spacings.mrSm]}>
          {title}
        </Text>
        <HoverablePressable
          onPress={onClose}
          accessibilityLabel={t('Close')}
          testID={closeButtonTestID}
          style={[
            flexbox.center,
            {
              width: CLOSE_BUTTON_SIZE,
              height: CLOSE_BUTTON_SIZE,
              borderRadius: CLOSE_BUTTON_SIZE / 2,
              backgroundColor: theme.secondaryBackground
            }
          ]}
        >
          <CloseIcon color={theme.iconPrimary} />
        </HoverablePressable>
      </View>
      {!!subtitle && (
        <Text fontSize={14} appearance="secondaryText" style={spacings.mtMi}>
          {subtitle}
        </Text>
      )}
    </View>
  )
}

export default React.memo(BottomSheetTitle)
