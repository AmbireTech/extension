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
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@web/extension-services/background/webapi/tab'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'

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
  const { addToast } = useToast()
  const { tokenPreferences } = usePortfolioControllerState()
  const { theme } = useTheme()
  const { dispatch } = useBackgroundService()
  const { networks } = useNetworksControllerState()
  // flags.isHidden is updated after the portfolio is updated
  // so we use tokenPreferences to get the value faster
  const isHidden = !!tokenPreferences?.find(
    ({ address: addr, chainId: nChainId }) =>
      addr.toLowerCase() === address.toLowerCase() && nChainId === chainId
  )?.isHidden

  const toggleHideToken = useCallback(async () => {
    addToast(t('Token is now visible. You can hide it again from the dashboard.'), {
      timeout: 2000
    })

    dispatch({
      type: 'PORTFOLIO_CONTROLLER_TOGGLE_HIDE_TOKEN',
      params: { token: { address, chainId } }
    })
    onTokenPreferenceOrCustomTokenChange()
  }, [addToast, t, dispatch, address, chainId, onTokenPreferenceOrCustomTokenChange])

  const removeCustomToken = useCallback(() => {
    addToast(t('Token removed'), {
      timeout: 2000
    })
    dispatch({
      type: 'PORTFOLIO_CONTROLLER_REMOVE_CUSTOM_TOKEN',
      params: { token: { address, chainId } }
    })
    onTokenPreferenceOrCustomTokenChange()
  }, [addToast, address, dispatch, chainId, onTokenPreferenceOrCustomTokenChange, t])

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

        await openInTab({ url: `${network.explorerUrl}/address/${address}` })
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
          containerHeight={40}
          containerWidth={40}
          width={28}
          height={28}
        />
        <Text testID="hidden-token-name" weight="medium" selectable style={spacings.mrTy}>
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
