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

const ERROR_ACTIONS = ['reject-accountOp', 'reject-bridge']

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

  const Icon = useMemo(() => {
    if (category === 'pending-to-be-signed-acc-op') return CartIcon
    if (category === 'pending-to-be-confirmed-acc-op') return PendingToBeConfirmedIcon

    return null
  }, [category])

  const handleActionPress = useCallback(
    (action: Action) => {
      if (action.actionName === 'open-pending-dapp-requests') {
        if (!visibleActionsQueue) return
        const dappActions = visibleActionsQueue.filter((a) => a.type !== 'accountOp')
        dispatch({
          type: 'ACTIONS_CONTROLLER_SET_CURRENT_ACTION_BY_ID',
          params: { actionId: dappActions[0].id }
        })
      }
      if (action.actionName === 'open-accountOp') {
        dispatch({
          type: 'ACTIONS_CONTROLLER_SET_CURRENT_ACTION_BY_ID',
          params: action.meta
        })
      }

      if (action.actionName === 'reject-accountOp') {
        dispatch({
          type: 'MAIN_CONTROLLER_REJECT_ACCOUNT_OP',
          params: action.meta
        })
      }

      if (action.actionName === 'open-external-url' && type === 'success') {
        window.open(action.meta.url, '_blank')
      }

      if (action.actionName === 'switch-default-wallet') {
        dispatch({
          type: 'SET_IS_DEFAULT_WALLET',
          params: { isDefaultWallet: true }
        })
        addToast('Ambire is your default wallet.', { timeout: 2000 })
      }

      if (action.actionName === 'sync-keys' && type === 'info') {
        dispatch({
          type: 'EMAIL_VAULT_CONTROLLER_REQUEST_KEYS_SYNC',
          params: { email: action.meta.email, keys: action.meta.keys }
        })
      }

      if (action.actionName === 'backup-keystore-secret') {
        navigate(ROUTES.devicePasswordRecovery)
      }

      if (action.actionName === 'select-rpc-url') {
        setBottomSheetBanner(banner)
      }

      if (action.actionName === 'open-swap-and-bridge-tab') {
        navigate(ROUTES.swapAndBridge)
      }

      if (action.actionName === 'reject-bridge' || action.actionName === 'close-bridge') {
        dispatch({
          type: 'SWAP_AND_BRIDGE_CONTROLLER_REMOVE_ACTIVE_ROUTE',
          params: { activeRouteId: action.meta.activeRouteId }
        })
      }

      if (action.actionName === 'proceed-bridge') {
        dispatch({
          type: 'SWAP_AND_BRIDGE_CONTROLLER_ACTIVE_ROUTE_BUILD_NEXT_USER_REQUEST',
          params: { activeRouteId: action.meta.activeRouteId }
        })
      }

      if (action.actionName === 'hide-activity-banner') {
        dispatch({
          type: 'ACTIVITY_CONTROLLER_HIDE_BANNER',
          params: action.meta
        })
      }

      if (action.actionName === 'confirm-temp-seed') {
        navigate(ROUTES.saveImportedSeed)
      }
    },
    [visibleActionsQueue, type, banner, setBottomSheetBanner, dispatch, addToast, navigate]
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
    [actions, handleActionPress, statuses.buildSwapAndBridgeUserRequest]
  )

  return (
    <Banner CustomIcon={Icon} title={title} type={type} text={text} renderButtons={renderButtons} />
  )
}

export default React.memo(DashboardBanner)
