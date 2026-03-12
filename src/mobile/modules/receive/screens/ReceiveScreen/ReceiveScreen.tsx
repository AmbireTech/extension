import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

import DiagonalRightArrowIcon from '@common/assets/svg/DiagonalRightArrowIcon/DiagonalRightArrowIcon'
import AccountAddress from '@common/components/AccountAddress'
import Alert from '@common/components/Alert'
import Avatar from '@common/components/Avatar/Avatar'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import { HeaderWithTitle } from '@common/modules/header/components/Header/Header'
import useReceive from '@common/modules/receive/hooks/useReceive'
import spacings, { SPACING_MI } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

import getStyles from './styles'

const ReceiveScreen: FC = () => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  const {
    account,
    isViewOnly,
    label,
    pfp,
    ens,
    isDomainResolving,
    qrCodeError,
    setQrCodeError,
    qrCodeRef,
    bindAnim,
    animStyle,
    hasMoreNetworks,
    alwaysVisible,
    extraNetworks,
    showAllNetworks,
    setShowAllNetworks
  } = useReceive()

  return (
    <MobileLayoutContainer header={<HeaderWithTitle />}>
      <MobileLayoutWrapperMainContent>
        <View style={[spacings.ptLg, spacings.mb, flexbox.alignCenter]}>
          <Avatar
            size={40}
            pfp={pfp}
            address={account?.addr || ''}
            smartAccountType={(account?.creation && 'Ambire') || (account?.safeCreation && 'Safe')}
            style={spacings.pr0}
          />
          <Text weight="semiBold" fontSize={14} style={spacings.mtMi}>
            {label}
          </Text>
        </View>
        <View style={styles.qrCodeContainer}>
          {!!account && !qrCodeError && (
            <View style={styles.qrCode}>
              <QRCode
                value={account.addr}
                size={160}
                quietZone={SPACING_MI}
                backgroundColor={styles.qrCode.backgroundColor as string}
                getRef={qrCodeRef}
                onError={() => setQrCodeError(t('Failed to load QR code!') as string)}
              />
            </View>
          )}
          {!!qrCodeError && (
            <Text appearance="errorText" weight="medium">
              {t('Failed to display QR code.')}
            </Text>
          )}
        </View>

        <View style={[styles.accountAddressWrapper]}>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <AccountAddress
              isLoading={isDomainResolving}
              ens={ens}
              address={account?.addr || ''}
              plainAddressMaxLength={42}
              fontSize={14}
              containerStyle={{ ...spacings.pv0 }}
            />
          </View>
        </View>
        {!!isViewOnly && (
          <View style={[flexbox.alignCenter, { maxWidth: '100%' }]}>
            <Alert
              size="sm"
              type="warning"
              title={t('The account is view-only.')}
              style={spacings.mbSm}
            />
          </View>
        )}

        <View style={flexbox.flex1} />
        <View style={styles.supportedNetworksContainer}>
          <Text
            weight="regular"
            color={theme.neutral700}
            fontSize={14}
            style={styles.supportedNetworksTitle}
          >
            {t('Following networks supported on this address:')}
          </Text>
          <View style={styles.supportedNetworks}>
            {alwaysVisible.map(({ chainId, name }: any) => (
              <View key={chainId.toString()} style={styles.supportedNetwork}>
                <NetworkIcon
                  id={chainId.toString()}
                  size={32}
                  scale={1}
                  dataSet={createGlobalTooltipDataSet({
                    id: `network-icon-${chainId.toString()}`,
                    content: name
                  })}
                />
              </View>
            ))}

            {extraNetworks.map(({ chainId, name }: any) => (
              <View
                key={chainId.toString()}
                style={[
                  styles.supportedNetwork,
                  styles.extraNetwork,
                  showAllNetworks && styles.extraNetworkVisible
                ]}
              >
                <NetworkIcon
                  id={chainId.toString()}
                  size={32}
                  scale={1}
                  dataSet={createGlobalTooltipDataSet({
                    id: `network-icon-${chainId.toString()}`,
                    content: name
                  })}
                />
              </View>
            ))}
          </View>

          {!!hasMoreNetworks && (
            <AnimatedPressable
              style={styles.seeMoreWrapper}
              onPress={() => setShowAllNetworks((prev) => !prev)}
              {...bindAnim}
            >
              <Text color={theme.neutral700} fontSize={14}>
                {showAllNetworks ? t('View less') : t('View more')}
              </Text>

              <Animated.View
                style={{
                  transform: [
                    {
                      translateX: animStyle.translateX as any
                    },
                    {
                      translateY: animStyle.translateY as any
                    }
                  ]
                }}
              >
                <DiagonalRightArrowIcon
                  color="#808EA2"
                  height={20}
                  width={20}
                  style={{
                    transform: [{ rotate: showAllNetworks ? '90deg' : '0deg' }]
                  }}
                />
              </Animated.View>
            </AnimatedPressable>
          )}
        </View>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(ReceiveScreen)
