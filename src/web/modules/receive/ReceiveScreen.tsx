import React, { FC, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

import { isAmbireV1LinkedAccount, isAmbireV2Account } from '@ambire-common/libs/account/account'
import { getIsViewOnly } from '@ambire-common/utils/accounts'
import DiagonalRightArrowIcon from '@common/assets/svg/DiagonalRightArrowIcon/DiagonalRightArrowIcon'
import AccountAddress from '@common/components/AccountAddress'
import Alert from '@common/components/Alert'
import Avatar from '@common/components/Avatar/Avatar'
import DomainBadge from '@common/components/Avatar/DomainBadge'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import LayoutWrapper from '@common/components/LayoutWrapper'
import NetworkIcon from '@common/components/NetworkIcon'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useMultiHover } from '@common/hooks/useHover'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import { HeaderWithTitle } from '@common/modules/header/components/Header/Header'
import spacings from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

const ReceiveScreen: FC = () => {
  const { state } = useRoute()
  const { address } = state || {}
  const accountStateCheckedForRef = React.useRef<string | null>(null)

  const {
    state: { account: stateAccount }
  } = useController('SelectedAccountController')

  const {
    state: { accounts, accountStates },
    dispatch: accountsDispatch
  } = useController('AccountsController')

  const account = useMemo(() => {
    if (address) {
      const foundAcc = accounts.find((acc) => acc.addr === address)
      if (foundAcc) return foundAcc
    }

    return stateAccount
  }, [accounts, address, stateAccount])

  const { isLoading: isDomainResolving, ens } = useReverseLookup({
    address: account?.addr || ''
  })
  const { networks } = useController('NetworksController').state
  const { keys } = useController('KeystoreController').state
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const qrCodeRef: any = useRef(null)
  const [qrCodeError, setQrCodeError] = useState<string | boolean | null>(null)

  useEffect(() => {
    // fetch the account state for this account if not fetched
    const checkedForThisAcc = accountStateCheckedForRef.current === account?.addr
    if (checkedForThisAcc || !account || !account.safeCreation || !!accountStates[account.addr])
      return

    accountStateCheckedForRef.current = account.addr

    accountsDispatch({
      type: 'method',
      params: {
        method: 'updateAccountState',
        args: [account.addr, 'latest']
      }
    })
  }, [account, accountStates, accountsDispatch])

  const isViewOnly = useMemo(() => {
    return !account?.safeCreation && getIsViewOnly(keys, account?.associatedKeys || [])
  }, [account, keys])

  const { label, pfp } = account?.preferences || { label: '', pfp: '' }

  const MAX_VISIBLE_NETWORKS = 10
  const [showAllNetworks, setShowAllNetworks] = useState(false)

  // Consider moving this to some controller or helper since we may
  // need it to warn the user about unsupported networks in other places
  // (e.g., when trying to send to an account that doesn't support a particular network)
  const supportedNetworks = useMemo(() => {
    if (!account) return []

    // NOT a [Gnosis] Safe account
    if (!account.safeCreation) {
      // EOA
      if (!account?.creation) return networks

      // v1 SA
      if (isAmbireV1LinkedAccount(account.creation.factoryAddr)) {
        // v1s don't work without the relayer
        return networks.filter((network) => !!network.hasRelayer)
      }

      // v2 SA
      return networks.filter(
        (network) => network.areContractsDeployed && (network.hasRelayer || network.erc4337.enabled)
      )
    }
    if (!accountStates[account.addr]) return []

    return networks.filter((n) => {
      const networkAccState = accountStates[account.addr]?.[n.chainId.toString()]
      if (!networkAccState) return true
      return networkAccState.isDeployed
    })
  }, [account, accountStates, networks])

  const [bindAnim, animStyle] = useMultiHover({
    values: [
      {
        property: 'backgroundColor',
        from: hexToRgba(theme.secondaryBackground, 0),
        to: theme.secondaryBackground
      },
      {
        property: 'translateX',
        from: 0,
        to: showAllNetworks ? -2 : 2
      },
      {
        property: 'translateY',
        from: 0,
        to: 2
      }
    ]
  })

  const hasMoreNetworks = useMemo(() => {
    return supportedNetworks.length > MAX_VISIBLE_NETWORKS
  }, [supportedNetworks.length])

  const alwaysVisible = useMemo(() => {
    return supportedNetworks.slice(0, MAX_VISIBLE_NETWORKS)
  }, [supportedNetworks])

  const extraNetworks = useMemo(() => {
    return supportedNetworks.slice(MAX_VISIBLE_NETWORKS)
  }, [supportedNetworks])

  return (
    <LayoutWrapper>
      <HeaderWithTitle />

      <ScrollableWrapper showsVerticalScrollIndicator={false}>
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
        <View style={[styles.accountAddressWrapper]}>
          <View style={[flexbox.directionRow, flexbox.center]}>
            <DomainBadge ens={ens} />
            <AccountAddress
              isLoading={isDomainResolving}
              ens={ens}
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
      </ScrollableWrapper>
    </LayoutWrapper>
  )
}

export default React.memo(ReceiveScreen)
