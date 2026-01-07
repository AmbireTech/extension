import { ZeroAddress } from 'ethers'
import { nanoid } from 'nanoid'
import React, { FC, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, Pressable, View } from 'react-native'

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
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'
import { isExtension } from '@web/constants/browserapi'
import { openInTab } from '@web/extension-services/background/webapi/tab'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import { getUiType } from '@web/utils/uiType'

import Option from './BaseAddressOption'

interface Props extends TextProps {
  address: string
  chainId?: bigint
  hideLinks?: boolean
  verification?: BlacklistedStatus
}

const { isRequestWindow } = getUiType()

const BaseAddress: FC<Props> = ({
  children,
  address,
  chainId,
  hideLinks = false,
  verification,
  ...rest
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const { benzinNetworks } = useBenzinNetworksContext()
  // Standalone Benzin doesn't have access to controllers
  const { networks } = useNetworksControllerState()

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
      // Close the request-window if this address is opened in one, otherwise
      // the user will have to minimize it to see the explorer.
      await openInTab({ url: targetUrl, shouldCloseCurrentWindow: isRequestWindow })
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

  return (
    <View style={[flexbox.alignCenter, flexbox.directionRow, flexbox.flex1]}>
      <Text
        fontSize={14}
        weight="medium"
        appearance={verification === 'BLACKLISTED' ? 'errorText' : 'primaryText'}
        selectable
        {...rest}
      >
        {children}
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
      </Text>
      <Tooltip
        id={tooltipId}
        style={{ padding: 0, overflow: 'hidden' }}
        clickable
        noArrow
        place="bottom-end"
      >
        {network?.explorerUrl && !hideLinks && (
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
          text={shortenAddress(address, 15)}
          renderIcon={() => <CopyIcon color={theme.secondaryText} width={16} height={16} />}
          onPress={handleCopyAddress}
        />
      </Tooltip>
    </View>
  )
}

export default BaseAddress
