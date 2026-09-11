import React, { Suspense, useCallback, useMemo, useState } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import AmbireLogoWithBackgroundAndLogotype from '@common/assets/svg/AmbireLogoWithBackgroundAndLogotype'
import CloseIcon from '@common/assets/svg/CloseIcon'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import SafeIcon from '@common/assets/svg/SafeIcon'
import BottomSheet from '@common/components/BottomSheet'
import HoverablePressable from '@common/components/HoverablePressable'
import ManifestImage from '@common/components/ManifestImage'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import CompactHumanizedCalls from '@common/modules/sign-account-op/components/CompactHumanizedCalls/lazyCompactHumanizedCalls'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import CompactMessagePreview from './lazyCompactMessagePreview'
import {
  getIsAmbireWalletRequest,
  getIsSafeRequest,
  getRequestChainId,
  getRequestDappInfo,
  getRequestDescription,
  getRequestNetworkLabel,
  getRequestTitle,
  getUniquePreviewRequestsByIcon
} from './requestInfo'
import getStyles from './styles'

import type { Network } from '@ambire-common/interfaces/network'
import type { UserRequest } from '@ambire-common/interfaces/userRequest'
import type { IrMessage } from '@ambire-common/libs/humanizer/interfaces'
import type { AllControllersMappingType } from '@common/constants/controllersMapping'
const SET_CURRENT_REQUEST_PARAMS = {
  skipFocus: true
}

const selectCurrentUserRequest = (state: AllControllersMappingType['RequestsController']) =>
  state.currentUserRequest

const selectVisibleUserRequests = (state: AllControllersMappingType['RequestsController']) =>
  state.visibleUserRequests

const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks

const selectHumanizedMessage = (state: AllControllersMappingType['SignMessageController']) =>
  state.humanizedMessage

const RequestIcon = React.memo(function RequestIcon({
  request,
  size
}: {
  request: UserRequest
  size: number
}) {
  const { t } = useTranslation()
  const { icon } = useMemo(() => getRequestDappInfo(request, t), [request, t])

  if (getIsSafeRequest(request)) return <SafeIcon width={size} height={size} />

  if (getIsAmbireWalletRequest(request)) {
    return <AmbireLogoWithBackgroundAndLogotype width={size} withText={false} />
  }

  return (
    <ManifestImage
      uri={icon}
      size={size}
      isRound
      fallback={() => <ManifestFallbackIcon width={size} height={size} />}
    />
  )
})

const RequestCard = React.memo(function RequestCard({
  request,
  networks,
  onOpen,
  shouldRenderHumanization,
  humanizedMessage
}: {
  request: UserRequest
  networks: Network[]
  onOpen: (requestId: UserRequest['id']) => void
  shouldRenderHumanization: boolean
  humanizedMessage?: IrMessage
}) {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { title, description, networkLabel, requestChainId } = useMemo(() => {
    return {
      title: getRequestTitle(request, t),
      description: getRequestDescription(request, t),
      networkLabel: getRequestNetworkLabel(request, networks, t),
      requestChainId: getRequestChainId(request)
    }
  }, [networks, request, t])
  const handleOpen = useCallback(() => onOpen(request.id), [onOpen, request.id])

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.cardIcon}>
            <RequestIcon request={request} size={24} />
          </View>
          <Text weight="semiBold" fontSize={16} style={styles.cardTitle}>
            {title}
          </Text>
        </View>
        <HoverablePressable
          onPress={handleOpen}
          style={styles.openButton}
          accessibilityRole="button"
          accessibilityLabel={t('Open {{requestTitle}}', { requestTitle: title })}
        >
          <Text appearance="linkText" weight="medium">
            {t('Open')}
          </Text>
        </HoverablePressable>
      </View>
      <Text appearance="secondaryText" fontSize={14} style={styles.cardDescription}>
        {description}
      </Text>
      {shouldRenderHumanization &&
      request.kind === 'calls' &&
      request.signAccountOp.humanization?.length ? (
        <Suspense fallback={null}>
          <View style={styles.cardHumanization}>
            <CompactHumanizedCalls
              humanization={request.signAccountOp.humanization}
              chainId={request.signAccountOp.accountOp.chainId}
            />
          </View>
        </Suspense>
      ) : null}
      {shouldRenderHumanization &&
      (request.kind === 'message' || request.kind === 'typedMessage') ? (
        <Suspense fallback={null}>
          <CompactMessagePreview
            request={request}
            humanizedMessage={humanizedMessage}
            style={styles.cardHumanization}
          />
        </Suspense>
      ) : null}
      <View style={styles.cardNetwork}>
        <Text fontSize={isMobile ? 12 : 14} appearance="secondaryText">
          {t('On')}
        </Text>
        {!!requestChainId && (
          <NetworkIcon id={requestChainId} name={networkLabel} size={18} style={spacings.mhMi} />
        )}
        <Text
          fontSize={isMobile ? 12 : 14}
          appearance="secondaryText"
          style={!requestChainId ? spacings.mlMi : undefined}
        >
          {networkLabel}
        </Text>
      </View>
    </View>
  )
})

type Props = {
  style?: StyleProp<ViewStyle>
}

const PendingRequests = ({ style }: Props) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { isCompactLayout } = useCompactActionRequestLayout()
  const [shouldRenderHumanization, setShouldRenderHumanization] = useState(false)
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { state: currentUserRequest, dispatch: requestsDispatch } = useController(
    'RequestsController',
    selectCurrentUserRequest
  )
  const { state: visibleUserRequests } = useController(
    'RequestsController',
    selectVisibleUserRequests
  )
  const { state: networks } = useController('NetworksController', selectNetworks)
  const { state: humanizedMessage } = useController('SignMessageController', selectHumanizedMessage)
  const otherRequests = useMemo(() => {
    if (!currentUserRequest) return []
    if (!visibleUserRequests.some(({ id }) => id === currentUserRequest.id)) return []

    return visibleUserRequests.filter(({ id }) => id !== currentUserRequest.id)
  }, [currentUserRequest, visibleUserRequests])
  const previewRequests = useMemo(() => {
    if (!currentUserRequest) return []

    return getUniquePreviewRequestsByIcon(visibleUserRequests)
  }, [currentUserRequest, visibleUserRequests])
  const handleClose = useCallback(() => closeBottomSheet(), [closeBottomSheet])
  const handleSheetOpen = useCallback(() => setShouldRenderHumanization(true), [])
  const handleSheetClosed = useCallback(() => setShouldRenderHumanization(false), [])
  const openRequest = useCallback(
    (requestId: UserRequest['id']) => {
      closeBottomSheet()
      if (requestId === currentUserRequest?.id) return

      requestsDispatch({
        type: 'method',
        params: {
          method: 'setCurrentUserRequestById',
          args: [requestId, SET_CURRENT_REQUEST_PARAMS]
        }
      })
    },
    [closeBottomSheet, currentUserRequest?.id, requestsDispatch]
  )
  const handleSummaryPress = useCallback(() => openBottomSheet(), [openBottomSheet])
  const sheetHeader = useMemo(
    () => (
      <View style={styles.sheetHeader}>
        <View style={[flexbox.flex1, spacings.mrSm]}>
          <Text fontSize={20} weight="semiBold" style={spacings.mbMi}>
            {t('Pending requests')}
          </Text>
          <Text appearance="secondaryText">{t('Open any request to review it.')}</Text>
        </View>
        <HoverablePressable
          onPress={handleClose}
          hitSlop={8}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel={t('Close pending requests')}
        >
          <CloseIcon color={theme.iconPrimary} width={14} height={14} />
        </HoverablePressable>
      </View>
    ),
    [handleClose, styles.closeButton, styles.sheetHeader, t, theme.iconPrimary]
  )
  const previewIcons = useMemo(
    () => (
      <View style={styles.iconStack}>
        {previewRequests.map((request, index) => (
          <View
            key={String(request.id)}
            style={[styles.summaryIcon, index > 0 && { marginLeft: -12, zIndex: index }]}
          >
            <RequestIcon request={request} size={22} />
          </View>
        ))}
      </View>
    ),
    [previewRequests, styles.iconStack, styles.summaryIcon]
  )

  if (!currentUserRequest || !otherRequests.length) return null

  const requestCountText =
    otherRequests.length === 1
      ? t('1 more pending request')
      : t('{{count}} more pending requests', { count: otherRequests.length })
  const actionText = t('See all')

  return (
    <>
      <View style={[styles.summary, style]}>
        <View style={styles.summaryContent}>
          {previewIcons}
          <Text fontSize={14} weight="medium">
            {requestCountText}
          </Text>
          <HoverablePressable
            onPress={handleSummaryPress}
            hitSlop={12}
            style={spacings.mlSm}
            accessibilityRole="button"
            accessibilityLabel={`${requestCountText}. ${actionText}`}
          >
            <Text appearance="linkText" underline fontSize={14} weight="medium">
              {actionText}
            </Text>
          </HoverablePressable>
        </View>
      </View>
      <BottomSheet
        id="pending-requests"
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        onOpen={handleSheetOpen}
        onClosed={handleSheetClosed}
        type={isCompactLayout ? 'bottom-sheet' : 'modal'}
        backgroundColor="secondaryBackground"
        HeaderComponent={sheetHeader}
      >
        {visibleUserRequests.map((request) => (
          <RequestCard
            key={String(request.id)}
            request={request}
            networks={networks}
            onOpen={openRequest}
            shouldRenderHumanization={shouldRenderHumanization}
            humanizedMessage={humanizedMessage}
          />
        ))}
      </BottomSheet>
    </>
  )
}

export default React.memo(PendingRequests)
