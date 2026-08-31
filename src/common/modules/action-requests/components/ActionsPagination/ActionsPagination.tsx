import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

const SET_CURRENT_REQUEST_PARAMS = {
  skipFocus: true
}

const ActionsPagination = () => {
  const {
    state: { currentUserRequest, visibleUserRequests },
    dispatch: requestsDispatch
  } = useController('RequestsController')
  const { t } = useTranslation()
  const { theme, themeType } = useTheme()
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
        isMobile ? spacings.ptLg : spacings.pt
      ]}
    >
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
        style={[spacings.mlTy, isFirstRequest && { opacity: 0.4 }]}
        disabled={isFirstRequest}
        onPress={handleSmallPageStepDecrement}
      >
        <LeftArrowIcon />
      </HoverablePressable>
      <Text
        fontSize={14}
        color={themeType === THEME_TYPES.DARK ? theme.linkText : theme.primary}
        underline
        style={[text.center, spacings.mh]}
      >
        {requestLabel}
      </Text>
      <HoverablePressable
        style={[spacings.mrTy, isLastRequest && { opacity: 0.4 }]}
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
  )
}

export default React.memo(ActionsPagination)
