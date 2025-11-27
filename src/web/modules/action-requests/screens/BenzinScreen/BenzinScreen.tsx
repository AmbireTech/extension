import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

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
import useBackgroundService from '@web/hooks/useBackgroundService'
import useRequestsControllerState from '@web/hooks/useRequestsControllerState'

const BenzinScreen = () => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const { currentUserRequest, visibleUserRequests } = useRequestsControllerState()
  const { theme } = useTheme()

  const userRequest = useMemo(
    () => (currentUserRequest?.kind === 'benzin' ? currentUserRequest : undefined),
    [currentUserRequest]
  )

  const resolveAction = useCallback(() => {
    if (!userRequest) return
    dispatch({
      type: 'REQUESTS_CONTROLLER_RESOLVE_USER_REQUEST',
      params: { data: {}, id: userRequest.id as number }
    })
  }, [userRequest, dispatch])

  const extensionAccOp = userRequest?.meta?.submittedAccountOp

  const state = useBenzin({ onOpenExplorer: resolveAction, extensionAccOp })

  const pendingRequests = useMemo(() => {
    if (!visibleUserRequests) return []

    return visibleUserRequests.filter((r) => r.kind !== 'benzin')
  }, [visibleUserRequests])

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
