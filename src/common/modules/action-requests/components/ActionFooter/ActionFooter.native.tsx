import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextLayoutEventData,
  View,
  ViewStyle
} from 'react-native'

import Button, { Props as ButtonProps } from '@common/components/Button'
import getButtonStyles from '@common/components/Button/styles'
import useTheme from '@common/hooks/useTheme'
import RejectRequestButton from '@common/modules/action-requests/components/RejectRequestButton'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

// As wide as the resolve button's text, which is inset by the button's padding and border
const RESOLVE_TEXT_MEASURE_STYLE: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
  ...spacings.phXl,
  borderWidth: 1,
  borderColor: 'transparent',
  opacity: 0
}

type Props = {
  onReject?: () => void
  onResolve: () => void
  rejectButtonText?: string
  resolveButtonText?: string
  /** Shown instead of `resolveButtonText` when that doesn't fit on one row */
  resolveButtonShortText?: string
  resolveDisabled?: boolean
  resolveType?: ButtonProps['type']
  rejectButtonTestID?: string
  resolveButtonTestID?: string
  /**
   * Turns Reject into a button that can also clear the app's whole queue or silence it.
   */
  withRejectOptions?: boolean
  /** Title of the reject options sheet, e.g. "Cancel connection". Needed with `withRejectOptions`. */
  rejectOptionsTitle?: string
  /** How the plain rejection reads as an option, e.g. "Cancel this connection". */
  rejectOptionText?: string
  /** Optional custom node to replace the default resolve button */
  resolveNode?: React.ReactNode
  children?: React.ReactNode
}

const ActionFooter = ({
  onReject,
  onResolve,
  rejectButtonText,
  resolveButtonText,
  resolveButtonShortText,
  resolveDisabled = false,
  resolveType = 'primary',
  rejectButtonTestID,
  resolveButtonTestID,
  withRejectOptions = false,
  rejectOptionsTitle = '',
  rejectOptionText = '',
  resolveNode,
  children
}: Props) => {
  const { t } = useTranslation()
  const { styles: buttonStyles } = useTheme(getButtonStyles)
  const [doesResolveTextWrap, setDoesResolveTextWrap] = useState(false)

  const handleOnResolve = useCallback(() => onResolve(), [onResolve])

  const handleResolveTextLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) =>
      setDoesResolveTextWrap(e.nativeEvent.lines.length > 1),
    []
  )

  return (
    <View style={[spacings.ptSm, spacings.phSm]}>
      {children}
      <View style={[flexbox.directionRow, { columnGap: SPACING_TY }]}>
        {!!onReject && (
          <View style={flexbox.flex1}>
            <RejectRequestButton
              text={rejectButtonText || t('Reject')}
              hasBottomSpacing={false}
              size="large"
              onReject={onReject}
              withOptions={withRejectOptions}
              optionsTitle={rejectOptionsTitle}
              rejectOptionText={rejectOptionText}
              testID={rejectButtonTestID}
            />
          </View>
        )}
        {resolveNode || (
          <View style={flexbox.flex1}>
            {!!resolveButtonShortText && (
              // An invisible copy of the full text tells whether it fits on one row
              <View pointerEvents="none" style={RESOLVE_TEXT_MEASURE_STYLE}>
                <Text
                  onTextLayout={handleResolveTextLayout}
                  style={[buttonStyles.buttonText, buttonStyles.buttonTextStylesSizeLarge]}
                >
                  {resolveButtonText}
                </Text>
              </View>
            )}
            <Button
              testID={resolveButtonTestID}
              hasBottomSpacing={false}
              size="large"
              type={resolveType}
              onPress={handleOnResolve}
              disabled={resolveDisabled}
              text={
                resolveButtonShortText && doesResolveTextWrap
                  ? resolveButtonShortText
                  : resolveButtonText
              }
            />
          </View>
        )}
      </View>
    </View>
  )
}

export default React.memo(ActionFooter)
