import React, { FC } from 'react'

import CloseIcon from '@common/assets/svg/CloseIcon'
import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'

import SheetHeaderButtonSurface from './SheetHeaderButtonSurface'

type Props = {
  type: 'close' | 'back'
  onPress: () => void
}

/** The round X or ‹ back button in the header of a native bottom sheet. */
const SheetHeaderButton: FC<Props> = ({ type, onPress }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const isClose = type === 'close'

  return (
    <HoverablePressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isClose ? t('Close') : t('Back')}
      testID={isClose ? 'bottom-sheet-close-button' : 'bottom-sheet-back-button'}
    >
      <SheetHeaderButtonSurface>
        {isClose ? (
          <CloseIcon width={14} height={14} strokeWidth="2" color={theme.primaryText} />
        ) : (
          <LeftArrowIcon width={8} height={14} color={theme.primaryText} />
        )}
      </SheetHeaderButtonSurface>
    </HoverablePressable>
  )
}

export default React.memo(SheetHeaderButton)
