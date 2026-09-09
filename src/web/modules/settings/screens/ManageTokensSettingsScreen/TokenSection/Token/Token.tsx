import React, { FC, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import Badge from '@common/components/Badge'
import Button from '@common/components/Button'
import Dropdown from '@common/components/Dropdown'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useManageToken from '@common/modules/settings/hooks/useManageToken'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'

type Props = {
  onTokenPreferenceOrCustomTokenChange: () => void
} & TokenResult

const Token: FC<Props> = ({
  address,
  chainId,
  flags,
  symbol,
  onTokenPreferenceOrCustomTokenChange
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { state: networks } = useController('NetworksController', 'networks')
  const { isHidden, toggleHideToken, removeCustomToken } = useManageToken({
    address,
    chainId,
    onTokenPreferenceOrCustomTokenChange
  })

  const dropdownOptions = useMemo(() => {
    return [
      {
        label: 'View on block explorer',
        value: 'explorer'
      }
    ]
  }, [])

  const onDropdownSelect = useCallback(
    async ({ value }: { value: string }) => {
      if (value === 'remove') {
        removeCustomToken()
        return
      }
      if (value === 'explorer') {
        const network = networks.find(({ chainId: nChainId }) => nChainId === chainId)
        if (!network) return

        await openInTab({ url: `${network.explorerUrl}/token/${address}` })
      }
    },
    [address, chainId, networks, removeCustomToken]
  )

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        common.borderRadiusPrimary,
        flexbox.flex1,
        spacings.mbTy,
        spacings.pvTy,
        {
          backgroundColor: theme.secondaryBackground
        }
      ]}
    >
      <View style={[{ flex: 1.25 }, flexbox.directionRow, flexbox.alignCenter, spacings.plSm]}>
        <TokenIcon
          withContainer
          address={address}
          chainId={chainId}
          onGasTank={flags.onGasTank}
          containerHeight={32}
          containerWidth={32}
          width={28}
          height={28}
        />
        <Text testID="hidden-token-name" weight="medium" selectable style={spacings.mlTy}>
          {symbol}
        </Text>
        {flags.isCustom && <Badge text="Custom" />}
      </View>
      <View style={[flexbox.directionRow, flexbox.alignCenter, { flex: 1.5 }]}>
        <NetworkIcon id={chainId.toString()} style={spacings.mrTy} />
        <Text testID="hidden-token-network">
          {networks.find(({ chainId: nChainId }) => nChainId === chainId)?.name ||
            'Unknown Network'}
        </Text>
      </View>
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.prSm,
          { flex: 0.4 }
        ]}
      >
        {isHidden ? (
          <Button
            testID="unhide-button"
            type="secondary"
            size="small"
            style={{ width: 80 }}
            text={t('Unhide')}
            onPress={toggleHideToken}
            hasBottomSpacing={false}
          />
        ) : (
          <Button
            testID="remove-button"
            type="secondary"
            size="small"
            style={{ width: 80 }}
            text={t('Remove')}
            onPress={removeCustomToken}
            hasBottomSpacing={false}
          />
        )}
        <Dropdown data={dropdownOptions} onSelect={onDropdownSelect} />
      </View>
    </View>
  )
}

export default Token
