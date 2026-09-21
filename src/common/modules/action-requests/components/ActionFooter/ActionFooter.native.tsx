import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Button, { Props as ButtonProps } from '@common/components/Button'
import RejectRequestButton from '@common/modules/action-requests/components/RejectRequestButton'
import spacings, { SPACING_TY } from '@common/styles/spacings'
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

  const handleOnResolve = useCallback(() => onResolve(), [onResolve])

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
            <Button
              testID={resolveButtonTestID}
              hasBottomSpacing={false}
              size="large"
              type={resolveType}
              onPress={handleOnResolve}
              disabled={resolveDisabled}
              text={resolveButtonText}
            />
          </View>
        )}
      </View>
    </View>
  )
}

export default React.memo(ActionFooter)
