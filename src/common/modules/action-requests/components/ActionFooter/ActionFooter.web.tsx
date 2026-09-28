import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Button, { Props as ButtonProps } from '@common/components/Button'
import GlassView from '@common/components/GlassView'
import RejectRequestButton from '@common/modules/action-requests/components/RejectRequestButton'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import spacings, { SPACING, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  onReject?: () => void
  onResolve: () => void
  rejectButtonText?: string
  resolveButtonText?: string
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
  /** Optional content rendered above the footer buttons (e.g. view-only alert) */
  children?: React.ReactNode
}

const ActionFooter = ({
  onReject,
  onResolve,
  rejectButtonText,
  resolveButtonText,
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
  const { isWideFooterLayout } = useCompactActionRequestLayout()

  const handleOnResolve = useCallback(() => onResolve(), [onResolve])

  const rejectButton = onReject ? (
    <View style={[flexbox.flex1, { minWidth: 0 }]}>
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
  ) : null

  const resolveButton = resolveNode ? (
    <View style={[flexbox.flex1, { minWidth: 0 }]}>{resolveNode}</View>
  ) : (
    <View style={[flexbox.flex1, { minWidth: 0 }]}>
      <Button
        testID={resolveButtonTestID}
        size="large"
        type={resolveType}
        hasBottomSpacing={false}
        onPress={handleOnResolve}
        disabled={resolveDisabled}
        text={resolveButtonText}
      />
    </View>
  )

  if (!isWideFooterLayout) {
    return (
      <View style={[spacings.ptSm, spacings.phSm, spacings.pbSm, { width: '100%' }]}>
        {children}
        <View style={[flexbox.directionRow, { width: '100%', gap: SPACING_TY }]}>
          {rejectButton}
          {resolveButton}
        </View>
      </View>
    )
  }

  return (
    <View style={[flexbox.alignCenter, spacings.pb]}>
      {children}
      <GlassView borderRadius={28} cssStyle={{ flexDirection: 'column', padding: SPACING }}>
        <View style={[flexbox.directionRow]}>
          <View style={flexbox.flex1}>
            {!!onReject && (
              <View style={[flexbox.flex1, spacings.mrLg]}>
                <RejectRequestButton
                  text={rejectButtonText || t('Reject')}
                  hasBottomSpacing={false}
                  size="large"
                  onReject={onReject}
                  withOptions={withRejectOptions}
                  optionsTitle={rejectOptionsTitle}
                  rejectOptionText={rejectOptionText}
                  testID={rejectButtonTestID}
                  style={flexbox.alignSelfStart}
                />
              </View>
            )}
          </View>
          <View style={flexbox.flex1} />
          {resolveNode || (
            <View style={flexbox.flex1}>
              <Button
                testID={resolveButtonTestID}
                style={{
                  ...spacings.phLg,
                  ...flexbox.alignSelfEnd,
                  minWidth: 128
                }}
                textStyle={{
                  whiteSpace: 'nowrap'
                }}
                size="large"
                type={resolveType}
                hasBottomSpacing={false}
                onPress={handleOnResolve}
                disabled={resolveDisabled}
                text={resolveButtonText}
              />
            </View>
          )}
        </View>
      </GlassView>
    </View>
  )
}

export default React.memo(ActionFooter)
