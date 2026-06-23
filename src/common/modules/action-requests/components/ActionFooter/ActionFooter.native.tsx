import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Button, { Props as ButtonProps } from '@common/components/Button'
import ActionsPagination from '@common/modules/action-requests/components/ActionsPagination'
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
  resolveNode,
  children
}: Props) => {
  const { t } = useTranslation()

  const handleOnResolve = useCallback(() => onResolve(), [onResolve])
  const showReject = useMemo(() => !!onReject, [onReject])

  return (
    <View style={[spacings.ptSm, spacings.phSm]}>
      {children}
      <View style={[flexbox.directionRow, { columnGap: SPACING_TY }]}>
        {showReject && (
          <View style={flexbox.flex1}>
            <Button
              text={rejectButtonText || t('Reject')}
              type="danger"
              hasBottomSpacing={false}
              size="large"
              onPress={onReject}
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
      <ActionsPagination />
    </View>
  )
}

export default React.memo(ActionFooter)
