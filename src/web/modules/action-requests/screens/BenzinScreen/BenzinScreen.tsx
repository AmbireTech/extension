import { memo, useCallback, useMemo } from 'react'
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
import useCompactLayout from '@common/hooks/useCompactLayout'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import PendingRequests from '@common/modules/action-requests/components/PendingRequests'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import common, { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { isExtension } from '@web/constants/browserapi'

const pendingRequestsTopContent = isExtension ? (
  <PendingRequests
    style={[common.borderRadiusPrimary, spacings.mtTy, spacings.mbSm, { borderTopWidth: 1 }]}
  />
) : undefined

const BenzinScreen = () => {
  const { t } = useTranslation()
  const { isNarrowWebLayout } = useCompactLayout()
  const { maxWidthSize } = useWindowSize()
  const { theme } = useTheme()

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

    return visibleUserRequests.filter(
      (r) =>
        r.kind !== 'benzin' &&
        (r.kind !== 'calls' || (r.signAccountOp.accountOp.signed || []).length === 0)
    )
  }, [visibleUserRequests])

  const primaryButton = (
    <Button
      onPress={resolveAction}
      style={
        isNarrowWebLayout
          ? { width: '100%' }
          : { minWidth: maxWidthSize('s') ? 180 : 120, ...spacings.mlSm }
      }
      hasBottomSpacing={false}
      size={isNarrowWebLayout ? 'regular' : 'large'}
      text={pendingRequests.length ? t('Proceed to Next Request') : t('Close')}
    >
      {!!pendingRequests.length && (
        <View style={spacings.pl}>
          <RightArrowIcon color="#fff" />
        </View>
      )}
    </Button>
  )

  // In a narrow view the footer is laid out as on mobile: the secondary actions side by side
  // above the main one. It is a flex sibling under the scroll view, so it stays at the bottom
  if (isNarrowWebLayout) {
    return (
      <Benzin state={state} topContent={pendingRequestsTopContent}>
        <View
          style={[
            spacings.phSm,
            spacings.pvSm,
            {
              rowGap: SPACING_SM,
              borderTopWidth: 1,
              borderTopColor: theme.primaryBorder,
              backgroundColor: hexToRgba(theme.primaryBackground, 0.75)
            }
          ]}
        >
          <View style={[flexbox.directionRow, flexbox.alignCenter, { columnGap: SPACING_SM }]}>
            {!!state?.showCopyBtn && !!state?.handleCopyText && (
              <View style={flexbox.flex1}>
                <CopyButton handleCopyText={state.handleCopyText} />
              </View>
            )}
            {!!state?.handleOpenExplorer && (
              <View style={flexbox.flex1}>
                <OpenExplorerButton
                  handleOpenExplorer={state.handleOpenExplorer}
                  disableOpenExplorerBtn={state.disableOpenExplorerBtn}
                />
              </View>
            )}
          </View>
          {primaryButton}
        </View>
      </Benzin>
    )
  }

  return (
    <Benzin state={state} topContent={pendingRequestsTopContent}>
      <FooterGlassView>
        {!!state?.handleOpenExplorer && (
          <OpenExplorerButton
            handleOpenExplorer={state.handleOpenExplorer}
            disableOpenExplorerBtn={state.disableOpenExplorerBtn}
          />
        )}
        {primaryButton}
      </FooterGlassView>
    </Benzin>
  )
}

export default memo(BenzinScreen)
