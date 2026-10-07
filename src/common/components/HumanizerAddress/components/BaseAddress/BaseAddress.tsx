import { nanoid } from 'nanoid'
import React, { FC, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, Pressable, View } from 'react-native'

import { BlacklistedStatus } from '@ambire-common/interfaces/phishing'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import OpenIcon from '@common/assets/svg/OpenIcon'
import Text, { Props as TextProps } from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'

import { AddressActionsInfoIcon, AddressActionsTooltip } from './AddressActions'
import useAddressActions from './useAddressActions'

interface Props extends TextProps {
  address: string
  chainId?: bigint
  hideActions?: boolean
  actionsMode?: 'tooltip' | 'inline'
  shouldWrapInlineActions?: boolean
  verification?: BlacklistedStatus
  isDisplayingPlainAddress?: boolean
  isToken?: boolean
}

const BaseAddress: FC<Props> = ({
  children,
  address,
  chainId,
  hideActions = false,
  actionsMode = 'tooltip',
  shouldWrapInlineActions = true,
  verification,
  isDisplayingPlainAddress,
  isToken,
  ...rest
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { network, handleOpenExplorer } = useAddressActions({ address, chainId, isToken })

  // The uuid must be unique for each tooltip, otherwise multiple tooltips
  // will be show at the same time. We cannot use a shared tooltip as the content
  // is JSX and not a string.
  const tooltipId = useMemo(() => `address-${address}-${nanoid(6)}`, [address])
  const isInlineMode = actionsMode === 'inline'
  const showInlineActions = isInlineMode && !hideActions
  const displayValue =
    isInlineMode && isDisplayingPlainAddress ? shortenAddress(address, 18, 4) : children
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
        isWeb && !isInlineMode && flexbox.flex1,
        // Shrinks so it stays within the row when it shares it with the inline avatar
        isInlineMode && { maxWidth: '100%', flexShrink: 1, minWidth: 0 }
      ]}
    >
      {showInlineActions && !!network?.explorerUrl ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t('View in Explorer')}
          onPress={handleInlineExplorerPress}
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            shouldWrapInlineActions && flexbox.wrap,
            { maxWidth: '100%' }
          ]}
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
              {/* On mobile the icon clutters the rows and the whole value is tappable anyway */}
              {!isMobile && (
                <View style={[{ marginLeft: 2, marginTop: -8 }, flexbox.center]}>
                  <OpenIcon
                    color={hovered ? theme.primaryText : theme.secondaryText}
                    width={10}
                    height={10}
                  />
                </View>
              )}
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
          {isWeb && !isInlineMode && !hideActions && (
            <AddressActionsInfoIcon tooltipId={tooltipId} />
          )}
        </Text>
      )}
      {!isInlineMode && !hideActions && (
        <AddressActionsTooltip
          tooltipId={tooltipId}
          address={address}
          chainId={chainId}
          isToken={isToken}
        />
      )}
    </View>
  )
}

export default BaseAddress
