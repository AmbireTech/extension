// Keep the bottomsheet implementation
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useCallback, useMemo } from 'react'

import { Action, Banner as BannerType } from '@ambire-common/interfaces/banner'
import CartIcon from '@common/assets/svg/CartIcon'
import PendingToBeConfirmedIcon from '@common/assets/svg/PendingToBeConfirmedIcon'
import Banner, { BannerButton } from '@common/components/Banner'
import useNavigation from '@common/hooks/useNavigation'
import useToast from '@common/hooks/useToast'
import { ROUTES } from '@common/modules/router/constants/common'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

const ERROR_ACTIONS = ['reject-accountOp', 'reject-bridge', 'dismiss-email-vault']

const DashboardBanner = ({
  banner,
  setBottomSheetBanner
}: {
  banner: BannerType
  setBottomSheetBanner: (banner: BannerType) => void
}) => {
  const { type, category, title, text, actions = [] } = banner
  const { dispatch } = useBackgroundService()
  const { addToast } = useToast()
  const { navigate } = useNavigation()
  const { visibleActionsQueue } = useActionsControllerState()
  const { statuses } = useMainControllerState()
  const { portfolio } = useSelectedAccountControllerState()

  const Icon = useMemo(() => {
    if (category === 'pending-to-be-signed-acc-op') return CartIcon
    if (category === 'pending-to-be-confirmed-acc-op') return PendingToBeConfirmedIcon

    return null
  }, [category])

  const handleActionPress = useCallback(
    (action: Action) => {
      switch (action.actionName) {
        case 'open-pending-dapp-requests': {
          if (!visibleActionsQueue) break
          const dappActions = visibleActionsQueue.filter((a) => a.type !== 'accountOp')
          dispatch({
            type: 'ACTIONS_CONTROLLER_SET_CURRENT_ACTION_BY_ID',
            params: { actionId: dappActions[0].id }
          })
          break
        }

        case 'open-accountOp':
          dispatch({
            type: 'ACTIONS_CONTROLLER_SET_CURRENT_ACTION_BY_ID',
            params: action.meta
          })
          break

        case 'reject-accountOp':
          dispatch({
            type: 'MAIN_CONTROLLER_REJECT_ACCOUNT_OP',
            params: action.meta
          })
          break

        case 'open-external-url':
          if (type !== 'success') break

          window.open(action.meta.url, '_blank')
          break

        case 'switch-default-wallet':
          dispatch({
            type: 'SET_IS_DEFAULT_WALLET',
            params: { isDefaultWallet: true }
          })
          addToast('Ambire is your default wallet.', { timeout: 2000 })
          break

        case 'sync-keys':
          if (type !== 'info') break
          dispatch({
            type: 'EMAIL_VAULT_CONTROLLER_REQUEST_KEYS_SYNC',
            params: { email: action.meta.email, keys: action.meta.keys }
          })
          break

        case 'backup-keystore-secret':
          navigate(ROUTES.devicePasswordRecovery)
          break

        case 'open-swap-and-bridge-tab':
          navigate(ROUTES.swapAndBridge)
          break

        case 'reject-bridge':
        case 'close-bridge':
          dispatch({
            type: 'MAIN_CONTROLLER_REMOVE_ACTIVE_ROUTE',
            params: { activeRouteId: action.meta.activeRouteId }
          })
          break

        case 'proceed-bridge':
          dispatch({
            type: 'SWAP_AND_BRIDGE_CONTROLLER_ACTIVE_ROUTE_BUILD_NEXT_USER_REQUEST',
            params: { activeRouteId: action.meta.activeRouteId }
          })
          break

        case 'hide-activity-banner':
          dispatch({
            type: 'ACTIVITY_CONTROLLER_HIDE_BANNER',
            params: action.meta
          })
          break

        case 'confirm-temp-seed':
          navigate(ROUTES.saveImportedSeed)
          break

        case 'update-extension-version':
          dispatch({
            type: 'EXTENSION_UPDATE_CONTROLLER_APPLY_UPDATE'
          })
          break

        case 'reload-selected-account':
          dispatch({
            type: 'MAIN_CONTROLLER_RELOAD_SELECTED_ACCOUNT'
          })
          break
        case 'dismiss-email-vault':
          dispatch({
            type: 'EMAIL_VAULT_CONTROLLER_DISMISS_BANNER'
          })
          addToast('If you change your mind, you can always enable it in the settings.', {
            type: 'info'
          })
          break

        default:
          break
      }
    },
    [visibleActionsQueue, type, dispatch, addToast, navigate]
  )

  const renderButtons = useMemo(
    () =>
      actions.map((action: Action) => {
        const isReject =
          ERROR_ACTIONS.includes(action.actionName) ||
          ('meta' in action && 'isHideStyle' in action.meta && action.meta.isHideStyle)
        let actionText = action.label
        let isDisabled = false

        if (action.actionName === 'proceed-bridge') {
          if (statuses.buildSwapAndBridgeUserRequest !== 'INITIAL') {
            actionText = 'Preparing...'
            isDisabled = true
          }
        } else if (action.actionName === 'reload-selected-account' && !portfolio.isAllReady) {
          isDisabled = true
          actionText = 'Retrying...'
        }

        return (
          <BannerButton
            key={action.actionName}
            isReject={isReject}
            text={actionText}
            disabled={isDisabled}
            onPress={() => handleActionPress(action)}
          />
        )
      }),
    [actions, handleActionPress, portfolio.isAllReady, statuses.buildSwapAndBridgeUserRequest]
  )

  return (
    <Banner CustomIcon={Icon} title={title} type={type} text={text} renderButtons={renderButtons} />
  )
}

export default React.memo(DashboardBanner)
