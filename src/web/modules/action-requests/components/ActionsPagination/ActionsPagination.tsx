import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'

const ActionsPagination = () => {
  const state = useActionsControllerState()
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()

  const currentActionIndex = useMemo(() => {
    if (!state.currentAction) return undefined

    const idx = state.visibleActionsQueue.findIndex((a) => a.id === state.currentAction.id)

    if (idx === -1) return undefined

    return idx
  }, [state])

  if (state?.visibleActionsQueue?.length <= 1) return null

  const handleSmallPageStepDecrement = () => {
    dispatch({
      type: 'ACTIONS_CONTROLLER_SET_CURRENT_ACTION_BY_INDEX',
      params: { index: currentActionIndex - 1 }
    })
  }

  const handleSmallPageStepIncrement = () => {
    dispatch({
      type: 'ACTIONS_CONTROLLER_SET_CURRENT_ACTION_BY_INDEX',
      params: { index: currentActionIndex + 1 }
    })
  }

  const handleLargePageStepDecrement = () => {
    dispatch({
      type: 'ACTIONS_CONTROLLER_SET_CURRENT_ACTION_BY_INDEX',
      params: { index: 0 }
    })
  }

  const handleLargePageStepIncrement = () => {
    dispatch({
      type: 'ACTIONS_CONTROLLER_SET_CURRENT_ACTION_BY_INDEX',
      params: { index: state.visibleActionsQueue.length - 1 }
    })
  }

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.flex1,
        spacings.ph,
        flexbox.justifyCenter
      ]}
    >
      <TouchableOpacity
        style={currentActionIndex === 0 && { opacity: 0.4 }}
        disabled={currentActionIndex === 0}
        onPress={handleLargePageStepDecrement}
      >
        <View style={flexbox.directionRow}>
          <LeftArrowIcon />
          <LeftArrowIcon />
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[spacings.ml, currentActionIndex === 0 && { opacity: 0.4 }]}
        disabled={currentActionIndex === 0}
        onPress={handleSmallPageStepDecrement}
      >
        <View style={flexbox.directionRow}>
          <LeftArrowIcon />
        </View>
      </TouchableOpacity>
      <Text fontSize={14} appearance="primary" underline style={[text.center, spacings.mh]}>
        {t('Request {{currentActionIndex}} out of {{numberOfAllActions}}', {
          currentActionIndex: currentActionIndex + 1,
          numberOfAllActions: state.visibleActionsQueue.length
        })}
      </Text>
      <TouchableOpacity
        style={[
          spacings.mr,
          currentActionIndex === state.visibleActionsQueue.length - 1 && { opacity: 0.4 }
        ]}
        disabled={currentActionIndex === state.visibleActionsQueue.length - 1}
        onPress={handleSmallPageStepIncrement}
      >
        <View style={flexbox.directionRow}>
          <RightArrowIcon />
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={currentActionIndex === state.visibleActionsQueue.length - 1 && { opacity: 0.4 }}
        disabled={currentActionIndex === state.visibleActionsQueue.length - 1}
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
