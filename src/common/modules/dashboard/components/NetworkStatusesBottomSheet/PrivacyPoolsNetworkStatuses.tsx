import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'

import { PrivacyPoolsChainState } from '@ambire-common/interfaces/privacyPools'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { formatSyncDuration } from './helpers'
import NetworkStatusesHeader from './NetworkStatusesHeader'
import { Cell, NetworkStatusRowShell } from './NetworkStatusRow'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks
const selectSupportedChainIds = (state: AllControllersMappingType['PrivacyPoolsController']) =>
  state.supportedChainIds
const selectChains = (state: AllControllersMappingType['PrivacyPoolsController']) => state.chains

const NO_VALUE = '—'

const isSyncing = (chain?: PrivacyPoolsChainState) =>
  chain?.syncStatus === 'syncing' || chain?.syncStatus === 'initializing'

/**
 * A Privacy Pools account's statuses table: each network's last read, whether its first read is
 * done, and how long the first and latest reads took.
 */
const PrivacyPoolsNetworkStatuses = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { state: networks } = useController('NetworksController', selectNetworks)
  const { state: supportedChainIds } = useController(
    'PrivacyPoolsController',
    selectSupportedChainIds
  )
  const { state: chains } = useController('PrivacyPoolsController', selectChains)

  const columns = useMemo(
    () => [
      { label: t('Initial sync'), flex: 1 },
      { label: t('Initial sync time'), flex: 1 },
      { label: t('Last sync time'), flex: 1 }
    ],
    [t]
  )

  const rows = useMemo(
    () =>
      (supportedChainIds || []).map((chainId) => ({
        chainId,
        name: networks.find((network) => network.chainId.toString() === chainId)?.name || chainId,
        chain: chains?.[chainId]
      })),
    [chains, networks, supportedChainIds]
  )

  const getInitialSyncCell = (chain?: PrivacyPoolsChainState) => {
    if (chain?.isInitialSyncDone)
      return {
        label: t('Done'),
        backgroundColor: theme.successBackground,
        color: theme.successText
      }
    if (chain?.isInitialSyncDone === false && isSyncing(chain))
      return {
        label: t('In progress'),
        backgroundColor: theme.infoBackground,
        color: theme.infoText
      }
    if (chain?.isInitialSyncDone === false)
      return { label: t('Not yet'), backgroundColor: 'transparent', color: theme.secondaryText }

    return { label: NO_VALUE, backgroundColor: 'transparent', color: theme.secondaryText }
  }

  const getLastSyncCell = (chain?: PrivacyPoolsChainState) => {
    if (chain?.error)
      return { label: t('Failed'), backgroundColor: theme.errorBackground, color: theme.errorText }

    return {
      label: chain?.lastSyncDuration ? formatSyncDuration(chain.lastSyncDuration) : NO_VALUE,
      backgroundColor: 'transparent',
      color: theme.secondaryText
    }
  }

  return (
    <>
      <NetworkStatusesHeader networkLabel={t('Network')} columns={columns} />
      <ScrollView style={flexbox.flex1} contentContainerStyle={spacings.ptTy}>
        {rows.map(({ chainId, name, chain }) => (
          <NetworkStatusRowShell
            key={chainId}
            networkKey={chainId}
            name={name}
            lastUpdatedAt={chain?.lastSyncedAt ?? undefined}
            isLoading={isSyncing(chain)}
            theme={theme}
          >
            <Cell {...getInitialSyncCell(chain)} />
            <Cell
              label={
                chain?.initialSyncDuration
                  ? formatSyncDuration(chain.initialSyncDuration)
                  : NO_VALUE
              }
              backgroundColor="transparent"
              color={theme.secondaryText}
            />
            <Cell {...getLastSyncCell(chain)} />
          </NetworkStatusRowShell>
        ))}
      </ScrollView>
    </>
  )
}

export default memo(PrivacyPoolsNetworkStatuses)
