import React, { useCallback, useMemo } from 'react'
import { useModalize } from 'react-native-modalize'

import {
  Action,
  Banner as BannerType,
  BannerType as NonMarketingBannerType
} from '@ambire-common/interfaces/banner'
import BatchIcon from '@common/assets/svg/BatchIcon'
import Banner from '@common/components/Banner'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useNavigation from '@common/hooks/useNavigation'
import useToast from '@common/hooks/useToast'
import DashboardBannerBottomSheet from '@common/modules/dashboard/components/DashboardBanners/DashboardBannerBottomSheet'
import { ROUTES } from '@common/modules/router/constants/common'

const DashboardBanner = ({
  banner
}: {
  banner: Omit<BannerType, 'type'> & { type: NonMarketingBannerType }
}) => {
  const { type, category, title, text, actions = [], dismissAction } = banner
  const { dispatch } = useControllersMiddleware()
  const { addToast } = useToast()
  const { navigate } = useNavigation()
  const {
    state: { visibleUserRequests },
    dispatch: requestsDispatch
  } = useController('RequestsController')
  const { dispatch: networksDispatch } = useController('NetworksController')
  const { dispatch: selectedAccountDispatch } = useController('SelectedAccountController')
  const { dispatch: mainDispatch } = useController('MainController')
  const { ref: sheetRef, close: closeBottomSheet, open: openBottomSheet } = useModalize()
  const primaryAction = actions[0]

  const Icon = useMemo(() => {
    if (category === 'pending-to-be-signed-acc-op') return BatchIcon

    return null
  }, [category])

  const handleActionPress = useCallback(
    (action: Action) => {
      switch (action.actionName) {
        case 'open-pending-dapp-requests': {
          if (!visibleUserRequests.length) break
          const dappRequests = visibleUserRequests.filter((r) => r.kind !== 'calls')
          if (!dappRequests.length) break
          requestsDispatch({
            type: 'method',
            params: {
              method: 'setCurrentUserRequestById',
              args: [dappRequests[0]!.id]
            }
          })
          break
        }

        case 'open-accountOp':
          requestsDispatch({
            type: 'method',
            params: {
              method: 'setCurrentUserRequestById',
              args: [action.meta.requestId]
            }
          })
          break

        case 'reject-accountOp':
          requestsDispatch({
            type: 'method',
            params: {
              method: 'rejectUserRequests',
              args: [
                action.meta.err,
                [action.meta.requestId],
                { shouldOpenNextRequest: action.meta.shouldOpenNextAction }
              ]
            }
          })
          break

        case 'open-external-url': {
          if (action.meta?.url) {
            window.open(action.meta.url, '_blank')
          } else {
            addToast('Could not open block explorer.', {
              type: 'error'
            })
          }
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

        case 'view-bridge': {
          openBottomSheet()
          break
        }

        case 'open-swap-and-bridge-tab':
          navigate(ROUTES.swapAndBridge)
          break

        case 'reject-bridge':
        case 'close-bridge':
          action.meta.activeRouteIds.forEach((activeRouteId) => {
            mainDispatch({
              type: 'method',
              params: {
                method: 'removeActiveRoute',
                args: [activeRouteId]
              }
            })
          })
          break

        case 'proceed-bridge':
          requestsDispatch({
            type: 'method',
            params: {
              method: 'build',
              args: [
                {
                  type: 'swapAndBridgeRequest',
                  params: { openActionWindow: true, activeRouteId: action.meta.activeRouteId }
                }
              ]
            }
          })
          break

        case 'update-extension-version': {
          const shouldPrompt =
            visibleUserRequests.filter(({ kind }) => kind !== 'benzin').length > 0

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
          mainDispatch({
            type: 'method',
            params: {
              method: 'reloadSelectedAccount',
              args: [
                {
                  isManualReload: true
                }
              ]
            }
          })

          break

        case 'dismiss-email-vault':
          dispatch({
            type: 'EMAIL_VAULT_CONTROLLER_DISMISS_BANNER'
          })
          addToast(
            'Password recovery can be enabled anytime in Settings. We’ll remind you in a week.',
            {
              type: 'info'
            }
          )
          break

        case 'enable-networks':
          networksDispatch({
            type: 'method',
            params: {
              method: 'updateNetworks',
              args: [{ disabled: false }, action.meta.networkChainIds]
            }
          })
          break

        case 'dismiss-defi-positions-banner':
          selectedAccountDispatch({
            type: 'method',
            params: { method: 'dismissDefiPositionsBannerForTheSelectedAccount', args: [] }
          })
          break

        default:
          break
      }
    },
    [
      dispatch,
      networksDispatch,
      navigate,
      addToast,
      visibleUserRequests,
      type,
      openBottomSheet,
      selectedAccountDispatch,
      requestsDispatch
    ]
  )

  return (
    <>
      <Banner
        CustomIcon={Icon}
        title={title}
        type={type}
        text={text}
        onClosePress={dismissAction ? () => handleActionPress(dismissAction) : undefined}
        onPress={primaryAction ? () => handleActionPress(primaryAction) : undefined}
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
