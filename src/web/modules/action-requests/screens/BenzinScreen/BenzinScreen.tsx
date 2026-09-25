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
import useController from '@common/hooks/useController'
import useWindowSize from '@common/hooks/useWindowSize'
import PendingRequests from '@common/modules/action-requests/components/PendingRequests'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { isExtension } from '@web/constants/browserapi'

const pendingRequestsTopContent = isExtension ? (
  <PendingRequests
    style={[common.borderRadiusPrimary, spacings.mbSm, { borderTopWidth: 1, marginTop: -12 }]}
  />
) : undefined

const BenzinScreen = () => {
  const { t } = useTranslation()
  const { isNarrowWebLayout } = useCompactActionRequestLayout()
  const { maxWidthSize } = useWindowSize()

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

  return (
    <Benzin state={state} topContent={pendingRequestsTopContent}>
      <FooterGlassView
        // In a narrow view the footer is a flex sibling under the scroll view, so it stays pinned
        // to the bottom of the screen without an absolute spacer that would force a scrollbar
        absolute={!isNarrowWebLayout}
        fullWidth={isNarrowWebLayout}
        size={isNarrowWebLayout ? 'sm' : 'md'}
        style={isNarrowWebLayout ? spacings.pbSm : undefined}
        innerContainerStyle={
          isNarrowWebLayout
            ? { width: '100%', flexDirection: 'column', alignItems: 'stretch', gap: SPACING_TY }
            : undefined
        }
      >
        {isNarrowWebLayout ? (
          <>
            {primaryButton}
            <View
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                { width: '100%', minWidth: 0, gap: SPACING_TY }
              ]}
            >
              {!!state?.handleOpenExplorer && (
                <OpenExplorerButton
                  handleOpenExplorer={state.handleOpenExplorer}
                  disableOpenExplorerBtn={state.disableOpenExplorerBtn}
                />
              )}
              {!!state?.showCopyBtn && !!state?.handleCopyText && (
                <CopyButton handleCopyText={state.handleCopyText} />
              )}
            </View>
          </>
        ) : (
          <>
            {!!state?.handleOpenExplorer && (
              <OpenExplorerButton
                handleOpenExplorer={state.handleOpenExplorer}
                disableOpenExplorerBtn={state.disableOpenExplorerBtn}
              />
            )}
            <View style={[flexbox.directionRow, flexbox.alignCenter]}>
              {!!state?.showCopyBtn && !!state?.handleCopyText && (
                <CopyButton handleCopyText={state.handleCopyText} />
              )}
              {primaryButton}
            </View>
          </>
        )}
      </FooterGlassView>
    </Benzin>
  )
}

export default memo(BenzinScreen)
