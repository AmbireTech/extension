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
import useToast from '@common/hooks/useToast'
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
  const { addToast } = useToast()
  const {
    state: { tokenPreferences },
    dispatch: portfolioDispatch
  } = useController('PortfolioController')
  const { account } = useController('SelectedAccountController').state
  const { theme } = useTheme()
  const { networks } = useController('NetworksController').state
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

    portfolioDispatch({
      type: 'method',
      params: {
        method: 'toggleHideToken',
        args: [{ address, chainId }, account?.addr]
      }
    })
    onTokenPreferenceOrCustomTokenChange()
  }, [
    addToast,
    t,
    portfolioDispatch,
    address,
    chainId,
    onTokenPreferenceOrCustomTokenChange,
    account?.addr
  ])

  const removeCustomToken = useCallback(() => {
    addToast(t('Token removed'), {
      timeout: 2000
    })
    portfolioDispatch({
      type: 'method',
      params: {
        method: 'removeCustomToken',
        args: [{ address, chainId }, account?.addr]
      }
    })
    onTokenPreferenceOrCustomTokenChange()
  }, [
    addToast,
    address,
    portfolioDispatch,
    chainId,
    onTokenPreferenceOrCustomTokenChange,
    t,
    account?.addr
  ])

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
