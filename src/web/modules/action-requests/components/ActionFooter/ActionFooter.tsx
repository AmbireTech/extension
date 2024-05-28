import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import CloseIcon from '@common/assets/svg/CloseIcon'
import Button from '@common/components/Button'
import Tooltip from '@common/components/Tooltip'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import ActionsPagination from '../ActionsPagination'

type Props = {
  onReject: () => void
  onResolve: () => void
  rejectButtonText?: string
  resolveButtonText: string
  resolveDisabled: boolean
  rejectButtonTestID?: string
  resolveButtonTestID?: string
}

const ActionFooter = ({
  onReject,
  onResolve,
  rejectButtonText,
  resolveButtonText,
  resolveDisabled,
  rejectButtonTestID,
  resolveButtonTestID
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <>
      <View style={flexbox.flex1}>
        <Button
          text={rejectButtonText || t('Reject')}
          type="danger"
          hasBottomSpacing={false}
          size="large"
          onPress={onReject}
          testID={rejectButtonTestID}
          style={flexbox.alignSelfStart}
        >
          <View style={spacings.pl}>
            <CloseIcon color={theme.errorDecorative} />
          </View>
        </Button>
      </View>
      <ActionsPagination />
      <View style={flexbox.flex1}>
        <Button
          testID={resolveButtonTestID}
          style={{ ...spacings.phLg, ...flexbox.alignSelfEnd }}
          size="large"
          hasBottomSpacing={false}
          onPress={onResolve}
          disabled={resolveDisabled}
          text={resolveButtonText}
        />
      </View>
      <Tooltip id="coming-soon" />
    </>
  )
}

export default React.memo(ActionFooter)
