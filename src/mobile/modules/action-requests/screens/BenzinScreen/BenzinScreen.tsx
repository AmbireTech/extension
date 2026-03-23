import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import Benzin from '@benzin/screens/BenzinScreen/components/Benzin/Benzin'
import {
  CopyButton,
  OpenExplorerButton
} from '@benzin/screens/BenzinScreen/components/Buttons/Buttons'
import useBenzin from '@benzin/screens/BenzinScreen/hooks/useBenzin'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import Button from '@common/components/Button'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

const BenzinScreen = () => {
  const { t } = useTranslation()
  const {
    state: { currentUserRequest, visibleUserRequests },
    dispatch: requestsDispatch
  } = useController('RequestsController')
  const { theme } = useTheme()
  const { bottom } = useSafeAreaInsets()

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
      <View
        style={[
          spacings.phSm,
          spacings.ptSm,
          {
            borderTopWidth: 1,
            borderTopColor: theme.primaryBorder,
            backgroundColor: hexToRgba(theme.primaryBackground, 0.75),
            paddingBottom: bottom
          }
        ]}
      >
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
    </Benzin>
  )
}

export default React.memo(BenzinScreen)
