import React, { useCallback, useMemo } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import CloseIcon from '@common/assets/svg/CloseIcon'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import BottomSheet from '@common/components/BottomSheet'
import HoverablePressable from '@common/components/HoverablePressable'
import ManifestImage from '@common/components/ManifestImage'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import {
  getRequestDappInfo,
  getRequestDescription,
  getRequestNetworkLabel,
  getRequestTitle,
  getUniquePreviewRequestsByIcon
} from './requestInfo'
import getStyles from './styles'

import type { Network } from '@ambire-common/interfaces/network'
import type { UserRequest } from '@ambire-common/interfaces/userRequest'
import type { AllControllersMappingType } from '@common/constants/controllersMapping'
const SET_CURRENT_REQUEST_PARAMS = {
  skipFocus: true
}

const selectCurrentUserRequest = (state: AllControllersMappingType['RequestsController']) =>
  state.currentUserRequest

const selectVisibleUserRequests = (state: AllControllersMappingType['RequestsController']) =>
  state.visibleUserRequests

const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks

const RequestIcon = React.memo(function RequestIcon({
  request,
  size
}: {
  request: UserRequest
  size: number
}) {
  const { t } = useTranslation()
  const { icon } = useMemo(() => getRequestDappInfo(request, t), [request, t])

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
  onOpen
}: {
  request: UserRequest
  networks: Network[]
  onOpen: (requestId: UserRequest['id']) => void
}) {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { title, description, networkLabel, dappUrl } = useMemo(() => {
    const dappInfo = getRequestDappInfo(request, t)

    return {
      title: getRequestTitle(request, t),
      description: getRequestDescription(request, t),
      networkLabel: getRequestNetworkLabel(request, networks, t),
      dappUrl: dappInfo.url
    }
  }, [networks, request, t])
  const handleOpen = useCallback(() => onOpen(request.id), [onOpen, request.id])

  return (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <RequestIcon request={request} size={32} />
      </View>
      <View style={styles.cardContent}>
        <Text weight="semiBold" fontSize={16} style={spacings.mbMi}>
          {title}
        </Text>
        <Text appearance="secondaryText" fontSize={14}>
          {description}
        </Text>
        <View style={styles.cardMetadata}>
          <View style={styles.metadataItem}>
            <Text fontSize={12} weight="medium" appearance="secondaryText" numberOfLines={1}>
              {networkLabel}
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Text
              fontSize={12}
              weight="medium"
              appearance="secondaryText"
              numberOfLines={1}
              ellipsizeMode="middle"
              style={styles.metadataText}
            >
              {dappUrl}
            </Text>
          </View>
        </View>
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
  )
})

type Props = {
  style?: StyleProp<ViewStyle>
}

const PendingRequests = ({ style }: Props) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { isCompactLayout } = useCompactActionRequestLayout()
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
  const otherRequests = useMemo(() => {
    if (!currentUserRequest) return []
    if (!visibleUserRequests.some(({ id }) => id === currentUserRequest.id)) return []

    return visibleUserRequests.filter(({ id }) => id !== currentUserRequest.id)
  }, [currentUserRequest, visibleUserRequests])
  const previewRequests = useMemo(
    () => getUniquePreviewRequestsByIcon(otherRequests),
    [otherRequests]
  )
  const handleClose = useCallback(() => closeBottomSheet(), [closeBottomSheet])
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
  const handleSummaryPress = useCallback(() => {
    if (otherRequests.length === 1) {
      openRequest(otherRequests[0]!.id)
      return
    }

    openBottomSheet()
  }, [openBottomSheet, openRequest, otherRequests])
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
  const actionText = otherRequests.length === 1 ? t('See it') : t('See all')

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
        type={isCompactLayout ? 'bottom-sheet' : 'modal'}
        backgroundColor="secondaryBackground"
      >
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
        {visibleUserRequests.map((request) => (
          <RequestCard
            key={String(request.id)}
            request={request}
            networks={networks}
            onOpen={openRequest}
          />
        ))}
      </BottomSheet>
    </>
  )
}

export default React.memo(PendingRequests)
