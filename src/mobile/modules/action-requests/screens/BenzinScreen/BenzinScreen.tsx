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
import { isMobile } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

const BenzinScreen = () => {
  const { t } = useTranslation()
  const {
    state: { currentUserRequest, visibleUserRequests },
    dispatch: requestsDispatch
  } = useController('RequestsController')
  const { themeType } = useTheme()

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
      {isMobile ? (
        <View style={[spacings.phSm, spacings.ptSm]}>
          <View style={[flexbox.directionRow, flexbox.alignCenter, { columnGap: SPACING_SM }]}>
            <View style={flexbox.flex1}>
              {!!state?.showCopyBtn && !!state?.handleCopyText && (
                <CopyButton handleCopyText={state.handleCopyText} />
              )}
            </View>
            <View style={flexbox.flex1}>
              {!!state?.handleOpenExplorer && (
                <OpenExplorerButton handleOpenExplorer={state.handleOpenExplorer} />
              )}
            </View>
          </View>
          <Button
            onPress={resolveAction}
            size="regular"
            text={pendingRequests.length ? t('Proceed to Next Request') : t('Close')}
          >
            {!!pendingRequests.length && (
              <View style={spacings.pl}>
                <RightArrowIcon color="#fff" />
              </View>
            )}
          </Button>
        </View>
      ) : (
        <FooterGlassView>
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
              size="large"
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
      )}
    </Benzin>
  )
}

export default React.memo(BenzinScreen)
