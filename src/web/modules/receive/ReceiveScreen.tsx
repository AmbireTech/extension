import React, { FC, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

import { getIsViewOnly } from '@ambire-common/utils/accounts'
import AccountAddress from '@common/components/AccountAddress'
import Alert from '@common/components/Alert'
import Avatar from '@common/components/Avatar/Avatar'
import DomainBadge from '@common/components/Avatar/DomainBadge'
import BackButton from '@common/components/BackButton'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import NetworkIcon from '@common/components/NetworkIcon'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import { TabLayoutContainer } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

import getStyles from './styles'

const ReceiveScreen: FC = () => {
  const { account } = useSelectedAccountControllerState()
  const { isLoading: isDomainResolving, ens } = useReverseLookup({ address: account?.addr || '' })
  const { networks } = useNetworksControllerState()
  const { keys } = useKeystoreControllerState()
  const { t } = useTranslation()
  const { styles, themeType, theme } = useTheme(getStyles)
  const qrCodeRef: any = useRef(null)
  const [qrCodeError, setQrCodeError] = useState<string | boolean | null>(null)
  const isViewOnly = getIsViewOnly(keys, account?.associatedKeys || [])

  const { label, pfp } = account?.preferences || { label: '', pfp: '' }

  const MAX_VISIBLE_NETWORKS = 10
  const [showAllNetworks, setShowAllNetworks] = useState(false)

  const hasMoreNetworks = networks.length > MAX_VISIBLE_NETWORKS

  const alwaysVisible = networks.slice(0, MAX_VISIBLE_NETWORKS)
  const extraNetworks = networks.slice(MAX_VISIBLE_NETWORKS)

  return (
    <TabLayoutContainer
      header={<Header withAmbireLogo />}
      footer={<BackButton />}
      hideFooterInPopup
      withHorizontalPadding={false}
      width="full"
    >
      <ScrollableWrapper>
        <View
          style={[
            flexbox.flex1,
            flexbox.center,
            spacings.pbSm,
            spacings.ph,

            {
              backgroundColor:
                themeType === THEME_TYPES.DARK ? theme.primaryBackground : theme.secondaryBackground
            }
          ]}
        >
          <View style={styles.content}>
            <View style={spacings.mtSm} />
            <View style={[spacings.mtMd, flexbox.alignCenter]}>
              <Avatar
                size={40}
                pfp={pfp}
                address={account?.addr || ''}
                isSmart={!!account?.creation}
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
                    size={156}
                    quietZone={10}
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
              <View style={[flexbox.directionRow, flexbox.center]}>
                <DomainBadge ens={ens} />
                <AccountAddress
                  isLoading={isDomainResolving}
                  ens={ens}
                  address={account?.addr || ''}
                  plainAddressMaxLength={42}
                  fontSize={16}
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
                <Alert type="warning" title={t('Selected account is view only.')} />
              </View>
            ) : (
              <View style={spacings.mb2Xl} />
            )}

            <View style={styles.supportedNetworksContainer}>
              <Text
                weight="regular"
                appearance="tertiaryText"
                fontSize={14}
                style={styles.supportedNetworksTitle}
              >
                {t('Supported networks:')}
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
                <View style={styles.seeMoreWrapper}>
                  <Text appearance="linkText" onPress={() => setShowAllNetworks((prev) => !prev)}>
                    {showAllNetworks ? t('View less') : t('View more')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollableWrapper>
    </TabLayoutContainer>
  )
}

export default React.memo(ReceiveScreen)
