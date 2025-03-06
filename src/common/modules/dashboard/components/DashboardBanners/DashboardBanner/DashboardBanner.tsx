import React, { useCallback, useMemo } from 'react'
import { useModalize } from 'react-native-modalize'

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

import DashboardBannerBottomSheet from '../DashboardBannerBottomSheet'

const ERROR_ACTIONS = [
  'reject-accountOp',
  'reject-bridge',
  'dismiss-email-vault',
  'dismiss-7702-banner'
]

const DashboardBanner = ({ banner }: { banner: BannerType }) => {
  const { type, category, title, text, actions = [] } = banner
  const { dispatch } = useBackgroundService()
  const { addToast } = useToast()
  const { navigate } = useNavigation()
  const { visibleActionsQueue, actionsQueue } = useActionsControllerState()
  const { statuses } = useMainControllerState()
  const { account, portfolio } = useSelectedAccountControllerState()
  const { ref: sheetRef, close: closeBottomSheet, open: openBottomSheet } = useModalize()

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

        case 'open-external-url': {
          if (type !== 'success') break

          window.open(action.meta.url, '_blank')
          break
        }

        case 'switch-default-wallet': {
          dispatch({
            type: 'SET_IS_DEFAULT_WALLET',
            params: { isDefaultWallet: true }
          })
          addToast('Ambire is your default wallet.', { timeout: 2000 })
          break
        }

        case 'sync-keys': {
          if (type !== 'info') break
          dispatch({
            type: 'EMAIL_VAULT_CONTROLLER_REQUEST_KEYS_SYNC',
            params: { email: action.meta.email, keys: action.meta.keys }
          })
          break
        }

        case 'backup-keystore-secret':
          navigate(ROUTES.devicePasswordRecovery)
          break

        case 'open-swap-and-bridge-tab':
          navigate(ROUTES.swapAndBridge)
          break

        case 'reject-bridge':
        case 'close-bridge':
          action.meta.activeRouteIds.forEach((activeRouteId) => {
            dispatch({
              type: 'MAIN_CONTROLLER_REMOVE_ACTIVE_ROUTE',
              params: { activeRouteId }
            })
          })
          break

        case 'proceed-bridge':
          dispatch({
            type: 'SWAP_AND_BRIDGE_CONTROLLER_ACTIVE_ROUTE_BUILD_NEXT_USER_REQUEST',
            params: { activeRouteId: action.meta.activeRouteId }
          })
          break

        case 'open-first-cashback-modal': {
          if (!account) break
          dispatch({
            type: 'SELECTED_ACCOUNT_CONTROLLER_UPDATE_CASHBACK_STATUS',
            params: 'cashback-modal'
          })
          break
        }

        case 'hide-activity-banner':
          dispatch({
            type: 'ACTIVITY_CONTROLLER_HIDE_BANNER',
            params: action.meta
          })
          break

        case 'activate-7702':
          navigate(`${ROUTES.basicToSmartSettingsScreen}?accountAddr=${action.meta.accountAddr}`)
          break

        case 'confirm-temp-seed':
          navigate(ROUTES.saveImportedSeed)
          break

        case 'update-extension-version': {
          const shouldPrompt =
            actionsQueue.filter(({ type: actionType }) => actionType !== 'benzin').length > 0

          if (shouldPrompt) {
            openBottomSheet()
            break
          }

          dispatch({
            type: 'EXTENSION_UPDATE_CONTROLLER_APPLY_UPDATE'
          })

          break
        }

        case 'reload-selected-account':
          dispatch({
            type: 'MAIN_CONTROLLER_RELOAD_SELECTED_ACCOUNT'
          })
          break

        case 'dismiss-email-vault':
          dispatch({
            type: 'EMAIL_VAULT_CONTROLLER_DISMISS_BANNER'
          })
          addToast(
            'Dismissed! Password recovery can be enabled anytime in Settings. We’ll remind you in a week.',
            {
              type: 'info'
            }
          )
          break

        case 'dismiss-7702-banner':
          dispatch({
            type: 'ACCOUNT_DISABLE_7702_BANNER',
            params: action.meta
          })
          addToast('Dismissed! You can make your account smart anytime from Settings.', {
            type: 'info'
          })
          break

        default:
          break
      }
    },
    [dispatch, navigate, openBottomSheet, visibleActionsQueue, type, addToast, account]
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
            testID={`banner-button-${actionText.toLowerCase()}`}
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
    <>
      <Banner
        CustomIcon={Icon}
        title={title}
        type={type}
        text={text}
        renderButtons={renderButtons}
      />
      <DashboardBannerBottomSheet
        id={String(banner.id)}
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
      />
    </>
  )
}

export default React.memo(DashboardBanner)
