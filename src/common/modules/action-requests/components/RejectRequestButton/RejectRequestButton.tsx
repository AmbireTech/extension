import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { DAPP_SILENCE_DURATION } from '@ambire-common/consts/safeguards/dappRequestSpam'
import CloseIcon from '@common/assets/svg/CloseIcon'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button, { Props as ButtonProps } from '@common/components/Button'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const SILENCE_DURATION_IN_MINUTES = DAPP_SILENCE_DURATION / 1000 / 60

const selectRejectOptions = (state: AllControllersMappingType['RequestsController']) =>
  state.currentRequestRejectOptions

const RejectOption = ({
  text,
  onPress,
  testID
}: {
  text: string
  onPress: () => void
  testID: string
}) => {
  const { theme, styles } = useTheme(getStyles)

  return (
    <HoverablePressable
      onPress={onPress}
      style={styles.option}
      accessibilityRole="button"
      testID={testID}
    >
      <Text fontSize={14} weight="medium" style={flexbox.flex1}>
        {text}
      </Text>
      <RightArrowIcon color={theme.secondaryText} />
    </HoverablePressable>
  )
}

type Props = Omit<ButtonProps, 'type' | 'onPress' | 'children' | 'childrenPosition' | 'text'> & {
  onReject: () => void
  /** Label of the button itself, e.g. "Reject" or "Cancel". */
  text: string
  /** Title of the options sheet, e.g. "Cancel transaction". */
  optionsTitle: string
  /** How the plain rejection reads as an option, e.g. "Cancel this transaction". */
  rejectOptionText: string
  withOptions?: boolean
}

/**
 * The Reject button on a screen showing an app's request. On its own it rejects, exactly as a
 * plain button would. When there is more the user can do about the app - clear the rest of its
 * queue, or silence it after it kept asking - the button grows an arrow and opens a sheet with
 * those choices instead.
 */
const RejectRequestButton = ({
  onReject,
  text,
  optionsTitle,
  rejectOptionText,
  withOptions = true,
  ...buttonProps
}: Props) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { ref: sheetRef, open, close } = useModalize()
  const { state: rejectOptions, dispatch: requestsDispatch } = useController(
    'RequestsController',
    selectRejectOptions
  )

  const dappRequestsCount = rejectOptions?.dappRequestsCount ?? 0
  const canSilenceDapp = !!rejectOptions?.canSilenceDapp
  const canRejectAll = dappRequestsCount > 1
  const hasOptions = withOptions && (canSilenceDapp || canRejectAll)

  const handleClose = useCallback(() => close(), [close])

  const handlePress = useCallback(() => {
    if (!hasOptions) {
      onReject()
      return
    }

    open()
  }, [hasOptions, onReject, open])

  const handleRejectCurrent = useCallback(() => {
    close()
    onReject()
  }, [close, onReject])

  const rejectAllFromDapp = useCallback(
    (shouldSilenceDapp: boolean) => {
      close()
      requestsDispatch({
        type: 'method',
        params: {
          method: 'rejectAllRequestsFromCurrentDapp',
          args: [t('User rejected the request.'), { shouldSilenceDapp }]
        }
      })
    },
    [close, requestsDispatch, t]
  )

  const handleRejectAll = useCallback(() => rejectAllFromDapp(false), [rejectAllFromDapp])
  const handleSilenceDapp = useCallback(() => rejectAllFromDapp(true), [rejectAllFromDapp])

  const sheetHeader = useMemo(
    () => (
      <View style={styles.sheetHeader}>
        <View style={flexbox.flex1}>
          <Text fontSize={18} weight="semiBold" style={styles.sheetTitle}>
            {optionsTitle}
          </Text>
          <Text fontSize={14} appearance="secondaryText" style={styles.sheetSubtitle}>
            {canSilenceDapp
              ? t('This app keeps sending requests after you refused it')
              : t('This app has more than one request waiting')}
          </Text>
        </View>
        <HoverablePressable
          onPress={handleClose}
          hitSlop={8}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel={t('Close')}
        >
          <CloseIcon color={theme.iconPrimary} width={14} height={14} />
        </HoverablePressable>
      </View>
    ),
    [canSilenceDapp, handleClose, optionsTitle, styles, t, theme.iconPrimary]
  )

  return (
    <>
      <Button
        type="danger"
        text={text}
        onPress={handlePress}
        childrenPosition="right"
        {...buttonProps}
      >
        {hasOptions ? <DownArrowIcon width={12} height={7} style={spacings.mlTy} /> : null}
      </Button>
      {!!hasOptions && (
        <BottomSheet
          id="reject-request-options"
          sheetRef={sheetRef}
          closeBottomSheet={handleClose}
          backgroundColor="secondaryBackground"
          HeaderComponent={sheetHeader}
        >
          <RejectOption
            text={rejectOptionText}
            onPress={handleRejectCurrent}
            testID="reject-request-option-current"
          />
          {!!canRejectAll && (
            <RejectOption
              text={t('Cancel all {{count}} requests from this app', { count: dappRequestsCount })}
              onPress={handleRejectAll}
              testID="reject-request-option-all"
            />
          )}
          {!!canSilenceDapp && (
            <RejectOption
              text={t('Block this app from sending requests for {{minutes}} min', {
                minutes: SILENCE_DURATION_IN_MINUTES
              })}
              onPress={handleSilenceDapp}
              testID="reject-request-option-silence"
            />
          )}
        </BottomSheet>
      )}
    </>
  )
}

export default React.memo(RejectRequestButton)
