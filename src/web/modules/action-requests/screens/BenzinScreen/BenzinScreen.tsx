import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Benzin from '@benzin/screens/BenzinScreen/components/Benzin/Benzin'
import Buttons from '@benzin/screens/BenzinScreen/components/Buttons'
import useBenzin from '@benzin/screens/BenzinScreen/hooks/useBenzin'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import Button from '@common/components/Button'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { TabLayoutContainer } from '@web/components/TabLayoutWrapper'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'

const BenzinScreen = () => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const actionsState = useActionsControllerState()
  const { theme } = useTheme()
  const resolveAction = useCallback(() => {
    if (!actionsState.currentAction) return
    dispatch({
      type: 'MAIN_CONTROLLER_RESOLVE_USER_REQUEST',
      params: {
        data: {},
        id: actionsState.currentAction.id as number
      }
    })
  }, [actionsState.currentAction, dispatch])

  const state = useBenzin({ onOpenExplorer: resolveAction })

  return (
    <TabLayoutContainer
      width="full"
      withHorizontalPadding={false}
      footer={
        <>
          <Button
            type="secondary"
            onPress={resolveAction}
            style={{ minWidth: 180 }}
            hasBottomSpacing={false}
            text={
              actionsState.visibleActionsQueue.length > 1
                ? t('Proceed to Next Request')
                : t('Close')
            }
          >
            {actionsState.visibleActionsQueue.length > 1 && (
              <View style={spacings.pl}>
                <RightArrowIcon color={theme.primary} />
              </View>
            )}
          </Button>
          {state?.handleOpenExplorer ? (
            <Buttons
              handleCopyText={state.handleCopyText}
              handleOpenExplorer={state.handleOpenExplorer}
              showCopyBtn={state.showCopyBtn}
              showOpenExplorerBtn={state.showOpenExplorerBtn}
              style={{ ...flexbox.directionRow, ...spacings.mb0 }}
            />
          ) : null}
        </>
      }
    >
      <Benzin state={state} />
    </TabLayoutContainer>
  )
}

export default React.memo(BenzinScreen)
