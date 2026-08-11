import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import {
  Action,
  Banner as BannerType,
  BannerType as NonMarketingBannerType
} from '@ambire-common/interfaces/banner'
import BatchIcon from '@common/assets/svg/BatchIcon'
import Banner from '@common/components/Banner'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useToast from '@common/hooks/useToast'
import DashboardBannerBottomSheet from '@common/modules/dashboard/components/DashboardBanners/DashboardBannerBottomSheet'
import { ROUTES } from '@common/modules/router/constants/common'
import { getRouteForUserRequest } from '@common/modules/router/helpers'
import spacings from '@common/styles/spacings'
import { getUiType } from '@common/utils/uiType'
import flexbox from '@common/styles/utils/flexbox'

import applyOtaUpdate from './applyOtaUpdate'

const { isSidePanel } = getUiType()

const DashboardBanner = ({
  banner
}: {
  banner: Omit<BannerType, 'type'> & { type: NonMarketingBannerType }
}) => {
  const { type, category, title, text, actions = [], dismissAction, meta } = banner
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { navigate } = useNavigation()
  const {
    state: { visibleUserRequests },
    dispatch: requestsDispatch
  } = useController('RequestsController')
  const transferState = useController('TransferController').state
  const {
    state: { networks },
    dispatch: networksDispatch
  } = useController('NetworksController')
  const { dispatch: selectedAccountDispatch } = useController('SelectedAccountController')
  const { dispatch: mainDispatch } = useController('MainController')
  const { dispatch: emailVaultDispatch } = useController('EmailVaultController')
  const { dispatch: extensionUpdateDispatch } = useController('ExtensionUpdateController')
  const { ref: sheetRef, close: closeBottomSheet, open: openBottomSheet } = useModalize()
  const primaryAction = actions[0]
  const isPendingAccountOp = category === 'pending-to-be-signed-acc-op'

  const Icon = useMemo(() => {
    if (category === 'pending-to-be-signed-acc-op') return BatchIcon

    return null
  }, [category])

  // the network goes on a second row so the banner stays short on every screen size
  const subtitle = useMemo(() => {
    if (!isPendingAccountOp || !meta?.chainId) return null

    const networkName = networks.find(({ chainId }) => chainId === meta.chainId)?.name
    const fontSize = isMobile ? 12 : 14

    return (
      <View style={[flexbox.directionRow, flexbox.alignCenter, { marginTop: 2 }]}>
        <Text fontSize={fontSize} appearance="secondaryText">
          {t('On')}
        </Text>
        <NetworkIcon id={meta.chainId.toString()} size={18} style={spacings.mhMi} />
        {!!networkName && (
          <Text fontSize={fontSize} appearance="secondaryText">
            {networkName}
          </Text>
        )}
      </View>
    )
  }, [isPendingAccountOp, meta, networks, t])

  const handleActionPress = useCallback(
    (action: Action) => {
      switch (action.actionName) {
        case 'open-pending-dapp-requests': {
          if (!visibleUserRequests.length) break
          const dappRequests = visibleUserRequests.filter((r) => r.kind !== 'calls')
          if (!dappRequests.length) break
          const targetRequest = dappRequests[0]!
          // Opens/focuses the request window via RequestsController when the side
          // panel is closed; when the side panel is open we also navigate in-panel.
          requestsDispatch({
            type: 'method',
            params: {
              method: 'setCurrentUserRequestById',
              args: [targetRequest.id]
            }
          })
          if (isSidePanel) {
            const targetRoute = getRouteForUserRequest({
              currentUserRequest: targetRequest,
              transferState
            })
            if (targetRoute) navigate(targetRoute)
          }
          break
        }

        case 'open-accountOp': {
          const targetRequest = visibleUserRequests.find(
            (request) => String(request.id) === String(action.meta.requestId)
          )
          requestsDispatch({
            type: 'method',
            params: {
              method: 'setCurrentUserRequestById',
              args: [action.meta.requestId]
            }
          })
          if (isSidePanel && targetRequest) {
            const targetRoute = getRouteForUserRequest({
              currentUserRequest: targetRequest,
              transferState
            })
            if (targetRoute) navigate(targetRoute)
          }
          break
        }

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
          emailVaultDispatch({
            type: 'method',
            params: {
              method: 'requestKeysSync',
              args: [action.meta.email, action.meta.keys]
            }
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

          extensionUpdateDispatch({
            type: 'method',
            params: {
              method: 'applyUpdate',
              args: []
            }
          })

          break
        }

        // Mobile-only: a Stallion OTA bundle is downloaded; restart to apply it.
        // restart() lives on the RN main thread, so it is behind a .native/.web helper.
        case 'apply-ota-update':
          applyOtaUpdate()
          break

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

        case 'dismiss-ens-expiry-banner':
          selectedAccountDispatch({
            type: 'method',
            params: { method: 'dismissEnsExpiryBannerForTheSelectedAccount', args: [] }
          })
          break

        default:
          break
      }
    },
    [
      extensionUpdateDispatch,
      networksDispatch,
      emailVaultDispatch,
      mainDispatch,
      navigate,
      addToast,
      visibleUserRequests,
      transferState,
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
        subtitle={subtitle}
        type={type}
        text={text}
        singleRow={isPendingAccountOp}
        style={isPendingAccountOp ? spacings.pbTy : undefined}
        buttonText={primaryAction?.label}
        onCloseIconPress={
          dismissAction && !dismissAction.label ? () => handleActionPress(dismissAction) : undefined
        }
        onDismissButtonPress={
          dismissAction && dismissAction.label ? () => handleActionPress(dismissAction) : undefined
        }
        dismissButtonText={dismissAction?.label}
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
