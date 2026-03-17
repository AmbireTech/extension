import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Button, { Props as ButtonProps } from '@common/components/Button'
import GlassView from '@common/components/GlassView'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import ActionsPagination from '../ActionsPagination'

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
    <View style={[flexbox.alignCenter, spacings.pb]}>
      <GlassView borderRadius={28}>
        <View style={[flexbox.directionRow, spacings.phSm, spacings.pvSm]}>
          <View style={flexbox.flex1}>
            {showReject && (
              <View style={[flexbox.flex1, spacings.mrLg]}>
                <Button
                  text={rejectButtonText || t('Reject')}
                  type="danger"
                  hasBottomSpacing={false}
                  size="large"
                  onPress={onReject}
                  testID={rejectButtonTestID}
                  style={flexbox.alignSelfStart}
                />
              </View>
            )}
          </View>
          <ActionsPagination />
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
