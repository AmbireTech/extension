import { ZeroAddress } from 'ethers'
import { nanoid } from 'nanoid'
import React, { FC, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, Linking, Pressable, View } from 'react-native'

import { getCoinGeckoTokenUrl } from '@ambire-common/consts/coingecko'
import { BlacklistedStatus } from '@ambire-common/interfaces/phishing'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import useBenzinNetworksContext from '@benzin/hooks/useBenzinNetworksContext'
// import AddressBookIcon from '@common/assets/svg/AddressBookIcon'
import CopyIcon from '@common/assets/svg/CopyIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import Text, { Props as TextProps } from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'
import { openInTab } from '@common/utils/links'
import { isExtension } from '@web/constants/browserapi'

import Option from './BaseAddressOption'

interface Props extends TextProps {
  address: string
  chainId?: bigint
  actionsMode?: 'tooltip' | 'inline'
  verification?: BlacklistedStatus
  isDisplayingPlainAddress?: boolean
}

const BaseAddress: FC<Props> = ({
  children,
  address,
  chainId,
  actionsMode = 'tooltip',
  verification,
  isDisplayingPlainAddress,
  ...rest
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const { benzinNetworks } = useBenzinNetworksContext()
  // Standalone Benzin doesn't have access to controllers
  const {
    state: { networks }
  } = useController('NetworksController')

  const actualNetworks = networks ?? benzinNetworks
  const network = actualNetworks?.find((n) => n.chainId === chainId)

  const handleCopyAddress = useCallback(async () => {
    try {
      await setStringAsync(address)
      addToast(t('Address copied to clipboard'))
    } catch {
      addToast(t('Failed to copy address'), {
        type: 'error'
      })
    }
  }, [addToast, address, t])

  const handleOpenExplorer = useCallback(async () => {
    if (!network) return

    try {
      const targetUrl =
        address === ZeroAddress
          ? // Exception for native tokens, they don't have a block explorer URLs
            getCoinGeckoTokenUrl(network.nativeAssetId)
          : `${network.explorerUrl}/address/${address}`

      // openInTab doesn't work in Standalone Benzin
      if (!isExtension) {
        await Linking.openURL(targetUrl)
        return
      }
      await openInTab({ url: targetUrl })
    } catch {
      addToast(t('Failed to open explorer'), {
        type: 'error'
      })
    }
  }, [addToast, address, network, t])

  // The uuid must be unique for each tooltip, otherwise multiple tooltips
  // will be show at the same time. We cannot use a shared tooltip as the content
  // is JSX and not a string.
  const tooltipId = useMemo(() => `address-${address}-${nanoid(6)}`, [address])
  const showInlineActions = actionsMode === 'inline'
  const displayValue =
    showInlineActions && isDisplayingPlainAddress ? shortenAddress(address, 18, 4) : children
  const textStyle = {
    flexShrink: 1,
    ...(isWeb ? { wordBreak: 'break-all' } : {})
  }
  const textWeight = isDisplayingPlainAddress ? 'mono_regular' : 'medium'
  const textAppearance = verification === 'BLACKLISTED' ? 'errorText' : 'primaryText'
  const handleInlineExplorerPress = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation()
      void handleOpenExplorer()
    },
    [handleOpenExplorer]
  )

  return (
    <View
      style={[
        flexbox.alignCenter,
        flexbox.directionRow,
        flexbox.wrap,
        isWeb && !showInlineActions && flexbox.flex1,
        showInlineActions && { maxWidth: '100%' }
      ]}
    >
      {showInlineActions && !!network?.explorerUrl ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t('View in Explorer')}
          onPress={handleInlineExplorerPress}
          style={[flexbox.directionRow, flexbox.alignCenter, flexbox.wrap, { maxWidth: '100%' }]}
        >
          {({ hovered }: any) => (
            <>
              <Text
                weight={textWeight}
                fontSize={14}
                appearance={textAppearance}
                underline={hovered}
                selectable
                style={textStyle}
                {...rest}
              >
                {displayValue}
              </Text>
              <View style={[{ marginLeft: 2, marginTop: -8 }, flexbox.center]}>
                <OpenIcon
                  color={hovered ? theme.primaryText : theme.secondaryText}
                  width={10}
                  height={10}
                />
              </View>
            </>
          )}
        </Pressable>
      ) : (
        <Text
          weight={textWeight}
          fontSize={14}
          appearance={textAppearance}
          selectable
          style={textStyle}
          {...rest}
        >
          {displayValue}
          {isWeb && !showInlineActions && (
            <Pressable style={spacings.mlMi}>
              {({ hovered }: any) => (
                <InfoIcon
                  data-tooltip-id={tooltipId}
                  color={hovered ? theme.primaryText : theme.secondaryText}
                  width={14}
                  height={14}
                />
              )}
            </Pressable>
          )}
        </Text>
      )}
      {!showInlineActions && (
        <Tooltip
          id={tooltipId}
          style={{ padding: 0, overflow: 'hidden' }}
          clickable
          noArrow
          place="bottom-end"
        >
          {network?.explorerUrl && (
            <Option
              title={t('View in Explorer')}
              renderIcon={() => <OpenIcon color={theme.secondaryText} width={14} height={14} />}
              onPress={handleOpenExplorer}
            />
          )}
          {/* @TODO: Uncomment when we have the feature
          <Option
            title={t('Add to Address Book')}
            renderIcon={() => <AddressBookIcon color={theme.secondaryText} width={18} height={18} />}
            onPress={() => {}}
          /> */}
          <Option
            title={t('Copy Address')}
            isAddress
            text={shortenAddress(address, 15)}
            renderIcon={() => <CopyIcon color={theme.secondaryText} width={16} height={16} />}
            onPress={handleCopyAddress}
          />
        </Tooltip>
      )}
    </View>
  )
}

export default BaseAddress
