import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { BenzinAction } from '@ambire-common/interfaces/actions'
import Benzin from '@benzin/screens/BenzinScreen/components/Benzin/Benzin'
import Buttons from '@benzin/screens/BenzinScreen/components/Buttons'
import useBenzin from '@benzin/screens/BenzinScreen/hooks/useBenzin'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import Button from '@common/components/Button'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
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
  const { maxWidthSize } = useWindowSize()
  const resolveAction = useCallback(() => {
    if (!actionsState.currentAction) return
    dispatch({
      type: 'REQUESTS_CONTROLLER_RESOLVE_USER_REQUEST',
      params: {
        data: {},
        id: actionsState.currentAction.id as number
      }
    })
  }, [actionsState.currentAction, dispatch])

  const extensionAccOp = (actionsState.currentAction as BenzinAction)?.userRequest?.meta
    ?.submittedAccountOp

  const state = useBenzin({
    onOpenExplorer: resolveAction,
    extensionAccOp
  })

  const pendingRequests = useMemo(() => {
    if (!actionsState.visibleActionsQueue) return []

    return actionsState.visibleActionsQueue.filter((a) => a.type !== 'benzin')
  }, [actionsState.visibleActionsQueue])

  return (
    <TabLayoutContainer
      width="full"
      withHorizontalPadding={false}
      footer={
        <>
          <Button
            type="secondary"
            onPress={resolveAction}
            style={{ minWidth: maxWidthSize('m') ? 180 : 140 }}
            hasBottomSpacing={false}
            text={pendingRequests.length ? t('Proceed to Next Request') : t('Close')}
          >
            {!!pendingRequests.length && (
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
