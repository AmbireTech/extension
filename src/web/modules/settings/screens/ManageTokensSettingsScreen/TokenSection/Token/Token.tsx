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
  networkId,
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
    ({ address: addr, networkId: nId }) =>
      addr.toLowerCase() === address.toLowerCase() && nId === networkId
  )?.isHidden

  const toggleHideToken = useCallback(async () => {
    addToast(t('Token is now visible. You can hide it again from the dashboard.'))

    dispatch({
      type: 'PORTFOLIO_CONTROLLER_TOGGLE_HIDE_TOKEN',
      params: {
        token: {
          address,
          networkId
        }
      }
    })
    onTokenPreferenceOrCustomTokenChange()
  }, [addToast, t, dispatch, address, networkId, onTokenPreferenceOrCustomTokenChange])

  const removeCustomToken = useCallback(() => {
    addToast(t('Token removed'))
    dispatch({
      type: 'PORTFOLIO_CONTROLLER_REMOVE_CUSTOM_TOKEN',
      params: {
        token: { address, networkId }
      }
    })
    onTokenPreferenceOrCustomTokenChange()
  }, [addToast, address, dispatch, networkId, onTokenPreferenceOrCustomTokenChange, t])

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
        const network = networks.find(({ id }) => id === networkId)
        if (!network) return

        await openInTab(`${network.explorerUrl}/address/${address}`, false)
      }
    },
    [address, networkId, networks, removeCustomToken]
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
          networkId={networkId}
          onGasTank={flags.onGasTank}
          containerHeight={40}
          containerWidth={40}
          width={28}
          height={28}
        />
        <Text weight="medium" selectable style={spacings.mrTy}>
          {symbol}
        </Text>
        {flags.isCustom && <Badge text="Custom" />}
      </View>
      <View style={[flexbox.directionRow, flexbox.alignCenter, { flex: 1.5 }]}>
        <NetworkIcon id={networkId} style={spacings.mrTy} />
        <Text>{networks.find(({ id }) => id === networkId)?.name || 'Unknown Network'}</Text>
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
            type="secondary"
            size="small"
            style={{ width: 80 }}
            text={t('Unhide')}
            onPress={toggleHideToken}
            hasBottomSpacing={false}
          />
        ) : (
          <Button
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
