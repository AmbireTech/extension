import React, { useCallback } from 'react'
import { Control, useWatch } from 'react-hook-form'
import { Pressable, View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Dapp } from '@ambire-common/interfaces/dapp'
import HomeIcon from '@common/assets/svg/HomeIcon'
import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import RefreshIcon from '@common/assets/svg/RefreshIcon'
import Avatar from '@common/components/Avatar'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import NotConnected from '@common/modules/explore/components/DappIcon/NotConnected'
import ManageApp from '@common/modules/explore/components/ManageApp'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  headerControl: Control<any>
  handleOpenSearchModal: () => void
  handleGoBack: () => void
  canGoBack: boolean
  handleRefresh: () => void
  account: Account | null
  currentDapp: Dapp | null | undefined
  smartAccountType?: 'Ambire' | 'Safe'
  onManageAppClosed?: () => void
  showBackButton?: boolean
}

const DappWebViewFooter: React.FC<Props> = ({
  headerControl,
  handleOpenSearchModal,
  handleGoBack,
  canGoBack,
  handleRefresh,
  account,
  currentDapp,
  smartAccountType,
  onManageAppClosed,
  showBackButton
}) => {
  const { theme } = useTheme()
  const { navigate, goBack, canGoBack: canGoBackInHistory } = useNavigation()
  const route = useRoute()

  const url = useWatch({ control: headerControl, name: 'search' })

  // The footer belongs to the in-app browser, so "connected" must mean connected via the
  // injected channel specifically - not `isConnected`, which is true for any source (e.g. a
  // dapp connected only through WalletConnect should still show as not connected here).
  const isConnectedViaInjected = !!currentDapp?.connectedSources?.includes('injected')

  const handleNavigateToApps = useCallback(() => {
    // If we navigated here straight from the apps catalog (the typical flow),
    // pop the webview off the stack instead of pushing a new apps entry.
    // Otherwise, replace the webview entry with apps so it never lingers in
    // history and blocks the back gesture from leaving the apps section.
    const prevPath = (route.state as any)?.prevRoute?.pathname
    if (canGoBackInHistory && prevPath === `/${ROUTES.explore}`) {
      goBack()
    } else {
      navigate(ROUTES.explore, { replace: true })
    }
  }, [canGoBackInHistory, goBack, navigate, route.state])

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.phSm, spacings.ptSm]}>
      <Pressable
        onPress={showBackButton ? goBack : handleNavigateToApps}
        style={[
          flexbox.alignCenter,
          flexbox.justifyCenter,
          {
            backgroundColor: theme.secondaryBackground,
            borderRadius: 50,
            width: 40,
            height: 40
          }
        ]}
      >
        {showBackButton ? (
          <LeftArrowIcon width={9} height={16} />
        ) : (
          <HomeIcon width={18} height={18} />
        )}
      </Pressable>
      <View
        style={[
          flexbox.flex1,
          flexbox.directionRow,
          flexbox.alignCenter,
          spacings.mhSm,
          spacings.phTy,
          {
            backgroundColor: theme.secondaryBackground,
            borderRadius: BORDER_RADIUS_PRIMARY,
            height: 40
          }
        ]}
      >
        <Pressable
          onPress={handleGoBack}
          disabled={!canGoBack}
          style={[{ width: 28, opacity: canGoBack ? 1 : 0.4 }, flexbox.center]}
        >
          <LeftArrowIcon width={9} height={16} />
        </Pressable>
        <Pressable
          onPress={handleOpenSearchModal}
          style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter, spacings.phMi]}
          hitSlop={{ top: 10, bottom: 10 }}
        >
          <Text fontSize={14} numberOfLines={1} appearance="secondaryText">
            {url}
          </Text>
        </Pressable>
        <Pressable onPress={handleRefresh} style={{ width: 28 }}>
          <RefreshIcon width={28} height={28} color={theme.iconPrimary} />
        </Pressable>
      </View>
      {!!account && (
        <View>
          {!!currentDapp && (
            <>
              <View
                style={{
                  minWidth: 12,
                  minHeight: 12,
                  borderRadius: 50,
                  backgroundColor:
                    currentDapp.blacklisted === 'BLACKLISTED'
                      ? theme.errorDecorative
                      : theme.successDecorative,
                  position: 'absolute',
                  top: -1,
                  right: -1,
                  zIndex: 2,
                  borderWidth: 1,
                  borderColor:
                    currentDapp.blacklisted === 'BLACKLISTED'
                      ? theme.errorBackground
                      : theme.primaryBackground
                }}
              >
                {!isConnectedViaInjected && (
                  <NotConnected
                    width={12}
                    height={12}
                    isBlacklisted={currentDapp.blacklisted === 'BLACKLISTED'}
                  />
                )}
              </View>

              {isConnectedViaInjected && currentDapp.chainId && (
                <View
                  style={{
                    position: 'absolute',
                    left: -2,
                    bottom: -2,
                    zIndex: 2
                  }}
                >
                  <NetworkIcon id={currentDapp.chainId.toString()} size={16} scale={0.8} />
                </View>
              )}
            </>
          )}
          {!!currentDapp && (
            <ManageApp dapp={currentDapp} onClosed={onManageAppClosed}>
              <Avatar
                pfp={account.preferences.pfp}
                address={account.addr}
                size={40}
                style={spacings.pr0}
                smartAccountType={smartAccountType}
              />
            </ManageApp>
          )}
        </View>
      )}
    </View>
  )
}

export default React.memo(DappWebViewFooter)
