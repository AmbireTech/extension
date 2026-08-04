import React, { FC, useCallback, useMemo } from 'react'
import { View } from 'react-native'

import { CallsUserRequest } from '@ambire-common/interfaces/userRequest'
import CheckIcon from '@common/assets/svg/CheckIcon'
import ClockIcon from '@common/assets/svg/ClockIcon'
import RejectedIcon from '@common/assets/svg/RejectedIcon'
import Button from '@common/components/Button'
import HumanizedVisualization from '@common/components/HumanizedVisualization'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import FallbackVisualization from '@common/modules/sign-account-op/components/TransactionSummary/FallbackVisualization'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { getSafeQueueStatus } from './helpers'
import getStyles from './styles'

interface Props {
  request: CallsUserRequest
  closeBottomSheet: () => void
  withBorder?: boolean
}

const SafeQueueItem: FC<Props> = ({ request, closeBottomSheet, withBorder = true }) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const status = useMemo(() => getSafeQueueStatus(request), [request])
  const { accountOp, humanization, threshold } = request.signAccountOp
  const signedCount = accountOp.signed?.length || 0

  const statusDetails = useMemo(() => {
    if (status === 'ready') {
      return {
        label: t('Ready to broadcast'),
        color: theme.successText,
        Icon: CheckIcon
      }
    }
    if (status === 'rejected') {
      return { label: t('Rejected'), color: theme.errorText, Icon: RejectedIcon }
    }
    if (status === 'needs-signature') {
      return {
        label: t('Your signature needed'),
        color: theme.primaryAccent,
        Icon: ClockIcon
      }
    }
    return {
      label: t('Waiting for signatures'),
      color: theme.warningText,
      Icon: ClockIcon
    }
  }, [status, t, theme.errorText, theme.primaryAccent, theme.successText, theme.warningText])
  const StatusIcon = statusDetails.Icon

  const handleReject = useCallback(() => {
    requestsDispatch({
      type: 'method',
      params: {
        method: 'rejectUserRequests',
        args: [
          'User rejected the transaction request.',
          [request.id],
          { shouldOpenNextRequest: false }
        ]
      }
    })
  }, [request.id, requestsDispatch])

  const handleOpen = useCallback(() => {
    requestsDispatch({
      type: 'method',
      params: { method: 'setCurrentUserRequestById', args: [request.id] }
    })
    closeBottomSheet()
  }, [closeBottomSheet, request.id, requestsDispatch])

  const handleRestore = useCallback(() => {
    requestsDispatch({
      type: 'method',
      params: { method: 'restoreSafeUserRequest', args: [request.id] }
    })
  }, [request.id, requestsDispatch])

  return (
    <View
      style={[
        withBorder && styles.transactionCard,
        withBorder && spacings.phSm,
        withBorder && spacings.pvSm
      ]}
    >
      {humanization?.length ? (
        humanization.map((call, index) => (
          <View
            key={call.id}
            style={[
              styles.humanizationItem,
              spacings.phTy,
              spacings.pvTy,
              index !== humanization.length - 1 && spacings.mbTy
            ]}
          >
            {call.fullVisualization?.length ? (
              <HumanizedVisualization
                data={call.fullVisualization}
                chainId={accountOp.chainId}
                sizeMultiplierSize={0.5}
                textSize={12}
                imageSize={12}
                hasPadding={false}
                disableFlex
                style={flexbox.wrap}
                dapp={call.dapp}
              />
            ) : (
              <FallbackVisualization
                call={call}
                sizeMultiplierSize={0.5}
                textSize={12}
                hasPadding={false}
              />
            )}
          </View>
        ))
      ) : (
        <Text fontSize={12} appearance="secondaryText" style={spacings.mbTy}>
          {t('Preparing transaction details...')}
        </Text>
      )}

      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mtTy]}>
        <StatusIcon width={16} height={16} color={statusDetails.color} />
        <Text fontSize={12} weight="medium" color={statusDetails.color} style={spacings.mlMi}>
          {statusDetails.label}
        </Text>
      </View>

      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.mtTy
        ]}
      >
        <Text fontSize={12} appearance="secondaryText">
          {t('{{signedCount}} / {{threshold}} signed', { signedCount, threshold })}
        </Text>
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          {status === 'rejected' ? (
            <Button
              testID={`safe-queue-restore-${request.id}`}
              type="secondary"
              size="small"
              text={t('Restore')}
              onPress={handleRestore}
              hasBottomSpacing={false}
              style={{ minWidth: 84, height: 40 }}
            />
          ) : (
            <>
              <Button
                testID={`safe-queue-reject-${request.id}`}
                type="danger"
                size="small"
                text={t('Reject')}
                onPress={handleReject}
                hasBottomSpacing={false}
                style={{ minWidth: 76, height: 40 }}
              />
              <Button
                testID={`safe-queue-open-${request.id}`}
                type="primary"
                size="small"
                text={t('Open')}
                onPress={handleOpen}
                hasBottomSpacing={false}
                style={[spacings.mlTy, { minWidth: 76, height: 40 }]}
              />
            </>
          )}
        </View>
      </View>
    </View>
  )
}

export default React.memo(SafeQueueItem)
