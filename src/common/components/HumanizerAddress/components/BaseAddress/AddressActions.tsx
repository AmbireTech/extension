import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable } from 'react-native'

import shortenAddress from '@ambire-common/utils/shortenAddress'
// import AddressBookIcon from '@common/assets/svg/AddressBookIcon'
import CopyIcon from '@common/assets/svg/CopyIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import Tooltip from '@common/components/Tooltip'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import Option from './BaseAddressOption'
import useAddressActions from './useAddressActions'

/**
 * The info icon that opens the address actions tooltip (`AddressActionsTooltip`)
 * with the same `tooltipId` on hover.
 */
export const AddressActionsInfoIcon: FC<{ tooltipId: string }> = ({ tooltipId }) => {
  const { theme } = useTheme()

  return (
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
  )
}

interface AddressActionsTooltipProps {
  tooltipId: string
  address: string
  chainId?: bigint
  isToken?: boolean
}

/**
 * A tooltip with actions for an address - viewing it in the explorer and copying it.
 * Opened by an `AddressActionsInfoIcon` with the same `tooltipId`.
 */
export const AddressActionsTooltip: FC<AddressActionsTooltipProps> = ({
  tooltipId,
  address,
  chainId,
  isToken
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { network, handleCopyAddress, handleOpenExplorer } = useAddressActions({
    address,
    chainId,
    isToken
  })

  return (
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
  )
}
