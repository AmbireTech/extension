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
import FooterGlassView from '@common/components/FooterGlassView'
import useController from '@common/hooks/useController'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const BenzinScreen = () => {
  const { t } = useTranslation()
  const { isCompactSidePanelLayout } = useCompactActionRequestLayout()

  const {
    state: { currentUserRequest, visibleUserRequests },
    dispatch: requestsDispatch
  } = useController('RequestsController')

  const userRequest = useMemo(
    () => (currentUserRequest?.kind === 'benzin' ? currentUserRequest : undefined),
    [currentUserRequest]
  )

  const resolveAction = useCallback(() => {
    if (!userRequest) return
    requestsDispatch({
      type: 'method',
      params: {
        method: 'resolveUserRequest',
        args: [{}, userRequest.id as number]
      }
    })
  }, [userRequest, requestsDispatch])

  const extensionAccOp = userRequest?.meta?.submittedAccountOp

  const state = useBenzin({ onOpenExplorer: resolveAction, extensionAccOp })

  const pendingRequests = useMemo(() => {
    if (!visibleUserRequests.length) return []

    return visibleUserRequests.filter((r) => r.kind !== 'benzin')
  }, [visibleUserRequests])

  return (
    <Benzin state={state}>
      <FooterGlassView
        innerContainerStyle={
          isCompactSidePanelLayout
            ? { width: '100%', flexDirection: 'column', alignItems: 'stretch', gap: SPACING_TY }
            : undefined
        }
      >
        {!!state?.handleOpenExplorer && (
          <OpenExplorerButton
            handleOpenExplorer={state.handleOpenExplorer}
            disableOpenExplorerBtn={state.disableOpenExplorerBtn}
          />
        )}
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            isCompactSidePanelLayout && { width: '100%', minWidth: 0, gap: SPACING_TY }
          ]}
        >
          {!!state?.showCopyBtn && !!state?.handleCopyText && (
            <CopyButton handleCopyText={state.handleCopyText} />
          )}
          <Button
            onPress={resolveAction}
            style={
              isCompactSidePanelLayout
                ? { flex: 1, minWidth: 0 }
                : { minWidth: 180, ...spacings.mlSm }
            }
            hasBottomSpacing={false}
            size={isCompactSidePanelLayout ? 'smaller' : 'large'}
            text={pendingRequests.length ? t('Proceed to Next Request') : t('Close')}
          >
            {!!pendingRequests.length && (
              <View style={spacings.pl}>
                <RightArrowIcon color="#fff" />
              </View>
            )}
          </Button>
        </View>
      </FooterGlassView>
    </Benzin>
  )
}

export default React.memo(BenzinScreen)
