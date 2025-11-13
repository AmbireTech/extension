import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { BenzinAction } from '@ambire-common/interfaces/actions'
import Benzin from '@benzin/screens/BenzinScreen/components/Benzin/Benzin'
import {
  CopyButton,
  OpenExplorerButton
} from '@benzin/screens/BenzinScreen/components/Buttons/Buttons'
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
          {!!state?.handleOpenExplorer && (
            <OpenExplorerButton handleOpenExplorer={state.handleOpenExplorer} />
          )}
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            {!!state?.showCopyBtn && !!state?.handleCopyText && (
              <CopyButton handleCopyText={state.handleCopyText} />
            )}
            <Button
              onPress={resolveAction}
              style={{ minWidth: 180, ...spacings.mlSm }}
              hasBottomSpacing={false}
              text={pendingRequests.length ? t('Proceed to Next Request') : t('Close')}
            >
              {!!pendingRequests.length && (
                <View style={spacings.pl}>
                  <RightArrowIcon color={theme.primary} />
                </View>
              )}
            </Button>
          </View>
        </>
      }
    >
      <Benzin state={state} />
    </TabLayoutContainer>
  )
}

export default React.memo(BenzinScreen)
