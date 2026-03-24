import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import Text from '@common/components/Text'
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

  if (visibleUserRequests?.length <= 1) return null

  const handleSmallPageStepDecrement = () => {
    if (typeof currentRequestIndex !== 'number') return
    requestsDispatch({
      type: 'method',
      params: {
        method: 'setCurrentUserRequestByIndex',
        args: [currentRequestIndex - 1, SET_CURRENT_REQUEST_PARAMS]
      }
    })
  }

  const handleSmallPageStepIncrement = () => {
    if (typeof currentRequestIndex !== 'number') return
    requestsDispatch({
      type: 'method',
      params: {
        method: 'setCurrentUserRequestByIndex',
        args: [currentRequestIndex + 1, SET_CURRENT_REQUEST_PARAMS]
      }
    })
  }

  const handleLargePageStepDecrement = () => {
    requestsDispatch({
      type: 'method',
      params: {
        method: 'setCurrentUserRequestByIndex',
        args: [0, SET_CURRENT_REQUEST_PARAMS]
      }
    })
  }

  const handleLargePageStepIncrement = () => {
    requestsDispatch({
      type: 'method',
      params: {
        method: 'setCurrentUserRequestByIndex',
        args: [visibleUserRequests.length - 1, SET_CURRENT_REQUEST_PARAMS]
      }
    })
  }

  if (typeof currentRequestIndex !== 'number') return null

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.flex1,
        spacings.phSm,
        flexbox.justifyCenter
      ]}
    >
      <TouchableOpacity
        style={currentRequestIndex === 0 && { opacity: 0.4 }}
        disabled={currentRequestIndex === 0}
        onPress={handleLargePageStepDecrement}
      >
        <View style={flexbox.directionRow}>
          <LeftArrowIcon />
          <LeftArrowIcon />
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[spacings.mlTy, currentRequestIndex === 0 && { opacity: 0.4 }]}
        disabled={currentRequestIndex === 0}
        onPress={handleSmallPageStepDecrement}
      >
        <View style={flexbox.directionRow}>
          <LeftArrowIcon />
        </View>
      </TouchableOpacity>
      <Text
        fontSize={14}
        color={themeType === THEME_TYPES.DARK ? theme.linkText : theme.primary}
        underline
        style={[text.center, spacings.mh]}
      >
        {t('Request {{currentRequestIndex}} of {{numberOfAllActions}}', {
          currentRequestIndex: currentRequestIndex + 1,
          numberOfAllActions: visibleUserRequests.length
        })}
      </Text>
      <TouchableOpacity
        style={[
          spacings.mrTy,
          currentRequestIndex === visibleUserRequests.length - 1 && { opacity: 0.4 }
        ]}
        disabled={currentRequestIndex === visibleUserRequests.length - 1}
        onPress={handleSmallPageStepIncrement}
      >
        <View style={flexbox.directionRow}>
          <RightArrowIcon />
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={currentRequestIndex === visibleUserRequests.length - 1 && { opacity: 0.4 }}
        disabled={currentRequestIndex === visibleUserRequests.length - 1}
        onPress={handleLargePageStepIncrement}
      >
        <View style={flexbox.directionRow}>
          <RightArrowIcon />
          <RightArrowIcon />
        </View>
      </TouchableOpacity>
    </View>
  )
}

export default React.memo(ActionsPagination)
