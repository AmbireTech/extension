import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { getUiType } from '@common/utils/uiType'

const SET_CURRENT_REQUEST_PARAMS = {
  skipFocus: true
}

const { isPopup, isRequestWindow } = getUiType()
const shouldUseFixedWidth = isPopup || isRequestWindow

const ActionsPagination = () => {
  const {
    state: { currentUserRequest, visibleUserRequests },
    dispatch: requestsDispatch
  } = useController('RequestsController')
  const { t } = useTranslation()
  const { theme } = useTheme()
  const currentRequestIndex = useMemo(() => {
    if (!currentUserRequest) return undefined

    const idx = visibleUserRequests.findIndex((a) => a.id === currentUserRequest?.id)

    if (idx === -1) return undefined

    return idx
  }, [visibleUserRequests, currentUserRequest])

  const handleSmallPageStepDecrement = useCallback(() => {
    if (typeof currentRequestIndex !== 'number') return
    requestsDispatch({
      type: 'method',
      params: {
        method: 'setCurrentUserRequestByIndex',
        args: [currentRequestIndex - 1, SET_CURRENT_REQUEST_PARAMS]
      }
    })
  }, [currentRequestIndex, requestsDispatch])

  const handleSmallPageStepIncrement = useCallback(() => {
    if (typeof currentRequestIndex !== 'number') return
    requestsDispatch({
      type: 'method',
      params: {
        method: 'setCurrentUserRequestByIndex',
        args: [currentRequestIndex + 1, SET_CURRENT_REQUEST_PARAMS]
      }
    })
  }, [currentRequestIndex, requestsDispatch])

  const handleLargePageStepDecrement = useCallback(() => {
    requestsDispatch({
      type: 'method',
      params: {
        method: 'setCurrentUserRequestByIndex',
        args: [0, SET_CURRENT_REQUEST_PARAMS]
      }
    })
  }, [requestsDispatch])

  const handleLargePageStepIncrement = useCallback(() => {
    requestsDispatch({
      type: 'method',
      params: {
        method: 'setCurrentUserRequestByIndex',
        args: [visibleUserRequests.length - 1, SET_CURRENT_REQUEST_PARAMS]
      }
    })
  }, [requestsDispatch, visibleUserRequests.length])

  if (visibleUserRequests?.length <= 1) return null

  if (typeof currentRequestIndex !== 'number') return null

  const isFirstRequest = currentRequestIndex === 0
  const isLastRequest = currentRequestIndex === visibleUserRequests.length - 1
  const requestLabel = t('Request {{currentRequestIndex}} of {{numberOfAllActions}}', {
    currentRequestIndex: currentRequestIndex + 1,
    numberOfAllActions: visibleUserRequests.length
  })

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifyCenter,
        spacings.phSm,
        isWeb && !shouldUseFixedWidth ? spacings.mhMi : !isWeb ? spacings.mhSm : undefined,
        isWeb ? spacings.mbMi : spacings.mbSm,
        shouldUseFixedWidth ? { alignSelf: 'center', width: 260 } : { alignSelf: 'stretch' },
        {
          minHeight: 30,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          backgroundColor: theme.secondaryBackground
        }
      ]}
    >
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          { width: '100%', maxWidth: 640 }
        ]}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <HoverablePressable
            style={isFirstRequest && { opacity: 0.4 }}
            disabled={isFirstRequest}
            onPress={handleLargePageStepDecrement}
          >
            <View style={flexbox.directionRow}>
              <LeftArrowIcon />
              <LeftArrowIcon />
            </View>
          </HoverablePressable>
          <HoverablePressable
            style={[spacings.mlLg, isFirstRequest && { opacity: 0.4 }]}
            disabled={isFirstRequest}
            onPress={handleSmallPageStepDecrement}
          >
            <LeftArrowIcon />
          </HoverablePressable>
        </View>
        <Text fontSize={14} color={theme.primaryText} style={text.center}>
          {requestLabel}
        </Text>
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <HoverablePressable
            style={[spacings.mrLg, isLastRequest && { opacity: 0.4 }]}
            disabled={isLastRequest}
            onPress={handleSmallPageStepIncrement}
          >
            <RightArrowIcon />
          </HoverablePressable>
          <HoverablePressable
            style={isLastRequest && { opacity: 0.4 }}
            disabled={isLastRequest}
            onPress={handleLargePageStepIncrement}
          >
            <View style={flexbox.directionRow}>
              <RightArrowIcon />
              <RightArrowIcon />
            </View>
          </HoverablePressable>
        </View>
      </View>
    </View>
  )
}

export default React.memo(ActionsPagination)
