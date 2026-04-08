import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

import DiagonalRightArrowIcon from '@common/assets/svg/DiagonalRightArrowIcon/DiagonalRightArrowIcon'
import AccountAddress from '@common/components/AccountAddress'
import Alert from '@common/components/Alert'
import Avatar from '@common/components/Avatar/Avatar'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import LayoutWrapper from '@common/components/LayoutWrapper'
import NetworkIcon from '@common/components/NetworkIcon'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import { HeaderWithTitle } from '@common/modules/header/components/Header/Header'
import useReceive from '@common/modules/receive/hooks/useReceive'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

const ReceiveScreen: FC = () => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  const {
    account,
    isViewOnly,
    label,
    pfp,
    isEOA,
    name,
    type,
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
    <LayoutWrapper>
      <HeaderWithTitle />

      <ScrollableWrapper showsVerticalScrollIndicator={false}>
        <View style={[isEOA ? spacings.pt3Xl : spacings.ptLg, spacings.mb, flexbox.alignCenter]}>
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
                size={140}
                quietZone={10}
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
        <View style={spacings.phSm}>
          <View style={[styles.accountAddressWrapper]}>
            <View
              style={[
                flexbox.directionRow,
                flexbox.center,
                { flexShrink: 1, minWidth: 0, maxWidth: '100%' }
              ]}
            >
              <AccountAddress
                isLoading={isDomainResolving}
                name={name}
                type={type}
                address={account?.addr || ''}
                plainAddressMaxLength={42}
                fontSize={14}
              />
            </View>
          </View>
          {isViewOnly ? (
            <View
              style={[
                spacings.mbSm,
                {
                  maxWidth: 400,
                  marginHorizontal: 'auto'
                }
              ]}
            >
              <Alert size="sm" type="warning" title={t('The account is view-only.')} />
            </View>
          ) : (
            <View style={spacings.mb2Xl} />
          )}
        </View>

        {!isEOA && (
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

            {hasMoreNetworks && (
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
        )}
      </ScrollableWrapper>
    </LayoutWrapper>
  )
}

export default React.memo(ReceiveScreen)
