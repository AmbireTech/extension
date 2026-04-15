import { formatUnits, getAddress } from 'ethers'
import React, { startTransition, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { CollectionResult, TokenResult } from '@ambire-common/libs/portfolio'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import Alert from '@common/components/Alert'
import Badge from '@common/components/Badge'
import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import BaseAddress from '@common/components/HumanizerAddress/components/BaseAddress'
import NetworkBadge from '@common/components/NetworkBadge'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { SelectValue } from '@common/components/Select/types'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

import { alchemyRpc } from './alchemyRpc'
import Filters from './Filters'
import {
  ApprovalItem,
  ApprovalKind,
  ApprovalScanFailure,
  ProviderCaller,
  buildRevokeCalls,
  fetchApprovalsForAccount,
  getCachedApprovalsForAccount,
  isApprovalScanningSupported,
  isUnlimitedApproval
} from './approvals'

const getAssetLookupKey = (chainId: bigint, address: string) =>
  `${chainId.toString()}:${getAddress(address).toLowerCase()}`

const APPROVAL_TYPE_LABELS: Record<ApprovalKind, string> = {
  erc20: 'ERC-20',
  'erc721-single': 'ERC-721',
  'erc721-all': 'Approval for all',
  permit2: 'Permit2'
}

const formatApprovalAmount = (approval: ApprovalItem, decimals?: number) => {
  if (!approval.amount) return null
  if (isUnlimitedApproval(approval)) return 'Unlimited'
  if (decimals === undefined) return approval.amount.toString()

  try {
    const formatted = formatUnits(approval.amount, decimals)
    const numericAmount = Number(formatted)

    if (Number.isFinite(numericAmount)) {
      return formatDecimals(numericAmount, 'amount')
    }

    return formatted
  } catch (error) {
    return approval.amount.toString()
  }
}

const getApprovalDetailText = (approval: ApprovalItem, decimals?: number) => {
  if (approval.kind === 'erc721-single') return `Token ID: ${approval.tokenId?.toString()}`
  if (approval.kind === 'erc721-all') return 'Collection-wide approval'

  const formattedAmount = formatApprovalAmount(approval, decimals)

  if (approval.kind === 'permit2') {
    const expirationText = approval.expiration
      ? ` until ${new Date(approval.expiration * 1000).toLocaleDateString()}`
      : ''

    return `Permit2 allowance: ${formattedAmount}${expirationText}`
  }

  return `Allowance: ${formattedAmount}`
}

type AssetLookup = {
  label: string
  decimals?: number
}

const ApprovalAddress = React.memo(
  ({ address, chainId }: { address: string; chainId: bigint }) => (
    <BaseAddress address={address} chainId={chainId} fontSize={13} isDisplayingPlainAddress>
      {shortenAddress(address, 16)}
    </BaseAddress>
  )
)

const ApprovalRow = React.memo(({
  approval,
  checked,
  onToggle,
  asset
}: {
  approval: ApprovalItem
  checked: boolean
  onToggle: (id: string) => void
  asset?: AssetLookup
}) => {
  const { theme } = useTheme()

  return (
    <View
      style={[
        spacings.mbTy,
        spacings.phMd,
        spacings.pvMd,
        {
          borderWidth: 1,
          borderRadius: BORDER_RADIUS_PRIMARY,
          borderColor: theme.primaryBorder,
          backgroundColor: theme.primaryBackground
        }
      ]}
    >
      <View style={[flexbox.directionRow]}>
        <Checkbox
          value={checked}
          onValueChange={() => onToggle(approval.id)}
          style={{ marginRight: 12, marginTop: 2 }}
        />
        <View style={flexbox.flex1}>
          <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
            <View style={[flexbox.flex1, { marginRight: 12 }]}>
              <Text fontSize={16} weight="medium">
                {asset?.label || shortenAddress(approval.tokenAddress, 16)}
              </Text>
              <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mtMi]}>
                <Badge
                  text={APPROVAL_TYPE_LABELS[approval.kind]}
                  type={approval.kind === 'permit2' ? 'warning' : 'default'}
                  style={spacings.mrTy}
                />
                <Text fontSize={13} appearance="secondaryText">
                  {getApprovalDetailText(approval, asset?.decimals)}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <NetworkBadge chainId={approval.chainId} fontSize={13} style={{ height: 32 }} />
              <Text fontSize={12} appearance="secondaryText" style={spacings.mtMi}>
                {`Block ${approval.updatedAtBlock}`}
              </Text>
            </View>
          </View>

          <Text fontSize={12} appearance="secondaryText" style={spacings.mtTy}>
            Contract
          </Text>
          <ApprovalAddress address={approval.tokenAddress} chainId={approval.chainId} />

          <Text fontSize={12} appearance="secondaryText" style={spacings.mtTy}>
            Spender
          </Text>
          <ApprovalAddress address={approval.spender} chainId={approval.chainId} />
        </View>
      </View>
    </View>
  )
})

const ApprovalsSettingsScreen = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)
  const { control, watch } = useForm({ mode: 'all', defaultValues: { search: '' } })
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const {
    state: { networks }
  } = useController('NetworksController')
  const {
    state: { account, portfolio }
  } = useController('SelectedAccountController')

  const [networkFilter, setNetworkFilter] = useState('all')
  const [approvals, setApprovals] = useState<ApprovalItem[]>([])
  const [failures, setFailures] = useState<ApprovalScanFailure[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isQueueing, setIsQueueing] = useState(false)
  const refreshSequenceRef = useRef(0)
  const refreshApprovalsRef = useRef<() => Promise<void>>(async () => {})
  const discoveredApprovalsBufferRef = useRef<ApprovalItem[]>([])
  const approvalsFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const search = watch('search')

  useEffect(() => {
    setCurrentSettingsPage('approvals')
  }, [setCurrentSettingsPage])

  const callProvider = useCallback(
    async ({ chainId, method, args }: Parameters<ProviderCaller>[0]) => {
      switch (method) {
        case 'getBlockNumber':
          return alchemyRpc.getBlockNumber(chainId)
        case 'getBlock':
          return alchemyRpc.getBlock(chainId, args[0] as number)
        case 'getLogs':
          return alchemyRpc.getLogs(chainId, args[0] as Record<string, any>)
        case 'getTransactionCount':
          return alchemyRpc.getTransactionCount(chainId, args[0] as string)
        case 'call':
          return alchemyRpc.call(chainId, args[0] as Record<string, any>)
        default:
          throw new Error(`Unsupported approvals provider method: ${method}`)
      }
    },
    []
  ) as ProviderCaller

  const assetLookup = useMemo(() => {
    const entries = new Map<string, AssetLookup>()
    const portfolioTokens = (portfolio?.tokens || []) as TokenResult[]
    const portfolioCollections = (portfolio?.collections || []) as CollectionResult[]

    portfolioTokens.forEach((token) => {
      entries.set(getAssetLookupKey(token.chainId, token.address), {
        label: token.symbol || token.name || shortenAddress(token.address, 16),
        decimals: token.decimals
      })
    })

    portfolioCollections.forEach((collection) => {
      const key = getAssetLookupKey(collection.chainId, collection.address)

      if (!entries.has(key)) {
        entries.set(key, {
          label: collection.name || shortenAddress(collection.address, 16),
          decimals: collection.decimals
        })
      }
    })

    return entries
  }, [portfolio?.collections, portfolio?.tokens])

  const networkNameLookup = useMemo(
    () => new Map(networks.map((network) => [network.chainId.toString(), network.name])),
    [networks]
  )
  const supportedNetworks = useMemo(
    () => networks.filter((network) => isApprovalScanningSupported(network.chainId)),
    [networks]
  )
  const unsupportedNetworkNames = useMemo(
    () =>
      networks
        .filter((network) => !isApprovalScanningSupported(network.chainId))
        .map((network) => network.name),
    [networks]
  )
  const networksSignature = useMemo(
    () =>
      supportedNetworks
        .map((network) => `${network.chainId.toString()}:${network.selectedRpcUrl || ''}`)
        .join('|'),
    [supportedNetworks]
  )

  useEffect(() => {
    if (networkFilter === 'all') return

    if (supportedNetworks.some((network) => network.chainId.toString() === networkFilter)) return

    setNetworkFilter('all')
  }, [networkFilter, supportedNetworks])

  const clearBufferedApprovals = useCallback(() => {
    discoveredApprovalsBufferRef.current = []

    if (!approvalsFlushTimerRef.current) return

    clearTimeout(approvalsFlushTimerRef.current)
    approvalsFlushTimerRef.current = null
  }, [])

  const flushBufferedApprovals = useCallback(() => {
    if (approvalsFlushTimerRef.current) {
      clearTimeout(approvalsFlushTimerRef.current)
      approvalsFlushTimerRef.current = null
    }

    const bufferedApprovals = discoveredApprovalsBufferRef.current

    if (!bufferedApprovals.length) return

    discoveredApprovalsBufferRef.current = []

    startTransition(() => {
      setApprovals((currentApprovals) => {
        const approvalsById = new Map(currentApprovals.map((approval) => [approval.id, approval]))

        bufferedApprovals.forEach((approval) => {
          approvalsById.set(approval.id, approval)
        })

        return Array.from(approvalsById.values())
      })
    })
  }, [])

  const refreshApprovals = useCallback(async () => {
    const refreshSequence = refreshSequenceRef.current + 1
    refreshSequenceRef.current = refreshSequence
    clearBufferedApprovals()

    if (!account) {
      if (refreshSequenceRef.current !== refreshSequence) return

      setApprovals([])
      setFailures([])
      setIsLoading(false)
      return
    }

    const cachedApprovals = getCachedApprovalsForAccount({
      accountAddr: account.addr,
      networks: supportedNetworks
    })

    startTransition(() => {
      setApprovals(cachedApprovals)
      setFailures([])
    })

    setIsLoading(true)

    try {
      const result = await fetchApprovalsForAccount({
        accountAddr: account.addr,
        networks: supportedNetworks,
        callProvider,
        onApprovalsDiscovered: (discoveredApprovals) => {
          if (refreshSequenceRef.current !== refreshSequence) return

          discoveredApprovalsBufferRef.current.push(...discoveredApprovals)

          if (approvalsFlushTimerRef.current) return

          approvalsFlushTimerRef.current = setTimeout(() => {
            if (refreshSequenceRef.current !== refreshSequence) return

            flushBufferedApprovals()
          }, 120)
        },
        onFailure: (failure) => {
          if (refreshSequenceRef.current !== refreshSequence) return

          setFailures((currentFailures) => {
            if (currentFailures.some((currentFailure) => currentFailure.chainId === failure.chainId)) {
              return currentFailures
            }

            return [...currentFailures, failure]
          })
        }
      })

      if (refreshSequenceRef.current !== refreshSequence) return

      clearBufferedApprovals()
      startTransition(() => {
        setApprovals(result.approvals)
        setFailures(result.failures)
      })
    } catch (error) {
      if (refreshSequenceRef.current !== refreshSequence) return

      clearBufferedApprovals()
      addToast(
        error instanceof Error ? error.message : t('Failed to load approvals. Please try again.'),
        { type: 'error' }
      )
    } finally {
      if (refreshSequenceRef.current !== refreshSequence) return

      setIsLoading(false)
    }
  }, [
    account,
    addToast,
    callProvider,
    clearBufferedApprovals,
    flushBufferedApprovals,
    supportedNetworks,
    t
  ])

  useEffect(() => {
    refreshApprovalsRef.current = refreshApprovals
  }, [refreshApprovals])

  useEffect(() => clearBufferedApprovals, [clearBufferedApprovals])

  useEffect(() => {
    refreshApprovalsRef.current().catch(console.error)
  }, [account?.addr, networksSignature])

  useEffect(() => {
    setSelectedIds((currentIds) =>
      currentIds.filter((id) => approvals.some((approval) => approval.id === id))
    )
  }, [approvals])

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const filteredApprovals = useMemo(() => {
    const query = (search || '').trim().toLowerCase()

    return approvals.filter((approval) => {
      const matchesNetwork =
        networkFilter === 'all' || approval.chainId.toString() === networkFilter

      if (!matchesNetwork) return false

      if (!query) return true

      const asset = assetLookup.get(getAssetLookupKey(approval.chainId, approval.tokenAddress))
      const networkName = networkNameLookup.get(approval.chainId.toString()) || ''

      const searchableText = [
        asset?.label,
        approval.tokenAddress,
        approval.spender,
        networkName,
        APPROVAL_TYPE_LABELS[approval.kind],
        approval.tokenId?.toString()
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [approvals, assetLookup, networkFilter, networkNameLookup, search])

  const selectedApprovals = useMemo(
    () => approvals.filter((approval) => selectedIdSet.has(approval.id)),
    [approvals, selectedIdSet]
  )

  const allFilteredSelected = useMemo(
    () =>
      filteredApprovals.length > 0 &&
      filteredApprovals.every((approval) => selectedIdSet.has(approval.id)),
    [filteredApprovals, selectedIdSet]
  )

  const scannedNetworksCount = useMemo(
    () => new Set(approvals.map((approval) => approval.chainId.toString())).size,
    [approvals]
  )

  const failedNetworksLabel = useMemo(
    () =>
      failures
        .map((failure) => networkNameLookup.get(failure.chainId.toString()) || failure.chainId.toString())
        .join(', '),
    [failures, networkNameLookup]
  )

  const toggleSelectedApproval = useCallback((id: string) => {
    setSelectedIds((currentIds) =>
      currentIds.includes(id) ? currentIds.filter((currentId) => currentId !== id) : [...currentIds, id]
    )
  }, [])

  const toggleSelectAllFiltered = useCallback(
    (checked: boolean) => {
      setSelectedIds((currentIds) => {
        const currentIdsSet = new Set(currentIds)

        if (checked) {
          filteredApprovals.forEach((approval) => currentIdsSet.add(approval.id))
        } else {
          filteredApprovals.forEach((approval) => currentIdsSet.delete(approval.id))
        }

        return Array.from(currentIdsSet)
      })
    },
    [filteredApprovals]
  )

  const setNetworkFilterValue = useCallback(({ value }: SelectValue) => {
    if (typeof value !== 'string') return

    setNetworkFilter(value)
  }, [])

  const handleQueueSelected = useCallback(async () => {
    if (!account || !selectedApprovals.length) return

    setIsQueueing(true)

    try {
      const groupedCalls = await buildRevokeCalls({
        approvals: selectedApprovals,
        accountAddr: account.addr,
        callProvider
      })

      groupedCalls.forEach((group, index) => {
        requestsDispatch({
          type: 'method',
          params: {
            method: 'build',
            args: [
              {
                type: 'calls',
                params: {
                  userRequestParams: {
                    calls: group.calls,
                    meta: {
                      chainId: group.chainId,
                      accountAddr: account.addr
                    }
                  },
                  executionType:
                    index === groupedCalls.length - 1 ? 'queue-but-open-request-window' : 'queue'
                }
              }
            ]
          }
        })
      })

      setSelectedIds([])
      addToast(
        t('Queued {{count}} revoke calls across {{networks}} networks.', {
          count: selectedApprovals.length,
          networks: groupedCalls.length
        })
      )
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : t('Failed to queue the selected revokes.'),
        { type: 'error' }
      )
    } finally {
      setIsQueueing(false)
    }
  }, [account, addToast, callProvider, requestsDispatch, selectedApprovals, t])

  if (!account) {
    return (
      <>
        <SettingsPageHeader title="Approvals" />
        <Alert
          type="info"
          text={t('Select an account first to scan its token and NFT approvals.')}
        />
      </>
    )
  }

  return (
    <View style={flexbox.flex1}>
      <SettingsPageHeader title="Approvals">
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <Button
            type="secondary"
            text={isLoading ? t('Refreshing...') : t('Refresh')}
            disabled={isLoading || isQueueing}
            onPress={() => {
              refreshApprovals().catch(console.error)
            }}
            style={{ height: 48, ...spacings.mb0, ...spacings.mrTy }}
          />
          <Button
            text={
              selectedApprovals.length
                ? t('Queue revokes ({{count}})', { count: selectedApprovals.length })
                : t('Queue revokes')
            }
            disabled={!selectedApprovals.length || isQueueing}
            onPress={() => {
              handleQueueSelected().catch(console.error)
            }}
            style={{ height: 48, ...spacings.mb0 }}
          />
        </View>
      </SettingsPageHeader>

      <Alert
        type="info"
        style={spacings.mbMd}
        text={t(
          'Scans roughly the last 5 years of approval events on supported Alchemy unlimited-range networks, starts from the oldest block in that window, stores per-network sync progress, and then only pulls newer blocks on the next open before queueing revoke batches per chain.'
        )}
      />

      {!!unsupportedNetworkNames.length && (
        <Alert
          type="warning"
          style={spacings.mbMd}
          text={t(
            'Approvals scanning is temporarily limited to Alchemy unlimited-range networks. Skipped for now: {{networks}}.',
            {
              networks: unsupportedNetworkNames.join(', ')
            }
          )}
        />
      )}

      {!!failures.length && (
        <Alert
          type="warning"
          style={spacings.mbMd}
          text={t('Some networks could not be scanned: {{networks}}.', {
            networks: failedNetworksLabel
          })}
        />
      )}

      <Filters
        control={control}
        networkFilter={networkFilter}
        networks={supportedNetworks}
        setNetworkFilterValue={setNetworkFilterValue}
      />

      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.mbMd,
          spacings.phTy
        ]}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <Checkbox onValueChange={toggleSelectAllFiltered} value={allFilteredSelected} />
          <Text fontSize={14} appearance="secondaryText">
            {t('Select all filtered approvals')}
          </Text>
        </View>
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <Badge
            text={t('{{count}} found', { count: filteredApprovals.length })}
            type="default"
            style={spacings.mrTy}
          />
          <Badge
            text={t('{{count}} selected', { count: selectedApprovals.length })}
            type={selectedApprovals.length ? 'info' : 'default'}
            style={spacings.mrTy}
          />
          <Badge
            text={t('{{count}} networks', { count: scannedNetworksCount })}
            type="default"
          />
        </View>
      </View>

      <ScrollableWrapper style={flexbox.flex1} contentContainerStyle={{ flexGrow: 1 }}>
        {isLoading && approvals.length === 0 ? (
          <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}>
            <Spinner />
            <Text appearance="secondaryText" style={spacings.mtTy}>
              {t('Scanning approvals across your enabled networks...')}
            </Text>
          </View>
        ) : filteredApprovals.length === 0 ? (
          <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}>
            <Text fontSize={16} weight="medium" style={spacings.mbTy}>
              {t('No approvals found')}
            </Text>
            <Text fontSize={14} appearance="secondaryText">
              {search ? t('Try a different search or network filter.') : t('Your current account has no active approvals on the scanned networks.')}
            </Text>
          </View>
        ) : (
          filteredApprovals.map((approval) => (
            <ApprovalRow
              key={approval.id}
              approval={approval}
              checked={selectedIdSet.has(approval.id)}
              onToggle={toggleSelectedApproval}
              asset={assetLookup.get(getAssetLookupKey(approval.chainId, approval.tokenAddress))}
            />
          ))
        )}
      </ScrollableWrapper>
    </View>
  )
}

export default ApprovalsSettingsScreen
