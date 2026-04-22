import React from 'react'
import { Control } from 'react-hook-form'
import { Pressable, View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Dapp } from '@ambire-common/interfaces/dapp'
import HomeIcon from '@common/assets/svg/HomeIcon'
import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import RefreshIcon from '@common/assets/svg/RefreshIcon'
import Avatar from '@common/components/Avatar'
import NetworkIcon from '@common/components/NetworkIcon'
import Search from '@common/components/Search'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import NotConnected from '@common/modules/dapp-catalog/components/DappIcon/NotConnected'
import ManageApp from '@common/modules/dapp-catalog/components/ManageApp'
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
}

const DappWebViewFooter: React.FC<Props> = ({
  headerControl,
  handleOpenSearchModal,
  handleGoBack,
  canGoBack,
  handleRefresh,
  account,
  currentDapp,
  smartAccountType
}) => {
  const { theme } = useTheme()
  const { navigate } = useNavigation()

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        spacings.phSm,
        spacings.ptSm,
        spacings.pbTy
      ]}
    >
      <Pressable
        onPress={() => navigate(ROUTES.apps)}
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
        <HomeIcon />
      </Pressable>
      <View
        style={[
          flexbox.flex1,
          flexbox.directionRow,
          flexbox.alignCenter,
          spacings.mhSm,
          { backgroundColor: theme.secondaryBackground, borderRadius: BORDER_RADIUS_PRIMARY }
        ]}
      >
        <View style={flexbox.flex1}>
          <Search
            control={headerControl as any}
            hasLeftIcon={false}
            inputWrapperStyle={{ backgroundColor: 'transparent' }}
            nativeInputStyle={{ textAlign: 'center' }}
            withClearButton={false}
            onFocus={handleOpenSearchModal}
            leftIcon={() => (
              <View style={{ width: 40 }}>
                <Pressable onPress={handleGoBack} disabled={!canGoBack}>
                  <LeftArrowIcon
                    width={9}
                    height={16}
                    color={canGoBack ? theme.iconPrimary : theme.neutral400}
                  />
                </Pressable>
              </View>
            )}
            childrenBeforeButtons={
              <View style={[spacings.mrTy, flexbox.alignEnd, { width: 44 }]}>
                <Pressable onPress={handleRefresh}>
                  <RefreshIcon width={30} height={30} color={theme.iconPrimary} />
                </Pressable>
              </View>
            }
          />
        </View>
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
                {!currentDapp.isConnected && (
                  <NotConnected
                    width={12}
                    height={12}
                    isBlacklisted={currentDapp.blacklisted === 'BLACKLISTED'}
                  />
                )}
              </View>

              {currentDapp.isConnected && (
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
            <ManageApp dapp={currentDapp} withCurrentAccount>
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
