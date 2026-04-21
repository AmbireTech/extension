import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Button, { Props as ButtonProps } from '@common/components/Button'
import ActionsPagination from '@common/modules/action-requests/components/ActionsPagination'
import spacings from '@common/styles/spacings'

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
  resolveNode
}: Props) => {
  const { t } = useTranslation()

  const handleOnResolve = useCallback(() => onResolve(), [onResolve])
  const showReject = useMemo(() => !!onReject, [onReject])

  return (
    <View style={[spacings.ptSm, spacings.phSm]}>
      {resolveNode || (
        <Button
          testID={resolveButtonTestID}
          size="large"
          type={resolveType}
          onPress={handleOnResolve}
          disabled={resolveDisabled}
          text={resolveButtonText}
        />
      )}
      {showReject && (
        <Button
          text={rejectButtonText || t('Reject')}
          type="danger"
          hasBottomSpacing={false}
          size="large"
          onPress={onReject}
          testID={rejectButtonTestID}
        />
      )}
      <ActionsPagination />
    </View>
  )
}

export default React.memo(ActionFooter)
